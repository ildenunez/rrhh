import { query } from '@/lib/db';
import { logAudit } from '@/lib/audit';
import { NextResponse } from 'next/server';
import { sendNotificationEmail } from '@/lib/email';

// helper: calculate days difference inclusive
function getDaysDiff(startStr, endStr) {
  const start = new Date(startStr);
  const end = new Date(endStr);
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return isNaN(diffDays) ? 0 : diffDays;
}

// Create request
export async function POST(request) {
  try {
    const { employee_id, type, amount, observation, original_record_id, absence_type_id, start_date, end_date, direct_approve, consumed_credits, creator_id, is_historical } = await request.json();

    if (!employee_id || !type) {
      return NextResponse.json({ error: "Faltan parámetros obligatorios" }, { status: 400 });
    }

    const parsedEmployeeId = parseInt(employee_id);
    const parsedAbsenceTypeId = absence_type_id ? parseInt(absence_type_id) : null;
    const parsedOriginalRecordId = original_record_id ? parseInt(original_record_id) : null;
    let parsedAmount = amount ? parseFloat(amount) : 0;

    // Fetch employee details to check role/balances
    const empResult = await query(`SELECT role, vacation_days, extra_hours, name FROM employees WHERE id = $1`, [parsedEmployeeId]);
    if (empResult.rows.length === 0) {
      return NextResponse.json({ error: "Empleado no encontrado" }, { status: 404 });
    }
    const employee = empResult.rows[0];

    // Check if direct approve is allowed (historical requests are directly approved)
    const isDirectApprove = !!direct_approve || !!is_historical;

    // 1. Process specific fields based on type
    if (type === 'absence') {
      if (!parsedAbsenceTypeId || !start_date || !end_date) {
        return NextResponse.json({ error: "Falta tipo de ausencia, fecha de inicio o fecha de fin" }, { status: 400 });
      }

      // Fetch absence type details
      const absTypeRes = await query(`SELECT * FROM absence_types WHERE id = $1`, [parsedAbsenceTypeId]);
      if (absTypeRes.rows.length === 0) {
        return NextResponse.json({ error: "Tipo de ausencia no válido" }, { status: 400 });
      }
      const absType = absTypeRes.rows[0];

      // Calculate days
      let days = absType.fixed_days ? absType.fixed_days : getDaysDiff(start_date, end_date);
      if (days <= 0) return NextResponse.json({ error: "Las fechas no son válidas" }, { status: 400 });

      // Amount is recorded as negative if it subtracts vacation days
      parsedAmount = absType.subtracts_days ? -days : days;

      if (absType.subtracts_days && employee.vacation_days - days < 0 && !is_historical) {
        return NextResponse.json({ error: `No tienes suficientes días de vacaciones. Disponibles: ${employee.vacation_days}, Solicitado: ${days}` }, { status: 400 });
      }

    } else if (type === 'hours_register') {
      if (parsedAmount <= 0) return NextResponse.json({ error: "Horas extras a registrar deben ser mayor a 0" }, { status: 400 });
      if (!start_date) return NextResponse.json({ error: "Debe indicar la fecha en la que se realizaron las horas extras" }, { status: 400 });

    } else if (type === 'hours_festive') {
      parsedAmount = 1; // representing 1 worked festive day
      if (!start_date) return NextResponse.json({ error: "Debe indicar la fecha del festivo trabajado" }, { status: 400 });

    } else if (type === 'hours_free' || type === 'hours_to_vacation' || type === 'hours_payroll') {
      // Check multi-credits parameter first
      if (Array.isArray(consumed_credits) && consumed_credits.length > 0) {
        let sum = 0;
        for (let item of consumed_credits) {
          const hours = parseFloat(item.hours);
          if (isNaN(hours) || hours <= 0) {
            return NextResponse.json({ error: "Las horas a consumir de cada registro deben ser mayores a 0" }, { status: 400 });
          }
          
          // Verify credit exists and has enough balance
          const checkRes = await query(`SELECT remaining_amount FROM time_records WHERE id = $1 AND employee_id = $2`, [item.record_id, parsedEmployeeId]);
          if (checkRes.rows.length === 0) {
            return NextResponse.json({ error: `El registro de origen #${item.record_id} no existe` }, { status: 400 });
          }
          const available = parseFloat(checkRes.rows[0].remaining_amount);
          if (hours > available && !is_historical) {
            return NextResponse.json({ error: `Las horas solicitadas del registro #${item.record_id} (${hours}h) superan el saldo del registro (${available}h)` }, { status: 400 });
          }
          sum += hours;
        }
        parsedAmount = sum;
      } else {
        // Fallback to legacy single record selector
        if (parsedAmount <= 0) return NextResponse.json({ error: "La cantidad de horas debe ser mayor a 0" }, { status: 400 });
        if (!parsedOriginalRecordId && !is_historical) {
          return NextResponse.json({ error: "Se requiere un registro de horas de origen para consumir/descontar" }, { status: 400 });
        }

        if (parsedOriginalRecordId) {
          const origRes = await query(`SELECT remaining_amount FROM time_records WHERE id = $1 AND employee_id = $2`, [parsedOriginalRecordId, parsedEmployeeId]);
          if (origRes.rows.length === 0) {
            return NextResponse.json({ error: "Registro de origen no encontrado" }, { status: 404 });
          }
          const available = parseFloat(origRes.rows[0].remaining_amount);
          if (parsedAmount > available && !is_historical) {
            return NextResponse.json({ error: `Horas solicitadas (${parsedAmount}h) superan el saldo del registro (${available}h)` }, { status: 400 });
          }
        }
      }

      if (type === 'hours_to_vacation' && parsedAmount % 8 !== 0) {
        return NextResponse.json({ error: "La cantidad de horas a pasar a vacaciones debe ser múltiplo de 8" }, { status: 400 });
      }

      // Store deduction amount as negative in requests table
      parsedAmount = -parsedAmount;
    } else {
      // Unrecognized type
      return NextResponse.json({ error: "Tipo de registro no admitido" }, { status: 400 });
    }

    // 2. Insert request (includes consumed_credits column and is_historical flag)
    const status = isDirectApprove ? 'approved' : 'pending';
    const resolvedBy = isDirectApprove ? (creator_id ? parseInt(creator_id) : parsedEmployeeId) : null;
    const resolvedAt = isDirectApprove ? new Date().toISOString() : null;

    const insertRes = await query(`
      INSERT INTO requests (employee_id, type, amount, status, observation, original_record_id, absence_type_id, start_date, end_date, resolved_by, resolved_at, consumed_credits, is_historical)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `, [parsedEmployeeId, type, parsedAmount, status, observation || 'Nueva solicitud', parsedOriginalRecordId, parsedAbsenceTypeId, start_date || null, end_date || null, resolvedBy, resolvedAt, consumed_credits ? JSON.stringify(consumed_credits) : null, !!is_historical]);

    const newRequest = insertRes.rows[0];

    // 3. Deduct/Apply balance changes immediately when created (even if pending) - Skip if historical
    if (!is_historical) {
      await applyRequestBalanceChanges(newRequest, resolvedBy || parsedEmployeeId, 'apply');
    }

    // 3b. If direct approved or historical, create transaction logs in time_records
    if (isDirectApprove) {
      await createApprovedTransactionLogs(newRequest, resolvedBy || parsedEmployeeId);
    }

    // Trigger email simulation
    await checkAndSimulateEmail('request_created', newRequest);

    // Write audit log
    const actor = creator_id ? parseInt(creator_id) : parsedEmployeeId;
    await logAudit(actor, isDirectApprove ? 'APPROVE' : 'CREATE', 'request', newRequest.id, `Solicitud de tipo ${type} creada para ${employee.name} (${amount ? amount : parsedAmount} unidades). Estado: ${status}`);

    return NextResponse.json({ success: true, request: newRequest });
  } catch (error) {
    console.error('Error posting request:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Approve or Reject request
export async function PUT(request) {
  try {
    const { id, status, resolved_by, observation } = await request.json();

    if (!id || !status || !resolved_by) {
      return NextResponse.json({ error: "Faltan parámetros" }, { status: 400 });
    }

    const parsedId = parseInt(id);
    const parsedResolvedBy = parseInt(resolved_by);

    const reqRes = await query(`
      SELECT r.*, e.name AS employee_name 
      FROM requests r 
      JOIN employees e ON r.employee_id = e.id 
      WHERE r.id = $1
    `, [parsedId]);
    if (reqRes.rows.length === 0) {
      return NextResponse.json({ error: "Solicitud no encontrada" }, { status: 404 });
    }

    const requestDetails = reqRes.rows[0];
    if (requestDetails.status !== 'pending') {
      return NextResponse.json({ error: "Esta solicitud ya ha sido resuelta" }, { status: 400 });
    }

    // Update observation if comments were added by resolver
    const updatedObservation = observation ? `${requestDetails.observation || ''} (Comentario resolutor: ${observation})` : requestDetails.observation;

    if (status === 'rejected') {
      // Restore the deducted balances if rejected
      await applyRequestBalanceChanges(requestDetails, parsedResolvedBy, 'restore');

      const updateRes = await query(`
        UPDATE requests 
        SET status = 'rejected', resolved_by = $1, resolved_at = CURRENT_TIMESTAMP, observation = $3
        WHERE id = $2
        RETURNING *
      `, [parsedResolvedBy, parsedId, updatedObservation]);

      // Trigger email simulation
      await checkAndSimulateEmail('request_resolved', updateRes.rows[0]);

      // Write audit log
      await logAudit(parsedResolvedBy, 'REJECT', 'request', parsedId, `Solicitud #${parsedId} de ${requestDetails.employee_name} RECHAZADA.`);

      return NextResponse.json({ success: true, request: updateRes.rows[0] });
    }

    // Update the temporary object observation so transaction log helper saves the updated comments
    requestDetails.observation = updatedObservation;

    // If approved, create the transaction logs in time_records
    await createApprovedTransactionLogs(requestDetails, parsedResolvedBy);

    const updateRes = await query(`
      UPDATE requests 
      SET status = 'approved', resolved_by = $1, resolved_at = CURRENT_TIMESTAMP, observation = $3
      WHERE id = $2
      RETURNING *
    `, [parsedResolvedBy, parsedId, updatedObservation]);

    // Trigger email simulation
    await checkAndSimulateEmail('request_resolved', updateRes.rows[0]);

    // Write audit log
    await logAudit(parsedResolvedBy, 'APPROVE', 'request', parsedId, `Solicitud #${parsedId} de ${requestDetails.employee_name} APROBADA.`);

    return NextResponse.json({ success: true, request: updateRes.rows[0] });
  } catch (error) {
    console.error('Error resolving request:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Apply balance modifications immediately or restore them on rejection
async function applyRequestBalanceChanges(req, triggerEmpId, action) {
  if (req.is_historical) return; // Skip balance modification for historical requests!

  const empId = req.employee_id;
  const amount = parseFloat(req.amount);
  const type = req.type;

  // Sign factor: 1 for applying, -1 for restoring
  const sign = action === 'apply' ? 1 : -1;

  if (type === 'absence') {
    // Check if it subtracts vacation days (amount is negative if it does)
    if (amount < 0) {
      await query(`UPDATE employees SET vacation_days = vacation_days + $1 WHERE id = $2`, [Math.round(amount) * sign, empId]);
    }
  } else if (type === 'hours_register') {
    if (action === 'apply' && req.status === 'approved') {
      await query(`UPDATE employees SET extra_hours = extra_hours + $1 WHERE id = $2`, [amount, empId]);
    } else if (action === 'restore' && req.status === 'approved') {
      await query(`UPDATE employees SET extra_hours = extra_hours - $1 WHERE id = $2`, [amount, empId]);
    }
  } else if (type === 'hours_festive') {
    if (action === 'apply' && req.status === 'approved') {
      await query(`UPDATE employees SET vacation_days = vacation_days + 1, extra_hours = extra_hours + 4 WHERE id = $1`, [empId]);
    } else if (action === 'restore' && req.status === 'approved') {
      await query(`UPDATE employees SET vacation_days = vacation_days - 1, extra_hours = extra_hours - 4 WHERE id = $1`, [empId]);
    }
  } else if (type === 'hours_free' || type === 'hours_to_vacation' || type === 'hours_payroll') {
    const absHours = Math.abs(amount);

    // If we have a list of consumed credits (JSONB array), loop over them
    if (req.consumed_credits && Array.isArray(req.consumed_credits)) {
      for (let item of req.consumed_credits) {
        const itemHours = parseFloat(item.hours);
        await query(`UPDATE time_records SET remaining_amount = remaining_amount - $1 WHERE id = $2`, [itemHours * sign, item.record_id]);
      }
    } else if (req.original_record_id) {
      // Fallback to single record
      await query(`UPDATE time_records SET remaining_amount = remaining_amount - $1 WHERE id = $2`, [absHours * sign, req.original_record_id]);
    }

    // Deduct overall extra hours total
    await query(`UPDATE employees SET extra_hours = extra_hours - $1 WHERE id = $2`, [absHours * sign, empId]);

    if (type === 'hours_to_vacation') {
      const addedVacations = Math.floor(absHours / 8);
      await query(`UPDATE employees SET vacation_days = vacation_days + $1 WHERE id = $2`, [addedVacations * sign, empId]);
    }
  }
}

// Log actions in time_records only when request is officially approved
async function createApprovedTransactionLogs(req, resolverId) {
  const reqId = req.id;
  if (req.is_historical) {
    const empId = req.employee_id;
    const type = req.type;
    const observation = req.observation;
    
    if (type === 'absence') {
      await query(`
        INSERT INTO time_records (employee_id, created_by, type, amount, remaining_amount, observation, request_id)
        VALUES ($1, $2, 'vacation', 0.00, 0.00, $3, $4)
      `, [empId, resolverId, `Ausencia histórica pre-autorizada (${req.start_date ? req.start_date.toString().split('T')[0] : ''} a ${req.end_date ? req.end_date.toString().split('T')[0] : ''}): ${observation || ''}`, reqId]);
    } else {
      await query(`
        INSERT INTO time_records (employee_id, created_by, type, amount, remaining_amount, observation, request_id)
        VALUES ($1, $2, 'extra_hours', 0.00, 0.00, $3, $4)
      `, [empId, resolverId, `Registro histórico pre-autorizado (${observation || ''})`, reqId]);
    }
    return;
  }

  const empId = req.employee_id;
  const amount = parseFloat(req.amount);
  const type = req.type;
  const observation = req.observation;

  if (type === 'absence') {
    if (amount < 0) {
      await query(`
        INSERT INTO time_records (employee_id, created_by, type, amount, remaining_amount, observation, request_id)
        VALUES ($1, $2, 'vacation', $3, 0.00, $4, $5)
      `, [empId, resolverId, amount, `Ausencia aprobada (${req.start_date.toString().split('T')[0]} a ${req.end_date.toString().split('T')[0]}): ${observation}`, reqId]);
    } else {
      await query(`
        INSERT INTO time_records (employee_id, created_by, type, amount, remaining_amount, observation, request_id)
        VALUES ($1, $2, 'vacation', 0.00, 0.00, $3, $4)
      `, [empId, resolverId, `Ausencia justificada (${req.start_date.toString().split('T')[0]} a ${req.end_date.toString().split('T')[0]}): ${observation}`, reqId]);
    }
  } else if (type === 'hours_register') {
    await query(`UPDATE employees SET extra_hours = extra_hours + $1 WHERE id = $2`, [amount, empId]);

    const formattedDate = req.start_date ? ` el ${req.start_date.toString().split('T')[0]}` : '';
    await query(`
      INSERT INTO time_records (employee_id, created_by, type, amount, remaining_amount, observation, request_id)
      VALUES ($1, $2, 'extra_hours', $3, $3, $4, $5)
    `, [empId, resolverId, amount, `Aprobado: Horas extras registradas${formattedDate} (${observation})`, reqId]);

  } else if (type === 'hours_festive') {
    await query(`UPDATE employees SET vacation_days = vacation_days + 1, extra_hours = extra_hours + 4 WHERE id = $1`, [empId]);

    const formattedDate = req.start_date ? ` el ${req.start_date.toString().split('T')[0]}` : '';
    await query(`
      INSERT INTO time_records (employee_id, created_by, type, amount, remaining_amount, observation, request_id)
      VALUES ($1, $2, 'vacation', 1.00, 0.00, $3, $4)
    `, [empId, resolverId, `Festivo trabajado${formattedDate}: +1 día de vacaciones (${observation})`, reqId]);

    await query(`
      INSERT INTO time_records (employee_id, created_by, type, amount, remaining_amount, observation, request_id)
      VALUES ($1, $2, 'extra_hours', 4.00, 4.00, $3, $4)
    `, [empId, resolverId, `Festivo trabajado${formattedDate}: +4 horas extras (${observation})`, reqId]);

  } else if (type === 'hours_free' || type === 'hours_to_vacation' || type === 'hours_payroll') {
    const absHours = Math.abs(amount);

    if (type === 'hours_to_vacation') {
      const addedVacations = Math.floor(absHours / 8);
      await query(`
        INSERT INTO time_records (employee_id, created_by, type, amount, remaining_amount, observation, request_id)
        VALUES ($1, $2, 'vacation', $3, 0.00, $4, $5)
      `, [empId, resolverId, addedVacations, `Canjeado: ${absHours}h extras por ${addedVacations}d de vacaciones`, reqId]);
    }

    let desc = '';
    if (type === 'hours_free') desc = `Consumo aprobado: ${absHours}h libres (${observation})`;
    if (type === 'hours_to_vacation') desc = `Canjeado por vacaciones: -${absHours}h extras (${observation})`;
    if (type === 'hours_payroll') desc = `Abono en nómina solicitado: -${absHours}h extras (${observation})`;

    if (req.consumed_credits && Array.isArray(req.consumed_credits)) {
      // Create detailed audit entries for each credit source if multiple
      for (let item of req.consumed_credits) {
        await query(`
          INSERT INTO time_records (employee_id, created_by, type, amount, remaining_amount, observation, request_id)
          VALUES ($1, $2, 'extra_hours', $3, 0.00, $4, $5)
        `, [empId, resolverId, -parseFloat(item.hours), `${desc} [Ficha #${item.record_id}]`, reqId]);
      }
    } else {
      await query(`
        INSERT INTO time_records (employee_id, created_by, type, amount, remaining_amount, observation, request_id)
        VALUES ($1, $2, 'extra_hours', $3, 0.00, $4, $5)
      `, [empId, resolverId, -absHours, desc, reqId]);
    }
  }
}

// Helper: Dispatch email using lib/email.js
async function checkAndSimulateEmail(eventKey, requestDetails) {
  try {
    // 1. Check if the request is an absence of type 'baja'
    if (requestDetails.type === 'absence' && requestDetails.absence_type_id) {
      const absTypeRes = await query(`SELECT name FROM absence_types WHERE id = $1`, [requestDetails.absence_type_id]);
      if (absTypeRes.rows.length > 0) {
        const name = absTypeRes.rows[0].name.toLowerCase();
        if (name.includes('baja')) {
          console.log(`[Email] Solicitud de BAJA detectada (ID: ${requestDetails.id}). Correo omitido para todos los roles.`);
          return;
        }
      }
    }

    // 2. Fetch employee details
    const empRes = await query(`SELECT * FROM employees WHERE id = $1`, [requestDetails.employee_id]);
    if (empRes.rows.length === 0) return;
    const employee = empRes.rows[0];

    // 3. Dispatch
    let status_es = 'registrada';
    if (requestDetails.status === 'approved') status_es = 'aprobada';
    if (requestDetails.status === 'rejected') status_es = 'rechazada';

    const eventData = {
      request_id: requestDetails.id,
      status_es: status_es,
      observation: requestDetails.observation || 'Sin observaciones'
    };

    await sendNotificationEmail(eventKey, employee, eventData);

  } catch (err) {
    console.error("Error in checkAndSimulateEmail:", err);
  }
}

// Delete request
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const refund = searchParams.get('refund') === 'true';

    if (!id) {
      return NextResponse.json({ error: "Faltan parámetros (id)" }, { status: 400 });
    }

    const parsedId = parseInt(id);

    // Fetch the request
    const reqRes = await query(`SELECT * FROM requests WHERE id = $1`, [parsedId]);
    if (reqRes.rows.length === 0) {
      return NextResponse.json({ error: "Solicitud no encontrada" }, { status: 404 });
    }

    const reqData = reqRes.rows[0];

    // Delete associated time records first (those created upon approval or as history)
    await query(`DELETE FROM time_records WHERE request_id = $1`, [parsedId]);

    // If refund is requested, restore the balances IF the request was actually taking balance
    // Note: If a request is rejected, its balances were already restored, so we shouldn't restore them twice.
    if (refund && reqData.status !== 'rejected') {
      // The function applyRequestBalanceChanges handles restoring correctly, including exact record amounts
      await applyRequestBalanceChanges(reqData, null, 'restore');
    }

    // Write audit log
    await logAudit(
      reqData.employee_id, // we don't have the exact admin's ID here unless passed, fallback to emp
      'DELETE', 
      'request', 
      parsedId, 
      `Solicitud #${parsedId} eliminada permanentemente. ¿Devolución de saldos?: ${refund ? 'SÍ' : 'NO'}.`
    );

    // Delete the actual request
    await query(`DELETE FROM requests WHERE id = $1`, [parsedId]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting request:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

// Fetch time transactions for an employee
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId');

    if (!employeeId) {
      return NextResponse.json({ error: "ID de empleado requerido" }, { status: 400 });
    }

    const trResult = await query(`
      SELECT tr.id, tr.employee_id, tr.created_by, tr.type, tr.amount, tr.remaining_amount, tr.observation, tr.created_at, e.name AS creator_name
      FROM time_records tr
      LEFT JOIN employees e ON tr.created_by = e.id
      WHERE tr.employee_id = $1
      ORDER BY tr.created_at DESC
    `, [employeeId]);

    return NextResponse.json({ success: true, records: trResult.rows });
  } catch (error) {
    console.error('Error fetching time records:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Add transaction (adjustment or consumption)
export async function POST(request) {
  try {
    const { employee_id, type, amount, observation, created_by, original_record_id, action } = await request.json();

    if (!employee_id || !type || !action) {
      return NextResponse.json({ error: "Faltan parámetros obligatorios" }, { status: 400 });
    }

    const parsedEmployeeId = parseInt(employee_id);
    const parsedCreatedBy = created_by ? parseInt(created_by) : null;
    const parsedAmount = parseFloat(amount);

    if (isNaN(parsedAmount) || parsedAmount === 0) {
      return NextResponse.json({ error: "Cantidad inválida" }, { status: 400 });
    }

    if (action === 'adjust') {
      // 1. Coordinator or Admin adjusting balance (+ or -)
      const remainingAmount = (type === 'extra_hours' && parsedAmount > 0) ? parsedAmount : 0.00;

      // Insert transaction log
      const insertRes = await query(`
        INSERT INTO time_records (employee_id, created_by, type, amount, remaining_amount, observation)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `, [parsedEmployeeId, parsedCreatedBy, type, parsedAmount, remainingAmount, observation || 'Ajuste de saldo']);

      // Update employee totals
      if (type === 'vacation') {
        await query(`
          UPDATE employees 
          SET vacation_days = vacation_days + $1 
          WHERE id = $2
        `, [Math.round(parsedAmount), parsedEmployeeId]);
      } else if (type === 'extra_hours') {
        await query(`
          UPDATE employees 
          SET extra_hours = extra_hours + $1 
          WHERE id = $2
        `, [parsedAmount, parsedEmployeeId]);
      }

      return NextResponse.json({ success: true, record: insertRes.rows[0] });

    } else if (action === 'consume') {
      // 2. Employee consuming hours from a specific extra hours credit record
      if (type !== 'extra_hours') {
        return NextResponse.json({ error: "Solo se pueden consumir registros de horas extras" }, { status: 400 });
      }

      if (!original_record_id) {
        return NextResponse.json({ error: "Se requiere especificar el registro de origen a consumir" }, { status: 400 });
      }

      const parsedOriginalRecordId = parseInt(original_record_id);

      // Verify availability of hours in the original transaction
      const origRes = await query(`
        SELECT remaining_amount, observation FROM time_records WHERE id = $1 AND employee_id = $2
      `, [parsedOriginalRecordId, parsedEmployeeId]);

      if (origRes.rows.length === 0) {
        return NextResponse.json({ error: "Registro de origen no encontrado" }, { status: 404 });
      }

      const available = parseFloat(origRes.rows[0].remaining_amount);
      if (parsedAmount > available) {
        return NextResponse.json({ error: `Cantidad a consumir (${parsedAmount}h) supera las horas disponibles en este registro (${available}h)` }, { status: 400 });
      }

      // Deduct from original record remaining hours
      await query(`
        UPDATE time_records 
        SET remaining_amount = remaining_amount - $1 
        WHERE id = $2
      `, [parsedAmount, parsedOriginalRecordId]);

      // Deduct from employee total extra hours
      await query(`
        UPDATE employees 
        SET extra_hours = extra_hours - $1 
        WHERE id = $2
      `, [parsedAmount, parsedEmployeeId]);

      // Create negative transaction log entry for history
      const fullObservation = `Consumo de ${parsedAmount}h del registro #${parsedOriginalRecordId} ("${origRes.rows[0].observation}"): ${observation || 'Sin observaciones'}`;
      const insertRes = await query(`
        INSERT INTO time_records (employee_id, created_by, type, amount, remaining_amount, observation)
        VALUES ($1, $2, 'extra_hours', $3, 0.00, $4)
        RETURNING *
      `, [parsedEmployeeId, parsedCreatedBy, -parsedAmount, fullObservation]);

      return NextResponse.json({ success: true, record: insertRes.rows[0] });
    }

    return NextResponse.json({ error: "Acción no reconocida" }, { status: 400 });
  } catch (error) {
    console.error('Error posting time transaction:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Delete time record (reverts balance changes) or delete all records for an employee
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const employeeId = searchParams.get('employeeId');

    if (employeeId) {
      const parsedEmpId = parseInt(employeeId);
      // Delete all requests and time records for this employee
      await query(`DELETE FROM requests WHERE employee_id = $1`, [parsedEmpId]);
      await query(`DELETE FROM time_records WHERE employee_id = $1`, [parsedEmpId]);
      return NextResponse.json({ success: true });
    }

    if (!id) {
      return NextResponse.json({ error: "ID de transacción o ID de empleado requerido" }, { status: 400 });
    }

    const parsedId = parseInt(id);

    // Fetch transaction details
    const trRes = await query(`SELECT * FROM time_records WHERE id = $1`, [parsedId]);
    if (trRes.rows.length === 0) {
      return NextResponse.json({ error: "Transacción no encontrada" }, { status: 404 });
    }
    const record = trRes.rows[0];

    const revert = searchParams.get('revert') !== 'false';

    // Revert balance modifications if requested (subtracting the original amount)
    if (revert) {
      if (record.type === 'vacation') {
        await query(`
          UPDATE employees 
          SET vacation_days = vacation_days - $1 
          WHERE id = $2
        `, [Math.round(parseFloat(record.amount)), record.employee_id]);
      } else if (record.type === 'extra_hours') {
        await query(`
          UPDATE employees 
          SET extra_hours = extra_hours - $1 
          WHERE id = $2
        `, [parseFloat(record.amount), record.employee_id]);
      }
    }

    // Delete the transaction log
    await query(`DELETE FROM time_records WHERE id = $1`, [parsedId]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting time record:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

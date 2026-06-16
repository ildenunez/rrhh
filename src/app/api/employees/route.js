import { query } from '@/lib/db';
import { logAudit } from '@/lib/audit';
import { NextResponse } from 'next/server';

// Create Employee
export async function POST(request) {
  try {
    const { name, email, role, department_id, team_id, vacation_days, extra_hours, managed_department_ids, password, birth_date, actor_id } = await request.json();
    
    // Validations
    if (!name || !email || !role || !password) {
      return NextResponse.json({ error: "Nombre, email, rol y contraseña son requeridos" }, { status: 400 });
    }

    // Insert employee with the provided password (stored in password_hash column)
    const result = await query(`
      INSERT INTO employees (name, email, role, department_id, team_id, vacation_days, extra_hours, password_hash, birth_date)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [
      name, 
      email, 
      role, 
      department_id || null, 
      team_id || null,
      vacation_days !== undefined && vacation_days !== '' ? parseInt(vacation_days) : 30, 
      extra_hours !== undefined && extra_hours !== '' ? parseFloat(extra_hours) : 0.00, 
      password,
      birth_date || null
    ]);

    const newEmployee = result.rows[0];

    // Create initial time records
    const initialVac = vacation_days !== undefined && vacation_days !== '' ? parseInt(vacation_days) : 30;
    const initialHours = extra_hours !== undefined && extra_hours !== '' ? parseFloat(extra_hours) : 0.00;

    if (initialVac > 0) {
      await query(`
        INSERT INTO time_records (employee_id, created_by, type, amount, remaining_amount, observation)
        VALUES ($1, NULL, 'vacation', $2, 0.00, 'Saldo inicial de vacaciones')
      `, [newEmployee.id, initialVac]);
    }
    if (initialHours > 0) {
      await query(`
        INSERT INTO time_records (employee_id, created_by, type, amount, remaining_amount, observation)
        VALUES ($1, NULL, 'extra_hours', $2, $2, 'Saldo inicial de horas extras')
      `, [newEmployee.id, initialHours]);
    }

    // Handle multi-department assignment if coordinator/admin
    if ((role === 'coordinator' || role === 'admin') && Array.isArray(managed_department_ids)) {
      // Clear any department where this employee was coordinator
      await query(`UPDATE departments SET coordinator_id = NULL WHERE coordinator_id = $1`, [newEmployee.id]);
      
      if (managed_department_ids.length > 0) {
        // Set coordinator_id for selected departments
        await query(`
          UPDATE departments 
          SET coordinator_id = $1 
          WHERE id = ANY($2)
        `, [newEmployee.id, managed_department_ids.map(id => parseInt(id))]);
      }
    }

    await logAudit(actor_id, 'CREATE', 'employee', newEmployee.id, `Creado empleado: ${newEmployee.name} (${newEmployee.email}), rol: ${newEmployee.role}, vac: ${newEmployee.vacation_days}d, hrs: ${newEmployee.extra_hours}h`);

    return NextResponse.json({ success: true, employee: newEmployee });
  } catch (error) {
    console.error('Error creating employee:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Update Employee
export async function PUT(request) {
  try {
    const { id, name, email, role, department_id, team_id, vacation_days, extra_hours, managed_department_ids, password, birth_date, avatar_url, actor_id } = await request.json();

    if (!id || !name || !email || !role) {
      return NextResponse.json({ error: "ID, nombre, email y rol son requeridos" }, { status: 400 });
    }

    const parsedId = parseInt(id);

    // Fetch old balance first
    const oldRes = await query(`SELECT vacation_days, extra_hours FROM employees WHERE id = $1`, [parsedId]);
    if (oldRes.rows.length === 0) {
      return NextResponse.json({ error: "Empleado no encontrado" }, { status: 404 });
    }
    const oldVacation = parseFloat(oldRes.rows[0].vacation_days || 0);
    const oldHours = parseFloat(oldRes.rows[0].extra_hours || 0);

    // Update employee details (conditional password update)
    let result;
    if (password && password.trim() !== '') {
      result = await query(`
        UPDATE employees
        SET name = $1, email = $2, role = $3, department_id = $4, team_id = $5, vacation_days = $6, extra_hours = $7, password_hash = $8, birth_date = $9, avatar_url = $10
        WHERE id = $11
        RETURNING *
      `, [
        name, 
        email, 
        role, 
        department_id || null, 
        team_id || null,
        vacation_days !== undefined && vacation_days !== '' ? parseInt(vacation_days) : 30, 
        extra_hours !== undefined && extra_hours !== '' ? parseFloat(extra_hours) : 0.00, 
        password,
        birth_date || null,
        avatar_url || null,
        id
      ]);
    } else {
      result = await query(`
        UPDATE employees
        SET name = $1, email = $2, role = $3, department_id = $4, team_id = $5, vacation_days = $6, extra_hours = $7, birth_date = $8, avatar_url = $9
        WHERE id = $10
        RETURNING *
      `, [
        name, 
        email, 
        role, 
        department_id || null, 
        team_id || null,
        vacation_days !== undefined && vacation_days !== '' ? parseInt(vacation_days) : 30, 
        extra_hours !== undefined && extra_hours !== '' ? parseFloat(extra_hours) : 0.00, 
        birth_date || null,
        avatar_url || null,
        id
      ]);
    }

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Empleado no encontrado" }, { status: 404 });
    }

    const updatedEmployee = result.rows[0];

    // Auto-create time_records adjustments if balances changed
    const newVacation = parseFloat(updatedEmployee.vacation_days || 0);
    const newHours = parseFloat(updatedEmployee.extra_hours || 0);

    const diffVacation = newVacation - oldVacation;
    const diffHours = newHours - oldHours;

    if (diffVacation !== 0) {
      await query(`
        INSERT INTO time_records (employee_id, created_by, type, amount, remaining_amount, observation)
        VALUES ($1, NULL, 'vacation', $2, 0.00, $3)
      `, [updatedEmployee.id, diffVacation, `Regularización Admin: Ajuste manual de ficha (${diffVacation > 0 ? '+' : ''}${diffVacation} días)`]);
    }

    if (diffHours !== 0) {
      const remainingAmt = diffHours > 0 ? diffHours : 0.00;
      await query(`
        INSERT INTO time_records (employee_id, created_by, type, amount, remaining_amount, observation)
        VALUES ($1, NULL, 'extra_hours', $2, $3, $4)
      `, [updatedEmployee.id, diffHours, remainingAmt, `Regularización Admin: Ajuste manual de ficha (${diffHours > 0 ? '+' : ''}${diffHours}h)`]);
    }

    // Handle multi-department assignment
    if (role === 'coordinator' || role === 'admin') {
      if (Array.isArray(managed_department_ids)) {
        await query(`UPDATE departments SET coordinator_id = NULL WHERE coordinator_id = $1`, [updatedEmployee.id]);
        
        if (managed_department_ids.length > 0) {
          await query(`
            UPDATE departments 
            SET coordinator_id = $1 
            WHERE id = ANY($2)
          `, [updatedEmployee.id, managed_department_ids.map(id => parseInt(id))]);
        }
      }
    } else {
      await query(`UPDATE departments SET coordinator_id = NULL WHERE coordinator_id = $1`, [updatedEmployee.id]);
    }

    await logAudit(actor_id, 'UPDATE', 'employee', updatedEmployee.id, `Modificado empleado: ${updatedEmployee.name} (${updatedEmployee.email}), rol: ${updatedEmployee.role}, vac: ${updatedEmployee.vacation_days}d, hrs: ${updatedEmployee.extra_hours}h`);

    return NextResponse.json({ success: true, employee: updatedEmployee });
  } catch (error) {
    console.error('Error updating employee:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Delete Employee
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const actor_id = searchParams.get('actor_id');

    if (!id) {
      return NextResponse.json({ error: "ID del empleado es requerido" }, { status: 400 });
    }

    const result = await query(`DELETE FROM employees WHERE id = $1 RETURNING *`, [id]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Empleado no encontrado" }, { status: 404 });
    }

    const deletedEmployee = result.rows[0];
    await logAudit(actor_id, 'DELETE', 'employee', deletedEmployee.id, `Eliminado empleado: ${deletedEmployee.name} (${deletedEmployee.email})`);

    return NextResponse.json({ success: true, employee: deletedEmployee });
  } catch (error) {
    console.error('Error deleting employee:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

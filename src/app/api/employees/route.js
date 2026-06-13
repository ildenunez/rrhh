import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

// Create Employee
export async function POST(request) {
  try {
    const { name, email, role, department_id, vacation_days, extra_hours, managed_department_ids, password, birth_date } = await request.json();
    
    // Validations
    if (!name || !email || !role || !password) {
      return NextResponse.json({ error: "Nombre, email, rol y contraseña son requeridos" }, { status: 400 });
    }

    // Insert employee with the provided password (stored in password_hash column)
    const result = await query(`
      INSERT INTO employees (name, email, role, department_id, vacation_days, extra_hours, password_hash, birth_date)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [
      name, 
      email, 
      role, 
      department_id || null, 
      vacation_days !== undefined && vacation_days !== '' ? parseInt(vacation_days) : 30, 
      extra_hours !== undefined && extra_hours !== '' ? parseFloat(extra_hours) : 0.00, 
      password,
      birth_date || null
    ]);

    const newEmployee = result.rows[0];

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

    return NextResponse.json({ success: true, employee: newEmployee });
  } catch (error) {
    console.error('Error creating employee:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Update Employee
export async function PUT(request) {
  try {
    const { id, name, email, role, department_id, vacation_days, extra_hours, managed_department_ids, password, birth_date, avatar_url } = await request.json();

    if (!id || !name || !email || !role) {
      return NextResponse.json({ error: "ID, nombre, email y rol son requeridos" }, { status: 400 });
    }

    // Update employee details (conditional password update)
    let result;
    if (password && password.trim() !== '') {
      result = await query(`
        UPDATE employees
        SET name = $1, email = $2, role = $3, department_id = $4, vacation_days = $5, extra_hours = $6, password_hash = $7, birth_date = $8, avatar_url = $9
        WHERE id = $10
        RETURNING *
      `, [
        name, 
        email, 
        role, 
        department_id || null, 
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
        SET name = $1, email = $2, role = $3, department_id = $4, vacation_days = $5, extra_hours = $6, birth_date = $7, avatar_url = $8
        WHERE id = $9
        RETURNING *
      `, [
        name, 
        email, 
        role, 
        department_id || null, 
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

    if (!id) {
      return NextResponse.json({ error: "ID del empleado es requerido" }, { status: 400 });
    }

    const result = await query(`DELETE FROM employees WHERE id = $1 RETURNING *`, [id]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Empleado no encontrado" }, { status: 404 });
    }

    return NextResponse.json({ success: true, employee: result.rows[0] });
  } catch (error) {
    console.error('Error deleting employee:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

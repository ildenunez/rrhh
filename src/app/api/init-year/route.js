import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { year, created_by } = await request.json();
    
    if (!year) {
      return NextResponse.json({ error: "Año requerido" }, { status: 400 });
    }

    const parsedCreatedBy = created_by ? parseInt(created_by) : null;
    const parsedYear = parseInt(year);

    if (isNaN(parsedYear)) {
      return NextResponse.json({ error: "Año inválido" }, { status: 400 });
    }

    // Get all employees
    const employeesRes = await query(`SELECT id, name, vacation_days FROM employees`);
    const employees = employeesRes.rows;

    const observation = `Vacaciones año ${parsedYear}`;

    // Perform updates for each employee
    for (let emp of employees) {
      // 1. Insert time_record
      await query(`
        INSERT INTO time_records (employee_id, created_by, type, amount, remaining_amount, observation)
        VALUES ($1, $2, 'vacation', 31, 0, $3)
      `, [emp.id, parsedCreatedBy, observation]);

      // 2. Update employee's vacation_days
      await query(`
        UPDATE employees 
        SET vacation_days = vacation_days + 31 
        WHERE id = $1
      `, [emp.id]);
    }

    return NextResponse.json({ success: true, message: `Año ${parsedYear} iniciado con éxito para todos los empleados.` });
  } catch (error) {
    console.error('Error starting new year:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

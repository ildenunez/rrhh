import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

// GET employee shift assignments
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!userId || !startDate || !endDate) {
      return NextResponse.json({ error: "userId, startDate y endDate son requeridos" }, { status: 400 });
    }

    // Get current user info to check permissions
    const userRes = await query(`SELECT id, role, department_id FROM employees WHERE id = $1`, [userId]);
    if (userRes.rows.length === 0) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }
    const currentUser = userRes.rows[0];

    let assignmentsQuery = `
      SELECT es.id, es.employee_id, es.shift_id, TO_CHAR(es.date, 'YYYY-MM-DD') as date, 
             s.name as shift_name, s.color as shift_color, s.start_time, s.end_time, s.start_time_2, s.end_time_2
      FROM employee_shifts es
      JOIN shifts s ON es.shift_id = s.id
      JOIN employees e ON es.employee_id = e.id
      WHERE es.date >= $1 AND es.date <= $2
    `;
    const params = [startDate, endDate];

    if (currentUser.role === 'coordinator') {
      // Find departments managed by this coordinator
      const managedDeptsRes = await query(`SELECT id FROM departments WHERE coordinator_id = $1`, [currentUser.id]);
      const managedDeptIds = managedDeptsRes.rows.map(row => row.id);

      if (managedDeptIds.length === 0) {
        // Doesn't coordinate anything, return empty
        return NextResponse.json({ success: true, assignments: [] });
      }

      assignmentsQuery += ` AND e.department_id = ANY($3)`;
      params.push(managedDeptIds);
    } else if (currentUser.role === 'employee') {
      // Employees only see colleagues in the same department (or just themselves, but let's allow seeing colleagues for planning view)
      if (currentUser.department_id) {
        assignmentsQuery += ` AND e.department_id = $3`;
        params.push(currentUser.department_id);
      } else {
        assignmentsQuery += ` AND e.id = $3`;
        params.push(currentUser.id);
      }
    }

    const assignmentsRes = await query(assignmentsQuery, params);
    return NextResponse.json({ success: true, assignments: assignmentsRes.rows });
  } catch (error) {
    console.error('Error fetching employee shifts:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST update employee shift assignments (bulk/single)
export async function POST(request) {
  try {
    const { userId, assignments } = await request.json();

    if (!userId || !Array.isArray(assignments)) {
      return NextResponse.json({ error: "userId y array de assignments son requeridos" }, { status: 400 });
    }

    // Get current user info to check permissions
    const userRes = await query(`SELECT id, role, department_id FROM employees WHERE id = $1`, [userId]);
    if (userRes.rows.length === 0) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }
    const currentUser = userRes.rows[0];

    if (currentUser.role === 'employee') {
      return NextResponse.json({ error: "No tienes permiso para programar turnos" }, { status: 403 });
    }

    // Get managed departments if coordinator
    let managedDeptIds = [];
    if (currentUser.role === 'coordinator') {
      const managedDeptsRes = await query(`SELECT id FROM departments WHERE coordinator_id = $1`, [currentUser.id]);
      managedDeptIds = managedDeptsRes.rows.map(row => row.id);
    }

    for (let assign of assignments) {
      const { employee_id, date, shift_id } = assign;

      if (!employee_id || !date) continue;

      // Check if employee coordinates with this coordinator
      if (currentUser.role === 'coordinator') {
        const empRes = await query(`SELECT department_id FROM employees WHERE id = $1`, [employee_id]);
        if (empRes.rows.length === 0) continue;
        const empDeptId = empRes.rows[0].department_id;
        if (!managedDeptIds.includes(empDeptId)) {
          // No permission for this employee
          continue;
        }
      }

      if (!shift_id) {
        // Delete shift assignment
        await query(`
          DELETE FROM employee_shifts 
          WHERE employee_id = $1 AND date = $2
        `, [employee_id, date]);
      } else {
        // Upsert shift assignment
        await query(`
          INSERT INTO employee_shifts (employee_id, date, shift_id)
          VALUES ($1, $2, $3)
          ON CONFLICT (employee_id, date)
          DO UPDATE SET shift_id = EXCLUDED.shift_id
        `, [employee_id, date, shift_id]);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating employee shifts:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

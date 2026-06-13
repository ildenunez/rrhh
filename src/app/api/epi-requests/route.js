import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

// Get requests (with filters depending on role)
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'Falta parámetro userId' }, { status: 400 });
  }

  try {
    // Check role of the fetching user
    const userRes = await query('SELECT role FROM employees WHERE id = $1', [parseInt(userId)]);
    if (userRes.rows.length === 0) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }
    const user = userRes.rows[0];

    let requestsList = [];

    if (user.role === 'admin') {
      const res = await query(`
        SELECT er.id, er.employee_id, er.epi_type_id, er.size_id, er.status,
               er.requested_at, er.delivered_at, er.delivered_by,
               e.name AS employee_name, e.email AS employee_email, d.name AS department_name,
               et.name AS epi_name, es.size_name,
               db.name AS deliverer_name
        FROM epi_requests er
        JOIN employees e ON er.employee_id = e.id
        LEFT JOIN departments d ON e.department_id = d.id
        JOIN epi_types et ON er.epi_type_id = et.id
        JOIN epi_sizes es ON er.size_id = es.id
        LEFT JOIN employees db ON er.delivered_by = db.id
        ORDER BY er.requested_at DESC
      `);
      requestsList = res.rows;
    } else if (user.role === 'coordinator') {
      // Fetch own department managed employees' requests plus own requests
      const managedDeptsRes = await query('SELECT id FROM departments WHERE coordinator_id = $1', [parseInt(userId)]);
      const deptIds = managedDeptsRes.rows.map(row => row.id);

      const res = await query(`
        SELECT er.id, er.employee_id, er.epi_type_id, er.size_id, er.status,
               er.requested_at, er.delivered_at, er.delivered_by,
               e.name AS employee_name, e.email AS employee_email, d.name AS department_name,
               et.name AS epi_name, es.size_name,
               db.name AS deliverer_name
        FROM epi_requests er
        JOIN employees e ON er.employee_id = e.id
        LEFT JOIN departments d ON e.department_id = d.id
        JOIN epi_types et ON er.epi_type_id = et.id
        JOIN epi_sizes es ON er.size_id = es.id
        LEFT JOIN employees db ON er.delivered_by = db.id
        WHERE e.department_id = ANY($1) OR er.employee_id = $2
        ORDER BY er.requested_at DESC
      `, [deptIds, parseInt(userId)]);
      requestsList = res.rows;
    } else {
      // Regular employee can only view their own
      const res = await query(`
        SELECT er.id, er.employee_id, er.epi_type_id, er.size_id, er.status,
               er.requested_at, er.delivered_at, er.delivered_by,
               et.name AS epi_name, es.size_name,
               db.name AS deliverer_name
        FROM epi_requests er
        JOIN epi_types et ON er.epi_type_id = et.id
        JOIN epi_sizes es ON er.size_id = es.id
        LEFT JOIN employees db ON er.delivered_by = db.id
        WHERE er.employee_id = $1
        ORDER BY er.requested_at DESC
      `, [parseInt(userId)]);
      requestsList = res.rows;
    }

    return NextResponse.json(requestsList);
  } catch (error) {
    console.error('Error fetching EPI requests:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Create request
export async function POST(request) {
  try {
    const { employee_id, epi_type_id, size_id } = await request.json();

    if (!employee_id || !epi_type_id || !size_id) {
      return NextResponse.json({ error: 'Faltan parámetros obligatorios' }, { status: 400 });
    }

    const res = await query(`
      INSERT INTO epi_requests (employee_id, epi_type_id, size_id, status)
      VALUES ($1, $2, $3, 'pending')
      RETURNING *
    `, [parseInt(employee_id), parseInt(epi_type_id), parseInt(size_id)]);

    return NextResponse.json({ success: true, request: res.rows[0] });
  } catch (error) {
    console.error('Error creating EPI request:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Update status (Admin/Coordinator only)
export async function PUT(request) {
  try {
    const { request_id, status, resolved_by } = await request.json();

    if (!request_id || !status || !resolved_by) {
      return NextResponse.json({ error: 'Faltan parámetros obligatorios' }, { status: 400 });
    }

    // Verify requesting user role (must be admin or coordinator)
    const delivererRes = await query('SELECT role FROM employees WHERE id = $1', [parseInt(resolved_by)]);
    if (delivererRes.rows.length === 0 || (delivererRes.rows[0].role !== 'admin' && delivererRes.rows[0].role !== 'coordinator')) {
      return NextResponse.json({ error: 'Operación no autorizada para este usuario' }, { status: 403 });
    }

    let res;
    if (status === 'delivered') {
      res = await query(`
        UPDATE epi_requests
        SET status = 'delivered', delivered_at = CURRENT_TIMESTAMP, delivered_by = $1
        WHERE id = $2
        RETURNING *
      `, [parseInt(resolved_by), parseInt(request_id)]);
    } else if (status === 'requested') {
      res = await query(`
        UPDATE epi_requests
        SET status = 'requested'
        WHERE id = $1
        RETURNING *
      `, [parseInt(request_id)]);
    } else {
      return NextResponse.json({ error: 'Estado no válido' }, { status: 400 });
    }

    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Solicitud no encontrada' }, { status: 404 });
    }

    return NextResponse.json({ success: true, request: res.rows[0] });
  } catch (error) {
    console.error('Error updating EPI request:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

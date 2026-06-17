import { query } from '@/lib/db';
import { logAudit } from '@/lib/audit';
import { NextResponse } from 'next/server';

// Create Department
export async function POST(request) {
  try {
    const { name, coordinator_id, show_in_planning, actor_id } = await request.json();
    
    if (!name) {
      return NextResponse.json({ error: "Nombre del departamento es requerido" }, { status: 400 });
    }

    const showPlanning = show_in_planning !== false;

    const result = await query(`
      INSERT INTO departments (name, coordinator_id, show_in_planning)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [name, coordinator_id || null, showPlanning]);

    const department = result.rows[0];
    await logAudit(actor_id, 'CREATE', 'department', department.id, `Creado departamento: ${department.name}. Coordinador ID: ${department.coordinator_id || 'Ninguno'}, Planificación: ${department.show_in_planning}`);

    return NextResponse.json({ success: true, department });
  } catch (error) {
    console.error('Error creating department:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Update Department
export async function PUT(request) {
  try {
    const { id, name, coordinator_id, show_in_planning, actor_id } = await request.json();

    if (!id || !name) {
      return NextResponse.json({ error: "ID y nombre del departamento son requeridos" }, { status: 400 });
    }

    const showPlanning = show_in_planning !== false;

    const result = await query(`
      UPDATE departments
      SET name = $1, coordinator_id = $2, show_in_planning = $3
      WHERE id = $4
      RETURNING *
    `, [name, coordinator_id || null, showPlanning, id]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Departamento no encontrado" }, { status: 404 });
    }

    const department = result.rows[0];
    await logAudit(actor_id, 'UPDATE', 'department', department.id, `Modificado departamento: ${department.name}. Coordinador ID: ${department.coordinator_id || 'Ninguno'}, Planificación: ${department.show_in_planning}`);

    return NextResponse.json({ success: true, department });
  } catch (error) {
    console.error('Error updating department:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Delete Department
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const actor_id = searchParams.get('actor_id');

    if (!id) {
      return NextResponse.json({ error: "ID del departamento es requerido" }, { status: 400 });
    }

    const result = await query(`DELETE FROM departments WHERE id = $1 RETURNING *`, [id]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Departamento no encontrado" }, { status: 404 });
    }

    const department = result.rows[0];
    await logAudit(actor_id, 'DELETE', 'department', department.id, `Eliminado departamento: ${department.name}`);

    return NextResponse.json({ success: true, department });
  } catch (error) {
    console.error('Error deleting department:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

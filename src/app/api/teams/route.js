import { query } from '@/lib/db';
import { logAudit } from '@/lib/audit';
import { NextResponse } from 'next/server';

// Get teams list
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const departmentId = searchParams.get('departmentId');

    let queryStr = `
      SELECT t.*, d.name AS department_name, e.name AS coordinator_name
      FROM teams t
      JOIN departments d ON t.department_id = d.id
      LEFT JOIN employees e ON t.coordinator_id = e.id
    `;
    const params = [];

    if (departmentId) {
      queryStr += ` WHERE t.department_id = $1`;
      params.push(parseInt(departmentId));
    }

    queryStr += ` ORDER BY t.name ASC`;
    const result = await query(queryStr, params);

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching teams:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Create team
export async function POST(request) {
  try {
    const { name, department_id, coordinator_id, actor_id } = await request.json();

    if (!name || !department_id) {
      return NextResponse.json({ error: 'Nombre y departamento son obligatorios' }, { status: 400 });
    }

    const result = await query(`
      INSERT INTO teams (name, department_id, coordinator_id)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [name, parseInt(department_id), coordinator_id ? parseInt(coordinator_id) : null]);

    const newTeam = result.rows[0];

    // Log audit trail
    await logAudit(actor_id, 'CREATE', 'team', newTeam.id, `Creado equipo: ${newTeam.name} en departamento ID: ${newTeam.department_id}`);

    return NextResponse.json({ success: true, team: newTeam });
  } catch (error) {
    console.error('Error creating team:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Update team
export async function PUT(request) {
  try {
    const { id, name, department_id, coordinator_id, actor_id } = await request.json();

    if (!id || !name || !department_id) {
      return NextResponse.json({ error: 'ID, nombre y departamento son obligatorios' }, { status: 400 });
    }

    const result = await query(`
      UPDATE teams
      SET name = $1, department_id = $2, coordinator_id = $3
      WHERE id = $4
      RETURNING *
    `, [name, parseInt(department_id), coordinator_id ? parseInt(coordinator_id) : null, parseInt(id)]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Equipo no encontrado' }, { status: 404 });
    }

    const updatedTeam = result.rows[0];

    await logAudit(actor_id, 'UPDATE', 'team', updatedTeam.id, `Modificado equipo: ${updatedTeam.name}`);

    return NextResponse.json({ success: true, team: updatedTeam });
  } catch (error) {
    console.error('Error updating team:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Delete team
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const actor_id = searchParams.get('actor_id');

    if (!id) {
      return NextResponse.json({ error: 'ID del equipo es obligatorio' }, { status: 400 });
    }

    const result = await query(`DELETE FROM teams WHERE id = $1 RETURNING *`, [parseInt(id)]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Equipo no encontrado' }, { status: 404 });
    }

    const deletedTeam = result.rows[0];

    await logAudit(actor_id, 'DELETE', 'team', deletedTeam.id, `Eliminado equipo: ${deletedTeam.name}`);

    return NextResponse.json({ success: true, team: deletedTeam });
  } catch (error) {
    console.error('Error deleting team:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

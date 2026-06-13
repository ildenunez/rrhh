import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

// Create Department
export async function POST(request) {
  try {
    const { name, coordinator_id } = await request.json();
    
    if (!name) {
      return NextResponse.json({ error: "Nombre del departamento es requerido" }, { status: 400 });
    }

    const result = await query(`
      INSERT INTO departments (name, coordinator_id)
      VALUES ($1, $2)
      RETURNING *
    `, [name, coordinator_id || null]);

    return NextResponse.json({ success: true, department: result.rows[0] });
  } catch (error) {
    console.error('Error creating department:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Update Department
export async function PUT(request) {
  try {
    const { id, name, coordinator_id } = await request.json();

    if (!id || !name) {
      return NextResponse.json({ error: "ID y nombre del departamento son requeridos" }, { status: 400 });
    }

    const result = await query(`
      UPDATE departments
      SET name = $1, coordinator_id = $2
      WHERE id = $3
      RETURNING *
    `, [name, coordinator_id || null, id]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Departamento no encontrado" }, { status: 404 });
    }

    return NextResponse.json({ success: true, department: result.rows[0] });
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

    if (!id) {
      return NextResponse.json({ error: "ID del departamento es requerido" }, { status: 400 });
    }

    const result = await query(`DELETE FROM departments WHERE id = $1 RETURNING *`, [id]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Departamento no encontrado" }, { status: 404 });
    }

    return NextResponse.json({ success: true, department: result.rows[0] });
  } catch (error) {
    console.error('Error deleting department:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

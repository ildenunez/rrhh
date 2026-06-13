import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

// GET all shifts
export async function GET() {
  try {
    const result = await query(`SELECT * FROM shifts ORDER BY id ASC`);
    return NextResponse.json({ success: true, shifts: result.rows });
  } catch (error) {
    console.error('Error fetching shifts:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST create shift
export async function POST(request) {
  try {
    const { name, color, start_time, end_time, start_time_2, end_time_2 } = await request.json();

    if (!name || !color) {
      return NextResponse.json({ error: "Nombre y color son requeridos" }, { status: 400 });
    }

    const result = await query(`
      INSERT INTO shifts (name, color, start_time, end_time, start_time_2, end_time_2)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [name, color, start_time || null, end_time || null, start_time_2 || null, end_time_2 || null]);

    return NextResponse.json({ success: true, shift: result.rows[0] });
  } catch (error) {
    console.error('Error creating shift:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT update shift
export async function PUT(request) {
  try {
    const { id, name, color, start_time, end_time, start_time_2, end_time_2 } = await request.json();

    if (!id || !name || !color) {
      return NextResponse.json({ error: "ID, nombre y color son requeridos" }, { status: 400 });
    }

    const result = await query(`
      UPDATE shifts
      SET name = $1, color = $2, start_time = $3, end_time = $4, start_time_2 = $5, end_time_2 = $6
      WHERE id = $7
      RETURNING *
    `, [name, color, start_time || null, end_time || null, start_time_2 || null, end_time_2 || null, id]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Turno no encontrado" }, { status: 404 });
    }

    return NextResponse.json({ success: true, shift: result.rows[0] });
  } catch (error) {
    console.error('Error updating shift:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE shift
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: "ID es requerido" }, { status: 400 });
    }

    const result = await query(`DELETE FROM shifts WHERE id = $1 RETURNING *`, [id]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Turno no encontrado" }, { status: 404 });
    }

    return NextResponse.json({ success: true, shift: result.rows[0] });
  } catch (error) {
    console.error('Error deleting shift:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

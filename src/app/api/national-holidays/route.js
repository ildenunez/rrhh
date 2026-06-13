import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

// Fetch all national holidays
export async function GET() {
  try {
    const result = await query(`
      SELECT id, name, TO_CHAR(date, 'YYYY-MM-DD') as date
      FROM national_holidays
      ORDER BY date ASC
    `);
    return NextResponse.json({ success: true, holidays: result.rows });
  } catch (error) {
    console.error('Error fetching national holidays:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Create a new national holiday
export async function POST(request) {
  try {
    const { name, date } = await request.json();
    
    if (!name || !date) {
      return NextResponse.json({ error: "Nombre y fecha son requeridos" }, { status: 400 });
    }

    const result = await query(`
      INSERT INTO national_holidays (name, date)
      VALUES ($1, $2)
      ON CONFLICT (date) DO UPDATE SET name = EXCLUDED.name
      RETURNING id, name, TO_CHAR(date, 'YYYY-MM-DD') as date
    `, [name, date]);

    return NextResponse.json({ success: true, holiday: result.rows[0] });
  } catch (error) {
    console.error('Error creating national holiday:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Delete a national holiday
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: "ID de festivo es requerido" }, { status: 400 });
    }

    const result = await query(`
      DELETE FROM national_holidays
      WHERE id = $1
      RETURNING id, name, TO_CHAR(date, 'YYYY-MM-DD') as date
    `, [id]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Festivo no encontrado" }, { status: 404 });
    }

    return NextResponse.json({ success: true, holiday: result.rows[0] });
  } catch (error) {
    console.error('Error deleting national holiday:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

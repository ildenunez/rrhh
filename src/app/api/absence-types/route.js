import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

// Fetch all absence types (nested with predefined ranges)
export async function GET() {
  try {
    const result = await query(`SELECT * FROM absence_types ORDER BY name ASC`);
    const absenceTypes = result.rows;

    for (let type of absenceTypes) {
      const rangesRes = await query(`
        SELECT * FROM absence_predefined_ranges 
        WHERE absence_type_id = $1 
        ORDER BY start_date ASC
      `, [type.id]);
      type.predefined_ranges = rangesRes.rows;
    }

    return NextResponse.json({ success: true, absenceTypes });
  } catch (error) {
    console.error('Error fetching absence types:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Create new absence type
export async function POST(request) {
  try {
    const { name, subtracts_days, fixed_days, predefined_ranges, show_in_record, visible_to_employees, visible_to_coordinators, visible_to_admins } = await request.json();

    if (!name) {
      return NextResponse.json({ error: "Nombre del tipo de ausencia es requerido" }, { status: 400 });
    }

    const parsedFixedDays = fixed_days !== undefined && fixed_days !== '' ? parseInt(fixed_days) : null;

    const result = await query(`
      INSERT INTO absence_types (name, subtracts_days, fixed_days, show_in_record, visible_to_employees, visible_to_coordinators, visible_to_admins)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [
      name, 
      !!subtracts_days, 
      parsedFixedDays, 
      show_in_record !== false,
      visible_to_employees !== false,
      visible_to_coordinators !== false,
      visible_to_admins !== false
    ]);

    const newAbsenceType = result.rows[0];

    // Insert predefined ranges if provided
    if (Array.isArray(predefined_ranges) && predefined_ranges.length > 0) {
      for (let range of predefined_ranges) {
        if (range.label && range.start_date && range.end_date) {
          await query(`
            INSERT INTO absence_predefined_ranges (absence_type_id, label, start_date, end_date)
            VALUES ($1, $2, $3, $4)
          `, [newAbsenceType.id, range.label, range.start_date, range.end_date]);
        }
      }
    }

    // Attach nested ranges for response
    const rangesRes = await query(`SELECT * FROM absence_predefined_ranges WHERE absence_type_id = $1`, [newAbsenceType.id]);
    newAbsenceType.predefined_ranges = rangesRes.rows;

    return NextResponse.json({ success: true, absenceType: newAbsenceType });
  } catch (error) {
    console.error('Error creating absence type:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Update absence type
export async function PUT(request) {
  try {
    const { id, name, subtracts_days, fixed_days, predefined_ranges, show_in_record, visible_to_employees, visible_to_coordinators, visible_to_admins } = await request.json();

    if (!id || !name) {
      return NextResponse.json({ error: "ID y nombre son obligatorios" }, { status: 400 });
    }

    const parsedFixedDays = fixed_days !== undefined && fixed_days !== '' ? parseInt(fixed_days) : null;

    const result = await query(`
      UPDATE absence_types
      SET name = $1, subtracts_days = $2, fixed_days = $3, show_in_record = $4, visible_to_employees = $5, visible_to_coordinators = $6, visible_to_admins = $7
      WHERE id = $8
      RETURNING *
    `, [
      name, 
      !!subtracts_days, 
      parsedFixedDays, 
      show_in_record !== false,
      visible_to_employees !== false,
      visible_to_coordinators !== false,
      visible_to_admins !== false,
      id
    ]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Tipo de ausencia no encontrado" }, { status: 404 });
    }

    const updatedAbsenceType = result.rows[0];

    // Delete existing predefined ranges and re-insert new ones
    await query(`DELETE FROM absence_predefined_ranges WHERE absence_type_id = $1`, [id]);

    if (Array.isArray(predefined_ranges) && predefined_ranges.length > 0) {
      for (let range of predefined_ranges) {
        if (range.label && range.start_date && range.end_date) {
          await query(`
            INSERT INTO absence_predefined_ranges (absence_type_id, label, start_date, end_date)
            VALUES ($1, $2, $3, $4)
          `, [id, range.label, range.start_date, range.end_date]);
        }
      }
    }

    // Attach nested ranges for response
    const rangesRes = await query(`SELECT * FROM absence_predefined_ranges WHERE absence_type_id = $1`, [id]);
    updatedAbsenceType.predefined_ranges = rangesRes.rows;

    return NextResponse.json({ success: true, absenceType: updatedAbsenceType });
  } catch (error) {
    console.error('Error updating absence type:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Delete absence type
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: "ID es requerido" }, { status: 400 });
    }

    // absence_predefined_ranges table is configured with ON DELETE CASCADE, so they will be deleted automatically!
    const result = await query(`DELETE FROM absence_types WHERE id = $1 RETURNING *`, [id]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Tipo de ausencia no encontrado" }, { status: 404 });
    }

    return NextResponse.json({ success: true, absenceType: result.rows[0] });
  } catch (error) {
    console.error('Error deleting absence type:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

// Fetch all EPI types and sizes
export async function GET() {
  try {
    const typesRes = await query('SELECT * FROM epi_types ORDER BY name ASC');
    const epiTypes = typesRes.rows;

    for (let type of epiTypes) {
      const sizesRes = await query('SELECT * FROM epi_sizes WHERE epi_type_id = $1 ORDER BY id ASC', [type.id]);
      type.sizes = sizesRes.rows;
    }

    return NextResponse.json(epiTypes);
  } catch (error) {
    console.error('Error fetching EPIs:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Manage EPI types and sizes (Admin only)
export async function POST(request) {
  try {
    const { action, name, description, type_id, size_name, size_id } = await request.json();

    if (action === 'create_type') {
      if (!name) return NextResponse.json({ error: 'Nombre obligatorio' }, { status: 400 });
      const res = await query(
        'INSERT INTO epi_types (name, description) VALUES ($1, $2) RETURNING *',
        [name, description || '']
      );
      return NextResponse.json({ success: true, type: res.rows[0] });

    } else if (action === 'delete_type') {
      if (!type_id) return NextResponse.json({ error: 'ID obligatorio' }, { status: 400 });
      await query('DELETE FROM epi_types WHERE id = $1', [parseInt(type_id)]);
      return NextResponse.json({ success: true });

    } else if (action === 'create_size') {
      if (!type_id || !size_name) return NextResponse.json({ error: 'Parámetros obligatorios faltantes' }, { status: 400 });
      
      // Check if size already exists for this type
      const checkRes = await query(
        'SELECT * FROM epi_sizes WHERE epi_type_id = $1 AND size_name = $2',
        [parseInt(type_id), size_name]
      );
      if (checkRes.rows.length > 0) {
        return NextResponse.json({ error: 'La talla ya existe para este EPI' }, { status: 400 });
      }

      const res = await query(
        'INSERT INTO epi_sizes (epi_type_id, size_name) VALUES ($1, $2) RETURNING *',
        [parseInt(type_id), size_name]
      );
      return NextResponse.json({ success: true, size: res.rows[0] });

    } else if (action === 'delete_size') {
      if (!size_id) return NextResponse.json({ error: 'ID obligatorio' }, { status: 400 });
      await query('DELETE FROM epi_sizes WHERE id = $1', [parseInt(size_id)]);
      return NextResponse.json({ success: true });

    } else {
      return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error modifying EPIs:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

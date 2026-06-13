import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

// Fetch all announcements
export async function GET() {
  try {
    const result = await query(`
      SELECT id, title, content, created_at
      FROM announcements
      ORDER BY created_at DESC
    `);
    return NextResponse.json({ success: true, announcements: result.rows });
  } catch (error) {
    console.error('Error fetching announcements:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Create a new announcement
export async function POST(request) {
  try {
    const { title, content } = await request.json();
    
    if (!title || !content) {
      return NextResponse.json({ error: "Título y contenido son requeridos" }, { status: 400 });
    }

    const result = await query(`
      INSERT INTO announcements (title, content)
      VALUES ($1, $2)
      RETURNING id, title, content, created_at
    `, [title, content]);

    return NextResponse.json({ success: true, announcement: result.rows[0] });
  } catch (error) {
    console.error('Error creating announcement:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Delete an announcement
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: "ID del anuncio es requerido" }, { status: 400 });
    }

    const result = await query(`
      DELETE FROM announcements
      WHERE id = $1
      RETURNING id, title, content, created_at
    `, [id]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Anuncio no encontrado" }, { status: 404 });
    }

    return NextResponse.json({ success: true, announcement: result.rows[0] });
  } catch (error) {
    console.error('Error deleting announcement:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

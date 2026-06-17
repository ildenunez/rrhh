import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'Falta userId' }, { status: 400 });
    }

    const res = await query(
      `SELECT * FROM in_app_notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50;`,
      [userId]
    );

    return NextResponse.json(res.rows);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, userId, markAllAsRead } = body;

    if (markAllAsRead && userId) {
      await query(
        `UPDATE in_app_notifications SET is_read = TRUE WHERE user_id = $1 AND is_read = FALSE;`,
        [userId]
      );
      return NextResponse.json({ success: true, message: 'Todas las notificaciones marcadas como leídas' });
    }

    if (id) {
      await query(
        `UPDATE in_app_notifications SET is_read = TRUE WHERE id = $1;`,
        [id]
      );
      return NextResponse.json({ success: true, message: 'Notificación marcada como leída' });
    }

    return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 });
  } catch (error) {
    console.error('Error updating notifications:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

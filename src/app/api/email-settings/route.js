import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const res = await query(`SELECT * FROM email_notification_settings ORDER BY id ASC`);
    return NextResponse.json(res.rows);
  } catch (error) {
    console.error('Error fetching email settings:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const settings = await request.json();
    if (!Array.isArray(settings)) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }

    for (let setting of settings) {
      await query(`
        UPDATE email_notification_settings
        SET notify_employee = $1, notify_coordinator = $2, notify_admin = $3
        WHERE event_key = $4
      `, [setting.notify_employee, setting.notify_coordinator, setting.notify_admin, setting.event_key]);
    }

    return NextResponse.json({ success: true, message: "Ajustes de notificaciones actualizados correctamente." });
  } catch (error) {
    console.error('Error updating email settings:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

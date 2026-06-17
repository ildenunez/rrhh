import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const res = await query(`
      SELECT t.*, s.event_name 
      FROM email_templates t
      JOIN email_notification_settings s ON t.event_key = s.event_key
      ORDER BY t.event_key ASC
    `);
    return NextResponse.json(res.rows);
  } catch (error) {
    console.error('Error fetching email templates:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const { event_key, subject, body_html } = await request.json();

    if (!event_key || !subject || !body_html) {
      return NextResponse.json({ error: "Faltan datos obligatorios." }, { status: 400 });
    }

    await query(`
      UPDATE email_templates
      SET subject = $1, body_html = $2
      WHERE event_key = $3
    `, [subject, body_html, event_key]);

    return NextResponse.json({ success: true, message: "Plantilla actualizada correctamente." });
  } catch (error) {
    console.error('Error updating email template:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

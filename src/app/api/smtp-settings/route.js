import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const res = await query(`SELECT * FROM smtp_settings LIMIT 1`);
    return NextResponse.json(res.rows[0] || {});
  } catch (error) {
    console.error('Error fetching SMTP settings:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const { host, port, smtp_user, smtp_pass, from_email, is_secure } = await request.json();

    const check = await query(`SELECT id FROM smtp_settings LIMIT 1`);
    if (check.rows.length === 0) {
      await query(`
        INSERT INTO smtp_settings (host, port, smtp_user, smtp_pass, from_email, is_secure)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [host, port, smtp_user, smtp_pass, from_email, !!is_secure]);
    } else {
      await query(`
        UPDATE smtp_settings
        SET host = $1, port = $2, smtp_user = $3, smtp_pass = $4, from_email = $5, is_secure = $6
        WHERE id = $7
      `, [host, port, smtp_user, smtp_pass, from_email, !!is_secure, check.rows[0].id]);
    }

    return NextResponse.json({ success: true, message: "Ajustes SMTP actualizados correctamente." });
  } catch (error) {
    console.error('Error updating SMTP settings:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

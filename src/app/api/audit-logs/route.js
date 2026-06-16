import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const targetType = searchParams.get('targetType');
    
    let queryStr = `
      SELECT al.*, emp.name AS actor_name, emp.email AS actor_email
      FROM audit_logs al
      LEFT JOIN employees emp ON al.actor_id = emp.id
    `;
    const params = [];
    
    if (targetType) {
      queryStr += ` WHERE al.target_type = $1`;
      params.push(targetType);
    }
    
    queryStr += ` ORDER BY al.created_at DESC LIMIT 200`;
    
    const logsResult = await query(queryStr, params);
    
    return NextResponse.json({ success: true, logs: logsResult.rows });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import { query } from './db';

export async function logAudit(actorId, action, targetType, targetId, details) {
  try {
    const parsedActorId = actorId ? parseInt(actorId) : null;
    const parsedTargetId = targetId ? parseInt(targetId) : null;
    
    await query(`
      INSERT INTO audit_logs (actor_id, action, target_type, target_id, details)
      VALUES ($1, $2, $3, $4, $5)
    `, [parsedActorId, action, targetType, parsedTargetId, details || '']);
  } catch (error) {
    console.error('Error writing audit log:', error);
  }
}

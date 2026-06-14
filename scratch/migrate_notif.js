const { Pool } = require('pg');
const pool = new Pool({
  connectionString: "postgresql://neondb_owner:npg_kz9fdjP2Yemv@ep-twilight-bird-ab6g62rk-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    console.log("Creating email_notification_settings table...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS email_notification_settings (
        id SERIAL PRIMARY KEY,
        event_key VARCHAR(100) UNIQUE NOT NULL,
        event_name VARCHAR(150) NOT NULL,
        notify_employee BOOLEAN NOT NULL DEFAULT TRUE,
        notify_coordinator BOOLEAN NOT NULL DEFAULT TRUE,
        notify_admin BOOLEAN NOT NULL DEFAULT TRUE
      );
    `);

    console.log("Seeding default notification settings...");
    await pool.query(`
      INSERT INTO email_notification_settings (event_key, event_name, notify_employee, notify_coordinator, notify_admin)
      VALUES 
        ('request_created', 'Nueva solicitud de ausencia/horas', TRUE, TRUE, TRUE),
        ('request_resolved', 'Solicitud aprobada o rechazada', TRUE, FALSE, FALSE),
        ('shift_changed', 'Asignación o cambio de turno', TRUE, FALSE, FALSE),
        ('epi_requested', 'Nueva solicitud de EPI', FALSE, TRUE, TRUE),
        ('epi_delivered', 'Entrega de EPI registrada', TRUE, FALSE, FALSE),
        ('announcement_created', 'Nuevo comunicado publicado en el muro', TRUE, TRUE, TRUE)
      ON CONFLICT (event_key) DO NOTHING;
    `);

    console.log("Migration successful!");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await pool.end();
  }
}
main();

const { Pool } = require('pg');
const pool = new Pool({
  connectionString: "postgresql://neondb_owner:npg_kz9fdjP2Yemv@ep-twilight-bird-ab6g62rk-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
});
(async () => {
  try {
    const resRequests = await pool.query('DELETE FROM requests');
    const resEpis = await pool.query('DELETE FROM epi_requests');
    console.log(`Eliminadas ${resRequests.rowCount} solicitudes de la tabla 'requests'.`);
    console.log(`Eliminadas ${resEpis.rowCount} solicitudes de la tabla 'epi_requests'.`);
  } catch (e) {
    console.error(e);
  } finally {
    await pool.end();
  }
})();

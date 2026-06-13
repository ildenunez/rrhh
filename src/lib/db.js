import { Pool } from 'pg';

let pool;

if (!global._postgresPool) {
  global._postgresPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false // Necessary for Neon SSL connection in node env
    }
  });
}
pool = global._postgresPool;

export async function query(text, params) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  // console.log('executed query', { text, duration, rows: res.rowCount });
  return res;
}

export default pool;

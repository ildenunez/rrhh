const { Pool } = require('pg');
const pool = new Pool({
  connectionString: "postgresql://neondb_owner:npg_kz9fdjP2Yemv@ep-twilight-bird-ab6g62rk-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
  ssl: { rejectUnauthorized: false }
});

async function main() {
  const email = 'ilde@centrohogarsanchez.es';
  const name = 'Ilde';
  const role = 'admin';
  const password = '8019';
  
  try {
    const res = await pool.query('SELECT * FROM employees WHERE email = $1', [email]);
    if (res.rows.length > 0) {
      // Update
      await pool.query(
        'UPDATE employees SET name = $1, role = $2, password_hash = $3 WHERE email = $4',
        [name, role, password, email]
      );
      console.log('User Ilde updated successfully.');
    } else {
      // Insert
      await pool.query(
        'INSERT INTO employees (name, email, role, password_hash, vacation_days, extra_hours) VALUES ($1, $2, $3, $4, 30, 0)',
        [name, email, role, password]
      );
      console.log('User Ilde inserted successfully.');
    }
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}
main();

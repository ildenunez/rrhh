import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // 1. Create tables IF NOT EXISTS
    await query(`
      CREATE TABLE IF NOT EXISTS departments (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        coordinator_id INT
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS employees (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        role VARCHAR(20) NOT NULL CHECK (role IN ('employee', 'coordinator', 'admin')),
        department_id INT REFERENCES departments(id) ON DELETE SET NULL,
        vacation_days INT NOT NULL DEFAULT 30,
        extra_hours DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        password_hash VARCHAR(100) NOT NULL,
        birth_date DATE DEFAULT NULL
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS time_records (
        id SERIAL PRIMARY KEY,
        employee_id INT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        created_by INT REFERENCES employees(id) ON DELETE SET NULL,
        type VARCHAR(20) NOT NULL CHECK (type IN ('vacation', 'extra_hours')),
        amount DECIMAL(10, 2) NOT NULL,
        remaining_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        observation TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create absence_types
    await query(`
      CREATE TABLE IF NOT EXISTS absence_types (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        subtracts_days BOOLEAN NOT NULL DEFAULT FALSE,
        fixed_days INT DEFAULT NULL
      );
    `);

    // Create absence_predefined_ranges
    await query(`
      CREATE TABLE IF NOT EXISTS absence_predefined_ranges (
        id SERIAL PRIMARY KEY,
        absence_type_id INT NOT NULL REFERENCES absence_types(id) ON DELETE CASCADE,
        label VARCHAR(150) NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL
      );
    `);

    // Create requests if not exists
    await query(`
      CREATE TABLE IF NOT EXISTS requests (
        id SERIAL PRIMARY KEY,
        employee_id INT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        type VARCHAR(30) NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        observation TEXT,
        original_record_id INT REFERENCES time_records(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        resolved_by INT REFERENCES employees(id) ON DELETE SET NULL,
        resolved_at TIMESTAMP
      );
    `);

    // Create shifts
    await query(`
      CREATE TABLE IF NOT EXISTS shifts (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        color VARCHAR(20) NOT NULL,
        start_time TIME DEFAULT NULL,
        end_time TIME DEFAULT NULL,
        start_time_2 TIME DEFAULT NULL,
        end_time_2 TIME DEFAULT NULL
      );
    `);

    // Ensure split shift columns exist
    await query(`ALTER TABLE shifts ADD COLUMN IF NOT EXISTS start_time_2 TIME DEFAULT NULL;`);
    await query(`ALTER TABLE shifts ADD COLUMN IF NOT EXISTS end_time_2 TIME DEFAULT NULL;`);

    // Create employee_shifts
    await query(`
      CREATE TABLE IF NOT EXISTS employee_shifts (
        id SERIAL PRIMARY KEY,
        employee_id INT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        shift_id INT REFERENCES shifts(id) ON DELETE SET NULL,
        date DATE NOT NULL,
        CONSTRAINT unique_emp_date UNIQUE (employee_id, date)
      );
    `);

    // Create national_holidays
    await query(`
      CREATE TABLE IF NOT EXISTS national_holidays (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        date DATE UNIQUE NOT NULL
      );
    `);

    // Create announcements table
    await query(`
      CREATE TABLE IF NOT EXISTS announcements (
        id SERIAL PRIMARY KEY,
        title VARCHAR(200) NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create email_notification_settings table
    await query(`
      CREATE TABLE IF NOT EXISTS email_notification_settings (
        id SERIAL PRIMARY KEY,
        event_key VARCHAR(100) UNIQUE NOT NULL,
        event_name VARCHAR(150) NOT NULL,
        notify_employee BOOLEAN NOT NULL DEFAULT TRUE,
        notify_coordinator BOOLEAN NOT NULL DEFAULT TRUE,
        notify_admin BOOLEAN NOT NULL DEFAULT TRUE
      );
    `);

    // Seed default email notification settings if empty
    const emailSettingsCount = await query(`SELECT COUNT(*) FROM email_notification_settings;`);
    if (parseInt(emailSettingsCount.rows[0].count) === 0) {
      await query(`
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
    }

    // Create epi_types table
    await query(`
      CREATE TABLE IF NOT EXISTS epi_types (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create epi_sizes table
    await query(`
      CREATE TABLE IF NOT EXISTS epi_sizes (
        id SERIAL PRIMARY KEY,
        epi_type_id INT NOT NULL REFERENCES epi_types(id) ON DELETE CASCADE,
        size_name VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_type_size UNIQUE (epi_type_id, size_name)
      );
    `);

    // Create epi_requests table
    await query(`
      CREATE TABLE IF NOT EXISTS epi_requests (
        id SERIAL PRIMARY KEY,
        employee_id INT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        epi_type_id INT NOT NULL REFERENCES epi_types(id) ON DELETE CASCADE,
        size_id INT NOT NULL REFERENCES epi_sizes(id) ON DELETE CASCADE,
        status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'delivered')),
        requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        delivered_at TIMESTAMP DEFAULT NULL,
        delivered_by INT REFERENCES employees(id) ON DELETE SET NULL
      );
    `);

    // Seed default EPI types and sizes if table is empty
    const epiTypesCount = await query(`SELECT COUNT(*) FROM epi_types;`);
    if (parseInt(epiTypesCount.rows[0].count) === 0) {
      const type1 = await query(`INSERT INTO epi_types (name, description) VALUES ('Chaleco Reflectante', 'Chaleco de alta visibilidad clase 2') RETURNING id;`);
      const type2 = await query(`INSERT INTO epi_types (name, description) VALUES ('Calzado de Seguridad', 'Botas con puntera de acero S3') RETURNING id;`);
      const type3 = await query(`INSERT INTO epi_types (name, description) VALUES ('Casco de Protección', 'Casco homologado para obra/taller') RETURNING id;`);
      const type4 = await query(`INSERT INTO epi_types (name, description) VALUES ('Guantes de Protección', 'Guantes de nitrilo resistente a cortes y abrasiones') RETURNING id;`);

      const idChaleco = type1.rows[0].id;
      const idCalzado = type2.rows[0].id;
      const idCasco = type3.rows[0].id;
      const idGuantes = type4.rows[0].id;

      // Seed sizes for Chaleco Reflectante
      await query(`INSERT INTO epi_sizes (epi_type_id, size_name) VALUES ($1, 'M'), ($1, 'L'), ($1, 'XL'), ($1, 'XXL');`, [idChaleco]);
      // Seed sizes for Calzado de Seguridad
      await query(`INSERT INTO epi_sizes (epi_type_id, size_name) VALUES ($1, '39'), ($1, '40'), ($1, '41'), ($1, '42'), ($1, '43'), ($1, '44');`, [idCalzado]);
      // Seed sizes for Casco de Protección
      await query(`INSERT INTO epi_sizes (epi_type_id, size_name) VALUES ($1, 'Única');`, [idCasco]);
      // Seed sizes for Guantes de Protección
      await query(`INSERT INTO epi_sizes (epi_type_id, size_name) VALUES ($1, 'S'), ($1, 'M'), ($1, 'L'), ($1, 'XL');`, [idGuantes]);
    }


    // Seed default holidays if empty
    const holidaysCount = await query(`SELECT COUNT(*) FROM national_holidays;`);
    if (parseInt(holidaysCount.rows[0].count) === 0) {
      await query(`
        INSERT INTO national_holidays (name, date) VALUES
          ('Año Nuevo', '2026-01-01'),
          ('Viernes Santo', '2026-04-03'),
          ('Fiesta del Trabajo', '2026-05-01'),
          ('Asunción de la Virgen', '2026-08-15'),
          ('Fiesta Nacional de España', '2026-10-12'),
          ('Todos los Santos', '2026-11-01'),
          ('Día de la Constitución', '2026-12-06'),
          ('Inmaculada Concepción', '2026-12-08'),
          ('Navidad', '2026-12-25')
        ON CONFLICT (date) DO NOTHING;
      `);
    }

    // Alter requests table columns
    await query(`ALTER TABLE employees ADD COLUMN IF NOT EXISTS birth_date DATE DEFAULT NULL;`);
    await query(`ALTER TABLE employees ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(255) DEFAULT NULL;`);
    await query(`ALTER TABLE requests ADD COLUMN IF NOT EXISTS absence_type_id INT REFERENCES absence_types(id) ON DELETE SET NULL;`);
    await query(`ALTER TABLE requests ADD COLUMN IF NOT EXISTS start_date DATE DEFAULT NULL;`);
    await query(`ALTER TABLE requests ADD COLUMN IF NOT EXISTS end_date DATE DEFAULT NULL;`);
    await query(`ALTER TABLE requests ADD COLUMN IF NOT EXISTS consumed_credits JSONB DEFAULT NULL;`);
    await query(`ALTER TABLE requests ADD COLUMN IF NOT EXISTS is_historical BOOLEAN NOT NULL DEFAULT FALSE;`);
    await query(`ALTER TABLE absence_types ADD COLUMN IF NOT EXISTS show_in_record BOOLEAN NOT NULL DEFAULT TRUE;`);
    await query(`ALTER TABLE absence_types ADD COLUMN IF NOT EXISTS visible_to_employees BOOLEAN NOT NULL DEFAULT TRUE;`);
    await query(`ALTER TABLE absence_types ADD COLUMN IF NOT EXISTS visible_to_coordinators BOOLEAN NOT NULL DEFAULT TRUE;`);
    await query(`ALTER TABLE absence_types ADD COLUMN IF NOT EXISTS visible_to_admins BOOLEAN NOT NULL DEFAULT TRUE;`);

    // Drop and re-add constraints to support both old and new types
    await query(`ALTER TABLE requests DROP CONSTRAINT IF EXISTS requests_type_check;`);
    await query(`
      ALTER TABLE requests ADD CONSTRAINT requests_type_check CHECK (
        type IN ('absence', 'hours_register', 'hours_festive', 'hours_free', 'hours_to_vacation', 'hours_payroll', 'vacation', 'extra_hours_worked', 'extra_hours_consumed')
      );
    `);

    // Alter epi_requests to support requested state
    await query(`ALTER TABLE epi_requests DROP CONSTRAINT IF EXISTS epi_requests_status_check;`);
    await query(`
      ALTER TABLE epi_requests ADD CONSTRAINT epi_requests_status_check CHECK (
        status IN ('pending', 'requested', 'delivered')
      );
    `);

    // Add constraint for status check
    await query(`ALTER TABLE requests DROP CONSTRAINT IF EXISTS requests_status_check;`);
    await query(`
      ALTER TABLE requests ADD CONSTRAINT requests_status_check CHECK (
        status IN ('pending', 'approved', 'rejected')
      );
    `);

    // Add foreign key constraint if it doesn't already exist
    const constraintCheck = await query(`
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE constraint_name = 'fk_coordinator' AND table_name = 'departments';
    `);
    
    if (constraintCheck.rows.length === 0) {
      await query(`
        ALTER TABLE departments 
        ADD CONSTRAINT fk_coordinator 
        FOREIGN KEY (coordinator_id) REFERENCES employees(id) ON DELETE SET NULL;
      `);
    }

    // Seed default absence types if table is empty
    const absTypesCount = await query(`SELECT COUNT(*) FROM absence_types;`);
    if (parseInt(absTypesCount.rows[0].count) === 0) {
      const type1 = await query(`INSERT INTO absence_types (name, subtracts_days, fixed_days) VALUES ('Vacaciones', TRUE, NULL) RETURNING id;`);
      const type2 = await query(`INSERT INTO absence_types (name, subtracts_days, fixed_days) VALUES ('Baja Médica', FALSE, NULL) RETURNING id;`);
      const type3 = await query(`INSERT INTO absence_types (name, subtracts_days, fixed_days) VALUES ('Asuntos Propios', TRUE, NULL) RETURNING id;`);
      const type4 = await query(`INSERT INTO absence_types (name, subtracts_days, fixed_days) VALUES ('Asistencia al Médico', FALSE, NULL) RETURNING id;`);
      const type5 = await query(`INSERT INTO absence_types (name, subtracts_days, fixed_days) VALUES ('Matrimonio', FALSE, 15) RETURNING id;`);
      const type6 = await query(`INSERT INTO absence_types (name, subtracts_days, fixed_days) VALUES ('Nacimiento de Hijo', FALSE, 10) RETURNING id;`);
      
      // Seed "Vacaciones Verano 2027" with predefined ranges
      const type7 = await query(`INSERT INTO absence_types (name, subtracts_days, fixed_days) VALUES ('Vacaciones Verano 2027', TRUE, NULL) RETURNING id;`);
      const idVerano = type7.rows[0].id;
      
      await query(`
        INSERT INTO absence_predefined_ranges (absence_type_id, label, start_date, end_date) VALUES
          ($1, 'Turno Julio (01/07/2027 al 21/07/2027)', '2027-07-01', '2027-07-21'),
          ($1, 'Turno Agosto (01/08/2027 al 21/08/2027)', '2027-08-01', '2027-08-21');
      `, [idVerano]);
    }

    // Seed default shifts if table is empty
    const shiftsCount = await query(`SELECT COUNT(*) FROM shifts;`);
    if (parseInt(shiftsCount.rows[0].count) === 0) {
      await query(`
        INSERT INTO shifts (name, color, start_time, end_time, start_time_2, end_time_2) VALUES
          ('Mañana', '#3498db', '08:00:00', '16:00:00', NULL, NULL),
          ('Tarde', '#e67e22', '16:00:00', '00:00:00', NULL, NULL),
          ('Noche', '#9b59b6', '00:00:00', '08:00:00', NULL, NULL),
          ('Partido', '#1abc9c', '09:00:00', '14:00:00', '16:00:00', '19:00:00'),
          ('Libre', '#7f8c8d', NULL, NULL, NULL, NULL);
      `);
    }


    // Check if we already have data in employees
    const deptCountRes = await query(`SELECT COUNT(*) FROM departments;`);
    const empCountRes = await query(`SELECT COUNT(*) FROM employees;`);
    
    const hasDepartments = parseInt(deptCountRes.rows[0].count) > 0;
    const hasEmployees = parseInt(empCountRes.rows[0].count) > 0;

    if (hasDepartments || hasEmployees) {
      return NextResponse.json({ 
        success: true, 
        message: 'Tablas actualizadas. Estructura de ausencias predefinidas creada y datos sincronizados.' 
      });
    }

    // Seed Departments
    const deptVentas = await query(`INSERT INTO departments (name) VALUES ('Ventas') RETURNING id;`);
    const deptDesarrollo = await query(`INSERT INTO departments (name) VALUES ('Desarrollo') RETURNING id;`);
    const deptSoporte = await query(`INSERT INTO departments (name) VALUES ('Soporte') RETURNING id;`);
    const deptMarketing = await query(`INSERT INTO departments (name) VALUES ('Marketing') RETURNING id;`);

    const idVentas = deptVentas.rows[0].id;
    const idDesarrollo = deptDesarrollo.rows[0].id;
    const idSoporte = deptSoporte.rows[0].id;
    const idMarketing = deptMarketing.rows[0].id;

    // Seed Coordinators
    const coord1 = await query(`
      INSERT INTO employees (name, email, role, department_id, vacation_days, extra_hours, password_hash)
      VALUES ('Roberto Martínez', 'roberto@empresa.com', 'coordinator', $1, 28, 4.50, 'mock_hash')
      RETURNING id;
    `, [idVentas]);

    const coord2 = await query(`
      INSERT INTO employees (name, email, role, department_id, vacation_days, extra_hours, password_hash)
      VALUES ('Laura Rodríguez', 'laura@empresa.com', 'coordinator', $1, 25, 8.00, 'mock_hash')
      RETURNING id;
    `, [idDesarrollo]);

    const idCoord1 = coord1.rows[0].id;
    const idCoord2 = coord2.rows[0].id;

    // Set coordinators of departments
    await query(`UPDATE departments SET coordinator_id = $1 WHERE id = $2;`, [idCoord1, idVentas]);
    await query(`UPDATE departments SET coordinator_id = $1 WHERE id = $2;`, [idCoord2, idDesarrollo]);
    await query(`UPDATE departments SET coordinator_id = $1 WHERE id = $2;`, [idCoord2, idMarketing]);

    // Seed Admins
    const admin1 = await query(`
      INSERT INTO employees (name, email, role, vacation_days, extra_hours, password_hash)
      VALUES ('Elena Sanz', 'elena@empresa.com', 'admin', 30, 0.00, 'mock_hash')
      RETURNING id;
    `);
    const admin2 = await query(`
      INSERT INTO employees (name, email, role, vacation_days, extra_hours, password_hash)
      VALUES ('Sofía Castro', 'sofia@empresa.com', 'admin', 30, 2.50, 'mock_hash')
      RETURNING id;
    `);

    // Seed Employees
    const emp1 = await query(`
      INSERT INTO employees (name, email, role, department_id, vacation_days, extra_hours, password_hash)
      VALUES 
        ('Juan Pérez', 'juan@empresa.com', 'employee', $1, 22, 10.00, 'mock_hash'),
        ('María López', 'maria@empresa.com', 'employee', $1, 15, 0.00, 'mock_hash'),
        ('Carlos García', 'carlos@empresa.com', 'employee', $2, 20, 15.50, 'mock_hash'),
        ('Ana Gómez', 'ana@empresa.com', 'employee', $2, 30, 0.00, 'mock_hash'),
        ('Pedro Picapiedra', 'pedro@empresa.com', 'employee', $3, 12, 1.25, 'mock_hash'),
        ('Lucas Grijander', 'lucas@empresa.com', 'employee', $4, 25, 0.00, 'mock_hash')
      RETURNING id, vacation_days, extra_hours;
    `, [idVentas, idDesarrollo, idSoporte, idMarketing]);

    const seededEmps = [
      { id: idCoord1, vacation_days: 28, extra_hours: 4.50 },
      { id: idCoord2, vacation_days: 25, extra_hours: 8.00 },
      { id: admin1.rows[0].id, vacation_days: 30, extra_hours: 0.00 },
      { id: admin2.rows[0].id, vacation_days: 30, extra_hours: 2.50 },
      ...emp1.rows
    ];

    for (let emp of seededEmps) {
      if (emp.vacation_days > 0) {
        await query(`
          INSERT INTO time_records (employee_id, type, amount, remaining_amount, observation)
          VALUES ($1, 'vacation', $2, 0, 'Saldo inicial de vacaciones');
        `, [emp.id, emp.vacation_days]);
      }
      if (emp.extra_hours > 0) {
        await query(`
          INSERT INTO time_records (employee_id, type, amount, remaining_amount, observation)
          VALUES ($1, 'extra_hours', $2, $2, 'Saldo inicial de horas extras');
        `, [emp.id, emp.extra_hours]);
      }
    }

    return NextResponse.json({ success: true, message: 'Base de datos inicializada con ausencias avanzadas, rangos y trazabilidad activa.' });
  } catch (error) {
    console.error('Failed to setup database:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

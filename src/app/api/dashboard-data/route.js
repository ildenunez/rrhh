import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  try {
    const enrichPendingRequestsWithConflicts = async (requests) => {
      for (let req of requests) {
        if (req.type === 'absence' && req.start_date && req.end_date) {
          const conflictsRes = await query(`
            SELECT DISTINCT e.name AS employee_name, ab.name AS absence_type, r2.start_date, r2.end_date, r2.status
            FROM requests r2
            JOIN employees e ON r2.employee_id = e.id
            LEFT JOIN absence_types ab ON r2.absence_type_id = ab.id
            WHERE r2.type = 'absence'
              AND r2.status IN ('approved', 'pending')
              AND r2.id != $4
              AND e.department_id = (SELECT department_id FROM employees WHERE id = $1)
              AND e.id != $1
              AND NOT ($2 > r2.end_date OR $3 < r2.start_date)
          `, [req.employee_id, req.start_date, req.end_date, req.id]);
          req.conflicts = conflictsRes.rows;
        } else {
          req.conflicts = [];
        }
      }
    };

    // Fetch all users for switcher dropdown
    const allUsersResult = await query(`
      SELECT e.id, e.name, e.role, d.name AS department_name, e.avatar_url 
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      ORDER BY e.id ASC
    `);
    const allUsers = allUsersResult.rows;

    if (!userId) {
      return NextResponse.json({ allUsers, error: "No user selected" });
    }

    // Fetch details of active user
    const userResult = await query(`
      SELECT e.id, e.name, e.email, e.role, e.department_id, e.vacation_days, e.extra_hours, d.name AS department_name, e.birth_date, e.avatar_url
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE e.id = $1
    `, [userId]);

    if (userResult.rows.length === 0) {
      return NextResponse.json({ allUsers, error: "User not found" }, { status: 404 });
    }

    const currentUser = userResult.rows[0];

    // Fetch department IDs managed by this user
    const managedDeptsResult = await query(`
      SELECT id FROM departments WHERE coordinator_id = $1
    `, [currentUser.id]);
    currentUser.managed_department_ids = managedDeptsResult.rows.map(row => row.id);

    // Fetch all absence types nested with their predefined ranges
    const absTypesResult = await query(`SELECT * FROM absence_types ORDER BY name ASC`);
    const absenceTypes = absTypesResult.rows;
    
    for (let type of absenceTypes) {
      const rangesRes = await query(`
        SELECT * FROM absence_predefined_ranges 
        WHERE absence_type_id = $1 
        ORDER BY start_date ASC
      `, [type.id]);
      type.predefined_ranges = rangesRes.rows;
    }

    // Fetch all shifts
    const shiftsRes = await query(`SELECT * FROM shifts ORDER BY id ASC`);
    const allShifts = shiftsRes.rows;

    // Fetch national holidays
    const holidaysRes = await query(`SELECT id, name, TO_CHAR(date, 'YYYY-MM-DD') as date FROM national_holidays ORDER BY date ASC`);
    const nationalHolidays = holidaysRes.rows;

    // Fetch announcements
    const announcementsRes = await query(`SELECT id, title, content, created_at FROM announcements ORDER BY created_at DESC`);
    const announcements = announcementsRes.rows;

    let dashboardData = {
      user: currentUser,
      allUsers,
      absenceTypes,
      allShifts,
      nationalHolidays,
      announcements
    };

    const requestFieldsQuery = `
      r.id, r.employee_id, r.type, r.amount, r.status, r.observation, r.original_record_id, r.created_at, r.resolved_by, r.resolved_at,
      ab.name AS absence_type_name, ab.subtracts_days AS absence_subtracts_days, r.start_date, r.end_date, ab.show_in_record AS absence_show_in_record,
      r.consumed_credits
    `;

    const requestJoin = `
      LEFT JOIN absence_types ab ON r.absence_type_id = ab.id
    `;

    if (currentUser.role === 'employee') {
      // 1. Employee view
      let coordinator = null;
      let colleagues = [];

      if (currentUser.department_id) {
        const coordResult = await query(`
          SELECT e.id, e.name, e.email 
          FROM departments d 
          JOIN employees e ON d.coordinator_id = e.id 
          WHERE d.id = $1
        `, [currentUser.department_id]);
        if (coordResult.rows.length > 0) {
          coordinator = coordResult.rows[0];
        }

        // Get colleagues
        const colleaguesResult = await query(`
          SELECT id, name, email, role, vacation_days, extra_hours 
          FROM employees 
          WHERE department_id = $1 AND id != $2
          ORDER BY name ASC
        `, [currentUser.department_id, currentUser.id]);
        colleagues = colleaguesResult.rows;
      }

      // Fetch employee's pending requests
      const pendingReqs = await query(`
        SELECT ${requestFieldsQuery}
        FROM requests r 
        ${requestJoin}
        WHERE r.employee_id = $1 AND r.status = 'pending'
          AND (r.absence_type_id IS NULL OR ab.show_in_record IS NOT FALSE)
        ORDER BY r.created_at DESC
      `, [currentUser.id]);

      // Fetch employee's approved/rejected requests
      const resolvedReqs = await query(`
        SELECT ${requestFieldsQuery}, res.name AS resolver_name
        FROM requests r 
        ${requestJoin}
        LEFT JOIN employees res ON r.resolved_by = res.id
        WHERE r.employee_id = $1 AND r.status IN ('approved', 'rejected')
          AND (r.absence_type_id IS NULL OR ab.show_in_record IS NOT FALSE)
        ORDER BY r.resolved_at DESC
      `, [currentUser.id]);

      dashboardData = {
        ...dashboardData,
        coordinator,
        colleagues,
        pendingRequests: pendingReqs.rows,
        resolvedRequests: resolvedReqs.rows
      };

    } else if (currentUser.role === 'coordinator') {
      // 2. Coordinator view
      const managedDepts = await query(`
        SELECT id, name 
        FROM departments 
        WHERE coordinator_id = $1
        ORDER BY name ASC
      `, [currentUser.id]);
      const managedDepartments = managedDepts.rows;

      let managedEmployees = [];
      let teamPendingRequests = [];
      let teamResolvedRequests = [];

      if (managedDepartments.length > 0) {
        const deptIds = managedDepartments.map(d => d.id);
        const managedEmpsResult = await query(`
          SELECT e.id, e.name, e.email, e.role, e.vacation_days, e.extra_hours, d.name AS department_name, d.id AS department_id, d.show_in_planning AS department_show_in_planning, e.team_id, t.name AS team_name, e.birth_date, e.avatar_url
          FROM employees e
          JOIN departments d ON e.department_id = d.id
          LEFT JOIN teams t ON e.team_id = t.id
          WHERE d.id = ANY($1)
          ORDER BY e.name ASC
        `, [deptIds]);
        
        for (let emp of managedEmpsResult.rows) {
          const empManaged = await query(`SELECT id FROM departments WHERE coordinator_id = $1`, [emp.id]);
          emp.managed_department_ids = empManaged.rows.map(row => row.id);
        }
        managedEmployees = managedEmpsResult.rows;

        // Fetch pending requests of team members
        const teamPendingResult = await query(`
          SELECT ${requestFieldsQuery}, emp.name AS employee_name, emp.email AS employee_email
          FROM requests r 
          ${requestJoin}
          JOIN employees emp ON r.employee_id = emp.id
          WHERE emp.department_id = ANY($1) AND emp.id != $2 AND r.status = 'pending'
          ORDER BY r.created_at DESC
        `, [deptIds, currentUser.id]);
        teamPendingRequests = teamPendingResult.rows;
        await enrichPendingRequestsWithConflicts(teamPendingRequests);

        // Fetch resolved requests of team members
        const teamResolvedResult = await query(`
          SELECT ${requestFieldsQuery}, emp.name AS employee_name, emp.email AS employee_email, res.name AS resolver_name
          FROM requests r 
          ${requestJoin}
          JOIN employees emp ON r.employee_id = emp.id
          LEFT JOIN employees res ON r.resolved_by = res.id
          WHERE emp.department_id = ANY($1) AND emp.id != $2 AND r.status IN ('approved', 'rejected')
          ORDER BY r.resolved_at DESC
        `, [deptIds, currentUser.id]);
        teamResolvedRequests = teamResolvedResult.rows;
      }

      // Own requests
      const ownPendingReqs = await query(`
        SELECT ${requestFieldsQuery} FROM requests r ${requestJoin} WHERE r.employee_id = $1 AND r.status = 'pending' AND (r.absence_type_id IS NULL OR ab.show_in_record IS NOT FALSE) ORDER BY r.created_at DESC
      `, [currentUser.id]);
      const ownResolvedReqs = await query(`
        SELECT ${requestFieldsQuery}, res.name AS resolver_name FROM requests r ${requestJoin} LEFT JOIN employees res ON r.resolved_by = res.id WHERE r.employee_id = $1 AND r.status IN ('approved', 'rejected') AND (r.absence_type_id IS NULL OR ab.show_in_record IS NOT FALSE) ORDER BY r.resolved_at DESC
      `, [currentUser.id]);

      dashboardData = {
        ...dashboardData,
        managedDepartments,
        managedEmployees,
        teamPendingRequests,
        teamResolvedRequests,
        pendingRequests: ownPendingReqs.rows,
        resolvedRequests: ownResolvedReqs.rows
      };

      const allDeptsResult = await query(`
        SELECT d.id, d.name, d.coordinator_id, d.show_in_planning, e.name AS coordinator_name,
               (SELECT COUNT(*) FROM employees WHERE department_id = d.id) as employee_count
        FROM departments d
        LEFT JOIN employees e ON d.coordinator_id = e.id
        ORDER BY d.id ASC
      `);
      dashboardData.allDepartments = allDeptsResult.rows;

      const allTeamsResult = await query(`
        SELECT t.*, d.name AS department_name, e.name AS coordinator_name,
               (SELECT COUNT(*) FROM employees WHERE team_id = t.id) as employee_count
        FROM teams t
        JOIN departments d ON t.department_id = d.id
        LEFT JOIN employees e ON t.coordinator_id = e.id
        ORDER BY t.id ASC
      `);
      dashboardData.allTeams = allTeamsResult.rows;

    } else if (currentUser.role === 'admin') {
      // 3. Admin view
      const statsEmp = await query(`
        SELECT 
          COUNT(*) as total_employees, 
          COALESCE(SUM(vacation_days), 0) as total_vacations_pending, 
          COALESCE(SUM(extra_hours), 0) as total_extra_hours_pending 
        FROM employees
        WHERE role != 'external_worker'
      `);
      const statsTime = await query(`
        SELECT 
          COALESCE(SUM(CASE WHEN type IN ('add_vacation', 'manual_add_vacation') THEN amount ELSE 0 END), 0) as total_vacations_granted,
          COALESCE(SUM(CASE WHEN type IN ('add_extra_hours', 'manual_add_extra_hours', 'extra_hours_worked') THEN amount ELSE 0 END), 0) as total_extra_hours_granted
        FROM time_records
      `);
      const statsDept = await query(`SELECT COUNT(*) as total_departments FROM departments`);
      const statsPendingReqs = await query(`SELECT COUNT(*) as total_pending FROM requests WHERE status = 'pending'`);
      const statsSickLeave = await query(`
        SELECT DISTINCT e.id, e.name, e.email, ab.name AS absence_type, r.start_date, r.end_date
        FROM requests r
        JOIN absence_types ab ON r.absence_type_id = ab.id
        JOIN employees e ON r.employee_id = e.id
        WHERE r.type = 'absence'
          AND r.status = 'approved'
          AND LOWER(ab.name) LIKE '%baja%'
          AND CURRENT_DATE BETWEEN r.start_date AND r.end_date
      `);

      const allEmployeesResult = await query(`
        SELECT e.id, e.name, e.role, e.department_id, e.team_id, e.vacation_days, e.extra_hours, d.name AS department_name, d.show_in_planning AS department_show_in_planning, t.name AS team_name, e.birth_date, e.avatar_url, e.email
        FROM employees e
        LEFT JOIN departments d ON e.department_id = d.id
        LEFT JOIN teams t ON e.team_id = t.id
        ORDER BY e.id ASC
      `);

      for (let emp of allEmployeesResult.rows) {
        const empManaged = await query(`SELECT id FROM departments WHERE coordinator_id = $1`, [emp.id]);
        emp.managed_department_ids = empManaged.rows.map(row => row.id);
      }

      const allDeptsResult = await query(`
        SELECT d.id, d.name, d.coordinator_id, d.show_in_planning, e.name AS coordinator_name,
               (SELECT COUNT(*) FROM employees WHERE department_id = d.id) as employee_count
        FROM departments d
        LEFT JOIN employees e ON d.coordinator_id = e.id
        ORDER BY d.id ASC
      `);

      // Fetch all teams
      const allTeamsResult = await query(`
        SELECT t.*, d.name AS department_name, e.name AS coordinator_name,
               (SELECT COUNT(*) FROM employees WHERE team_id = t.id) as employee_count
        FROM teams t
        JOIN departments d ON t.department_id = d.id
        LEFT JOIN employees e ON t.coordinator_id = e.id
        ORDER BY t.id ASC
      `);

      const potentialCoordinatorsResult = await query(`
        SELECT id, name, role 
        FROM employees 
        WHERE role IN ('coordinator', 'admin')
        ORDER BY name ASC
      `);

      // Fetch all pending requests
      const allPendingResult = await query(`
        SELECT ${requestFieldsQuery}, emp.name AS employee_name, emp.email AS employee_email
        FROM requests r
        ${requestJoin}
        JOIN employees emp ON r.employee_id = emp.id
        WHERE r.status = 'pending'
        ORDER BY r.created_at DESC
      `);
      const allPendingRequests = allPendingResult.rows;
      await enrichPendingRequestsWithConflicts(allPendingRequests);

      // Fetch all resolved requests
      const allResolvedResult = await query(`
        SELECT ${requestFieldsQuery}, emp.name AS employee_name, emp.email AS employee_email, res.name AS resolver_name
        FROM requests r
        ${requestJoin}
        JOIN employees emp ON r.employee_id = emp.id
        LEFT JOIN employees res ON r.resolved_by = res.id
        WHERE r.status IN ('approved', 'rejected')
        ORDER BY r.resolved_at DESC
      `);

      // Own requests
      const ownPendingReqs = await query(`
        SELECT ${requestFieldsQuery} FROM requests r ${requestJoin} WHERE r.employee_id = $1 AND r.status = 'pending' AND (r.absence_type_id IS NULL OR ab.show_in_record IS NOT FALSE) ORDER BY r.created_at DESC
      `, [currentUser.id]);
      const ownResolvedReqs = await query(`
        SELECT ${requestFieldsQuery}, res.name AS resolver_name FROM requests r ${requestJoin} LEFT JOIN employees res ON r.resolved_by = res.id WHERE r.employee_id = $1 AND r.status IN ('approved', 'rejected') AND (r.absence_type_id IS NULL OR ab.show_in_record IS NOT FALSE) ORDER BY r.resolved_at DESC
      `, [currentUser.id]);

      // Fetch all time records (for overall history)
      const allTimeRecordsRes = await query(`
        SELECT tr.id, tr.employee_id, tr.created_by, tr.type, tr.amount, tr.remaining_amount, tr.observation, tr.created_at,
               emp.name AS employee_name, emp.email AS employee_email, res.name AS creator_name
        FROM time_records tr
        JOIN employees emp ON tr.employee_id = emp.id
        LEFT JOIN employees res ON tr.created_by = res.id
        ORDER BY tr.created_at DESC
      `);

      const totalEmp = parseInt(statsEmp.rows[0].total_employees);
      const activeEmp = totalEmp - statsSickLeave.rows.length;

      dashboardData = {
        ...dashboardData,
        stats: {
          totalEmployees: totalEmp,
          activeEmployees: activeEmp,
          totalVacationsPending: parseInt(statsEmp.rows[0].total_vacations_pending),
          totalVacationsGranted: parseInt(statsTime.rows[0].total_vacations_granted),
          totalExtraHoursPending: parseFloat(statsEmp.rows[0].total_extra_hours_pending || 0).toFixed(1),
          totalExtraHoursGranted: parseFloat(statsTime.rows[0].total_extra_hours_granted || 0).toFixed(1),
          totalDepartments: parseInt(statsDept.rows[0].total_departments),
          totalPendingRequests: parseInt(statsPendingReqs.rows[0].total_pending),
          totalSickLeave: statsSickLeave.rows.length
        },
        sickEmployees: statsSickLeave.rows,
        allEmployees: allEmployeesResult.rows,
        allDepartments: allDeptsResult.rows,
        allTeams: allTeamsResult.rows,
        potentialCoordinators: potentialCoordinatorsResult.rows,
        allPendingRequests,
        allResolvedRequests: allResolvedResult.rows,
        allTimeRecords: allTimeRecordsRes.rows,
        pendingRequests: ownPendingReqs.rows,
        resolvedRequests: ownResolvedReqs.rows
      };
    }

    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import nodemailer from 'nodemailer';
import { query } from '@/lib/db';

/**
 * Replaces {{variables}} in a string with values from a data object
 */
function compileTemplate(templateStr, data) {
  if (!templateStr) return '';
  return templateStr.replace(/\{\{(.*?)\}\}/g, (match, key) => {
    const value = data[key.trim()];
    return value !== undefined ? value : match;
  });
}

/**
 * Main email dispatcher function
 * @param {string} eventKey - The event key (e.g. 'request_created')
 * @param {object} targetEmployee - The employee object (needs name, email, department_id, team_id, etc.)
 * @param {object} eventData - Variables for the template (e.g. { request_id: 123, status_es: 'aprobada' })
 */
export async function sendNotificationEmail(eventKey, targetEmployee, eventData) {
  try {
    // 1. Fetch SMTP configuration
    const smtpRes = await query(`SELECT * FROM smtp_settings LIMIT 1`);
    if (smtpRes.rows.length === 0) {
      console.warn('SMTP settings not found. Email not sent.');
      return;
    }
    const smtpConfig = smtpRes.rows[0];

    if (!smtpConfig.host || !smtpConfig.smtp_user) {
      console.warn('SMTP host or user not configured. Email not sent.');
      return;
    }

    // 2. Fetch Notification Rules
    const rulesRes = await query(`SELECT * FROM email_notification_settings WHERE event_key = $1`, [eventKey]);
    if (rulesRes.rows.length === 0) return;
    const rules = rulesRes.rows[0];

    // 3. Fetch Template
    const tplRes = await query(`SELECT * FROM email_templates WHERE event_key = $1`, [eventKey]);
    if (tplRes.rows.length === 0) {
      console.warn(`Email template not found for event ${eventKey}`);
      return;
    }
    const template = tplRes.rows[0];

    // 4. Gather Recipients (both Email and User IDs)
    const recipientUsers = new Map(); // Map user_id -> { email, id }

    // Helper to add user
    const addUser = (user) => {
      if (user && user.id) {
        recipientUsers.set(user.id, { id: user.id, email: user.email });
      }
    };

    // 4.1 Employee
    if (rules.notify_employee && targetEmployee && targetEmployee.id) {
      addUser(targetEmployee);
    }

    // 4.2 Coordinator(s)
    if (rules.notify_coordinator && targetEmployee) {
      if (targetEmployee.team_id) {
        const teamRes = await query(`
          SELECT e.id, e.email 
          FROM teams t 
          JOIN employees e ON t.coordinator_id = e.id 
          WHERE t.id = $1
        `, [targetEmployee.team_id]);
        teamRes.rows.forEach(addUser);
      } else if (targetEmployee.department_id) {
        const deptRes = await query(`
          SELECT e.id, e.email 
          FROM departments d 
          JOIN employees e ON d.coordinator_id = e.id 
          WHERE d.id = $1
        `, [targetEmployee.department_id]);
        deptRes.rows.forEach(addUser);
      }
    }

    // 4.3 Admins
    if (rules.notify_admin) {
      const adminRes = await query(`SELECT id, email FROM employees WHERE role = 'admin'`);
      adminRes.rows.forEach(addUser);
    }

    if (recipientUsers.size === 0) {
      console.log(`No recipients found for event ${eventKey}`);
      return;
    }

    // 5. Prepare Payload
    const templateData = {
      app_name: 'RRHH Portal',
      employee_name: targetEmployee.name || 'Empleado',
      ...eventData
    };

    const subject = compileTemplate(template.subject, templateData);
    const html = compileTemplate(template.body_html, templateData);

    // 6. Send In-App Notifications
    const inAppTitle = subject;
    // Strip HTML from body_html for a plain text snippet
    let inAppMessage = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    if (inAppMessage.length > 250) inAppMessage = inAppMessage.substring(0, 247) + '...';

    for (const user of recipientUsers.values()) {
      try {
        await query(
          `INSERT INTO in_app_notifications (user_id, title, message) VALUES ($1, $2, $3)`,
          [user.id, inAppTitle, inAppMessage]
        );
      } catch (err) {
        console.error('Error inserting in-app notification for user', user.id, err);
      }
    }

    // 7. Setup Nodemailer Transporter
    const transporter = nodemailer.createTransport({
      host: smtpConfig.host,
      port: smtpConfig.port,
      secure: smtpConfig.is_secure,
      auth: {
        user: smtpConfig.smtp_user,
        pass: smtpConfig.smtp_pass,
      },
    });

    // 8. Send Emails
    const bccList = Array.from(recipientUsers.values())
      .filter(u => u.email)
      .map(u => u.email)
      .join(', ');

    if (!bccList) {
      console.log(`No valid email addresses found. Skip sending email.`);
      return;
    }
    const mailOptions = {
      from: smtpConfig.from_email || smtpConfig.smtp_user,
      to: smtpConfig.from_email || smtpConfig.smtp_user, // Send to self, bcc others
      bcc: bccList,
      subject: subject,
      html: html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Email dispatched successfully. Message ID: ${info.messageId}`);
    
  } catch (error) {
    console.error('Error dispatching email notification:', error);
  }
}

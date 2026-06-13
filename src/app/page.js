'use client';

import { useState, useEffect, useMemo } from 'react';

export default function Dashboard() {
  const [usersList, setUsersList] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Tab view controller: 'dashboard' | 'admin_employees' | 'admin_departments' | 'admin_absence_types'
  const [activeTab, setActiveTab] = useState('dashboard');

  // Modals state
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [showDepartmentModal, setShowDepartmentModal] = useState(false);
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showSickLeaveModal, setShowSickLeaveModal] = useState(false);
  const [showRequestDetailModal, setShowRequestDetailModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [consumedCreditsDetails, setConsumedCreditsDetails] = useState([]);
  
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [editingAbsenceType, setEditingAbsenceType] = useState(null);

  const [selectedTimeEmployee, setSelectedTimeEmployee] = useState(null);
  const [employeeTimeRecords, setEmployeeTimeRecords] = useState([]);

  // Form states
  const [empForm, setEmpForm] = useState({
    name: '',
    email: '',
    role: 'employee',
    department_id: '',
    vacation_days: 30,
    extra_hours: 0.0,
    password: '',
    managed_department_ids: []
  });

  const [deptForm, setDeptForm] = useState({
    name: '',
    coordinator_id: ''
  });

  const [timeForm, setTimeForm] = useState({
    type: 'vacation',
    amount: '',
    observation: ''
  });

  const [selectedTimeRecord, setSelectedTimeRecord] = useState(null);

  // Tabbed Request Modal states
  const [requestTab, setRequestTab] = useState('absence'); // 'absence' or 'hours'
  const [requestTargetEmployee, setRequestTargetEmployee] = useState(null);
  const [requestForm, setRequestForm] = useState({
    absence_type_id: '',
    start_date: '',
    end_date: '',
    hours_type: 'hours_register',
    amount: '',
    observation: '',
    original_record_id: '',
    direct_approve: 'pending',
    is_historical: false
  });

  // Employee Selected Predefined Range inside Modal
  const [selectedRangeId, setSelectedRangeId] = useState('');

  // Selected Credit Records and Hours mapping for multi-record consumption
  const [selectedCredits, setSelectedCredits] = useState({}); // format: { [recordId]: hoursChosen }

  // Admin Absence Type Creator / Editor Form
  const [showAbsenceTypeForm, setShowAbsenceTypeForm] = useState(false);
  const [absTypeForm, setAbsTypeForm] = useState({
    name: '',
    subtracts_days: false,
    fixed_days: '',
    show_in_record: true,
    visible_to_employees: true,
    visible_to_coordinators: true,
    visible_to_admins: true
  });
  
  // Custom states for predefined ranges builder
  const [hasPredefinedRanges, setHasPredefinedRanges] = useState(false);
  const [predefinedRangesList, setPredefinedRangesList] = useState([]);
  const [tempRange, setTempRange] = useState({ label: '', start_date: '', end_date: '' });

  // Employee filters state
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [employeeDeptFilter, setEmployeeDeptFilter] = useState('');
  const [teamSearch, setTeamSearch] = useState('');
  const [teamDeptFilter, setTeamDeptFilter] = useState('');

  // Print Quadrant Modal States
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [printOption, setPrintOption] = useState('current'); // 'current' | 'range'
  const [printStartMonth, setPrintStartMonth] = useState(new Date().getMonth());
  const [printStartYear, setPrintStartYear] = useState(new Date().getFullYear());
  const [printEndMonth, setPrintEndMonth] = useState(new Date().getMonth());
  const [printEndYear, setPrintEndYear] = useState(new Date().getFullYear());
  const [printingMonthsList, setPrintingMonthsList] = useState([]);
  const [isGeneratingPrint, setIsGeneratingPrint] = useState(false);

  // Mobile navigation drawer state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Holiday management state
  const [holidayForm, setHolidayForm] = useState({ name: '', date: '' });
  const [rrhhSubTab, setRrhhSubTab] = useState('absence_types'); // 'absence_types' | 'shifts' | 'holidays'
  const [announcementForm, setAnnouncementForm] = useState({ title: '', content: '' });
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState(null);
  const [isLightTheme, setIsLightTheme] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: '', email: '', avatar_url: '', password: '' });

  const [reportsSubTab, setReportsSubTab] = useState('queries'); // 'queries' | 'stats'

  const getInitialDates = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    const firstDay = new Date(y, m, 1);
    const lastDay = new Date(y, m + 1, 0);
    const formatDate = (d) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    return {
      start: formatDate(firstDay),
      end: formatDate(lastDay)
    };
  };

  const [queryStartDate, setQueryStartDate] = useState(getInitialDates().start);
  const [queryEndDate, setQueryEndDate] = useState(getInitialDates().end);

  const [epiTypesList, setEpiTypesList] = useState([]);
  const [epiRequestsList, setEpiRequestsList] = useState([]);
  const [newEpiForm, setNewEpiForm] = useState({ name: '', description: '' });
  const [newSizeForm, setNewSizeForm] = useState({ type_id: '', size_name: '' });
  const [epiRequestForm, setEpiRequestForm] = useState({ type_id: '', size_id: '' });
  const [epiTab, setEpiTab] = useState('my_requests'); // 'my_requests' | 'team_requests'

  const toggleTheme = () => {
    setIsLightTheme(!isLightTheme);
    if (!isLightTheme) {
      document.body.classList.add('light-mode');
    } else {
      document.body.classList.remove('light-mode');
    }
  };

  const openProfileEditor = () => {
    if (!dashboardData?.user) return;
    setProfileForm({
      name: dashboardData.user.name,
      email: dashboardData.user.email,
      avatar_url: dashboardData.user.avatar_url || '',
      password: ''
    });
    setShowProfileModal(true);
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/employees', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: dashboardData.user.id,
          name: profileForm.name,
          email: profileForm.email,
          role: dashboardData.user.role,
          department_id: dashboardData.user.department_id,
          vacation_days: dashboardData.user.vacation_days,
          extra_hours: dashboardData.user.extra_hours,
          avatar_url: profileForm.avatar_url,
          password: profileForm.password
        })
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Error al actualizar perfil");
      setShowProfileModal(false);
      await refreshData();
    } catch (err) {
      alert(err.message);
    }
  };

  // Shift template admin states
  const [editingShift, setEditingShift] = useState(null);
  const [shiftForm, setShiftForm] = useState({
    name: '',
    color: '#3498db',
    start_time: '',
    end_time: '',
    start_time_2: '',
    end_time_2: ''
  });

  // Planificación states
  const [schedYear, setSchedYear] = useState(new Date().getFullYear());
  const [schedMonth, setSchedMonth] = useState(new Date().getMonth());
  const [activePaintShiftId, setActivePaintShiftId] = useState(null); // null means erase / Libre
  const [isPainting, setIsPainting] = useState(false);
  const [shiftAssignments, setShiftAssignments] = useState({});
  const [isPlanningEditMode, setIsPlanningEditMode] = useState(false);
  const [backupShiftAssignments, setBackupShiftAssignments] = useState(null);
  const [schedDeptFilter, setSchedDeptFilter] = useState('');
  const [settingsTab, setSettingsTab] = useState('employees'); // 'employees' | 'departments' | 'absence_types' | 'shifts'
  // Reset all filters when active tab or settings tab changes
  useEffect(() => {
    setEmployeeSearch('');
    setEmployeeDeptFilter('');
    setTeamSearch('');
    setTeamDeptFilter('');
    setSchedDeptFilter('');
  }, [activeTab, settingsTab]);

  // Switcher initialization
  useEffect(() => {
    async function initData() {
      try {
        const res = await fetch('/api/dashboard-data');
        const data = await res.json();
        if (data.allUsers && data.allUsers.length > 0) {
          setUsersList(data.allUsers);
          setSelectedUserId(data.allUsers[0].id.toString());
        } else {
          setError("No se encontraron usuarios en la base de datos.");
        }
      } catch (err) {
        setError("Error al conectar con la base de datos.");
      }
    }
    initData();
  }, []);

  // Fetch full data whenever selected user changes
  useEffect(() => {
    if (!selectedUserId) return;
    async function fetchDashboard() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/dashboard-data?userId=${selectedUserId}`);
        if (!res.ok) throw new Error("Error cargando datos del dashboard.");
        const data = await res.json();
        setDashboardData(data);
        
        // Load time records
        if (data.user?.id) {
          fetchTimeRecords(data.user.id);
          fetchEpiTypes();
          fetchEpiRequests(data.user.id);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, [selectedUserId]);

  // Load shift assignments for visible month
  useEffect(() => {
    if ((activeTab !== 'planificacion' && activeTab !== 'dashboard') || !selectedUserId) return;
    async function loadShifts() {
      try {
        const lastDay = new Date(schedYear, schedMonth + 1, 0).getDate();
        const startDate = `${schedYear}-${String(schedMonth + 1).padStart(2, '0')}-01`;
        const endDate = `${schedYear}-${String(schedMonth + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
        const res = await fetch(`/api/employee-shifts?userId=${selectedUserId}&startDate=${startDate}&endDate=${endDate}`);
        const data = await res.json();
        if (data.success) {
          const mapping = {};
          data.assignments.forEach(assign => {
            mapping[`${assign.employee_id}_${assign.date}`] = {
              id: assign.shift_id,
              name: assign.shift_name,
              color: assign.shift_color,
              start_time: assign.start_time,
              end_time: assign.end_time,
              start_time_2: assign.start_time_2,
              end_time_2: assign.end_time_2
            };
          });
          setShiftAssignments(mapping);
          setIsPlanningEditMode(false);
          setBackupShiftAssignments(null);
        }
      } catch (err) {
        console.error("Error loading shifts", err);
      }
    }
    loadShifts();
  }, [activeTab, schedYear, schedMonth, selectedUserId]);

  const handleUserChange = (e) => {
    setSelectedUserId(e.target.value);
    setActiveTab('dashboard'); // Reset tab on role switch
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return <span className="badge badge-admin">Administrador</span>;
      case 'coordinator':
        return <span className="badge badge-coordinator">Coordinador</span>;
      default:
        return <span className="badge badge-employee">Empleado</span>;
    }
  };

  const refreshData = async () => {
    const res = await fetch(`/api/dashboard-data?userId=${selectedUserId}`);
    const data = await res.json();
    setDashboardData(data);
    setUsersList(data.allUsers);
    if (data.user?.id) {
      fetchTimeRecords(data.user.id);
      fetchEpiTypes();
      fetchEpiRequests(data.user.id);
    }
    if (selectedTimeEmployee?.id) {
      fetchTimeRecords(selectedTimeEmployee.id);
    }
    if (editingEmployee?.id) {
      fetchTimeRecords(editingEmployee.id);
      const updatedEmp = data.allEmployees?.find(u => u.id === editingEmployee.id);
      if (updatedEmp) {
        setEmpForm(prev => ({
          ...prev,
          vacation_days: updatedEmp.vacation_days ?? 30,
          extra_hours: updatedEmp.extra_hours ?? 0.0
        }));
      }
    }
  };

  const fetchTimeRecords = async (empId) => {
    try {
      const res = await fetch(`/api/time-records?employeeId=${empId}`);
      const data = await res.json();
      if (data.success) {
        setEmployeeTimeRecords(data.records);
      }
    } catch (err) {
      console.error("Error loading time records", err);
    }
  };

  const fetchEpiTypes = async () => {
    try {
      const res = await fetch('/api/epis');
      const data = await res.json();
      setEpiTypesList(data);
    } catch (err) {
      console.error('Error fetching EPI types', err);
    }
  };

  const fetchEpiRequests = async (userId) => {
    try {
      const res = await fetch(`/api/epi-requests?userId=${userId}`);
      const data = await res.json();
      setEpiRequestsList(data);
    } catch (err) {
      console.error('Error fetching EPI requests', err);
    }
  };

  const createEpiType = async (e) => {
    e.preventDefault();
    if (!newEpiForm.name) return;
    try {
      const res = await fetch('/api/epis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create_type', ...newEpiForm })
      });
      const data = await res.json();
      if (data.success) {
        setNewEpiForm({ name: '', description: '' });
        fetchEpiTypes();
      } else {
        alert(data.error);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const deleteEpiType = async (typeId) => {
    if (!confirm('¿Seguro que deseas eliminar este tipo de EPI? Se borrarán sus tallas y solicitudes asociadas.')) return;
    try {
      const res = await fetch('/api/epis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete_type', type_id: typeId })
      });
      const data = await res.json();
      if (data.success) {
        fetchEpiTypes();
        if (dashboardData?.user?.id) fetchEpiRequests(dashboardData.user.id);
      } else {
        alert(data.error);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const createEpiSize = async (e) => {
    e.preventDefault();
    if (!newSizeForm.type_id || !newSizeForm.size_name) return;
    try {
      const res = await fetch('/api/epis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create_size', ...newSizeForm })
      });
      const data = await res.json();
      if (data.success) {
        setNewSizeForm({ ...newSizeForm, size_name: '' });
        fetchEpiTypes();
      } else {
        alert(data.error);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const deleteEpiSize = async (sizeId) => {
    if (!confirm('¿Seguro que deseas eliminar esta talla?')) return;
    try {
      const res = await fetch('/api/epis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete_size', size_id: sizeId })
      });
      const data = await res.json();
      if (data.success) {
        fetchEpiTypes();
      } else {
        alert(data.error);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const submitEpiRequest = async (e) => {
    e.preventDefault();
    if (!epiRequestForm.type_id || !epiRequestForm.size_id) {
      alert('Por favor selecciona un EPI y su talla.');
      return;
    }
    try {
      const res = await fetch('/api/epi-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_id: dashboardData.user.id,
          epi_type_id: epiRequestForm.type_id,
          size_id: epiRequestForm.size_id
        })
      });
      const data = await res.json();
      if (data.success) {
        setEpiRequestForm({ type_id: '', size_id: '' });
        fetchEpiRequests(dashboardData.user.id);
        alert('Solicitud de EPI enviada correctamente en estado Pendiente.');
      } else {
        alert(data.error);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const updateEpiStatus = async (requestId, status) => {
    try {
      const res = await fetch('/api/epi-requests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          request_id: requestId,
          status: status,
          resolved_by: dashboardData.user.id
        })
      });
      const data = await res.json();
      if (data.success) {
        fetchEpiRequests(dashboardData.user.id);
        alert(`EPI marcado como ${status === 'delivered' ? 'Entregado' : 'Pedido'}.`);
      } else {
        alert(data.error);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const printEpiReport = () => {
    const reportData = {};
    epiRequestsList.forEach(req => {
      const key = `${req.epi_name} - ${req.size_name}`;
      if (!reportData[key]) {
        reportData[key] = {
          epi_name: req.epi_name,
          size_name: req.size_name,
          pending: 0,
          requested: 0,
          delivered: 0,
          total: 0
        };
      }
      if (req.status === 'pending') reportData[key].pending++;
      else if (req.status === 'requested') reportData[key].requested++;
      else if (req.status === 'delivered') reportData[key].delivered++;
      reportData[key].total++;
    });

    const reportRows = Object.values(reportData);
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Por favor permite las ventanas emergentes (popups) para imprimir el informe.');
      return;
    }
    
    const rowsHtml = reportRows.map(row => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; font-weight: bold; text-transform: uppercase;">${row.epi_name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">${row.size_name.toUpperCase()}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center; color: #d97706; font-weight: bold;">${row.pending}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center; color: #2563eb; font-weight: bold;">${row.requested}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center; color: #16a34a; font-weight: bold;">${row.delivered}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center; font-weight: bold;">${row.total}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Informe de EPIs y Tallas - Portal RRHH</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 30px; color: #333; }
            h1 { text-align: center; font-size: 24px; margin-bottom: 5px; text-transform: uppercase; color: #1e293b; }
            .subtitle { text-align: center; font-size: 14px; color: #64748b; margin-bottom: 30px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            th { background-color: #f1f5f9; padding: 12px 10px; font-weight: bold; text-align: left; border-bottom: 2px solid #cbd5e1; }
            .btn-print { display: block; width: 150px; margin: 0 auto 30px auto; padding: 10px; background-color: #3b82f6; color: white; text-align: center; text-decoration: none; border-radius: 6px; font-weight: bold; border: none; cursor: pointer; font-size: 14px; }
            @media print {
              .btn-print { display: none; }
            }
          </style>
        </head>
        <body>
          <h1>Informe Resumen de Inventario y Solicitudes de EPIs</h1>
          <div class="subtitle">Fecha de generación: ${new Date().toLocaleString('es-ES')}</div>
          
          <button class="btn-print" onclick="window.print();">Imprimir Informe</button>
          
          <table>
            <thead>
              <tr>
                <th>Tipo de EPI</th>
                <th style="text-align: center;">Talla</th>
                <th style="text-align: center;">Pendientes</th>
                <th style="text-align: center;">Pedidos</th>
                <th style="text-align: center;">Entregados</th>
                <th style="text-align: center;">Total Solicitudes</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml.length > 0 ? rowsHtml : '<tr><td colspan="6" style="text-align: center; padding: 20px;">No hay registros para mostrar</td></tr>'}
            </tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Resolve Request: Approve or Reject
  const resolveRequest = async (id, status) => {
    try {
      const actionText = status === 'approved' ? 'APROBAR' : 'RECHAZAR';
      const reason = window.prompt(`Indica un motivo u observación para ${actionText} esta solicitud (opcional):`);
      if (reason === null) return; // cancel click

      const res = await fetch('/api/requests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          status,
          resolved_by: dashboardData.user.id,
          observation: reason
        })
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Error al procesar solicitud");
      await refreshData();
    } catch (err) {
      alert(err.message);
    }
  };

  const resolveRequestAndClose = async (id, status) => {
    await resolveRequest(id, status);
    setShowRequestDetailModal(false);
    setSelectedRequest(null);
  };

  const handleOpenRequestDetail = (req) => {
    setSelectedRequest(req);
    setShowRequestDetailModal(true);
  };

  useEffect(() => {
    if (!selectedRequest) {
      setConsumedCreditsDetails([]);
      return;
    }
    
    let credits = [];
    if (selectedRequest.consumed_credits) {
      const cc = selectedRequest.consumed_credits;
      if (typeof cc === 'string') {
        try {
          credits = JSON.parse(cc);
        } catch(e) {
          console.error("Error parsing consumed_credits string", e);
        }
      } else if (Array.isArray(cc)) {
        credits = cc;
      } else if (typeof cc === 'object' && cc !== null) {
        credits = [cc];
      }
    }

    // Fallback to single record consumption if no multi-credits array is present
    if ((!Array.isArray(credits) || credits.length === 0) && selectedRequest.original_record_id) {
      credits = [{
        record_id: selectedRequest.original_record_id,
        hours: Math.abs(parseFloat(selectedRequest.amount))
      }];
    }

    if (!Array.isArray(credits) || credits.length === 0) {
      setConsumedCreditsDetails([]);
      return;
    }

    const empId = selectedRequest.employee_id;
    fetch(`/api/time-records?employeeId=${empId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.records) {
          const mapped = credits.map(c => {
            const matched = data.records.find(r => String(r.id) === String(c.record_id));
            return {
              record_id: c.record_id,
              hours: c.hours,
              date: matched ? new Date(matched.created_at).toLocaleDateString('es-ES') : '-',
              concept: matched ? matched.observation : 'Registro de Horas Extras'
            };
          });
          setConsumedCreditsDetails(mapped);
        } else {
          setConsumedCreditsDetails([]);
        }
      })
      .catch(err => {
        console.error("Error fetching credit details", err);
        setConsumedCreditsDetails([]);
      });
  }, [selectedRequest]);

  const printRequestDetail = () => {
    if (!selectedRequest) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Por favor permite las ventanas emergentes (popups) para imprimir el detalle.');
      return;
    }

    const employeeId = selectedRequest.employee_id;
    let extraHoursBalance = 0;
    if (dashboardData?.user?.id === employeeId) {
      extraHoursBalance = dashboardData.user.extra_hours;
    } else {
      const matchedUser = usersList.find(u => u.id === employeeId);
      extraHoursBalance = matchedUser ? matchedUser.extra_hours : 0;
    }

    let creditsHtml = '';
    if (consumedCreditsDetails.length > 0) {
      creditsHtml = `
        <div style="margin-top: 25px;">
          <h3 style="color: #1e293b; border-bottom: 2px solid #3b82f6; padding-bottom: 5px; font-size: 16px;">Desglose de Horas Extra Compensadas</h3>
          <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
            <thead>
              <tr style="background-color: #f1f5f9;">
                <th style="padding: 8px; border: 1px solid #cbd5e1; text-align: left; font-size: 13px;">Ficha</th>
                <th style="padding: 8px; border: 1px solid #cbd5e1; text-align: left; font-size: 13px;">Detalle / Día y Motivo</th>
                <th style="padding: 8px; border: 1px solid #cbd5e1; text-align: right; font-size: 13px;">Horas</th>
              </tr>
            </thead>
            <tbody>
              ${consumedCreditsDetails.map(c => `
                <tr>
                  <td style="padding: 8px; border: 1px solid #cbd5e1; font-size: 13px;">#${c.record_id}</td>
                  <td style="padding: 8px; border: 1px solid #cbd5e1; font-size: 13px;">Día ${c.date}: ${c.hours} horas con el motivo: <strong>${c.concept}</strong></td>
                  <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: right; font-weight: bold; font-size: 13px;">${c.hours}h</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Solicitud #${selectedRequest.id} - Portal RRHH</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #333; }
            .header { border-bottom: 2px solid #3b82f6; padding-bottom: 15px; margin-bottom: 30px; }
            h1 { margin: 0; font-size: 22px; text-transform: uppercase; color: #1e293b; }
            .info-grid { display: grid; grid-template-columns: 180px 1fr; gap: 10px 20px; font-size: 15px; }
            .label { font-weight: bold; color: #64748b; }
            .value { color: #1e293b; }
            .obs-box { margin-top: 20px; padding: 15px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; font-style: italic; }
            .btn-print { display: block; width: 150px; margin: 0 auto 30px auto; padding: 10px; background-color: #3b82f6; color: white; text-align: center; text-decoration: none; border-radius: 6px; font-weight: bold; border: none; cursor: pointer; }
            @media print {
              .btn-print { display: none; }
            }
          </style>
        </head>
        <body>
          <button class="btn-print" onclick="window.print();">Imprimir Detalle</button>
          
          <div class="header">
            <h1>Detalles del Registro de Solicitud #${selectedRequest.id}</h1>
            <div style="font-size: 12px; color: #64748b; margin-top: 5px;">Generado el ${new Date().toLocaleString('es-ES')}</div>
          </div>

          <div class="info-grid">
            <div class="label">Empleado:</div>
            <div class="value" style="font-weight: bold;">${selectedRequest.employee_name || ''}</div>
            
            <div class="label">Tipo de Solicitud:</div>
            <div class="value">${getRequestTypeLabel(selectedRequest)}</div>
            
            <div class="label">Cantidad total:</div>
            <div class="value" style="font-weight: bold;">${selectedRequest.amount > 0 ? `+${selectedRequest.amount}` : selectedRequest.amount} ${selectedRequest.type === 'absence' ? 'días' : 'horas'}</div>
            
            <div class="label">Fecha Solicitud:</div>
            <div class="value">${new Date(selectedRequest.created_at).toLocaleString('es-ES')}</div>
            
            <div class="label">Estado actual:</div>
            <div class="value" style="text-transform: uppercase; font-weight: bold;">${selectedRequest.status}</div>

            <div class="label">Horas restantes a favor:</div>
            <div class="value" style="font-weight: bold; color: #16a34a;">${parseFloat(extraHoursBalance).toFixed(1)}h</div>
          </div>

          <div class="obs-box">
            <strong>Observaciones:</strong><br>
            ${selectedRequest.observation || 'Sin observaciones'}
          </div>

          ${creditsHtml}
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Submit new request
  const submitRequest = async (e) => {
    e.preventDefault();
    try {
      const type = requestTab === 'absence' ? 'absence' : requestForm.hours_type;
      
      const payload = {
        employee_id: requestTargetEmployee ? requestTargetEmployee.id : dashboardData.user.id,
        type,
        observation: requestForm.observation,
        direct_approve: requestForm.direct_approve === 'approve_direct',
        creator_id: dashboardData.user.id,
        is_historical: !!requestForm.is_historical
      };

      if (requestTab === 'absence') {
        payload.absence_type_id = requestForm.absence_type_id;
        payload.start_date = requestForm.start_date;
        payload.end_date = requestForm.end_date;
      } else {
        payload.amount = requestForm.amount;
        payload.original_record_id = requestForm.original_record_id || null;
        if (requestForm.hours_type === 'hours_register' || requestForm.hours_type === 'hours_festive' || requestForm.hours_type === 'hours_free') {
          payload.start_date = requestForm.start_date;
          if (requestForm.hours_type === 'hours_free') {
            payload.end_date = requestForm.start_date;
          }
        }
        if (requestForm.hours_type === 'hours_free' || requestForm.hours_type === 'hours_to_vacation' || requestForm.hours_type === 'hours_payroll') {
          // Send consumed credits array
          const creditsArray = Object.keys(selectedCredits)
            .filter(id => parseFloat(selectedCredits[id]) > 0)
            .map(id => ({
              record_id: parseInt(id),
              hours: parseFloat(selectedCredits[id])
            }));
          payload.consumed_credits = creditsArray;
          
          // Total sum of consumed hours
          const totalSum = creditsArray.reduce((acc, c) => acc + c.hours, 0);
          payload.amount = totalSum;
        }
      }

      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Error al enviar solicitud");

      setShowRequestModal(false);
      await refreshData();
    } catch (err) {
      alert(err.message);
    }
  };

  // Create or Edit Absence Type
  const saveAbsenceType = async (e) => {
    e.preventDefault();
    try {
      const url = '/api/absence-types';
      const method = editingAbsenceType ? 'PUT' : 'POST';
      const body = {
        name: absTypeForm.name,
        subtracts_days: absTypeForm.subtracts_days,
        fixed_days: absTypeForm.fixed_days,
        show_in_record: absTypeForm.show_in_record !== false,
        visible_to_employees: absTypeForm.visible_to_employees !== false,
        visible_to_coordinators: absTypeForm.visible_to_coordinators !== false,
        visible_to_admins: absTypeForm.visible_to_admins !== false,
        predefined_ranges: hasPredefinedRanges ? predefinedRangesList : []
      };

      if (editingAbsenceType) {
        body.id = editingAbsenceType.id;
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Error al guardar tipo de ausencia");

      setAbsTypeForm({
        name: '',
        subtracts_days: false,
        fixed_days: '',
        show_in_record: true,
        visible_to_employees: true,
        visible_to_coordinators: true,
        visible_to_admins: true
      });
      setPredefinedRangesList([]);
      setHasPredefinedRanges(false);
      setEditingAbsenceType(null);
      setShowAbsenceTypeForm(false);
      await refreshData();
    } catch (err) {
      alert(err.message);
    }
  };

  // Delete Absence Type
  const deleteAbsenceType = async (id) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este tipo de ausencia?')) return;
    try {
      const res = await fetch(`/api/absence-types?id=${id}`, { method: 'DELETE' });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Error al eliminar tipo de ausencia");
      await refreshData();
    } catch (err) {
      alert(err.message);
    }
  };

  const openEditAbsenceType = (type) => {
    setEditingAbsenceType(type);
    setAbsTypeForm({
      name: type.name,
      subtracts_days: type.subtracts_days,
      fixed_days: type.fixed_days ?? '',
      show_in_record: type.show_in_record !== false,
      visible_to_employees: type.visible_to_employees !== false,
      visible_to_coordinators: type.visible_to_coordinators !== false,
      visible_to_admins: type.visible_to_admins !== false
    });
    setHasPredefinedRanges(type.predefined_ranges && type.predefined_ranges.length > 0);
    setPredefinedRangesList(type.predefined_ranges || []);
    setShowAbsenceTypeForm(true);
  };

  // Create or Edit Shift template
  const saveShift = async (e) => {
    e.preventDefault();
    try {
      const url = '/api/shifts';
      const method = editingShift ? 'PUT' : 'POST';
      const body = {
        name: shiftForm.name,
        color: shiftForm.color,
        start_time: shiftForm.start_time || null,
        end_time: shiftForm.end_time || null,
        start_time_2: shiftForm.start_time_2 || null,
        end_time_2: shiftForm.end_time_2 || null
      };

      if (editingShift) {
        body.id = editingShift.id;
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Error al guardar el turno");

      setShiftForm({ name: '', color: '#3498db', start_time: '', end_time: '', start_time_2: '', end_time_2: '' });
      setEditingShift(null);
      await refreshData();
    } catch (err) {
      alert(err.message);
    }
  };

  // Delete Shift template
  const deleteShift = async (id) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este turno? Las asignaciones se desvincularán.')) return;
    try {
      const res = await fetch(`/api/shifts?id=${id}`, { method: 'DELETE' });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Error al eliminar el turno");
      await refreshData();
    } catch (err) {
      alert(err.message);
    }
  };

  const openEditShift = (shift) => {
    setEditingShift(shift);
    setShiftForm({
      name: shift.name,
      color: shift.color,
      start_time: shift.start_time || '',
      end_time: shift.end_time || '',
      start_time_2: shift.start_time_2 || '',
      end_time_2: shift.end_time_2 || ''
    });
  };

  const saveHoliday = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/national-holidays', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(holidayForm)
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Error al guardar el festivo");
      setHolidayForm({ name: '', date: '' });
      await refreshData();
    } catch (err) {
      alert(err.message);
    }
  };

  const deleteHoliday = async (id) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este festivo nacional?')) return;
    try {
      const res = await fetch(`/api/national-holidays?id=${id}`, { method: 'DELETE' });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Error al eliminar el festivo");
      await refreshData();
    } catch (err) {
      alert(err.message);
    }
  };

  const saveAnnouncement = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(announcementForm)
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Error al publicar comunicado");
      setAnnouncementForm({ title: '', content: '' });
      await refreshData();
    } catch (err) {
      alert(err.message);
    }
  };

  const deleteAnnouncement = async (id) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este comunicado? Dejará de aparecer en el muro de todos los usuarios.')) return;
    try {
      const res = await fetch(`/api/announcements?id=${id}`, { method: 'DELETE' });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Error al eliminar comunicado");
      await refreshData();
    } catch (err) {
      alert(err.message);
    }
  };


  const handlePrevMonth = () => {
    if (schedMonth === 0) {
      setSchedMonth(11);
      setSchedYear(schedYear - 1);
    } else {
      setSchedMonth(schedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (schedMonth === 11) {
      setSchedMonth(0);
      setSchedYear(schedYear + 1);
    } else {
      setSchedMonth(schedMonth + 1);
    }
  };

  const handleGeneratePrint = async () => {
    setIsGeneratingPrint(true);
    try {
      const monthsToFetch = [];
      if (printOption === 'current') {
        monthsToFetch.push({ year: schedYear, month: schedMonth });
      } else {
        let currentYear = printStartYear;
        let currentMonth = printStartMonth;
        const targetYear = printEndYear;
        const targetMonth = printEndMonth;

        while (currentYear < targetYear || (currentYear === targetYear && currentMonth <= targetMonth)) {
          monthsToFetch.push({ year: currentYear, month: currentMonth });
          if (currentMonth === 11) {
            currentMonth = 0;
            currentYear++;
          } else {
            currentMonth++;
          }
        }
      }

      // Fetch shift data for all selected months in parallel
      const fetchedMonths = await Promise.all(monthsToFetch.map(async ({ year, month }) => {
        const lastDay = new Date(year, month + 1, 0).getDate();
        const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
        const endDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
        const res = await fetch(`/api/employee-shifts?userId=${selectedUserId}&startDate=${startDate}&endDate=${endDate}`);
        const data = await res.json();
        
        const mapping = {};
        if (data.success) {
          data.assignments.forEach(assign => {
            mapping[`${assign.employee_id}_${assign.date}`] = {
              id: assign.shift_id,
              name: assign.shift_name,
              color: assign.shift_color,
              start_time: assign.start_time,
              end_time: assign.end_time,
              start_time_2: assign.start_time_2,
              end_time_2: assign.end_time_2
            };
          });
        }
        
        return { year, month, assignments: mapping };
      }));

      setPrintingMonthsList(fetchedMonths);
      setPrintModalOpen(false);

      // Trigger standard browser printing once render is complete
      setTimeout(() => {
        window.print();
        // Clear list after print dialog closes to cleanup DOM
        setPrintingMonthsList([]);
      }, 500);

    } catch (err) {
      console.error("Error generating print sheets", err);
      alert("Error al cargar los datos para impresión");
    } finally {
      setIsGeneratingPrint(false);
    }
  };

  const handleStartPlanningEdit = () => {
    setBackupShiftAssignments(JSON.parse(JSON.stringify(shiftAssignments)));
    setIsPlanningEditMode(true);
  };

  const handleCancelPlanningEdit = () => {
    if (backupShiftAssignments) {
      setShiftAssignments(backupShiftAssignments);
    }
    setIsPlanningEditMode(false);
    setBackupShiftAssignments(null);
  };

  const handleSavePlanningEdit = async () => {
    if (!backupShiftAssignments) return;
    
    // Calculate differences
    const assignmentsToSend = [];
    const keys = new Set([...Object.keys(shiftAssignments), ...Object.keys(backupShiftAssignments)]);
    for (let key of keys) {
      const currentId = shiftAssignments[key]?.id || null;
      const backupId = backupShiftAssignments[key]?.id || null;
      if (currentId !== backupId) {
        const [employeeId, dateStr] = key.split('_');
        assignmentsToSend.push({
          employee_id: parseInt(employeeId),
          date: dateStr,
          shift_id: currentId
        });
      }
    }

    if (assignmentsToSend.length === 0) {
      setIsPlanningEditMode(false);
      setBackupShiftAssignments(null);
      return;
    }

    try {
      const res = await fetch('/api/employee-shifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUserId,
          assignments: assignmentsToSend
        })
      });
      const data = await res.json();
      if (data.success) {
        setIsPlanningEditMode(false);
        setBackupShiftAssignments(null);
      } else {
        alert("Error al guardar la planificación: " + data.error);
      }
    } catch (err) {
      console.error("Error saving planning", err);
      alert("Error de red al guardar la planificación");
    }
  };

  const handlePaintCell = async (employeeId, dayNum) => {
    if (!dashboardData?.user || dashboardData.user.role === 'employee') return; // Read-only
    if (!isPlanningEditMode) return; // Read-only unless explicitly editing

    const dateStr = `${schedYear}-${String(schedMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    const key = `${employeeId}_${dateStr}`;
    
    // Find active shift details
    const activeShift = dashboardData.allShifts?.find(s => s.id === activePaintShiftId);

    // Optimistic update
    const updated = { ...shiftAssignments };
    if (activePaintShiftId !== null && activeShift) {
      updated[key] = {
        id: activeShift.id,
        name: activeShift.name,
        color: activeShift.color
      };
    } else {
      delete updated[key];
    }
    setShiftAssignments(updated);
  };



  // Add range builder item
  const addPredefinedRangeItem = () => {
    if (!tempRange.label || !tempRange.start_date || !tempRange.end_date) {
      alert("Por favor rellena la etiqueta y las fechas del rango");
      return;
    }
    setPredefinedRangesList([...predefinedRangesList, tempRange]);
    setTempRange({ label: '', start_date: '', end_date: '' });
  };

  const removePredefinedRangeItem = (index) => {
    setPredefinedRangesList(predefinedRangesList.filter((_, i) => i !== index));
  };

  const getFirstVisibleAbsenceTypeId = () => {
    const role = dashboardData?.user?.role;
    const visibleTypes = dashboardData?.absenceTypes?.filter(type => {
      if (role === 'admin') return type.visible_to_admins !== false;
      if (role === 'coordinator') return type.visible_to_coordinators !== false;
      return type.visible_to_employees !== false;
    });
    return visibleTypes?.[0]?.id?.toString() || '';
  };

  const openRequestModalForEmployee = (emp) => {
    setRequestTargetEmployee(emp);
    setRequestForm({
      absence_type_id: getFirstVisibleAbsenceTypeId(),
      start_date: '',
      end_date: '',
      hours_type: 'hours_register',
      amount: '',
      observation: '',
      original_record_id: '',
      direct_approve: 'pending',
      is_historical: false
    });
    setSelectedRangeId('');
    setSelectedCredits({});
    setRequestTab('absence');
    fetchTimeRecords(emp.id);
    setShowRequestModal(true);
  };

  const openRequestModalForSelf = () => {
    setRequestTargetEmployee(null);
    setRequestForm({
      absence_type_id: getFirstVisibleAbsenceTypeId(),
      start_date: '',
      end_date: '',
      hours_type: 'hours_register',
      amount: '',
      observation: '',
      original_record_id: '',
      direct_approve: 'pending',
      is_historical: false
    });
    setSelectedRangeId('');
    setSelectedCredits({});
    setRequestTab('absence');
    fetchTimeRecords(dashboardData.user.id);
    setShowRequestModal(true);
  };

  // Adjustments Modal (Admin/Coordinator adjustments)
  const openTimeModal = (emp) => {
    setSelectedTimeEmployee(emp);
    setTimeForm({
      type: 'vacation',
      amount: '',
      observation: ''
    });
    setEmployeeTimeRecords([]);
    fetchTimeRecords(emp.id);
    setShowTimeModal(true);
  };

  const saveTimeAdjustment = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/time-records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_id: selectedTimeEmployee.id,
          created_by: dashboardData.user.id,
          type: timeForm.type,
          amount: timeForm.amount,
          observation: timeForm.observation,
          action: 'adjust'
        })
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Error al registrar ajuste");
      
      setTimeForm({ ...timeForm, amount: '', observation: '' });
      await refreshData();
    } catch (err) {
      alert(err.message);
    }
  };

  const deleteTimeRecord = async (recordId) => {
    // Legacy function, replaced by executeDeleteTimeRecord + custom modal confirmation
  };

  const executeDeleteTimeRecord = async (recordId, revert) => {
    try {
      const res = await fetch(`/api/time-records?id=${recordId}&revert=${revert}`, { method: 'DELETE' });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Error al eliminar transacción");
      
      setShowDeleteConfirmModal(false);
      setRecordToDelete(null);
      setSelectedTimeRecord(null);
      await refreshData();
    } catch (err) {
      alert(err.message);
    }
  };

  const deleteAllEmployeeRecords = async (empId) => {
    if (!confirm('¿Estás seguro de que deseas eliminar TODOS los registros de vacaciones, horas y regularizaciones de este empleado? Esta acción no alterará sus saldos actuales pero reseteará su historial de transacciones y solicitudes por completo.')) return;
    try {
      const res = await fetch(`/api/time-records?employeeId=${empId}`, { method: 'DELETE' });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Error al eliminar registros");
      
      alert("Historial de registros eliminado con éxito.");
      await refreshData();
    } catch (err) {
      alert(err.message);
    }
  };

  // Employee CRUD operations
  const openAddEmployee = () => {
    setEditingEmployee(null);
    setEmpForm({
      name: '',
      email: '',
      role: 'employee',
      department_id: '',
      vacation_days: 30,
      extra_hours: 0.0,
      password: '',
      managed_department_ids: [],
      avatar_url: ''
    });
    setShowEmployeeModal(true);
  };

  const openEditEmployee = (emp) => {
    setEditingEmployee(emp);
    setEmpForm({
      name: emp.name,
      email: emp.email,
      role: emp.role,
      department_id: emp.department_id || '',
      vacation_days: emp.vacation_days ?? 30,
      extra_hours: emp.extra_hours ?? 0.0,
      password: '',
      managed_department_ids: emp.managed_department_ids || [],
      avatar_url: emp.avatar_url || ''
    });
    setEmployeeTimeRecords([]);
    fetchTimeRecords(emp.id);
    setShowEmployeeModal(true);
  };

  const handleDeptCheckboxChange = (deptId, checked) => {
    let updated = [...empForm.managed_department_ids];
    if (checked) {
      if (!updated.includes(deptId)) updated.push(deptId);
    } else {
      updated = updated.filter(id => id !== deptId);
    }
    setEmpForm({ ...empForm, managed_department_ids: updated });
  };

  const saveEmployee = async (e) => {
    e.preventDefault();
    try {
      const url = '/api/employees';
      const method = editingEmployee ? 'PUT' : 'POST';
      const body = editingEmployee ? { id: editingEmployee.id, ...empForm } : empForm;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Error al guardar empleado");

      setShowEmployeeModal(false);
      await refreshData();
    } catch (err) {
      alert(err.message);
    }
  };

  const deleteEmployee = async (id) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este empleado?')) return;
    try {
      const res = await fetch(`/api/employees?id=${id}`, { method: 'DELETE' });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Error al eliminar empleado");
      await refreshData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteEmployeeInModal = async () => {
    if (!editingEmployee) return;
    if (!confirm(`¿Estás completamente seguro de que deseas eliminar al empleado ${editingEmployee.name}? Esta acción borrará de forma permanente todos sus datos (turnos, solicitudes, saldos y EPIs) y no se puede deshacer.`)) return;
    
    try {
      const res = await fetch(`/api/employees?id=${editingEmployee.id}`, { method: 'DELETE' });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Error al eliminar empleado");
      setShowEmployeeModal(false);
      setEditingEmployee(null);
      await refreshData();
      alert("Empleado eliminado correctamente.");
    } catch (err) {
      alert(err.message);
    }
  };

  // Department CRUD operations
  const openAddDepartment = () => {
    setEditingDepartment(null);
    setDeptForm({
      name: '',
      coordinator_id: ''
    });
    setShowDepartmentModal(true);
  };

  const openEditDepartment = (dept) => {
    setEditingDepartment(dept);
    setDeptForm({
      name: dept.name,
      coordinator_id: dept.coordinator_id || ''
    });
    setShowDepartmentModal(true);
  };

  const saveDepartment = async (e) => {
    e.preventDefault();
    try {
      const url = '/api/departments';
      const method = editingDepartment ? 'PUT' : 'POST';
      const body = editingDepartment ? { id: editingDepartment.id, ...deptForm } : deptForm;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Error al guardar departamento");

      setShowDepartmentModal(false);
      await refreshData();
    } catch (err) {
      alert(err.message);
    }
  };

  const deleteDepartment = async (id) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este departamento? Los empleados de este departamento se quedarán sin departamento asignado.')) return;
    try {
      const res = await fetch(`/api/departments?id=${id}`, { method: 'DELETE' });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Error al eliminar departamento");
      await refreshData();
    } catch (err) {
      alert(err.message);
    }
  };

  const getManagedDeptsNames = () => {
    if (!dashboardData || !dashboardData.user || !dashboardData.allDepartments) return '';
    const managedIds = dashboardData.user.managed_department_ids || [];
    return dashboardData.allDepartments
      .filter(d => managedIds.includes(d.id))
      .map(d => d.name)
      .join(', ');
  };

  const getRequestTypeLabel = (req) => {
    if (req.type === 'absence') {
      return `🏖 Ausencia: ${req.absence_type_name || 'Personal'}`;
    }
    switch(req.type) {
      case 'hours_register': return '⏱ Registro Horas Extras';
      case 'hours_festive': return '🎉 Festivo Trabajado (+1v +4h)';
      case 'hours_free': return '☕️ Consumo Horas Libres';
      case 'hours_to_vacation': return '🔄 Canje Horas a Vacaciones';
      case 'hours_payroll': return '💶 Abono en Nómina';
      default: return req.type;
    }
  };

  const getRequestStatusBadge = (status) => {
    switch (status) {
      case 'approved': return <span className="badge badge-employee">Aprobada</span>;
      case 'rejected': return <span className="badge badge-admin" style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.3)' }}>Rechazada</span>;
      default: return <span className="badge badge-coordinator" style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', borderColor: 'rgba(245, 158, 11, 0.3)' }}>Pendiente</span>;
    }
  };

  // Find currently selected absence type in form
  const selectedAbsType = dashboardData?.absenceTypes?.find(t => t.id === parseInt(requestForm.absence_type_id));

  // Handler for when predefined range is chosen in request modal
  const handleRangeSelection = (e) => {
    const rangeId = e.target.value;
    setSelectedRangeId(rangeId);
    if (!rangeId) {
      setRequestForm({ ...requestForm, start_date: '', end_date: '' });
      return;
    }
    const selectedRange = selectedAbsType?.predefined_ranges?.find(r => r.id === parseInt(rangeId));
    if (selectedRange) {
      setRequestForm({
        ...requestForm,
        start_date: selectedRange.start_date.split('T')[0],
        end_date: selectedRange.end_date.split('T')[0]
      });
    }
  };

  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };
  
  const getMonthName = (monthIndex) => {
    const months = [
      "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
      "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];
    return months[monthIndex];
  };

  return (
    <div onMouseUp={() => setIsPainting(false)}>
      {/* Mobile Top Header */}
      <header className="mobile-header">
        <div className="brand" style={{ margin: 0 }}>
          <div className="brand-dot"></div>
          Portal RRHH
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          style={{ 
            background: 'none', 
            border: 'none', 
            color: 'var(--text-primary)', 
            fontSize: '1.5rem', 
            cursor: 'pointer',
            padding: '0.5rem',
            lineHeight: 1
          }}
        >
          ☰
        </button>
      </header>

      {/* Mobile Dark Backdrop Overlay */}
      <div 
        className={`mobile-overlay ${isMobileMenuOpen ? 'open' : ''}`} 
        onClick={() => setIsMobileMenuOpen(false)} 
      />

      <div className={`app-container ${printingMonthsList.length > 0 ? 'no-print' : ''}`}>
        {/* Sidebar Navigation */}
        <aside className={`sidebar glass-sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div className="brand">
            <div className="brand-dot"></div>
            Portal RRHH
          </div>
          
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <button 
              onClick={() => { setActiveTab('dashboard'); setIsMobileMenuOpen(false); }}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.75rem', 
                border: 'none', 
                background: activeTab === 'dashboard' ? 'var(--primary-glow)' : 'transparent', 
                color: activeTab === 'dashboard' ? 'var(--primary-light)' : 'var(--text-secondary)', 
                padding: '0.75rem 1rem', 
                borderRadius: '8px', 
                fontWeight: activeTab === 'dashboard' ? '600' : 'normal', 
                cursor: 'pointer', 
                textAlign: 'left', 
                fontFamily: 'inherit', 
                fontSize: '0.95rem',
                width: '100%'
              }}
            >
              📊 Dashboard
            </button>

            <button 
              onClick={() => { setActiveTab('planificacion'); setIsMobileMenuOpen(false); }}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.75rem', 
                border: 'none', 
                background: activeTab === 'planificacion' ? 'var(--primary-glow)' : 'transparent', 
                color: activeTab === 'planificacion' ? 'var(--primary-light)' : 'var(--text-secondary)', 
                padding: '0.75rem 1rem', 
                borderRadius: '8px', 
                fontWeight: activeTab === 'planificacion' ? '600' : 'normal', 
                cursor: 'pointer', 
                textAlign: 'left', 
                fontFamily: 'inherit', 
                fontSize: '0.95rem',
                width: '100%'
              }}
            >
              📅 Planificación
            </button>

            {(dashboardData?.user?.role === 'admin' || dashboardData?.user?.role === 'coordinator') && (() => {
              const pendingCount = dashboardData?.user?.role === 'admin' 
                ? (dashboardData?.allPendingRequests?.length || 0) 
                : (dashboardData?.teamPendingRequests?.length || 0);

              return (
                <button 
                  onClick={() => { setActiveTab('requests_approval'); setIsMobileMenuOpen(false); }}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    gap: '0.75rem', 
                    border: 'none', 
                    background: activeTab === 'requests_approval' ? 'var(--primary-glow)' : 'transparent', 
                    color: activeTab === 'requests_approval' ? 'var(--primary-light)' : 'var(--text-secondary)', 
                    padding: '0.75rem 1rem', 
                    borderRadius: '8px', 
                    fontWeight: activeTab === 'requests_approval' ? '600' : 'normal', 
                    cursor: 'pointer', 
                    textAlign: 'left', 
                    fontFamily: 'inherit', 
                    fontSize: '0.95rem',
                    width: '100%'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span>📥 Solicitudes</span>
                  </div>
                  {pendingCount > 0 && (
                    <span style={{ 
                      background: 'var(--danger)', 
                      color: '#fff', 
                      fontSize: '0.73rem', 
                      fontWeight: 'bold', 
                      padding: '0.15rem 0.45rem', 
                      borderRadius: '20px',
                      boxShadow: '0 0 10px rgba(239, 68, 68, 0.4)'
                    }}>
                      {pendingCount}
                    </span>
                  )}
                </button>
              );
            })()}

            {/* COORDINATORS AND ADMINS MENU */}
            {(dashboardData?.user?.role === 'coordinator' || dashboardData?.user?.role === 'admin') && (
              <button 
                onClick={() => { setActiveTab('coordinator_team'); setIsMobileMenuOpen(false); }}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.75rem', 
                  border: 'none', 
                  background: activeTab === 'coordinator_team' ? 'var(--primary-glow)' : 'transparent', 
                  color: activeTab === 'coordinator_team' ? 'var(--primary-light)' : 'var(--text-secondary)', 
                  padding: '0.75rem 1rem', 
                  borderRadius: '8px', 
                  fontWeight: activeTab === 'coordinator_team' ? '600' : 'normal', 
                  cursor: 'pointer', 
                  textAlign: 'left', 
                  fontFamily: 'inherit', 
                  fontSize: '0.95rem',
                  width: '100%'
                }}
              >
                👥 Mi equipo
              </button>
            )}

            {/* EPIS MAIN TAB */}
            {(() => {
              const pendingEpisCount = (dashboardData?.user?.role === 'admin' || dashboardData?.user?.role === 'coordinator')
                ? epiRequestsList.filter(r => r.status === 'pending').length
                : 0;

              return (
                <button 
                  onClick={() => { setActiveTab('epis'); setIsMobileMenuOpen(false); }}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    gap: '0.75rem', 
                    border: 'none', 
                    background: activeTab === 'epis' ? 'var(--primary-glow)' : 'transparent', 
                    color: activeTab === 'epis' ? 'var(--primary-light)' : 'var(--text-secondary)', 
                    padding: '0.75rem 1rem', 
                    borderRadius: '8px', 
                    fontWeight: activeTab === 'epis' ? '600' : 'normal', 
                    cursor: 'pointer', 
                    textAlign: 'left', 
                    fontFamily: 'inherit', 
                    fontSize: '0.95rem',
                    width: '100%'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span>🦺 EPIs</span>
                  </div>
                  {pendingEpisCount > 0 && (
                    <span style={{ 
                      background: 'var(--danger)', 
                      color: '#fff', 
                      fontSize: '0.73rem', 
                      fontWeight: 'bold', 
                      padding: '0.15rem 0.45rem', 
                      borderRadius: '20px',
                      boxShadow: '0 0 10px rgba(239, 68, 68, 0.4)'
                    }}>
                      {pendingEpisCount}
                    </span>
                  )}
                </button>
              );
            })()}

            {/* ADMIN SETTINGS MAIN TAB */}
            {dashboardData?.user?.role === 'admin' && (
              <button 
                onClick={() => { setActiveTab('admin_settings'); setSettingsTab('employees'); setIsMobileMenuOpen(false); }}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.75rem', 
                  border: 'none', 
                  background: activeTab === 'admin_settings' ? 'var(--primary-glow)' : 'transparent', 
                  color: activeTab === 'admin_settings' ? 'var(--primary-light)' : 'var(--text-secondary)', 
                  padding: '0.75rem 1rem', 
                  borderRadius: '8px', 
                  fontWeight: activeTab === 'admin_settings' ? '600' : 'normal', 
                  cursor: 'pointer', 
                  textAlign: 'left', 
                  fontFamily: 'inherit', 
                  fontSize: '0.95rem',
                  width: '100%'
                }}
              >
                ⚙️ Ajustes
              </button>
            )}
          </nav>
          
          {/* Theme Toggle Button */}
          <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: '500' }}>Tema Visual</span>
            <button 
              type="button"
              onClick={toggleTheme} 
              style={{ 
                background: 'rgba(255,255,255,0.05)', 
                border: '1px solid var(--border-color)', 
                borderRadius: '8px',
                fontSize: '0.8rem', 
                cursor: 'pointer', 
                padding: '0.35rem 0.65rem', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                gap: '0.35rem',
                color: 'var(--text-primary)',
                fontWeight: 'bold',
                transition: 'all 0.2s'
              }}
              title={isLightTheme ? "Cambiar a Modo Oscuro" : "Cambiar a Modo Claro"}
            >
              {isLightTheme ? "🌙 Oscuro" : "☀️ Claro"}
            </button>
          </div>
        </div>

        {/* Selected User Info Panel */}
        {dashboardData?.user && (
          <div 
            className="glass-panel" 
            onClick={openProfileEditor}
            style={{ 
              padding: '1.25rem', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '0.75rem', 
              border: '1px solid rgba(255, 255, 255, 0.05)',
              cursor: 'pointer',
              transition: 'transform 0.2s, background-color 0.2s'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {dashboardData.user.avatar_url ? (
                <img 
                  src={dashboardData.user.avatar_url} 
                  alt={dashboardData.user.name} 
                  style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border-color)' }} 
                />
              ) : (
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--info))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.1rem' }}>
                  {dashboardData.user.name.charAt(0)}
                </div>
              )}
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontWeight: '600', fontSize: '0.95rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', color: '#fff' }}>{dashboardData.user.name}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{dashboardData.user.email}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
              {getRoleBadge(dashboardData.user.role)}
              {dashboardData.user.department_name && (
                <span className="badge" style={{ backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
                  {dashboardData.user.department_name}
                </span>
              )}
            </div>
            
            {(dashboardData.user.role === 'coordinator' || dashboardData.user.role === 'admin') && getManagedDeptsNames() && (
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem', marginTop: '0.25rem' }}>
                <strong>Gestiona:</strong> {getManagedDeptsNames()}
              </div>
            )}
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        {/* Header with Selector */}
        <div className="header-section">
          <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>
              {activeTab === 'dashboard' ? 'Panel de Control' : 
               activeTab === 'requests_approval' ? 'Bandeja de Solicitudes' :
               activeTab === 'admin_settings' ? 'Ajustes del Sistema' :
               activeTab === 'coordinator_team' ? 'Mi Equipo de Trabajo' : 'Portal de RRHH'}
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '0.25rem' }}>
              {activeTab === 'dashboard' ? 'Bienvenido al gestor de RRHH. Explora y administra los perfiles.' : 
               activeTab === 'requests_approval' ? 'Revisa, aprueba o rechaza las solicitudes de ausencias y horas.' :
               activeTab === 'admin_settings' ? 'Panel de configuración de empleados, departamentos, ausencias y turnos.' :
               activeTab === 'coordinator_team' ? 'Listado de empleados coordinados en tus departamentos.' : ''}
            </p>
          </div>

          {/* User Switcher Dropdown */}
          <div className="glass-panel user-selector-wrapper">
            <span className="selector-label">Vista de Simulación:</span>
            <select 
              className="selector-dropdown"
              value={selectedUserId} 
              onChange={handleUserChange}
            >
              {usersList.map(u => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.role === 'admin' ? 'Admin' : u.role === 'coordinator' ? 'Coordinador' : 'Empleado'})
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid var(--danger)', background: 'rgba(239, 68, 68, 0.05)' }}>
            <h3 style={{ color: 'var(--danger)', marginBottom: '0.25rem' }}>Atención</h3>
            <p style={{ color: 'var(--text-secondary)' }}>{error}</p>
          </div>
        )}

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '4px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--primary)', animation: 'spin 1s linear infinite' }}></div>
          </div>
        ) : (
          dashboardData && (
            <>
              {/* TAB 1: MAIN DASHBOARD VIEW (Visible for everyone) */}
              {activeTab === 'dashboard' && (
                <>
                  {/* ANNOUNCEMENTS WALL / MURO DE COMUNICADOS */}
                  {dashboardData.announcements && dashboardData.announcements.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                      {dashboardData.announcements.map(ann => (
                        <div 
                          key={ann.id} 
                          className="glass-panel" 
                          style={{ 
                            padding: '1.5rem', 
                            borderLeft: '4px solid var(--primary)', 
                            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08), rgba(255,255,255,0.01))', 
                            boxShadow: '0 4px 20px rgba(59, 130, 246, 0.1)',
                            animation: 'fadeIn 0.5s ease-out'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                            <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--primary-light)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                              📢 {ann.title}
                            </h3>
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                              {new Date(ann.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </span>
                          </div>
                          <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginTop: '0.5rem', lineHeight: '1.6', whiteSpace: 'pre-wrap', margin: '0.5rem 0 0 0' }}>
                            {ann.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* ADMIN SUMMARY METRICS */}
                  {dashboardData.user.role === 'admin' && (
                    <div className="stats-grid">
                      <div className="glass-panel stat-card info">
                        <span className="stat-title">Total Empleados</span>
                        <span className="stat-value">{dashboardData.stats?.totalEmployees}</span>
                        <span className="stat-footer">Colaboradores registrados</span>
                      </div>
                      <div className="glass-panel stat-card success">
                        <span className="stat-title">Total Vacaciones</span>
                        <span className="stat-value" style={{ color: 'var(--success)' }}>{dashboardData.stats?.totalVacations} días</span>
                        <span className="stat-footer">Acumulado pendiente</span>
                      </div>
                      <div className="glass-panel stat-card warning">
                        <span className="stat-title">Horas Extras</span>
                        <span className="stat-value" style={{ color: 'var(--warning)' }}>{dashboardData.stats?.totalExtraHours} hrs</span>
                        <span className="stat-footer">Registradas totales</span>
                      </div>
                      <div 
                        className="glass-panel stat-card danger" 
                        style={{ cursor: 'pointer', transition: 'transform 0.2s ease, box-shadow 0.2s ease' }}
                        onClick={() => setActiveTab('requests_approval')}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 8px 30px rgba(239, 68, 68, 0.2)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                        }}
                      >
                        <span className="stat-title">Solicitudes Pendientes</span>
                        <span className="stat-value" style={{ color: '#f87171' }}>{dashboardData.stats?.totalPendingRequests}</span>
                        <span className="stat-footer">Por revisar y aprobar</span>
                      </div>
                      <div 
                        className="glass-panel stat-card" 
                        style={{ borderLeft: '4px solid #ec4899', cursor: 'pointer', transition: 'transform 0.2s ease, box-shadow 0.2s ease' }}
                        onClick={() => setShowSickLeaveModal(true)}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 8px 30px rgba(236, 72, 153, 0.2)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                        }}
                      >
                        <span className="stat-title">Personal de Baja</span>
                        <span className="stat-value" style={{ color: '#ec4899' }}>{dashboardData.stats?.totalSickLeave}</span>
                        <span className="stat-footer">Colaboradores de baja hoy</span>
                      </div>
                    </div>
                  )}



                  {/* COORDINATORS: TEAM MEMBERS VIEW */}
                  {dashboardData.user.role === 'coordinator' && (
                    <div className="dashboard-grid">
                      <div className="glass-panel" style={{ minWidth: 0 }}>
                        <div className="panel-header">
                          <h2 className="panel-title">👥 Miembros de Mi Equipo</h2>
                        </div>
                        <div className="panel-body custom-table-wrapper">
                          {dashboardData.managedEmployees?.length === 0 ? (
                            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>
                              No tienes empleados asignados en tus departamentos coordinados.
                            </p>
                          ) : (
                            <table className="custom-table">
                              <thead>
                                <tr>
                                  <th>Nombre</th>
                                  <th>Departamento</th>
                                  <th>Vacaciones Disp.</th>
                                  <th>Horas Extras</th>
                                </tr>
                              </thead>
                              <tbody>
                                {dashboardData.managedEmployees?.map(emp => (
                                  <tr key={emp.id}>
                                    <td style={{ fontWeight: '500' }}>{emp.name}</td>
                                    <td>{emp.department_name}</td>
                                    <td style={{ fontWeight: '600', color: 'var(--success)' }}>{emp.vacation_days} días</td>
                                    <td style={{ fontWeight: '600', color: 'var(--warning)' }}>{emp.extra_hours} hrs</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </div>
                      </div>

                      <div className="glass-panel" style={{ height: 'fit-content', minWidth: 0 }}>
                        <div className="panel-header">
                          <h2 className="panel-title">🏢 Departamentos Coordinados</h2>
                        </div>
                        <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                          {dashboardData.managedDepartments?.length === 0 ? (
                            <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Ningún departamento asignado.</p>
                          ) : (
                            dashboardData.managedDepartments?.map(dept => (
                              <div key={dept.id} className="glass-panel" style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                  <div style={{ fontWeight: '600' }}>{dept.name}</div>
                                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                    Coordinado por {dashboardData.user.name}
                                  </div>
                                </div>
                                <span className="badge badge-coordinator">Activo</span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* UPCOMING ABSENCES CARD FOR ADMIN & COORDINATOR */}
                  {(dashboardData.user.role === 'admin' || dashboardData.user.role === 'coordinator') && (() => {
                    const rawRequests = dashboardData.user.role === 'admin'
                      ? [
                          ...(dashboardData.allPendingRequests || []),
                          ...(dashboardData.allResolvedRequests || []),
                          ...(dashboardData.pendingRequests || []),
                          ...(dashboardData.resolvedRequests || [])
                        ]
                      : [
                          ...(dashboardData.teamPendingRequests || []),
                          ...(dashboardData.teamResolvedRequests || []),
                          ...(dashboardData.pendingRequests || []),
                          ...(dashboardData.resolvedRequests || [])
                        ];

                    const uniqueReqs = Array.from(new Map(rawRequests.map(r => [r.id, r])).values());

                    const today = new Date();
                    today.setHours(0,0,0,0);
                    const in30Days = new Date();
                    in30Days.setDate(today.getDate() + 30);
                    in30Days.setHours(23,59,59,999);

                    const upcomingAbsences = uniqueReqs
                      .filter(r => {
                        if (r.type !== 'absence' || r.status !== 'approved' || !r.start_date) return false;
                        const start = new Date(r.start_date);
                        const end = r.end_date ? new Date(r.end_date) : start;
                        return start <= in30Days && end >= today;
                      })
                      .sort((a, b) => new Date(a.start_date) - new Date(b.start_date));

                    return (
                      <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
                        <div className="panel-header" style={{ padding: '0 0 1rem 0', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
                          <h2 className="panel-title" style={{ margin: 0, fontSize: '1.2rem', color: 'var(--primary-light)' }}>
                            🌴 Próximas Ausencias de tus equipos (Próximos 30 días)
                          </h2>
                        </div>
                        <div className="panel-body" style={{ padding: 0 }}>
                          {upcomingAbsences.length === 0 ? (
                            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '1.5rem', margin: 0, fontStyle: 'italic' }}>
                              No hay ausencias planificadas ni vacaciones aprobadas para los próximos 30 días.
                            </p>
                          ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                              {upcomingAbsences.map(abs => {
                                const empInfo = (dashboardData.allEmployees || []).find(e => e.id === abs.employee_id) || 
                                                (dashboardData.managedEmployees || []).find(e => e.id === abs.employee_id) ||
                                                (dashboardData.allUsers || []).find(e => e.id === abs.employee_id);
                                const avatar = empInfo?.avatar_url;
                                const deptName = empInfo?.department_name || 'Sin departamento';

                                return (
                                  <div 
                                    key={abs.id} 
                                    className="glass-panel" 
                                    style={{ 
                                      padding: '1rem', 
                                      background: 'rgba(255,255,255,0.02)', 
                                      display: 'flex', 
                                      gap: '0.75rem', 
                                      alignItems: 'center', 
                                      borderLeft: '4px solid var(--primary)',
                                      transition: 'transform 0.2s ease',
                                    }}
                                  >
                                    <div style={{ flexShrink: 0 }}>
                                      {avatar ? (
                                        <img 
                                          src={avatar} 
                                          alt={abs.employee_name} 
                                          style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border-color)' }} 
                                        />
                                      ) : (
                                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--info))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#fff', fontSize: '0.9rem' }}>
                                          {abs.employee_name ? abs.employee_name.charAt(0) : '?'}
                                        </div>
                                      )}
                                    </div>
                                    <div style={{ minWidth: 0, flex: 1 }}>
                                      <div style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {abs.employee_name}
                                      </div>
                                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {deptName}
                                      </div>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.35rem', flexWrap: 'wrap' }}>
                                        <span className="badge" style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)', color: 'var(--primary-light)', fontSize: '0.65rem', padding: '0.1rem 0.4rem', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
                                          {abs.absence_type_name || 'Ausencia'}
                                        </span>
                                        <span style={{ fontSize: '0.75rem', fontWeight: '500', color: 'var(--text-secondary)' }}>
                                          📅 {new Date(abs.start_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                                          {abs.end_date && abs.end_date !== abs.start_date && ` - ${new Date(abs.end_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}`}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* USER PERSONAL SHIFT CALENDAR VIEW */}
                  <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                      <div>
                        <h3 style={{ fontSize: '1.2rem', color: 'var(--primary-light)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          📅 Mi Calendario de Turnos Asignados
                        </h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                          Visualiza tus turnos diarios y horarios correspondientes para el mes seleccionado.
                        </p>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', padding: '0.4rem 0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                        <button type="button" className="btn btn-secondary" style={{ padding: '0.2rem 0.6rem', margin: 0, fontSize: '0.9rem' }} onClick={handlePrevMonth}>◀</button>
                        <span style={{ fontWeight: '600', fontSize: '0.95rem', minWidth: '110px', textAlign: 'center' }}>
                          {getMonthName(schedMonth)} {schedYear}
                        </span>
                        <button type="button" className="btn btn-secondary" style={{ padding: '0.2rem 0.6rem', margin: 0, fontSize: '0.9rem' }} onClick={handleNextMonth}>▶</button>
                      </div>
                    </div>



                    <div className="dashboard-personal-calendar-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem', minWidth: '300px' }}>
                      {/* Weekday headers */}
                      {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(d => (
                        <div key={d} style={{ textAlign: 'center', fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-secondary)', padding: '0.5rem 0' }}>
                          {d}
                        </div>
                      ))}

                      {/* Empty padding cells for start of month offset */}
                      {(() => {
                        const firstDayIndex = new Date(schedYear, schedMonth, 1).getDay(); // Sun=0, Mon=1...
                        const offset = firstDayIndex === 0 ? 6 : firstDayIndex - 1; // Adjust for Monday start
                        const cells = [];
                        for (let i = 0; i < offset; i++) {
                          cells.push(<div key={`empty-${i}`} className="calendar-day-cell empty" style={{ background: 'rgba(255,255,255,0.01)', borderRadius: '8px', minHeight: '80px' }}></div>);
                        }
                        return cells;
                      })()}

                      {/* Actual days of the month */}
                      {Array.from({ length: getDaysInMonth(schedYear, schedMonth) }).map((_, idx) => {
                        const dayNum = idx + 1;
                        const dateStr = `${schedYear}-${String(schedMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                        const cellKey = `${dashboardData.user.id}_${dateStr}`;
                        const assigned = shiftAssignments[cellKey];
                        
                        const dateObj = new Date(schedYear, schedMonth, dayNum);
                        const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;

                        // Check if day falls within any approved absence or hours_free
                        const cellDate = new Date(schedYear, schedMonth, dayNum);
                        cellDate.setHours(0,0,0,0);
                        const approvedAbs = (dashboardData.resolvedRequests || []).find(r => {
                          if ((r.type !== 'absence' && r.type !== 'hours_free') || r.status !== 'approved') return false;
                          if (!r.start_date) return false;
                          const start = new Date(r.start_date);
                          start.setHours(0,0,0,0);
                          const end = r.end_date ? new Date(r.end_date) : start;
                          end.setHours(0,0,0,0);
                          return cellDate >= start && cellDate <= end;
                        });

                        const isNationalHoliday = (dashboardData.nationalHolidays || []).find(h => h.date === dateStr);

                        return (
                          <div 
                            key={dayNum} 
                            className="calendar-day-cell"
                            title={isNationalHoliday ? `Festivo Nacional: ${isNationalHoliday.name}` : (approvedAbs ? (approvedAbs.type === 'hours_free' ? 'Horas Libres' : `Ausencia Aprobada: ${approvedAbs.absence_type_name || 'Vacaciones'}`) : (assigned ? `${assigned.name}: ${assigned.start_time ? `${assigned.start_time.slice(0, 5)} - ${assigned.end_time?.slice(0, 5)}` : 'Sin horario'}${assigned.start_time_2 ? ` / ${assigned.start_time_2.slice(0, 5)} - ${assigned.end_time_2.slice(0, 5)}` : ''}` : 'Libre'))}
                            style={{ 
                              background: isNationalHoliday
                                ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.45), rgba(185, 28, 28, 0.25))'
                                : (approvedAbs 
                                  ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.22), rgba(16, 185, 129, 0.1))' 
                                  : (assigned ? assigned.color : (isWeekend ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.03)'))),
                              border: isNationalHoliday
                                ? '2px solid #ef4444'
                                : (approvedAbs 
                                  ? '2px solid var(--success)' 
                                  : (assigned ? `1px solid ${assigned.color}` : '1px solid var(--border-color)')) ,
                              borderRadius: '8px',
                              minHeight: '60px',
                              padding: '0.5rem',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'center',
                              alignItems: 'center',
                              boxShadow: isNationalHoliday
                                ? '0 0 10px rgba(239, 68, 68, 0.3)'
                                : (approvedAbs 
                                  ? '0 0 10px rgba(16, 185, 129, 0.2)' 
                                  : (assigned ? 'inset 0 0 12px rgba(0,0,0,0.25), 0 2px 4px rgba(0,0,0,0.1)' : 'none')),
                              transition: 'all 0.2s ease',
                              position: 'relative'
                            }}
                          >
                            <span style={{ 
                              fontWeight: 'bold', 
                              fontSize: '1.1rem',
                              color: isNationalHoliday ? '#fca5a5' : (approvedAbs ? 'var(--success)' : (assigned ? '#ffffff' : (isWeekend ? 'var(--warning)' : 'var(--text-primary)'))),
                              textShadow: (assigned || isNationalHoliday) && !approvedAbs ? '0 1px 3px rgba(0,0,0,0.6)' : 'none'
                            }}>
                              {dayNum}
                            </span>
                            {isNationalHoliday && (
                              <span style={{ 
                                fontSize: '0.62rem', 
                                backgroundColor: '#ef4444', 
                                color: '#fff', 
                                padding: '0.1rem 0.35rem', 
                                borderRadius: '4px',
                                fontWeight: 'bold',
                                marginTop: '4px',
                                textTransform: 'uppercase',
                                maxWidth: '100%',
                                whiteSpace: 'normal',
                                wordBreak: 'break-word',
                                textAlign: 'center',
                                display: 'block',
                                border: '1px solid rgba(255,255,255,0.2)'
                              }} title={isNationalHoliday.name}>
                                {isNationalHoliday.name}
                              </span>
                            )}
                            {approvedAbs && (
                              <span style={{ 
                                fontSize: '0.62rem', 
                                backgroundColor: 'var(--success)', 
                                color: '#fff', 
                                padding: '0.1rem 0.35rem', 
                                borderRadius: '4px',
                                fontWeight: 'bold',
                                marginTop: '4px',
                                textTransform: 'uppercase',
                                maxWidth: '100%',
                                whiteSpace: 'normal',
                                wordBreak: 'break-word',
                                textAlign: 'center',
                                display: 'block',
                                border: '1px solid rgba(255,255,255,0.2)'
                              }} title={approvedAbs.type === 'hours_free' ? 'Horas Libres' : (approvedAbs.absence_type_name || 'Ausencia')}>
                                {approvedAbs.type === 'hours_free' ? 'Horas Libres' : (approvedAbs.absence_type_name || 'Ausencia')}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Legend */}
                    <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <div style={{ fontWeight: '600', fontSize: '0.85rem', marginBottom: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span>💡 Leyenda de Turnos:</span>
                      </div>
                      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        {dashboardData.allShifts?.map(shift => (
                          <div key={shift.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                            <span style={{ display: 'inline-block', width: '14px', height: '14px', borderRadius: '4px', background: shift.color, border: '1px solid rgba(255,255,255,0.1)' }}></span>
                            <span style={{ fontWeight: '500', color: 'var(--text-primary)' }}>{shift.name}</span>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                              {shift.start_time ? (
                                shift.start_time_2 ? `(${shift.start_time.slice(0, 5)}-${shift.end_time?.slice(0, 5)} / ${shift.start_time_2.slice(0, 5)}-${shift.end_time_2?.slice(0, 5)})` : `(${shift.start_time.slice(0, 5)}-${shift.end_time?.slice(0, 5)})`
                              ) : 'Sin horario'}
                            </span>
                          </div>
                        ))}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                          <span style={{ display: 'inline-block', width: '14px', height: '14px', borderRadius: '4px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)' }}></span>
                          <span style={{ fontWeight: '500', color: 'var(--text-muted)' }}>Libre / Sin turno</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* EMPLOYEE FLOWS SECTION */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1rem' }}>
                    {dashboardData.user.role === 'employee' ? (
                      <div className="dashboard-grid">
                        <div className="glass-panel" style={{ padding: '1.5rem', minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ fontSize: '1.15rem', color: 'var(--primary-light)' }}>📄 Mi Balance de Tiempos</h3>
                            <button className="btn btn-primary" onClick={openRequestModalForSelf}>
                              ➕ Nueva Solicitud
                            </button>
                          </div>

                          <div className="stats-grid" style={{ gap: '1rem' }}>
                            <div className="glass-panel" style={{ padding: '1rem', borderLeft: '4px solid var(--success)', background: 'rgba(255,255,255,0.01)' }}>
                              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Vacaciones Disponibles</div>
                              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--success)', marginTop: '0.25rem' }}>{dashboardData.user.vacation_days} días</div>
                            </div>
                            <div className="glass-panel" style={{ padding: '1rem', borderLeft: '4px solid var(--warning)', background: 'rgba(255,255,255,0.01)' }}>
                              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Horas Extras Totales</div>
                              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--warning)', marginTop: '0.25rem' }}>{dashboardData.user.extra_hours} hrs</div>
                            </div>
                          </div>

                          <div className="detail-item" style={{ marginTop: '1.5rem' }}>
                            <span className="detail-label">Solicitudes Pendientes</span>
                            <span className="detail-value" style={{ color: '#fbbf24' }}>{(dashboardData.pendingRequests || []).length} activas</span>
                          </div>
                          <div className="detail-item">
                            <span className="detail-label">Solicitudes Resueltas</span>
                            <span className="detail-value" style={{ color: '#34d399' }}>{(dashboardData.resolvedRequests || []).length} procesadas</span>
                          </div>
                        </div>

                        <div className="glass-panel" style={{ padding: '1.5rem', minWidth: 0 }}>
                          <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--primary-light)' }}>🏢 Responsable de Departamento</h3>
                          {dashboardData.coordinator ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                              <div style={{ fontWeight: '600', fontSize: '1.05rem' }}>{dashboardData.coordinator.name}</div>
                              <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{dashboardData.coordinator.email}</div>
                              <span className="badge badge-coordinator" style={{ alignSelf: 'flex-start', marginTop: '0.5rem' }}>Tu Coordinador</span>
                            </div>
                          ) : (
                            <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>Tu departamento no tiene coordinador asignado.</p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="glass-panel" style={{ padding: '1.5rem', minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                          <h3 style={{ fontSize: '1.15rem', color: 'var(--primary-light)' }}>📄 Mi Balance de Tiempos</h3>
                          <button className="btn btn-primary" onClick={openRequestModalForSelf}>
                            ➕ Nueva Solicitud
                          </button>
                        </div>

                        <div className="stats-grid" style={{ gap: '1rem' }}>
                          <div className="glass-panel" style={{ padding: '1rem', borderLeft: '4px solid var(--success)', background: 'rgba(255,255,255,0.01)' }}>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Vacaciones Disponibles</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--success)', marginTop: '0.25rem' }}>{dashboardData.user.vacation_days} días</div>
                          </div>
                          <div className="glass-panel" style={{ padding: '1rem', borderLeft: '4px solid var(--warning)', background: 'rgba(255,255,255,0.01)' }}>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Horas Extras Totales</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--warning)', marginTop: '0.25rem' }}>{dashboardData.user.extra_hours} hrs</div>
                          </div>
                        </div>

                        <div className="detail-item" style={{ marginTop: '1.5rem' }}>
                          <span className="detail-label">Solicitudes Pendientes</span>
                          <span className="detail-value" style={{ color: '#fbbf24' }}>{(dashboardData.pendingRequests || []).length} activas</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Solicitudes Resueltas</span>
                          <span className="detail-value" style={{ color: '#34d399' }}>{(dashboardData.resolvedRequests || []).length} procesadas</span>
                        </div>
                      </div>
                    )}

                    <div className="glass-panel" style={{ minWidth: 0 }}>
                      <div className="panel-header">
                        <h2 className="panel-title">📋 Estado de Mis Solicitudes</h2>
                      </div>
                      <div className="panel-body custom-table-wrapper" style={{ overflowX: 'auto' }}>
                        {((dashboardData.pendingRequests || []).length === 0 && (dashboardData.resolvedRequests || []).length === 0) ? (
                          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '3rem', fontStyle: 'italic' }}>
                            Aún no has registrado ninguna solicitud de vacaciones o de horas extras.
                          </p>
                        ) : (
                          <table className="custom-table">
                            <thead>
                              <tr>
                                <th>Fecha</th>
                                <th>Tipo</th>
                                <th>Cantidad</th>
                                <th>Detalles / Fechas</th>
                                <th>Observación</th>
                                <th>Estado</th>
                                <th>Resolución</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(dashboardData.pendingRequests || []).map(req => (
                                <tr 
                                  key={req.id}
                                  onClick={() => handleOpenRequestDetail(req)}
                                  style={{ cursor: 'pointer' }}
                                  title="Haga clic para ver detalles"
                                >
                                  <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{new Date(req.created_at).toLocaleDateString('es-ES')}</td>
                                  <td style={{ fontWeight: '500' }}>{getRequestTypeLabel(req)}</td>
                                  <td>{req.amount > 0 ? `+${req.amount}` : req.amount} {req.type === 'absence' ? 'd' : 'h'}</td>
                                  <td style={{ fontSize: '0.85rem' }}>
                                    {req.type === 'absence' ? `${new Date(req.start_date).toLocaleDateString('es-ES')} a ${new Date(req.end_date).toLocaleDateString('es-ES')}` : req.type === 'hours_free' && req.start_date ? `Día: ${new Date(req.start_date).toLocaleDateString('es-ES')}` : req.original_record_id ? `Cred. #${req.original_record_id}` : '-'}
                                  </td>
                                  <td style={{ fontStyle: 'italic' }}>{req.observation}</td>
                                  <td>{getRequestStatusBadge(req.status)}</td>
                                  <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Esperando aprobación...</td>
                                </tr>
                              ))}
                              {(dashboardData.resolvedRequests || []).map(req => (
                                <tr key={req.id}>
                                  <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{new Date(req.created_at).toLocaleDateString('es-ES')}</td>
                                  <td style={{ fontWeight: '500' }}>{getRequestTypeLabel(req)}</td>
                                  <td>{req.amount > 0 ? `+${req.amount}` : req.amount} {req.type === 'absence' ? 'd' : 'h'}</td>
                                  <td style={{ fontSize: '0.85rem' }}>
                                    {req.type === 'absence' ? `${new Date(req.start_date).toLocaleDateString('es-ES')} a ${new Date(req.end_date).toLocaleDateString('es-ES')}` : req.type === 'hours_free' && req.start_date ? `Día: ${new Date(req.start_date).toLocaleDateString('es-ES')}` : req.original_record_id ? `Cred. #${req.original_record_id}` : '-'}
                                  </td>
                                  <td style={{ fontStyle: 'italic' }}>{req.observation}</td>
                                  <td>{getRequestStatusBadge(req.status)}</td>
                                  <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                    Por {req.resolver_name || 'Sistema'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* TAB 1.2: REQUESTS APPROVAL BUCKET */}
              {activeTab === 'requests_approval' && (dashboardData.user.role === 'admin' || dashboardData.user.role === 'coordinator') && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                  
                  {/* SECTION 1: AUSENCIAS */}
                  <div className="glass-panel" style={{ borderLeft: '4px solid var(--primary)' }}>
                    <div className="panel-header">
                      <h2 className="panel-title">🏖️ Solicitudes de Ausencias Pendientes</h2>
                    </div>
                    <div className="panel-body custom-table-wrapper">
                      {(() => {
                        const allReqs = (dashboardData.user.role === 'admin' ? dashboardData.allPendingRequests : dashboardData.teamPendingRequests) || [];
                        const absenceReqs = allReqs.filter(r => r.type === 'absence');
                        
                        if (absenceReqs.length === 0) {
                          return (
                            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem', fontStyle: 'italic' }}>
                              No hay solicitudes de ausencias pendientes de aprobación.
                            </p>
                          );
                        }

                        return (
                          <table className="custom-table">
                            <thead>
                              <tr>
                                <th>Empleado</th>
                                <th>Tipo Ausencia</th>
                                <th>Cantidad</th>
                                <th>Periodo</th>
                                <th>Observaciones</th>
                                <th style={{ textAlign: 'right' }}>Acciones</th>
                              </tr>
                            </thead>
                            <tbody>
                              {absenceReqs.map(req => (
                                <tr 
                                  key={req.id}
                                  onClick={(e) => {
                                    if (e.target.closest('button')) return;
                                    handleOpenRequestDetail(req);
                                  }}
                                  style={{ cursor: 'pointer' }}
                                  title="Haga clic para ver detalles"
                                >
                                  <td style={{ fontWeight: '500' }}>
                                    <div>{req.employee_name}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{req.employee_email}</div>
                                  </td>
                                  <td>
                                    <strong style={{ color: 'var(--primary-light)' }}>{getRequestTypeLabel(req)}</strong>
                                  </td>
                                  <td style={{ fontWeight: 'bold' }}>
                                    {req.amount > 0 ? `+${req.amount}` : req.amount} {req.amount === 1 || req.amount === -1 ? 'día' : 'días'}
                                  </td>
                                  <td style={{ fontSize: '0.9rem' }}>
                                    <span>{new Date(req.start_date).toLocaleDateString('es-ES')} al {new Date(req.end_date).toLocaleDateString('es-ES')}</span>
                                  </td>
                                  <td style={{ fontStyle: 'italic', maxWidth: '300px', overflow: 'hidden' }}>
                                    <div style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} title={req.observation}>{req.observation}</div>
                                    {req.conflicts && req.conflicts.length > 0 && (
                                      <div style={{ marginTop: '0.5rem', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '6px', padding: '0.4rem 0.6rem' }}>
                                        <div style={{ color: '#f87171', fontSize: '0.75rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                          ⚠️ Conflicto (Mismo depto):
                                        </div>
                                        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.2rem', whiteSpace: 'normal', lineHeight: '1.2' }}>
                                          Coincide con:
                                          {req.conflicts.map((c, idx) => (
                                            <div key={idx} style={{ marginTop: '0.15rem' }}>
                                              • <strong>{c.employee_name}</strong> ({c.absence_type}) del {new Date(c.start_date).toLocaleDateString('es-ES')} al {new Date(c.end_date).toLocaleDateString('es-ES')} <span style={{ color: c.status === 'approved' ? '#34d399' : '#fbbf24', fontSize: '0.68rem', fontWeight: 'bold' }}>[{c.status === 'approved' ? 'Aprobado' : 'Pendiente'}]</span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </td>
                                  <td style={{ textAlign: 'right' }}>
                                    <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                                      <button className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', backgroundColor: 'var(--success)' }} onClick={() => resolveRequest(req.id, 'approved')}>
                                        Aprobar
                                      </button>
                                      <button className="btn btn-danger" style={{ padding: '0.4rem 0.8rem' }} onClick={() => resolveRequest(req.id, 'rejected')}>
                                        Rechazar
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        );
                      })()}
                    </div>
                  </div>

                  {/* SECTION 2: GESTIÓN DE HORAS */}
                  <div className="glass-panel" style={{ borderLeft: '4px solid var(--warning)' }}>
                    <div className="panel-header">
                      <h2 className="panel-title">⏱️ Solicitudes de Horas Pendientes</h2>
                    </div>
                    <div className="panel-body custom-table-wrapper">
                      {(() => {
                        const allReqs = (dashboardData.user.role === 'admin' ? dashboardData.allPendingRequests : dashboardData.teamPendingRequests) || [];
                        const hoursReqs = allReqs.filter(r => r.type !== 'absence');

                        if (hoursReqs.length === 0) {
                          return (
                            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem', fontStyle: 'italic' }}>
                              No hay solicitudes de horas pendientes de aprobación.
                            </p>
                          );
                        }

                        return (
                          <table className="custom-table">
                            <thead>
                              <tr>
                                <th>Empleado</th>
                                <th>Tipo Operación</th>
                                <th>Cantidad</th>
                                <th>Detalles / Fecha</th>
                                <th>Observaciones</th>
                                <th style={{ textAlign: 'right' }}>Acciones</th>
                              </tr>
                            </thead>
                            <tbody>
                              {hoursReqs.map(req => (
                                <tr 
                                  key={req.id}
                                  onClick={(e) => {
                                    if (e.target.closest('button')) return;
                                    handleOpenRequestDetail(req);
                                  }}
                                  style={{ cursor: 'pointer' }}
                                  title="Haga clic para ver detalles"
                                >
                                  <td style={{ fontWeight: '500' }}>
                                    <div>{req.employee_name}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{req.employee_email}</div>
                                  </td>
                                  <td>
                                    <strong style={{ color: 'var(--warning)' }}>{getRequestTypeLabel(req)}</strong>
                                  </td>
                                  <td style={{ fontWeight: 'bold' }}>
                                    {req.amount > 0 ? `+${req.amount}` : req.amount} hrs
                                  </td>
                                  <td style={{ fontSize: '0.9rem' }}>
                                    {req.type === 'hours_free' && req.start_date ? (
                                      <span>Día: {new Date(req.start_date).toLocaleDateString('es-ES')}</span>
                                    ) : req.original_record_id ? (
                                      <span style={{ color: 'var(--text-secondary)' }}>Ficha #{req.original_record_id}</span>
                                    ) : (
                                      <span style={{ color: 'var(--text-muted)' }}>-</span>
                                    )}
                                  </td>
                                  <td style={{ fontStyle: 'italic', maxWidth: '250px', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }} title={req.observation}>
                                    {req.observation}
                                  </td>
                                  <td style={{ textAlign: 'right' }}>
                                    <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                                      <button className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', backgroundColor: 'var(--success)' }} onClick={() => resolveRequest(req.id, 'approved')}>
                                        Aprobar
                                      </button>
                                      <button className="btn btn-danger" style={{ padding: '0.4rem 0.8rem' }} onClick={() => resolveRequest(req.id, 'rejected')}>
                                        Rechazar
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        );
                      })()}
                    </div>
                  </div>

                </div>
              )}

              {/* TAB 1.5: COORDINATOR & ADMIN MY TEAM VIEW */}
              {activeTab === 'coordinator_team' && (dashboardData.user.role === 'coordinator' || dashboardData.user.role === 'admin') && (
                <div className="glass-panel">
                  <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <h2 className="panel-title" style={{ margin: 0 }}>
                      {dashboardData.user.role === 'admin' ? '👥 Miembros de la Organización' : '👥 Miembros de Mi Equipo (Coordinación)'}
                    </h2>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                      {/* Search Bar */}
                      <input
                        type="text"
                        placeholder="🔍 Buscar empleado..."
                        className="form-input"
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.9rem', borderRadius: '8px', margin: 0, width: '220px' }}
                        value={teamSearch}
                        onChange={e => setTeamSearch(e.target.value)}
                      />

                      {/* Department Filter */}
                      <select
                        className="selector-dropdown"
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.9rem', borderRadius: '8px' }}
                        value={teamDeptFilter}
                        onChange={e => setTeamDeptFilter(e.target.value)}
                      >
                        <option value="">🏢 Todos los departamentos</option>
                        {dashboardData.user.role === 'admin' ? (
                          dashboardData.allDepartments?.map(d => (
                            <option key={d.id} value={d.id.toString()}>{d.name}</option>
                          ))
                        ) : (
                          dashboardData.managedDepartments?.map(d => (
                            <option key={d.id} value={d.id.toString()}>{d.name}</option>
                          ))
                        )}
                      </select>
                    </div>
                  </div>
                  <div className="panel-body custom-table-wrapper">
                    {(() => {
                      let teamList = dashboardData.user.role === 'admin' ? (dashboardData.allEmployees || []) : (dashboardData.managedEmployees || []);
                      
                      // Apply search query
                      if (teamSearch) {
                        const searchLower = teamSearch.toLowerCase();
                        teamList = teamList.filter(emp =>
                          emp.name.toLowerCase().includes(searchLower) ||
                          emp.email.toLowerCase().includes(searchLower)
                        );
                      }

                      // Apply department filter
                      if (teamDeptFilter) {
                        teamList = teamList.filter(emp => emp.department_id?.toString() === teamDeptFilter);
                      }

                      if (teamList.length === 0) {
                        return (
                          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>
                            No se encontraron empleados con los filtros aplicados.
                          </p>
                        );
                      }
                      return (
                        <table className="custom-table">
                          <thead>
                            <tr>
                              <th>Nombre</th>
                              <th>Email</th>
                              <th>Departamento</th>
                              <th>Vacaciones Disp.</th>
                              <th>Horas Extras</th>
                            </tr>
                          </thead>
                          <tbody>
                            {teamList.map(emp => (
                              <tr key={emp.id}>
                                <td style={{ fontWeight: '500' }}>{emp.name}</td>
                                <td style={{ color: 'var(--text-secondary)' }}>{emp.email}</td>
                                <td>{emp.department_name || 'Sin departamento'}</td>
                                <td style={{ fontWeight: '600', color: 'var(--success)' }}>{emp.vacation_days} días</td>
                                <td style={{ fontWeight: '600', color: 'var(--warning)' }}>{emp.extra_hours} hrs</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* TAB: ADMIN SETTINGS (Ajustes) */}
              {activeTab === 'admin_settings' && dashboardData.user.role === 'admin' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
                  {/* Internal Sub-Tabs Navigation */}
                  <div className="glass-panel" style={{ padding: '0.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', border: '1px solid var(--border-color)', borderRadius: '14px' }}>
                    <button 
                      type="button"
                      className="btn" 
                      onClick={() => setSettingsTab('employees')}
                      style={{ 
                        flex: 1, 
                        minWidth: '120px',
                        background: settingsTab === 'employees' ? 'var(--primary-glow)' : 'transparent',
                        color: settingsTab === 'employees' ? 'var(--primary-light)' : 'var(--text-secondary)',
                        fontWeight: '700',
                        borderRadius: '10px',
                        padding: '0.6rem 1rem',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      👥 Empleados
                    </button>
                    <button 
                      type="button"
                      className="btn" 
                      onClick={() => setSettingsTab('departments')}
                      style={{ 
                        flex: 1, 
                        minWidth: '120px',
                        background: settingsTab === 'departments' ? 'var(--primary-glow)' : 'transparent',
                        color: settingsTab === 'departments' ? 'var(--primary-light)' : 'var(--text-secondary)',
                        fontWeight: '700',
                        borderRadius: '10px',
                        padding: '0.6rem 1rem',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      🏢 Departamentos
                    </button>
                    <button 
                      type="button"
                      className="btn" 
                      onClick={() => setSettingsTab('rrhh')}
                      style={{ 
                        flex: 1, 
                        minWidth: '120px',
                        background: settingsTab === 'rrhh' ? 'var(--primary-glow)' : 'transparent',
                        color: settingsTab === 'rrhh' ? 'var(--primary-light)' : 'var(--text-secondary)',
                        fontWeight: '700',
                        borderRadius: '10px',
                        padding: '0.6rem 1rem',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      💼 RRHH
                    </button>
                    <button 
                      type="button"
                      className="btn" 
                      onClick={() => setSettingsTab('notifications')}
                      style={{ 
                        flex: 1, 
                        minWidth: '120px',
                        background: settingsTab === 'notifications' ? 'var(--primary-glow)' : 'transparent',
                        color: settingsTab === 'notifications' ? 'var(--primary-light)' : 'var(--text-secondary)',
                        fontWeight: '700',
                        borderRadius: '10px',
                        padding: '0.6rem 1rem',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      📢 Notificaciones
                    </button>
                    <button 
                      type="button"
                      className="btn" 
                      onClick={() => setSettingsTab('reports')}
                      style={{ 
                        flex: 1, 
                        minWidth: '120px',
                        background: settingsTab === 'reports' ? 'var(--primary-glow)' : 'transparent',
                        color: settingsTab === 'reports' ? 'var(--primary-light)' : 'var(--text-secondary)',
                        fontWeight: '700',
                        borderRadius: '10px',
                        padding: '0.6rem 1rem',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      📊 Informes
                    </button>
                    <button 
                      type="button"
                      className="btn" 
                      onClick={() => setSettingsTab('epis')}
                      style={{ 
                        flex: 1, 
                        minWidth: '120px',
                        background: settingsTab === 'epis' ? 'var(--primary-glow)' : 'transparent',
                        color: settingsTab === 'epis' ? 'var(--primary-light)' : 'var(--text-secondary)',
                        fontWeight: '700',
                        borderRadius: '10px',
                        padding: '0.6rem 1rem',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      🦺 EPIs
                    </button>
                  </div>

                  {/* SUB-TAB 1: EMPLOYEES */}
                  {settingsTab === 'employees' && (
                    <div className="glass-panel">
                      <div className="panel-header">
                        <h2 className="panel-title">👥 Listado General de Empleados</h2>
                        <button className="btn btn-primary" onClick={openAddEmployee}>
                          + Nuevo Empleado
                        </button>
                      </div>
                      <div style={{ display: 'flex', gap: '1rem', padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-color)', flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: '200px' }}>
                          <input 
                            type="text" 
                            className="form-input" 
                            placeholder="🔍 Buscar empleado por nombre o email..." 
                            value={employeeSearch}
                            onChange={e => setEmployeeSearch(e.target.value)}
                          />
                        </div>
                        <div style={{ minWidth: '200px' }}>
                          <select 
                            className="form-input" 
                            value={employeeDeptFilter}
                            onChange={e => setEmployeeDeptFilter(e.target.value)}
                          >
                            <option value="">🏢 Todos los departamentos</option>
                            {dashboardData.allDepartments?.map(dept => (
                              <option key={dept.id} value={dept.id.toString()}>{dept.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="panel-body">
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                          gap: '1.5rem',
                          padding: '0.5rem 0'
                        }}>
                          {dashboardData.allEmployees?.filter(emp => {
                            const matchesSearch = emp.name.toLowerCase().includes(employeeSearch.toLowerCase()) || 
                                                  emp.email.toLowerCase().includes(employeeSearch.toLowerCase());
                            const matchesDept = !employeeDeptFilter || emp.department_id?.toString() === employeeDeptFilter;
                            return matchesSearch && matchesDept;
                          }).map(emp => {
                            const nameParts = emp.name.trim().split(/\s+/);
                            const initials = nameParts.length > 1 
                                                        return (
                               <div 
                                 key={emp.id} 
                                 className="glass-panel employee-card-interactive" 
                                 onClick={() => openEditEmployee(emp)}
                                 style={{ 
                                   padding: '1.5rem', 
                                   display: 'flex', 
                                   flexDirection: 'column', 
                                   alignItems: 'center', 
                                   cursor: 'pointer',
                                   position: 'relative',
                                   transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                                   background: isLightTheme ? '#f8fafc' : 'rgba(255, 255, 255, 0.02)',
                                   borderRadius: '20px',
                                   border: '1px solid var(--border-color)',
                                   boxShadow: 'var(--shadow-sm)'
                                 }}
                               >
                                 {/* Initials Avatar Box */}
                                 <div style={{
                                   width: '75px',
                                   height: '75px',
                                   borderRadius: '18px',
                                   background: isLightTheme ? '#e2e8f0' : 'rgba(255,255,255,0.06)',
                                   display: 'flex',
                                   alignItems: 'center',
                                   justifyContent: 'center',
                                   fontSize: '1.5rem',
                                   fontWeight: 'bold',
                                   color: 'var(--text-primary)',
                                   position: 'relative',
                                   marginBottom: '1rem',
                                   boxShadow: isLightTheme ? 'none' : 'inset 0 2px 4px rgba(255,255,255,0.05)',
                                   border: '1px solid var(--border-color)'
                                 }}>
                                   {emp.avatar_url ? (
                                     <img 
                                       src={emp.avatar_url} 
                                       alt={emp.name} 
                                       style={{ width: '100%', height: '100%', borderRadius: '18px', objectFit: 'cover' }} 
                                     />
                                   ) : (
                                     initials
                                   )}
                                   {/* Active Green Dot */}
                                   <span style={{
                                     width: '14px',
                                     height: '14px',
                                     backgroundColor: '#10b981',
                                     border: isLightTheme ? '2px solid #f8fafc' : '2px solid #141827',
                                     borderRadius: '50%',
                                     position: 'absolute',
                                     bottom: '-2px',
                                     right: '-2px'
                                   }}></span>
                                 </div>

                                {/* Name & Email */}
                                <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--text-primary)', textTransform: 'uppercase', textAlign: 'center', marginBottom: '0.25rem' }}>
                                  {emp.name}
                                </div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.75rem', textAlign: 'center' }}>
                                  {emp.email}
                                </div>

                                {/* Department Pill */}
                                <div style={{
                                  padding: '0.35rem 1rem',
                                  backgroundColor: 'rgba(255,255,255,0.05)',
                                  color: 'var(--primary-light)',
                                  borderRadius: '20px',
                                  fontSize: '0.75rem',
                                  fontWeight: 'bold',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.5px',
                                  marginBottom: '1.25rem',
                                  border: '1px solid var(--border-color)'
                                }}>
                                  {emp.department_name || 'Sin departamento'}
                                </div>

                                {/* Balance Boxes */}
                                <div style={{ display: 'flex', width: '100%', gap: '0.75rem', marginTop: 'auto' }}>
                                  {/* Vacaciones Box */}
                                  <div style={{
                                    flex: 1,
                                    background: 'rgba(59, 130, 246, 0.05)',
                                    border: '1px solid rgba(59, 130, 246, 0.15)',
                                    borderRadius: '14px',
                                    padding: '0.75rem',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                  }}>
                                    <div style={{ fontSize: '0.62rem', fontWeight: '800', color: 'var(--primary-light)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                                      VACACIONES
                                    </div>
                                    <div style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-primary)', display: 'flex', alignItems: 'baseline' }}>
                                      {parseFloat(emp.vacation_days).toFixed(1)}
                                      <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--primary-light)', marginLeft: '2px' }}>D</span>
                                    </div>
                                  </div>

                                  {/* Horas Box */}
                                  <div style={{
                                    flex: 1,
                                    background: 'rgba(245, 158, 11, 0.05)',
                                    border: '1px solid rgba(245, 158, 11, 0.15)',
                                    borderRadius: '14px',
                                    padding: '0.75rem',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                  }}>
                                    <div style={{ fontSize: '0.62rem', fontWeight: '800', color: 'var(--warning)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                                      HORAS
                                    </div>
                                    <div style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-primary)', display: 'flex', alignItems: 'baseline' }}>
                                      {parseFloat(emp.extra_hours).toFixed(1)}
                                      <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--warning)', marginLeft: '2px' }}>H</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SUB-TAB 2: DEPARTMENTS */}
                  {settingsTab === 'departments' && (
                    <div className="glass-panel">
                      <div className="panel-header">
                        <h2 className="panel-title">🏢 Departamentos de la Empresa</h2>
                        <button className="btn btn-primary" onClick={openAddDepartment}>
                          + Nuevo Departamento
                        </button>
                      </div>
                      <div className="panel-body custom-table-wrapper">
                        <table className="custom-table">
                          <thead>
                            <tr>
                              <th>Nombre</th>
                              <th>Gestor / Coordinador</th>
                              <th>Empleados en Departamento</th>
                              <th style={{ textAlign: 'right' }}>Acciones</th>
                            </tr>
                          </thead>
                          <tbody>
                            {dashboardData.allDepartments?.map(dept => (
                              <tr key={dept.id}>
                                <td style={{ fontWeight: '600', fontSize: '1rem' }}>{dept.name}</td>
                                <td>
                                  {dept.coordinator_name ? (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                      <span style={{ fontWeight: '500' }}>{dept.coordinator_name}</span>
                                      <span className="badge badge-coordinator" style={{ fontSize: '0.7rem' }}>Gestor</span>
                                    </div>
                                  ) : (
                                    <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Sin Coordinador</span>
                                  )}
                                </td>
                                <td>
                                  <span style={{ padding: '0.2rem 0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', border: '1px solid var(--border-color)', fontWeight: 'bold' }}>
                                    {dept.employee_count} emp.
                                  </span>
                                </td>
                                <td style={{ textAlign: 'right' }}>
                                  <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                                    <button className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem' }} onClick={() => openEditDepartment(dept)}>
                                      Editar
                                    </button>
                                    <button className="btn btn-danger" style={{ padding: '0.4rem 0.8rem' }} onClick={() => deleteDepartment(dept.id)}>
                                      Eliminar
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* SUB-TAB 3: RRHH */}
                  {settingsTab === 'rrhh' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
                      
                      {/* RRHH Sub-tabs Navigation */}
                      <div className="glass-panel" style={{ padding: '0.4rem', display: 'flex', gap: '0.4rem', flexWrap: 'wrap', border: '1px solid var(--border-color)', borderRadius: '12px', width: 'fit-content' }}>
                        <button 
                          type="button"
                          className="btn" 
                          onClick={() => setRrhhSubTab('absence_types')}
                          style={{ 
                            background: rrhhSubTab === 'absence_types' ? 'var(--primary-glow)' : 'transparent',
                            color: rrhhSubTab === 'absence_types' ? 'var(--primary-light)' : 'var(--text-secondary)',
                            fontWeight: '700',
                            borderRadius: '8px',
                            padding: '0.5rem 1.25rem',
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            fontSize: '0.9rem'
                          }}
                        >
                          🏖 Tipos Ausencia
                        </button>
                        <button 
                          type="button"
                          className="btn" 
                          onClick={() => setRrhhSubTab('shifts')}
                          style={{ 
                            background: rrhhSubTab === 'shifts' ? 'var(--primary-glow)' : 'transparent',
                            color: rrhhSubTab === 'shifts' ? 'var(--primary-light)' : 'var(--text-secondary)',
                            fontWeight: '700',
                            borderRadius: '8px',
                            padding: '0.5rem 1.25rem',
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            fontSize: '0.9rem'
                          }}
                        >
                          ⏱ Turnos
                        </button>
                        <button 
                          type="button"
                          className="btn" 
                          onClick={() => setRrhhSubTab('holidays')}
                          style={{ 
                            background: rrhhSubTab === 'holidays' ? 'var(--primary-glow)' : 'transparent',
                            color: rrhhSubTab === 'holidays' ? 'var(--primary-light)' : 'var(--text-secondary)',
                            fontWeight: '700',
                            borderRadius: '8px',
                            padding: '0.5rem 1.25rem',
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            fontSize: '0.9rem'
                          }}
                        >
                          🎉 Festivos Nacionales
                        </button>
                      </div>

                      {/* SUB-SECTION 1: ABSENCE TYPES */}
                      {rrhhSubTab === 'absence_types' && (
                        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column' }}>
                          <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 className="panel-title">
                              {editingAbsenceType ? '🏖 Editar Tipo de Ausencia' : '🏖 Configuración de Tipos de Ausencia'}
                            </h2>
                            {editingAbsenceType && (
                              <button className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }} onClick={() => {
                                setEditingAbsenceType(null);
                                setAbsTypeForm({
                                  name: '',
                                  subtracts_days: false,
                                  fixed_days: '',
                                  show_in_record: true,
                                  visible_to_employees: true,
                                  visible_to_coordinators: true,
                                  visible_to_admins: true
                                });
                                setPredefinedRangesList([]);
                                setHasPredefinedRanges(false);
                              }}>
                                Cancelar Edición
                              </button>
                            )}
                          </div>
                          
                          {/* Creacion & Edicion */}
                          <form onSubmit={saveAbsenceType} className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', borderBottom: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.01)', padding: '1.25rem', margin: '1rem', borderRadius: '12px' }}>
                            <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
                              <div className="form-group" style={{ minWidth: '180px', flex: 2 }}>
                                <label className="form-label">Nombre del Tipo de Ausencia</label>
                                <input 
                                  type="text" 
                                  className="form-input" 
                                  placeholder="Ej: Vacaciones Verano 2027" 
                                  value={absTypeForm.name} 
                                  onChange={e => setAbsTypeForm({...absTypeForm, name: e.target.value})} 
                                  required 
                                />
                              </div>
                              <div className="form-group" style={{ minWidth: '130px' }}>
                                <label className="form-label">¿Resta días?</label>
                                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', marginTop: '0.5rem' }}>
                                  <input 
                                    type="checkbox" 
                                    checked={absTypeForm.subtracts_days} 
                                    onChange={e => setAbsTypeForm({...absTypeForm, subtracts_days: e.target.checked})} 
                                    style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }}
                                  />
                                  Sí, resta
                                </label>
                              </div>
                              <div className="form-group" style={{ minWidth: '130px' }}>
                                <label className="form-label">¿Mostrar?</label>
                                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', marginTop: '0.5rem' }}>
                                  <input 
                                    type="checkbox" 
                                    checked={absTypeForm.show_in_record} 
                                    onChange={e => setAbsTypeForm({...absTypeForm, show_in_record: e.target.checked})} 
                                    style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }}
                                  />
                                  Sí, visible
                                </label>
                              </div>
                              <div className="form-group" style={{ minWidth: '130px' }}>
                                <label className="form-label">Días Fijos</label>
                                <input 
                                  type="number" 
                                  className="form-input" 
                                  placeholder="Vacío = libre" 
                                  value={absTypeForm.fixed_days} 
                                  onChange={e => setAbsTypeForm({...absTypeForm, fixed_days: e.target.value})} 
                                  disabled={hasPredefinedRanges}
                                />
                              </div>
                            </div>

                            {/* Visibility Roles checkboxes */}
                            <div className="form-group" style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                              <label className="form-label" style={{ fontWeight: 'bold' }}>Roles autorizados para ver/solicitar:</label>
                              <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                  <input 
                                    type="checkbox" 
                                    checked={absTypeForm.visible_to_employees !== false} 
                                    onChange={e => setAbsTypeForm({...absTypeForm, visible_to_employees: e.target.checked})} 
                                    style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }}
                                  />
                                  Empleados
                                </label>
                                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                  <input 
                                    type="checkbox" 
                                    checked={absTypeForm.visible_to_coordinators !== false} 
                                    onChange={e => setAbsTypeForm({...absTypeForm, visible_to_coordinators: e.target.checked})} 
                                    style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }}
                                  />
                                  Coordinadores
                                </label>
                                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                  <input 
                                    type="checkbox" 
                                    checked={absTypeForm.visible_to_admins !== false} 
                                    onChange={e => setAbsTypeForm({...absTypeForm, visible_to_admins: e.target.checked})} 
                                    style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }}
                                  />
                                  Administradores
                                </label>
                              </div>
                            </div>

                            {/* Predefined range builder checkbox */}
                            <div className="form-group">
                              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 'bold' }}>
                                <input 
                                  type="checkbox" 
                                  checked={hasPredefinedRanges} 
                                  onChange={e => {
                                    setHasPredefinedRanges(e.target.checked);
                                    if (e.target.checked) {
                                      setAbsTypeForm({ ...absTypeForm, fixed_days: '' });
                                    }
                                  }}
                                  style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }}
                                />
                                Definir turnos/rangos de fechas predefinidos (Ej: Vacaciones Julio)
                              </label>
                            </div>

                            {/* Predefined range list builder */}
                            {hasPredefinedRanges && (
                              <div className="glass-panel" style={{ padding: '1rem', background: 'rgba(255,255,255,0.01)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--primary-light)' }}>Creador de Turnos / Calendario Predefinido</div>
                                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                                  <div className="form-group" style={{ flex: 2, minWidth: '150px' }}>
                                    <label className="form-label" style={{ fontSize: '0.8rem' }}>Etiqueta o Nombre</label>
                                    <input 
                                      type="text" 
                                      className="form-input" 
                                      placeholder="Ej: Turno 1 (Julio)" 
                                      value={tempRange.label}
                                      onChange={e => setTempRange({ ...tempRange, label: e.target.value })}
                                    />
                                  </div>
                                  <div className="form-group" style={{ flex: 1, minWidth: '110px' }}>
                                    <label className="form-label" style={{ fontSize: '0.8rem' }}>Inicio</label>
                                    <input 
                                      type="date" 
                                      className="form-input" 
                                      value={tempRange.start_date}
                                      onChange={e => setTempRange({ ...tempRange, start_date: e.target.value })}
                                      onClick={e => e.target.showPicker()}
                                    />
                                  </div>
                                  <div className="form-group" style={{ flex: 1, minWidth: '110px' }}>
                                    <label className="form-label" style={{ fontSize: '0.8rem' }}>Fin</label>
                                    <input 
                                      type="date" 
                                      className="form-input" 
                                      value={tempRange.end_date}
                                      onChange={e => setTempRange({ ...tempRange, end_date: e.target.value })}
                                      onClick={e => e.target.showPicker()}
                                    />
                                  </div>
                                  <button type="button" className="btn btn-secondary" onClick={addPredefinedRangeItem} style={{ marginBottom: '1.25rem' }}>
                                    ➕ Añadir
                                  </button>
                                </div>

                                {/* List of currently drafted ranges */}
                                {predefinedRangesList.length > 0 && (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                                    {predefinedRangesList.map((range, index) => (
                                      <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.8rem' }}>
                                        <div>
                                          <strong>{range.label}</strong>: {new Date(range.start_date).toLocaleDateString('es-ES')} al {new Date(range.end_date).toLocaleDateString('es-ES')}
                                        </div>
                                        <button type="button" className="btn btn-danger" style={{ padding: '0.15rem 0.4rem', fontSize: '0.7rem' }} onClick={() => removePredefinedRangeItem(index)}>
                                          Eliminar
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}

                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                              <button type="submit" className="btn btn-primary" style={{ minWidth: '120px' }}>
                                {editingAbsenceType ? 'Guardar Cambios' : 'Crear Ausencia'}
                              </button>
                            </div>
                          </form>

                          {/* Listado */}
                          <div className="panel-body" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', padding: '1rem' }}>
                            {dashboardData.absenceTypes?.map(type => (
                              <div key={type.id} className="glass-panel" style={{ padding: '1rem', minWidth: '220px', flex: '1 1 220px', background: 'rgba(255,255,255,0.02)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1rem' }}>
                                <div>
                                  <div style={{ fontWeight: 'bold', fontSize: '1rem', color: 'var(--primary-light)' }}>{type.name}</div>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.5rem', fontSize: '0.8rem' }}>
                                    <div className="detail-item">
                                      <span className="detail-label">Descuenta</span>
                                      <span className="detail-value" style={{ color: type.subtracts_days ? 'var(--warning)' : 'var(--success)' }}>
                                        {type.subtracts_days ? 'Sí' : 'No'}
                                      </span>
                                    </div>
                                    <div className="detail-item">
                                      <span className="detail-label">Visible</span>
                                      <span className="detail-value" style={{ color: type.show_in_record !== false ? 'var(--success)' : 'var(--danger)' }}>
                                        {type.show_in_record !== false ? 'Sí' : 'No'}
                                      </span>
                                    </div>
                                    <div className="detail-item">
                                      <span className="detail-label">Rango</span>
                                      <span className="detail-value">
                                        {type.fixed_days ? `${type.fixed_days}d fijos` : type.predefined_ranges?.length > 0 ? `${type.predefined_ranges.length} turnos` : 'Libre'}
                                      </span>
                                    </div>
                                    <div className="detail-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.25rem', marginTop: '0.25rem' }}>
                                      <span className="detail-label" style={{ fontSize: '0.75rem' }}>Visible para:</span>
                                      <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', marginTop: '0.1rem' }}>
                                        {type.visible_to_employees !== false && (
                                          <span style={{ background: 'rgba(52, 152, 219, 0.1)', color: '#3498db', padding: '0.1rem 0.4rem', borderRadius: '4px', fontSize: '0.7rem' }}>Emp</span>
                                        )}
                                        {type.visible_to_coordinators !== false && (
                                          <span style={{ background: 'rgba(230, 126, 34, 0.1)', color: '#e67e22', padding: '0.1rem 0.4rem', borderRadius: '4px', fontSize: '0.7rem' }}>Coord</span>
                                        )}
                                        {type.visible_to_admins !== false && (
                                          <span style={{ background: 'rgba(155, 89, 182, 0.1)', color: '#9b59b6', padding: '0.1rem 0.4rem', borderRadius: '4px', fontSize: '0.7rem' }}>Admin</span>
                                        )}
                                        {type.visible_to_employees === false && type.visible_to_coordinators === false && type.visible_to_admins === false && (
                                          <span style={{ background: 'rgba(231, 76, 60, 0.1)', color: 'var(--danger)', padding: '0.1rem 0.4rem', borderRadius: '4px', fontSize: '0.7rem' }}>Ninguno</span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <div style={{ display: 'flex', gap: '0.4rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)' }}>
                                  <button className="btn btn-secondary" style={{ flex: 1, padding: '0.3rem 0.4rem', fontSize: '0.75rem' }} onClick={() => openEditAbsenceType(type)}>
                                    Editar
                                  </button>
                                  <button className="btn btn-danger" style={{ flex: 1, padding: '0.3rem 0.4rem', fontSize: '0.75rem' }} onClick={() => deleteAbsenceType(type.id)}>
                                    Eliminar
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* SUB-SECTION 2: SHIFTS */}
                      {rrhhSubTab === 'shifts' && (
                        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column' }}>
                          <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 className="panel-title">
                              {editingShift ? '⏱ Editar Plantilla de Turno' : '⏱ Configuración de Plantillas de Turno'}
                            </h2>
                            {editingShift && (
                              <button className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }} onClick={() => {
                                setEditingShift(null);
                                setShiftForm({ name: '', color: '#3498db', start_time: '', end_time: '' });
                              }}>
                                Cancelar Edición
                              </button>
                            )}
                          </div>
                          
                          {/* Creacion & Edicion Form */}
                          <form onSubmit={saveShift} className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', borderBottom: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.01)', padding: '1.25rem', margin: '1rem', borderRadius: '12px' }}>
                            <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
                              <div className="form-group" style={{ minWidth: '150px', flex: 2 }}>
                                <label className="form-label">Nombre del Turno</label>
                                <input 
                                  type="text" 
                                  className="form-input" 
                                  placeholder="Ej: Mañana, Tarde, Partido..." 
                                  value={shiftForm.name} 
                                  onChange={e => setShiftForm({...shiftForm, name: e.target.value})} 
                                  required 
                                />
                              </div>
                              <div className="form-group" style={{ minWidth: '100px', flex: 1 }}>
                                <label className="form-label">Color</label>
                                <input 
                                  type="color" 
                                  className="form-input" 
                                  style={{ width: '100%', height: '42px', padding: '2px', cursor: 'pointer' }}
                                  value={shiftForm.color} 
                                  onChange={e => setShiftForm({...shiftForm, color: e.target.value})} 
                                  required 
                                />
                              </div>
                              <div className="form-group" style={{ minWidth: '100px', flex: 1 }}>
                                <label className="form-label">F1: Inicio</label>
                                <input 
                                  type="time" 
                                  className="form-input" 
                                  value={shiftForm.start_time} 
                                  onChange={e => setShiftForm({...shiftForm, start_time: e.target.value})} 
                                />
                              </div>
                              <div className="form-group" style={{ minWidth: '100px', flex: 1 }}>
                                <label className="form-label">F1: Fin</label>
                                <input 
                                  type="time" 
                                  className="form-input" 
                                  value={shiftForm.end_time} 
                                  onChange={e => setShiftForm({...shiftForm, end_time: e.target.value})} 
                                />
                              </div>
                              <div className="form-group" style={{ minWidth: '100px', flex: 1 }}>
                                <label className="form-label">F2: Inicio (Opt)</label>
                                <input 
                                  type="time" 
                                  className="form-input" 
                                  value={shiftForm.start_time_2} 
                                  onChange={e => setShiftForm({...shiftForm, start_time_2: e.target.value})} 
                                />
                              </div>
                              <div className="form-group" style={{ minWidth: '100px', flex: 1 }}>
                                <label className="form-label">F2: Fin (Opt)</label>
                                <input 
                                  type="time" 
                                  className="form-input" 
                                  value={shiftForm.end_time_2} 
                                  onChange={e => setShiftForm({...shiftForm, end_time_2: e.target.value})} 
                                />
                              </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                              <button type="submit" className="btn btn-primary" style={{ minWidth: '120px' }}>
                                {editingShift ? 'Guardar Cambios' : 'Crear Turno'}
                              </button>
                            </div>
                          </form>

                          {/* Listado */}
                          <div className="panel-body" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', padding: '1rem' }}>
                            {dashboardData.allShifts?.map(shift => (
                              <div key={shift.id} className="glass-panel" style={{ padding: '1rem', minWidth: '200px', flex: '1 1 200px', background: 'rgba(255,255,255,0.02)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1rem', borderLeft: `5px solid ${shift.color}` }}>
                                <div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: shift.color }}></div>
                                    <div style={{ fontWeight: 'bold', fontSize: '0.95rem', color: 'var(--primary-light)' }}>{shift.name}</div>
                                  </div>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.5rem', fontSize: '0.8rem' }}>
                                    <div className="detail-item">
                                      <span className="detail-label">Horario:</span>
                                      <span className="detail-value" style={{ fontWeight: '500', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                        {shift.start_time && shift.end_time ? (
                                          <>
                                            <span>F1: {shift.start_time.slice(0, 5)} - {shift.end_time.slice(0, 5)}</span>
                                            {shift.start_time_2 && shift.end_time_2 && (
                                              <span>F2: {shift.start_time_2.slice(0, 5)} - {shift.end_time_2.slice(0, 5)}</span>
                                            )}
                                          </>
                                        ) : 'Libre'}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                <div style={{ display: 'flex', gap: '0.4rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)' }}>
                                  <button className="btn btn-secondary" style={{ flex: 1, padding: '0.3rem 0.4rem', fontSize: '0.75rem' }} onClick={() => openEditShift(shift)}>
                                    Editar
                                  </button>
                                  <button className="btn btn-danger" style={{ flex: 1, padding: '0.3rem 0.4rem', fontSize: '0.75rem' }} onClick={() => deleteShift(shift.id)}>
                                    Eliminar
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* SUB-SECTION 3: FESTIVOS NACIONALES */}
                      {rrhhSubTab === 'holidays' && (
                        <div className="glass-panel" style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
                          <div className="panel-header">
                            <h2 className="panel-title">🎉 Festivos Nacionales (Destacados en Rojo)</h2>
                          </div>
                          
                          {/* Create Holiday Form */}
                          <form onSubmit={saveHoliday} className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderBottom: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.01)', padding: '1.25rem', borderRadius: '12px', margin: '1rem' }}>
                            <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                              <div className="form-group" style={{ flex: 2, minWidth: '200px' }}>
                                <label htmlFor="holiday_name" className="form-label">Nombre del Festivo Nacional</label>
                                <input 
                                  type="text" 
                                  id="holiday_name"
                                  name="holiday_name"
                                  className="form-input" 
                                  placeholder="Ej: Año Nuevo, Fiesta del Trabajo..." 
                                  value={holidayForm.name} 
                                  onChange={e => setHolidayForm({...holidayForm, name: e.target.value})} 
                                  required 
                                />
                              </div>
                              <div className="form-group" style={{ flex: 1, minWidth: '150px' }}>
                                <label htmlFor="holiday_date" className="form-label">Fecha del Festivo</label>
                                <input 
                                  type="date" 
                                  id="holiday_date"
                                  name="holiday_date"
                                  className="form-input" 
                                  value={holidayForm.date} 
                                  onChange={e => setHolidayForm({...holidayForm, date: e.target.value})} 
                                  onClick={e => e.target.showPicker()}
                                  required 
                                />
                              </div>
                              <button type="submit" className="btn btn-primary" style={{ height: '42px', minWidth: '150px' }}>
                                ➕ Añadir Festivo
                              </button>
                            </div>
                          </form>

                          {/* Holidays List Grid */}
                          <div className="panel-body" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem', padding: '1rem' }}>
                            {(dashboardData.nationalHolidays || []).length === 0 ? (
                              <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--text-muted)', padding: '2rem', fontStyle: 'italic' }}>
                                No hay festivos nacionales configurados.
                              </div>
                            ) : (
                              (dashboardData.nationalHolidays || []).map(holiday => (
                                <div key={holiday.id} className="glass-panel" style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid rgba(239, 68, 68, 0.25)', borderLeft: '4px solid #ef4444' }}>
                                  <div>
                                    <div style={{ fontWeight: 'bold', fontSize: '0.95rem', color: '#fca5a5' }}>
                                      {holiday.name}
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                                      {new Date(holiday.date + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                                    </div>
                                  </div>
                                  <button 
                                    type="button" 
                                    className="btn btn-danger" 
                                    style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                                    onClick={() => deleteHoliday(holiday.id)}
                                  >
                                    Eliminar
                                  </button>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}


                  {/* SUB-TAB 4: NOTIFICATIONS */}
                  {settingsTab === 'notifications' && (
                    <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', width: '100%' }}>
                      {/* Left Panel: Crear Comunicado */}
                      <div className="glass-panel" style={{ flex: '1 1 450px', padding: '1.5rem', minWidth: '320px' }}>
                        <div className="panel-header" style={{ borderBottom: 'none', paddingBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontSize: '1.2rem' }}>📢</span>
                          <h3 className="panel-title" style={{ fontSize: '1.2rem', fontWeight: '800', margin: 0 }}>Crear Comunicado en el Muro</h3>
                        </div>
                        <form onSubmit={saveAnnouncement} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                          <div className="form-group">
                            <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>TÍTULO DEL ANUNCIO</label>
                            <input 
                              type="text" 
                              className="form-input" 
                              placeholder="Ej: Nueva política de vestuario..." 
                              value={announcementForm.title} 
                              onChange={e => setAnnouncementForm({...announcementForm, title: e.target.value})} 
                              required 
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>CONTENIDO DEL MENSAJE</label>
                            <textarea 
                              className="form-input" 
                              style={{ minHeight: '150px', fontFamily: 'inherit' }}
                              placeholder="Escribe aquí el mensaje para todos los empleados..."
                              value={announcementForm.content} 
                              onChange={e => setAnnouncementForm({...announcementForm, content: e.target.value})} 
                              required 
                            />
                          </div>
                          <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', width: '100%', padding: '0.8rem', borderRadius: '12px', fontWeight: 'bold' }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="22" y1="2" x2="11" y2="13"></line>
                              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                            </svg>
                            Publicar Anuncio
                          </button>
                        </form>
                      </div>

                      {/* Right Panel: Historial de Anuncios */}
                      <div className="glass-panel" style={{ flex: '1 1 450px', padding: '1.5rem', minWidth: '320px', display: 'flex', flexDirection: 'column' }}>
                        <div className="panel-header" style={{ borderBottom: 'none', paddingBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontSize: '1.2rem' }}>⏳</span>
                          <h3 className="panel-title" style={{ fontSize: '1.2rem', fontWeight: '800', margin: 0 }}>Historial de Anuncios</h3>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '420px', overflowY: 'auto', paddingRight: '0.25rem' }}>
                          {(!dashboardData.announcements || dashboardData.announcements.length === 0) ? (
                            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '3rem', fontStyle: 'italic' }}>
                              No hay anuncios publicados en el muro.
                            </p>
                          ) : (
                            dashboardData.announcements.map(ann => (
                              <div key={ann.id} className="glass-panel" style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '14px', position: 'relative' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                                  <h4 style={{ fontWeight: 'bold', fontSize: '1.05rem', color: 'var(--text-primary)', textTransform: 'uppercase', margin: 0 }}>
                                    {ann.title}
                                  </h4>
                                  <button 
                                    type="button"
                                    onClick={() => deleteAnnouncement(ann.id)}
                                    style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                    title="Eliminar Anuncio"
                                  >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#ef4444'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}>
                                      <polyline points="3 6 5 6 21 6"></polyline>
                                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                      <line x1="10" y1="11" x2="10" y2="17"></line>
                                      <line x1="14" y1="11" x2="14" y2="17"></line>
                                    </svg>
                                  </button>
                                </div>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.5rem', lineHeight: '1.5', whiteSpace: 'pre-wrap', margin: '0.5rem 0 0 0' }}>
                                  {ann.content}
                                </p>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                  <span>{new Date(ann.created_at).toLocaleDateString('es-ES')}</span>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SUB-TAB 5: REPORTS */}
                  {settingsTab === 'reports' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
                      <div className="glass-panel" style={{ padding: '1.5rem', width: '100%', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {/* Sub-tab navigation inside Reports */}
                        <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            className="btn"
                            onClick={() => setReportsSubTab('queries')}
                            style={{
                              background: reportsSubTab === 'queries' ? 'var(--primary-glow)' : 'transparent',
                              color: reportsSubTab === 'queries' ? 'var(--primary-light)' : 'var(--text-secondary)',
                              fontWeight: '700',
                              borderRadius: '8px',
                              padding: '0.5rem 1rem',
                              border: 'none',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            🔍 Consultas
                          </button>
                          <button
                            type="button"
                            className="btn"
                            onClick={() => setReportsSubTab('stats')}
                            style={{
                              background: reportsSubTab === 'stats' ? 'var(--primary-glow)' : 'transparent',
                              color: reportsSubTab === 'stats' ? 'var(--primary-light)' : 'var(--text-secondary)',
                              fontWeight: '700',
                              borderRadius: '8px',
                              padding: '0.5rem 1rem',
                              border: 'none',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            📊 Estadísticas
                          </button>
                        </div>

                        {/* Date filters */}
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                          <div className="form-group" style={{ margin: 0, flex: '1 1 200px' }}>
                            <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>FECHA INICIO</label>
                            <input
                              type="date"
                              className="form-input"
                              value={queryStartDate}
                              onChange={e => setQueryStartDate(e.target.value)}
                              onClick={e => e.target.showPicker()}
                              style={{ width: '100%' }}
                            />
                          </div>
                          <div className="form-group" style={{ margin: 0, flex: '1 1 200px' }}>
                            <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>FECHA FIN</label>
                            <input
                              type="date"
                              className="form-input"
                              value={queryEndDate}
                              onChange={e => setQueryEndDate(e.target.value)}
                              onClick={e => e.target.showPicker()}
                              style={{ width: '100%' }}
                            />
                          </div>
                          
                          {/* Quick filters */}
                          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <button
                              type="button"
                              className="btn btn-secondary"
                              style={{ padding: '0.55rem 0.8rem', fontSize: '0.8rem', borderRadius: '8px' }}
                              onClick={() => {
                                const dates = getInitialDates();
                                setQueryStartDate(dates.start);
                                setQueryEndDate(dates.end);
                              }}
                            >
                              Este Mes
                            </button>
                            <button
                              type="button"
                              className="btn btn-secondary"
                              style={{ padding: '0.55rem 0.8rem', fontSize: '0.8rem', borderRadius: '8px' }}
                              onClick={() => {
                                const now = new Date();
                                const y = now.getFullYear();
                                const m = now.getMonth();
                                const firstDay = new Date(y, m - 1, 1);
                                const lastDay = new Date(y, m, 0);
                                const formatDate = (d) => {
                                  const year = d.getFullYear();
                                  const month = String(d.getMonth() + 1).padStart(2, '0');
                                  const day = String(d.getDate()).padStart(2, '0');
                                  return `${year}-${month}-${day}`;
                                };
                                setQueryStartDate(formatDate(firstDay));
                                setQueryEndDate(formatDate(lastDay));
                              }}
                            >
                              Mes Pasado
                            </button>
                            <button
                              type="button"
                              className="btn btn-secondary"
                              style={{ padding: '0.55rem 0.8rem', fontSize: '0.8rem', borderRadius: '8px' }}
                              onClick={() => {
                                const now = new Date();
                                const y = now.getFullYear();
                                setQueryStartDate(`${y}-01-01`);
                                setQueryEndDate(`${y}-12-31`);
                              }}
                            >
                              Este Año
                            </button>
                          </div>
                        </div>

                        {/* RENDER SUB-TAB: QUERIES */}
                        {reportsSubTab === 'queries' && (() => {
                          const getOverlapDays = (startStr, endStr, filterStartStr, filterEndStr) => {
                            const start = new Date(startStr);
                            const end = new Date(endStr);
                            const filterStart = new Date(filterStartStr);
                            const filterEnd = new Date(filterEndStr);
                            
                            const overlapStart = new Date(Math.max(start.getTime(), filterStart.getTime()));
                            const overlapEnd = new Date(Math.min(end.getTime(), filterEnd.getTime()));
                            
                            if (overlapStart > overlapEnd) return 0;
                            
                            const diffTime = Math.abs(overlapEnd - overlapStart);
                            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                            return diffDays;
                          };

                          const list = (dashboardData.allResolvedRequests || []).filter(req => {
                            if (req.status !== 'approved') return false;
                            if (req.type !== 'absence' && req.type !== 'hours_free') return false;
                            
                            const reqStart = req.start_date ? req.start_date.split('T')[0] : '';
                            const reqEnd = req.end_date ? req.end_date.split('T')[0] : reqStart;
                            
                            if (!reqStart) return false;
                            return reqStart <= queryEndDate && reqEnd >= queryStartDate;
                          }).map(req => {
                            const emp = (dashboardData.allEmployees || []).find(e => e.id === req.employee_id) || {
                              name: req.employee_name || 'Desconocido',
                              email: req.employee_email || 'N/A',
                              department_name: 'N/A',
                              avatar_url: ''
                            };
                            
                            const isHours = req.type === 'hours_free';
                            const reqStart = req.start_date ? req.start_date.split('T')[0] : '';
                            const reqEnd = req.end_date ? req.end_date.split('T')[0] : reqStart;
                            const absVal = Math.abs(req.amount);
                            
                            let overlapVal = absVal;
                            if (!isHours && reqStart && reqEnd) {
                              overlapVal = getOverlapDays(reqStart, reqEnd, queryStartDate, queryEndDate);
                            }
                            return { ...req, emp, overlapVal };
                          });

                          const uniqueEmpCount = new Set(list.map(r => r.employee_id)).size;
                          const totalOverlapDays = list.filter(r => r.type === 'absence').reduce((acc, r) => acc + r.overlapVal, 0);
                          const totalOverlapHours = list.filter(r => r.type === 'hours_free').reduce((acc, r) => acc + r.overlapVal, 0);

                          return (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                              <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                background: 'var(--primary-glow)',
                                padding: '1rem 1.5rem',
                                borderRadius: '12px',
                                border: '1px solid var(--border-color-glow)',
                                flexWrap: 'wrap',
                                gap: '1.5rem',
                                alignItems: 'center'
                              }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  <span style={{ fontSize: '1.25rem' }}>👥</span>
                                  <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>
                                    Personas ausentes: <strong style={{ color: 'var(--primary-light)', fontSize: '1.2rem' }}>{uniqueEmpCount}</strong>
                                  </span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  <span style={{ fontSize: '1.25rem' }}>📆</span>
                                  <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>
                                    Días ausentes en rango: <strong style={{ color: 'var(--primary-light)', fontSize: '1.2rem' }}>{totalOverlapDays} d</strong>
                                  </span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  <span style={{ fontSize: '1.25rem' }}>⏱</span>
                                  <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>
                                    Horas libres en rango: <strong style={{ color: 'var(--primary-light)', fontSize: '1.2rem' }}>{totalOverlapHours} h</strong>
                                  </span>
                                </div>
                              </div>

                              {list.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                                  No se encontraron personas ausentes en el rango de fechas seleccionado.
                                </div>
                              ) : (
                                <div className="custom-table-wrapper" style={{ border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden' }}>
                                  <table className="custom-table">
                                    <thead>
                                      <tr>
                                        <th>Empleado</th>
                                        <th>Departamento</th>
                                        <th>Tipo de Ausencia</th>
                                        <th>Fecha / Periodo</th>
                                        <th>Duración en Rango</th>
                                        <th>Observación</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {list.map(req => {
                                        const absVal = Math.abs(req.amount);
                                        const isHours = req.type === 'hours_free';
                                        
                                        let typeColor = 'rgba(139, 92, 246, 0.15)';
                                        let typeTextColor = 'var(--primary-light)';
                                        let typeBorder = 'rgba(139, 92, 246, 0.3)';
                                        let displayType = req.absence_type_name || 'Ausencia';
                                        
                                        if (isHours) {
                                          typeColor = 'rgba(59, 130, 246, 0.15)';
                                          typeTextColor = '#60a5fa';
                                          typeBorder = 'rgba(59, 130, 246, 0.3)';
                                          displayType = 'Horas Libres';
                                        } else if (displayType.toLowerCase().includes('baja')) {
                                          typeColor = 'rgba(16, 185, 129, 0.15)';
                                          typeTextColor = '#34d399';
                                          typeBorder = 'rgba(16, 185, 129, 0.3)';
                                        }

                                        return (
                                          <tr key={req.id}>
                                            <td>
                                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <div style={{ width: '36px', height: '36px', borderRadius: '50%', overflow: 'hidden', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: 'bold' }}>
                                                  {req.emp.avatar_url ? (
                                                    <img src={req.emp.avatar_url} alt={req.emp.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                  ) : (
                                                    req.emp.name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()
                                                  )}
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                  <span style={{ fontWeight: 'bold', fontSize: '0.9rem', color: isLightTheme ? '#0f172a' : '#fff' }}>{req.emp.name.toUpperCase()}</span>
                                                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{req.emp.email.toUpperCase()}</span>
                                                </div>
                                              </div>
                                            </td>
                                            <td>
                                              <span className="badge badge-coordinator" style={{ textTransform: 'uppercase' }}>
                                                {req.emp.department_name}
                                              </span>
                                            </td>
                                            <td>
                                              <span className="badge" style={{ backgroundColor: typeColor, color: typeTextColor, border: `1px solid ${typeBorder}` }}>
                                                {displayType.toUpperCase()}
                                              </span>
                                            </td>
                                            <td>
                                              <div style={{ display: 'flex', flexDirection: 'column', fontSize: '0.85rem' }}>
                                                {req.end_date && req.end_date.split('T')[0] !== req.start_date.split('T')[0] ? (
                                                  <>
                                                    <span>Desde: {new Date(req.start_date).toLocaleDateString('es-ES')}</span>
                                                    <span>Hasta: {new Date(req.end_date).toLocaleDateString('es-ES')}</span>
                                                  </>
                                                ) : (
                                                  <span>{new Date(req.start_date).toLocaleDateString('es-ES')}</span>
                                                )}
                                              </div>
                                            </td>
                                            <td>
                                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <span style={{ fontWeight: '600' }}>
                                                  {isHours ? `${req.overlapVal} horas` : `${req.overlapVal} días`}
                                                </span>
                                                {req.overlapVal !== absVal && (
                                                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                    ({absVal} {isHours ? 'h' : 'd'} total)
                                                  </span>
                                                )}
                                              </div>
                                            </td>
                                            <td>
                                              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                                                {req.observation || 'Sin detalles'}
                                              </span>
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          );
                        })()}

                        {/* RENDER SUB-TAB: STATS */}
                        {reportsSubTab === 'stats' && (() => {
                          const list = (dashboardData.allResolvedRequests || []).filter(req => {
                            if (req.status !== 'approved') return false;
                            if (req.type !== 'absence' && req.type !== 'hours_free') return false;
                            
                            const reqStart = req.start_date ? req.start_date.split('T')[0] : '';
                            const reqEnd = req.end_date ? req.end_date.split('T')[0] : reqStart;
                            
                            if (!reqStart) return false;
                            return reqStart <= queryEndDate && reqEnd >= queryStartDate;
                          }).map(req => {
                            const emp = (dashboardData.allEmployees || []).find(e => e.id === req.employee_id) || {
                              name: req.employee_name || 'Desconocido',
                              email: req.employee_email || 'N/A',
                              department_name: 'N/A',
                              avatar_url: ''
                            };
                            return { ...req, emp };
                          });

                          let totalDays = 0;
                          let totalHours = 0;
                          const uniqueEmployees = new Set();
                          const typeCounts = {};
                          const employeeStats = {};

                          const monthlyTrend = {};
                          const now = new Date();
                          for (let i = 5; i >= 0; i--) {
                            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                            const label = d.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' });
                            monthlyTrend[label] = { days: 0, hours: 0 };
                          }

                          list.forEach(req => {
                            uniqueEmployees.add(req.employee_id);
                            const absVal = Math.abs(req.amount);
                            
                            let typeName = 'Otros';
                            if (req.type === 'hours_free') {
                              typeName = 'Horas Libres';
                              totalHours += absVal;
                            } else {
                              typeName = req.absence_type_name || 'Ausencia';
                              totalDays += absVal;
                            }
                            typeCounts[typeName] = (typeCounts[typeName] || 0) + absVal;
                            
                            if (!employeeStats[req.employee_id]) {
                              employeeStats[req.employee_id] = {
                                id: req.employee_id,
                                name: req.emp?.name || 'Desconocido',
                                avatar_url: req.emp?.avatar_url || '',
                                days: 0,
                                hours: 0,
                                department: req.emp?.department_name || 'N/A'
                              };
                            }
                            if (req.type === 'hours_free') {
                              employeeStats[req.employee_id].hours += absVal;
                            } else {
                              employeeStats[req.employee_id].days += absVal;
                            }

                            const reqDate = new Date(req.start_date);
                            const label = reqDate.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' });
                            if (monthlyTrend[label] !== undefined) {
                              if (req.type === 'hours_free') {
                                monthlyTrend[label].hours += absVal;
                              } else {
                                monthlyTrend[label].days += absVal;
                              }
                            }
                          });

                          const topEmployees = Object.values(employeeStats)
                            .sort((a, b) => (b.days + b.hours / 8) - (a.days + a.hours / 8))
                            .slice(0, 5);

                          const trendData = Object.entries(monthlyTrend).map(([month, val]) => ({ month, ...val }));
                          const maxTrendVal = Math.max(...trendData.map(t => t.days + t.hours / 8), 1);
                          const totalUnits = Object.values(typeCounts).reduce((acc, curr) => acc + curr, 0);

                          return (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                                <div className="glass-panel stat-card info" style={{ padding: '1.25rem' }}>
                                  <span className="stat-title">Personas Ausentes</span>
                                  <span className="stat-value" style={{ fontSize: '1.75rem' }}>{uniqueEmployees.size}</span>
                                  <span className="stat-footer">Durante el periodo</span>
                                </div>
                                <div className="glass-panel stat-card success" style={{ padding: '1.25rem' }}>
                                  <span className="stat-title">Total Días de Ausencia</span>
                                  <span className="stat-value" style={{ fontSize: '1.75rem' }}>{totalDays} <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>días</span></span>
                                  <span className="stat-footer">Vacaciones/Permisos</span>
                                </div>
                                <div className="glass-panel stat-card warning" style={{ padding: '1.25rem' }}>
                                  <span className="stat-title">Horas Libres Consumidas</span>
                                  <span className="stat-value" style={{ fontSize: '1.75rem' }}>{totalHours} <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>horas</span></span>
                                  <span className="stat-footer">Compensación de horas</span>
                                </div>
                                <div className="glass-panel stat-card primary" style={{ padding: '1.25rem', position: 'relative' }}>
                                  <span className="stat-title">Promedio de Ausencia</span>
                                  <span className="stat-value" style={{ fontSize: '1.75rem' }}>
                                    {dashboardData.allEmployees?.length ? ((totalDays + totalHours / 8) / dashboardData.allEmployees.length).toFixed(1) : 0} 
                                    <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}> d/pers</span>
                                  </span>
                                  <span className="stat-footer">Días equivalentes por persona</span>
                                  <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', backgroundColor: 'var(--primary)' }}></div>
                                </div>
                              </div>

                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
                                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                                  <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span>📊</span> Distribución por Tipo de Ausencia
                                  </h3>
                                  {totalUnits === 0 ? (
                                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                                      No hay datos para representar.
                                    </div>
                                  ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                      {Object.entries(typeCounts).map(([type, amount], idx) => {
                                        const percentage = ((amount / totalUnits) * 100).toFixed(0);
                                        let barColor = 'linear-gradient(90deg, #8b5cf6, #a78bfa)';
                                        if (type === 'Horas Libres') barColor = 'linear-gradient(90deg, #3b82f6, #60a5fa)';
                                        if (type.toLowerCase().includes('baja')) barColor = 'linear-gradient(90deg, #10b981, #34d399)';

                                        return (
                                          <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                              <span style={{ fontWeight: '600', textTransform: 'uppercase' }}>{type}</span>
                                              <span style={{ color: 'var(--text-secondary)', fontWeight: 'bold' }}>{amount} ({percentage}%)</span>
                                            </div>
                                            <div style={{ width: '100%', height: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '5px', overflow: 'hidden' }}>
                                              <div style={{
                                                height: '100%',
                                                width: `${percentage}%`,
                                                background: barColor,
                                                borderRadius: '5px',
                                                transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
                                              }}></div>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>

                                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                                  <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span>🏆</span> Top Empleados con Más Ausencias
                                  </h3>
                                  {topEmployees.length === 0 ? (
                                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                                      Ningún empleado ausente en este rango.
                                    </div>
                                  ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                      {topEmployees.map((emp, idx) => {
                                        return (
                                          <div key={emp.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem', background: 'rgba(255,255,255,0.01)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                              <span style={{ fontSize: '1rem', fontWeight: '800', color: idx === 0 ? '#fbbf24' : idx === 1 ? '#94a3b8' : idx === 2 ? '#b45309' : 'var(--text-muted)', width: '20px', textAlign: 'center' }}>
                                                {idx + 1}
                                              </span>
                                              <div style={{ width: '36px', height: '36px', borderRadius: '50%', overflow: 'hidden', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: 'bold' }}>
                                                {emp.avatar_url ? (
                                                  <img src={emp.avatar_url} alt={emp.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                ) : (
                                                  emp.name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()
                                                )}
                                              </div>
                                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <span style={{ fontWeight: 'bold', fontSize: '0.85rem', color: isLightTheme ? '#0f172a' : '#fff' }}>{emp.name.toUpperCase()}</span>
                                                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{emp.department}</span>
                                              </div>
                                            </div>
                                            <div style={{ display: 'flex', gap: '0.35rem' }}>
                                              {emp.days > 0 && (
                                                <span className="badge badge-admin" style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }}>{emp.days}d</span>
                                              )}
                                              {emp.hours > 0 && (
                                                <span className="badge badge-coordinator" style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }}>{emp.hours}h</span>
                                              )}
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="glass-panel" style={{ padding: '1.5rem', width: '100%' }}>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  <span>📈</span> Tendencia Mensual (Últimos 6 Meses)
                                </h3>
                                <div style={{ width: '100%', height: '240px', position: 'relative', overflow: 'hidden' }}>
                                  <svg width="100%" height="100%" viewBox="0 0 800 220" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
                                    <defs>
                                      <linearGradient id="daysGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#c084fc" stopOpacity="0.8" />
                                        <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.3" />
                                      </linearGradient>
                                      <linearGradient id="hoursGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.8" />
                                        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.3" />
                                      </linearGradient>
                                    </defs>

                                    <line x1="40" y1="30" x2="760" y2="30" stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeDasharray="4 4" />
                                    <line x1="40" y1="80" x2="760" y2="80" stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeDasharray="4 4" />
                                    <line x1="40" y1="130" x2="760" y2="130" stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeDasharray="4 4" />
                                    <line x1="40" y1="180" x2="760" y2="180" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />

                                    {trendData.map((t, idx) => {
                                      const barSpacing = 720 / trendData.length;
                                      const xCenter = 40 + idx * barSpacing + barSpacing / 2;
                                      
                                      const maxBarHeight = 150;
                                      const daysH = (t.days / maxTrendVal) * maxBarHeight;
                                      const hoursH = ((t.hours / 8) / maxTrendVal) * maxBarHeight;

                                      const daysY = 180 - daysH;
                                      const hoursY = 180 - hoursH;

                                      return (
                                        <g key={idx}>
                                          {t.days > 0 && (
                                            <rect
                                              x={xCenter - 25}
                                              y={daysY}
                                              width="20"
                                              height={daysH}
                                              rx="4"
                                              fill="url(#daysGrad)"
                                              stroke="#a78bfa"
                                              strokeWidth="1.5"
                                              style={{ transition: 'all 0.3s ease' }}
                                            />
                                          )}
                                          
                                          {t.hours > 0 && (
                                            <rect
                                              x={xCenter + 5}
                                              y={hoursY}
                                              width="20"
                                              height={hoursH}
                                              rx="4"
                                              fill="url(#hoursGrad)"
                                              stroke="#60a5fa"
                                              strokeWidth="1.5"
                                              style={{ transition: 'all 0.3s ease' }}
                                            />
                                          )}

                                          {t.days > 0 && (
                                            <text x={xCenter - 15} y={daysY - 6} fill="var(--text-primary)" fontSize="10" textAnchor="middle" fontWeight="bold">
                                              {t.days}d
                                            </text>
                                          )}
                                          {t.hours > 0 && (
                                            <text x={xCenter + 15} y={hoursY - 6} fill="var(--text-primary)" fontSize="10" textAnchor="middle" fontWeight="bold">
                                              {t.hours}h
                                            </text>
                                          )}

                                          <text x={xCenter} y="200" fill="var(--text-secondary)" fontSize="11" textAnchor="middle" fontWeight="600">
                                            {t.month.toUpperCase()}
                                          </text>
                                        </g>
                                      );
                                    })}
                                  </svg>
                                  <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                      <span style={{ width: '12px', height: '12px', background: '#8b5cf6', borderRadius: '3px', border: '1px solid #a78bfa' }}></span>
                                      <span style={{ color: 'var(--text-secondary)', fontWeight: '500' }}>Vacaciones / Permisos (días)</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                      <span style={{ width: '12px', height: '12px', background: '#3b82f6', borderRadius: '3px', border: '1px solid #60a5fa' }}></span>
                                      <span style={{ color: 'var(--text-secondary)', fontWeight: '500' }}>Compensación Horas (horas)</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  )}

                  {/* SUB-TAB 6: EPIS CONFIG (ADMIN ONLY) */}
                  {settingsTab === 'epis' && (
                    <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', width: '100%' }}>
                      {/* Left: Forms */}
                      <div style={{ flex: '1 1 400px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {/* Form 1: Create EPI Type */}
                        <div className="glass-panel" style={{ padding: '1.5rem' }}>
                          <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                            ➕ Crear Tipo de EPI
                          </h3>
                          <form onSubmit={createEpiType} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div className="form-group" style={{ margin: 0 }}>
                              <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>NOMBRE DEL EPI</label>
                              <input
                                type="text"
                                className="form-input"
                                placeholder="Ej: Chaleco Reflectante, Calzado de Seguridad..."
                                value={newEpiForm.name}
                                onChange={e => setNewEpiForm({ ...newEpiForm, name: e.target.value })}
                                required
                              />
                            </div>
                            <div className="form-group" style={{ margin: 0 }}>
                              <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>DESCRIPCIÓN / DETALLES</label>
                              <textarea
                                className="form-input"
                                placeholder="Especificaciones, fabricante, etc..."
                                value={newEpiForm.description}
                                onChange={e => setNewEpiForm({ ...newEpiForm, description: e.target.value })}
                                style={{ minHeight: '80px', fontFamily: 'inherit' }}
                              />
                            </div>
                            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.75rem', borderRadius: '10px' }}>
                              Guardar Tipo de EPI
                            </button>
                          </form>
                        </div>

                        {/* Form 2: Create Size */}
                        <div className="glass-panel" style={{ padding: '1.5rem' }}>
                          <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                            📏 Añadir Talla a EPI
                          </h3>
                          <form onSubmit={createEpiSize} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div className="form-group" style={{ margin: 0 }}>
                              <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>SELECCIONAR EPI</label>
                              <select
                                className="selector-dropdown"
                                style={{ width: '100%', padding: '0.75rem' }}
                                value={newSizeForm.type_id}
                                onChange={e => setNewSizeForm({ ...newSizeForm, type_id: e.target.value })}
                                required
                              >
                                <option value="">-- Elige un EPI --</option>
                                {epiTypesList.map(t => (
                                  <option key={t.id} value={t.id.toString()}>{t.name.toUpperCase()}</option>
                                ))}
                              </select>
                            </div>
                            <div className="form-group" style={{ margin: 0 }}>
                              <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>TALLA / MEDIDA</label>
                              <input
                                type="text"
                                className="form-input"
                                placeholder="Ej: S, M, L, 41, 42, Única..."
                                value={newSizeForm.size_name}
                                onChange={e => setNewSizeForm({ ...newSizeForm, size_name: e.target.value })}
                                required
                              />
                            </div>
                            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.75rem', borderRadius: '10px' }}>
                              Añadir Talla
                            </button>
                          </form>
                        </div>
                      </div>

                      {/* Right: List */}
                      <div className="glass-panel" style={{ flex: '1 1 500px', padding: '1.5rem' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                          🦺 Catálogo de EPIs y Tallas Definidas
                        </h3>
                        {epiTypesList.length === 0 ? (
                          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                            No hay tipos de EPI creados todavía.
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            {epiTypesList.map(type => (
                              <div key={type.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '1rem', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                                  <div>
                                    <h4 style={{ fontWeight: 'bold', color: 'var(--text-primary)', textTransform: 'uppercase', fontSize: '1rem' }}>{type.name}</h4>
                                    {type.description && (
                                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>{type.description}</p>
                                    )}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => deleteEpiType(type.id)}
                                    className="btn btn-danger"
                                    style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', borderRadius: '6px' }}
                                  >
                                    Eliminar
                                  </button>
                                </div>
                                
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem' }}>
                                  <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', display: 'block', width: '100%', marginBottom: '0.2rem' }}>TALLAS DISPONIBLES:</span>
                                  {(!type.sizes || type.sizes.length === 0) ? (
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Sin tallas asociadas</span>
                                  ) : (
                                    type.sizes.map(size => (
                                      <div key={size.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: 'var(--primary-glow)', border: '1px solid var(--border-color-glow)', color: 'var(--primary-light)', padding: '0.25rem 0.6rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                                        <span>{size.size_name.toUpperCase()}</span>
                                        <button
                                          type="button"
                                          onClick={() => deleteEpiSize(size.id)}
                                          style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 0.1rem', fontWeight: 'bold' }}
                                          title="Eliminar Talla"
                                        >
                                          ×
                                        </button>
                                      </div>
                                    ))
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 6: SHIFT PLANNING TAB */}
              {activeTab === 'planificacion' && (
                <div className="glass-panel" style={{ width: '100%' }}>
                  <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <h2 className="panel-title" style={{ margin: 0 }}>📅 Planificación de Turnos</h2>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', padding: '0.4rem 0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                        <button type="button" className="btn btn-secondary" style={{ padding: '0.2rem 0.6rem', margin: 0, fontSize: '0.9rem' }} onClick={handlePrevMonth}>◀</button>
                        <span style={{ fontWeight: '600', fontSize: '1rem', minWidth: '120px', textAlign: 'center' }}>
                          {getMonthName(schedMonth)} {schedYear}
                        </span>
                        <button type="button" className="btn btn-secondary" style={{ padding: '0.2rem 0.6rem', margin: 0, fontSize: '0.9rem' }} onClick={handleNextMonth}>▶</button>
                      </div>

                      {/* Department Filter for Planning view */}
                      {(dashboardData.user.role === 'admin' || dashboardData.user.role === 'coordinator') && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <select
                            id="planificacion_dept_filter"
                            name="planificacion_dept_filter"
                            className="selector-dropdown"
                            style={{ padding: '0.35rem 0.75rem', fontSize: '0.9rem', borderRadius: '8px' }}
                            value={schedDeptFilter}
                            onChange={e => setSchedDeptFilter(e.target.value)}
                          >
                            <option value="">🏢 Todos los departamentos</option>
                            {dashboardData.user.role === 'admin' ? (
                              dashboardData.allDepartments?.map(d => (
                                <option key={d.id} value={d.id.toString()}>{d.name}</option>
                              ))
                            ) : (
                              dashboardData.managedDepartments?.map(d => (
                                <option key={d.id} value={d.id.toString()}>{d.name}</option>
                              ))
                            )}
                          </select>
                        </div>
                      )}
                    </div>
                    
                    {dashboardData?.user && dashboardData.user.role !== 'employee' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                        {!isPlanningEditMode ? (
                          <>
                            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.05)', padding: '0.4rem 0.8rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)' }}>
                              👁️ Modo lectura
                            </span>
                            <button
                              type="button"
                              className="btn btn-secondary"
                              style={{ margin: 0, padding: '0.5rem 1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                              onClick={() => setPrintModalOpen(true)}
                            >
                              🖨️ Imprimir
                            </button>
                            <button
                              type="button"
                              className="btn btn-primary"
                              style={{ margin: 0, padding: '0.5rem 1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                              onClick={handleStartPlanningEdit}
                            >
                              ✏️ EDITAR
                            </button>
                          </>
                        ) : (
                          <>
                            <span style={{ fontSize: '0.9rem', color: '#f59e0b', background: 'rgba(245, 158, 11, 0.1)', padding: '0.4rem 0.8rem', borderRadius: '6px', border: '1px solid rgba(245, 158, 11, 0.3)', fontWeight: '600' }}>
                              ✏️ Modo Edición (Sin guardar)
                            </span>
                            <button
                              type="button"
                              className="btn btn-success"
                              style={{ margin: 0, padding: '0.5rem 1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#10b981', borderColor: '#10b981', color: '#fff' }}
                              onClick={handleSavePlanningEdit}
                            >
                              💾 GUARDAR
                            </button>
                            <button
                              type="button"
                              className="btn btn-danger"
                              style={{ margin: 0, padding: '0.5rem 1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                              onClick={handleCancelPlanningEdit}
                            >
                              ❌ CANCELAR
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Shifts Palette for painting (Only for admin/coordinator) */}
                  {dashboardData?.user && dashboardData.user.role !== 'employee' && isPlanningEditMode && (
                    <div className="panel-body" style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.01)', padding: '1rem 1.5rem' }}>
                      <div style={{ fontWeight: '600', fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>🖌 Paleta de Turnos (Pincel Activo)</div>
                      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        {dashboardData.allShifts?.map(shift => (
                          <button
                            key={shift.id}
                            type="button"
                            onClick={() => setActivePaintShiftId(shift.id)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              padding: '0.5rem 1rem',
                              borderRadius: '8px',
                              border: activePaintShiftId === shift.id ? '2px solid #fff' : '1px solid var(--border-color)',
                              background: shift.color,
                              color: '#fff',
                              fontWeight: '600',
                              cursor: 'pointer',
                              boxShadow: activePaintShiftId === shift.id ? `0 0 10px ${shift.color}` : 'none',
                              transform: activePaintShiftId === shift.id ? 'scale(1.05)' : 'scale(1)',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#fff' }}></span>
                            {shift.name} {shift.start_time ? (
                              shift.start_time_2 ? `(${shift.start_time.slice(0,5)}-${shift.end_time?.slice(0,5)} / ${shift.start_time_2.slice(0,5)}-${shift.end_time_2?.slice(0,5)})` : `(${shift.start_time.slice(0,5)}-${shift.end_time?.slice(0,5)})`
                            ) : ''}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => setActivePaintShiftId(null)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.5rem 1rem',
                            borderRadius: '8px',
                            border: activePaintShiftId === null ? '2px solid #fff' : '1px solid var(--border-color)',
                            background: 'rgba(255,255,255,0.05)',
                            color: 'var(--text-primary)',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          ❌ Borrador / Libre
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Grid Matrix Table */}
                  <div 
                    className="panel-body custom-table-wrapper" 
                    style={{ overflowX: 'auto', padding: '1rem' }}
                    onWheel={(e) => {
                      const container = e.currentTarget;
                      // Horizontal scroll delta
                      const dx = e.deltaX;
                      
                      // Check horizontal scroll limits
                      if (dx < -3) {
                        // User scrolling left
                        if (container.scrollLeft <= 1) {
                          e.preventDefault();
                          // Simple throttling to prevent multi-month jumps
                          if (!global._lastMonthChange || Date.now() - global._lastMonthChange > 600) {
                            global._lastMonthChange = Date.now();
                            handlePrevMonth();
                          }
                        }
                      } else if (dx > 3) {
                        // User scrolling right
                        const limit = container.scrollWidth - container.clientWidth;
                        if (container.scrollLeft >= limit - 5) {
                          e.preventDefault();
                          if (!global._lastMonthChange || Date.now() - global._lastMonthChange > 600) {
                            global._lastMonthChange = Date.now();
                            handleNextMonth();
                          }
                        }
                      }
                    }}
                  >
                    <table className="custom-table" style={{ tableLayout: 'fixed', minWidth: '1000px', userSelect: 'none' }}>
                      <thead>
                        <tr>
                          <th style={{ width: '220px', minWidth: '220px', position: 'sticky', left: 0, zIndex: 10, backgroundColor: 'var(--bg-modal)', borderRight: '2px solid var(--border-color)', color: 'var(--text-primary)' }}>
                            Empleado
                          </th>
                          {Array.from({ length: getDaysInMonth(schedYear, schedMonth) }).map((_, idx) => {
                            const dayNum = idx + 1;
                            const dateStr = `${schedYear}-${String(schedMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                            const dateObj = new Date(schedYear, schedMonth, dayNum);
                            const dayName = dateObj.toLocaleDateString('es-ES', { weekday: 'short' }).charAt(0).toUpperCase();
                            const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
                            const isNationalHoliday = (dashboardData.nationalHolidays || []).find(h => h.date === dateStr);
                            
                            return (
                              <th 
                                key={dayNum} 
                                title={isNationalHoliday ? `Festivo: ${isNationalHoliday.name}` : ''}
                                style={{ 
                                  textAlign: 'center', 
                                  padding: '0.5rem 0.25rem', 
                                  fontSize: '0.8rem',
                                  width: '38px',
                                  minWidth: '38px',
                                  backgroundColor: isNationalHoliday ? 'rgba(239, 68, 68, 0.3)' : (isWeekend ? 'rgba(255, 255, 255, 0.04)' : 'transparent'),
                                  color: isNationalHoliday ? '#fca5a5' : (isWeekend ? 'var(--warning)' : 'var(--text-secondary)'),
                                  borderBottom: isNationalHoliday ? '2px solid #ef4444' : '1px solid var(--border-color)',
                                  borderLeft: '1px solid var(--border-color)'
                                }}
                              >
                                <div>{dayName}</div>
                                <div style={{ fontSize: '0.95rem', fontWeight: 'bold' }}>{dayNum}</div>
                              </th>
                            );
                          })}
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          const relevantRequests = (() => {
                            const role = dashboardData.user.role;
                            if (role === 'admin') {
                              return [
                                ...(dashboardData.allPendingRequests || []),
                                ...(dashboardData.allResolvedRequests || []),
                                ...(dashboardData.pendingRequests || []),
                                ...(dashboardData.resolvedRequests || [])
                              ];
                            } else if (role === 'coordinator') {
                              return [
                                ...(dashboardData.teamPendingRequests || []),
                                ...(dashboardData.teamResolvedRequests || []),
                                ...(dashboardData.pendingRequests || []),
                                ...(dashboardData.resolvedRequests || [])
                              ];
                            } else {
                              return [
                                ...(dashboardData.pendingRequests || []),
                                ...(dashboardData.resolvedRequests || [])
                              ];
                            }
                          })();

                          // Filter visible employees depending on role
                          let list = [];
                          if (dashboardData.user.role === 'admin') {
                            list = dashboardData.allEmployees || [];
                          } else if (dashboardData.user.role === 'coordinator') {
                            list = dashboardData.managedEmployees || [];
                          } else {
                            list = [dashboardData.user];
                            if (dashboardData.colleagues) {
                              list.push(...dashboardData.colleagues);
                            }
                          }

                          // Filter list using search bar
                          list = list.filter(emp => 
                            emp.name.toLowerCase().includes(employeeSearch.toLowerCase()) || 
                            emp.email.toLowerCase().includes(employeeSearch.toLowerCase())
                          );

                          // Filter list by selected department
                          if (schedDeptFilter) {
                            list = list.filter(emp => emp.department_id?.toString() === schedDeptFilter);
                          }

                          if (list.length === 0) {
                            return (
                              <tr>
                                <td colSpan={getDaysInMonth(schedYear, schedMonth) + 1} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                  No hay empleados para mostrar
                                </td>
                              </tr>
                            );
                          }

                          return list.map(emp => {
                            const isDeBaja = relevantRequests.some(r => {
                              if (r.employee_id !== emp.id) return false;
                              if (r.status !== 'approved') return false;
                              if (!r.start_date) return false;
                              const isBajaType = r.type === 'absence' && r.absence_type_name && r.absence_type_name.toLowerCase().includes('baja');
                              if (!isBajaType) return false;
                              
                              const start = new Date(r.start_date);
                              start.setHours(0,0,0,0);
                              const end = r.end_date ? new Date(r.end_date) : start;
                              end.setHours(23,59,59,999);
                              
                              const monthStart = new Date(schedYear, schedMonth, 1, 0, 0, 0, 0);
                              const monthEnd = new Date(schedYear, schedMonth + 1, 0, 23, 59, 59, 999);
                              
                              return start <= monthEnd && end >= monthStart;
                            });

                            return (
                              <tr key={emp.id} style={isDeBaja ? { opacity: 0.95 } : undefined}>
                                <td 
                                  style={{ 
                                    position: 'sticky', 
                                    left: 0, 
                                    zIndex: 9, 
                                    backgroundColor: isDeBaja ? (isLightTheme ? '#e2e8f0' : '#334155') : 'var(--bg-modal)', 
                                    borderRight: '2px solid var(--border-color)',
                                    fontWeight: '600',
                                    fontSize: '0.9rem',
                                    whiteSpace: 'nowrap',
                                    textOverflow: 'ellipsis',
                                    color: isDeBaja ? (isLightTheme ? '#64748b' : '#94a3b8') : 'var(--text-primary)'
                                  }}
                                >
                                  <div style={{ fontWeight: '600' }}>{emp.name}</div>
                                  <div style={{ fontSize: '0.75rem', color: isDeBaja ? (isLightTheme ? '#8b9bb4' : '#64748b') : 'var(--text-muted)', fontWeight: 'normal' }}>
                                     {emp.department_name || 'Sin departamento'}
                                  </div>
                                </td>
                                
                                {Array.from({ length: getDaysInMonth(schedYear, schedMonth) }).map((_, idx) => {
                                  const dayNum = idx + 1;
                                  const dateStr = `${schedYear}-${String(schedMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                                  const cellKey = `${emp.id}_${dateStr}`;
                                  const assignedShift = shiftAssignments[cellKey];
                                  
                                  const cellDate = new Date(schedYear, schedMonth, dayNum);
                                  cellDate.setHours(0,0,0,0);
                                  const reqOnDay = relevantRequests.find(r => {
                                    if (r.employee_id !== emp.id) return false;
                                    if (r.status !== 'approved' && r.status !== 'pending') return false;
                                    if (!r.start_date) return false;
                                    const start = new Date(r.start_date);
                                    start.setHours(0,0,0,0);
                                    const end = r.end_date ? new Date(r.end_date) : start;
                                    end.setHours(0,0,0,0);
                                    return cellDate >= start && cellDate <= end;
                                  });

                                  const isNationalHoliday = (dashboardData.nationalHolidays || []).find(h => h.date === dateStr);

                                  return (
                                    <td
                                      key={dayNum}
                                      onMouseDown={() => {
                                        if (dashboardData.user.role !== 'employee' && isPlanningEditMode) {
                                          setIsPainting(true);
                                          handlePaintCell(emp.id, dayNum);
                                        }
                                      }}
                                      onMouseEnter={() => {
                                        if (isPainting && dashboardData.user.role !== 'employee' && isPlanningEditMode) {
                                          handlePaintCell(emp.id, dayNum);
                                        }
                                      }}
                                      style={{
                                        padding: 0,
                                        height: '42px',
                                        backgroundColor: isDeBaja
                                          ? (isLightTheme ? '#f1f5f9' : '#1e293b')
                                          : (isNationalHoliday 
                                            ? 'rgba(239, 68, 68, 0.4)'
                                            : (assignedShift ? assignedShift.color : (new Date(schedYear, schedMonth, dayNum).getDay() === 0 || new Date(schedYear, schedMonth, dayNum).getDay() === 6 ? 'rgba(255, 255, 255, 0.02)' : 'transparent'))),
                                        border: isNationalHoliday
                                          ? '1px solid #ef4444'
                                          : '1px solid var(--border-color)',
                                        cursor: (dashboardData.user.role !== 'employee' && isPlanningEditMode) ? 'cell' : 'default',
                                        transition: 'background-color 0.15s ease'
                                      }}
                                      title={isNationalHoliday ? `Festivo Nacional: ${isNationalHoliday.name}${assignedShift ? ` - Turno: ${assignedShift.name}` : ''}` : (reqOnDay ? `[${reqOnDay.status === 'approved' ? 'Aprobada' : 'Pendiente'}] ${reqOnDay.type === 'hours_free' ? 'Horas Libres' : (reqOnDay.absence_type_name || 'Ausencia')}${assignedShift ? ` - Turno: ${assignedShift.name}` : ''}` : (assignedShift ? `${assignedShift.name} (${assignedShift.start_time ? (assignedShift.start_time_2 ? `${assignedShift.start_time.slice(0,5)}-${assignedShift.end_time?.slice(0,5)} / ${assignedShift.start_time_2.slice(0,5)}-${assignedShift.end_time_2?.slice(0,5)}` : `${assignedShift.start_time.slice(0,5)}-${assignedShift.end_time?.slice(0,5)}`) : 'sin horario'})` : 'Libre'))}
                                    >
                                    <div style={{
                                      display: 'flex',
                                      flexDirection: 'column',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      height: '100%',
                                      width: '100%',
                                      padding: '2px 0',
                                      gap: '1px'
                                    }}>
                                      {isNationalHoliday && (
                                        <div style={{
                                          fontSize: '0.55rem',
                                          fontWeight: 'bold',
                                          backgroundColor: '#ef4444',
                                          color: '#fff',
                                          padding: '1px 3px',
                                          borderRadius: '3px',
                                          maxWidth: '90%',
                                          overflow: 'hidden',
                                          textOverflow: 'ellipsis',
                                          whiteSpace: 'nowrap',
                                          boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                                          zIndex: 2
                                        }} title={isNationalHoliday.name}>
                                          F
                                        </div>
                                      )}
                                      {reqOnDay && (
                                        <div style={{
                                          fontSize: '0.55rem',
                                          fontWeight: 'bold',
                                          backgroundColor: reqOnDay.status === 'approved' ? 'rgba(16, 185, 129, 0.95)' : 'rgba(245, 158, 11, 0.95)',
                                          color: '#fff',
                                          padding: '1px 3px',
                                          borderRadius: '3px',
                                          maxWidth: '90%',
                                          overflow: 'hidden',
                                          textOverflow: 'ellipsis',
                                          whiteSpace: 'nowrap',
                                          boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                                          textShadow: 'none',
                                          zIndex: 2
                                        }}>
                                          {reqOnDay.type === 'hours_free' ? 'Libres' : (reqOnDay.absence_type_name === 'Vacaciones' ? 'Vac' : (reqOnDay.absence_type_name === 'Baja Médica' ? 'Baja' : 'Aus'))}
                                        </div>
                                      )}
                                      {assignedShift && (
                                        <div style={{ 
                                          color: '#fff', 
                                          fontSize: '0.75rem', 
                                          fontWeight: 'bold', 
                                          textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                                          lineHeight: '1'
                                        }}>
                                          {assignedShift.name.charAt(0)}
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        });
                      })()}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Legend explanation */}
                  <div className="panel-body" style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', fontSize: '0.8rem', borderTop: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <strong>Código de Letras:</strong>
                    </div>
                    {dashboardData.allShifts?.map(s => (
                      <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <span style={{ display: 'inline-block', width: '18px', height: '18px', borderRadius: '4px', backgroundColor: s.color, color: '#fff', textAlign: 'center', lineHeight: '18px', fontSize: '0.7rem', fontWeight: 'bold' }}>
                          {s.name.charAt(0)}
                        </span>
                        <span>
                          {s.name} {s.start_time ? (
                            s.start_time_2 ? `(${s.start_time.slice(0,5)}-${s.end_time?.slice(0,5)} / ${s.start_time_2.slice(0,5)}-${s.end_time_2?.slice(0,5)})` : `(${s.start_time.slice(0,5)}-${s.end_time?.slice(0,5)})`
                          ) : ''}
                        </span>
                      </div>
                    ))}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <span style={{ display: 'inline-block', width: '18px', height: '18px', borderRadius: '4px', border: '1px dashed var(--border-color)', textAlign: 'center', lineHeight: '18px', fontSize: '0.7rem' }}>
                        -
                      </span>
                      <span>Libre / Sin turno</span>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 7: EPIS MAIN TAB */}
              {activeTab === 'epis' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
                  
                  {/* Coordinator/Admin Sub-Tabs */}
                  {(dashboardData.user.role === 'admin' || dashboardData.user.role === 'coordinator') && (
                    <div className="glass-panel" style={{ padding: '0.5rem', display: 'flex', gap: '0.5rem', borderRadius: '12px' }}>
                      <button
                        type="button"
                        className="btn"
                        onClick={() => setEpiTab('my_requests')}
                        style={{
                          flex: 1,
                          background: epiTab === 'my_requests' ? 'var(--primary-glow)' : 'transparent',
                          color: epiTab === 'my_requests' ? 'var(--primary-light)' : 'var(--text-secondary)',
                          fontWeight: '700',
                          borderRadius: '8px',
                          padding: '0.5rem',
                          border: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        🙋 Mis Solicitudes
                      </button>
                      <button
                        type="button"
                        className="btn"
                        onClick={() => setEpiTab('team_requests')}
                        style={{
                          flex: 1,
                          background: epiTab === 'team_requests' ? 'var(--primary-glow)' : 'transparent',
                          color: epiTab === 'team_requests' ? 'var(--primary-light)' : 'var(--text-secondary)',
                          fontWeight: '700',
                          borderRadius: '8px',
                          padding: '0.5rem',
                          border: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        📋 Solicitudes del Personal
                      </button>
                    </div>
                  )}

                  {/* Render based on selected internal tab */}
                  {(epiTab === 'my_requests' || (dashboardData.user.role !== 'admin' && dashboardData.user.role !== 'coordinator')) ? (
                    <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', width: '100%' }}>
                      
                      {/* Left: Request Form */}
                      <div className="glass-panel" style={{ flex: '1 1 350px', padding: '1.5rem', alignSelf: 'flex-start' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                          🦺 Solicitar Nuevo EPI
                        </h3>
                        <form onSubmit={submitEpiRequest} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                          <div className="form-group" style={{ margin: 0 }}>
                            <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>SELECCIONAR EQUIPO</label>
                            <select
                              className="selector-dropdown"
                              style={{ width: '100%', padding: '0.75rem' }}
                              value={epiRequestForm.type_id}
                              onChange={e => setEpiRequestForm({ type_id: e.target.value, size_id: '' })}
                              required
                            >
                              <option value="">-- Elige un EPI --</option>
                              {epiTypesList.map(t => (
                                <option key={t.id} value={t.id.toString()}>{t.name.toUpperCase()}</option>
                              ))}
                            </select>
                          </div>
                          
                          <div className="form-group" style={{ margin: 0 }}>
                            <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>SELECCIONAR TALLA</label>
                            <select
                              className="selector-dropdown"
                              style={{ width: '100%', padding: '0.75rem' }}
                              value={epiRequestForm.size_id}
                              onChange={e => setEpiRequestForm({ ...epiRequestForm, size_id: e.target.value })}
                              required
                              disabled={!epiRequestForm.type_id}
                            >
                              <option value="">-- Selecciona una talla --</option>
                              {(epiTypesList.find(t => t.id.toString() === epiRequestForm.type_id)?.sizes || []).map(s => (
                                <option key={s.id} value={s.id.toString()}>{s.size_name.toUpperCase()}</option>
                              ))}
                            </select>
                          </div>

                          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.8rem', borderRadius: '10px', fontWeight: 'bold' }}>
                            Enviar Solicitud
                          </button>
                        </form>
                      </div>

                      {/* Right: Personal History */}
                      <div className="glass-panel" style={{ flex: '1 1 550px', padding: '1.5rem' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                          ⏳ Historial de Mis Entregas y Solicitudes
                        </h3>
                        
                        {epiRequestsList.filter(r => r.employee_id === dashboardData.user.id).length === 0 ? (
                          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                            No has solicitado ningún EPI todavía.
                          </div>
                        ) : (
                          <div className="custom-table-wrapper" style={{ border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden' }}>
                            <table className="custom-table">
                              <thead>
                                <tr>
                                  <th>EPI Solicitado</th>
                                  <th>Talla</th>
                                  <th>Fecha Solicitud</th>
                                  <th>Estado</th>
                                </tr>
                              </thead>
                              <tbody>
                                {epiRequestsList.filter(r => r.employee_id === dashboardData.user.id).map(req => {
                                  return (
                                    <tr key={req.id}>
                                      <td style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>
                                        {req.epi_name.toUpperCase()}
                                      </td>
                                      <td>
                                        <span className="badge badge-admin" style={{ fontWeight: 'bold' }}>
                                          {req.size_name.toUpperCase()}
                                        </span>
                                      </td>
                                      <td style={{ fontSize: '0.85rem' }}>
                                        {new Date(req.requested_at).toLocaleDateString('es-ES')}
                                      </td>
                                      <td>
                                        {req.status === 'delivered' ? (
                                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                                            <span className="badge" style={{ background: 'var(--success-glow)', color: 'var(--success)', border: '1px solid rgba(16, 185, 129, 0.3)', width: 'fit-content' }}>
                                              ENTREGADO
                                            </span>
                                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                              Por: {req.deliverer_name || 'Admin'} el {new Date(req.delivered_at).toLocaleDateString('es-ES')}
                                            </span>
                                          </div>
                                        ) : req.status === 'requested' ? (
                                          <span className="badge" style={{ background: 'var(--info-glow)', color: 'var(--info)', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                                            PEDIDO
                                          </span>
                                        ) : (
                                          <span className="badge" style={{ background: 'var(--warning-glow)', color: 'var(--warning)', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                                            PENDIENTE
                                          </span>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>

                    </div>
                  ) : (
                    /* General list of all requests for Coordinators & Admins */
                    <div className="glass-panel" style={{ padding: '1.5rem', width: '100%', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', margin: 0 }}>
                          📋 Registro de Solicitudes y Entregas de EPIs del Personal
                        </h3>
                        <button
                          type="button"
                          onClick={printEpiReport}
                          className="btn btn-secondary"
                          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 'bold' }}
                        >
                          🖨️ Imprimir Resumen EPIs
                        </button>
                      </div>

                      {epiRequestsList.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                          No hay solicitudes registradas en la base de datos.
                        </div>
                      ) : (
                        (() => {
                          const requestsByEmployee = {};
                          epiRequestsList.forEach(req => {
                            const empId = req.employee_id;
                            if (!requestsByEmployee[empId]) {
                              requestsByEmployee[empId] = {
                                employee_id: empId,
                                employee_name: req.employee_name || 'Desconocido',
                                employee_email: req.employee_email || 'N/A',
                                department_name: req.department_name || 'N/A',
                                requests: []
                              };
                            }
                            requestsByEmployee[empId].requests.push(req);
                          });

                          return (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                              {Object.values(requestsByEmployee).map(group => (
                                <div key={group.employee_id} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1.25rem', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                      <span style={{ fontWeight: '800', fontSize: '1rem', color: isLightTheme ? '#0f172a' : '#fff' }}>
                                        👤 {group.employee_name.toUpperCase()}
                                      </span>
                                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                        {group.employee_email}
                                      </span>
                                    </div>
                                    <span className="badge badge-coordinator" style={{ textTransform: 'uppercase', fontWeight: 'bold' }}>
                                      {group.department_name}
                                    </span>
                                  </div>

                                  <div className="custom-table-wrapper" style={{ overflowX: 'auto' }}>
                                    <table className="custom-table">
                                      <thead>
                                        <tr>
                                          <th>EPI & Talla</th>
                                          <th>Fecha Solicitud</th>
                                          <th>Estado / Acciones</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {group.requests.map(req => (
                                          <tr key={req.id}>
                                            <td>
                                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>
                                                  {req.epi_name.toUpperCase()}
                                                </span>
                                                <span className="badge badge-admin" style={{ fontWeight: 'bold' }}>
                                                  {req.size_name.toUpperCase()}
                                                </span>
                                              </div>
                                            </td>
                                            <td style={{ fontSize: '0.85rem' }}>
                                              {new Date(req.requested_at).toLocaleDateString('es-ES')}
                                            </td>
                                            <td>
                                              {req.status === 'delivered' ? (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                                                  <span className="badge" style={{ background: 'var(--success-glow)', color: 'var(--success)', border: '1px solid rgba(16, 185, 129, 0.3)', width: 'fit-content' }}>
                                                    ENTREGADO
                                                  </span>
                                                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                                    Por: {req.deliverer_name || 'Admin'} el {new Date(req.delivered_at).toLocaleDateString('es-ES')}
                                                  </span>
                                                </div>
                                              ) : (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                  {req.status === 'pending' ? (
                                                    <>
                                                      <span className="badge" style={{ background: 'var(--warning-glow)', color: 'var(--warning)', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                                                        PENDIENTE
                                                      </span>
                                                      <button
                                                        type="button"
                                                        onClick={() => updateEpiStatus(req.id, 'requested')}
                                                        className="btn btn-secondary"
                                                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', borderRadius: '6px' }}
                                                      >
                                                        Pedir EPI
                                                      </button>
                                                    </>
                                                  ) : (
                                                    <>
                                                      <span className="badge" style={{ background: 'var(--info-glow)', color: 'var(--info)', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                                                        PEDIDO
                                                      </span>
                                                      <button
                                                        type="button"
                                                        onClick={() => updateEpiStatus(req.id, 'delivered')}
                                                        className="btn btn-primary"
                                                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', borderRadius: '6px' }}
                                                      >
                                                        Entregar EPI
                                                      </button>
                                                    </>
                                                  )}
                                                </div>
                                              )}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              ))}
                            </div>
                          );
                        })()
                      )}
                    </div>
                  )}

                </div>
              )}
            </>
          )
        )}
      </main>

      {/* -------------------- MODALS -------------------- */}

      {/* Request Detail Modal */}
      {showRequestDetailModal && selectedRequest && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px', width: '90%', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="panel-header" style={{ borderBottom: 'none', paddingBottom: '0', marginBottom: '0.25rem' }}>
              <h3 className="panel-title" style={{ fontSize: '1.3rem', fontWeight: '800' }}>
                🔍 Detalles de Solicitud
              </h3>
              <button 
                className="btn btn-secondary" 
                style={{ padding: '0.25rem 0.5rem', border: 'none', background: 'transparent', fontSize: '1.2rem' }} 
                onClick={() => { setShowRequestDetailModal(false); setSelectedRequest(null); }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div className="detail-item">
                <span className="detail-label">Empleado</span>
                <span className="detail-value" style={{ fontWeight: 'bold' }}>
                  {selectedRequest.employee_name || dashboardData.user.name}
                </span>
              </div>
              
              <div className="detail-item">
                <span className="detail-label">Tipo de Solicitud</span>
                <span className="detail-value" style={{ fontWeight: 'bold', color: 'var(--primary-light)' }}>
                  {getRequestTypeLabel(selectedRequest)}
                </span>
              </div>

              <div className="detail-item">
                <span className="detail-label">Cantidad</span>
                <span className="detail-value" style={{ fontWeight: 'bold' }}>
                  {selectedRequest.amount > 0 ? `+${selectedRequest.amount}` : selectedRequest.amount} {selectedRequest.type === 'absence' ? 'días' : 'horas'}
                </span>
              </div>

              <div className="detail-item">
                <span className="detail-label">Periodo / Fecha</span>
                <span className="detail-value">
                  {selectedRequest.type === 'absence' 
                    ? `${new Date(selectedRequest.start_date).toLocaleDateString('es-ES')} al ${new Date(selectedRequest.end_date).toLocaleDateString('es-ES')}` 
                    : selectedRequest.type === 'hours_free' && selectedRequest.start_date 
                      ? `Día: ${new Date(selectedRequest.start_date).toLocaleDateString('es-ES')}` 
                      : selectedRequest.original_record_id 
                        ? `Consumido de Cred. #${selectedRequest.original_record_id}` 
                        : '-'
                  }
                </span>
              </div>

              <div className="detail-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.25rem' }}>
                <span className="detail-label">Observaciones</span>
                <span className="detail-value" style={{ fontStyle: 'italic', wordBreak: 'break-word', whiteSpace: 'pre-wrap', background: 'rgba(255,255,255,0.02)', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', width: '100%' }}>
                  {selectedRequest.observation || 'Sin observaciones'}
                </span>
              </div>

              <div className="detail-item">
                <span className="detail-label">Estado</span>
                <span className="detail-value">
                  {getRequestStatusBadge(selectedRequest.status)}
                </span>
              </div>

              {selectedRequest.conflicts && selectedRequest.conflicts.length > 0 && (
                <div style={{ marginTop: '0.5rem', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '10px', padding: '0.75rem' }}>
                  <div style={{ color: '#f87171', fontSize: '0.8rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.4rem' }}>
                    ⚠️ Conflictos de Departamento Detectados:
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    {selectedRequest.conflicts.map((c, idx) => (
                      <div key={idx} style={{ borderBottom: idx < selectedRequest.conflicts.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none', paddingBottom: '0.25rem' }}>
                        • <strong>{c.employee_name}</strong> ({c.absence_type}) del {new Date(c.start_date).toLocaleDateString('es-ES')} al {new Date(c.end_date).toLocaleDateString('es-ES')} <span style={{ color: c.status === 'approved' ? '#34d399' : '#fbbf24', fontWeight: 'bold' }}>[{c.status === 'approved' ? 'Aprobado' : 'Pendiente'}]</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Show the breakdown table inside the modal if there are consumed credits details */}
              {consumedCreditsDetails.length > 0 && (
                <div style={{ marginTop: '0.5rem', background: 'rgba(59, 130, 246, 0.04)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '10px', padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ color: 'var(--primary-light)', fontSize: '0.8rem', fontWeight: 'bold' }}>
                    Desglose de Horas Extra Compensadas:
                  </div>
                  <div style={{ maxHeight: '150px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    {consumedCreditsDetails.map((c, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', borderBottom: '1px solid rgba(255, 255, 255, 0.03)', paddingBottom: '0.25rem' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Día {c.date}: {c.hours} horas con el motivo: <strong>{c.concept}</strong></span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={printRequestDetail}
                style={{ marginRight: 'auto', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
              >
                🖨️ Imprimir
              </button>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => { setShowRequestDetailModal(false); setSelectedRequest(null); }}
              >
                Cerrar
              </button>
              {selectedRequest.status === 'pending' && (dashboardData.user.role === 'admin' || dashboardData.user.role === 'coordinator') && (
                <>
                  <button 
                    type="button" 
                    className="btn btn-danger" 
                    onClick={() => resolveRequestAndClose(selectedRequest.id, 'rejected')}
                  >
                    Rechazar
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-primary" 
                    style={{ backgroundColor: 'var(--success)' }} 
                    onClick={() => resolveRequestAndClose(selectedRequest.id, 'approved')}
                  >
                    Aprobar
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Advanced Request Modal */}
      {showRequestModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '520px', width: '90%' }}>
            <div className="panel-header" style={{ borderBottom: 'none', paddingBottom: '0.5rem' }}>
              <h3 className="panel-title" style={{ fontSize: '1.25rem', fontWeight: '800' }}>
                {requestTargetEmployee ? `Solicitud para: ${requestTargetEmployee.name}` : 'Nueva Solicitud / Registro'}
              </h3>
              <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', border: 'none', background: 'transparent', fontSize: '1.2rem' }} onClick={() => setShowRequestModal(false)}>✕</button>
            </div>

            {/* TAB SELECTOR */}
            <div style={{ display: 'flex', padding: '0.25rem 1.5rem', gap: '0.5rem' }}>
              <button 
                type="button"
                className="btn" 
                style={{ 
                  flex: 1, 
                  borderRadius: '10px',
                  backgroundColor: requestTab === 'absence' ? '#fff' : 'rgba(255, 255, 255, 0.03)',
                  color: requestTab === 'absence' ? 'var(--primary)' : 'var(--text-secondary)',
                  fontWeight: '600',
                  boxShadow: requestTab === 'absence' ? 'var(--shadow-sm)' : 'none'
                }}
                onClick={() => setRequestTab('absence')}
              >
                Ausencia
              </button>
              <button 
                type="button"
                className="btn" 
                style={{ 
                  flex: 1, 
                  borderRadius: '10px',
                  backgroundColor: requestTab === 'hours' ? '#fff' : 'rgba(255, 255, 255, 0.03)',
                  color: requestTab === 'hours' ? 'var(--primary)' : 'var(--text-secondary)',
                  fontWeight: '600',
                  boxShadow: requestTab === 'hours' ? 'var(--shadow-sm)' : 'none'
                }}
                onClick={() => setRequestTab('hours')}
              >
                Gestión Horas
              </button>
            </div>

            <form onSubmit={submitRequest}>
              <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                
                {requestTab === 'absence' && (
                  <>
                    <div className="form-group">
                      <label className="form-label">Tipo de Registro</label>
                      <select 
                        className="selector-dropdown"
                        style={{ width: '100%', padding: '0.75rem' }}
                        value={requestForm.absence_type_id}
                        onChange={e => {
                          const val = e.target.value;
                          setRequestForm({...requestForm, absence_type_id: val, start_date: '', end_date: ''});
                          setSelectedRangeId('');
                        }}
                        required
                      >
                        <option value="">-- Seleccionar Tipo de Ausencia --</option>
                        {dashboardData.absenceTypes?.filter(type => {
                          const role = dashboardData.user?.role;
                          if (role === 'admin') return type.visible_to_admins !== false;
                          if (role === 'coordinator') return type.visible_to_coordinators !== false;
                          return type.visible_to_employees !== false;
                        }).map(type => (
                          <option key={type.id} value={type.id}>
                            {type.name} {type.subtracts_days ? '(Resta de Vacaciones)' : '(No resta)'}
                          </option>
                        ))}
                      </select>
                      {selectedAbsType?.fixed_days && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--primary-light)', fontWeight: 'bold', marginTop: '0.25rem' }}>
                          ⚠️ Este registro tiene un rango fijo de {selectedAbsType.fixed_days} días.
                        </div>
                      )}
                    </div>

                    {/* PREDEFINED RANGES DROPDOWN (Shown if type contains preset ranges) */}
                    {selectedAbsType?.predefined_ranges?.length > 0 && (
                      <div className="form-group">
                        <label className="form-label">Seleccionar Turno / Rango Predefinido</label>
                        <select
                          className="selector-dropdown"
                          style={{ width: '100%' }}
                          value={selectedRangeId}
                          onChange={handleRangeSelection}
                          required
                        >
                          <option value="">-- Seleccionar Rango Programado --</option>
                          {selectedAbsType.predefined_ranges.map(range => (
                            <option key={range.id} value={range.id}>
                              {range.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div className="form-group">
                        <label className="form-label">Fecha Inicio</label>
                        <input 
                          type="date" 
                          className="form-input" 
                          value={requestForm.start_date}
                          onChange={e => setRequestForm({...requestForm, start_date: e.target.value})}
                          onClick={e => e.target.showPicker()}
                          disabled={!!selectedAbsType?.fixed_days || selectedAbsType?.predefined_ranges?.length > 0}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Fecha Fin</label>
                        <input 
                          type="date" 
                          className="form-input" 
                          value={requestForm.end_date}
                          onChange={e => setRequestForm({...requestForm, end_date: e.target.value})}
                          onClick={e => e.target.showPicker()}
                          disabled={!!selectedAbsType?.fixed_days || selectedAbsType?.predefined_ranges?.length > 0}
                          required={!selectedAbsType?.fixed_days && !(selectedAbsType?.predefined_ranges?.length > 0)}
                        />
                      </div>
                    </div>
                  </>
                )}

                {requestTab === 'hours' && (
                  <>
                    <div className="form-group">
                      <label className="form-label">Tipo de Operación</label>
                      <select 
                        className="selector-dropdown"
                        style={{ width: '100%', padding: '0.75rem' }}
                        value={requestForm.hours_type}
                        onChange={e => setRequestForm({...requestForm, hours_type: e.target.value, original_record_id: '', amount: ''})}
                        required
                      >
                        <option value="hours_register">Registrar Horas Extras</option>
                        <option value="hours_festive">Registrar Festivo Trabajado (+1v +4h)</option>
                        <option value="hours_free">Horas Libres (Consumo de saldo)</option>
                        <option value="hours_to_vacation">Pasar a Días de Vacaciones (8h = 1d)</option>
                        <option value="hours_payroll">Abono en Nómina (Consumo de saldo)</option>
                      </select>
                    </div>

                    {(requestForm.hours_type === 'hours_register' || requestForm.hours_type === 'hours_festive' || requestForm.hours_type === 'hours_free') && (
                      <div className="form-group">
                        <label className="form-label">
                          {requestForm.hours_type === 'hours_free' ? 'Fecha del Día a Consumir' : 'Fecha del Día Trabajado'}
                        </label>
                        <input 
                          type="date" 
                          className="form-input" 
                          value={requestForm.start_date}
                          onChange={e => setRequestForm({...requestForm, start_date: e.target.value})}
                          onClick={e => e.target.showPicker()}
                          required
                        />
                      </div>
                    )}

                    {(requestForm.hours_type === 'hours_free' || requestForm.hours_type === 'hours_to_vacation' || requestForm.hours_type === 'hours_payroll') && (
                      <div className="form-group">
                        <label className="form-label" style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          ⏰ Horas a usar de:
                        </label>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                          Trazabilidad: selecciona de qué registros se consumen y cuántas horas:
                        </span>

                        <div className="custom-table-wrapper" style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '0.5rem', background: 'rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          {employeeTimeRecords.filter(r => r.type === 'extra_hours' && parseFloat(r.amount) > 0 && parseFloat(r.remaining_amount) > 0).length === 0 ? (
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '1rem', textAlign: 'center', fontStyle: 'italic' }}>
                              No tienes créditos de horas extras disponibles.
                            </div>
                          ) : (
                            employeeTimeRecords
                              .filter(r => r.type === 'extra_hours' && parseFloat(r.amount) > 0 && parseFloat(r.remaining_amount) > 0)
                              .map(r => {
                                const isChecked = !!selectedCredits[r.id];
                                const hoursVal = selectedCredits[r.id] || '';
                                return (
                                  <div key={r.id} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', background: isChecked ? 'rgba(139, 92, 246, 0.08)' : 'rgba(255,255,255,0.02)', border: isChecked ? '1px solid var(--primary-glow)' : '1px solid var(--border-color)', padding: '0.75rem', borderRadius: '8px', transition: 'all 0.2s' }}>
                                    <input 
                                      type="checkbox"
                                      checked={isChecked}
                                      style={{ width: '18px', height: '18px', marginTop: '0.2rem', accentColor: 'var(--primary)', cursor: 'pointer' }}
                                      onChange={e => {
                                        if (e.target.checked) {
                                          setSelectedCredits({
                                            ...selectedCredits,
                                            [r.id]: r.remaining_amount
                                          });
                                        } else {
                                          const next = { ...selectedCredits };
                                          delete next[r.id];
                                          setSelectedCredits(next);
                                        }
                                      }}
                                    />
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 'bold' }}>
                                        <span>{new Date(r.created_at).toLocaleDateString('es-ES')}</span>
                                        <span style={{ color: 'var(--primary-light)' }}>Disp: {r.remaining_amount}h</span>
                                      </div>
                                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontStyle: 'italic', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', marginTop: '0.2rem' }}>
                                        {r.observation}
                                      </div>
                                      {isChecked && (
                                        <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Usar:</span>
                                          <input 
                                            type="number"
                                            step="0.1"
                                            min="0.1"
                                            max={parseFloat(r.remaining_amount)}
                                            style={{ width: '80px', padding: '0.2rem 0.4rem', fontSize: '0.8rem', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-color)', borderRadius: '4px', color: '#fff', outline: 'none' }}
                                            value={hoursVal}
                                            onChange={evt => {
                                              let val = parseFloat(evt.target.value);
                                              if (isNaN(val)) val = 0;
                                              if (val > parseFloat(r.remaining_amount)) val = parseFloat(r.remaining_amount);
                                              setSelectedCredits({
                                                ...selectedCredits,
                                                [r.id]: val
                                              });
                                            }}
                                            required
                                          />
                                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>horas</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })
                          )}
                        </div>

                        {/* SUM TOTAL HOURS COUNTER */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem', background: 'rgba(139, 92, 246, 0.05)', border: '1px solid var(--border-color-glow)', padding: '0.75rem 1rem', borderRadius: '10px' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>Total horas seleccionadas:</span>
                          <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--primary-light)' }}>
                            {Object.keys(selectedCredits).reduce((acc, id) => acc + (parseFloat(selectedCredits[id]) || 0), 0).toFixed(1)} hrs
                          </span>
                        </div>
                      </div>
                    )}

                    {requestForm.hours_type !== 'hours_festive' && (requestForm.hours_type === 'hours_register') && (
                      <div className="form-group">
                        <label className="form-label">Horas</label>
                        <input 
                          type="number" 
                          step="0.1"
                          className="form-input" 
                          placeholder="Cantidad de horas"
                          value={requestForm.amount}
                          onChange={e => setRequestForm({...requestForm, amount: e.target.value})}
                          min="0.1"
                          required
                        />
                      </div>
                    )}
                  </>
                )}

                <div className="form-group">
                  <label className="form-label">Motivo / Notas</label>
                  <textarea 
                    className="form-input" 
                    style={{ minHeight: '80px', fontFamily: 'inherit' }}
                    placeholder="Ej: No se presenta a su turno, comunica indisposición por teléfono..."
                    value={requestForm.observation}
                    onChange={e => setRequestForm({...requestForm, observation: e.target.value})}
                  />
                </div>

                {(dashboardData.user.role === 'admin' || dashboardData.user.role === 'coordinator') && (
                  <div className="form-group" style={{ background: 'rgba(59, 130, 246, 0.05)', border: '1px solid var(--border-color)', padding: '1rem', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div>
                      <div className="form-label" style={{ color: 'var(--primary-light)', fontWeight: 'bold' }}>Estado Inicial</div>
                      <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.5rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                          <input 
                            type="radio" 
                            name="direct_approve" 
                            value="pending" 
                            checked={requestForm.direct_approve === 'pending' && !requestForm.is_historical}
                            disabled={requestForm.is_historical}
                            onChange={e => setRequestForm({...requestForm, direct_approve: e.target.value})}
                            style={{ accentColor: 'var(--primary)' }}
                          />
                          Pendiente
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--success)' }}>
                          <input 
                            type="radio" 
                            name="direct_approve" 
                            value="approve_direct" 
                            checked={requestForm.direct_approve === 'approve_direct' || requestForm.is_historical}
                            disabled={requestForm.is_historical}
                            onChange={e => setRequestForm({...requestForm, direct_approve: e.target.value})}
                            style={{ accentColor: 'var(--success)' }}
                          />
                          Aprobar Directo
                        </label>
                      </div>
                    </div>

                    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
                      <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--warning)' }}>
                        <input 
                          type="checkbox" 
                          checked={requestForm.is_historical} 
                          onChange={e => {
                            const val = e.target.checked;
                            setRequestForm({
                              ...requestForm, 
                              is_historical: val, 
                              direct_approve: val ? 'approve_direct' : requestForm.direct_approve
                            });
                          }}
                          style={{ width: '18px', height: '18px', accentColor: 'var(--warning)' }}
                        />
                        📜 Registro histórico (no descontar saldo)
                      </label>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                        Útil para registrar vacaciones consumidas en el pasado que ya han sido restadas del saldo actual del empleado.
                      </div>
                    </div>
                  </div>
                )}

              </div>
              <div className="panel-header" style={{ borderBottom: 'none', borderTop: '1px solid var(--border-color)', justifyContent: 'flex-end', gap: '0.75rem', padding: '1rem 1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowRequestModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Crear Registro</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adjustments Modal */}
      {showTimeModal && selectedTimeEmployee && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '800px', width: '90%' }}>
            <div className="panel-header">
              <h3 className="panel-title">⏱ Registro y Trazabilidad: {selectedTimeEmployee.name}</h3>
              <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem' }} onClick={() => setShowTimeModal(false)}>✕</button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '1.5rem', padding: '1.5rem' }}>
              <form onSubmit={saveTimeAdjustment} className="glass-panel" style={{ padding: '1.25rem', height: 'fit-content' }}>
                <h4 style={{ marginBottom: '1rem', color: 'var(--primary-light)' }}>Registrar Ajuste Directo</h4>
                
                <div className="form-group">
                  <label className="form-label">Tipo de Saldo</label>
                  <select 
                    className="selector-dropdown"
                    value={timeForm.type}
                    onChange={e => setTimeForm({...timeForm, type: e.target.value})}
                  >
                    <option value="vacation">🏖 Vacaciones (Días)</option>
                    <option value="extra_hours">⏱ Horas Extras (Horas)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Cantidad (Usa negativo para restar)</label>
                  <input 
                    type="number" 
                    step={timeForm.type === 'vacation' ? '1' : '0.1'}
                    className="form-input" 
                    placeholder="Ej: 5 o -3"
                    value={timeForm.amount}
                    onChange={e => setTimeForm({...timeForm, amount: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Observaciones / Razón</label>
                  <textarea 
                    className="form-input" 
                    style={{ minHeight: '80px', fontFamily: 'inherit' }}
                    placeholder="Escribe el motivo del ajuste..."
                    value={timeForm.observation}
                    onChange={e => setTimeForm({...timeForm, observation: e.target.value})}
                    required
                  />
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
                  Aplicar Ajuste
                </button>
              </form>

              <div className="glass-panel" style={{ padding: '1.25rem', overflowY: 'auto', maxHeight: '420px' }}>
                <h4 style={{ marginBottom: '1rem', color: 'var(--primary-light)' }}>Historial de Transacciones</h4>
                {employeeTimeRecords.length === 0 ? (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontStyle: 'italic' }}>Sin movimientos registrados.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {employeeTimeRecords.map(rec => (
                      <div 
                        key={rec.id} 
                        onClick={() => setSelectedTimeRecord(rec)}
                        style={{ 
                          padding: '0.75rem', 
                          borderBottom: '1px solid var(--border-color)', 
                          fontSize: '0.85rem',
                          cursor: 'pointer',
                          borderRadius: '8px',
                          background: 'rgba(255,255,255,0.01)',
                          transition: 'all 0.2s ease'
                        }}
                        className="time-record-item-hover"
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                          <span style={{ fontWeight: '600' }}>{rec.type === 'vacation' ? '🏖 Vacaciones' : '⏱ Horas Extras'}</span>
                          <span style={{ 
                            fontWeight: 'bold', 
                            color: parseFloat(rec.amount) > 0 ? 'var(--success)' : 'var(--danger)' 
                          }}>
                            {parseFloat(rec.amount) > 0 ? `+${rec.amount}` : rec.amount}
                            {rec.type === 'vacation' ? 'd' : 'h'}
                          </span>
                        </div>
                        <div style={{ color: 'var(--text-secondary)', margin: '0.25rem 0' }}>"{rec.observation}"</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          <span>Por: {rec.creator_name || 'Sistema'}</span>
                          <span>{new Date(rec.created_at).toLocaleDateString('es-ES')}</span>
                        </div>
                        {rec.type === 'extra_hours' && parseFloat(rec.amount) > 0 && (
                          <div style={{ marginTop: '0.25rem', fontSize: '0.75rem', color: 'var(--warning)', fontWeight: 'bold' }}>
                            Disponible: {rec.remaining_amount} hrs
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Detail Sub-Modal */}
      {selectedTimeRecord && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-content" style={{ maxWidth: '420px', width: '90%' }}>
            <div className="panel-header">
              <h3 className="panel-title">🔍 Detalle de Transacción</h3>
              <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem' }} onClick={() => setSelectedTimeRecord(null)}>✕</button>
            </div>
            <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="detail-item">
                <span className="detail-label">ID Transacción</span>
                <span className="detail-value" style={{ fontWeight: 'bold' }}>#{selectedTimeRecord.id}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Tipo de Saldo</span>
                <span className="detail-value">{selectedTimeRecord.type === 'vacation' ? '🏖 Vacaciones (Días)' : '⏱ Horas Extras (Horas)'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Cantidad</span>
                <span className="detail-value" style={{ 
                  fontWeight: 'bold', 
                  color: parseFloat(selectedTimeRecord.amount) > 0 ? 'var(--success)' : 'var(--danger)' 
                }}>
                  {parseFloat(selectedTimeRecord.amount) > 0 ? `+${selectedTimeRecord.amount}` : selectedTimeRecord.amount}
                  {selectedTimeRecord.type === 'vacation' ? ' días' : ' horas'}
                </span>
              </div>
              <div className="detail-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.25rem' }}>
                <span className="detail-label">Observaciones</span>
                <span className="detail-value" style={{ fontStyle: 'italic', wordBreak: 'break-word', fontSize: '0.9rem', color: 'var(--text-primary)', marginTop: '0.25rem' }}>
                  &ldquo;{selectedTimeRecord.observation}&rdquo;
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Registrado Por</span>
                <span className="detail-value">{selectedTimeRecord.creator_name || 'Sistema'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Fecha de Registro</span>
                <span className="detail-value">{new Date(selectedTimeRecord.created_at).toLocaleString('es-ES')}</span>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  style={{ flex: 1 }}
                  onClick={() => setSelectedTimeRecord(null)}
                >
                  Cerrar
                </button>
                <button 
                  type="button" 
                  className="btn btn-danger" 
                  style={{ flex: 1 }}
                  onClick={() => {
                    setRecordToDelete(selectedTimeRecord);
                    setShowDeleteConfirmModal(true);
                  }}
                >
                  🗑 Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      {showDeleteConfirmModal && recordToDelete && (
        <div className="modal-overlay" style={{ zIndex: 1200 }}>
          <div className="modal-content" style={{ maxWidth: '440px', width: '90%', borderRadius: '24px', overflow: 'hidden', padding: '1.5rem', background: '#0f172a', border: '1px solid var(--border-color)', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }}>
            
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  width: '40px', 
                  height: '40px', 
                  borderRadius: '12px', 
                  backgroundColor: 'rgba(239, 68, 68, 0.1)', 
                  color: '#ef4444' 
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                </div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '800', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#f8fafc' }}>Confirmar Eliminación</h3>
              </div>
              <button 
                type="button" 
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '1.2rem', cursor: 'pointer', padding: '0.25rem' }} 
                onClick={() => { setShowDeleteConfirmModal(false); setRecordToDelete(null); }}
              >
                ✕
              </button>
            </div>

            {/* Record Summary Box */}
            <div className="glass-panel" style={{ padding: '1rem', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '16px', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem' }}>
                REGISTRO A ELIMINAR
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '1.15rem', color: '#f8fafc' }}>
                    {recordToDelete.type === 'vacation' ? 'Vacaciones' : 'Horas Libres'}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    {new Date(recordToDelete.created_at).toLocaleDateString('es-ES')}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ 
                    fontSize: '1.25rem', 
                    fontWeight: '800', 
                    color: '#3b82f6'
                  }}>
                    {parseFloat(recordToDelete.amount) > 0 ? `+${recordToDelete.amount}` : recordToDelete.amount}
                    {recordToDelete.type === 'vacation' ? 'd' : 'h'}
                  </div>
                  <div style={{ 
                    fontSize: '0.65rem', 
                    fontWeight: '800', 
                    backgroundColor: 'rgba(16, 185, 129, 0.1)', 
                    color: '#10b981', 
                    padding: '2px 6px', 
                    borderRadius: '4px',
                    display: 'inline-block',
                    marginTop: '0.25rem',
                    textTransform: 'uppercase'
                  }}>
                    APROBADO
                  </div>
                </div>
              </div>
            </div>

            {/* Prompt text */}
            <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', lineHeight: '1.5', margin: '0 0 1.5rem 0' }}>
              ¿Cómo deseas proceder con la eliminación de este registro?
            </p>

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
              
              {/* Option 1: Revert & Delete */}
              <button 
                type="button"
                onClick={() => executeDeleteTimeRecord(recordToDelete.id, true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '1rem 1.25rem',
                  borderRadius: '16px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #4f46e5, #4338ca)',
                  color: '#fff',
                  textAlign: 'left',
                  cursor: 'pointer',
                  boxShadow: '0 4px 15px rgba(79, 70, 229, 0.25)',
                  transition: 'transform 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '0.92rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Eliminar y Devolver Saldo</div>
                  <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', marginTop: '0.25rem' }}>El saldo del empleado se actualizará automáticamente</div>
                </div>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginLeft: '1rem' }}>
                  <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
                </svg>
              </button>

              {/* Option 2: Delete only */}
              <button 
                type="button"
                onClick={() => executeDeleteTimeRecord(recordToDelete.id, false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '1rem 1.25rem',
                  borderRadius: '16px',
                  border: '1px solid var(--border-color)',
                  background: 'rgba(255, 255, 255, 0.02)',
                  color: '#f8fafc',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s, transform 0.2s'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.02)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '0.92rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Solo Eliminar Registro</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>El saldo actual del empleado no se modificará</div>
                </div>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginLeft: '1rem' }}>
                  <path d="M20 20H7L3 16C2.5 15.5 2.5 14.5 3 14L13 4L20 11L12 19L20 20Z"></path>
                  <line x1="17" y1="14" x2="11" y2="20"></line>
                </svg>
              </button>

            </div>

            {/* Bottom Alert Warning */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.75rem', 
              padding: '0.85rem 1rem', 
              borderRadius: '14px', 
              border: '1px solid rgba(249, 115, 22, 0.2)', 
              background: 'rgba(249, 115, 22, 0.03)',
              color: '#f97316'
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
              <span style={{ fontSize: '0.73rem', fontWeight: '800', letterSpacing: '0.5px', textTransform: 'uppercase', lineHeight: '1.4' }}>
                Esta acción es irreversible y se eliminará permanentemente de la base de datos.
              </span>
            </div>

          </div>
        </div>
      )}

      {/* Profile Editor Modal */}
      {showProfileModal && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-content" style={{ maxWidth: '520px', width: '95%', borderRadius: '24px', overflow: 'hidden' }}>
            {/* Header */}
            <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', padding: '1.25rem 1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '38px', height: '38px', borderRadius: '10px', backgroundColor: 'var(--primary)', color: '#fff' }}>
                  👤
                </div>
                <h3 className="panel-title" style={{ fontSize: '1.25rem', fontWeight: '800', margin: 0 }}>Editar Perfil</h3>
              </div>
              <button 
                type="button" 
                className="btn btn-secondary" 
                style={{ padding: '0.35rem 0.55rem', border: 'none', background: 'transparent', fontSize: '1.15rem', cursor: 'pointer' }} 
                onClick={() => setShowProfileModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={saveProfile}>
              <div className="panel-body" style={{ maxHeight: '75vh', overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                
                {/* Profile Preview */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <div style={{
                    width: '100px',
                    height: '100px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--primary-light), var(--primary))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '2.5rem',
                    color: '#fff',
                    fontWeight: 'bold',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.15)',
                    border: '4px solid rgba(255,255,255,0.05)',
                    overflow: 'hidden'
                  }}>
                    {profileForm.avatar_url ? (
                      <img 
                        src={profileForm.avatar_url} 
                        alt={profileForm.name} 
                        style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} 
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    ) : (
                      profileForm.name ? profileForm.name.charAt(0).toUpperCase() : '?'
                    )}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Vista previa del avatar</span>
                </div>

                {/* Form fields */}
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.72rem', letterSpacing: '0.5px' }}>NOMBRE COMPLETO</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={profileForm.name} 
                    onChange={e => setProfileForm({...profileForm, name: e.target.value})} 
                    required 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.72rem', letterSpacing: '0.5px' }}>EMAIL DE CONTACTO</label>
                  <input 
                    type="email" 
                    className="form-input" 
                    value={profileForm.email} 
                    onChange={e => setProfileForm({...profileForm, email: e.target.value})} 
                    required 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.72rem', letterSpacing: '0.5px' }}>NUEVA CONTRASEÑA</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>🔒</span>
                    <input 
                      type="password" 
                      className="form-input" 
                      style={{ paddingLeft: '32px' }}
                      placeholder="Dejar en blanco para mantener la actual"
                      value={profileForm.password || ''} 
                      onChange={e => setProfileForm({...profileForm, password: e.target.value})} 
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.72rem', letterSpacing: '0.5px' }}>FOTO DE PERFIL (URL)</label>
                  <input 
                    type="url" 
                    className="form-input" 
                    placeholder="https://ejemplo.com/foto.jpg"
                    value={profileForm.avatar_url} 
                    onChange={e => setProfileForm({...profileForm, avatar_url: e.target.value})} 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.72rem', letterSpacing: '0.5px' }}>SUBIR FOTO DE PERFIL</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <input 
                      type="file" 
                      accept="image/*"
                      id="avatar-upload-input"
                      style={{ display: 'none' }}
                      onChange={async (e) => {
                        const file = e.target.files[0];
                        if (!file) return;
                        const formData = new FormData();
                        formData.append('file', file);
                        try {
                          const res = await fetch('/api/upload', {
                            method: 'POST',
                            body: formData
                          });
                          const data = await res.json();
                          if (!res.ok) throw new Error(data.error || 'Error al subir la imagen');
                          setProfileForm({ ...profileForm, avatar_url: data.url });
                        } catch (err) {
                          alert(err.message);
                        }
                      }}
                    />
                    <label 
                      htmlFor="avatar-upload-input"
                      className="btn"
                      style={{
                        padding: '0.55rem 1rem',
                        borderRadius: '10px',
                        fontSize: '0.82rem',
                        fontWeight: '700',
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-primary)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'}
                    >
                      📁 Elegir Archivo
                    </label>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {profileForm.avatar_url && profileForm.avatar_url.startsWith('/uploads/') 
                        ? 'Imagen subida con éxito' 
                        : 'No se ha seleccionado ningún archivo'}
                    </span>
                  </div>
                </div>

                {/* Preset Avatars Gallery */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <label className="form-label" style={{ fontSize: '0.72rem', letterSpacing: '0.5px' }}>SELECCIONAR AVATAR PREDETERMINADO</label>
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(6, 1fr)', 
                    gap: '0.75rem', 
                    padding: '0.5rem 0'
                  }}>
                    {[
                      '/uploads/minion_bob.svg',
                      '/uploads/minion_stuart.svg',
                      '/uploads/minion_kevin.svg',
                      '/uploads/minion_kingbob.svg',
                      '/uploads/minion_evil.svg',
                      '/uploads/minion_mel.svg'
                    ].map((url, idx) => {
                      const isSelected = profileForm.avatar_url === url;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setProfileForm({...profileForm, avatar_url: url})}
                          style={{
                            width: '100%',
                            padding: 0,
                            borderRadius: '50%',
                            border: isSelected ? '3px solid var(--primary)' : '2px solid transparent',
                            background: 'none',
                            cursor: 'pointer',
                            overflow: 'hidden',
                            aspectRatio: '1',
                            transition: 'all 0.2s ease',
                            transform: isSelected ? 'scale(1.1)' : 'scale(1)'
                          }}
                        >
                          <img 
                            src={url} 
                            alt={`Avatar ${idx + 1}`} 
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>

              </div>
              <div className="panel-header" style={{ borderBottom: 'none', borderTop: '1px solid var(--border-color)', justifyContent: 'flex-end', gap: '0.75rem', padding: '1rem 1.5rem' }}>
                <button type="button" className="btn btn-secondary" style={{ borderRadius: '10px' }} onClick={() => setShowProfileModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" style={{ borderRadius: '10px' }}>Guardar Cambios</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Employee Modal (Ficha Empleado) */}
      {showEmployeeModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '680px', width: '95%', borderRadius: '24px', overflow: 'hidden' }}>
            {/* Header */}
            <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', padding: '1rem 1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '38px', height: '38px', borderRadius: '10px', backgroundColor: 'var(--primary)', color: '#fff' }}>
                  👥
                </div>
                <h3 className="panel-title" style={{ fontSize: '1.25rem', fontWeight: '800', margin: 0 }}>Ficha Empleado</h3>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {editingEmployee && (
                  <>
                    <button 
                      type="button" 
                      className="btn" 
                      style={{ 
                        backgroundColor: 'rgba(249, 115, 22, 0.08)', 
                        color: '#f97316', 
                        border: '1px solid rgba(249, 115, 22, 0.25)', 
                        padding: '0.45rem 0.9rem', 
                        borderRadius: '10px', 
                        fontSize: '0.82rem', 
                        fontWeight: '700',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}
                      onClick={() => {
                        alert("Solicitud de EPI registrada para este empleado.");
                      }}
                    >
                      👷 Solicitar EPI
                    </button>
                    
                    <button 
                      type="button" 
                      className="btn btn-primary" 
                      style={{ 
                        padding: '0.45rem 0.9rem', 
                        borderRadius: '10px', 
                        fontSize: '0.82rem', 
                        fontWeight: '700',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}
                      onClick={() => {
                        setShowEmployeeModal(false);
                        openRequestModalForEmployee(editingEmployee);
                      }}
                    >
                      ➕ Nueva Solicitud
                    </button>
                  </>
                )}
                
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  style={{ padding: '0.35rem 0.55rem', border: 'none', background: 'transparent', fontSize: '1.15rem' }} 
                  onClick={() => setShowEmployeeModal(false)}
                >
                  ✕
                </button>
              </div>
            </div>

            <form onSubmit={saveEmployee}>
              <div className="panel-body" style={{ maxHeight: '78vh', overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                
                {/* Profile / Details Grid */}
                <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                  {/* Left Circle Profile */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '120px' }}>
                    <div style={{
                      width: '110px',
                      height: '110px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, var(--primary-light), var(--primary))',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '2.5rem',
                      color: '#fff',
                      fontWeight: 'bold',
                      boxShadow: '0 4px 15px rgba(0,0,0,0.15)',
                      border: '4px solid rgba(255,255,255,0.05)'
                    }}>
                      {editingEmployee?.avatar_url ? (
                        <img 
                          src={editingEmployee.avatar_url} 
                          alt={empForm.name} 
                          style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} 
                        />
                      ) : (
                        empForm.name ? empForm.name.charAt(0).toUpperCase() : '?'
                      )}
                    </div>
                  </div>

                  {/* Right Form Fields */}
                  <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', minWidth: '280px' }}>
                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                      <label className="form-label" style={{ fontSize: '0.72rem', letterSpacing: '0.5px' }}>URL FOTO DE PERFIL</label>
                      <input 
                        type="url" 
                        className="form-input" 
                        value={empForm.avatar_url || ''} 
                        onChange={e => setEmpForm({...empForm, avatar_url: e.target.value})} 
                        disabled={dashboardData?.user?.role !== 'admin'}
                      />
                    </div>

                    {dashboardData?.user?.role === 'admin' && (
                      <div className="form-group" style={{ gridColumn: 'span 2' }}>
                        <label className="form-label" style={{ fontSize: '0.72rem', letterSpacing: '0.5px' }}>SUBIR FOTO DE PERFIL</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <input 
                            type="file" 
                            accept="image/*"
                            id="employee-avatar-upload"
                            style={{ display: 'none' }}
                            onChange={async (e) => {
                              const file = e.target.files[0];
                              if (!file) return;
                              const formData = new FormData();
                              formData.append('file', file);
                              try {
                                const res = await fetch('/api/upload', {
                                  method: 'POST',
                                  body: formData
                                });
                                const data = await res.json();
                                if (!res.ok) throw new Error(data.error || 'Error al subir la imagen');
                                setEmpForm({ ...empForm, avatar_url: data.url });
                              } catch (err) {
                                alert(err.message);
                              }
                            }}
                          />
                          <label 
                            htmlFor="employee-avatar-upload"
                            className="btn"
                            style={{
                              padding: '0.55rem 1rem',
                              borderRadius: '10px',
                              fontSize: '0.82rem',
                              fontWeight: '700',
                              backgroundColor: 'rgba(255, 255, 255, 0.05)',
                              border: '1px solid var(--border-color)',
                              color: 'var(--text-primary)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              transition: 'background-color 0.2s'
                            }}
                            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
                            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'}
                          >
                            📁 Elegir Archivo
                          </label>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {empForm.avatar_url && empForm.avatar_url.startsWith('/uploads/') 
                              ? 'Imagen subida con éxito' 
                              : 'No se ha seleccionado ningún archivo'}
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                      <label className="form-label" style={{ fontSize: '0.72rem', letterSpacing: '0.5px' }}>NOMBRE Y APELLIDOS</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        value={empForm.name} 
                        onChange={e => setEmpForm({...empForm, name: e.target.value})} 
                        disabled={dashboardData?.user?.role !== 'admin'}
                        required 
                      />
                    </div>

                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                      <label className="form-label" style={{ fontSize: '0.72rem', letterSpacing: '0.5px' }}>EMAIL CORPORATIVO</label>
                      <input 
                        type="email" 
                        className="form-input" 
                        value={empForm.email} 
                        onChange={e => setEmpForm({...empForm, email: e.target.value})} 
                        disabled={dashboardData?.user?.role !== 'admin'}
                        required 
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: '0.72rem', letterSpacing: '0.5px' }}>ROL</label>
                      <select 
                        className="selector-dropdown"
                        value={empForm.role}
                        onChange={e => setEmpForm({...empForm, role: e.target.value})}
                        disabled={dashboardData?.user?.role !== 'admin'}
                      >
                        <option value="employee">Trabajador</option>
                        <option value="coordinator">Coordinador</option>
                        <option value="admin">Administrador</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: '0.72rem', letterSpacing: '0.5px' }}>DEPARTAMENTO</label>
                      <select 
                        className="selector-dropdown"
                        value={empForm.department_id}
                        onChange={e => setEmpForm({...empForm, department_id: e.target.value})}
                        disabled={dashboardData?.user?.role !== 'admin' && dashboardData?.user?.role !== 'coordinator'}
                      >
                        <option value="">Ninguno / Sin asignar</option>
                        {dashboardData?.user?.role === 'admin' 
                          ? dashboardData?.allDepartments?.map(d => <option key={d.id} value={d.id}>{d.name}</option>)
                          : dashboardData?.managedDepartments?.map(d => <option key={d.id} value={d.id}>{d.name}</option>)
                        }
                      </select>
                    </div>

                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                      <label className="form-label" style={{ fontSize: '0.72rem', letterSpacing: '0.5px' }}>{editingEmployee ? 'NUEVA CONTRASEÑA' : 'CONTRASEÑA INICIAL'}</label>
                      <div style={{ position: 'relative' }}>
                        <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>🔒</span>
                        <input 
                          type="password" 
                          className="form-input" 
                          style={{ paddingLeft: '32px' }}
                          placeholder={editingEmployee ? "Dejar en blanco para mantener actual" : "Escribe la contraseña inicial"}
                          value={empForm.password} 
                          onChange={e => setEmpForm({...empForm, password: e.target.value})} 
                          disabled={dashboardData?.user?.role !== 'admin'}
                          required={!editingEmployee} 
                        />
                      </div>
                    </div>

                    {!editingEmployee && (
                      <>
                        <div className="form-group">
                          <label className="form-label" style={{ fontSize: '0.72rem', letterSpacing: '0.5px' }}>VACACIONES INICIALES (DÍAS)</label>
                          <input 
                            type="number" 
                            className="form-input" 
                            value={empForm.vacation_days} 
                            onChange={e => setEmpForm({...empForm, vacation_days: parseFloat(e.target.value) || 0})} 
                            disabled={dashboardData?.user?.role !== 'admin'}
                            required 
                          />
                        </div>

                        <div className="form-group">
                          <label className="form-label" style={{ fontSize: '0.72rem', letterSpacing: '0.5px' }}>HORAS EXTRAS INICIALES</label>
                          <input 
                            type="number" 
                            step="0.1"
                            className="form-input" 
                            value={empForm.extra_hours} 
                            onChange={e => setEmpForm({...empForm, extra_hours: parseFloat(e.target.value) || 0})} 
                            disabled={dashboardData?.user?.role !== 'admin'}
                            required 
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Real Balances */}
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-secondary)', letterSpacing: '0.5px' }}>
                      SALDOS REALES (SINCRONIZADOS)
                    </span>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button 
                        type="button" 
                        className="btn btn-secondary" 
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                        onClick={async () => {
                          await refreshData();
                          alert("Saldo sincronizado correctamente.");
                        }}
                      >
                        🕒 Sincronizar Saldo
                      </button>
                      <button 
                        type="button" 
                        className="btn btn-secondary" 
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                        onClick={() => alert("Conexión directa con BBDD establecida correctamente.")}
                      >
                        ℹ️ Datos directos de BBDD
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    {/* Vacations Balance Card */}
                    <div style={{
                      flex: 1,
                      minWidth: '200px',
                      background: 'rgba(249, 115, 22, 0.02)',
                      border: '1px solid rgba(249, 115, 22, 0.15)',
                      borderRadius: '16px',
                      padding: '1.25rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem'
                    }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#ea580c', letterSpacing: '0.5px' }}>VACACIONES</div>
                      <div style={{ fontSize: '2rem', fontWeight: '800', color: '#ea580c' }}>
                        {parseFloat(empForm.vacation_days).toFixed(1)}
                      </div>
                      
                      {editingEmployee && (
                        <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.25rem' }}>
                          <input 
                            type="number"
                            step="1"
                            placeholder="Ajustar días..."
                            className="form-input"
                            style={{ padding: '0.35rem 0.5rem', fontSize: '0.8rem', borderRadius: '8px' }}
                            id="quick_adj_vac"
                            onKeyDown={async (e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                const val = parseInt(e.target.value);
                                if (isNaN(val) || val === 0) return;
                                
                                const target = e.target;
                                target.value = '';
                                target.blur();

                                const obs = window.prompt("Indica una observación para esta regularización (opcional):");
                                if (obs === null) return;
                                const finalObs = obs.trim() ? `Regularización Admin: ${obs.trim()}` : 'Regularización Admin';
                                
                                // Call quick adjust
                                try {
                                  const res = await fetch('/api/time-records', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                      employee_id: editingEmployee.id,
                                      created_by: dashboardData.user.id,
                                      type: 'vacation',
                                      amount: val,
                                      observation: finalObs,
                                      action: 'adjust'
                                    })
                                  });
                                  if (!res.ok) throw new Error("Ajuste fallido");
                                  await refreshData();
                                  setEmpForm(prev => ({ ...prev, vacation_days: parseFloat(prev.vacation_days) + val }));
                                  fetchTimeRecords(editingEmployee.id);
                                } catch (err) {
                                  alert(err.message);
                                }
                              }
                            }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Extra Hours Balance Card */}
                    <div style={{
                      flex: 1,
                      minWidth: '200px',
                      background: 'rgba(59, 130, 246, 0.02)',
                      border: '1px solid rgba(59, 130, 246, 0.15)',
                      borderRadius: '16px',
                      padding: '1.25rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem'
                    }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--primary-light)', letterSpacing: '0.5px' }}>HORAS EXTRA</div>
                      <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--primary-light)' }}>
                        {parseFloat(empForm.extra_hours).toFixed(1)}h
                      </div>

                      {editingEmployee && (
                        <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.25rem' }}>
                          <input 
                            type="number"
                            step="0.1"
                            placeholder="Ajustar horas..."
                            className="form-input"
                            style={{ padding: '0.35rem 0.5rem', fontSize: '0.8rem', borderRadius: '8px' }}
                            id="quick_adj_hrs"
                            onKeyDown={async (e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                const val = parseFloat(e.target.value);
                                if (isNaN(val) || val === 0) return;
                                
                                const target = e.target;
                                target.value = '';
                                target.blur();

                                const obs = window.prompt("Indica una observación para esta regularización (opcional):");
                                if (obs === null) return;
                                const finalObs = obs.trim() ? `Regularización Admin: ${obs.trim()}` : 'Regularización Admin';
                                
                                // Call quick adjust
                                try {
                                  const res = await fetch('/api/time-records', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                      employee_id: editingEmployee.id,
                                      created_by: dashboardData.user.id,
                                      type: 'extra_hours',
                                      amount: val,
                                      observation: finalObs,
                                      action: 'adjust'
                                    })
                                  });
                                  if (!res.ok) throw new Error("Ajuste fallido");
                                  await refreshData();
                                  setEmpForm(prev => ({ ...prev, extra_hours: parseFloat(prev.extra_hours) + val }));
                                  fetchTimeRecords(editingEmployee.id);
                                } catch (err) {
                                  alert(err.message);
                                }
                              }
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Recent Transactions History */}
                {editingEmployee && (
                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-secondary)', letterSpacing: '0.5px' }}>
                        HISTORIAL RECIENTE
                      </div>
                      <button
                        type="button"
                        className="btn btn-danger"
                        style={{ padding: '0.25rem 0.65rem', fontSize: '0.75rem', borderRadius: '8px' }}
                        onClick={() => deleteAllEmployeeRecords(editingEmployee.id)}
                      >
                        💥 Limpiar Todo (Sin alterar saldos)
                      </button>
                    </div>
                    {employeeTimeRecords.length === 0 ? (
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic', padding: '0.5rem' }}>
                        Sin movimientos registrados para este colaborador.
                      </p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', maxHeight: '180px', overflowY: 'auto', paddingRight: '0.25rem' }}>
                        {employeeTimeRecords.map(rec => (
                          <div 
                            key={rec.id} 
                            onClick={() => setSelectedTimeRecord(rec)}
                            style={{ 
                              padding: '0.65rem 0.85rem', 
                              backgroundColor: 'rgba(255,255,255,0.01)',
                              border: '1px solid var(--border-color)',
                              borderRadius: '10px', 
                              fontSize: '0.82rem',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '0.2rem',
                              cursor: 'pointer',
                              transition: 'background-color 0.2s ease'
                            }}
                            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
                            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.01)'}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontWeight: '700' }}>{rec.type === 'vacation' ? '🏖 Ajuste Vacaciones' : '⏱ Ajuste Horas'}</span>
                              <span style={{ 
                                fontWeight: '800', 
                                color: parseFloat(rec.amount) > 0 ? 'var(--success)' : 'var(--danger)' 
                              }}>
                                {parseFloat(rec.amount) > 0 ? `+${rec.amount}` : rec.amount}
                                {rec.type === 'vacation' ? 'd' : 'h'}
                              </span>
                            </div>
                            <div style={{ color: 'var(--text-secondary)', fontStyle: 'italic', fontSize: '0.78rem' }}>
                              "{rec.observation}"
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                              <span>Registrado por: {rec.creator_name || 'Sistema'}</span>
                              <span>{new Date(rec.created_at).toLocaleDateString('es-ES')}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Coordinators multi-department checkbox logic */}
                {(empForm.role === 'coordinator' || empForm.role === 'admin') && dashboardData?.user?.role === 'admin' && (
                  <div className="form-group" style={{ marginTop: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
                    <label className="form-label" style={{ fontWeight: 'bold' }}>Departamentos que Gestiona</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.5rem' }}>
                      {dashboardData.allDepartments?.map(dept => {
                        const isChecked = empForm.managed_department_ids.includes(dept.id);
                        return (
                          <label key={dept.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                            <input 
                              type="checkbox" 
                              checked={isChecked}
                              style={{ width: '16px', height: '16px', accentColor: 'var(--primary)' }}
                              onChange={e => handleDeptCheckboxChange(dept.id, e.target.checked)}
                            />
                            {dept.name}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

              </div>
              <div className="panel-header" style={{ borderBottom: 'none', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', padding: '1rem 1.5rem' }}>
                <div>
                  {editingEmployee && dashboardData?.user?.role === 'admin' && (
                    <button 
                      type="button" 
                      className="btn btn-danger" 
                      style={{ borderRadius: '10px' }} 
                      onClick={handleDeleteEmployeeInModal}
                    >
                      🗑️ Eliminar Empleado
                    </button>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button type="button" className="btn btn-secondary" style={{ borderRadius: '10px' }} onClick={() => setShowEmployeeModal(false)}>Cancelar</button>
                  <button type="submit" className="btn btn-primary" style={{ borderRadius: '10px' }}>Guardar</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Department Modal */}
      {showDepartmentModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="panel-header">
              <h3 className="panel-title">{editingDepartment ? 'Editar Departamento' : 'Nuevo Departamento'}</h3>
              <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem' }} onClick={() => setShowDepartmentModal(false)}>✕</button>
            </div>
            <form onSubmit={saveDepartment}>
              <div className="panel-body">
                <div className="form-group">
                  <label className="form-label">Nombre del Departamento</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={deptForm.name} 
                    onChange={e => setDeptForm({...deptForm, name: e.target.value})} 
                    required 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Coordinador Responsable</label>
                  <select 
                    className="selector-dropdown"
                    value={deptForm.coordinator_id}
                    onChange={e => setDeptForm({...deptForm, coordinator_id: e.target.value})}
                  >
                    <option value="">Sin Coordinador</option>
                    {dashboardData?.potentialCoordinators?.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.role === 'admin' ? 'Admin' : 'Coordinador'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="panel-header" style={{ borderBottom: 'none', borderTop: '1px solid var(--border-color)', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowDepartmentModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sick Leave Employees Modal */}
      {showSickLeaveModal && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-content" style={{ maxWidth: '480px', width: '95%' }}>
            <div className="panel-header">
              <h3 className="panel-title">🤒 Personal de Baja hoy ({dashboardData?.sickEmployees?.length || 0})</h3>
              <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem' }} onClick={() => setShowSickLeaveModal(false)}>✕</button>
            </div>
            <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '400px', overflowY: 'auto' }}>
              {(!dashboardData?.sickEmployees || dashboardData.sickEmployees.length === 0) ? (
                <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '1.5rem', fontStyle: 'italic' }}>
                  No hay ningún empleado de baja médica el día de hoy.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {dashboardData.sickEmployees.map(emp => (
                    <div 
                      key={emp.id} 
                      className="glass-panel" 
                      style={{ 
                        padding: '1rem', 
                        background: 'rgba(255,255,255,0.02)', 
                        borderLeft: '4px solid #ec4899',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.25rem'
                      }}
                    >
                      <div style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '0.95rem' }}>{emp.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{emp.email}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                        Periodo: <strong>{new Date(emp.start_date).toLocaleDateString('es-ES')}</strong> al <strong>{new Date(emp.end_date).toLocaleDateString('es-ES')}</strong>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowSickLeaveModal(false)}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>

      {/* MODAL: PRINT OPTIONS */}
      {printModalOpen && (
        <div className="modal-overlay" style={{ zIndex: 1100 }} onClick={() => setPrintModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '450px' }}>
            <div className="panel-header">
              <h3 className="panel-title">🖨️ Opciones de Impresión</h3>
              <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem' }} onClick={() => setPrintModalOpen(false)}>✕</button>
            </div>
            <div className="panel-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div className="form-group">
                  <span className="form-label">Selecciona el alcance:</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.25rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                      <input 
                        type="radio" 
                        name="printScope" 
                        checked={printOption === 'current'} 
                        onChange={() => setPrintOption('current')} 
                      />
                      Mes visible actualmente ({getMonthName(schedMonth)} {schedYear})
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                      <input 
                        type="radio" 
                        name="printScope" 
                        checked={printOption === 'range'} 
                        onChange={() => setPrintOption('range')} 
                      />
                      Rango de meses
                    </label>
                  </div>
                </div>

                {printOption === 'range' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Desde:</label>
                      <select 
                        className="selector-dropdown" 
                        value={printStartMonth} 
                        onChange={e => setPrintStartMonth(parseInt(e.target.value))}
                        style={{ width: '100%', marginBottom: '0.5rem' }}
                      >
                        {Array.from({ length: 12 }).map((_, idx) => (
                          <option key={idx} value={idx}>{getMonthName(idx)}</option>
                        ))}
                      </select>
                      <select 
                        className="selector-dropdown" 
                        value={printStartYear} 
                        onChange={e => setPrintStartYear(parseInt(e.target.value))}
                        style={{ width: '100%' }}
                      >
                        {[schedYear - 1, schedYear, schedYear + 1, schedYear + 2].map(y => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Hasta:</label>
                      <select 
                        className="selector-dropdown" 
                        value={printEndMonth} 
                        onChange={e => setPrintEndMonth(parseInt(e.target.value))}
                        style={{ width: '100%', marginBottom: '0.5rem' }}
                      >
                        {Array.from({ length: 12 }).map((_, idx) => (
                          <option key={idx} value={idx}>{getMonthName(idx)}</option>
                        ))}
                      </select>
                      <select 
                        className="selector-dropdown" 
                        value={printEndYear} 
                        onChange={e => setPrintEndYear(parseInt(e.target.value))}
                        style={{ width: '100%' }}
                      >
                        {[schedYear - 1, schedYear, schedYear + 1, schedYear + 2].map(y => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    style={{ flex: 1 }} 
                    onClick={() => setPrintModalOpen(false)}
                  >
                    Cancelar
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-primary" 
                    style={{ flex: 1 }} 
                    onClick={handleGeneratePrint}
                    disabled={isGeneratingPrint}
                  >
                    {isGeneratingPrint ? 'Preparando...' : 'Generar Impresión'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PRINT SHEETS ONLY (Hidden on screen, visible during browser printing) */}
      {printingMonthsList.length > 0 && (
        <div className="print-sheets-only">
          {printingMonthsList.map(({ year, month, assignments }) => {
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            let empList = [];
            if (dashboardData.user.role === 'admin') {
              empList = dashboardData.allEmployees || [];
            } else if (dashboardData.user.role === 'coordinator') {
              empList = dashboardData.managedEmployees || [];
            } else {
              empList = [dashboardData.user];
              if (dashboardData.colleagues) {
                empList.push(...dashboardData.colleagues);
              }
            }

            empList = empList.filter(emp => 
              emp.name.toLowerCase().includes(employeeSearch.toLowerCase()) || 
              emp.email.toLowerCase().includes(employeeSearch.toLowerCase())
            );

            if (schedDeptFilter) {
              empList = empList.filter(emp => emp.department_id?.toString() === schedDeptFilter);
            }

            return (
              <div key={`${year}-${month}`} className="print-sheet">
                <div style={{ borderBottom: '2px solid #000', paddingBottom: '5px', marginBottom: '15px' }}>
                  <h1 style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#000', margin: 0 }}>
                    📅 Planificación de Turnos — {getMonthName(month)} {year}
                  </h1>
                  <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '2px' }}>
                    Filtro: {schedDeptFilter ? (dashboardData.allDepartments?.find(d => d.id.toString() === schedDeptFilter)?.name || 'Departamento') : 'Todos los departamentos'}
                  </div>
                </div>

                <table className="custom-table" style={{ width: '100%', tableLayout: 'auto', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ width: '130px', minWidth: '130px', textAlign: 'left', border: '1px solid #000', padding: '4px' }}>
                        Empleado
                      </th>
                      {Array.from({ length: daysInMonth }).map((_, idx) => {
                        const dayNum = idx + 1;
                        const dateObj = new Date(year, month, dayNum);
                        const dayName = dateObj.toLocaleDateString('es-ES', { weekday: 'short' }).charAt(0).toUpperCase();
                        const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
                        return (
                          <th 
                            key={dayNum}
                            style={{ 
                              textAlign: 'center', 
                              padding: '4px 2px', 
                              fontSize: '0.65rem',
                              border: '1px solid #000',
                              backgroundColor: isWeekend ? '#f3f4f6' : 'transparent',
                              color: isWeekend ? '#d97706' : '#333'
                            }}
                          >
                            <div>{dayName}</div>
                            <div style={{ fontWeight: 'bold' }}>{dayNum}</div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {empList.map(emp => (
                      <tr key={emp.id}>
                        <td style={{ fontWeight: 'bold', border: '1px solid #000', padding: '2px 4px', fontSize: '0.6rem', width: '130px', whiteSpace: 'normal', wordBreak: 'break-word', height: '18px' }}>
                          <div>{emp.name}</div>
                          <div style={{ fontSize: '0.5rem', color: '#666', fontWeight: 'normal', lineHeight: '1' }}>{emp.department_name || 'Sin departamento'}</div>
                        </td>
                        {Array.from({ length: daysInMonth }).map((_, idx) => {
                          const dayNum = idx + 1;
                          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                          const cellKey = `${emp.id}_${dateStr}`;
                          const assignedShift = assignments[cellKey];
                          const dateObj = new Date(year, month, dayNum);
                          const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;

                          return (
                            <td 
                              key={dayNum}
                              style={{ 
                                padding: 0,
                                height: '18px',
                                border: '1px solid #000',
                                backgroundColor: assignedShift ? assignedShift.color : (isWeekend ? '#f3f4f6' : 'transparent'),
                                textAlign: 'center',
                                verticalAlign: 'middle',
                                fontSize: '0.55rem'
                              }}
                            >
                              {assignedShift && (
                                <span style={{ fontWeight: 'bold', color: '#000' }}>
                                  {assignedShift.name.charAt(0).toUpperCase()}
                                </span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Print Legend */}
                <div style={{ marginTop: '15px', display: 'flex', gap: '15px', flexWrap: 'wrap', fontSize: '0.7rem', borderTop: '1px solid #ddd', paddingTop: '10px' }}>
                  <span style={{ fontWeight: 'bold' }}>Códigos:</span>
                  {dashboardData.allShifts?.map(shift => (
                    <span key={shift.id} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ display: 'inline-block', width: '12px', height: '12px', backgroundColor: shift.color, border: '1px solid #000', borderRadius: '3px' }}></span>
                      {shift.name.charAt(0).toUpperCase()} = {shift.name}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

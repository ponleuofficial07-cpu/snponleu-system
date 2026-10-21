import React, { useState, useMemo } from 'react';
import {
  Clock,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Filter,
  Download,
  Users,
  Search,
  CheckSquare,
  FileSpreadsheet,
  Plus,
  Save,
  Coffee,
  Info
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { translations } from '../../locales/translations';
import { AttendanceStatus, AttendanceRecord } from '../../types';
import { exportToExcel } from '../../utils/exportUtils';

export const AttendanceView: React.FC = () => {
  const {
    language,
    employees,
    attendance,
    recordAttendance,
    bulkRecordAttendance,
    deleteAttendance,
    companySettings
  } = useApp();
  const t = translations[language];

  const todayStr = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Bulk / Quick Mark State
  const [bulkStatus, setBulkStatus] = useState<AttendanceStatus>('present');
  const [bulkCheckIn, setBulkCheckIn] = useState('07:00');
  const [bulkCheckOut, setBulkCheckOut] = useState('17:00');

  // Single Record Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalEmployeeId, setModalEmployeeId] = useState('');
  const [modalStatus, setModalStatus] = useState<AttendanceStatus>('present');
  const [modalCheckIn, setModalCheckIn] = useState('07:00');
  const [modalCheckOut, setModalCheckOut] = useState('17:00');
  const [modalHours, setModalHours] = useState(8);
  const [modalLateness, setModalLateness] = useState(0);
  const [modalOvertime, setModalOvertime] = useState(0);
  const [modalNotes, setModalNotes] = useState('');

  // Active employees for tracking
  const activeEmployees = useMemo(
    () => employees.filter((e) => e.status !== 'archived'),
    [employees]
  );

  // Employees filtered by search & department
  const visibleEmployees = useMemo(() => {
    return activeEmployees.filter((emp) => {
      const matchSearch =
        emp.nameKhmer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.nameEnglish.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchDept = selectedDept === 'ALL' || emp.department === selectedDept;
      return matchSearch && matchDept;
    });
  }, [activeEmployees, searchTerm, selectedDept]);

  // Map of today's records by employeeId
  const recordsMap = useMemo(() => {
    const map = new Map<string, AttendanceRecord>();
    attendance.forEach((r) => {
      if (r.date === selectedDate) {
        map.set(r.employeeId, r);
      }
    });
    return map;
  }, [attendance, selectedDate]);

  // Statistics for selected date
  const stats = useMemo(() => {
    let present = 0;
    let absent = 0;
    let halfDay = 0;
    let leave = 0;
    let holiday = 0;
    let restDay = 0;

    visibleEmployees.forEach((emp) => {
      const rec = recordsMap.get(emp.id);
      if (rec) {
        if (rec.status === 'present') present++;
        else if (rec.status === 'absent') absent++;
        else if (rec.status === 'half_day') halfDay++;
        else if (rec.status === 'paid_leave' || rec.status === 'unpaid_leave') leave++;
        else if (rec.status === 'holiday') holiday++;
        else if (rec.status === 'rest_day') restDay++;
      }
    });

    const recordedCount = present + absent + halfDay + leave + holiday + restDay;
    const notRecorded = Math.max(0, visibleEmployees.length - recordedCount);

    return {
      present,
      absent,
      halfDay,
      leave,
      holiday,
      restDay,
      recordedCount,
      notRecorded,
    };
  }, [visibleEmployees, recordsMap]);

  // Handle Mark All Visible as Present
  const handleMarkAllPresent = () => {
    const recordsToSave = visibleEmployees.map((emp) => ({
      employeeId: emp.id,
      date: selectedDate,
      status: bulkStatus,
      checkIn: bulkCheckIn,
      checkOut: bulkCheckOut,
      actualHours: 8,
      latenessMinutes: 0,
      earlyDepartureMinutes: 0,
      overtimeHours: 0,
      notes: language === 'km' ? 'កត់ត្រាវត្តមានរួម' : 'Bulk attendance entry',
    }));

    bulkRecordAttendance(recordsToSave);
  };

  // Open modal for specific employee
  const handleOpenEdit = (empId: string) => {
    const existing = recordsMap.get(empId);
    setModalEmployeeId(empId);
    if (existing) {
      setModalStatus(existing.status);
      setModalCheckIn(existing.checkIn || '07:00');
      setModalCheckOut(existing.checkOut || '17:00');
      setModalHours(existing.actualHours);
      setModalLateness(existing.latenessMinutes);
      setModalOvertime(existing.overtimeHours);
      setModalNotes(existing.notes || '');
    } else {
      setModalStatus('present');
      setModalCheckIn('07:00');
      setModalCheckOut('17:00');
      setModalHours(8);
      setModalLateness(0);
      setModalOvertime(0);
      setModalNotes('');
    }
    setIsModalOpen(true);
  };

  const handleModalSave = (e: React.FormEvent) => {
    e.preventDefault();
    recordAttendance({
      employeeId: modalEmployeeId,
      date: selectedDate,
      status: modalStatus,
      checkIn: modalCheckIn,
      checkOut: modalCheckOut,
      actualHours: Number(modalHours),
      latenessMinutes: Number(modalLateness),
      earlyDepartureMinutes: 0,
      overtimeHours: Number(modalOvertime),
      notes: modalNotes,
    });
    setIsModalOpen(false);
  };

  const handleExport = () => {
    const exportData = visibleEmployees.map((emp) => {
      const rec = recordsMap.get(emp.id);
      return {
        'Date': selectedDate,
        'Employee ID': emp.id,
        'Khmer Name': emp.nameKhmer,
        'English Name': emp.nameEnglish,
        'Department': emp.department,
        'Status': rec ? rec.status : 'Not Recorded',
        'Check-In': rec?.checkIn || '',
        'Check-Out': rec?.checkOut || '',
        'Actual Hours': rec?.actualHours || 0,
        'Lateness (Mins)': rec?.latenessMinutes || 0,
        'Overtime (Hours)': rec?.overtimeHours || 0,
        'Notes': rec?.notes || '',
      };
    });

    exportToExcel(
      [{ sheetName: 'Attendance', data: exportData }],
      `Attendance_${selectedDate}`
    );
  };

  const getStatusBadge = (status?: AttendanceStatus) => {
    if (!status) {
      return (
        <span className="text-slate-400 font-normal italic">
          {language === 'km' ? 'មិនទាន់កត់ត្រា' : 'Pending entry'}
        </span>
      );
    }
    switch (status) {
      case 'present':
        return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">{t.present}</span>;
      case 'absent':
        return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">{t.absent}</span>;
      case 'half_day':
        return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">{t.halfDay}</span>;
      case 'paid_leave':
        return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">{t.paidLeave}</span>;
      case 'unpaid_leave':
        return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">{t.unpaidLeave}</span>;
      case 'holiday':
        return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-teal-100 text-teal-800">{t.holiday}</span>;
      case 'rest_day':
        return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">{t.restDay}</span>;
    }
  };

  return (
    <div className="space-y-5">
      {/* Critical Rule Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 flex items-start gap-3 shadow-xs">
        <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <p className="font-bold text-amber-950 mb-0.5">
            {language === 'km' ? 'គោលការណ៍កាត់ប្រាក់ខែសំខាន់' : 'Critical Payroll & Attendance Rule'}
          </p>
          <p>{t.attendanceRuleNotice}</p>
        </div>
      </div>

      {/* Date & Bulk Controls Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Date Selector */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-600" />
            <label className="text-xs font-bold text-slate-800">{t.date}:</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-mono font-semibold text-slate-800"
            />
          </div>
          <button
            onClick={() => setSelectedDate(todayStr)}
            className="px-2.5 py-1 text-xs text-indigo-600 hover:bg-indigo-50 font-medium rounded-md border border-indigo-200 cursor-pointer"
          >
            {language === 'km' ? 'ថ្ងៃនេះ' : 'Today'}
          </button>
        </div>

        {/* Bulk Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleMarkAllPresent}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <CheckSquare className="w-4 h-4" />
            <span>{t.bulkMarkPresent} ({visibleEmployees.length})</span>
          </button>
          <button
            onClick={handleExport}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-slate-200 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>{t.exportExcel}</span>
          </button>
        </div>
      </div>

      {/* Metrics for Date */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
          <span className="text-[11px] text-slate-500">{t.present}</span>
          <div className="text-xl font-bold text-emerald-600">{stats.present}</div>
        </div>
        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
          <span className="text-[11px] text-slate-500">{t.absent}</span>
          <div className="text-xl font-bold text-rose-600">{stats.absent}</div>
        </div>
        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
          <span className="text-[11px] text-slate-500">{t.halfDay}</span>
          <div className="text-xl font-bold text-amber-600">{stats.halfDay}</div>
        </div>
        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
          <span className="text-[11px] text-slate-500">{t.paidLeave}</span>
          <div className="text-xl font-bold text-blue-600">{stats.leave}</div>
        </div>
        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
          <span className="text-[11px] text-slate-500">{t.holiday}</span>
          <div className="text-xl font-bold text-teal-600">{stats.holiday}</div>
        </div>
        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
          <span className="text-[11px] text-slate-500">{language === 'km' ? 'មិនទាន់កត់' : 'Pending'}</span>
          <div className="text-xl font-bold text-slate-400">{stats.notRecorded}</div>
        </div>
      </div>

      {/* Search and Department Filter */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t.search}
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
          />
        </div>
        <div>
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-700"
          >
            <option value="ALL">{t.all} {t.department}</option>
            {companySettings.departments.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Attendance Sheet Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">{t.employeeId}</th>
                <th className="py-3 px-4">{t.nameKhmer} / {t.nameEnglish}</th>
                <th className="py-3 px-4">{t.department}</th>
                <th className="py-3 px-4">{t.status}</th>
                <th className="py-3 px-4">{t.checkIn} - {t.checkOut}</th>
                <th className="py-3 px-4">{t.hoursWorked}</th>
                <th className="py-3 px-4">{t.lateness}</th>
                <th className="py-3 px-4">{t.overtime}</th>
                <th className="py-3 px-4">{t.notes}</th>
                <th className="py-3 px-4 text-right">{t.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {visibleEmployees.map((emp) => {
                const rec = recordsMap.get(emp.id);
                return (
                  <tr key={emp.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-indigo-700">
                      {emp.id}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{emp.nameKhmer}</div>
                      <div className="text-[11px] text-slate-500">{emp.nameEnglish}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {emp.department}
                    </td>
                    <td className="py-3 px-4">
                      {getStatusBadge(rec?.status)}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700">
                      {rec ? `${rec.checkIn || '--:--'} - ${rec.checkOut || '--:--'}` : '--:--'}
                    </td>
                    <td className="py-3 px-4 font-bold font-mono text-slate-800">
                      {rec ? `${rec.actualHours} h` : '-'}
                    </td>
                    <td className="py-3 px-4 font-mono">
                      {rec && rec.latenessMinutes > 0 ? (
                        <span className="text-amber-600 font-semibold">{rec.latenessMinutes} m</span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono">
                      {rec && rec.overtimeHours > 0 ? (
                        <span className="text-indigo-600 font-semibold">+{rec.overtimeHours} h</span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px] max-w-xs truncate">
                      {rec?.notes || '-'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleOpenEdit(emp.id)}
                        className="px-2.5 py-1 text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded-md transition-colors cursor-pointer"
                      >
                        {rec ? t.edit : t.markAttendance}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit / Record Attendance Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              {t.markAttendance}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              {modalEmployeeId} · {selectedDate}
            </p>

            <form onSubmit={handleModalSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t.status} *
                </label>
                <select
                  value={modalStatus}
                  onChange={(e) => setModalStatus(e.target.value as AttendanceStatus)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold"
                >
                  <option value="present">{t.present} (Present)</option>
                  <option value="absent">{t.absent} (Absent)</option>
                  <option value="half_day">{t.halfDay} (Half Day)</option>
                  <option value="paid_leave">{t.paidLeave} (Paid Leave)</option>
                  <option value="unpaid_leave">{t.unpaidLeave} (Unpaid Leave)</option>
                  <option value="holiday">{t.holiday} (Holiday)</option>
                  <option value="rest_day">{t.restDay} (Rest Day)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t.checkIn}
                  </label>
                  <input
                    type="time"
                    value={modalCheckIn}
                    onChange={(e) => setModalCheckIn(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t.checkOut}
                  </label>
                  <input
                    type="time"
                    value={modalCheckOut}
                    onChange={(e) => setModalCheckOut(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t.hoursWorked}
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min={0}
                    max={24}
                    value={modalHours}
                    onChange={(e) => setModalHours(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t.lateness}
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={modalLateness}
                    onChange={(e) => setModalLateness(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t.overtime}
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min={0}
                    value={modalOvertime}
                    onChange={(e) => setModalOvertime(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t.notes}
                </label>
                <input
                  type="text"
                  value={modalNotes}
                  onChange={(e) => setModalNotes(e.target.value)}
                  placeholder="មូលហេតុ ឬកំណត់ចំណាំ..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer"
                >
                  {t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

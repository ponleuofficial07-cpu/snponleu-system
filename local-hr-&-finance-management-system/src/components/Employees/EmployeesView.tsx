import React, { useState, useMemo } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Archive,
  Download,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  X
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { translations } from '../../locales/translations';
import { Employee, Currency, PaymentMethod, EmploymentStatus } from '../../types';
import { formatCurrency } from '../../utils/payrollCalculator';
import { exportToExcel } from '../../utils/exportUtils';

export const EmployeesView: React.FC = () => {
  const {
    language,
    employees,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    archiveEmployee,
    companySettings,
  } = useApp();
  const t = translations[language];

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [viewingEmployee, setViewingEmployee] = useState<Employee | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    id: '',
    nameKhmer: '',
    nameEnglish: '',
    gender: 'Male' as 'Male' | 'Female' | 'Other',
    dateOfBirth: '1995-01-01',
    phone: '',
    email: '',
    address: '',
    department: companySettings.departments[0] || 'Accounting',
    jobTitle: '',
    startDate: new Date().toISOString().slice(0, 10),
    status: 'active' as EmploymentStatus,
    basicSalary: 800,
    salaryCurrency: 'USD' as Currency,
    paymentMethod: 'ABA Bank' as PaymentMethod,
    paymentReference: '',
    notes: '',
    emergencyContact: '',
  });

  // Filtered list
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const matchSearch =
        emp.nameKhmer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.nameEnglish.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.jobTitle.toLowerCase().includes(searchTerm.toLowerCase());

      const matchDept = selectedDept === 'ALL' || emp.department === selectedDept;
      const matchStatus = selectedStatus === 'ALL' || emp.status === selectedStatus;

      return matchSearch && matchDept && matchStatus;
    });
  }, [employees, searchTerm, selectedDept, selectedStatus]);

  const handleOpenAdd = () => {
    const nextIdNum = employees.length + 1;
    const autoId = `EMP-${String(nextIdNum).padStart(3, '0')}`;
    setEditingEmployee(null);
    setFormData({
      id: autoId,
      nameKhmer: '',
      nameEnglish: '',
      gender: 'Male',
      dateOfBirth: '1995-01-01',
      phone: '',
      email: '',
      address: '',
      department: companySettings.departments[0] || 'Accounting',
      jobTitle: '',
      startDate: new Date().toISOString().slice(0, 10),
      status: 'active',
      basicSalary: 600,
      salaryCurrency: 'USD',
      paymentMethod: 'ABA Bank',
      paymentReference: '',
      notes: '',
      emergencyContact: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (emp: Employee) => {
    setEditingEmployee(emp);
    setFormData({
      id: emp.id,
      nameKhmer: emp.nameKhmer,
      nameEnglish: emp.nameEnglish,
      gender: emp.gender,
      dateOfBirth: emp.dateOfBirth,
      phone: emp.phone,
      email: emp.email || '',
      address: emp.address,
      department: emp.department,
      jobTitle: emp.jobTitle,
      startDate: emp.startDate,
      status: emp.status,
      basicSalary: emp.basicSalary,
      salaryCurrency: emp.salaryCurrency,
      paymentMethod: emp.paymentMethod,
      paymentReference: emp.paymentReference || '',
      notes: emp.notes || '',
      emergencyContact: emp.emergencyContact || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nameKhmer.trim() || !formData.nameEnglish.trim()) {
      alert(language === 'km' ? 'សូមបញ្ចូលឈ្មោះបុគ្គលិកទាំងជាភាសាខ្មែរ និងអង់គ្លេស' : 'Please enter employee name in both Khmer and English');
      return;
    }

    if (editingEmployee) {
      updateEmployee(editingEmployee.id, formData);
    } else {
      addEmployee(formData);
    }
    setIsModalOpen(false);
  };

  const handleExport = () => {
    const exportData = filteredEmployees.map((emp) => ({
      'Employee ID': emp.id,
      'Name Khmer': emp.nameKhmer,
      'Name English': emp.nameEnglish,
      'Gender': emp.gender,
      'Date of Birth': emp.dateOfBirth,
      'Phone': emp.phone,
      'Email': emp.email,
      'Department': emp.department,
      'Job Title': emp.jobTitle,
      'Start Date': emp.startDate,
      'Status': emp.status,
      'Basic Salary': emp.basicSalary,
      'Currency': emp.salaryCurrency,
      'Payment Method': emp.paymentMethod,
      'Payment Reference': emp.paymentReference,
    }));

    exportToExcel(
      [{ sheetName: 'Employees', data: exportData }],
      `Employees_Export_${new Date().toISOString().slice(0, 10)}`
    );
  };

  const getStatusBadge = (status: EmploymentStatus) => {
    switch (status) {
      case 'active':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200"><CheckCircle className="w-3 h-3" /> {t.active}</span>;
      case 'on_leave':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200"><Clock className="w-3 h-3" /> {t.onLeave}</span>;
      case 'resigned':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">{t.resigned}</span>;
      case 'terminated':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200"><XCircle className="w-3 h-3" /> {t.terminated}</span>;
      case 'archived':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-200 text-slate-600 border border-slate-300">{t.archived}</span>;
    }
  };

  return (
    <div className="space-y-5">
      {/* Action Header */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">{t.employeeList}</h2>
            <p className="text-xs text-slate-500">
              {filteredEmployees.length} {language === 'km' ? 'នាក់ត្រូវបានរកឃើញ' : 'employees found'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-200"
            title="Export to Excel"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">{t.exportExcel}</span>
          </button>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <UserPlus className="w-4 h-4" />
            <span>{t.addEmployee}</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t.search}
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        <div>
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-700"
          >
            <option value="ALL">{t.all} {t.department}</option>
            {companySettings.departments.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-700"
          >
            <option value="ALL">{t.all} {t.status}</option>
            <option value="active">{t.active}</option>
            <option value="on_leave">{t.onLeave}</option>
            <option value="resigned">{t.resigned}</option>
            <option value="terminated">{t.terminated}</option>
            <option value="archived">{t.archived}</option>
          </select>
        </div>
      </div>

      {/* Employee Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">{t.employeeId}</th>
                <th className="py-3 px-4">{t.nameKhmer} / {t.nameEnglish}</th>
                <th className="py-3 px-4">{t.department} / {t.jobTitle}</th>
                <th className="py-3 px-4">{t.phone}</th>
                <th className="py-3 px-4">{t.basicSalary}</th>
                <th className="py-3 px-4">{t.paymentMethod}</th>
                <th className="py-3 px-4">{t.status}</th>
                <th className="py-3 px-4 text-right">{t.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredEmployees.map((emp) => (
                <tr key={emp.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 font-mono font-medium text-indigo-700">
                    {emp.id}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900">{emp.nameKhmer}</div>
                    <div className="text-[11px] text-slate-500">{emp.nameEnglish} · {emp.gender}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-medium text-slate-800">{emp.jobTitle}</div>
                    <div className="text-[11px] text-slate-500">{emp.department}</div>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-600">
                    {emp.phone}
                  </td>
                  <td className="py-3 px-4 font-bold font-mono text-slate-900">
                    {formatCurrency(emp.basicSalary, emp.salaryCurrency)}
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-medium text-slate-800">{emp.paymentMethod}</span>
                    {emp.paymentReference && (
                      <div className="text-[10px] text-slate-500 truncate max-w-[140px]" title={emp.paymentReference}>
                        {emp.paymentReference}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {getStatusBadge(emp.status)}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setViewingEmployee(emp)}
                        className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                        title={t.view}
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(emp)}
                        className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors"
                        title={t.edit}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(language === 'km' ? `តើអ្នកប្រាកដជារក្សាទុកបុគ្គលិក ${emp.nameKhmer} ក្នុងប័ណ្ណសារមែនទេ? (ប្រវត្តិប្រាក់ខែ និងវត្តមាននៅតែរក្សាទុកដដែល)` : `Archive employee ${emp.nameEnglish}? Historical records are preserved.`)) {
                            archiveEmployee(emp.id);
                          }
                        }}
                        className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
                        title={t.archive}
                      >
                        <Archive className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredEmployees.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    {language === 'km' ? 'មិនមានទិន្នន័យបុគ្គលិក' : 'No employees matching your criteria'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Employee Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <h3 className="text-base font-bold text-slate-900">
                {editingEmployee ? t.editEmployee : t.addEmployee}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t.employeeId} *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.id}
                    disabled={!!editingEmployee}
                    onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t.nameKhmer} *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nameKhmer}
                    onChange={(e) => setFormData({ ...formData, nameKhmer: e.target.value })}
                    placeholder="ឧ. វ៉ាន់ សុភ័ក្ត្រ"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t.nameEnglish} *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nameEnglish}
                    onChange={(e) => setFormData({ ...formData, nameEnglish: e.target.value })}
                    placeholder="e.g. Vann Sopheak"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t.gender}
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="Male">{t.male}</option>
                    <option value="Female">{t.female}</option>
                    <option value="Other">{t.other}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t.dob}
                  </label>
                  <input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t.phone} *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="012 345 678"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t.department}
                  </label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                  >
                    {companySettings.departments.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t.jobTitle} *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.jobTitle}
                    onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                    placeholder="e.g. Accounting Manager"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              {/* Salary Section */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
                <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  <span>{t.basicSalary} ({language === 'km' ? 'ប្រាក់ខែគោលថេរប្រចាំខែ' : 'Fixed Monthly Model'})</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {t.currency}
                    </label>
                    <select
                      value={formData.salaryCurrency}
                      onChange={(e) => setFormData({ ...formData, salaryCurrency: e.target.value as Currency })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="KHR">KHR (៛)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {t.basicSalary} *
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      step={formData.salaryCurrency === 'USD' ? '0.01' : '1000'}
                      value={formData.basicSalary}
                      onChange={(e) => setFormData({ ...formData, basicSalary: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {t.paymentMethod}
                    </label>
                    <select
                      value={formData.paymentMethod}
                      onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as PaymentMethod })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
                    >
                      <option value="ABA Bank">ABA Bank</option>
                      <option value="ACLEDA">ACLEDA Bank</option>
                      <option value="Wing">Wing Bank / Money</option>
                      <option value="Cash">Cash (សាច់ប្រាក់សុទ្ធ)</option>
                      <option value="Bank Transfer">Bank Transfer (ផ្ទេរប្រាក់)</option>
                      <option value="Other">Other (ផ្សេងទៀត)</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t.paymentDetails} ({language === 'km' ? 'លេខគណនីធនាគារ ឬលេខ Wing' : 'Bank Account Number or Reference'})
                  </label>
                  <input
                    type="text"
                    value={formData.paymentReference}
                    onChange={(e) => setFormData({ ...formData, paymentReference: e.target.value })}
                    placeholder="e.g. ABA: 000 123 456 (Account Name)"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t.startDate}
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t.employeeStatus}
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as EmploymentStatus })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="active">{t.active}</option>
                    <option value="on_leave">{t.onLeave}</option>
                    <option value="resigned">{t.resigned}</option>
                    <option value="terminated">{t.terminated}</option>
                    <option value="archived">{t.archived}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t.address}
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="ផ្ទះលេខ... ផ្លូវ... រាជធានីភ្នំពេញ"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t.notes}
                </label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-xs"
                >
                  {t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Detail Modal */}
      {viewingEmployee && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div>
                <span className="text-xs font-mono text-indigo-600 font-semibold">{viewingEmployee.id}</span>
                <h3 className="text-base font-bold text-slate-900">
                  {viewingEmployee.nameKhmer} ({viewingEmployee.nameEnglish})
                </h3>
              </div>
              <button
                onClick={() => setViewingEmployee(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-400">{t.department}:</span>
                  <p className="font-semibold text-slate-800">{viewingEmployee.department}</p>
                </div>
                <div>
                  <span className="text-slate-400">{t.jobTitle}:</span>
                  <p className="font-semibold text-slate-800">{viewingEmployee.jobTitle}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-400">{t.basicSalary}:</span>
                  <p className="font-bold text-emerald-700 font-mono text-sm">
                    {formatCurrency(viewingEmployee.basicSalary, viewingEmployee.salaryCurrency)}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400">{t.paymentMethod}:</span>
                  <p className="font-semibold text-slate-800">{viewingEmployee.paymentMethod}</p>
                  <p className="text-[11px] text-slate-500 font-mono">{viewingEmployee.paymentReference || 'N/A'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-400">{t.phone}:</span>
                  <p className="font-mono text-slate-800">{viewingEmployee.phone}</p>
                </div>
                <div>
                  <span className="text-slate-400">{t.startDate}:</span>
                  <p className="text-slate-800">{viewingEmployee.startDate}</p>
                </div>
              </div>

              <div>
                <span className="text-slate-400">{t.address}:</span>
                <p className="text-slate-800">{viewingEmployee.address || 'N/A'}</p>
              </div>

              <div>
                <span className="text-slate-400">{t.notes}:</span>
                <p className="text-slate-800 bg-slate-50 p-2 rounded-lg border border-slate-100">{viewingEmployee.notes || 'N/A'}</p>
              </div>
            </div>

            <div className="flex justify-end pt-4 mt-4 border-t border-slate-200">
              <button
                onClick={() => setViewingEmployee(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
              >
                {t.close}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

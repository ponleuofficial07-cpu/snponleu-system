import React, { useState, useMemo } from 'react';
import {
  CircleDollarSign,
  Calendar,
  Lock,
  Unlock,
  CheckCircle,
  AlertTriangle,
  Edit,
  Save,
  RefreshCw,
  Plus,
  CreditCard,
  Download,
  FileText,
  AlertCircle,
  HelpCircle,
  Eye,
  X
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { translations } from '../../locales/translations';
import { PayrollRecord, PayrollStatus, PaymentMethod } from '../../types';
import { formatCurrency } from '../../utils/payrollCalculator';
import { exportToExcel } from '../../utils/exportUtils';
import { ActiveTab } from '../Navigation/Sidebar';

interface PayrollViewProps {
  onNavigateToPayslips: (employeeId?: string) => void;
}

export const PayrollView: React.FC<PayrollViewProps> = ({ onNavigateToPayslips }) => {
  const {
    language,
    currencyDisplay,
    companySettings,
    employees,
    payrollPeriods,
    currentPeriodId,
    setCurrentPeriodId,
    createPayrollPeriod,
    payrollRecords,
    updatePayrollRecord,
    recalculatePeriodPayroll,
    updatePayrollPeriodStatus,
    reopenPayrollPeriod,
    recordPayrollPayment
  } = useApp();
  const t = translations[language];

  // Current active period
  const currentPeriod = useMemo(
    () => payrollPeriods.find((p) => p.id === currentPeriodId) || payrollPeriods[0],
    [payrollPeriods, currentPeriodId]
  );

  // Records for current period
  const periodRecords = useMemo(
    () => (currentPeriod ? payrollRecords.filter((r) => r.periodId === currentPeriod.id) : []),
    [payrollRecords, currentPeriod]
  );

  // New Period Modal State
  const [isNewPeriodModalOpen, setIsNewPeriodModalOpen] = useState(false);
  const [targetYear, setTargetYear] = useState(new Date().getFullYear());
  const [targetMonth, setTargetMonth] = useState(new Date().getMonth() + 1);

  // Edit Record Modal State
  const [editingRecord, setEditingRecord] = useState<PayrollRecord | null>(null);
  const [editFormData, setEditFormData] = useState({
    bonuses: 0,
    allowances: 0,
    otherEarnings: 0,
    approvedOvertimePay: 0,
    manualAbsenceDeductions: 0,
    otherDeductions: 0,
    salaryAdvances: 0,
    loanRepayments: 0,
    adjustmentReason: '',
    notes: '',
  });

  // Reopen Confirmation Modal
  const [isReopenModalOpen, setIsReopenModalOpen] = useState(false);
  const [reopenReason, setReopenReason] = useState('');

  // Payment Recording Modal
  const [payingRecord, setPayingRecord] = useState<PayrollRecord | null>(null);
  const [paymentData, setPaymentData] = useState({
    method: 'ABA Bank' as PaymentMethod,
    ref: '',
    date: new Date().toISOString().slice(0, 10),
  });

  // Handle Create Period
  const handleCreatePeriodSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const periodId = createPayrollPeriod(Number(targetYear), Number(targetMonth));
    setIsNewPeriodModalOpen(false);
  };

  // Open Edit Modal
  const handleOpenEditRecord = (record: PayrollRecord) => {
    setEditingRecord(record);
    setEditFormData({
      bonuses: record.bonuses,
      allowances: record.allowances,
      otherEarnings: record.otherEarnings,
      approvedOvertimePay: record.approvedOvertimePay,
      manualAbsenceDeductions: record.manualAbsenceDeductions,
      otherDeductions: record.otherDeductions,
      salaryAdvances: record.salaryAdvances,
      loanRepayments: record.loanRepayments,
      adjustmentReason: record.adjustmentReason || '',
      notes: record.notes || '',
    });
  };

  // Save Record Adjustments
  const handleSaveRecordEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;
    updatePayrollRecord(editingRecord.id, editFormData);
    setEditingRecord(null);
  };

  // Open Payment Modal
  const handleOpenPayment = (record: PayrollRecord) => {
    const emp = employees.find((e) => e.id === record.employeeId);
    setPayingRecord(record);
    setPaymentData({
      method: emp?.paymentMethod || 'ABA Bank',
      ref: emp?.paymentReference || `TRX-${Date.now().toString().slice(-6)}`,
      date: new Date().toISOString().slice(0, 10),
    });
  };

  // Submit Payment
  const handleSubmitPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingRecord) return;
    recordPayrollPayment(payingRecord.id, paymentData);
    setPayingRecord(null);
  };

  // Export Period Payroll to Excel
  const handleExportPayroll = () => {
    if (!currentPeriod) return;
    const exportData = periodRecords.map((r) => {
      const emp = employees.find((e) => e.id === r.employeeId);
      return {
        'Period': currentPeriod.name,
        'Payslip Ref': r.payslipRef,
        'Employee ID': r.employeeId,
        'Khmer Name': emp?.nameKhmer || '',
        'English Name': emp?.nameEnglish || '',
        'Department': emp?.department || '',
        'Currency': r.currency,
        'Basic Salary': r.basicSalary,
        'Days Present': r.daysPresent,
        'Days Absent': r.daysAbsent,
        'Bonuses': r.bonuses,
        'Allowances': r.allowances,
        'Other Earnings': r.otherEarnings,
        'Approved OT Pay': r.approvedOvertimePay,
        'Gross Salary': r.grossSalary,
        'Manual Absence Deductions': r.manualAbsenceDeductions,
        'Other Deductions': r.otherDeductions,
        'Salary Advances': r.salaryAdvances,
        'Loan Repayments': r.loanRepayments,
        'Total Deductions': r.totalDeductions,
        'Net Salary Payable': r.netSalary,
        'Payment Status': r.paymentStatus,
        'Payment Date': r.paymentDate || '',
      };
    });

    exportToExcel(
      [{ sheetName: 'Payroll', data: exportData }],
      `Payroll_${currentPeriod.id}_${new Date().toISOString().slice(0, 10)}`
    );
  };

  const isPeriodLocked = currentPeriod?.status === 'approved' || currentPeriod?.status === 'paid';

  return (
    <div className="space-y-6">
      {/* 16th to 15th Cycle Rule Info Banner */}
      <div className="bg-indigo-900 text-white p-4 rounded-xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-1">
            <Calendar className="w-4 h-4" />
            <span>{t.payrollCycleExplanation}</span>
          </div>
          <h2 className="text-lg font-bold">
            {currentPeriod ? currentPeriod.name : 'No Period Selected'}
          </h2>
          <p className="text-xs text-indigo-200 mt-0.5">
            {currentPeriod ? `${currentPeriod.startDate} ➔ ${currentPeriod.endDate}` : ''}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Period Selector Dropdown */}
          <select
            value={currentPeriod?.id || ''}
            onChange={(e) => setCurrentPeriodId(e.target.value)}
            className="px-3 py-2 bg-indigo-800 text-white rounded-lg text-xs font-semibold border border-indigo-700 focus:outline-none cursor-pointer"
          >
            {payrollPeriods.map((p) => (
              <option key={p.id} value={p.id}>
                {p.id} - {p.name} ({p.status.toUpperCase()})
              </option>
            ))}
          </select>

          <button
            onClick={() => setIsNewPeriodModalOpen(true)}
            className="px-3 py-2 bg-white text-indigo-900 hover:bg-indigo-50 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t.createPayrollPeriod}</span>
          </button>
        </div>
      </div>

      {/* Workflow Action Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">{t.status}:</span>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                currentPeriod?.status === 'approved' || currentPeriod?.status === 'paid'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-amber-100 text-amber-800 border border-amber-300'
              }`}
            >
              {currentPeriod?.status}
            </span>
          </div>
          {isPeriodLocked && (
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-emerald-600" />
              <span>{language === 'km' ? 'វដ្តត្រូវបានចាក់សោសុវត្ថិភាព' : 'Period locked'}</span>
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!isPeriodLocked ? (
            <>
              <button
                onClick={() => currentPeriod && recalculatePeriodPayroll(currentPeriod.id)}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-slate-200 cursor-pointer"
                title="Recalculate attendance hours & basic salaries"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{t.calculatePayroll}</span>
              </button>
              <button
                onClick={() => {
                  if (confirm(language === 'km' ? 'តើអ្នកប្រាកដជាចង់អនុម័ត និងចាក់សោវដ្តប្រាក់ខែនេះមែនទេ? នៅពេលចាក់សោ ទិន្នន័យមិនអាចកែប្រែដោយចៃដន្យឡើយ។' : 'Approve and lock this payroll period? Records cannot be modified silently.')) {
                    updatePayrollPeriodStatus(currentPeriod.id, 'approved');
                  }
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>{t.approveAndLock}</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsReopenModalOpen(true)}
              className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-amber-200 cursor-pointer"
            >
              <Unlock className="w-3.5 h-3.5" />
              <span>{t.reopenPayroll}</span>
            </button>
          )}

          <button
            onClick={handleExportPayroll}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-slate-200 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t.exportExcel}</span>
          </button>

          <button
            onClick={() => onNavigateToPayslips()}
            className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{t.payslips}</span>
          </button>
        </div>
      </div>

      {/* Critical Rule Notice */}
      <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-amber-950 mb-0.5">
            {language === 'km' ? 'ច្បាប់គណនាប្រាក់ខែគោលថេរ (Fixed Monthly Salary Rule)' : 'Fixed Monthly Salary Rules'}
          </p>
          <p className="text-[11px] leading-relaxed">
            {t.absenceDeductionWarning}
            {' '}
            {language === 'km'
              ? 'ប្រព័ន្ធមិនកាត់ប្រាក់ខែដោយសារការយឺត ឬអវត្តមានដោយស្វ័យប្រវត្តិទេ និងមិនប្រើរូបមន្តចែក ២៦ ថ្ងៃឡើយ។'
              : 'System does not automatically deduct salary for lateness or apply an assumed 26-day divisor.'}
          </p>
        </div>
      </div>

      {/* Payroll Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <th className="py-3 px-3">{t.employeeId}</th>
                <th className="py-3 px-3">{t.nameKhmer}</th>
                <th className="py-3 px-3">{t.basicSalary}</th>
                <th className="py-3 px-3 text-center">{t.attendanceBreakdown}</th>
                <th className="py-3 px-3">{t.bonuses} & {t.overtimePay}</th>
                <th className="py-3 px-3 text-indigo-700">{t.grossSalary}</th>
                <th className="py-3 px-3 text-rose-700">{t.totalDeductions}</th>
                <th className="py-3 px-3 text-emerald-800 font-bold">{t.netSalary}</th>
                <th className="py-3 px-3">{t.status}</th>
                <th className="py-3 px-3 text-right">{t.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {periodRecords.map((r) => {
                const emp = employees.find((e) => e.id === r.employeeId);
                const hasDeductions = r.totalDeductions > 0;
                const isExceeding = r.totalDeductions > r.grossSalary;

                return (
                  <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3 font-mono font-medium text-indigo-700">
                      {r.employeeId}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-900">{emp?.nameKhmer || r.employeeId}</div>
                      <div className="text-[11px] text-slate-500">{emp?.nameEnglish} · {emp?.jobTitle}</div>
                    </td>
                    <td className="py-3 px-3 font-bold font-mono text-slate-800">
                      {formatCurrency(r.basicSalary, r.currency)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                        {r.daysPresent} {language === 'km' ? 'ថ្ងៃវត្តមាន' : 'days pres'}
                        {r.daysAbsent > 0 && <span className="text-rose-600 font-bold"> · {r.daysAbsent} {language === 'km' ? 'អវត្តមាន' : 'abs'}</span>}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono">
                      <div className="text-slate-700">
                        +{(r.bonuses + r.allowances + r.approvedOvertimePay + r.otherEarnings).toLocaleString()} {r.currency}
                      </div>
                      {(r.bonuses > 0 || r.approvedOvertimePay > 0) && (
                        <div className="text-[10px] text-slate-400">
                          {r.bonuses > 0 && `Bonus: ${r.bonuses} `}
                          {r.approvedOvertimePay > 0 && `OT: ${r.approvedOvertimePay}`}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3 font-bold font-mono text-indigo-700">
                      {formatCurrency(r.grossSalary, r.currency)}
                    </td>
                    <td className="py-3 px-3 font-mono">
                      <div className={isExceeding ? 'text-rose-600 font-bold flex items-center gap-1' : 'text-slate-700'}>
                        {isExceeding && <AlertTriangle className="w-3.5 h-3.5" />}
                        <span>-{formatCurrency(r.totalDeductions, r.currency)}</span>
                      </div>
                      {r.manualAbsenceDeductions > 0 && (
                        <div className="text-[10px] text-rose-500">
                          {language === 'km' ? 'កាត់អវត្តមាន៖' : 'Absence:'} {r.manualAbsenceDeductions}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3 font-bold font-mono text-emerald-700 text-sm">
                      {formatCurrency(r.netSalary, r.currency)}
                    </td>
                    <td className="py-3 px-3">
                      {r.paymentStatus === 'paid' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                          <CheckCircle className="w-3 h-3" />
                          {t.paid}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                          {t.unpaid}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {!isPeriodLocked && (
                          <button
                            onClick={() => handleOpenEditRecord(r)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                            title={t.edit}
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {r.paymentStatus === 'unpaid' && (
                          <button
                            onClick={() => handleOpenPayment(r)}
                            className="px-2 py-1 text-xs bg-emerald-600 hover:bg-emerald-500 text-white rounded font-medium shadow-xs transition-colors cursor-pointer"
                            title={t.recordPayment}
                          >
                            {language === 'km' ? 'បើកប្រាក់' : 'Pay'}
                          </button>
                        )}
                        <button
                          onClick={() => onNavigateToPayslips(r.employeeId)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                          title={t.payslips}
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create New Payroll Period Modal */}
      {isNewPeriodModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-2">{t.createPayrollPeriod}</h3>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              {t.payrollCycleExplanation}
            </p>

            <form onSubmit={handleCreatePeriodSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {language === 'km' ? 'ឆ្នាំ' : 'Year'}
                  </label>
                  <input
                    type="number"
                    min={2020}
                    max={2035}
                    value={targetYear}
                    onChange={(e) => setTargetYear(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {language === 'km' ? 'ខែគោលដៅ (Target Month)' : 'Target Month'}
                  </label>
                  <select
                    value={targetMonth}
                    onChange={(e) => setTargetMonth(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold"
                  >
                    {[
                      { m: 1, km: '១. មករា (Jan)', en: '1 - January' },
                      { m: 2, km: '២. កុម្ភៈ (Feb)', en: '2 - February' },
                      { m: 3, km: '៣. មីនា (Mar)', en: '3 - March' },
                      { m: 4, km: '៤. មេសា (Apr)', en: '4 - April' },
                      { m: 5, km: '៥. ឧសភា (May)', en: '5 - May' },
                      { m: 6, km: '៦. មិថុនា (Jun)', en: '6 - June' },
                      { m: 7, km: '៧. កក្កដា (Jul)', en: '7 - July' },
                      { m: 8, km: '៨. សីហា (Aug)', en: '8 - August' },
                      { m: 9, km: '៩. កញ្ញា (Sep)', en: '9 - September' },
                      { m: 10, km: '១០. តុលា (Oct)', en: '10 - October' },
                      { m: 11, km: '១១. វិច្ឆិកា (Nov)', en: '11 - November' },
                      { m: 12, km: '១២. ធ្នូ (Dec)', en: '12 - December' },
                    ].map((item) => (
                      <option key={item.m} value={item.m}>
                        {language === 'km' ? item.km : item.en}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg text-xs text-indigo-950">
                <span className="font-semibold">{language === 'km' ? 'កាលបរិច្ឆេទវដ្តដែលនឹងបង្កើត៖' : 'Period date range generated:'}</span>
                <p className="font-mono mt-1 font-bold">
                  {targetMonth === 1 ? targetYear - 1 : targetYear}-
                  {String(targetMonth === 1 ? 12 : targetMonth - 1).padStart(2, '0')}-16 ➔{' '}
                  {targetYear}-{String(targetMonth).padStart(2, '0')}-15
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsNewPeriodModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer"
                >
                  {t.confirm}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Payroll Adjustments Modal */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-xl w-full p-6 max-h-[90vh] overflow-y-auto border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div>
                <span className="text-xs font-mono text-indigo-600 font-bold">{editingRecord.payslipRef}</span>
                <h3 className="text-base font-bold text-slate-900">
                  {language === 'km' ? 'កែសម្រួលប្រាក់ខែបុគ្គលិក' : 'Adjust Payroll Record'}
                </h3>
              </div>
              <button
                onClick={() => setEditingRecord(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRecordEdit} className="space-y-4 text-xs">
              {/* Basic Salary Info */}
              <div className="p-3 bg-slate-50 rounded-lg flex items-center justify-between border border-slate-200">
                <div>
                  <span className="text-slate-500">{t.basicSalary}:</span>
                  <p className="font-bold text-slate-900 font-mono text-sm">
                    {formatCurrency(editingRecord.basicSalary, editingRecord.currency)}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-slate-500">{t.attendanceBreakdown}:</span>
                  <p className="text-slate-800">
                    {editingRecord.daysPresent} {language === 'km' ? 'ថ្ងៃវត្តមាន' : 'days present'} ·{' '}
                    {editingRecord.daysAbsent} {language === 'km' ? 'ថ្ងៃអវត្តមាន' : 'days absent'}
                  </p>
                </div>
              </div>

              {/* Additions / Earnings */}
              <div className="p-3 bg-emerald-50/50 rounded-lg border border-emerald-200/60 space-y-3">
                <span className="font-bold text-emerald-900 block">{t.earnings} (+)</span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">{t.bonuses}</label>
                    <input
                      type="number"
                      min={0}
                      value={editFormData.bonuses}
                      onChange={(e) => setEditFormData({ ...editFormData, bonuses: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-md font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">{t.allowances}</label>
                    <input
                      type="number"
                      min={0}
                      value={editFormData.allowances}
                      onChange={(e) => setEditFormData({ ...editFormData, allowances: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-md font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">{t.overtimePay}</label>
                    <input
                      type="number"
                      min={0}
                      value={editFormData.approvedOvertimePay}
                      onChange={(e) => setEditFormData({ ...editFormData, approvedOvertimePay: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-md font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">{t.otherEarnings}</label>
                    <input
                      type="number"
                      min={0}
                      value={editFormData.otherEarnings}
                      onChange={(e) => setEditFormData({ ...editFormData, otherEarnings: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-md font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Deductions (Manual Absence Deduction defaults to 0) */}
              <div className="p-3 bg-rose-50/50 rounded-lg border border-rose-200/60 space-y-3">
                <span className="font-bold text-rose-900 block">{t.deductions} (-)</span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-rose-800 mb-1">
                      {t.manualAbsenceDeductions} *
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={editFormData.manualAbsenceDeductions}
                      onChange={(e) => setEditFormData({ ...editFormData, manualAbsenceDeductions: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 bg-white border border-rose-200 rounded-md font-mono font-bold text-rose-700"
                    />
                    <span className="text-[10px] text-slate-500">
                      {language === 'km' ? 'កំណត់ដោយដៃផ្ទាល់' : 'Manually entered'}
                    </span>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">{t.otherDeductions}</label>
                    <input
                      type="number"
                      min={0}
                      value={editFormData.otherDeductions}
                      onChange={(e) => setEditFormData({ ...editFormData, otherDeductions: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-md font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">{t.salaryAdvances}</label>
                    <input
                      type="number"
                      min={0}
                      value={editFormData.salaryAdvances}
                      onChange={(e) => setEditFormData({ ...editFormData, salaryAdvances: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-md font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">{t.loanRepayments}</label>
                    <input
                      type="number"
                      min={0}
                      value={editFormData.loanRepayments}
                      onChange={(e) => setEditFormData({ ...editFormData, loanRepayments: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-md font-mono"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {language === 'km' ? 'មូលហេតុនៃការកែសម្រួល' : 'Reason for Adjustment'}
                </label>
                <input
                  type="text"
                  value={editFormData.adjustmentReason}
                  onChange={(e) => setEditFormData({ ...editFormData, adjustmentReason: e.target.value })}
                  placeholder="ឧ. បន្ថែមប្រាក់លើកទឹកចិត្ត ឬកាត់ប្រាក់ច្បាប់..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingRecord(null)}
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

      {/* Record Salary Payment Modal */}
      {payingRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1">{t.recordPayment}</h3>
            <p className="text-xs text-slate-500 mb-4">
              {payingRecord.payslipRef} · Net: {formatCurrency(payingRecord.netSalary, payingRecord.currency)}
            </p>

            <form onSubmit={handleSubmitPayment} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">{t.paymentMethod} *</label>
                <select
                  value={paymentData.method}
                  onChange={(e) => setPaymentData({ ...paymentData, method: e.target.value as PaymentMethod })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold"
                >
                  <option value="ABA Bank">ABA Bank</option>
                  <option value="ACLEDA">ACLEDA Bank</option>
                  <option value="Wing">Wing</option>
                  <option value="Cash">Cash (សាច់ប្រាក់សុទ្ធ)</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">{t.reference}</label>
                <input
                  type="text"
                  value={paymentData.ref}
                  onChange={(e) => setPaymentData({ ...paymentData, ref: e.target.value })}
                  placeholder="e.g. TRX-ABA-123456"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">{t.date} *</label>
                <input
                  type="date"
                  required
                  value={paymentData.date}
                  onChange={(e) => setPaymentData({ ...paymentData, date: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                />
              </div>

              <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-emerald-900">
                <p className="font-semibold">{language === 'km' ? 'ព័ត៌មានគណនេយ្យ៖' : 'Accounting Link:'}</p>
                <p className="text-[11px] mt-0.5">
                  {t.salaryExpenseLinked}
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setPayingRecord(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold shadow-xs cursor-pointer"
                >
                  {t.confirm}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reopen Finalized Period Modal */}
      {isReopenModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-slate-200">
            <div className="flex items-center gap-2 text-amber-600 mb-2">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="text-base font-bold text-slate-900">{t.reopenPayroll}</h3>
            </div>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              {language === 'km'
                ? 'ការដោះសោវដ្តប្រាក់ខែដែលបានអនុម័ត នឹងត្រូវកត់ត្រាចូលក្នុងកំណត់ហេតុសវនកម្ម (Audit Log)។ សូមបញ្ជាក់មូលហេតុច្បាស់លាស់។'
                : 'Reopening an approved payroll period requires an explicit reason and is tracked in audit logs.'}
            </p>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {language === 'km' ? 'មូលហេតុនៃការដោះសោ' : 'Reason for reopening'} *
                </label>
                <textarea
                  required
                  rows={3}
                  value={reopenReason}
                  onChange={(e) => setReopenReason(e.target.value)}
                  placeholder="បញ្ជាក់មូលហេតុ..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  onClick={() => setIsReopenModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  onClick={() => {
                    if (!reopenReason.trim()) {
                      alert('Please provide a reason');
                      return;
                    }
                    if (currentPeriod) {
                      reopenPayrollPeriod(currentPeriod.id, reopenReason);
                    }
                    setIsReopenModalOpen(false);
                    setReopenReason('');
                  }}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-semibold shadow-xs cursor-pointer"
                >
                  {t.confirm}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

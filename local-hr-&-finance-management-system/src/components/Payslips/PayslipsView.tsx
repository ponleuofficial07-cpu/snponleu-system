import React, { useState, useMemo, useRef } from 'react';
import {
  FileText,
  Printer,
  Download,
  Building2,
  Calendar,
  CheckCircle,
  User,
  Search,
  Filter,
  DollarSign
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { translations } from '../../locales/translations';
import { PayrollRecord, Employee } from '../../types';
import { formatCurrency } from '../../utils/payrollCalculator';
import jsPDF from 'jspdf';

interface PayslipsViewProps {
  initialEmployeeId?: string;
}

export const PayslipsView: React.FC<PayslipsViewProps> = ({ initialEmployeeId }) => {
  const {
    language,
    companySettings,
    employees,
    payrollPeriods,
    currentPeriodId,
    payrollRecords,
  } = useApp();
  const t = translations[language];

  const currentPeriod = useMemo(
    () => payrollPeriods.find((p) => p.id === currentPeriodId) || payrollPeriods[0],
    [payrollPeriods, currentPeriodId]
  );

  const periodRecords = useMemo(
    () => (currentPeriod ? payrollRecords.filter((r) => r.periodId === currentPeriod.id) : []),
    [payrollRecords, currentPeriod]
  );

  const [selectedRecordId, setSelectedRecordId] = useState<string>(() => {
    if (initialEmployeeId) {
      const found = periodRecords.find((r) => r.employeeId === initialEmployeeId);
      if (found) return found.id;
    }
    return periodRecords[0]?.id || '';
  });

  const selectedRecord = useMemo(
    () => periodRecords.find((r) => r.id === selectedRecordId) || periodRecords[0],
    [periodRecords, selectedRecordId]
  );

  const selectedEmployee = useMemo(
    () => employees.find((e) => e.id === selectedRecord?.employeeId),
    [employees, selectedRecord]
  );

  const payslipRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    if (!selectedRecord || !selectedEmployee || !currentPeriod) return;

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const primaryColor = [30, 41, 59]; // slate-800
    const accentColor = [79, 70, 229]; // indigo-600

    // Header
    doc.setFontSize(16);
    doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.text(companySettings.companyNameEnglish.toUpperCase(), 14, 20);

    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(companySettings.addressEnglish, 14, 26);
    doc.text(`Phone: ${companySettings.phone}  |  Email: ${companySettings.email}`, 14, 31);

    doc.setDrawColor(226, 232, 240);
    doc.line(14, 35, 196, 35);

    // Title & Ref
    doc.setFontSize(14);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('OFFICIAL SALARY PAYSLIP', 14, 44);

    doc.setFontSize(9);
    doc.text(`Reference No: ${selectedRecord.payslipRef}`, 140, 44);
    doc.text(`Period: ${currentPeriod.startDate} to ${currentPeriod.endDate}`, 140, 49);
    doc.text(`Status: ${selectedRecord.paymentStatus.toUpperCase()}`, 140, 54);

    // Employee Details Box
    doc.setFillColor(248, 250, 252);
    doc.rect(14, 58, 182, 24, 'F');
    doc.rect(14, 58, 182, 24, 'S');

    doc.setFontSize(9);
    doc.text(`Employee ID: ${selectedEmployee.id}`, 18, 65);
    doc.text(`Name (EN): ${selectedEmployee.nameEnglish}`, 18, 71);
    doc.text(`Name (KH): ${selectedEmployee.nameKhmer}`, 18, 77);

    doc.text(`Department: ${selectedEmployee.department}`, 105, 65);
    doc.text(`Position: ${selectedEmployee.jobTitle}`, 105, 71);
    doc.text(`Payment: ${selectedRecord.paymentMethod || selectedEmployee.paymentMethod}`, 105, 77);

    // Attendance Summary Bar
    doc.setFillColor(241, 245, 249);
    doc.rect(14, 86, 182, 10, 'F');
    doc.rect(14, 86, 182, 10, 'S');
    doc.text(
      `Attendance Summary: ${selectedRecord.daysPresent} Days Present  |  ${selectedRecord.daysAbsent} Days Absent  |  ${selectedRecord.totalWorkingHours} Hours  |  ${selectedRecord.overtimeHours} OT Hours`,
      18,
      92
    );

    // Earnings Table
    let y = 104;
    doc.setFontSize(10);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('EARNINGS & ALLOWANCES', 14, y);
    doc.text('DEDUCTIONS & ADJUSTMENTS', 105, y);

    y += 5;
    doc.setDrawColor(203, 213, 225);
    doc.line(14, y, 98, y);
    doc.line(105, y, 196, y);

    y += 6;
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);

    // Basic Salary
    doc.text('Monthly Basic Salary', 16, y);
    doc.text(`${selectedRecord.basicSalary.toLocaleString()} ${selectedRecord.currency}`, 75, y);

    // Absence Deduction
    doc.text('Manual Absence Deduction', 107, y);
    doc.text(`-${selectedRecord.manualAbsenceDeductions.toLocaleString()} ${selectedRecord.currency}`, 170, y);

    y += 6;
    // Bonuses
    doc.text('Performance Bonus', 16, y);
    doc.text(`${selectedRecord.bonuses.toLocaleString()} ${selectedRecord.currency}`, 75, y);

    // Other Deductions
    doc.text('Other Deductions', 107, y);
    doc.text(`-${selectedRecord.otherDeductions.toLocaleString()} ${selectedRecord.currency}`, 170, y);

    y += 6;
    // Overtime
    doc.text('Approved Overtime Pay', 16, y);
    doc.text(`${selectedRecord.approvedOvertimePay.toLocaleString()} ${selectedRecord.currency}`, 75, y);

    // Advances
    doc.text('Salary Advances', 107, y);
    doc.text(`-${selectedRecord.salaryAdvances.toLocaleString()} ${selectedRecord.currency}`, 170, y);

    y += 6;
    // Allowances
    doc.text('Allowances & Benefits', 16, y);
    doc.text(`${selectedRecord.allowances.toLocaleString()} ${selectedRecord.currency}`, 75, y);

    // Loans
    doc.text('Loan Repayments', 107, y);
    doc.text(`-${selectedRecord.loanRepayments.toLocaleString()} ${selectedRecord.currency}`, 170, y);

    // Totals Line
    y += 10;
    doc.setFillColor(238, 242, 255);
    doc.rect(14, y - 4, 182, 14, 'F');
    doc.rect(14, y - 4, 182, 14, 'S');

    doc.setFontSize(10);
    doc.setTextColor(30, 27, 75);
    doc.text(`Gross Salary: ${selectedRecord.grossSalary.toLocaleString()} ${selectedRecord.currency}`, 18, y + 4);
    doc.text(`Total Deductions: -${selectedRecord.totalDeductions.toLocaleString()} ${selectedRecord.currency}`, 80, y + 4);

    doc.setFontSize(11);
    doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.text(`NET PAY: ${selectedRecord.netSalary.toLocaleString()} ${selectedRecord.currency}`, 145, y + 4);

    // Signatures Area
    y += 40;
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);

    doc.line(20, y, 70, y);
    doc.text('Employee Signature', 25, y + 5);

    doc.line(140, y, 190, y);
    doc.text('Authorized Signature & Stamp', 142, y + 5);

    // Note Footer
    y += 25;
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(companySettings.payslipNoteEnglish, 14, y);

    doc.save(`Payslip_${selectedRecord.payslipRef}_${selectedEmployee.nameEnglish.replace(/\s+/g, '_')}.pdf`);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Controls (Hidden on Print) */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">{t.payslips}</h2>
            <p className="text-xs text-slate-500">
              {currentPeriod?.name || 'No period selected'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-slate-200 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>{t.print}</span>
          </button>
          <button
            onClick={handleDownloadPdf}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>{t.downloadPdf}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Employee Selector Sidebar (Hidden on Print) */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs space-y-3 no-print">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            {language === 'km' ? 'ជ្រើសរើសបុគ្គលិក' : 'Select Employee'}
          </h3>
          <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-1">
            {periodRecords.map((r) => {
              const emp = employees.find((e) => e.id === r.employeeId);
              const isSelected = r.id === selectedRecord?.id;
              return (
                <button
                  key={r.id}
                  onClick={() => setSelectedRecordId(r.id)}
                  className={`w-full text-left p-2.5 rounded-lg text-xs transition-all border ${
                    isSelected
                      ? 'bg-indigo-50 border-indigo-300 text-indigo-950 font-semibold shadow-xs'
                      : 'bg-white border-slate-100 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-indigo-600 text-[11px]">{emp?.id}</span>
                    <span className="text-[10px] text-slate-400">{r.payslipRef}</span>
                  </div>
                  <div className="text-slate-900 font-bold truncate mt-0.5">{emp?.nameKhmer}</div>
                  <div className="flex justify-between items-center text-[11px] text-slate-500 mt-0.5">
                    <span className="truncate">{emp?.nameEnglish}</span>
                    <span className="font-mono font-bold text-slate-800">
                      {formatCurrency(r.netSalary, r.currency)}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Printable Payslip Card Preview */}
        <div className="lg:col-span-3">
          {selectedRecord && selectedEmployee && currentPeriod ? (
            <div
              ref={payslipRef}
              className="bg-white rounded-xl border border-slate-200 shadow-md p-6 sm:p-8 space-y-6 print-page max-w-2xl mx-auto"
            >
              {/* Company Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between pb-5 border-b border-slate-200 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shrink-0">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h1 className="text-base font-bold text-slate-900 leading-tight">
                        {companySettings.companyNameKhmer}
                      </h1>
                      <h2 className="text-xs font-semibold text-slate-600">
                        {companySettings.companyNameEnglish}
                      </h2>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug pt-1">
                    {companySettings.addressKhmer}
                  </p>
                  <p className="text-[11px] text-slate-500 font-mono">
                    {companySettings.phone} · {companySettings.email}
                  </p>
                </div>

                <div className="text-left sm:text-right shrink-0">
                  <div className="inline-block px-3 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold text-xs rounded-md uppercase tracking-wider mb-1">
                    {t.payslipTitle}
                  </div>
                  <p className="text-[11px] font-mono text-slate-600">
                    {t.payslipRefNo}: <span className="font-bold text-slate-900">{selectedRecord.payslipRef}</span>
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {t.date}: {new Date().toISOString().slice(0, 10)}
                  </p>
                </div>
              </div>

              {/* Employee & Period Details Grid */}
              <div className="bg-slate-50/70 p-4 rounded-lg border border-slate-200/80 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1.5">
                  <div className="flex items-baseline gap-2">
                    <span className="text-slate-500 w-24 shrink-0">{t.nameKhmer}:</span>
                    <span className="font-bold text-slate-900">{selectedEmployee.nameKhmer}</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-slate-500 w-24 shrink-0">{t.nameEnglish}:</span>
                    <span className="font-semibold text-slate-800">{selectedEmployee.nameEnglish}</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-slate-500 w-24 shrink-0">{t.employeeId}:</span>
                    <span className="font-mono font-bold text-indigo-700">{selectedEmployee.id}</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-slate-500 w-24 shrink-0">{t.department}:</span>
                    <span className="text-slate-700">{selectedEmployee.department}</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-slate-500 w-24 shrink-0">{t.jobTitle}:</span>
                    <span className="text-slate-700">{selectedEmployee.jobTitle}</span>
                  </div>
                </div>

                <div className="space-y-1.5 sm:border-l sm:border-slate-200 sm:pl-4">
                  <div className="flex items-baseline gap-2">
                    <span className="text-slate-500 w-28 shrink-0">{t.periodCovered}:</span>
                    <span className="font-mono font-bold text-slate-900">
                      {currentPeriod.startDate} ~ {currentPeriod.endDate}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-slate-500 w-28 shrink-0">{t.paymentMethod}:</span>
                    <span className="font-semibold text-slate-800">
                      {selectedRecord.paymentMethod || selectedEmployee.paymentMethod}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-slate-500 w-28 shrink-0">{t.reference}:</span>
                    <span className="font-mono text-slate-600 truncate max-w-[150px]">
                      {selectedRecord.paymentReference || selectedEmployee.paymentReference || 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-slate-500 w-28 shrink-0">{t.paymentStatus}:</span>
                    <span
                      className={`font-bold uppercase ${
                        selectedRecord.paymentStatus === 'paid' ? 'text-emerald-700' : 'text-amber-700'
                      }`}
                    >
                      {selectedRecord.paymentStatus}
                    </span>
                  </div>
                </div>
              </div>

              {/* Attendance Context Bar */}
              <div className="p-2.5 bg-slate-100 rounded-lg border border-slate-200 text-xs flex flex-wrap items-center justify-between gap-2 text-slate-700">
                <span className="font-bold text-slate-800">{t.attendanceBreakdown}:</span>
                <span>{selectedRecord.daysPresent} {t.present}</span>
                <span aria-hidden="true">·</span>
                <span>{selectedRecord.daysAbsent} {t.absent}</span>
                <span aria-hidden="true">·</span>
                <span>{selectedRecord.daysLeave} {t.paidLeave}</span>
                <span aria-hidden="true">·</span>
                <span>{selectedRecord.totalWorkingHours} {language === 'km' ? 'ម៉ោងសរុប' : 'Hours'}</span>
                <span aria-hidden="true">·</span>
                <span className="text-indigo-700 font-semibold">{selectedRecord.overtimeHours} {t.overtime}</span>
              </div>

              {/* Earnings & Deductions Tables */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
                {/* Earnings Column */}
                <div className="space-y-2">
                  <div className="font-bold text-slate-900 pb-1 border-b border-slate-200 flex justify-between">
                    <span>{t.earnings}</span>
                    <span>{t.amount}</span>
                  </div>
                  <div className="flex justify-between text-slate-700 py-1">
                    <span>{t.basicSalary}</span>
                    <span className="font-mono font-medium">
                      {formatCurrency(selectedRecord.basicSalary, selectedRecord.currency)}
                    </span>
                  </div>
                  {selectedRecord.bonuses > 0 && (
                    <div className="flex justify-between text-slate-700 py-1">
                      <span>{t.bonuses}</span>
                      <span className="font-mono font-medium">
                        +{formatCurrency(selectedRecord.bonuses, selectedRecord.currency)}
                      </span>
                    </div>
                  )}
                  {selectedRecord.allowances > 0 && (
                    <div className="flex justify-between text-slate-700 py-1">
                      <span>{t.allowances}</span>
                      <span className="font-mono font-medium">
                        +{formatCurrency(selectedRecord.allowances, selectedRecord.currency)}
                      </span>
                    </div>
                  )}
                  {selectedRecord.approvedOvertimePay > 0 && (
                    <div className="flex justify-between text-slate-700 py-1">
                      <span>{t.overtimePay}</span>
                      <span className="font-mono font-medium">
                        +{formatCurrency(selectedRecord.approvedOvertimePay, selectedRecord.currency)}
                      </span>
                    </div>
                  )}
                  {selectedRecord.otherEarnings > 0 && (
                    <div className="flex justify-between text-slate-700 py-1">
                      <span>{t.otherEarnings}</span>
                      <span className="font-mono font-medium">
                        +{formatCurrency(selectedRecord.otherEarnings, selectedRecord.currency)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-slate-900 pt-2 border-t border-slate-200">
                    <span>{t.grossSalary}</span>
                    <span className="font-mono text-indigo-700">
                      {formatCurrency(selectedRecord.grossSalary, selectedRecord.currency)}
                    </span>
                  </div>
                </div>

                {/* Deductions Column */}
                <div className="space-y-2">
                  <div className="font-bold text-slate-900 pb-1 border-b border-slate-200 flex justify-between">
                    <span>{t.deductions}</span>
                    <span>{t.amount}</span>
                  </div>
                  <div className="flex justify-between text-slate-700 py-1">
                    <span>{t.manualAbsenceDeductions}</span>
                    <span className="font-mono font-medium text-rose-600">
                      -{formatCurrency(selectedRecord.manualAbsenceDeductions, selectedRecord.currency)}
                    </span>
                  </div>
                  {selectedRecord.otherDeductions > 0 && (
                    <div className="flex justify-between text-slate-700 py-1">
                      <span>{t.otherDeductions}</span>
                      <span className="font-mono font-medium text-rose-600">
                        -{formatCurrency(selectedRecord.otherDeductions, selectedRecord.currency)}
                      </span>
                    </div>
                  )}
                  {selectedRecord.salaryAdvances > 0 && (
                    <div className="flex justify-between text-slate-700 py-1">
                      <span>{t.salaryAdvances}</span>
                      <span className="font-mono font-medium text-rose-600">
                        -{formatCurrency(selectedRecord.salaryAdvances, selectedRecord.currency)}
                      </span>
                    </div>
                  )}
                  {selectedRecord.loanRepayments > 0 && (
                    <div className="flex justify-between text-slate-700 py-1">
                      <span>{t.loanRepayments}</span>
                      <span className="font-mono font-medium text-rose-600">
                        -{formatCurrency(selectedRecord.loanRepayments, selectedRecord.currency)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-slate-900 pt-2 border-t border-slate-200">
                    <span>{t.totalDeductions}</span>
                    <span className="font-mono text-rose-600">
                      -{formatCurrency(selectedRecord.totalDeductions, selectedRecord.currency)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Net Pay Highlight Box */}
              <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-indigo-950 uppercase tracking-wider block">
                    {t.netSalary}
                  </span>
                  <span className="text-[11px] text-indigo-800">
                    Gross ({formatCurrency(selectedRecord.grossSalary, selectedRecord.currency)}) - Deductions ({formatCurrency(selectedRecord.totalDeductions, selectedRecord.currency)})
                  </span>
                </div>
                <div className="text-xl sm:text-2xl font-bold font-mono text-indigo-700">
                  {formatCurrency(selectedRecord.netSalary, selectedRecord.currency)}
                </div>
              </div>

              {/* Signatures Field */}
              <div className="grid grid-cols-2 gap-8 pt-8 text-xs">
                <div className="text-center space-y-12">
                  <p className="font-semibold text-slate-700">{t.employeeSignature}</p>
                  <div className="border-t border-slate-300 pt-1 text-slate-400">
                    {selectedEmployee.nameKhmer}
                  </div>
                </div>
                <div className="text-center space-y-12">
                  <p className="font-semibold text-slate-700">{t.adminSignature}</p>
                  <div className="border-t border-slate-300 pt-1 text-slate-400">
                    {companySettings.signatoryName} ({companySettings.administratorTitle})
                  </div>
                </div>
              </div>

              {/* Footer Note */}
              <div className="text-[11px] text-slate-400 pt-4 border-t border-slate-100 text-center leading-relaxed">
                {language === 'km' ? companySettings.payslipNoteKhmer : companySettings.payslipNoteEnglish}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400">
              {language === 'km' ? 'សូមជ្រើសរើសបុគ្គលិកដើម្បីមើលប័ណ្ណបើកប្រាក់ខែ' : 'Select an employee to view payslip'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

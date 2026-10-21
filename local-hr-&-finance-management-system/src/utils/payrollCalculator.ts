import { Currency, PayrollPeriod, PayrollRecord, Employee, AttendanceRecord } from '../types';

/**
 * Generates the strict 16th-to-15th payroll period for a given target month and year.
 * Target Month: 1 (Jan) - 12 (Dec).
 * Formula: The 16th day of the previous calendar month through the 15th day of the current calendar month, inclusive.
 */
export function generatePayrollPeriodDates(targetYear: number, targetMonth: number): {
  startDate: string;
  endDate: string;
  nameKm: string;
  nameEn: string;
} {
  // Previous month calculation
  let prevYear = targetYear;
  let prevMonth = targetMonth - 1;
  if (prevMonth === 0) {
    prevMonth = 12;
    prevYear -= 1;
  }

  const prevMonthStr = String(prevMonth).padStart(2, '0');
  const targetMonthStr = String(targetMonth).padStart(2, '0');

  const startDate = `${prevYear}-${prevMonthStr}-16`;
  const endDate = `${targetYear}-${targetMonthStr}-15`;

  const monthNamesEn = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const monthNamesKm = [
    'មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា',
    'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ'
  ];

  const prevMonthNameEn = monthNamesEn[prevMonth - 1];
  const targetMonthNameEn = monthNamesEn[targetMonth - 1];
  const prevMonthNameKm = monthNamesKm[prevMonth - 1];
  const targetMonthNameKm = monthNamesKm[targetMonth - 1];

  const nameEn = `${targetMonthNameEn} ${targetYear} (16 ${prevMonthNameEn} - 15 ${targetMonthNameEn} ${targetYear})`;
  const nameKm = `ខែ ${targetMonthNameKm} ឆ្នាំ ${targetYear} (១៦ ${prevMonthNameKm} - ១៥ ${targetMonthNameKm} ${targetYear})`;

  return {
    startDate,
    endDate,
    nameKm,
    nameEn,
  };
}

/**
 * Calculates attendance summary for an employee within the period date range.
 * This is provided purely as contextual summary information for the administrator.
 * Critical Rule: Attendance does NOT automatically deduct salary.
 */
export function summarizeAttendanceForPeriod(
  employeeId: string,
  startDate: string,
  endDate: string,
  attendanceRecords: AttendanceRecord[]
) {
  const records = attendanceRecords.filter(
    (a) => a.employeeId === employeeId && a.date >= startDate && a.date <= endDate
  );

  let daysPresent = 0;
  let daysAbsent = 0;
  let daysHalfDay = 0;
  let daysLeave = 0;
  let daysHoliday = 0;
  let totalWorkingHours = 0;
  let overtimeHours = 0;

  for (const r of records) {
    if (r.status === 'present') daysPresent += 1;
    else if (r.status === 'absent') daysAbsent += 1;
    else if (r.status === 'half_day') {
      daysHalfDay += 1;
      daysPresent += 0.5;
    }
    else if (r.status === 'paid_leave' || r.status === 'unpaid_leave') daysLeave += 1;
    else if (r.status === 'holiday') daysHoliday += 1;

    totalWorkingHours += Number(r.actualHours || 0);
    overtimeHours += Number(r.overtimeHours || 0);
  }

  return {
    daysPresent,
    daysAbsent,
    daysHalfDay,
    daysLeave,
    daysHoliday,
    totalWorkingHours: Number(totalWorkingHours.toFixed(1)),
    overtimeHours: Number(overtimeHours.toFixed(1)),
    totalRecords: records.length,
  };
}

/**
 * Calculates payroll according to PRD Section 7 formulas:
 * Gross Salary = Basic Monthly Salary + Bonuses + Allowances + Other Earnings + Approved Overtime Payments
 * Total Deductions = Manual Absence Deduction + Other Deductions + Salary Advances + Loan Repayments
 * Net Salary = Gross Salary - Total Deductions
 */
export function calculatePayrollRecord(data: {
  basicSalary: number;
  bonuses: number;
  allowances: number;
  otherEarnings: number;
  approvedOvertimePay: number;
  manualAbsenceDeductions: number;
  otherDeductions: number;
  salaryAdvances: number;
  loanRepayments: number;
  currency: Currency;
}): {
  grossSalary: number;
  totalDeductions: number;
  netSalary: number;
  isDeductionExceeding: boolean;
} {
  const basicSalary = Number(data.basicSalary) || 0;
  const bonuses = Number(data.bonuses) || 0;
  const allowances = Number(data.allowances) || 0;
  const otherEarnings = Number(data.otherEarnings) || 0;
  const approvedOvertimePay = Number(data.approvedOvertimePay) || 0;

  const manualAbsenceDeductions = Number(data.manualAbsenceDeductions) || 0;
  const otherDeductions = Number(data.otherDeductions) || 0;
  const salaryAdvances = Number(data.salaryAdvances) || 0;
  const loanRepayments = Number(data.loanRepayments) || 0;

  const grossSalary = basicSalary + bonuses + allowances + otherEarnings + approvedOvertimePay;
  const totalDeductions = manualAbsenceDeductions + otherDeductions + salaryAdvances + loanRepayments;
  const netSalary = grossSalary - totalDeductions;

  const round = (val: number) => {
    if (data.currency === 'USD') {
      return Math.round(val * 100) / 100;
    }
    return Math.round(val);
  };

  const finalGross = round(grossSalary);
  const finalDeductions = round(totalDeductions);
  const finalNet = round(netSalary);

  return {
    grossSalary: finalGross,
    totalDeductions: finalDeductions,
    netSalary: finalNet,
    isDeductionExceeding: finalDeductions > finalGross,
  };
}

/**
 * Currency Formatter
 */
export function formatCurrency(amount: number, currency: Currency): string {
  if (currency === 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } else {
    return new Intl.NumberFormat('km-KH', {
      maximumFractionDigits: 0,
    }).format(amount) + ' ៛';
  }
}

/**
 * Converts between USD and KHR given an exchange rate
 */
export function convertCurrency(
  amount: number,
  from: Currency,
  to: Currency,
  rate: number // e.g. 4050
): number {
  if (from === to) return amount;
  if (from === 'USD' && to === 'KHR') {
    return Math.round(amount * rate);
  }
  if (from === 'KHR' && to === 'USD') {
    return Math.round((amount / rate) * 100) / 100;
  }
  return amount;
}

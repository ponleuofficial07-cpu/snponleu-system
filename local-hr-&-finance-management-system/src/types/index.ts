export type Currency = 'USD' | 'KHR';

export type Language = 'km' | 'en';

export type EmploymentStatus = 'active' | 'on_leave' | 'resigned' | 'terminated' | 'archived';

export type PaymentMethod = 'Bank Transfer' | 'Cash' | 'ABA Bank' | 'ACLEDA' | 'Wing' | 'Check' | 'Other';

export interface Employee {
  id: string; // e.g. EMP-001
  nameKhmer: string; // ឈ្មោះជាភាសាខ្មែរ
  nameEnglish: string; // Full Name in English
  gender: 'Male' | 'Female' | 'Other';
  dateOfBirth: string; // YYYY-MM-DD
  phone: string;
  email?: string;
  address: string;
  department: string;
  jobTitle: string;
  startDate: string; // YYYY-MM-DD
  status: EmploymentStatus;
  basicSalary: number; // Monthly basic salary
  salaryCurrency: Currency;
  paymentMethod: PaymentMethod;
  paymentReference?: string; // Account number or Wing phone
  photoUrl?: string;
  notes?: string;
  emergencyContact?: string;
  createdAt: string;
  updatedAt: string;
}

export type AttendanceStatus = 
  | 'present' 
  | 'absent' 
  | 'half_day' 
  | 'paid_leave' 
  | 'unpaid_leave' 
  | 'holiday' 
  | 'rest_day';

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  checkIn?: string; // HH:mm
  checkOut?: string; // HH:mm
  actualHours: number;
  latenessMinutes: number;
  earlyDepartureMinutes: number;
  overtimeHours: number;
  notes?: string;
}

export interface WorkScheduleConfig {
  workingDays: number[]; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday (Default: 1,2,3,4,5,6)
  morningStart: string; // "07:00"
  morningEnd: string; // "11:00"
  lunchStart: string; // "11:00"
  lunchEnd: string; // "13:00"
  afternoonStart: string; // "13:00"
  afternoonEnd: string; // "17:00"
  standardDailyHours: number; // 8
  overtimeMultiplier: number; // e.g. 1.5
}

export interface Holiday {
  id: string;
  nameKhmer: string;
  nameEnglish: string;
  date: string; // YYYY-MM-DD
  isRecurring: boolean;
}

export type PayrollStatus = 'draft' | 'calculated' | 'reviewed' | 'approved' | 'paid';

export interface PayrollPeriod {
  id: string; // e.g. PR-2026-10
  name: string; // e.g. "October 2026 (16 Sep - 15 Oct 2026)"
  startDate: string; // YYYY-MM-DD (16th of previous month)
  endDate: string; // YYYY-MM-DD (15th of current month)
  targetMonth: number; // 1-12
  targetYear: number;
  status: PayrollStatus;
  createdAt: string;
  finalizedAt?: string;
  approvedBy?: string;
  totalGrossUSD: number;
  totalNetUSD: number;
  totalGrossKHR: number;
  totalNetKHR: number;
}

export interface PayrollRecord {
  id: string;
  periodId: string;
  employeeId: string;
  currency: Currency;
  
  // Base
  basicSalary: number;
  
  // Attendance Summary (contextual info, does not auto-deduct)
  daysPresent: number;
  daysAbsent: number;
  daysHalfDay: number;
  daysLeave: number;
  daysHoliday: number;
  totalWorkingHours: number;
  overtimeHours: number;
  
  // Additions
  bonuses: number;
  allowances: number;
  otherEarnings: number;
  approvedOvertimePay: number;
  
  // Deductions (CRITICAL: Manual absence deduction, default 0)
  manualAbsenceDeductions: number;
  otherDeductions: number;
  salaryAdvances: number;
  loanRepayments: number;
  
  // Totals
  grossSalary: number;
  totalDeductions: number;
  netSalary: number;
  
  // Metadata & Audit
  adjustmentReason?: string;
  paymentStatus: 'unpaid' | 'paid';
  paymentDate?: string;
  paymentMethod?: PaymentMethod;
  paymentReference?: string;
  notes?: string;
  payslipRef: string; // e.g. PS-202610-001
}

export interface IncomeTransaction {
  id: string; // e.g. INC-2026-0001
  date: string; // YYYY-MM-DD
  category: string;
  description: string;
  amount: number;
  currency: Currency;
  paymentMethod: PaymentMethod;
  payer: string;
  reference?: string;
  notes?: string;
  receiptUrl?: string;
  createdAt: string;
}

export interface ExpenseTransaction {
  id: string; // e.g. EXP-2026-0001
  date: string; // YYYY-MM-DD
  category: string;
  description: string;
  amount: number;
  currency: Currency;
  paymentMethod: PaymentMethod;
  payee: string;
  reference?: string;
  status: 'paid' | 'unpaid';
  linkedPayrollRecordId?: string; // Links salary payment to avoid double accounting
  notes?: string;
  receiptUrl?: string;
  createdAt: string;
}

export interface CompanySettings {
  companyNameKhmer: string;
  companyNameEnglish: string;
  logoUrl?: string;
  addressKhmer: string;
  addressEnglish: string;
  phone: string;
  email: string;
  website?: string;
  taxId?: string;
  defaultLanguage: Language;
  defaultCurrency: Currency;
  exchangeRateUsdToKhr: number; // e.g. 4050 (1 USD = 4050 KHR)
  scheduleConfig: WorkScheduleConfig;
  incomeCategories: string[];
  expenseCategories: string[];
  departments: string[];
  administratorTitle: string;
  signatoryName: string;
  payslipNoteKhmer: string;
  payslipNoteEnglish: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  category: 'payroll' | 'employee' | 'attendance' | 'finance' | 'auth' | 'backup' | 'settings';
  description: string;
  adminUser: string;
}

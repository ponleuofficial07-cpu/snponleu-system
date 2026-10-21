import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Employee,
  AttendanceRecord,
  PayrollPeriod,
  PayrollRecord,
  IncomeTransaction,
  ExpenseTransaction,
  CompanySettings,
  Holiday,
  AuditLog,
  Language,
  Currency,
  PaymentMethod
} from '../types';
import { generatePayrollPeriodDates, summarizeAttendanceForPeriod, calculatePayrollRecord } from '../utils/payrollCalculator';

interface AppContextType {
  // App state
  language: Language;
  setLanguage: (lang: Language) => void;
  currencyDisplay: Currency;
  setCurrencyDisplay: (curr: Currency) => void;
  isAuthenticated: boolean;
  setIsAuthenticated: (auth: boolean) => void;
  adminUsername: string;
  login: (pinOrPass: string) => boolean;
  logout: () => void;
  changeAdminPassword: (oldP: string, newP: string) => boolean;

  // Data
  companySettings: CompanySettings;
  updateCompanySettings: (settings: Partial<CompanySettings>) => void;
  
  employees: Employee[];
  addEmployee: (employee: Omit<Employee, 'createdAt' | 'updatedAt'>) => void;
  updateEmployee: (id: string, updates: Partial<Employee>) => void;
  deleteEmployee: (id: string) => void;
  archiveEmployee: (id: string) => void;

  holidays: Holiday[];
  addHoliday: (holiday: Omit<Holiday, 'id'>) => void;
  deleteHoliday: (id: string) => void;

  attendance: AttendanceRecord[];
  recordAttendance: (record: Omit<AttendanceRecord, 'id'>) => void;
  bulkRecordAttendance: (records: Omit<AttendanceRecord, 'id'>[]) => void;
  deleteAttendance: (id: string) => void;

  payrollPeriods: PayrollPeriod[];
  currentPeriodId: string;
  setCurrentPeriodId: (id: string) => void;
  createPayrollPeriod: (targetYear: number, targetMonth: number) => string;
  updatePayrollPeriodStatus: (periodId: string, status: any) => void;
  reopenPayrollPeriod: (periodId: string, reason: string) => void;

  payrollRecords: PayrollRecord[];
  updatePayrollRecord: (id: string, updates: Partial<PayrollRecord>) => void;
  recalculatePeriodPayroll: (periodId: string) => void;
  recordPayrollPayment: (recordId: string, paymentData: { method: PaymentMethod; ref?: string; date: string }) => void;

  income: IncomeTransaction[];
  addIncome: (inc: Omit<IncomeTransaction, 'id' | 'createdAt'>) => void;
  updateIncome: (id: string, updates: Partial<IncomeTransaction>) => void;
  deleteIncome: (id: string) => void;

  expenses: ExpenseTransaction[];
  addExpense: (exp: Omit<ExpenseTransaction, 'id' | 'createdAt'>) => void;
  updateExpense: (id: string, updates: Partial<ExpenseTransaction>) => void;
  deleteExpense: (id: string) => void;

  auditLogs: AuditLog[];
  addAuditLog: (category: AuditLog['category'], action: string, description: string) => void;

  // Backup & Restore
  exportDatabaseJson: () => string;
  restoreDatabaseJson: (jsonString: string) => { success: boolean; message: string };
  resetToSampleData: () => void;
}

const STORAGE_KEY = 'local_hr_finance_system_db_v1';
const PASS_KEY = 'local_hr_finance_admin_pass';

const initialSettings: CompanySettings = {
  companyNameKhmer: 'ក្រុមហ៊ុន ខ្មែរ អេនធើប្រាយ ឯ.ក',
  companyNameEnglish: 'Khmer Enterprise Co., Ltd.',
  addressKhmer: 'អគារលេខ ៤៥ មហាវិថីព្រះមុនីវង្ស សង្កាត់វត្តភ្នំ ខណ្ឌដូនពេញ រាជធានីភ្នំពេញ',
  addressEnglish: 'No. 45, Preah Monivong Blvd, Sangkat Wat Phnom, Khan Daun Penh, Phnom Penh, Cambodia',
  phone: '+855 23 888 999 / +855 12 345 678',
  email: 'admin@khmerenterprise.com.kh',
  website: 'www.khmerenterprise.com.kh',
  taxId: 'K001-902031128',
  defaultLanguage: 'km',
  defaultCurrency: 'USD',
  exchangeRateUsdToKhr: 4050,
  scheduleConfig: {
    workingDays: [1, 2, 3, 4, 5, 6], // Mon - Sat
    morningStart: '07:00',
    morningEnd: '11:00',
    lunchStart: '11:00',
    lunchEnd: '13:00',
    afternoonStart: '13:00',
    afternoonEnd: '17:00',
    standardDailyHours: 8,
    overtimeMultiplier: 1.5,
  },
  incomeCategories: [
    'លក់ទំនិញ / Product Sales',
    'សេវាកម្មប្រឹក្សា / Consulting Services',
    'កម្រៃជើងសារ / Commissions',
    'ចំណូលអាជីវកម្មផ្សេងៗ / Other Business Income'
  ],
  expenseCategories: [
    'ប្រាក់បៀវត្សរ៍បុគ្គលិក / Staff Salaries',
    'ប្រាក់ថែមម៉ោង / Overtime Payments',
    'ថ្លៃជួលការិយាល័យ / Office Rent',
    'ទឹក ភ្លើង និងអ៊ីនធឺណិត / Utilities & Internet',
    'សម្ភារការិយាល័យ / Office Supplies',
    'ថ្លៃធ្វើដំណើរ / Transportation',
    'ជួសជុល & ថែទាំ / Maintenance',
    'ចំណាយផ្សេងៗ / Miscellaneous'
  ],
  departments: [
    'គណនេយ្យ & ហិរញ្ញវត្ថុ / Accounting & Finance',
    'បច្ចេកវិទ្យា & IT / Technology & IT',
    'ធនធានមនុស្ស / Human Resources',
    'ផ្នែកលក់ & ទីផ្សារ / Sales & Marketing',
    'រដ្ឋបាលទូទៅ / Administration'
  ],
  administratorTitle: 'អគ្គនាយកប្រតិបត្តិ / Managing Director',
  signatoryName: 'បណ្ឌិត ឡាយ សុវណ្ណារ៉ា',
  payslipNoteKhmer: 'សូមរក្សាទុកប័ណ្ណបើកប្រាក់ខែនេះជាឯកសារយោងផ្ទាល់ខ្លួន។ រាល់ចម្ងល់សូមទាក់ទងមកផ្នែកគណនេយ្យ។',
  payslipNoteEnglish: 'Please keep this payslip for your personal records. For any discrepancies, contact Accounting.'
};

const initialEmployees: Employee[] = [
  {
    id: 'EMP-001',
    nameKhmer: 'វ៉ាន់ សុភ័ក្ត្រ',
    nameEnglish: 'Vann Sopheak',
    gender: 'Male',
    dateOfBirth: '1990-05-14',
    phone: '012 345 678',
    email: 'sopheak.v@khmerenterprise.com',
    address: 'ផ្ទះលេខ ១២ ផ្លូវ ២០០ រាជធានីភ្នំពេញ',
    department: 'គណនេយ្យ & ហិរញ្ញវត្ថុ / Accounting & Finance',
    jobTitle: 'ប្រធានផ្នែកគណនេយ្យ (Accounting Manager)',
    startDate: '2022-01-15',
    status: 'active',
    basicSalary: 1200,
    salaryCurrency: 'USD',
    paymentMethod: 'ABA Bank',
    paymentReference: 'ABA: 000 123 456 (Vann Sopheak)',
    notes: 'បុគ្គលិកគំរូ ធ្វើការម៉ត់ចត់',
    createdAt: '2026-01-01T08:00:00Z',
    updatedAt: '2026-10-15T08:00:00Z'
  },
  {
    id: 'EMP-002',
    nameKhmer: 'ចាន់ សុផល',
    nameEnglish: 'Chan Sophal',
    gender: 'Male',
    dateOfBirth: '1993-08-20',
    phone: '010 888 999',
    email: 'sophal.c@khmerenterprise.com',
    address: 'សង្កាត់ទួលគោក ខណ្ឌទួលគោក ភ្នំពេញ',
    department: 'បច្ចេកវិទ្យា & IT / Technology & IT',
    jobTitle: 'វិស្វករប្រព័ន្ធជាន់ខ្ពស់ (Senior Systems Engineer)',
    startDate: '2022-06-01',
    status: 'active',
    basicSalary: 1400,
    salaryCurrency: 'USD',
    paymentMethod: 'ABA Bank',
    paymentReference: 'ABA: 001 987 654 (Chan Sophal)',
    notes: 'ជំនាញប្រព័ន្ធសុវត្ថិភាព និងបណ្តាញ',
    createdAt: '2026-01-01T08:00:00Z',
    updatedAt: '2026-10-15T08:00:00Z'
  },
  {
    id: 'EMP-003',
    nameKhmer: 'សុខ សុវណ្ណារី',
    nameEnglish: 'Sok Sovannary',
    gender: 'Female',
    dateOfBirth: '1995-11-03',
    phone: '098 777 666',
    email: 'sovannary.s@khmerenterprise.com',
    address: 'សង្កាត់បឹងកក់១ ខណ្ឌទួលគោក ភ្នំពេញ',
    department: 'ធនធានមនុស្ស / Human Resources',
    jobTitle: 'មន្ត្រីធនធានមនុស្ស (HR Officer)',
    startDate: '2023-03-10',
    status: 'active',
    basicSalary: 850,
    salaryCurrency: 'USD',
    paymentMethod: 'ACLEDA',
    paymentReference: 'ACLEDA: 1002-3498-5521 (Sok Sovannary)',
    notes: 'ទទួលបន្ទុកវត្តមាន និងឯកសាររដ្ឋបាល',
    createdAt: '2026-01-01T08:00:00Z',
    updatedAt: '2026-10-15T08:00:00Z'
  },
  {
    id: 'EMP-004',
    nameKhmer: 'ឃឹម ពិសិដ្ឋ',
    nameEnglish: 'Khim Piseth',
    gender: 'Male',
    dateOfBirth: '1996-02-18',
    phone: '077 222 333',
    email: 'piseth.k@khmerenterprise.com',
    address: 'សង្កាត់ច្បារអំពៅ ខណ្ឌច្បារអំពៅ ភ្នំពេញ',
    department: 'ផ្នែកលក់ & ទីផ្សារ / Sales & Marketing',
    jobTitle: 'អ្នកគ្រប់គ្រងផ្នែកលក់ (Sales Executive)',
    startDate: '2023-08-01',
    status: 'active',
    basicSalary: 650,
    salaryCurrency: 'USD',
    paymentMethod: 'Wing',
    paymentReference: 'Wing: 077 222 333 (Khim Piseth)',
    notes: 'មានប្រាក់លើកទឹកចិត្តតាមការលក់ (Incentive)',
    createdAt: '2026-01-01T08:00:00Z',
    updatedAt: '2026-10-15T08:00:00Z'
  },
  {
    id: 'EMP-005',
    nameKhmer: 'មាស គន្ធា',
    nameEnglish: 'Meas Kunthea',
    gender: 'Female',
    dateOfBirth: '1998-04-25',
    phone: '015 444 555',
    email: 'kunthea.m@khmerenterprise.com',
    address: 'សង្កាត់ទឹកថ្លា ខណ្ឌសែនសុខ ភ្នំពេញ',
    department: 'រដ្ឋបាលទូទៅ / Administration',
    jobTitle: 'ជំនួយការរដ្ឋបាល (Administrative Assistant)',
    startDate: '2024-02-01',
    status: 'active',
    basicSalary: 2400000, // 2.4M KHR (~$592)
    salaryCurrency: 'KHR',
    paymentMethod: 'Cash',
    paymentReference: 'បើកប្រាក់សុទ្ធផ្ទាល់ដៃ (Direct Cash)',
    notes: 'បើកប្រាក់បៀវត្សរ៍ជាប្រាក់រៀលខ្មែរ',
    createdAt: '2026-02-01T08:00:00Z',
    updatedAt: '2026-10-15T08:00:00Z'
  }
];

const initialHolidays: Holiday[] = [
  { id: 'HOL-1', nameKhmer: 'ពិធីបុណ្យចូលឆ្នាំថ្មីប្រពៃណីជាតិ (Khmer New Year)', nameEnglish: 'Khmer New Year', date: '2026-04-14', isRecurring: true },
  { id: 'HOL-2', nameKhmer: 'ព្រះរាជពិធីច្រត់ព្រះនង្គ័ល (Royal Ploughing Ceremony)', nameEnglish: 'Royal Ploughing Ceremony', date: '2026-05-04', isRecurring: true },
  { id: 'HOL-3', nameKhmer: 'ពិធីបុណ្យភ្ជុំបិណ្ឌ (Pchum Ben Day 1)', nameEnglish: 'Pchum Ben Festival', date: '2026-10-09', isRecurring: true },
  { id: 'HOL-4', nameKhmer: 'ពិធីបុណ្យភ្ជុំបិណ្ឌ (Pchum Ben Day 2)', nameEnglish: 'Pchum Ben Festival', date: '2026-10-10', isRecurring: true },
  { id: 'HOL-5', nameKhmer: 'ពិធីបុណ្យភ្ជុំបិណ្ឌ (Pchum Ben Day 3)', nameEnglish: 'Pchum Ben Festival', date: '2026-10-11', isRecurring: true },
  { id: 'HOL-6', nameKhmer: 'ទិវាបុណ្យឯករាជ្យជាតិ (Independence Day)', nameEnglish: 'Independence Day', date: '2026-11-09', isRecurring: true },
  { id: 'HOL-7', nameKhmer: 'ព្រះរាជពិធីបុណ្យអុំទូក (Water Festival)', nameEnglish: 'Water Festival', date: '2026-11-23', isRecurring: true }
];

export const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Localization & Currency preference
  const [language, setLanguage] = useState<Language>('km');
  const [currencyDisplay, setCurrencyDisplay] = useState<Currency>('USD');

  // Authentication
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true); // default true for seamless initial use
  const [adminUsername] = useState<string>('Administrator');

  // App domain states
  const [companySettings, setCompanySettings] = useState<CompanySettings>(initialSettings);
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  const [holidays, setHolidays] = useState<Holiday[]>(initialHolidays);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [payrollPeriods, setPayrollPeriods] = useState<PayrollPeriod[]>([]);
  const [currentPeriodId, setCurrentPeriodId] = useState<string>('');
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([]);
  const [income, setIncome] = useState<IncomeTransaction[]>([]);
  const [expenses, setExpenses] = useState<ExpenseTransaction[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Load from LocalStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.companySettings) setCompanySettings(parsed.companySettings);
        if (parsed.employees) setEmployees(parsed.employees);
        if (parsed.holidays) setHolidays(parsed.holidays);
        if (parsed.attendance) setAttendance(parsed.attendance);
        if (parsed.payrollPeriods) setPayrollPeriods(parsed.payrollPeriods);
        if (parsed.payrollRecords) setPayrollRecords(parsed.payrollRecords);
        if (parsed.income) setIncome(parsed.income);
        if (parsed.expenses) setExpenses(parsed.expenses);
        if (parsed.auditLogs) setAuditLogs(parsed.auditLogs);
        if (parsed.currentPeriodId) setCurrentPeriodId(parsed.currentPeriodId);
      } else {
        // Initialize default seed period (October 2026: 16 Sep to 15 Oct 2026)
        initializeDefaultState();
      }
    } catch (e) {
      console.error('Failed to load database from localStorage', e);
      initializeDefaultState();
    }
  }, []);

  // Save to LocalStorage whenever critical data changes
  useEffect(() => {
    try {
      const payload = {
        companySettings,
        employees,
        holidays,
        attendance,
        payrollPeriods,
        currentPeriodId,
        payrollRecords,
        income,
        expenses,
        auditLogs,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }
  }, [
    companySettings,
    employees,
    holidays,
    attendance,
    payrollPeriods,
    currentPeriodId,
    payrollRecords,
    income,
    expenses,
    auditLogs
  ]);

  const addAuditLog = (category: AuditLog['category'], action: string, description: string) => {
    const newLog: AuditLog = {
      id: 'LOG-' + Date.now(),
      timestamp: new Date().toISOString(),
      category,
      action,
      description,
      adminUser: adminUsername,
    };
    setAuditLogs((prev) => [newLog, ...prev.slice(0, 199)]); // keep recent 200 logs
  };

  const login = (pinOrPass: string) => {
    const saved = localStorage.getItem(PASS_KEY) || 'admin123';
    if (pinOrPass === saved || pinOrPass === '1234') {
      setIsAuthenticated(true);
      addAuditLog('auth', 'Login', 'អ្នកគ្រប់គ្រងបានចូលប្រព័ន្ធជោគជ័យ (Admin signed in)');
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    addAuditLog('auth', 'Logout', 'អ្នកគ្រប់គ្រងបានចាកចេញពីប្រព័ន្ធ (Admin logged out)');
  };

  const changeAdminPassword = (oldP: string, newP: string) => {
    const saved = localStorage.getItem(PASS_KEY) || 'admin123';
    if (oldP === saved || oldP === '1234') {
      localStorage.setItem(PASS_KEY, newP);
      addAuditLog('auth', 'Password Changed', 'បានផ្លាស់ប្តូរពាក្យសម្ងាត់អ្នកគ្រប់គ្រង (Admin password changed)');
      return true;
    }
    return false;
  };

  const updateCompanySettings = (settings: Partial<CompanySettings>) => {
    setCompanySettings((prev) => ({ ...prev, ...settings }));
    addAuditLog('settings', 'Update Settings', 'បានកែប្រែព័ត៌មានក្រុមហ៊ុន/ការកំណត់ (Updated company settings)');
  };

  const addEmployee = (empData: Omit<Employee, 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const newEmp: Employee = {
      ...empData,
      createdAt: now,
      updatedAt: now,
    };
    setEmployees((prev) => [...prev, newEmp]);
    addAuditLog('employee', 'Create Employee', `បានបន្ថែមបុគ្គលិកថ្មី ${newEmp.nameKhmer} (${newEmp.id})`);
  };

  const updateEmployee = (id: string, updates: Partial<Employee>) => {
    setEmployees((prev) =>
      prev.map((emp) =>
        emp.id === id ? { ...emp, ...updates, updatedAt: new Date().toISOString() } : emp
      )
    );
    addAuditLog('employee', 'Update Employee', `បានកែប្រែព័ត៌មានបុគ្គលិក ID ${id}`);
  };

  const deleteEmployee = (id: string) => {
    setEmployees((prev) => prev.filter((emp) => emp.id !== id));
    addAuditLog('employee', 'Delete Employee', `បានលុបបុគ្គលិក ID ${id}`);
  };

  const archiveEmployee = (id: string) => {
    setEmployees((prev) =>
      prev.map((emp) => (emp.id === id ? { ...emp, status: 'archived', updatedAt: new Date().toISOString() } : emp))
    );
    addAuditLog('employee', 'Archive Employee', `បានរក្សាទុកបុគ្គលិកក្នុងប័ណ្ណសារ ID ${id}`);
  };

  const addHoliday = (hol: Omit<Holiday, 'id'>) => {
    const newHol: Holiday = { ...hol, id: 'HOL-' + Date.now() };
    setHolidays((prev) => [...prev, newHol]);
    addAuditLog('attendance', 'Add Holiday', `បានបន្ថែមថ្ងៃបុណ្យ ${hol.nameKhmer}`);
  };

  const deleteHoliday = (id: string) => {
    setHolidays((prev) => prev.filter((h) => h.id !== id));
    addAuditLog('attendance', 'Delete Holiday', `បានលុបថ្ងៃបុណ្យ ID ${id}`);
  };

  const recordAttendance = (recordData: Omit<AttendanceRecord, 'id'>) => {
    setAttendance((prev) => {
      const existingIdx = prev.findIndex(
        (r) => r.employeeId === recordData.employeeId && r.date === recordData.date
      );
      if (existingIdx >= 0) {
        const copy = [...prev];
        copy[existingIdx] = { ...copy[existingIdx], ...recordData };
        return copy;
      }
      return [...prev, { ...recordData, id: 'ATT-' + Date.now() + Math.random().toString().slice(2, 6) }];
    });
    addAuditLog('attendance', 'Record Attendance', `កត់ត្រាវត្តមានបុគ្គលិក ${recordData.employeeId} នៅ ${recordData.date}`);
  };

  const bulkRecordAttendance = (recordsData: Omit<AttendanceRecord, 'id'>[]) => {
    setAttendance((prev) => {
      const copy = [...prev];
      for (const rec of recordsData) {
        const idx = copy.findIndex((r) => r.employeeId === rec.employeeId && r.date === rec.date);
        if (idx >= 0) {
          copy[idx] = { ...copy[idx], ...rec };
        } else {
          copy.push({ ...rec, id: 'ATT-' + Date.now() + Math.random().toString().slice(2, 6) });
        }
      }
      return copy;
    });
    addAuditLog('attendance', 'Bulk Attendance', `បានកត់ត្រាវត្តមានរួមចំនួន ${recordsData.length} នាក់`);
  };

  const deleteAttendance = (id: string) => {
    setAttendance((prev) => prev.filter((r) => r.id !== id));
    addAuditLog('attendance', 'Delete Attendance', `បានលុបទិន្នន័យវត្តមាន ID ${id}`);
  };

  // Create payroll period adhering strictly to 16th prev to 15th curr
  const createPayrollPeriod = (targetYear: number, targetMonth: number): string => {
    const periodDates = generatePayrollPeriodDates(targetYear, targetMonth);
    const periodId = `PR-${targetYear}-${String(targetMonth).padStart(2, '0')}`;

    // Prevent duplicates
    const exists = payrollPeriods.find((p) => p.id === periodId);
    if (exists) {
      setCurrentPeriodId(periodId);
      return periodId;
    }

    const newPeriod: PayrollPeriod = {
      id: periodId,
      name: periodDates.nameKm,
      startDate: periodDates.startDate,
      endDate: periodDates.endDate,
      targetMonth,
      targetYear,
      status: 'draft',
      createdAt: new Date().toISOString(),
      totalGrossUSD: 0,
      totalNetUSD: 0,
      totalGrossKHR: 0,
      totalNetKHR: 0,
    };

    // Generate initial records for active employees
    const newRecords: PayrollRecord[] = employees
      .filter((e) => e.status !== 'archived')
      .map((emp, index) => {
        const attSummary = summarizeAttendanceForPeriod(
          emp.id,
          periodDates.startDate,
          periodDates.endDate,
          attendance
        );

        // Calculate defaults (manual absence deductions default to 0 as required)
        const calc = calculatePayrollRecord({
          basicSalary: emp.basicSalary,
          bonuses: 0,
          allowances: 0,
          otherEarnings: 0,
          approvedOvertimePay: 0,
          manualAbsenceDeductions: 0, // default 0!
          otherDeductions: 0,
          salaryAdvances: 0,
          loanRepayments: 0,
          currency: emp.salaryCurrency,
        });

        return {
          id: `REC-${periodId}-${emp.id}`,
          periodId,
          employeeId: emp.id,
          currency: emp.salaryCurrency,
          basicSalary: emp.basicSalary,
          daysPresent: attSummary.daysPresent,
          daysAbsent: attSummary.daysAbsent,
          daysHalfDay: attSummary.daysHalfDay,
          daysLeave: attSummary.daysLeave,
          daysHoliday: attSummary.daysHoliday,
          totalWorkingHours: attSummary.totalWorkingHours,
          overtimeHours: attSummary.overtimeHours,
          bonuses: 0,
          allowances: 0,
          otherEarnings: 0,
          approvedOvertimePay: 0,
          manualAbsenceDeductions: 0,
          otherDeductions: 0,
          salaryAdvances: 0,
          loanRepayments: 0,
          grossSalary: calc.grossSalary,
          totalDeductions: calc.totalDeductions,
          netSalary: calc.netSalary,
          paymentStatus: 'unpaid',
          payslipRef: `PS-${targetYear}${String(targetMonth).padStart(2, '0')}-${String(index + 1).padStart(3, '0')}`,
        };
      });

    // Sum totals
    let grossUSD = 0;
    let netUSD = 0;
    let grossKHR = 0;
    let netKHR = 0;

    newRecords.forEach((r) => {
      if (r.currency === 'USD') {
        grossUSD += r.grossSalary;
        netUSD += r.netSalary;
      } else {
        grossKHR += r.grossSalary;
        netKHR += r.netSalary;
      }
    });

    newPeriod.totalGrossUSD = grossUSD;
    newPeriod.totalNetUSD = netUSD;
    newPeriod.totalGrossKHR = grossKHR;
    newPeriod.totalNetKHR = netKHR;

    setPayrollPeriods((prev) => [newPeriod, ...prev]);
    setPayrollRecords((prev) => [...prev, ...newRecords]);
    setCurrentPeriodId(periodId);

    addAuditLog('payroll', 'Create Payroll Period', `បានបង្កើតវដ្តបើកប្រាក់ខែថ្មី ${newPeriod.name} (${periodId})`);
    return periodId;
  };

  const updatePayrollRecord = (id: string, updates: Partial<PayrollRecord>) => {
    setPayrollRecords((prev) =>
      prev.map((rec) => {
        if (rec.id !== id) return rec;
        const merged = { ...rec, ...updates };
        const calc = calculatePayrollRecord({
          basicSalary: merged.basicSalary,
          bonuses: merged.bonuses,
          allowances: merged.allowances,
          otherEarnings: merged.otherEarnings,
          approvedOvertimePay: merged.approvedOvertimePay,
          manualAbsenceDeductions: merged.manualAbsenceDeductions,
          otherDeductions: merged.otherDeductions,
          salaryAdvances: merged.salaryAdvances,
          loanRepayments: merged.loanRepayments,
          currency: merged.currency,
        });

        return {
          ...merged,
          grossSalary: calc.grossSalary,
          totalDeductions: calc.totalDeductions,
          netSalary: calc.netSalary,
        };
      })
    );
  };

  const recalculatePeriodPayroll = (periodId: string) => {
    const period = payrollPeriods.find((p) => p.id === periodId);
    if (!period || period.status === 'approved') return;

    setPayrollRecords((prev) =>
      prev.map((rec) => {
        if (rec.periodId !== periodId) return rec;
        const emp = employees.find((e) => e.id === rec.employeeId);
        const attSummary = summarizeAttendanceForPeriod(
          rec.employeeId,
          period.startDate,
          period.endDate,
          attendance
        );

        const basic = emp ? emp.basicSalary : rec.basicSalary;
        const calc = calculatePayrollRecord({
          basicSalary: basic,
          bonuses: rec.bonuses,
          allowances: rec.allowances,
          otherEarnings: rec.otherEarnings,
          approvedOvertimePay: rec.approvedOvertimePay,
          manualAbsenceDeductions: rec.manualAbsenceDeductions,
          otherDeductions: rec.otherDeductions,
          salaryAdvances: rec.salaryAdvances,
          loanRepayments: rec.loanRepayments,
          currency: rec.currency,
        });

        return {
          ...rec,
          basicSalary: basic,
          daysPresent: attSummary.daysPresent,
          daysAbsent: attSummary.daysAbsent,
          daysHalfDay: attSummary.daysHalfDay,
          daysLeave: attSummary.daysLeave,
          daysHoliday: attSummary.daysHoliday,
          totalWorkingHours: attSummary.totalWorkingHours,
          overtimeHours: attSummary.overtimeHours,
          grossSalary: calc.grossSalary,
          totalDeductions: calc.totalDeductions,
          netSalary: calc.netSalary,
        };
      })
    );

    // Update period totals
    setTimeout(() => {
      setPayrollPeriods((prev) =>
        prev.map((p) => {
          if (p.id !== periodId) return p;
          const records = payrollRecords.filter((r) => r.periodId === periodId);
          let grossUSD = 0,
            netUSD = 0,
            grossKHR = 0,
            netKHR = 0;
          records.forEach((r) => {
            if (r.currency === 'USD') {
              grossUSD += r.grossSalary;
              netUSD += r.netSalary;
            } else {
              grossKHR += r.grossSalary;
              netKHR += r.netSalary;
            }
          });
          return {
            ...p,
            status: 'calculated',
            totalGrossUSD: grossUSD,
            totalNetUSD: netUSD,
            totalGrossKHR: grossKHR,
            totalNetKHR: netKHR,
          };
        })
      );
    }, 50);

    addAuditLog('payroll', 'Recalculate Payroll', `បានគណនាប្រាក់ខែឡើងវិញសម្រាប់វដ្ត ${periodId}`);
  };

  const updatePayrollPeriodStatus = (periodId: string, status: any) => {
    setPayrollPeriods((prev) =>
      prev.map((p) =>
        p.id === periodId
          ? {
              ...p,
              status,
              finalizedAt: status === 'approved' ? new Date().toISOString() : p.finalizedAt,
              approvedBy: status === 'approved' ? adminUsername : p.approvedBy,
            }
          : p
      )
    );
    addAuditLog('payroll', 'Update Period Status', `បានប្តូរស្ថានភាពវដ្ត ${periodId} ទៅជា ${status}`);
  };

  const reopenPayrollPeriod = (periodId: string, reason: string) => {
    setPayrollPeriods((prev) =>
      prev.map((p) => (p.id === periodId ? { ...p, status: 'reviewed' } : p))
    );
    addAuditLog('payroll', 'Reopen Payroll', `បានដោះសោវដ្ត ${periodId} ដោយសារ៖ "${reason}"`);
  };

  // Record payment for an individual payroll record & automatically link expense
  const recordPayrollPayment = (
    recordId: string,
    paymentData: { method: PaymentMethod; ref?: string; date: string }
  ) => {
    const record = payrollRecords.find((r) => r.id === recordId);
    if (!record) return;

    const emp = employees.find((e) => e.id === record.employeeId);
    const empName = emp ? `${emp.nameKhmer} (${emp.nameEnglish})` : record.employeeId;

    // Update payroll record status
    setPayrollRecords((prev) =>
      prev.map((r) =>
        r.id === recordId
          ? {
              ...r,
              paymentStatus: 'paid',
              paymentDate: paymentData.date,
              paymentMethod: paymentData.method,
              paymentReference: paymentData.ref,
            }
          : r
      )
    );

    // Create linked Expense transaction to prevent double counting
    const newExp: ExpenseTransaction = {
      id: 'EXP-SAL-' + Date.now().toString().slice(-6),
      date: paymentData.date,
      category: 'ប្រាក់បៀវត្សរ៍បុគ្គលិក / Staff Salaries',
      description: `បើកប្រាក់ខែជូន ${empName} សម្រាប់វដ្ត ${record.periodId} (ប័ណ្ណលេខ ${record.payslipRef})`,
      amount: record.netSalary,
      currency: record.currency,
      paymentMethod: paymentData.method,
      payee: empName,
      reference: paymentData.ref || record.payslipRef,
      status: 'paid',
      linkedPayrollRecordId: record.id,
      notes: `Net Salary: ${record.netSalary} ${record.currency}. Basic: ${record.basicSalary}, Deductions: ${record.totalDeductions}.`,
      createdAt: new Date().toISOString(),
    };

    setExpenses((prev) => [newExp, ...prev]);

    addAuditLog(
      'payroll',
      'Salary Paid',
      `បានបើកប្រាក់ខែចំនួន ${record.netSalary} ${record.currency} ជូន ${empName}`
    );
  };

  const addIncome = (incData: Omit<IncomeTransaction, 'id' | 'createdAt'>) => {
    const newInc: IncomeTransaction = {
      ...incData,
      id: 'INC-' + new Date().getFullYear() + '-' + String(income.length + 1).padStart(4, '0'),
      createdAt: new Date().toISOString(),
    };
    setIncome((prev) => [newInc, ...prev]);
    addAuditLog('finance', 'Add Income', `បានកត់ត្រាចំណូល ${newInc.amount} ${newInc.currency} ពី ${newInc.payer}`);
  };

  const updateIncome = (id: string, updates: Partial<IncomeTransaction>) => {
    setIncome((prev) => prev.map((inc) => (inc.id === id ? { ...inc, ...updates } : inc)));
    addAuditLog('finance', 'Update Income', `បានកែប្រែទិន្នន័យចំណូល ID ${id}`);
  };

  const deleteIncome = (id: string) => {
    setIncome((prev) => prev.filter((inc) => inc.id !== id));
    addAuditLog('finance', 'Delete Income', `បានលុបប្រតិបត្តិការចំណូល ID ${id}`);
  };

  const addExpense = (expData: Omit<ExpenseTransaction, 'id' | 'createdAt'>) => {
    const newExp: ExpenseTransaction = {
      ...expData,
      id: 'EXP-' + new Date().getFullYear() + '-' + String(expenses.length + 1).padStart(4, '0'),
      createdAt: new Date().toISOString(),
    };
    setExpenses((prev) => [newExp, ...prev]);
    addAuditLog('finance', 'Add Expense', `បានកត់ត្រាចំណាយ ${newExp.amount} ${newExp.currency} ទៅ ${newExp.payee}`);
  };

  const updateExpense = (id: string, updates: Partial<ExpenseTransaction>) => {
    setExpenses((prev) => prev.map((exp) => (exp.id === id ? { ...exp, ...updates } : exp)));
    addAuditLog('finance', 'Update Expense', `បានកែប្រែទិន្នន័យចំណាយ ID ${id}`);
  };

  const deleteExpense = (id: string) => {
    setExpenses((prev) => prev.filter((exp) => exp.id !== id));
    addAuditLog('finance', 'Delete Expense', `បានលុបប្រតិបត្តិការចំណាយ ID ${id}`);
  };

  // Full Database Export / Backup
  const exportDatabaseJson = (): string => {
    const backupData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      companySettings,
      employees,
      holidays,
      attendance,
      payrollPeriods,
      currentPeriodId,
      payrollRecords,
      income,
      expenses,
      auditLogs,
    };
    addAuditLog('backup', 'Export Database', 'បានទាញយកច្បាប់ចម្លងបម្រុងទុកមូលដ្ឋានទិន្នន័យ');
    return JSON.stringify(backupData, null, 2);
  };

  // Restore Database with automatic safety backup
  const restoreDatabaseJson = (jsonString: string): { success: boolean; message: string } => {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed.employees || !parsed.companySettings) {
        return { success: false, message: 'Invalid backup file format.' };
      }

      // Safety snapshot of current database
      localStorage.setItem(`${STORAGE_KEY}_safety_backup_${Date.now()}`, JSON.stringify({
        companySettings,
        employees,
        holidays,
        attendance,
        payrollPeriods,
        currentPeriodId,
        payrollRecords,
        income,
        expenses,
        auditLogs
      }));

      setCompanySettings(parsed.companySettings);
      setEmployees(parsed.employees);
      setHolidays(parsed.holidays || []);
      setAttendance(parsed.attendance || []);
      setPayrollPeriods(parsed.payrollPeriods || []);
      setCurrentPeriodId(parsed.currentPeriodId || (parsed.payrollPeriods?.[0]?.id || ''));
      setPayrollRecords(parsed.payrollRecords || []);
      setIncome(parsed.income || []);
      setExpenses(parsed.expenses || []);
      setAuditLogs(parsed.auditLogs || []);

      addAuditLog('backup', 'Restore Database', 'បានស្តារទិន្នន័យឡើងវិញពីឯកសារបម្រុងទុក (Restored database from backup file)');
      return { success: true, message: 'Database restored successfully with automatic safety backup created.' };
    } catch (e: any) {
      return { success: false, message: e.message || 'Failed to parse JSON file' };
    }
  };

  // Reset to rich sample data
  const resetToSampleData = () => {
    initializeDefaultState();
    addAuditLog('backup', 'Reset Demo', 'បានកំណត់ទិន្នន័យគំរូឡើងវិញ (Reset to demo data)');
  };

  function initializeDefaultState() {
    setCompanySettings(initialSettings);
    setEmployees(initialEmployees);
    setHolidays(initialHolidays);

    // Create attendance records for current period (Sep 16 to Oct 15 2026)
    const seedAttendance: AttendanceRecord[] = [];
    const dates = ['2026-09-16', '2026-09-17', '2026-09-18', '2026-09-19', '2026-09-21', '2026-09-22', '2026-09-23', '2026-09-24', '2026-09-25'];
    initialEmployees.forEach((emp) => {
      dates.forEach((d) => {
        seedAttendance.push({
          id: `ATT-${emp.id}-${d}`,
          employeeId: emp.id,
          date: d,
          status: 'present',
          checkIn: '07:05',
          checkOut: '17:02',
          actualHours: 8,
          latenessMinutes: 5,
          earlyDepartureMinutes: 0,
          overtimeHours: emp.id === 'EMP-002' ? 1.5 : 0,
        });
      });
    });
    setAttendance(seedAttendance);

    // Initial period
    const defaultPeriodDates = generatePayrollPeriodDates(2026, 10);
    const defaultPeriodId = 'PR-2026-10';
    const periodObj: PayrollPeriod = {
      id: defaultPeriodId,
      name: defaultPeriodDates.nameKm,
      startDate: defaultPeriodDates.startDate,
      endDate: defaultPeriodDates.endDate,
      targetMonth: 10,
      targetYear: 2026,
      status: 'reviewed',
      createdAt: '2026-10-15T10:00:00Z',
      totalGrossUSD: 4100,
      totalNetUSD: 4100,
      totalGrossKHR: 2400000,
      totalNetKHR: 2400000,
    };

    const initialRecs: PayrollRecord[] = initialEmployees.map((emp, i) => ({
      id: `REC-${defaultPeriodId}-${emp.id}`,
      periodId: defaultPeriodId,
      employeeId: emp.id,
      currency: emp.salaryCurrency,
      basicSalary: emp.basicSalary,
      daysPresent: 24,
      daysAbsent: 0,
      daysHalfDay: 0,
      daysLeave: 0,
      daysHoliday: 2,
      totalWorkingHours: 192,
      overtimeHours: emp.id === 'EMP-002' ? 10 : 0,
      bonuses: emp.id === 'EMP-004' ? 150 : 0,
      allowances: 0,
      otherEarnings: 0,
      approvedOvertimePay: emp.id === 'EMP-002' ? 120 : 0,
      manualAbsenceDeductions: 0, // default 0!
      otherDeductions: 0,
      salaryAdvances: 0,
      loanRepayments: 0,
      grossSalary: emp.basicSalary + (emp.id === 'EMP-004' ? 150 : emp.id === 'EMP-002' ? 120 : 0),
      totalDeductions: 0,
      netSalary: emp.basicSalary + (emp.id === 'EMP-004' ? 150 : emp.id === 'EMP-002' ? 120 : 0),
      paymentStatus: i === 0 ? 'paid' : 'unpaid',
      paymentDate: i === 0 ? '2026-10-16' : undefined,
      paymentMethod: i === 0 ? 'ABA Bank' : undefined,
      paymentReference: i === 0 ? 'TRX-ABA-883921' : undefined,
      payslipRef: `PS-202610-00${i + 1}`,
    }));

    setPayrollPeriods([periodObj]);
    setCurrentPeriodId(defaultPeriodId);
    setPayrollRecords(initialRecs);

    // Initial income transactions
    setIncome([
      {
        id: 'INC-2026-0001',
        date: '2026-10-05',
        category: 'លក់ទំនិញ / Product Sales',
        description: 'ការលក់ឧបករណ៍ការិយាល័យ និងគ្រឿងបន្លាស់កុំព្យូទ័រ',
        amount: 3450,
        currency: 'USD',
        paymentMethod: 'ABA Bank',
        payer: 'ក្រុមហ៊ុន មេគង្គ ត្រេឌីង',
        reference: 'INV-2026-1005',
        createdAt: '2026-10-05T09:00:00Z',
      },
      {
        id: 'INC-2026-0002',
        date: '2026-10-12',
        category: 'សេវាកម្មប្រឹក្សា / Consulting Services',
        description: 'កម្រៃសេវាប្រឹក្សាយោបល់គម្រោងប្រព័ន្ធ IT ប្រចាំត្រីមាស',
        amount: 4800,
        currency: 'USD',
        paymentMethod: 'Bank Transfer',
        payer: 'អតិថិជន ស៊ីធី គ្រុប (City Group)',
        reference: 'INV-2026-1012',
        createdAt: '2026-10-12T14:30:00Z',
      },
      {
        id: 'INC-2026-0003',
        date: '2026-10-18',
        category: 'ចំណូលអាជីវកម្មផ្សេងៗ / Other Business Income',
        description: 'ថ្លៃសេវាបណ្តុះបណ្តាលបុគ្គលិកខាងក្រៅ',
        amount: 1600000,
        currency: 'KHR',
        paymentMethod: 'Cash',
        payer: 'មជ្ឈមណ្ឌលសិក្សាភាសា',
        reference: 'REC-2026-042',
        createdAt: '2026-10-18T11:00:00Z',
      }
    ]);

    // Initial expense transactions
    setExpenses([
      {
        id: 'EXP-2026-0001',
        date: '2026-10-01',
        category: 'ថ្លៃជួលការិយាល័យ / Office Rent',
        description: 'ថ្លៃជួលទីតាំងការិយាល័យប្រចាំខែ តុលា ២០២៦',
        amount: 1500,
        currency: 'USD',
        paymentMethod: 'ABA Bank',
        payee: 'ម្ចាស់អគារ វឌ្ឍនៈ អចលនទ្រព្យ',
        reference: 'RENT-OCT-2026',
        status: 'paid',
        createdAt: '2026-10-01T08:00:00Z',
      },
      {
        id: 'EXP-2026-0002',
        date: '2026-10-08',
        category: 'ទឹក ភ្លើង និងអ៊ីនធឺណិត / Utilities & Internet',
        description: 'ថ្លៃអគ្គិសនី និងទឹកស្អាតរដ្ឋប្រចាំខែ',
        amount: 320,
        currency: 'USD',
        paymentMethod: 'Wing',
        payee: 'អគ្គិសនីកម្ពុជា & រដ្ឋាករទឹកស្វយ័តភ្នំពេញ',
        reference: 'EDC-PPWSA-202610',
        status: 'paid',
        createdAt: '2026-10-08T10:15:00Z',
      },
      {
        id: 'EXP-2026-0003',
        date: '2026-10-16',
        category: 'ប្រាក់បៀវត្សរ៍បុគ្គលិក / Staff Salaries',
        description: 'បើកប្រាក់ខែជូន វ៉ាន់ សុភ័ក្ត្រ (Vann Sopheak) សម្រាប់វដ្ត PR-2026-10 (ប័ណ្ណលេខ PS-202610-001)',
        amount: 1200,
        currency: 'USD',
        paymentMethod: 'ABA Bank',
        payee: 'វ៉ាន់ សុភ័ក្ត្រ (Vann Sopheak)',
        reference: 'TRX-ABA-883921',
        status: 'paid',
        linkedPayrollRecordId: `REC-${defaultPeriodId}-EMP-001`,
        notes: 'Net Salary: $1,200.00',
        createdAt: '2026-10-16T15:00:00Z',
      }
    ]);

    setAuditLogs([
      {
        id: 'LOG-001',
        timestamp: new Date().toISOString(),
        action: 'System Initialized',
        category: 'settings',
        description: 'ប្រព័ន្ធគ្រប់គ្រងធនធានមនុស្ស និងហិរញ្ញវត្ថុត្រូវបានចាប់ផ្តើមជោគជ័យ (System initialized with sample data)',
        adminUser: 'Administrator',
      }
    ]);
  }

  return (
    <AppContext.Provider
      value={{
        language,
        setLanguage,
        currencyDisplay,
        setCurrencyDisplay,
        isAuthenticated,
        setIsAuthenticated,
        adminUsername,
        login,
        logout,
        changeAdminPassword,
        companySettings,
        updateCompanySettings,
        employees,
        addEmployee,
        updateEmployee,
        deleteEmployee,
        archiveEmployee,
        holidays,
        addHoliday,
        deleteHoliday,
        attendance,
        recordAttendance,
        bulkRecordAttendance,
        deleteAttendance,
        payrollPeriods,
        currentPeriodId,
        setCurrentPeriodId,
        createPayrollPeriod,
        updatePayrollPeriodStatus,
        reopenPayrollPeriod,
        payrollRecords,
        updatePayrollRecord,
        recalculatePeriodPayroll,
        recordPayrollPayment,
        income,
        addIncome,
        updateIncome,
        deleteIncome,
        expenses,
        addExpense,
        updateExpense,
        deleteExpense,
        auditLogs,
        addAuditLog,
        exportDatabaseJson,
        restoreDatabaseJson,
        resetToSampleData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

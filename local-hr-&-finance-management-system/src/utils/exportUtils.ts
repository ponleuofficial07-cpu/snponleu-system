import * as XLSX from 'xlsx';
import { Employee, AttendanceRecord, PayrollRecord, IncomeTransaction, ExpenseTransaction } from '../types';

/**
 * Generic Excel exporter using sheetjs/xlsx
 */
export function exportToExcel(sheetsData: { sheetName: string; data: any[] }[], filename: string) {
  const wb = XLSX.utils.book_new();

  for (const sheet of sheetsData) {
    const ws = XLSX.utils.json_to_sheet(sheet.data);
    XLSX.utils.book_append_sheet(wb, ws, sheet.sheetName.substring(0, 31));
  }

  XLSX.writeFile(wb, `${filename}.xlsx`);
}

/**
 * Downloads a text file (JSON, SQL, Markdown, Shell script)
 */
export function downloadTextFile(content: string, filename: string, mimeType: string = 'text/plain') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Generates standard SQLite database DDL & DML script
 */
export function generateSqliteDump(state: {
  employees: Employee[];
  attendance: AttendanceRecord[];
  payrollRecords: PayrollRecord[];
  income: IncomeTransaction[];
  expenses: ExpenseTransaction[];
  companySettings: any;
}): string {
  let sql = `-- Local HR, Payroll & Finance Management System
-- SQLite Database Schema & Initial Data Dump
-- Generated: ${new Date().toISOString()}

PRAGMA foreign_keys = ON;

-- Company Settings Table
CREATE TABLE IF NOT EXISTS company_settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    company_name_km TEXT NOT NULL,
    company_name_en TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address_km TEXT,
    address_en TEXT,
    exchange_rate REAL DEFAULT 4050,
    default_currency TEXT DEFAULT 'USD'
);

-- Employees Table
CREATE TABLE IF NOT EXISTS employees (
    id TEXT PRIMARY KEY,
    name_km TEXT NOT NULL,
    name_en TEXT NOT NULL,
    gender TEXT,
    dob TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    department TEXT,
    job_title TEXT,
    start_date TEXT,
    status TEXT DEFAULT 'active',
    basic_salary REAL NOT NULL,
    salary_currency TEXT DEFAULT 'USD',
    payment_method TEXT,
    payment_ref TEXT,
    created_at TEXT
);

-- Attendance Records Table
CREATE TABLE IF NOT EXISTS attendance_records (
    id TEXT PRIMARY KEY,
    employee_id TEXT REFERENCES employees(id),
    date TEXT NOT NULL,
    status TEXT NOT NULL,
    check_in TEXT,
    check_out TEXT,
    actual_hours REAL DEFAULT 8,
    lateness_minutes INTEGER DEFAULT 0,
    overtime_hours REAL DEFAULT 0,
    notes TEXT,
    UNIQUE(employee_id, date)
);

-- Payroll Records Table
CREATE TABLE IF NOT EXISTS payroll_records (
    id TEXT PRIMARY KEY,
    period_id TEXT NOT NULL,
    employee_id TEXT REFERENCES employees(id),
    currency TEXT NOT NULL,
    basic_salary REAL NOT NULL,
    bonuses REAL DEFAULT 0,
    allowances REAL DEFAULT 0,
    approved_ot_pay REAL DEFAULT 0,
    manual_absence_deduction REAL DEFAULT 0,
    other_deductions REAL DEFAULT 0,
    salary_advances REAL DEFAULT 0,
    gross_salary REAL NOT NULL,
    total_deductions REAL NOT NULL,
    net_salary REAL NOT NULL,
    payment_status TEXT DEFAULT 'unpaid',
    payment_date TEXT,
    payslip_ref TEXT UNIQUE
);

-- Income Transactions Table
CREATE TABLE IF NOT EXISTS income_transactions (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    amount REAL NOT NULL,
    currency TEXT NOT NULL,
    payment_method TEXT,
    payer TEXT,
    reference TEXT,
    created_at TEXT
);

-- Expense Transactions Table
CREATE TABLE IF NOT EXISTS expense_transactions (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    amount REAL NOT NULL,
    currency TEXT NOT NULL,
    payment_method TEXT,
    payee TEXT,
    reference TEXT,
    status TEXT DEFAULT 'paid',
    linked_payroll_record_id TEXT REFERENCES payroll_records(id),
    created_at TEXT
);

-- INSERT SEED DATA
INSERT OR REPLACE INTO company_settings (id, company_name_km, company_name_en, phone, email, exchange_rate, default_currency)
VALUES (1, '${state.companySettings.companyNameKhmer || 'ក្រុមហ៊ុន ខ្មែរ អេនធើប្រាយ'}', '${state.companySettings.companyNameEnglish || 'Khmer Enterprise Co., Ltd.'}', '${state.companySettings.phone || '+855 23 888 999'}', '${state.companySettings.email || 'info@khmerenterprise.com'}', ${state.companySettings.exchangeRateUsdToKhr || 4050}, 'USD');

`;

  // Insert Employees
  for (const emp of state.employees) {
    sql += `INSERT OR REPLACE INTO employees (id, name_km, name_en, gender, dob, phone, email, address, department, job_title, start_date, status, basic_salary, salary_currency, payment_method, payment_ref, created_at) VALUES ('${emp.id}', '${emp.nameKhmer.replace(/'/g, "''")}', '${emp.nameEnglish.replace(/'/g, "''")}', '${emp.gender}', '${emp.dateOfBirth}', '${emp.phone}', '${emp.email || ''}', '${emp.address.replace(/'/g, "''")}', '${emp.department}', '${emp.jobTitle.replace(/'/g, "''")}', '${emp.startDate}', '${emp.status}', ${emp.basicSalary}, '${emp.salaryCurrency}', '${emp.paymentMethod}', '${emp.paymentReference || ''}', '${emp.createdAt}');\n`;
  }

  // Insert Income
  for (const inc of state.income) {
    sql += `INSERT OR REPLACE INTO income_transactions (id, date, category, description, amount, currency, payment_method, payer, reference, created_at) VALUES ('${inc.id}', '${inc.date}', '${inc.category}', '${inc.description.replace(/'/g, "''")}', ${inc.amount}, '${inc.currency}', '${inc.paymentMethod}', '${inc.payer.replace(/'/g, "''")}', '${inc.reference || ''}', '${inc.createdAt}');\n`;
  }

  // Insert Expenses
  for (const exp of state.expenses) {
    sql += `INSERT OR REPLACE INTO expense_transactions (id, date, category, description, amount, currency, payment_method, payee, reference, status, linked_payroll_record_id, created_at) VALUES ('${exp.id}', '${exp.date}', '${exp.category}', '${exp.description.replace(/'/g, "''")}', ${exp.amount}, '${exp.currency}', '${exp.paymentMethod}', '${exp.payee.replace(/'/g, "''")}', '${exp.reference || ''}', '${exp.status}', ${exp.linkedPayrollRecordId ? `'${exp.linkedPayrollRecordId}'` : 'NULL'}, '${exp.createdAt}');\n`;
  }

  return sql;
}

import React, { useMemo } from 'react';
import {
  Users,
  Clock,
  Calendar,
  Wallet,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { translations } from '../../locales/translations';
import { formatCurrency, convertCurrency } from '../../utils/payrollCalculator';
import { ActiveTab } from '../Navigation/Sidebar';

interface DashboardViewProps {
  onNavigate: (tab: ActiveTab) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const {
    language,
    currencyDisplay,
    companySettings,
    employees,
    attendance,
    payrollPeriods,
    currentPeriodId,
    payrollRecords,
    income,
    expenses,
  } = useApp();
  const t = translations[language];

  // Active employees count
  const activeEmployees = useMemo(
    () => employees.filter((e) => e.status === 'active'),
    [employees]
  );

  // Today's date string YYYY-MM-DD
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  // Today's attendance summary
  const todayAttendance = useMemo(() => {
    const todayRecords = attendance.filter((a) => a.date === todayStr);
    const present = todayRecords.filter((a) => a.status === 'present').length;
    const absent = todayRecords.filter((a) => a.status === 'absent').length;
    const leave = todayRecords.filter((a) => a.status === 'paid_leave' || a.status === 'unpaid_leave').length;
    const halfDay = todayRecords.filter((a) => a.status === 'half_day').length;

    return {
      totalRecorded: todayRecords.length,
      present,
      absent,
      leave,
      halfDay,
      pending: Math.max(0, activeEmployees.length - todayRecords.length),
    };
  }, [attendance, todayStr, activeEmployees]);

  // Current Payroll Period data
  const currentPeriod = useMemo(
    () => payrollPeriods.find((p) => p.id === currentPeriodId) || payrollPeriods[0],
    [payrollPeriods, currentPeriodId]
  );

  const currentRecords = useMemo(
    () => (currentPeriod ? payrollRecords.filter((r) => r.periodId === currentPeriod.id) : []),
    [payrollRecords, currentPeriod]
  );

  // Salary calculations for the current period normalized to selected currency
  const payrollStats = useMemo(() => {
    let totalBasic = 0;
    let totalGross = 0;
    let totalDeductions = 0;
    let totalNet = 0;
    let paidAmount = 0;
    let unpaidAmount = 0;

    currentRecords.forEach((r) => {
      // convert to display currency
      const basicConv = convertCurrency(r.basicSalary, r.currency, currencyDisplay, companySettings.exchangeRateUsdToKhr);
      const grossConv = convertCurrency(r.grossSalary, r.currency, currencyDisplay, companySettings.exchangeRateUsdToKhr);
      const dedConv = convertCurrency(r.totalDeductions, r.currency, currencyDisplay, companySettings.exchangeRateUsdToKhr);
      const netConv = convertCurrency(r.netSalary, r.currency, currencyDisplay, companySettings.exchangeRateUsdToKhr);

      totalBasic += basicConv;
      totalGross += grossConv;
      totalDeductions += dedConv;
      totalNet += netConv;

      if (r.paymentStatus === 'paid') {
        paidAmount += netConv;
      } else {
        unpaidAmount += netConv;
      }
    });

    return {
      totalBasic,
      totalGross,
      totalDeductions,
      totalNet,
      paidAmount,
      unpaidAmount,
    };
  }, [currentRecords, currencyDisplay, companySettings.exchangeRateUsdToKhr]);

  // Financial aggregates normalized to display currency
  const financialStats = useMemo(() => {
    let totalIncome = 0;
    let totalExpense = 0;
    let paidExpense = 0;

    income.forEach((inc) => {
      totalIncome += convertCurrency(inc.amount, inc.currency, currencyDisplay, companySettings.exchangeRateUsdToKhr);
    });

    expenses.forEach((exp) => {
      const expConv = convertCurrency(exp.amount, exp.currency, currencyDisplay, companySettings.exchangeRateUsdToKhr);
      totalExpense += expConv;
      if (exp.status === 'paid') {
        paidExpense += expConv;
      }
    });

    const netCashFlow = totalIncome - paidExpense; // Cash received - cash paid

    return {
      totalIncome,
      totalExpense,
      paidExpense,
      netCashFlow,
    };
  }, [income, expenses, currencyDisplay, companySettings.exchangeRateUsdToKhr]);

  return (
    <div className="space-y-6">
      {/* Top Banner with Current Period */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-xl p-5 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-1">
            <Calendar className="w-4 h-4" />
            <span>{t.currentPayrollPeriod}</span>
          </div>
          <h2 className="text-xl font-bold">
            {currentPeriod ? currentPeriod.name : 'N/A'}
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            {currentPeriod ? `${currentPeriod.startDate} ➔ ${currentPeriod.endDate}` : ''}
            {' · '}
            <span className="text-indigo-200">
              {language === 'km'
                ? 'វដ្តទី ១៦ ខែមុន ដល់ទី ១៥ ខែបច្ចុប្បន្ន'
                : '16th Previous Month - 15th Current Month'}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('payroll')}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <Wallet className="w-4 h-4" />
            <span>{t.payroll}</span>
          </button>
          <button
            onClick={() => onNavigate('attendance')}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-lg text-xs font-semibold transition-colors flex items-center gap-2 border border-slate-700 cursor-pointer"
          >
            <Clock className="w-4 h-4" />
            <span>{t.attendance}</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Employees */}
        <div
          onClick={() => onNavigate('employees')}
          className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs hover:border-indigo-300 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">{t.activeEmployees}</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">{activeEmployees.length}</div>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
            <span>{employees.length} {language === 'km' ? 'សរុបទាំងអស់' : 'total in database'}</span>
          </div>
        </div>

        {/* Daily Attendance Summary */}
        <div
          onClick={() => onNavigate('attendance')}
          className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs hover:border-emerald-300 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">{t.dailyAttendanceToday}</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-600">{todayAttendance.present}</span>
            <span className="text-xs text-slate-400">/ {activeEmployees.length} {language === 'km' ? 'វត្តមាន' : 'present'}</span>
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {todayAttendance.absent > 0 && <span className="text-rose-600 font-medium">{todayAttendance.absent} {t.absent} · </span>}
            {todayAttendance.leave > 0 && <span className="text-amber-600 font-medium">{todayAttendance.leave} {t.paidLeave}</span>}
            {todayAttendance.absent === 0 && todayAttendance.leave === 0 && (
              <span className="text-emerald-700 font-medium">{language === 'km' ? 'វត្តមានពេញលេញ' : 'Regular attendance'}</span>
            )}
          </div>
        </div>

        {/* Total Net Payroll */}
        <div
          onClick={() => onNavigate('payroll')}
          className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs hover:border-blue-300 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">{t.totalNetPayroll}</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-blue-700">
            {formatCurrency(payrollStats.totalNet, currencyDisplay)}
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
            <span className="text-emerald-600 font-medium">
              {formatCurrency(payrollStats.paidAmount, currencyDisplay)} {language === 'km' ? 'បានបើក' : 'paid'}
            </span>
            <span className="text-amber-600 font-medium">
              {formatCurrency(payrollStats.unpaidAmount, currencyDisplay)} {language === 'km' ? 'នៅសល់' : 'due'}
            </span>
          </div>
        </div>

        {/* Net Cash Flow */}
        <div
          onClick={() => onNavigate('reports')}
          className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs hover:border-violet-300 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">{t.netCashFlow}</span>
            <div className={`p-2 rounded-lg ${financialStats.netCashFlow >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
              {financialStats.netCashFlow >= 0 ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
            </div>
          </div>
          <div className={`text-2xl font-bold ${financialStats.netCashFlow >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
            {formatCurrency(financialStats.netCashFlow, currencyDisplay)}
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
            <span className="text-emerald-600 font-medium">+{formatCurrency(financialStats.totalIncome, currencyDisplay)}</span>
            <span className="text-rose-500 font-medium">-{formatCurrency(financialStats.paidExpense, currencyDisplay)}</span>
          </div>
        </div>
      </div>

      {/* Financial & Attendance Breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payroll Summary Breakdown */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900 text-sm">{t.monthlyOverview} - {t.payroll}</h3>
            <button
              onClick={() => onNavigate('payroll')}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
            >
              {t.details} ➔
            </button>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center py-1.5 border-b border-slate-100 text-xs">
              <span className="text-slate-600">{t.totalBasicSalaries}</span>
              <span className="font-semibold text-slate-900">
                {formatCurrency(payrollStats.totalBasic, currencyDisplay)}
              </span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-slate-100 text-xs">
              <span className="text-slate-600">{t.grossSalary}</span>
              <span className="font-semibold text-slate-900">
                {formatCurrency(payrollStats.totalGross, currencyDisplay)}
              </span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-slate-100 text-xs">
              <span className="text-slate-600">{t.totalDeductions}</span>
              <span className="font-semibold text-rose-600">
                -{formatCurrency(payrollStats.totalDeductions, currencyDisplay)}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 bg-indigo-50/70 px-3 rounded-lg text-sm">
              <span className="font-bold text-indigo-950">{t.netSalary}</span>
              <span className="font-bold text-indigo-700">
                {formatCurrency(payrollStats.totalNet, currencyDisplay)}
              </span>
            </div>
          </div>

          {/* Quick Notice on Deduction Rule */}
          <div className="mt-4 p-3 bg-amber-50/70 border border-amber-200/60 rounded-lg text-[11px] text-amber-800 flex items-start gap-2 leading-relaxed">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>{t.attendanceRuleNotice}</span>
          </div>
        </div>

        {/* Recent Financial Transactions */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900 text-sm">{t.recentTransactions}</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigate('income')}
                className="text-xs text-emerald-600 hover:text-emerald-800 font-medium"
              >
                +{t.income}
              </button>
              <span className="text-slate-300">·</span>
              <button
                onClick={() => onNavigate('expenses')}
                className="text-xs text-rose-600 hover:text-rose-800 font-medium"
              >
                -{t.expenses}
              </button>
            </div>
          </div>

          <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
            {income.slice(0, 3).map((inc) => (
              <div key={inc.id} className="py-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-md bg-emerald-50 text-emerald-600">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">{inc.description}</p>
                    <p className="text-[11px] text-slate-500">
                      {inc.payer} · {inc.category} · {inc.date}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-emerald-600 font-mono">
                    +{formatCurrency(inc.amount, inc.currency)}
                  </p>
                  <p className="text-[10px] text-slate-400">{inc.paymentMethod}</p>
                </div>
              </div>
            ))}

            {expenses.slice(0, 4).map((exp) => (
              <div key={exp.id} className="py-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-md bg-rose-50 text-rose-600">
                    <ArrowDownRight className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">{exp.description}</p>
                    <p className="text-[11px] text-slate-500">
                      {exp.payee} · {exp.category} · {exp.date}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-rose-600 font-mono">
                    -{formatCurrency(exp.amount, exp.currency)}
                  </p>
                  <p className="text-[10px] text-slate-400">{exp.paymentMethod}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

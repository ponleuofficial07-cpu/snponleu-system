import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  Calendar,
  Download,
  Printer,
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart,
  Wallet,
  ArrowRight
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { translations } from '../../locales/translations';
import { formatCurrency, convertCurrency } from '../../utils/payrollCalculator';
import { exportToExcel } from '../../utils/exportUtils';

export const FinancialReportsView: React.FC = () => {
  const {
    language,
    currencyDisplay,
    companySettings,
    income,
    expenses,
    payrollRecords,
    payrollPeriods
  } = useApp();
  const t = translations[language];

  // Date range filter defaults to current month
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth() - 1, 16)
    .toISOString()
    .slice(0, 10);
  const endOfMonth = new Date(today.getFullYear(), today.getMonth(), 15)
    .toISOString()
    .slice(0, 10);

  const [startDate, setStartDate] = useState(startOfMonth);
  const [endDate, setEndDate] = useState(endOfMonth);
  const [reportType, setReportType] = useState<'pnl' | 'cashflow' | 'payroll' | 'categories'>('pnl');

  // Filtered income & expenses by date range
  const filteredIncome = useMemo(
    () => income.filter((i) => i.date >= startDate && i.date <= endDate),
    [income, startDate, endDate]
  );

  const filteredExpenses = useMemo(
    () => expenses.filter((e) => e.date >= startDate && e.date <= endDate),
    [expenses, startDate, endDate]
  );

  // Financial aggregates
  const reportStats = useMemo(() => {
    let incomeUSD = 0;
    let incomeKHR = 0;
    let incomeTotalConv = 0;

    let expenseUSD = 0;
    let expenseKHR = 0;
    let expenseTotalConv = 0;
    let paidExpenseConv = 0;

    const incomeByCat: Record<string, number> = {};
    const expenseByCat: Record<string, number> = {};

    filteredIncome.forEach((i) => {
      if (i.currency === 'USD') incomeUSD += i.amount;
      else incomeKHR += i.amount;

      const conv = convertCurrency(i.amount, i.currency, currencyDisplay, companySettings.exchangeRateUsdToKhr);
      incomeTotalConv += conv;
      incomeByCat[i.category] = (incomeByCat[i.category] || 0) + conv;
    });

    filteredExpenses.forEach((e) => {
      if (e.currency === 'USD') expenseUSD += e.amount;
      else expenseKHR += e.amount;

      const conv = convertCurrency(e.amount, e.currency, currencyDisplay, companySettings.exchangeRateUsdToKhr);
      expenseTotalConv += conv;
      if (e.status === 'paid') {
        paidExpenseConv += conv;
      }
      expenseByCat[e.category] = (expenseByCat[e.category] || 0) + conv;
    });

    const netProfit = incomeTotalConv - expenseTotalConv;
    const netCashFlow = incomeTotalConv - paidExpenseConv;

    return {
      incomeUSD,
      incomeKHR,
      incomeTotalConv,
      expenseUSD,
      expenseKHR,
      expenseTotalConv,
      paidExpenseConv,
      netProfit,
      netCashFlow,
      incomeByCat,
      expenseByCat,
    };
  }, [filteredIncome, filteredExpenses, currencyDisplay, companySettings.exchangeRateUsdToKhr]);

  // Export Report to Excel
  const handleExport = () => {
    const pnlData = [
      { Metric: 'Total Income', Amount: reportStats.incomeTotalConv, Currency: currencyDisplay },
      { Metric: 'Total Expenses (Accrued)', Amount: reportStats.expenseTotalConv, Currency: currencyDisplay },
      { Metric: 'Net Profit / (Loss)', Amount: reportStats.netProfit, Currency: currencyDisplay },
      { Metric: 'Cash Received', Amount: reportStats.incomeTotalConv, Currency: currencyDisplay },
      { Metric: 'Cash Expenses Paid', Amount: reportStats.paidExpenseConv, Currency: currencyDisplay },
      { Metric: 'Net Cash Flow', Amount: reportStats.netCashFlow, Currency: currencyDisplay },
    ];

    const incomeCatData = Object.entries(reportStats.incomeByCat).map(([cat, amt]) => ({
      Category: cat,
      Amount: amt,
      Currency: currencyDisplay,
    }));

    const expenseCatData = Object.entries(reportStats.expenseByCat).map(([cat, amt]) => ({
      Category: cat,
      Amount: amt,
      Currency: currencyDisplay,
    }));

    exportToExcel(
      [
        { sheetName: 'Executive Summary', data: pnlData },
        { sheetName: 'Income By Category', data: incomeCatData },
        { sheetName: 'Expense By Category', data: expenseCatData },
      ],
      `Financial_Report_${startDate}_to_${endDate}`
    );
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div>
          <h2 className="text-base font-bold text-slate-900">{t.financialReportsTitle}</h2>
          <p className="text-xs text-slate-500">
            {language === 'km'
              ? 'របាយការណ៍ចំណូល ចំណាយ ចរន្តសាច់ប្រាក់ និងប្រាក់បៀវត្សរ៍'
              : 'Profit & Loss, Cash Flow Statements, and Category Breakdowns'}
          </p>
        </div>

        {/* Date Filter & Export */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded-lg border border-slate-200 text-xs">
            <span className="text-slate-500">{t.from}:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2 py-0.5 border border-slate-200 rounded font-mono text-slate-800 bg-white"
            />
            <span className="text-slate-500">{t.to}:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2 py-0.5 border border-slate-200 rounded font-mono text-slate-800 bg-white"
            />
          </div>

          <button
            onClick={() => window.print()}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-slate-200 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>{t.print}</span>
          </button>

          <button
            onClick={handleExport}
            className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>{t.exportExcel}</span>
          </button>
        </div>
      </div>

      {/* Report Type Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-xl no-print w-fit">
        <button
          onClick={() => setReportType('pnl')}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
            reportType === 'pnl' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          {t.profitLossStatement}
        </button>
        <button
          onClick={() => setReportType('cashflow')}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
            reportType === 'cashflow' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          {t.cashFlowStatement}
        </button>
        <button
          onClick={() => setReportType('categories')}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
            reportType === 'categories' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          {language === 'km' ? 'ចំណូល & ចំណាយតាមប្រភេទ' : 'Category Breakdown'}
        </button>
      </div>

      {/* Main Report View Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6 print-page">
        {/* Printable Header */}
        <div className="border-b border-slate-200 pb-4">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-lg font-bold text-slate-900">{companySettings.companyNameKhmer}</h1>
              <h2 className="text-xs text-slate-500 font-semibold">{companySettings.companyNameEnglish}</h2>
              <p className="text-xs text-indigo-700 font-bold mt-1 uppercase tracking-wide">
                {reportType === 'pnl' && t.profitLossStatement}
                {reportType === 'cashflow' && t.cashFlowStatement}
                {reportType === 'categories' && (language === 'km' ? 'តារាងបំបែកចំណូល-ចំណាយតាមប្រភេទ' : 'Income & Expense Category Breakdown')}
              </p>
            </div>
            <div className="text-right text-xs text-slate-500 font-mono">
              <p>{t.dateRange}: {startDate} ~ {endDate}</p>
              <p className="mt-0.5">Rate: 1 USD = {companySettings.exchangeRateUsdToKhr.toLocaleString()} KHR</p>
            </div>
          </div>
        </div>

        {/* Currency Dual Balances */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
            <span className="text-slate-500 block mb-1">USD Activity</span>
            <div className="flex justify-between text-emerald-700 font-mono">
              <span>Income:</span>
              <span className="font-bold">+${reportStats.incomeUSD.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-rose-700 font-mono mt-0.5">
              <span>Expenses:</span>
              <span className="font-bold">-${reportStats.expenseUSD.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
            <span className="text-slate-500 block mb-1">KHR Activity</span>
            <div className="flex justify-between text-emerald-700 font-mono">
              <span>Income:</span>
              <span className="font-bold">+{reportStats.incomeKHR.toLocaleString()} ៛</span>
            </div>
            <div className="flex justify-between text-rose-700 font-mono mt-0.5">
              <span>Expenses:</span>
              <span className="font-bold">-{reportStats.expenseKHR.toLocaleString()} ៛</span>
            </div>
          </div>

          <div className="p-3 bg-indigo-50/60 rounded-lg border border-indigo-200 text-xs">
            <span className="text-indigo-950 font-bold block mb-1">
              Unified Summary ({currencyDisplay})
            </span>
            <div className="flex justify-between text-slate-800 font-mono">
              <span>Net Profit:</span>
              <span className={`font-bold ${reportStats.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                {formatCurrency(reportStats.netProfit, currencyDisplay)}
              </span>
            </div>
            <div className="flex justify-between text-slate-800 font-mono mt-0.5">
              <span>Net Cash Flow:</span>
              <span className={`font-bold ${reportStats.netCashFlow >= 0 ? 'text-indigo-700' : 'text-rose-700'}`}>
                {formatCurrency(reportStats.netCashFlow, currencyDisplay)}
              </span>
            </div>
          </div>
        </div>

        {/* P&L Statement Details */}
        {reportType === 'pnl' && (
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 text-sm border-b border-slate-200 pb-2">
              {t.profitLossStatement} (Accrual Basis)
            </h3>
            <table className="w-full text-xs">
              <tbody className="divide-y divide-slate-100">
                <tr className="font-bold bg-slate-50">
                  <td className="py-2.5 px-3 text-slate-900">{t.totalIncome}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-emerald-700">
                    +{formatCurrency(reportStats.incomeTotalConv, currencyDisplay)}
                  </td>
                </tr>
                {Object.entries(reportStats.incomeByCat).map(([cat, amt]) => (
                  <tr key={cat} className="text-slate-600">
                    <td className="py-2 pl-6 pr-3">· {cat}</td>
                    <td className="py-2 px-3 text-right font-mono">
                      +{formatCurrency(amt, currencyDisplay)}
                    </td>
                  </tr>
                ))}

                <tr className="font-bold bg-slate-50">
                  <td className="py-2.5 px-3 text-slate-900">{t.totalExpenses}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-rose-700">
                    -{formatCurrency(reportStats.expenseTotalConv, currencyDisplay)}
                  </td>
                </tr>
                {Object.entries(reportStats.expenseByCat).map(([cat, amt]) => (
                  <tr key={cat} className="text-slate-600">
                    <td className="py-2 pl-6 pr-3">· {cat}</td>
                    <td className="py-2 px-3 text-right font-mono">
                      -{formatCurrency(amt, currencyDisplay)}
                    </td>
                  </tr>
                ))}

                <tr className="font-bold text-sm bg-indigo-50 border-t-2 border-indigo-200">
                  <td className="py-3 px-3 text-indigo-950">{t.netProfit}</td>
                  <td className={`py-3 px-3 text-right font-mono text-base ${reportStats.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {formatCurrency(reportStats.netProfit, currencyDisplay)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Cash Flow Statement Details */}
        {reportType === 'cashflow' && (
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 text-sm border-b border-slate-200 pb-2">
              {t.cashFlowStatement} (Cash Basis)
            </h3>
            <table className="w-full text-xs">
              <tbody className="divide-y divide-slate-100">
                <tr className="font-semibold text-slate-800">
                  <td className="py-2.5 px-3">{t.totalCashReceived} (Income Collected)</td>
                  <td className="py-2.5 px-3 text-right font-mono text-emerald-700 font-bold">
                    +{formatCurrency(reportStats.incomeTotalConv, currencyDisplay)}
                  </td>
                </tr>
                <tr className="font-semibold text-slate-800">
                  <td className="py-2.5 px-3">{t.totalCashPaid} (Expenses Settled)</td>
                  <td className="py-2.5 px-3 text-right font-mono text-rose-700 font-bold">
                    -{formatCurrency(reportStats.paidExpenseConv, currencyDisplay)}
                  </td>
                </tr>
                <tr className="font-bold text-sm bg-emerald-50/70 border-t-2 border-emerald-300">
                  <td className="py-3 px-3 text-emerald-950">{t.netCashFlow} (Operating Balance)</td>
                  <td className={`py-3 px-3 text-right font-mono text-base ${reportStats.netCashFlow >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {formatCurrency(reportStats.netCashFlow, currencyDisplay)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Category Breakdown Details */}
        {reportType === 'categories' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Income categories */}
            <div className="space-y-3">
              <h4 className="font-bold text-emerald-900 text-xs pb-1 border-b border-emerald-200">
                {t.incomeByCategory}
              </h4>
              <div className="space-y-2 text-xs">
                {Object.entries(reportStats.incomeByCat).map(([cat, amt]) => {
                  const pct = reportStats.incomeTotalConv > 0 ? (amt / reportStats.incomeTotalConv) * 100 : 0;
                  return (
                    <div key={cat} className="space-y-1">
                      <div className="flex justify-between text-slate-700">
                        <span>{cat}</span>
                        <span className="font-mono font-bold text-emerald-700">
                          {formatCurrency(amt, currencyDisplay)} ({pct.toFixed(0)}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Expense categories */}
            <div className="space-y-3">
              <h4 className="font-bold text-rose-900 text-xs pb-1 border-b border-rose-200">
                {t.expenseByCategory}
              </h4>
              <div className="space-y-2 text-xs">
                {Object.entries(reportStats.expenseByCat).map(([cat, amt]) => {
                  const pct = reportStats.expenseTotalConv > 0 ? (amt / reportStats.expenseTotalConv) * 100 : 0;
                  return (
                    <div key={cat} className="space-y-1">
                      <div className="flex justify-between text-slate-700">
                        <span>{cat}</span>
                        <span className="font-mono font-bold text-rose-700">
                          {formatCurrency(amt, currencyDisplay)} ({pct.toFixed(0)}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-rose-500 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

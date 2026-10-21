import React, { useState, useMemo } from 'react';
import {
  TrendingDown,
  Plus,
  Search,
  Filter,
  Download,
  Calendar,
  DollarSign,
  Edit2,
  Trash2,
  Link as LinkIcon,
  CheckCircle,
  Clock,
  X
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { translations } from '../../locales/translations';
import { ExpenseTransaction, Currency, PaymentMethod } from '../../types';
import { formatCurrency, convertCurrency } from '../../utils/payrollCalculator';
import { exportToExcel } from '../../utils/exportUtils';

export const ExpensesView: React.FC = () => {
  const {
    language,
    currencyDisplay,
    companySettings,
    expenses,
    addExpense,
    updateExpense,
    deleteExpense
  } = useApp();
  const t = translations[language];

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<ExpenseTransaction | null>(null);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().slice(0, 10),
    category: companySettings.expenseCategories[0] || 'Utilities',
    description: '',
    amount: 150,
    currency: 'USD' as Currency,
    paymentMethod: 'ABA Bank' as PaymentMethod,
    payee: '',
    reference: '',
    status: 'paid' as 'paid' | 'unpaid',
    notes: '',
  });

  const filteredExpenses = useMemo(() => {
    return expenses.filter((exp) => {
      const matchSearch =
        exp.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exp.payee.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exp.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (exp.reference && exp.reference.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchCategory = selectedCategory === 'ALL' || exp.category === selectedCategory;
      const matchStatus = selectedStatus === 'ALL' || exp.status === selectedStatus;
      return matchSearch && matchCategory && matchStatus;
    });
  }, [expenses, searchTerm, selectedCategory, selectedStatus]);

  const totals = useMemo(() => {
    let totalUSD = 0;
    let totalKHR = 0;
    let totalPaid = 0;
    let totalUnpaid = 0;

    filteredExpenses.forEach((exp) => {
      if (exp.currency === 'USD') totalUSD += exp.amount;
      else totalKHR += exp.amount;

      const conv = convertCurrency(
        exp.amount,
        exp.currency,
        currencyDisplay,
        companySettings.exchangeRateUsdToKhr
      );

      if (exp.status === 'paid') {
        totalPaid += conv;
      } else {
        totalUnpaid += conv;
      }
    });

    return { totalUSD, totalKHR, totalPaid, totalUnpaid };
  }, [filteredExpenses, currencyDisplay, companySettings.exchangeRateUsdToKhr]);

  const handleOpenAdd = () => {
    setEditingTransaction(null);
    setFormData({
      date: new Date().toISOString().slice(0, 10),
      category: companySettings.expenseCategories[2] || 'Office Rent',
      description: '',
      amount: 150,
      currency: 'USD',
      paymentMethod: 'ABA Bank',
      payee: '',
      reference: '',
      status: 'paid',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (exp: ExpenseTransaction) => {
    setEditingTransaction(exp);
    setFormData({
      date: exp.date,
      category: exp.category,
      description: exp.description,
      amount: exp.amount,
      currency: exp.currency,
      paymentMethod: exp.paymentMethod,
      payee: exp.payee,
      reference: exp.reference || '',
      status: exp.status,
      notes: exp.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description.trim() || !formData.payee.trim()) {
      alert('Please fill in required fields');
      return;
    }

    if (editingTransaction) {
      updateExpense(editingTransaction.id, formData);
    } else {
      addExpense(formData);
    }
    setIsModalOpen(false);
  };

  const handleExport = () => {
    const exportData = filteredExpenses.map((exp) => ({
      'Transaction ID': exp.id,
      'Date': exp.date,
      'Category': exp.category,
      'Description': exp.description,
      'Amount': exp.amount,
      'Currency': exp.currency,
      'Payee / Supplier': exp.payee,
      'Payment Method': exp.paymentMethod,
      'Status': exp.status,
      'Reference #': exp.reference || '',
      'Linked Salary ID': exp.linkedPayrollRecordId || '',
      'Notes': exp.notes || '',
    }));

    exportToExcel(
      [{ sheetName: 'Expenses', data: exportData }],
      `Expenses_${new Date().toISOString().slice(0, 10)}`
    );
  };

  return (
    <div className="space-y-5">
      {/* Overview & Action Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
            <TrendingDown className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">{t.expenseList}</h2>
            <p className="text-xs text-slate-500">
              {filteredExpenses.length} {language === 'km' ? 'ប្រតិបត្តិការចំណាយ' : 'transactions recorded'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-slate-200 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>{t.exportExcel}</span>
          </button>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t.addExpense}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards for Expenses */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500">{t.totalExpenses} (USD)</span>
          <div className="text-xl font-bold font-mono text-rose-600 mt-1">
            ${totals.totalUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500">{t.totalExpenses} (KHR)</span>
          <div className="text-xl font-bold font-mono text-rose-600 mt-1">
            {totals.totalKHR.toLocaleString()} ៛
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-rose-200 shadow-xs bg-rose-50/30">
          <span className="text-xs text-rose-900 font-semibold">{t.totalExpenses} ({currencyDisplay})</span>
          <div className="text-xl font-bold font-mono text-rose-700 mt-1">
            {formatCurrency(totals.totalPaid, currencyDisplay)}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {language === 'km' ? 'បានទូទាត់ជាក់ស្តែង' : 'Paid cash flow'}
          </div>
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
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
          />
        </div>
        <div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-700"
          >
            <option value="ALL">{t.all} {t.category}</option>
            {companySettings.expenseCategories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-700"
          >
            <option value="ALL">{t.all} {t.status}</option>
            <option value="paid">{t.paid}</option>
            <option value="unpaid">{t.unpaid}</option>
          </select>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">{t.reference}</th>
                <th className="py-3 px-4">{t.date}</th>
                <th className="py-3 px-4">{t.category}</th>
                <th className="py-3 px-4">{t.description}</th>
                <th className="py-3 px-4">{t.payeeSupplier}</th>
                <th className="py-3 px-4">{t.paymentMethod}</th>
                <th className="py-3 px-4">{t.amount}</th>
                <th className="py-3 px-4">{t.status}</th>
                <th className="py-3 px-4 text-right">{t.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredExpenses.map((exp) => (
                <tr key={exp.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 font-mono font-medium text-rose-700">
                    <div className="flex items-center gap-1.5">
                      <span>{exp.id}</span>
                      {exp.linkedPayrollRecordId && (
                        <span title={t.salaryExpenseLinked}>
                          <LinkIcon className="w-3.5 h-3.5 text-indigo-600" />
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-600">
                    {exp.date}
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-medium text-slate-800">{exp.category}</span>
                  </td>
                  <td className="py-3 px-4">
                    <p className="font-semibold text-slate-900">{exp.description}</p>
                    {exp.reference && (
                      <p className="text-[11px] font-mono text-slate-400">Ref: {exp.reference}</p>
                    )}
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-800">
                    {exp.payee}
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    {exp.paymentMethod}
                  </td>
                  <td className="py-3 px-4 font-bold font-mono text-rose-600">
                    -{formatCurrency(exp.amount, exp.currency)}
                  </td>
                  <td className="py-3 px-4">
                    {exp.status === 'paid' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                        <CheckCircle className="w-3 h-3" />
                        {t.paid}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                        <Clock className="w-3 h-3" />
                        {t.unpaid}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleOpenEdit(exp)}
                        className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                        title={t.edit}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(language === 'km' ? `តើអ្នកប្រាកដជាចង់លុបប្រតិបត្តិការចំណាយ ${exp.id} មែនទេ?` : `Delete expense transaction ${exp.id}?`)) {
                            deleteExpense(exp.id);
                          }
                        }}
                        className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                        title={t.delete}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredExpenses.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    {language === 'km' ? 'មិនមានទិន្នន័យចំណាយ' : 'No expense transactions found'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-4">
              {editingTransaction ? t.edit : t.addExpense}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">{t.date} *</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">{t.category} *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  >
                    {companySettings.expenseCategories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">{t.description} *</label>
                <input
                  type="text"
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="ឧ. ថ្លៃជួលការិយាល័យ ឬទិញសម្ភារ..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">{t.amount} *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    step={formData.currency === 'USD' ? '0.01' : '1000'}
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">{t.currency}</label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value as Currency })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-bold"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="KHR">KHR (៛)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">{t.payeeSupplier} *</label>
                  <input
                    type="text"
                    required
                    value={formData.payee}
                    onChange={(e) => setFormData({ ...formData, payee: e.target.value })}
                    placeholder="ឈ្មោះអ្នកផ្គត់ផ្គង់ ឬអ្នកទទួលប្រាក់"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">{t.paymentMethod}</label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as PaymentMethod })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  >
                    <option value="ABA Bank">ABA Bank</option>
                    <option value="ACLEDA">ACLEDA Bank</option>
                    <option value="Wing">Wing</option>
                    <option value="Cash">Cash (សាច់ប្រាក់សុទ្ធ)</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">{t.reference}</label>
                  <input
                    type="text"
                    value={formData.reference}
                    onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                    placeholder="e.g. BILL-2026-09"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">{t.paymentStatus}</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'paid' | 'unpaid' })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  >
                    <option value="paid">{t.paid}</option>
                    <option value="unpaid">{t.unpaid}</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-semibold shadow-xs cursor-pointer"
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

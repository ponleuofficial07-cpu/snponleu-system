import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Plus,
  Search,
  Filter,
  Download,
  Calendar,
  DollarSign,
  Edit2,
  Trash2,
  FileText,
  X
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { translations } from '../../locales/translations';
import { IncomeTransaction, Currency, PaymentMethod } from '../../types';
import { formatCurrency, convertCurrency } from '../../utils/payrollCalculator';
import { exportToExcel } from '../../utils/exportUtils';

export const IncomeView: React.FC = () => {
  const {
    language,
    currencyDisplay,
    companySettings,
    income,
    addIncome,
    updateIncome,
    deleteIncome
  } = useApp();
  const t = translations[language];

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<IncomeTransaction | null>(null);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().slice(0, 10),
    category: companySettings.incomeCategories[0] || 'Sales',
    description: '',
    amount: 500,
    currency: 'USD' as Currency,
    paymentMethod: 'ABA Bank' as PaymentMethod,
    payer: '',
    reference: '',
    notes: '',
  });

  const filteredIncome = useMemo(() => {
    return income.filter((inc) => {
      const matchSearch =
        inc.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inc.payer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inc.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (inc.reference && inc.reference.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchCategory = selectedCategory === 'ALL' || inc.category === selectedCategory;
      return matchSearch && matchCategory;
    });
  }, [income, searchTerm, selectedCategory]);

  const totals = useMemo(() => {
    let totalUSD = 0;
    let totalKHR = 0;
    let totalConverted = 0;

    filteredIncome.forEach((inc) => {
      if (inc.currency === 'USD') totalUSD += inc.amount;
      else totalKHR += inc.amount;

      totalConverted += convertCurrency(
        inc.amount,
        inc.currency,
        currencyDisplay,
        companySettings.exchangeRateUsdToKhr
      );
    });

    return { totalUSD, totalKHR, totalConverted };
  }, [filteredIncome, currencyDisplay, companySettings.exchangeRateUsdToKhr]);

  const handleOpenAdd = () => {
    setEditingTransaction(null);
    setFormData({
      date: new Date().toISOString().slice(0, 10),
      category: companySettings.incomeCategories[0] || 'Sales',
      description: '',
      amount: 500,
      currency: 'USD',
      paymentMethod: 'ABA Bank',
      payer: '',
      reference: '',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (inc: IncomeTransaction) => {
    setEditingTransaction(inc);
    setFormData({
      date: inc.date,
      category: inc.category,
      description: inc.description,
      amount: inc.amount,
      currency: inc.currency,
      paymentMethod: inc.paymentMethod,
      payer: inc.payer,
      reference: inc.reference || '',
      notes: inc.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description.trim() || !formData.payer.trim()) {
      alert('Please fill in required fields');
      return;
    }

    if (editingTransaction) {
      updateIncome(editingTransaction.id, formData);
    } else {
      addIncome(formData);
    }
    setIsModalOpen(false);
  };

  const handleExport = () => {
    const exportData = filteredIncome.map((inc) => ({
      'Transaction ID': inc.id,
      'Date': inc.date,
      'Category': inc.category,
      'Description': inc.description,
      'Amount': inc.amount,
      'Currency': inc.currency,
      'Payer / Customer': inc.payer,
      'Payment Method': inc.paymentMethod,
      'Reference #': inc.reference || '',
      'Notes': inc.notes || '',
    }));

    exportToExcel(
      [{ sheetName: 'Income', data: exportData }],
      `Income_${new Date().toISOString().slice(0, 10)}`
    );
  };

  return (
    <div className="space-y-5">
      {/* Overview & Action Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">{t.incomeList}</h2>
            <p className="text-xs text-slate-500">
              {filteredIncome.length} {language === 'km' ? 'ប្រតិបត្តិការចំណូល' : 'transactions recorded'}
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
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t.addIncome}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards for Income */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500">{t.totalIncome} (USD)</span>
          <div className="text-xl font-bold font-mono text-emerald-600 mt-1">
            ${totals.totalUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500">{t.totalIncome} (KHR)</span>
          <div className="text-xl font-bold font-mono text-emerald-600 mt-1">
            {totals.totalKHR.toLocaleString()} ៛
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-indigo-200 shadow-xs bg-indigo-50/30">
          <span className="text-xs text-indigo-900 font-semibold">{t.totalIncome} ({currencyDisplay})</span>
          <div className="text-xl font-bold font-mono text-indigo-700 mt-1">
            {formatCurrency(totals.totalConverted, currencyDisplay)}
          </div>
        </div>
      </div>

      {/* Search and Category Filter */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
            {companySettings.incomeCategories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Income Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">{t.reference}</th>
                <th className="py-3 px-4">{t.date}</th>
                <th className="py-3 px-4">{t.category}</th>
                <th className="py-3 px-4">{t.description}</th>
                <th className="py-3 px-4">{t.payerCustomer}</th>
                <th className="py-3 px-4">{t.paymentMethod}</th>
                <th className="py-3 px-4">{t.amount}</th>
                <th className="py-3 px-4 text-right">{t.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredIncome.map((inc) => (
                <tr key={inc.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 font-mono font-medium text-emerald-700">
                    {inc.id}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-600">
                    {inc.date}
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-medium text-slate-800">{inc.category}</span>
                  </td>
                  <td className="py-3 px-4">
                    <p className="font-semibold text-slate-900">{inc.description}</p>
                    {inc.reference && (
                      <p className="text-[11px] font-mono text-slate-400">Ref: {inc.reference}</p>
                    )}
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-800">
                    {inc.payer}
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    {inc.paymentMethod}
                  </td>
                  <td className="py-3 px-4 font-bold font-mono text-emerald-600">
                    +{formatCurrency(inc.amount, inc.currency)}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleOpenEdit(inc)}
                        className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                        title={t.edit}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(language === 'km' ? `តើអ្នកប្រាកដជាចង់លុបប្រតិបត្តិការចំណូល ${inc.id} មែនទេ?` : `Delete income transaction ${inc.id}?`)) {
                            deleteIncome(inc.id);
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
              {filteredIncome.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    {language === 'km' ? 'មិនមានទិន្នន័យចំណូល' : 'No income transactions found'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Income Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-4">
              {editingTransaction ? t.edit : t.addIncome}
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
                    {companySettings.incomeCategories.map((c) => (
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
                  placeholder="ឧ. ការលក់ទំនិញ ឬសេវាកម្ម..."
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
                  <label className="block font-semibold text-slate-700 mb-1">{t.payerCustomer} *</label>
                  <input
                    type="text"
                    required
                    value={formData.payer}
                    onChange={(e) => setFormData({ ...formData, payer: e.target.value })}
                    placeholder="ឈ្មោះអតិថិជន ឬក្រុមហ៊ុន"
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

              <div>
                <label className="block font-semibold text-slate-700 mb-1">{t.reference}</label>
                <input
                  type="text"
                  value={formData.reference}
                  onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                  placeholder="e.g. INV-2026-001"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                />
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
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold shadow-xs cursor-pointer"
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

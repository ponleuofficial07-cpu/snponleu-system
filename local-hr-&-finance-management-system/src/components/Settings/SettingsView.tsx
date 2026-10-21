import React, { useState } from 'react';
import {
  Settings,
  Building2,
  DollarSign,
  Shield,
  Key,
  Save,
  CheckCircle2,
  Plus,
  Trash2,
  FileText
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { translations } from '../../locales/translations';
import { Currency, Language } from '../../types';

export const SettingsView: React.FC = () => {
  const {
    language,
    setLanguage,
    currencyDisplay,
    setCurrencyDisplay,
    companySettings,
    updateCompanySettings,
    changeAdminPassword
  } = useApp();
  const t = translations[language];

  const [formData, setFormData] = useState({ ...companySettings });
  const [saveSuccess, setSaveSuccess] = useState(false);

  // New category inputs
  const [newIncomeCat, setNewIncomeCat] = useState('');
  const [newExpenseCat, setNewExpenseCat] = useState('');
  const [newDept, setNewDept] = useState('');

  // Password change
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [passMsg, setPassMsg] = useState<{ text: string; isError: boolean } | null>(null);

  const handleSaveCompany = (e: React.FormEvent) => {
    e.preventDefault();
    updateCompanySettings(formData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPass.trim()) return;
    const ok = changeAdminPassword(oldPass, newPass);
    if (ok) {
      setPassMsg({ text: language === 'km' ? 'ពាក្យសម្ងាត់ត្រូវបានផ្លាស់ប្តូរជោគជ័យ' : 'Password changed successfully', isError: false });
      setOldPass('');
      setNewPass('');
    } else {
      setPassMsg({ text: language === 'km' ? 'ពាក្យសម្ងាត់ចាស់មិនត្រឹមត្រូវទេ' : 'Incorrect current password', isError: true });
    }
    setTimeout(() => setPassMsg(null), 4000);
  };

  const handleAddIncomeCategory = () => {
    if (!newIncomeCat.trim()) return;
    setFormData((prev) => ({
      ...prev,
      incomeCategories: [...prev.incomeCategories, newIncomeCat.trim()],
    }));
    setNewIncomeCat('');
  };

  const handleDeleteIncomeCategory = (cat: string) => {
    setFormData((prev) => ({
      ...prev,
      incomeCategories: prev.incomeCategories.filter((c) => c !== cat),
    }));
  };

  const handleAddExpenseCategory = () => {
    if (!newExpenseCat.trim()) return;
    setFormData((prev) => ({
      ...prev,
      expenseCategories: [...prev.expenseCategories, newExpenseCat.trim()],
    }));
    setNewExpenseCat('');
  };

  const handleDeleteExpenseCategory = (cat: string) => {
    setFormData((prev) => ({
      ...prev,
      expenseCategories: prev.expenseCategories.filter((c) => c !== cat),
    }));
  };

  const handleAddDept = () => {
    if (!newDept.trim()) return;
    setFormData((prev) => ({
      ...prev,
      departments: [...prev.departments, newDept.trim()],
    }));
    setNewDept('');
  };

  const handleDeleteDept = (d: string) => {
    setFormData((prev) => ({
      ...prev,
      departments: prev.departments.filter((item) => item !== d),
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">{t.settings}</h2>
            <p className="text-xs text-slate-500">
              {language === 'km'
                ? 'កំណត់ព័ត៌មានក្រុមហ៊ុន អត្រាប្តូរប្រាក់ និងសុវត្ថិភាព'
                : 'Configure company profile, exchange rates, and system security'}
            </p>
          </div>
        </div>

        {saveSuccess && (
          <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4" />
            {t.success}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Company Profile & General Form */}
        <form onSubmit={handleSaveCompany} className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs space-y-4 lg:col-span-2 text-xs">
          <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-600" />
            <span>{t.companyProfile}</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">{t.companyNameKhmer} *</label>
              <input
                type="text"
                required
                value={formData.companyNameKhmer}
                onChange={(e) => setFormData({ ...formData, companyNameKhmer: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">{t.companyNameEnglish} *</label>
              <input
                type="text"
                required
                value={formData.companyNameEnglish}
                onChange={(e) => setFormData({ ...formData, companyNameEnglish: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">{t.companyAddressKhmer}</label>
              <input
                type="text"
                value={formData.addressKhmer}
                onChange={(e) => setFormData({ ...formData, addressKhmer: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">{t.companyAddressEnglish}</label>
              <input
                type="text"
                value={formData.addressEnglish}
                onChange={(e) => setFormData({ ...formData, addressEnglish: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">{t.phone}</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">{t.email}</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tax ID / ព័ត៌មានសារពើពន្ធ</label>
              <input
                type="text"
                value={formData.taxId}
                onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
              />
            </div>
          </div>

          {/* Exchange Rate & Currency Defaults */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
            <span className="font-bold text-slate-900 block flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <span>{t.exchangeRateLabel} & {t.currency}</span>
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  1 USD = ? KHR *
                </label>
                <input
                  type="number"
                  required
                  min={1000}
                  step={10}
                  value={formData.exchangeRateUsdToKhr}
                  onChange={(e) => setFormData({ ...formData, exchangeRateUsdToKhr: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-mono font-bold"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {language === 'km' ? 'រូបិយប័ណ្ណលំនាំដើម' : 'Default Currency'}
                </label>
                <select
                  value={formData.defaultCurrency}
                  onChange={(e) => setFormData({ ...formData, defaultCurrency: e.target.value as Currency })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-bold"
                >
                  <option value="USD">USD ($)</option>
                  <option value="KHR">KHR (៛)</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {language === 'km' ? 'ភាសាលំនាំដើម' : 'Default Language'}
                </label>
                <select
                  value={formData.defaultLanguage}
                  onChange={(e) => setFormData({ ...formData, defaultLanguage: e.target.value as Language })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-bold"
                >
                  <option value="km">ភាសាខ្មែរ (Khmer)</option>
                  <option value="en">English</option>
                </select>
              </div>
            </div>
          </div>

          {/* Signatory Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">{t.signatoryName}</label>
              <input
                type="text"
                value={formData.signatoryName}
                onChange={(e) => setFormData({ ...formData, signatoryName: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">{t.signatoryTitle}</label>
              <input
                type="text"
                value={formData.administratorTitle}
                onChange={(e) => setFormData({ ...formData, administratorTitle: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          {/* Payslip Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {language === 'km' ? 'កំណត់ចំណាំប័ណ្ណបើកប្រាក់ខែ (ខ្មែរ)' : 'Payslip Note (Khmer)'}
              </label>
              <textarea
                rows={2}
                value={formData.payslipNoteKhmer}
                onChange={(e) => setFormData({ ...formData, payslipNoteKhmer: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {language === 'km' ? 'កំណត់ចំណាំប័ណ្ណបើកប្រាក់ខែ (English)' : 'Payslip Note (English)'}
              </label>
              <textarea
                rows={2}
                value={formData.payslipNoteEnglish}
                onChange={(e) => setFormData({ ...formData, payslipNoteEnglish: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-100">
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{t.save}</span>
            </button>
          </div>
        </form>

        {/* Security & Password Change */}
        <div className="space-y-6">
          <form onSubmit={handlePasswordSubmit} className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs space-y-4 text-xs">
            <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
              <Shield className="w-4 h-4 text-indigo-600" />
              <span>{t.securitySettings}</span>
            </h3>

            {passMsg && (
              <div
                className={`p-2.5 rounded-lg text-xs font-semibold ${
                  passMsg.isError ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}
              >
                {passMsg.text}
              </div>
            )}

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {language === 'km' ? 'ពាក្យសម្ងាត់បច្ចុប្បន្ន' : 'Current Password / PIN'} *
              </label>
              <input
                type="password"
                required
                value={oldPass}
                onChange={(e) => setOldPass(e.target.value)}
                placeholder="admin123 or 1234"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {language === 'km' ? 'ពាក្យសម្ងាត់ថ្មី' : 'New Password'} *
              </label>
              <input
                type="password"
                required
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                placeholder="បញ្ចូលពាក្យសម្ងាត់ថ្មី..."
                className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold shadow-xs cursor-pointer"
            >
              {t.changePassword}
            </button>
          </form>

          {/* Departments Management Card */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs space-y-3 text-xs">
            <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
              {t.department}
            </h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={newDept}
                onChange={(e) => setNewDept(e.target.value)}
                placeholder="ឈ្មោះផ្នែកថ្មី..."
                className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
              />
              <button
                type="button"
                onClick={handleAddDept}
                className="px-3 py-1.5 bg-indigo-50 text-indigo-700 font-bold rounded-lg border border-indigo-200 hover:bg-indigo-100"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
              {formData.departments.map((d) => (
                <div key={d} className="flex justify-between items-center p-1.5 bg-slate-50 rounded text-[11px]">
                  <span className="truncate">{d}</span>
                  <button
                    type="button"
                    onClick={() => handleDeleteDept(d)}
                    className="text-slate-400 hover:text-rose-600"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

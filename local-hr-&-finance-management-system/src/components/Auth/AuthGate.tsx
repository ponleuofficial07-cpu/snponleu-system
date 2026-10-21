import React, { useState } from 'react';
import { ShieldCheck, Lock, Key, ArrowRight, Building2, AlertCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { translations } from '../../locales/translations';

export const AuthGate: React.FC = () => {
  const { language, login, companySettings } = useApp();
  const t = translations[language];

  const [inputVal, setInputVal] = useState('');
  const [errorMsg, setErrorMsg] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ok = login(inputVal);
    if (!ok) {
      setErrorMsg(true);
      setTimeout(() => setErrorMsg(false), 3000);
    }
  };

  const handleQuickDemoLogin = () => {
    login('1234');
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl p-8 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-xl bg-indigo-600 text-white flex items-center justify-center mx-auto shadow-lg">
            <Building2 className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            {language === 'km' ? companySettings.companyNameKhmer : companySettings.companyNameEnglish}
          </h1>
          <p className="text-xs text-slate-400">
            {t.appSubtitle}
          </p>
        </div>

        {/* Security Badge */}
        <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-700 text-xs flex items-center justify-between text-slate-300">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Localhost Only (127.0.0.1)</span>
          </div>
          <span className="text-[11px] font-mono text-emerald-400 font-semibold">100% Offline</span>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
              <span>{t.adminLogin}</span>
              <span className="text-[11px] text-slate-400 font-normal">PIN: 1234 / admin123</span>
            </label>
            <div className="relative">
              <Key className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              <input
                type="password"
                required
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder={language === 'km' ? 'បញ្ចូលពាក្យសម្ងាត់ ឬ PIN 4 ខ្ទង់...' : 'Enter Admin Password or PIN...'}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono tracking-wider"
              />
            </div>
          </div>

          {errorMsg && (
            <div className="p-2.5 rounded-lg bg-rose-950/80 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{language === 'km' ? 'ពាក្យសម្ងាត់មិនត្រឹមត្រូវទេ (សាកល្បង: 1234 ឬ admin123)' : 'Incorrect password (Try: 1234 or admin123)'}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-colors shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Lock className="w-4 h-4" />
            <span>{t.login}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Demo Login Option */}
        <div className="pt-2 border-t border-slate-700 text-center">
          <button
            type="button"
            onClick={handleQuickDemoLogin}
            className="text-xs text-indigo-400 hover:text-indigo-300 underline font-medium cursor-pointer"
          >
            {language === 'km' ? 'ចូលប្រព័ន្ធភ្លាមៗ (Quick Demo Login)' : 'Quick Demo Login (One-Click)'}
          </button>
        </div>
      </div>
    </div>
  );
};

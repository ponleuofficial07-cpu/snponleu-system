import React from 'react';
import { Menu, Globe, DollarSign, RefreshCw, ShieldCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { translations } from '../../locales/translations';
import { ActiveTab } from './Sidebar';

interface HeaderProps {
  onToggleSidebar: () => void;
  activeTab: ActiveTab;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar, activeTab }) => {
  const {
    language,
    setLanguage,
    currencyDisplay,
    setCurrencyDisplay,
    companySettings
  } = useApp();
  const t = translations[language];

  const getPageTitle = (tab: ActiveTab): string => {
    switch (tab) {
      case 'dashboard': return t.dashboard;
      case 'employees': return t.employees;
      case 'calendar': return t.workCalendar;
      case 'attendance': return t.attendance;
      case 'payroll': return t.payroll;
      case 'payslips': return t.payslips;
      case 'income': return t.income;
      case 'expenses': return t.expenses;
      case 'reports': return t.financialReports;
      case 'settings': return t.settings;
      case 'backup': return t.backupRestore;
      case 'macos': return t.macosDeploy;
      default: return t.dashboard;
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xs border-b border-slate-200 px-4 py-2.5 flex items-center justify-between no-print">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 lg:hidden"
          aria-label="Toggle Menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-base font-semibold text-slate-900 leading-tight">
            {getPageTitle(activeTab)}
          </h2>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>{language === 'km' ? 'ប្រព័ន្ធគ្រប់គ្រងផ្ទៃក្នុង' : 'Local Standalone System'}</span>
            <span aria-hidden="true">·</span>
            <span className="flex items-center gap-1 text-emerald-600 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Asia/Phnom_Penh (UTC+7)</span>
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Exchange Rate Indicator */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 rounded-md text-xs text-slate-600 border border-slate-200">
          <span className="text-slate-400 font-mono">1 USD =</span>
          <span className="font-semibold text-slate-800 font-mono">
            {companySettings.exchangeRateUsdToKhr.toLocaleString()} KHR
          </span>
        </div>

        {/* Currency Switcher */}
        <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
          <button
            onClick={() => setCurrencyDisplay('USD')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
              currencyDisplay === 'USD'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Display USD"
          >
            $ USD
          </button>
          <button
            onClick={() => setCurrencyDisplay('KHR')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
              currencyDisplay === 'KHR'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Display KHR"
          >
            ៛ KHR
          </button>
        </div>

        {/* Language Switcher */}
        <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
          <button
            onClick={() => setLanguage('km')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
              language === 'km'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ខ្មែរ
          </button>
          <button
            onClick={() => setLanguage('en')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
              language === 'en'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            EN
          </button>
        </div>
      </div>
    </header>
  );
};

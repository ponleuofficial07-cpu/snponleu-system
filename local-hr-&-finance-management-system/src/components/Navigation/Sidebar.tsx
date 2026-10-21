import React from 'react';
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  Clock,
  CircleDollarSign,
  FileText,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Settings,
  Database,
  Terminal,
  LogOut,
  Building2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { translations } from '../../locales/translations';

export type ActiveTab =
  | 'dashboard'
  | 'employees'
  | 'calendar'
  | 'attendance'
  | 'payroll'
  | 'payslips'
  | 'income'
  | 'expenses'
  | 'reports'
  | 'settings'
  | 'backup'
  | 'macos';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isOpen,
  onCloseMobile
}) => {
  const { language, logout, companySettings } = useApp();
  const t = translations[language];

  const menuItems = [
    { id: 'dashboard' as ActiveTab, label: t.dashboard, icon: LayoutDashboard },
    { id: 'employees' as ActiveTab, label: t.employees, icon: Users },
    { id: 'calendar' as ActiveTab, label: t.workCalendar, icon: CalendarDays },
    { id: 'attendance' as ActiveTab, label: t.attendance, icon: Clock },
    { id: 'payroll' as ActiveTab, label: t.payroll, icon: CircleDollarSign },
    { id: 'payslips' as ActiveTab, label: t.payslips, icon: FileText },
    { id: 'income' as ActiveTab, label: t.income, icon: TrendingUp },
    { id: 'expenses' as ActiveTab, label: t.expenses, icon: TrendingDown },
    { id: 'reports' as ActiveTab, label: t.financialReports, icon: BarChart3 },
    { id: 'settings' as ActiveTab, label: t.settings, icon: Settings },
    { id: 'backup' as ActiveTab, label: t.backupRestore, icon: Database },
    { id: 'macos' as ActiveTab, label: t.macosDeploy, icon: Terminal },
  ];

  const handleSelect = (tab: ActiveTab) => {
    setActiveTab(tab);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-68 bg-slate-900 text-slate-200 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } no-print`}
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center text-white shrink-0 shadow-md">
            <Building2 className="w-5 h-5" />
          </div>
          <div className="overflow-hidden">
            <h1 className="font-semibold text-sm text-white truncate leading-snug">
              {language === 'km' ? companySettings.companyNameKhmer : companySettings.companyNameEnglish}
            </h1>
            <p className="text-xs text-slate-400 truncate">
              {language === 'km' ? 'ប្រព័ន្ធគ្រប់គ្រងក្នុងស្រុក' : 'Local HR & Finance'}
            </p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Localhost & Offline Status indicator */}
        <div className="px-4 py-3 border-t border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center gap-2 text-xs text-emerald-400 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-medium">Local SQLite · 100% Offline</span>
          </div>
          <p className="text-[11px] text-slate-400 font-mono">http://127.0.0.1:5000</p>
        </div>

        {/* User profile & Logout */}
        <div className="p-3 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-indigo-900/60 text-indigo-300 border border-indigo-700/50 flex items-center justify-center text-xs font-semibold">
              AD
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-medium text-slate-200 truncate">Admin (មេការ)</p>
              <p className="text-[10px] text-slate-400 truncate">Administrator</p>
            </div>
          </div>
          <button
            onClick={logout}
            title={t.logout}
            className="p-1.5 rounded-md text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>
    </>
  );
};

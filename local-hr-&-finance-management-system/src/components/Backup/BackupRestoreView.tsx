import React, { useState, useRef } from 'react';
import {
  Database,
  Download,
  Upload,
  RefreshCw,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  History,
  FileCode,
  HardDrive
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { translations } from '../../locales/translations';
import { downloadTextFile, generateSqliteDump } from '../../utils/exportUtils';

export const BackupRestoreView: React.FC = () => {
  const {
    language,
    exportDatabaseJson,
    restoreDatabaseJson,
    resetToSampleData,
    auditLogs,
    employees,
    attendance,
    payrollRecords,
    income,
    expenses,
    companySettings
  } = useApp();
  const t = translations[language];

  const [restoreStatus, setRestoreStatus] = useState<{ success: boolean; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Backup JSON
  const handleExportJson = () => {
    const jsonStr = exportDatabaseJson();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    downloadTextFile(jsonStr, `LocalHR_Backup_${timestamp}.json`, 'application/json');
  };

  // Backup SQLite SQL Dump
  const handleExportSqlite = () => {
    const sqlDump = generateSqliteDump({
      employees,
      attendance,
      payrollRecords,
      income,
      expenses,
      companySettings,
    });
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    downloadTextFile(sqlDump, `LocalHR_SQLite_Dump_${timestamp}.sql`, 'text/plain');
  };

  // Trigger File Input
  const handleTriggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Handle Restore
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const result = restoreDatabaseJson(content);
        setRestoreStatus(result);
        setTimeout(() => setRestoreStatus(null), 6000);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">{t.backupRestore}</h2>
            <p className="text-xs text-slate-500">
              {language === 'km'
                ? 'ការពារទិន្នន័យរបស់អ្នកដោយការបម្រុងទុក និងស្តារឡើងវិញ'
                : 'Protect your business records with encrypted snapshots and SQLite dumps'}
            </p>
          </div>
        </div>
      </div>

      {restoreStatus && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-2 border ${
            restoreStatus.success
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {restoreStatus.success ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span>{restoreStatus.message}</span>
        </div>
      )}

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Full JSON Backup */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
              <Download className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">{t.backupDatabase} (JSON)</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              {language === 'km'
                ? 'ទាញយកឯកសារច្បាប់ចម្លងបម្រុងទុកទាំងអស់ (បុគ្គលិក វត្តមាន បៀវត្សរ៍ ចំណូល ចំណាយ) សម្រាប់រក្សាទុកលើ Flash Drive ឬ External Hard Drive។'
                : 'Download complete state snapshot including employee directory, attendance, payroll, income, expenses, and settings.'}
            </p>
          </div>
          <button
            onClick={handleExportJson}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>{t.backupDatabase}</span>
          </button>
        </div>

        {/* SQLite Dump Export */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
              <FileCode className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">SQLite Database Dump (.sql)</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              {language === 'km'
                ? 'ទាញយកស្គ្រីប SQL ពេញលេញសម្រាប់ SQLite database ដើម្បីដំណើរការជាមួយ Python Flask ឬប្រព័ន្ធមូលដ្ឋានទិន្នន័យខាងក្រៅ។'
                : 'Download pure DDL & DML SQL script compatible with SQLite3, Python Flask, or standard database clients.'}
            </p>
          </div>
          <button
            onClick={handleExportSqlite}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            <HardDrive className="w-4 h-4" />
            <span>Export SQLite SQL</span>
          </button>
        </div>

        {/* Restore Database */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
              <Upload className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">{t.restoreDatabase}</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              {t.restoreWarning}
            </p>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json"
            className="hidden"
          />
          <button
            onClick={handleTriggerFileInput}
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>{t.restoreDatabase}</span>
          </button>
        </div>
      </div>

      {/* Safety Reset Card */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 text-slate-700">
          <RefreshCw className="w-4 h-4 text-indigo-600 shrink-0" />
          <span>
            {language === 'km'
              ? 'ចង់សាកល្បងជាមួយទិន្នន័យគំរូថ្មីឡើងវិញ?'
              : 'Need to reset and test with standard demo records?'}
          </span>
        </div>
        <button
          onClick={() => {
            if (confirm(language === 'km' ? 'តើអ្នកប្រាកដជាចង់កំណត់ទិន្នន័យគំរូឡើងវិញមែនទេ?' : 'Reset to sample data?')) {
              resetToSampleData();
            }
          }}
          className="px-3.5 py-1.5 bg-white border border-slate-300 text-slate-700 rounded-lg font-bold hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
        >
          {t.resetToDemo}
        </button>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
            <History className="w-4 h-4 text-indigo-600" />
            <span>{t.auditLogs}</span>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            {auditLogs.length} events logged
          </span>
        </div>

        <div className="overflow-x-auto max-h-80">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <th className="py-2.5 px-4">{t.date} / Time</th>
                <th className="py-2.5 px-4">{t.category}</th>
                <th className="py-2.5 px-4">Action</th>
                <th className="py-2.5 px-4">{t.description}</th>
                <th className="py-2.5 px-4 text-right">User</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-2 px-4 font-mono text-[11px] text-slate-500">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="py-2 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200">
                      {log.category}
                    </span>
                  </td>
                  <td className="py-2 px-4 font-semibold text-slate-900">
                    {log.action}
                  </td>
                  <td className="py-2 px-4 text-slate-600 text-[11px]">
                    {log.description}
                  </td>
                  <td className="py-2 px-4 font-mono text-slate-500 text-right">
                    {log.adminUser}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

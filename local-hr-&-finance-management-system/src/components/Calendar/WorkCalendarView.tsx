import React, { useState } from 'react';
import {
  CalendarDays,
  Clock,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Save,
  Coffee,
  Sun,
  Moon
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { translations } from '../../locales/translations';

export const WorkCalendarView: React.FC = () => {
  const {
    language,
    companySettings,
    updateCompanySettings,
    holidays,
    addHoliday,
    deleteHoliday
  } = useApp();
  const t = translations[language];

  const [scheduleConfig, setScheduleConfig] = useState(companySettings.scheduleConfig);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // New Holiday modal
  const [isHolidayModalOpen, setIsHolidayModalOpen] = useState(false);
  const [newHoliday, setNewHoliday] = useState({
    nameKhmer: '',
    nameEnglish: '',
    date: new Date().toISOString().slice(0, 10),
    isRecurring: true,
  });

  const daysOfWeek = [
    { num: 1, labelKm: 'ចន្ទ (Mon)', labelEn: 'Monday' },
    { num: 2, labelKm: 'អង្គារ (Tue)', labelEn: 'Tuesday' },
    { num: 3, labelKm: 'ពុធ (Wed)', labelEn: 'Wednesday' },
    { num: 4, labelKm: 'ព្រហស្បតិ៍ (Thu)', labelEn: 'Thursday' },
    { num: 5, labelKm: 'សុក្រ (Fri)', labelEn: 'Friday' },
    { num: 6, labelKm: 'សៅរ៍ (Sat)', labelEn: 'Saturday' },
    { num: 0, labelKm: 'អាទិត្យ (Sun)', labelEn: 'Sunday' },
  ];

  const handleToggleDay = (dayNum: number) => {
    setScheduleConfig((prev) => {
      const exists = prev.workingDays.includes(dayNum);
      const updated = exists
        ? prev.workingDays.filter((d) => d !== dayNum)
        : [...prev.workingDays, dayNum];
      return { ...prev, workingDays: updated };
    });
  };

  const handleSaveSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    updateCompanySettings({ scheduleConfig });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleAddHolidaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHoliday.nameKhmer.trim()) return;
    addHoliday(newHoliday);
    setNewHoliday({
      nameKhmer: '',
      nameEnglish: '',
      date: new Date().toISOString().slice(0, 10),
      isRecurring: true,
    });
    setIsHolidayModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">{t.workCalendar}</h2>
              <p className="text-xs text-slate-500">
                {language === 'km'
                  ? 'កំណត់ថ្ងៃធ្វើការ វេនម៉ោង និងថ្ងៃឈប់សម្រាកបុណ្យជាតិ'
                  : 'Configure standard shifts, working days, and national holidays'}
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsHolidayModalOpen(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>{t.addHoliday}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Working Days & Shift Configuration Form */}
        <form onSubmit={handleSaveSchedule} className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-600" />
              <span>{t.workingHours} & {t.workingDays}</span>
            </h3>
            {saveSuccess && (
              <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {t.success}
              </span>
            )}
          </div>

          {/* Working Days of Week */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              {t.workingDays} ({language === 'km' ? 'លំនាំដើម៖ ចន្ទ ដល់ សៅរ៍' : 'Default: Monday - Saturday'})
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {daysOfWeek.map((d) => {
                const isChecked = scheduleConfig.workingDays.includes(d.num);
                return (
                  <button
                    key={d.num}
                    type="button"
                    onClick={() => handleToggleDay(d.num)}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold text-center transition-all cursor-pointer border ${
                      isChecked
                        ? 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100'
                    }`}
                  >
                    {language === 'km' ? d.labelKm : d.labelEn}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Shift Time Configuration */}
          <div className="space-y-3 pt-2">
            {/* Morning Shift */}
            <div className="p-3 bg-amber-50/50 border border-amber-200/60 rounded-lg">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-900 mb-2">
                <Sun className="w-4 h-4 text-amber-600" />
                <span>{t.morningShift} (07:00 - 11:00)</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-600 mb-1">{t.checkIn}</label>
                  <input
                    type="time"
                    value={scheduleConfig.morningStart}
                    onChange={(e) => setScheduleConfig({ ...scheduleConfig, morningStart: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-600 mb-1">{t.checkOut}</label>
                  <input
                    type="time"
                    value={scheduleConfig.morningEnd}
                    onChange={(e) => setScheduleConfig({ ...scheduleConfig, morningEnd: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Lunch Break */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 mb-2">
                <Coffee className="w-4 h-4 text-slate-600" />
                <span>{t.lunchBreak} (11:00 - 13:00)</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-600 mb-1">{language === 'km' ? 'ចាប់ផ្តើមសម្រាក' : 'Start Break'}</label>
                  <input
                    type="time"
                    value={scheduleConfig.lunchStart}
                    onChange={(e) => setScheduleConfig({ ...scheduleConfig, lunchStart: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-600 mb-1">{language === 'km' ? 'ចប់ការសម្រាក' : 'End Break'}</label>
                  <input
                    type="time"
                    value={scheduleConfig.lunchEnd}
                    onChange={(e) => setScheduleConfig({ ...scheduleConfig, lunchEnd: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Afternoon Shift */}
            <div className="p-3 bg-indigo-50/50 border border-indigo-200/60 rounded-lg">
              <div className="flex items-center gap-2 text-xs font-bold text-indigo-900 mb-2">
                <Moon className="w-4 h-4 text-indigo-600" />
                <span>{t.afternoonShift} (13:00 - 17:00)</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-600 mb-1">{t.checkIn}</label>
                  <input
                    type="time"
                    value={scheduleConfig.afternoonStart}
                    onChange={(e) => setScheduleConfig({ ...scheduleConfig, afternoonStart: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-600 mb-1">{t.checkOut}</label>
                  <input
                    type="time"
                    value={scheduleConfig.afternoonEnd}
                    onChange={(e) => setScheduleConfig({ ...scheduleConfig, afternoonEnd: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-xs font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {language === 'km' ? 'ម៉ោងការងារស្តង់ដារប្រចាំថ្ងៃ' : 'Standard Daily Hours'}
              </label>
              <input
                type="number"
                min={1}
                max={24}
                value={scheduleConfig.standardDailyHours}
                onChange={(e) => setScheduleConfig({ ...scheduleConfig, standardDailyHours: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {language === 'km' ? 'មេគុណប្រាក់ថែមម៉ោង (OT Multiplier)' : 'OT Hourly Multiplier'}
              </label>
              <input
                type="number"
                step="0.1"
                min={1}
                value={scheduleConfig.overtimeMultiplier}
                onChange={(e) => setScheduleConfig({ ...scheduleConfig, overtimeMultiplier: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-100">
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{t.save}</span>
            </button>
          </div>
        </form>

        {/* Public Holidays & Rest Days List */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-emerald-600" />
                <span>{t.holidays}</span>
              </h3>
              <span className="text-xs text-slate-500">
                {holidays.length} {language === 'km' ? 'ថ្ងៃបុណ្យ' : 'holidays configured'}
              </span>
            </div>

            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {holidays.map((h) => (
                <div
                  key={h.id}
                  className="p-3 bg-slate-50 hover:bg-slate-100/70 rounded-lg border border-slate-200/70 flex items-center justify-between transition-colors text-xs"
                >
                  <div>
                    <div className="font-semibold text-slate-800">{h.nameKhmer}</div>
                    <div className="text-[11px] text-slate-500">{h.nameEnglish}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-1 bg-white border border-slate-200 rounded text-slate-700 font-mono font-medium text-[11px]">
                      {h.date}
                    </span>
                    <button
                      onClick={() => deleteHoliday(h.id)}
                      className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors"
                      title={t.delete}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
              {holidays.length === 0 && (
                <div className="text-center py-8 text-xs text-slate-400">
                  {language === 'km' ? 'មិនទាន់មានថ្ងៃបុណ្យដែលបានកំណត់' : 'No holidays configured'}
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 p-3 bg-indigo-50/70 border border-indigo-200/60 rounded-lg text-xs text-indigo-900 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              {language === 'km'
                ? 'ថ្ងៃឈប់សម្រាកប្រចាំសប្តាហ៍ និងថ្ងៃបុណ្យជាតិ មិនត្រូវបានចាត់ទុកជាការអវត្តមានដោយស្វ័យប្រវត្តិឡើយ។'
                : 'Scheduled rest days and national holidays are never automatically classified as absences.'}
            </p>
          </div>
        </div>
      </div>

      {/* Add Holiday Modal */}
      {isHolidayModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-4">{t.addHoliday}</h3>
            <form onSubmit={handleAddHolidaySubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t.holidayNameKhmer} *
                </label>
                <input
                  type="text"
                  required
                  value={newHoliday.nameKhmer}
                  onChange={(e) => setNewHoliday({ ...newHoliday, nameKhmer: e.target.value })}
                  placeholder="ឧ. ពិធីបុណ្យភ្ជុំបិណ្ឌ"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t.holidayNameEnglish}
                </label>
                <input
                  type="text"
                  value={newHoliday.nameEnglish}
                  onChange={(e) => setNewHoliday({ ...newHoliday, nameEnglish: e.target.value })}
                  placeholder="e.g. Pchum Ben Festival"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t.date} *
                </label>
                <input
                  type="date"
                  required
                  value={newHoliday.date}
                  onChange={(e) => setNewHoliday({ ...newHoliday, date: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsHolidayModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer"
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

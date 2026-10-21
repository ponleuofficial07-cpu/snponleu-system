import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar, ActiveTab } from './components/Navigation/Sidebar';
import { Header } from './components/Navigation/Header';
import { AuthGate } from './components/Auth/AuthGate';
import { DashboardView } from './components/Dashboard/DashboardView';
import { EmployeesView } from './components/Employees/EmployeesView';
import { WorkCalendarView } from './components/Calendar/WorkCalendarView';
import { AttendanceView } from './components/Attendance/AttendanceView';
import { PayrollView } from './components/Payroll/PayrollView';
import { PayslipsView } from './components/Payslips/PayslipsView';
import { IncomeView } from './components/Income/IncomeView';
import { ExpensesView } from './components/Expenses/ExpensesView';
import { FinancialReportsView } from './components/Reports/FinancialReportsView';
import { SettingsView } from './components/Settings/SettingsView';
import { BackupRestoreView } from './components/Backup/BackupRestoreView';
import { MacOsDeployView } from './components/MacOsDeploy/MacOsDeployView';

const MainLayout: React.FC = () => {
  const { isAuthenticated } = useApp();
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedPayslipEmp, setSelectedPayslipEmp] = useState<string | undefined>(undefined);

  if (!isAuthenticated) {
    return <AuthGate />;
  }

  const handleNavigateToPayslips = (employeeId?: string) => {
    setSelectedPayslipEmp(employeeId);
    setActiveTab('payslips');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpen={isSidebarOpen}
        onCloseMobile={() => setIsSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-68">
        <Header
          activeTab={activeTab}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && <DashboardView onNavigate={setActiveTab} />}
          {activeTab === 'employees' && <EmployeesView />}
          {activeTab === 'calendar' && <WorkCalendarView />}
          {activeTab === 'attendance' && <AttendanceView />}
          {activeTab === 'payroll' && (
            <PayrollView onNavigateToPayslips={handleNavigateToPayslips} />
          )}
          {activeTab === 'payslips' && (
            <PayslipsView initialEmployeeId={selectedPayslipEmp} />
          )}
          {activeTab === 'income' && <IncomeView />}
          {activeTab === 'expenses' && <ExpensesView />}
          {activeTab === 'reports' && <FinancialReportsView />}
          {activeTab === 'settings' && <SettingsView />}
          {activeTab === 'backup' && <BackupRestoreView />}
          {activeTab === 'macos' && <MacOsDeployView />}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}

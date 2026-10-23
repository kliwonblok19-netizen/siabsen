import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { ToastContainer } from './components/ToastContainer';
import { DashboardAdmin } from './components/DashboardAdmin';
import { DashboardWaliKelas } from './components/DashboardWaliKelas';
import { DashboardGuru } from './components/DashboardGuru';
import { AttendanceEntry } from './components/AttendanceEntry';
import { ReportsView } from './components/ReportsView';
import { MasterDataView } from './components/MasterDataView';
import { UserManagementView } from './components/UserManagementView';
import { AuditLogView } from './components/AuditLogView';
import { ArchitectureDocsView } from './components/ArchitectureDocsView';
import { SettingsView } from './components/SettingsView';
import { StudentDetailModal } from './components/StudentDetailModal';
import { BackupRestoreModal } from './components/BackupRestoreModal';
import { StudentTransferModal } from './components/StudentTransferModal';
import { SystemTestRunnerModal } from './components/SystemTestRunnerModal';
import { LoginModal } from './components/LoginModal';
import { LoginPage } from './components/LoginPage';
import { DashboardSekretaris } from './components/DashboardSekretaris';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Student } from './types';
import { Menu } from 'lucide-react';

const AuthenticatedApp: React.FC = () => {
  const { currentUser } = useApp();
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [showQAStatsModal, setShowQAStatsModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [selectedStudentDetail, setSelectedStudentDetail] = useState<Student | null>(null);
  const [transferStudentTarget, setTransferStudentTarget] = useState<Student | null>(null);

  // Quick params for AttendanceEntry when clicked from schedule
  const [attendanceParams, setAttendanceParams] = useState<{ rId?: string; sId?: string }>({});

  const handleStartAttendanceFromSchedule = (schId?: string, rombelId?: string, subjectId?: string) => {
    if (currentUser.role === 'sekretaris') {
      setCurrentTab('dashboard');
      return;
    }
    setAttendanceParams({ rId: rombelId, sId: subjectId });
    setCurrentTab('attendance');
  };

  const renderActiveView = () => {
    switch (currentTab) {
      case 'dashboard':
        if (currentUser.role === 'admin') {
          return <DashboardAdmin onNavigateTab={setCurrentTab} />;
        } else if (currentUser.role === 'wali_kelas') {
          return (
            <DashboardWaliKelas
              onNavigateTab={setCurrentTab}
              onOpenStudentDetail={setSelectedStudentDetail}
            />
          );
        } else if (currentUser.role === 'sekretaris') {
          return (
            <DashboardSekretaris
              onNavigateTab={setCurrentTab}
              onOpenStudentDetail={setSelectedStudentDetail}
            />
          );
        } else {
          return (
            <DashboardGuru
              onStartAttendance={handleStartAttendanceFromSchedule}
              onNavigateTab={setCurrentTab}
            />
          );
        }

      case 'corrections':
        if (currentUser.role === 'sekretaris') {
          return (
            <DashboardSekretaris
              onNavigateTab={setCurrentTab}
              onOpenStudentDetail={setSelectedStudentDetail}
            />
          );
        }
        return <DashboardWaliKelas onNavigateTab={setCurrentTab} onOpenStudentDetail={setSelectedStudentDetail} />;

      case 'attendance':
        if (currentUser.role === 'sekretaris') {
          return (
            <DashboardSekretaris
              onNavigateTab={setCurrentTab}
              onOpenStudentDetail={setSelectedStudentDetail}
            />
          );
        }
        return (
          <AttendanceEntry
            initialRombelId={attendanceParams.rId}
            initialSubjectId={attendanceParams.sId}
            onBackToDashboard={() => setCurrentTab('dashboard')}
          />
        );

      case 'homeroom':
        return (
          <DashboardWaliKelas
            onNavigateTab={setCurrentTab}
            onOpenStudentDetail={setSelectedStudentDetail}
          />
        );

      case 'reports':
        return <ReportsView />;

      case 'master':
        return currentUser.role === 'admin' ? (
          <MasterDataView onOpenTransferModal={(st) => setTransferStudentTarget(st)} />
        ) : (
          <DashboardGuru
            onStartAttendance={handleStartAttendanceFromSchedule}
            onNavigateTab={setCurrentTab}
          />
        );

      case 'users':
        return currentUser.role === 'admin' ? (
          <UserManagementView />
        ) : (
          <DashboardAdmin onNavigateTab={setCurrentTab} />
        );

      case 'audit':
        return currentUser.role === 'admin' ? (
          <AuditLogView />
        ) : (
          <DashboardAdmin onNavigateTab={setCurrentTab} />
        );

      case 'schema':
        return <ArchitectureDocsView />;

      case 'settings':
        return currentUser.role === 'admin' ? (
          <SettingsView />
        ) : (
          <DashboardAdmin onNavigateTab={setCurrentTab} />
        );

      default:
        return <DashboardAdmin onNavigateTab={setCurrentTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Bar adhering to Top Bar Contract */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onOpenBackupModal={() => setShowBackupModal(true)}
        onOpenQAStatsModal={() => setShowQAStatsModal(true)}
        onOpenLoginModal={() => setShowLoginModal(true)}
      />

      {/* Mobile Top Bar Action */}
      <div className="lg:hidden no-print px-4 py-2.5 bg-white border-b border-slate-200 flex items-center justify-between">
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="flex items-center gap-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg"
        >
          <Menu className="w-4 h-4 text-slate-600" />
          <span>Menu Navigasi</span>
        </button>
        <span className="text-xs font-medium text-slate-500 capitalize">
          Peran: {currentUser.role.replace('_', ' ')}
        </span>
      </div>

      {/* Main Layout Area */}
      <div className="flex-1 max-w-7xl w-full mx-auto flex">
        {/* Responsive Sidebar */}
        <Sidebar
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
          mobileOpen={mobileMenuOpen}
          setMobileOpen={setMobileMenuOpen}
        />

        {/* Content Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 overflow-y-auto">
          {renderActiveView()}
        </main>
      </div>

      {/* Modals & Overlays */}
      <StudentDetailModal
        student={selectedStudentDetail}
        onClose={() => setSelectedStudentDetail(null)}
      />

      <StudentTransferModal
        student={transferStudentTarget}
        onClose={() => setTransferStudentTarget(null)}
      />

      <BackupRestoreModal
        isOpen={showBackupModal}
        onClose={() => setShowBackupModal(false)}
      />

      <SystemTestRunnerModal
        isOpen={showQAStatsModal}
        onClose={() => setShowQAStatsModal(false)}
      />

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />

      <ToastContainer />
    </div>
  );
};

const MainContent: React.FC = () => {
  const { isAuthenticated } = useApp();

  if (!isAuthenticated) {
    return (
      <>
        <LoginPage />
        <ToastContainer />
      </>
    );
  }

  return <AuthenticatedApp />;
};

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <MainContent />
      </AppProvider>
    </ErrorBoundary>
  );
}

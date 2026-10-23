import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  GraduationCap, 
  UserCheck, 
  ShieldCheck, 
  BookOpen, 
  ChevronDown, 
  Database, 
  RotateCcw,
  Sparkles,
  School,
  LogOut
} from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onOpenBackupModal: () => void;
  onOpenQAStatsModal: () => void;
  onOpenLoginModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  currentTab, 
  setCurrentTab, 
  onOpenBackupModal,
  onOpenQAStatsModal,
  onOpenLoginModal
}) => {
  const { currentUser, users, switchUser, settings, activeAcademicYear, resetDatabase, logout } = useApp();
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return { label: 'Administrator', icon: ShieldCheck, color: 'text-rose-600 bg-rose-50 border-rose-200' };
      case 'wali_kelas':
        return { label: 'Wali Kelas', icon: UserCheck, color: 'text-blue-600 bg-blue-50 border-blue-200' };
      case 'sekretaris':
        return { label: 'Sekretaris Kelas', icon: UserCheck, color: 'text-amber-700 bg-amber-50 border-amber-200' };
      default:
        return { label: 'Guru Mata Pelajaran', icon: BookOpen, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' };
    }
  };

  const badge = getRoleBadge(currentUser.role);
  const IconComponent = badge.icon;

  return (
    <>
      <header className="no-print bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-8 h-16">
            
            {/* Zone 1: Brand Title, One line */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold shadow-xs">
                <School className="w-5 h-5 text-indigo-400" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-base text-slate-900 tracking-tight whitespace-nowrap leading-tight">
                  Sistem Informasi Absensi SMK
                </span>
                <span className="text-xs text-slate-500 whitespace-nowrap truncate max-w-[200px] sm:max-w-xs">
                  {settings.schoolName} · TP {activeAcademicYear.name} ({activeAcademicYear.semester})
                </span>
              </div>
            </div>

            {/* Zone 2: Navigation Links (single line, concise) */}
            <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-600">
              <button
                onClick={() => setCurrentTab('dashboard')}
                className={`transition-colors whitespace-nowrap pb-1 border-b-2 ${
                  currentTab === 'dashboard'
                    ? 'border-indigo-600 text-slate-900 font-semibold'
                    : 'border-transparent hover:text-slate-900'
                }`}
              >
                {currentUser.role === 'sekretaris' ? 'Dashboard Pemantauan' : 'Dashboard'}
              </button>
              {currentUser.role !== 'sekretaris' && (
                <button
                  onClick={() => setCurrentTab('attendance')}
                  className={`transition-colors whitespace-nowrap pb-1 border-b-2 ${
                    currentTab === 'attendance'
                      ? 'border-indigo-600 text-slate-900 font-semibold'
                      : 'border-transparent hover:text-slate-900'
                  }`}
                >
                  Presensi Kelas
                </button>
              )}
              {(currentUser.role === 'admin' || currentUser.role === 'wali_kelas') && (
                <button
                  onClick={() => setCurrentTab('homeroom')}
                  className={`transition-colors whitespace-nowrap pb-1 border-b-2 ${
                    currentTab === 'homeroom'
                      ? 'border-indigo-600 text-slate-900 font-semibold'
                      : 'border-transparent hover:text-slate-900'
                  }`}
                >
                  Monitoring Wali Kelas
                </button>
              )}
              <button
                onClick={() => setCurrentTab('reports')}
                className={`transition-colors whitespace-nowrap pb-1 border-b-2 ${
                  currentTab === 'reports'
                    ? 'border-indigo-600 text-slate-900 font-semibold'
                    : 'border-transparent hover:text-slate-900'
                }`}
              >
                {currentUser.role === 'sekretaris' ? 'Laporan Kelas' : 'Laporan & Rekap'}
              </button>
              {currentUser.role === 'admin' && (
                <button
                  onClick={() => setCurrentTab('master')}
                  className={`transition-colors whitespace-nowrap pb-1 border-b-2 ${
                    currentTab === 'master'
                      ? 'border-indigo-600 text-slate-900 font-semibold'
                      : 'border-transparent hover:text-slate-900'
                  }`}
                >
                  Data Master
                </button>
              )}
              {currentUser.role !== 'sekretaris' && (
                <button
                  onClick={() => setCurrentTab('schema')}
                  className={`transition-colors whitespace-nowrap pb-1 border-b-2 ${
                    currentTab === 'schema'
                      ? 'border-indigo-600 text-slate-900 font-semibold'
                      : 'border-transparent hover:text-slate-900'
                  }`}
                >
                  ERD & Laravel
                </button>
              )}
            </nav>

            {/* Zone 3: 1 Primary Action (User Profile & Role Switcher) */}
            <div className="flex items-center gap-3 shrink-0 relative">
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors text-left"
                aria-expanded={showUserDropdown}
              >
                <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
                  {currentUser.name.charAt(0)}
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-semibold text-slate-900 leading-tight truncate max-w-[130px]">
                    {currentUser.name}
                  </span>
                  <span className="text-[11px] text-slate-500 flex items-center gap-1">
                    <IconComponent className="w-3 h-3 text-slate-400" />
                    {badge.label}
                  </span>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
              </button>

              {/* User Switcher Dropdown */}
              {showUserDropdown && (
                <div className="absolute right-0 top-12 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Ganti Akun Demo Pengujian
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Uji otorisasi sesuai peran Admin, Wali Kelas, dan Guru
                    </p>
                  </div>
                  
                  <div className="max-h-60 overflow-y-auto py-1">
                    {users.map(u => {
                      const uBadge = getRoleBadge(u.role);
                      const UIcon = uBadge.icon;
                      const isCurrent = u.id === currentUser.id;
                      return (
                        <button
                          key={u.id}
                          onClick={() => {
                            switchUser(u.id);
                            setShowUserDropdown(false);
                          }}
                          className={`w-full text-left px-4 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${
                            isCurrent ? 'bg-indigo-50/70' : ''
                          }`}
                        >
                          <div className="flex flex-col truncate">
                            <span className={`font-medium ${isCurrent ? 'text-indigo-900 font-semibold' : 'text-slate-800'}`}>
                              {u.name}
                            </span>
                            <span className="text-[11px] text-slate-500">
                              {u.email}
                            </span>
                          </div>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0 ml-2 ${uBadge.color}`}>
                            {u.role === 'admin' ? 'Admin' : u.role === 'wali_kelas' ? 'Wali Kelas' : u.role === 'sekretaris' ? 'Sekretaris' : 'Guru'}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                    <button
                      onClick={() => {
                        setShowUserDropdown(false);
                        onOpenLoginModal();
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs text-indigo-700 hover:bg-indigo-50 rounded-lg flex items-center gap-2 font-medium"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      Login Password & Proteksi
                    </button>
                    <button
                      onClick={() => {
                        setShowUserDropdown(false);
                        onOpenQAStatsModal();
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs text-emerald-700 hover:bg-emerald-50 rounded-lg flex items-center gap-2 font-medium"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      Uji Sistem (25 Skenario QA & Sekretaris)
                    </button>
                    <button
                      onClick={() => {
                        setShowUserDropdown(false);
                        onOpenBackupModal();
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 rounded-lg flex items-center gap-2"
                    >
                      <Database className="w-3.5 h-3.5 text-slate-500" />
                      Cadangkan & Pulihkan Database
                    </button>
                    <button
                      onClick={() => {
                        setShowUserDropdown(false);
                        setShowResetConfirm(true);
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-lg flex items-center gap-2"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-rose-500" />
                      Hapus Semua Data Demo
                    </button>
                    
                    <div className="border-t border-slate-100 mt-2 pt-1.5">
                      <button
                        onClick={() => {
                          setShowUserDropdown(false);
                          logout();
                        }}
                        className="w-full text-left px-3 py-2 text-xs text-rose-700 bg-rose-50/50 hover:bg-rose-50 rounded-lg flex items-center gap-2 font-semibold transition-colors"
                      >
                        <LogOut className="w-4 h-4 text-rose-600" />
                        <span>Keluar / Logout dari Sistem</span>
                      </button>
                    </div>
                </div>
              )}
            </div>

            <button
              onClick={() => logout()}
              title="Keluar dari Aplikasi (Logout)"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors text-xs font-semibold shrink-0"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-600" />
              <span className="hidden md:inline">Keluar</span>
            </button>

          </div>
        </div>
      </header>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900">Hapus Semua Data Demo?</h3>
            <p className="text-sm text-slate-600 mt-2">
              Tindakan ini akan mengosongkan seluruh data demo (siswa, guru, kelas, jadwal, dan riwayat presensi) sehingga database sistem absensi menjadi bersih untuk input data sekolah riil.
            </p>
            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  resetDatabase();
                  setShowResetConfirm(false);
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors"
              >
                Ya, Hapus Semua Data Demo
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

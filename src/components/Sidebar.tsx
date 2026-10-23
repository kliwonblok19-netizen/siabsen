import React from 'react';
import { useApp } from '../context/AppContext';
import {
  LayoutDashboard,
  ClipboardCheck,
  Users,
  FileSpreadsheet,
  Database,
  ShieldCheck,
  History,
  FileCode2,
  Settings,
  Calendar,
  Layers,
  GraduationCap,
  LogOut
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  mobileOpen,
  setMobileOpen
}) => {
  const { currentUser, rombels, logout } = useApp();

  // Find homeroom class if user is homeroom teacher
  const homeroomClass = rombels.find(r => r.homeroomTeacherId === currentUser.teacherId);

  const navItems = [
    {
      id: 'dashboard',
      label: currentUser.role === 'sekretaris' ? 'Dashboard Pemantauan' : 'Dashboard',
      icon: LayoutDashboard,
      roles: ['admin', 'wali_kelas', 'guru', 'sekretaris']
    },
    {
      id: 'attendance',
      label: 'Presensi Pertemuan',
      icon: ClipboardCheck,
      roles: ['admin', 'wali_kelas', 'guru'],
      kicker: currentUser.role === 'guru' ? 'Catat Sesi' : undefined
    },
    {
      id: 'corrections',
      label: 'Pengajuan Koreksi',
      icon: FileCode2,
      roles: ['sekretaris'],
      kicker: 'Wali Kelas'
    },
    {
      id: 'homeroom',
      label: 'Monitoring Wali Kelas',
      icon: Users,
      roles: ['admin', 'wali_kelas'],
      kicker: currentUser.role === 'wali_kelas' && homeroomClass ? homeroomClass.name : undefined
    },
    {
      id: 'reports',
      label: currentUser.role === 'sekretaris' ? 'Laporan Kelas Saya' : 'Laporan & Rekap',
      icon: FileSpreadsheet,
      roles: ['admin', 'wali_kelas', 'guru', 'sekretaris']
    },
    {
      id: 'master',
      label: 'Data Master',
      icon: Database,
      roles: ['admin']
    },
    {
      id: 'users',
      label: 'Pengguna & Akses',
      icon: ShieldCheck,
      roles: ['admin']
    },
    {
      id: 'audit',
      label: 'Audit Log & Riwayat',
      icon: History,
      roles: ['admin']
    },
    {
      id: 'schema',
      label: 'ERD & Laravel Code',
      icon: FileCode2,
      roles: ['admin', 'wali_kelas', 'guru']
    },
    {
      id: 'settings',
      label: 'Pengaturan Sekolah',
      icon: Settings,
      roles: ['admin']
    }
  ];

  const allowedItems = navItems.filter(item => item.roles.includes(currentUser.role));

  const handleSelect = (id: string) => {
    setCurrentTab(id);
    setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden no-print"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`no-print fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Navigation List */}
        <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Menu Navigasi
          </div>
          {allowedItems.map(item => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-slate-900 text-white font-semibold shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.kicker && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                    isActive ? 'bg-slate-800 text-indigo-300' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {item.kicker}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* User Card at bottom of sidebar */}
        <div className="p-3 border-t border-slate-200 bg-slate-50 space-y-2">
          <div className="flex items-center justify-between px-2 py-1">
            <div className="flex items-center gap-2.5 truncate">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                {currentUser.name.charAt(0)}
              </div>
              <div className="flex flex-col truncate">
                <span className="text-xs font-semibold text-slate-900 truncate">
                  {currentUser.name}
                </span>
                <span className="text-[10px] text-slate-500 capitalize">
                  {currentUser.role.replace('_', ' ')}
                </span>
              </div>
            </div>
            <button
              onClick={() => {
                if (confirm('Keluar dari sesi sistem absensi?')) {
                  logout();
                }
              }}
              title="Keluar (Logout)"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

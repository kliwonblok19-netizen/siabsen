import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  KeyRound, 
  ShieldAlert, 
  UserCheck, 
  BookOpen, 
  GraduationCap, 
  Lock, 
  User as UserIcon, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  CheckCircle2, 
  School,
  Database,
  Info
} from 'lucide-react';
import { UserRole } from '../types';

export const LoginPage: React.FC = () => {
  const { authenticateUser, loginAsRole, settings, activeAcademicYear, users, switchUser } = useApp();
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    const result = await authenticateUser(usernameOrEmail, password);
    setLoading(false);

    if (!result.success) {
      setErrorMessage(result.message);
    }
  };

  const handleQuickFill = (u: string, p: string) => {
    setUsernameOrEmail(u);
    setPassword(p);
    setErrorMessage(null);
  };

  const nonAdminUsers = users.filter(u => u.role !== 'admin');

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
      {/* Top Notification / Identity Bar */}
      <div className="border-b border-slate-800 bg-slate-950/70 backdrop-blur-md px-4 py-3">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-semibold text-white">{settings.schoolName}</span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-400">NPSN: {settings.schoolNpsn}</span>
          </div>
          <div className="flex items-center gap-3 text-slate-400 text-[11px]">
            <span>Tahun Ajaran {activeAcademicYear.name} ({activeAcademicYear.semester})</span>
            <span className="bg-slate-800 border border-slate-700 text-slate-300 px-2 py-0.5 rounded font-mono">
              Kurikulum Merdeka SMK
            </span>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-12">
        <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Column: Brand & 4 Role Capabilities */}
          <div className="lg:col-span-7 space-y-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
                <School className="w-3.5 h-3.5" />
                Portal Presensi & Absensi Terpadu 8 Jurusan SMK
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                Sistem Informasi Absensi Siswa SMK
              </h1>
              <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-xl">
                Aplikasi absensi real-time berbasis rombongan belajar untuk 4 hak akses peran: 
                <span className="text-slate-200 font-medium"> Administrator</span>, 
                <span className="text-slate-200 font-medium"> Guru Mata Pelajaran</span>, 
                <span className="text-slate-200 font-medium"> Wali Kelas</span>, dan 
                <span className="text-slate-200 font-medium"> Sekretaris Kelas</span>.
              </p>
            </div>

            {/* 4 Role Cards Preview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 hover:border-slate-600 transition-colors">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-white">Administrator</span>
                  </div>
                  <span className="text-[10px] bg-rose-500/20 text-rose-300 px-1.5 py-0.5 rounded font-mono">Full Access</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Kelola Data Master, Ekspor-Impor Rombel (X DKV 1-3, DPIB, dll), Siswa, Guru, Backup & Restore.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 hover:border-slate-600 transition-colors">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center">
                      <UserCheck className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-white">Wali Kelas</span>
                  </div>
                  <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded font-mono">Rombel Khusus</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Monitoring kehadiran seluruh mapel rombel, rekap bulanan/semester, verifikasi koreksi absensi.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 hover:border-slate-600 transition-colors">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-white">Guru Mata Pelajaran</span>
                  </div>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-mono">Sesuai Jadwal</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Input presensi jam pelajaran, penguncian sesi otomatis, dan peninjauan pengajuan koreksi siswa.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 hover:border-slate-600 transition-colors">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                      <GraduationCap className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-white">Sekretaris Kelas</span>
                  </div>
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-mono">Siswa Bertugas</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Terisolasi pada rombel sendiri, pantau rekap teman sekelas, ajukan koreksi dengan bukti resmi.
                </p>
              </div>
            </div>

            {/* School Vocational Tags */}
            <div className="pt-1">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                8 Kompetensi Keahlian SMK:
              </span>
              <div className="flex flex-wrap gap-1.5 text-[10px] font-mono text-slate-400">
                <span className="px-2 py-1 bg-slate-800 border border-slate-700 rounded">DKV</span>
                <span className="px-2 py-1 bg-slate-800 border border-slate-700 rounded">DPIB</span>
                <span className="px-2 py-1 bg-slate-800 border border-slate-700 rounded">TKP</span>
                <span className="px-2 py-1 bg-slate-800 border border-slate-700 rounded">TOI</span>
                <span className="px-2 py-1 bg-slate-800 border border-slate-700 rounded">TITL</span>
                <span className="px-2 py-1 bg-slate-800 border border-slate-700 rounded">TAV</span>
                <span className="px-2 py-1 bg-slate-800 border border-slate-700 rounded">TSM</span>
                <span className="px-2 py-1 bg-slate-800 border border-slate-700 rounded">TKR</span>
              </div>
            </div>
          </div>

          {/* Right Column: Login Card & Fast Testing Buttons */}
          <div className="lg:col-span-5">
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
              
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-white">Masuk ke Akun</h2>
                <p className="text-xs text-slate-400">
                  Gunakan username/email dinas dan password yang terdaftar.
                </p>
              </div>

              {/* Error Message */}
              {errorMessage && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-start gap-2.5">
                  <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="font-semibold text-slate-300 block mb-1.5">
                    Username atau Email
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      value={usernameOrEmail}
                      onChange={e => setUsernameOrEmail(e.target.value)}
                      placeholder="cth: admin atau siti.wali"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="font-semibold text-slate-300 block">
                      Password
                    </label>
                    <span className="text-[10px] text-slate-400">Default Admin: admin123</span>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-10 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-slate-500 hover:text-slate-300"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-900/50 rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? 'Memverifikasi...' : 'Masuk ke Sistem'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              {/* Fast 1-Click Role Login */}
              <div className="pt-4 border-t border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300">
                    Akses Cepat Pengujian:
                  </span>
                  <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded font-mono">
                    {nonAdminUsers.length === 0 ? 'Database Bersih' : `${users.length} Akun Aktif`}
                  </span>
                </div>

                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => {
                      handleQuickFill('admin', 'admin123');
                      loginAsRole('admin');
                    }}
                    className="w-full p-2.5 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-rose-500/50 text-left transition-all group flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white group-hover:text-rose-400 transition-colors text-xs">
                          Administrator Utama
                        </span>
                        <span className="text-[10px] bg-rose-500/20 text-rose-300 px-1.5 py-0.2 rounded font-mono">
                          admin / admin123
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 block mt-0.5">
                        Akses penuh pengelolaan master data, kelas, guru, dan backup
                      </span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-rose-400 group-hover:translate-x-1 transition-all shrink-0 ml-2" />
                  </button>

                  {nonAdminUsers.map(u => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => switchUser(u.id)}
                      className="w-full p-2 rounded-xl bg-slate-900/60 hover:bg-slate-850 border border-slate-800 hover:border-indigo-500/50 text-left transition-all group flex items-center justify-between text-xs"
                    >
                      <div className="truncate">
                        <span className="font-semibold text-slate-200 group-hover:text-indigo-400 block truncate">
                          {u.name}
                        </span>
                        <span className="text-[10px] text-slate-500 capitalize">
                          {u.role.replace('_', ' ')} · {u.username}
                        </span>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-indigo-400 shrink-0 ml-2" />
                    </button>
                  ))}

                  {nonAdminUsers.length === 0 && (
                    <div className="p-3 bg-slate-900/60 border border-slate-800/60 rounded-xl text-[11px] text-slate-400 flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>
                        Semua data demo telah dibersihkan. Silakan masuk sebagai Administrator untuk menambahkan guru, rombel, dan siswa sekolah.
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-1">
                  <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>Sistem dilengkapi proteksi lockout akun setelah 5x kesalahan kata sandi.</span>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* Bottom Footer */}
      <div className="border-t border-slate-800 bg-slate-950/70 backdrop-blur-md px-4 py-3 text-center text-xs text-slate-500">
        <p>
          © 2026 {settings.schoolName} · Sistem Informasi Absensi SMK Terakreditasi · Dibuat untuk Efisiensi & Ketepatan Presensi Siswa
        </p>
      </div>
    </div>
  );
};

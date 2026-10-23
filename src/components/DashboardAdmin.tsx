import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Users, 
  GraduationCap, 
  BookOpen, 
  ClipboardCheck, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  Calendar,
  ArrowRight,
  TrendingUp,
  FileSpreadsheet
} from 'lucide-react';
import { calculateStudentAttendance, formatDateIndo } from '../utils/attendanceCalculations';

interface DashboardAdminProps {
  onNavigateTab: (tab: string) => void;
}

export const DashboardAdmin: React.FC<DashboardAdminProps> = ({ onNavigateTab }) => {
  const { 
    students, 
    teachers, 
    departments, 
    rombels, 
    subjects, 
    sessions, 
    records, 
    schedules, 
    auditLogs,
    activeAcademicYear 
  } = useApp();

  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('all');
  const [selectedRombelFilter, setSelectedRombelFilter] = useState<string>('all');

  // Filtered Rombels
  const availableRombels = useMemo(() => {
    if (selectedDeptFilter === 'all') return rombels;
    return rombels.filter(r => r.departmentId === selectedDeptFilter);
  }, [rombels, selectedDeptFilter]);

  // Filtered Students
  const activeStudents = useMemo(() => {
    return students.filter(s => {
      if (s.status !== 'active') return false;
      if (selectedDeptFilter !== 'all' && s.departmentId !== selectedDeptFilter) return false;
      if (selectedRombelFilter !== 'all' && s.rombelId !== selectedRombelFilter) return false;
      return true;
    });
  }, [students, selectedDeptFilter, selectedRombelFilter]);

  // Valid Completed Sessions in active academic year
  const completedSessions = useMemo(() => {
    return sessions.filter(s => {
      if (s.academicYearId !== activeAcademicYear.id) return false;
      if (s.status === 'cancelled') return false;
      if (selectedRombelFilter !== 'all' && s.rombelId !== selectedRombelFilter) return false;
      if (selectedDeptFilter !== 'all') {
        const r = rombels.find(rm => rm.id === s.rombelId);
        if (r?.departmentId !== selectedDeptFilter) return false;
      }
      return true;
    });
  }, [sessions, activeAcademicYear.id, selectedDeptFilter, selectedRombelFilter, rombels]);

  // Total records across completed sessions
  const validSessionIds = useMemo(() => new Set(completedSessions.map(s => s.id)), [completedSessions]);
  
  const relevantRecords = useMemo(() => {
    return records.filter(r => validSessionIds.has(r.sessionId));
  }, [records, validSessionIds]);

  const statsCount = useMemo(() => {
    let hadir = 0;
    let sakit = 0;
    let izin = 0;
    let alpa = 0;
    let terlambat = 0;
    let dispensasi = 0;

    relevantRecords.forEach(r => {
      if (r.status === 'H') hadir++;
      else if (r.status === 'S') sakit++;
      else if (r.status === 'I') izin++;
      else if (r.status === 'A') alpa++;
      else if (r.status === 'T') terlambat++;
      else if (r.status === 'D') dispensasi++;
    });

    const totalValid = relevantRecords.length;
    const rate = totalValid > 0 ? (hadir / totalValid) * 100 : null;

    return { hadir, sakit, izin, alpa, terlambat, dispensasi, totalValid, rate };
  }, [relevantRecords]);

  // High absence students (at least 2 Alpa or attendance < 85%)
  const highAbsenceStudents = useMemo(() => {
    return activeStudents
      .map(student => calculateStudentAttendance(student, sessions, records, { academicYearId: activeAcademicYear.id }))
      .filter(item => item.alpa >= 2 || (item.attendanceRate !== null && item.attendanceRate < 85))
      .sort((a, b) => b.alpa - a.alpa);
  }, [activeStudents, sessions, records, activeAcademicYear.id]);

  // Pending / Unrecorded sessions check today
  // Let's see if schedules on current day have corresponding sessions
  const pendingSessionsEstimate = useMemo(() => {
    // Check how many schedules exist vs how many sessions recorded this week
    return Math.max(0, schedules.length - completedSessions.length);
  }, [schedules, completedSessions]);

  return (
    <div className="space-y-6">
      {/* Page Title & Context Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Dashboard Utama Administrator
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Ringkasan kehadiran siswa SMK Negeri 1 Teknologi & Industri · TP {activeAcademicYear.name} ({activeAcademicYear.semester})
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedDeptFilter}
            onChange={e => {
              setSelectedDeptFilter(e.target.value);
              setSelectedRombelFilter('all');
            }}
            className="text-xs font-medium bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-slate-900"
          >
            <option value="all">Semua Jurusan (8 Keahlian)</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>{d.code} - {d.name}</option>
            ))}
          </select>

          <select
            value={selectedRombelFilter}
            onChange={e => setSelectedRombelFilter(e.target.value)}
            className="text-xs font-medium bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-slate-900"
          >
            <option value="all">Semua Rombel</option>
            {availableRombels.map(r => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Total Siswa Aktif</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 font-mono-tabular">
            {activeStudents.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Tersebar di {rombels.length} rombel kelas
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Guru & Tenaga Pengajar</span>
            <GraduationCap className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 font-mono-tabular">
            {teachers.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {subjects.length} mata pelajaran aktif
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Sesi Presensi Terisi</span>
            <ClipboardCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 font-mono-tabular">
            {completedSessions.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Telah tercatat per pertemuan
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Persentase Kehadiran</span>
            <TrendingUp className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 font-mono-tabular">
            {statsCount.rate !== null ? `${statsCount.rate.toFixed(1)}%` : 'Belum Ada'}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Rasio kehadiran sesi valid tercatat
          </div>
        </div>
      </div>

      {/* Attendance Metrics Breakdown */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Rincian Kehadiran Seluruh Sekolah
            </h3>
            <p className="text-xs text-slate-500">
              Berdasarkan {statsCount.totalValid} total rekaman presensi siswa dari {completedSessions.length} sesi pertemuan
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('reports')}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            Lihat Laporan Lengkap
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="border border-emerald-100 bg-emerald-50/50 rounded-lg p-3">
            <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider block">
              Hadir (H)
            </span>
            <span className="text-xl font-bold text-emerald-950 font-mono-tabular block mt-1">
              {statsCount.hadir}
            </span>
            <span className="text-[10px] text-emerald-700 block mt-0.5">
              {statsCount.totalValid > 0 ? `${((statsCount.hadir / statsCount.totalValid) * 100).toFixed(1)}%` : '0%'}
            </span>
          </div>

          <div className="border border-sky-100 bg-sky-50/50 rounded-lg p-3">
            <span className="text-[11px] font-semibold text-sky-800 uppercase tracking-wider block">
              Sakit (S)
            </span>
            <span className="text-xl font-bold text-sky-950 font-mono-tabular block mt-1">
              {statsCount.sakit}
            </span>
            <span className="text-[10px] text-sky-700 block mt-0.5">
              Surat dokter / orang tua
            </span>
          </div>

          <div className="border border-indigo-100 bg-indigo-50/50 rounded-lg p-3">
            <span className="text-[11px] font-semibold text-indigo-800 uppercase tracking-wider block">
              Izin (I)
            </span>
            <span className="text-xl font-bold text-indigo-950 font-mono-tabular block mt-1">
              {statsCount.izin}
            </span>
            <span className="text-[10px] text-indigo-700 block mt-0.5">
              Keluarga / keperluan resmi
            </span>
          </div>

          <div className="border border-rose-100 bg-rose-50/50 rounded-lg p-3">
            <span className="text-[11px] font-semibold text-rose-800 uppercase tracking-wider block">
              Alpa (A)
            </span>
            <span className="text-xl font-bold text-rose-950 font-mono-tabular block mt-1">
              {statsCount.alpa}
            </span>
            <span className="text-[10px] text-rose-700 block mt-0.5">
              Tanpa keterangan
            </span>
          </div>

          <div className="border border-amber-100 bg-amber-50/50 rounded-lg p-3">
            <span className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider block">
              Terlambat (T)
            </span>
            <span className="text-xl font-bold text-amber-950 font-mono-tabular block mt-1">
              {statsCount.terlambat}
            </span>
            <span className="text-[10px] text-amber-700 block mt-0.5">
              Masuk setelah jam mulai
            </span>
          </div>

          <div className="border border-purple-100 bg-purple-50/50 rounded-lg p-3">
            <span className="text-[11px] font-semibold text-purple-800 uppercase tracking-wider block">
              Dispensasi (D)
            </span>
            <span className="text-xl font-bold text-purple-950 font-mono-tabular block mt-1">
              {statsCount.dispensasi}
            </span>
            <span className="text-[10px] text-purple-700 block mt-0.5">
              Lomba / tugas sekolah
            </span>
          </div>
        </div>
      </div>

      {/* 2-Column Split: High Absence Radar & Recent Audit Log */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* High Absence Watchlist */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold text-slate-900">
                  Radar Siswa Rawan Alpa & Ketidakhadiran
                </h3>
              </div>
              <span className="text-xs font-semibold text-slate-500 font-mono-tabular">
                {highAbsenceStudents.length} Siswa Perlu Perhatian
              </span>
            </div>

            <div className="divide-y divide-slate-100 mt-2 max-h-72 overflow-y-auto">
              {highAbsenceStudents.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  Tidak ada siswa yang mencapai batas rawan alpa. Kondisi prima!
                </div>
              ) : (
                highAbsenceStudents.map(({ student, hadir, sakit, izin, alpa, attendanceRate }) => (
                  <div key={student.id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-slate-900">
                        {student.name}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                        <span>NIS: {student.nis}</span>
                        <span>·</span>
                        <span>{student.rombelCode}</span>
                        <span>·</span>
                        <span className="text-rose-600 font-semibold">{alpa} Alpa</span>
                        <span>·</span>
                        <span>{sakit} Sakit</span>
                        <span>·</span>
                        <span>{izin} Izin</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-mono-tabular font-bold text-slate-800 text-xs">
                        {attendanceRate !== null ? `${attendanceRate.toFixed(1)}%` : '-'}
                      </span>
                      <span className="block text-[10px] text-slate-400">Kehadiran</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 mt-2">
            <button
              onClick={() => onNavigateTab('homeroom')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              Buka Rekap Monitoring Wali Kelas
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Recent Audit Log */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">
                Riwayat Audit Perubahan Data Terkini
              </h3>
              <button
                onClick={() => onNavigateTab('audit')}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
              >
                Semua Log
              </button>
            </div>

            <div className="divide-y divide-slate-100 mt-2 max-h-72 overflow-y-auto">
              {auditLogs.slice(0, 5).map(log => (
                <div key={log.id} className="py-2.5 text-xs">
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span className="font-semibold text-slate-700">{log.userName}</span>
                    <span className="font-mono-tabular">{log.timestamp.substring(5, 16)}</span>
                  </div>
                  <div className="text-slate-800 font-medium mt-0.5">
                    {log.description}
                  </div>
                  {log.reason && (
                    <div className="text-[11px] text-slate-500 italic mt-0.5">
                      Alasan: "{log.reason}"
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 mt-2 text-xs text-slate-500 flex items-center justify-between">
            <span>Sistem menjamin audit trail kepatuhan presensi sekolah</span>
            <span className="font-mono-tabular">{auditLogs.length} total catatan audit</span>
          </div>
        </div>

      </div>

      {/* Sesi Presensi Terbaru Table */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Daftar Sesi Presensi Mata Pelajaran Terkini
            </h3>
            <p className="text-xs text-slate-500">
              Sesi presensi per pertemuan yang telah disimpan oleh guru pengampu
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('attendance')}
            className="text-xs font-semibold px-3 py-1.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            + Buat Sesi Presensi Baru
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px]">
                <th className="py-2.5 px-3">Tanggal</th>
                <th className="py-2.5 px-3">Kelas</th>
                <th className="py-2.5 px-3">Mata Pelajaran</th>
                <th className="py-2.5 px-3">Pertemuan</th>
                <th className="py-2.5 px-3">Topik / Bahasan</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sessions.slice(0, 6).map(s => {
                const r = rombels.find(rm => rm.id === s.rombelId);
                const subj = subjects.find(sb => sb.id === s.subjectId);
                return (
                  <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3 font-mono-tabular font-medium text-slate-800">
                      {formatDateIndo(s.date)}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-900">
                      {r?.name || s.rombelId}
                    </td>
                    <td className="py-2.5 px-3 text-slate-700">
                      {subj?.name || s.subjectId}
                    </td>
                    <td className="py-2.5 px-3 font-mono-tabular">
                      Ke-{s.meetingNumber}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 max-w-xs truncate">
                      {s.topic || '-'}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded ${
                        s.status === 'locked'
                          ? 'bg-slate-100 text-slate-700'
                          : 'bg-emerald-50 text-emerald-700'
                      }`}>
                        {s.status === 'locked' ? 'Terkunci (Lock)' : 'Selesai'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => onNavigateTab('attendance')}
                        className="text-indigo-600 hover:text-indigo-800 font-semibold"
                      >
                        Buka
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

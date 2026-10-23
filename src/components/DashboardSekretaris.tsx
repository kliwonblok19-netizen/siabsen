import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Users, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Calendar, 
  FileSpreadsheet, 
  FileText, 
  Plus, 
  Search, 
  ShieldCheck, 
  ShieldAlert, 
  Info, 
  BookOpen, 
  ChevronRight,
  Filter,
  ArrowUpRight,
  Printer
} from 'lucide-react';
import { calculateStudentAttendance, formatDateIndo, formatFullDateIndo } from '../utils/attendanceCalculations';
import { AttendanceStatus, Student } from '../types';
import { CorrectionRequestModal } from './CorrectionRequestModal';

interface DashboardSekretarisProps {
  onNavigateTab: (tab: string) => void;
  onOpenStudentDetail?: (student: Student) => void;
}

export const DashboardSekretaris: React.FC<DashboardSekretarisProps> = ({
  onNavigateTab,
  onOpenStudentDetail
}) => {
  const { 
    currentUser, 
    rombels, 
    students, 
    sessions, 
    records, 
    schedules, 
    subjects, 
    teachers, 
    academicYears, 
    activeAcademicYear,
    secretaryAssignments,
    correctionRequests
  } = useApp();

  // Active Secretary's rombel (STRICT: only assigned rombel)
  const assignedRombelId = currentUser.secretaryRombelId || (rombels[0]?.id || '');
  const activeRombel = rombels.find(r => r.id === assignedRombelId) || rombels[0];

  // Active assignment record
  const currentAssignment = secretaryAssignments.find(
    sa => sa.rombelId === assignedRombelId && sa.isActive
  );

  // Active students in this rombel
  const rombelStudents = useMemo(() => {
    if (!activeRombel) return [];
    return students.filter(s => s.rombelId === activeRombel.id && s.status === 'active');
  }, [students, activeRombel]);

  // Today's date (Environment Context: 2026-10-17)
  const todayStr = '2026-10-17';

  // Sub-tabs in dashboard
  const [activeTab, setActiveTab] = useState<'today' | 'history' | 'recap' | 'corrections'>('today');

  // Correction Modal State
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [selectedCorrectionStudent, setSelectedCorrectionStudent] = useState<Student | null>(null);
  const [selectedCorrectionSubjectId, setSelectedCorrectionSubjectId] = useState<string | undefined>(undefined);
  const [selectedCorrectionDate, setSelectedCorrectionDate] = useState<string | undefined>(undefined);
  const [selectedCorrectionStatus, setSelectedCorrectionStatus] = useState<AttendanceStatus | '-' | undefined>(undefined);
  const [selectedCorrectionSessionId, setSelectedCorrectionSessionId] = useState<string | undefined>(undefined);

  // Filter states for History tab
  const [historyDate, setHistoryDate] = useState<string>(todayStr);
  const [historySubjectId, setHistorySubjectId] = useState<string>('all');
  const [historySearch, setHistorySearch] = useState<string>('');

  // Filter states for Monthly Recap tab
  const [monthlyMonth, setMonthlyMonth] = useState<number>(10); // Oktober
  const [monthlyYear, setMonthlyYear] = useState<number>(2026);

  // 1. Sesi hari ini yang sudah diabsen untuk rombel ini
  const todaySessions = useMemo(() => {
    if (!activeRombel) return [];
    return sessions.filter(s => s.rombelId === activeRombel.id && s.date === todayStr && s.status !== 'cancelled');
  }, [sessions, activeRombel, todayStr]);

  // 2. Jadwal mapel hari ini untuk kelas ini (hari Sabtu = 6)
  // Untuk kelengkapan SMK, kita ambil jadwal kelas ini pada hari berjalan
  const todayDayOfWeek = 6; // 17 Oktober 2026 adalah hari Sabtu
  const todaySchedules = useMemo(() => {
    if (!activeRombel) return [];
    // Prioritize today's schedules, or all regular schedules if school operates on standard block
    const daySchs = schedules.filter(sch => sch.rombelId === activeRombel.id && sch.dayOfWeek === todayDayOfWeek);
    return daySchs.length > 0 ? daySchs : schedules.filter(sch => sch.rombelId === activeRombel.id).slice(0, 3);
  }, [schedules, activeRombel, todayDayOfWeek]);

  // Sesi yang sudah diabsen vs belum diabsen
  const sessionStatusList = useMemo(() => {
    return todaySchedules.map(sch => {
      const subject = subjects.find(s => s.id === sch.subjectId);
      const teacher = teachers.find(t => t.id === sch.teacherId);
      const recordedSession = todaySessions.find(s => s.subjectId === sch.subjectId);
      return {
        schedule: sch,
        subject,
        teacher,
        isRecorded: !!recordedSession,
        session: recordedSession
      };
    });
  }, [todaySchedules, subjects, teachers, todaySessions]);

  const recordedSessionsCount = todaySessions.length;
  const expectedSessionsCount = Math.max(todaySchedules.length, recordedSessionsCount);
  const pendingSessionsCount = Math.max(0, expectedSessionsCount - recordedSessionsCount);

  // 3. Ringkasan Kehadiran Hari Ini
  const todayStats = useMemo(() => {
    const todaySessionIds = new Set(todaySessions.map(s => s.id));
    const todayRecs = records.filter(r => todaySessionIds.has(r.sessionId));

    let hadir = 0;
    let sakit = 0;
    let izin = 0;
    let alpa = 0;
    let terlambat = 0;
    let dispensasi = 0;

    todayRecs.forEach(r => {
      if (r.status === 'H') hadir++;
      else if (r.status === 'S') sakit++;
      else if (r.status === 'I') izin++;
      else if (r.status === 'A') alpa++;
      else if (r.status === 'T') terlambat++;
      else if (r.status === 'D') dispensasi++;
    });

    const totalValid = todayRecs.length;
    const rate = totalValid > 0 ? (hadir / totalValid) * 100 : null;

    return { hadir, sakit, izin, alpa, terlambat, dispensasi, totalValid, rate };
  }, [todaySessions, records]);

  // 4. Rekap Ketidakhadiran Terbanyak (Alpa / Sakit / Izin)
  const studentSummaries = useMemo(() => {
    return rombelStudents.map(student => {
      return calculateStudentAttendance(student, sessions, records, {
        academicYearId: activeAcademicYear.id
      });
    }).sort((a, b) => (b.alpa * 3 + b.sakit + b.izin) - (a.alpa * 3 + a.sakit + a.izin));
  }, [rombelStudents, sessions, records, activeAcademicYear.id]);

  const topAbsentStudents = useMemo(() => {
    return studentSummaries.filter(s => s.alpa > 0 || s.sakit > 0 || s.izin > 0 || s.terlambat > 0).slice(0, 5);
  }, [studentSummaries]);

  // 5. Data Riwayat yang difilter
  const filteredHistory = useMemo(() => {
    if (!activeRombel) return [];

    let filteredSessions = sessions.filter(s => s.rombelId === activeRombel.id);
    if (historyDate) {
      filteredSessions = filteredSessions.filter(s => s.date === historyDate);
    }
    if (historySubjectId !== 'all') {
      filteredSessions = filteredSessions.filter(s => s.subjectId === historySubjectId);
    }

    const sessionIds = new Set(filteredSessions.map(s => s.id));
    let matchingRecords = records.filter(r => sessionIds.has(r.sessionId));

    // Filter by student search query
    if (historySearch.trim()) {
      const q = historySearch.toLowerCase().trim();
      matchingRecords = matchingRecords.filter(r => {
        const student = students.find(st => st.id === r.studentId);
        return student && (student.name.toLowerCase().includes(q) || student.nis.includes(q));
      });
    }

    return matchingRecords.map(r => {
      const session = sessions.find(s => s.id === r.sessionId);
      const student = students.find(st => st.id === r.studentId);
      const subject = subjects.find(sb => sb.id === session?.subjectId);
      return {
        record: r,
        session,
        student,
        subject
      };
    });
  }, [sessions, records, students, subjects, activeRombel, historyDate, historySubjectId, historySearch]);

  // 6. Pengajuan Koreksi untuk Rombel Ini
  const rombelCorrectionRequests = useMemo(() => {
    if (!activeRombel) return [];
    return correctionRequests.filter(cr => cr.rombelId === activeRombel.id);
  }, [correctionRequests, activeRombel]);

  // Handle open quick report correction
  const handleOpenCorrection = (student?: Student, subjectId?: string, date?: string, curStatus?: AttendanceStatus | '-', sessId?: string) => {
    setSelectedCorrectionStudent(student || null);
    setSelectedCorrectionSubjectId(subjectId);
    setSelectedCorrectionDate(date || todayStr);
    setSelectedCorrectionStatus(curStatus);
    setSelectedCorrectionSessionId(sessId);
    setShowCorrectionModal(true);
  };

  const getStatusBadge = (st: AttendanceStatus | '-') => {
    switch (st) {
      case 'H':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Hadir</span>;
      case 'S':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">Sakit</span>;
      case 'I':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">Izin</span>;
      case 'A':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">Alpa</span>;
      case 'T':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-50 text-orange-700 border border-orange-200">Terlambat</span>;
      case 'D':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">Dispensasi</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">-</span>;
    }
  };

  const getCorrectionStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-amber-600" />Menunggu Review</span>;
      case 'APPROVED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />Disetujui</span>;
      case 'REJECTED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1.5"><ShieldAlert className="w-3.5 h-3.5 text-rose-600" />Ditolak</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1.5"><Info className="w-3.5 h-3.5 text-blue-600" />Butuh Info</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner & Identity */}
      <div className="bg-gradient-to-r from-amber-900 via-slate-900 to-indigo-950 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                Sekretaris Kelas Resmi
              </span>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs text-slate-300">
                Rombel: <strong className="text-white">{activeRombel?.name || 'XI DKV 1'}</strong>
              </span>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs text-slate-300">
                Wali Kelas: <strong className="text-white">{activeRombel?.homeroomTeacherName || 'Siti Nurhaliza, M.Pd.'}</strong>
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Dashboard Sekretaris: {currentUser.name}
            </h1>
            <p className="text-xs text-slate-300 max-w-2xl">
              Portal monitoring kehadiran harian, rekapitulasi ketidakhadiran siswa, dan pengajuan koreksi data presensi kelas.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto shrink-0">
            <button
              onClick={() => handleOpenCorrection()}
              className="px-4 py-2 text-xs font-bold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-xl shadow-md transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Ajukan Koreksi Data
            </button>
            <button
              onClick={() => onNavigateTab('reports')}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-white/10 hover:bg-white/20 rounded-xl border border-white/15 transition-all flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-amber-300" />
              Lihat Laporan Rekap
            </button>
          </div>
        </div>

        {/* Read-Only Legal Notice Banner (Prompt 3 & 5 Compliance) */}
        <div className="mt-4 pt-3 border-t border-white/10 flex items-center gap-2 text-xs text-amber-200/90 font-medium">
          <Info className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            <strong>Hak Akses Pemantauan (Read-Only Monitoring):</strong> Anda hanya berwenang memantau data rombel <em>{activeRombel?.name}</em>. Catatan resmi presensi diisi oleh Guru/Wali Kelas. Jika terdapat ketidaksesuaian data, gunakan menu <strong>Pengajuan Koreksi</strong>.
          </span>
        </div>
      </div>

      {/* 2. Key Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Siswa Aktif */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Siswa Aktif</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono-tabular text-slate-900">
              {rombelStudents.length}
            </span>
            <span className="text-xs text-slate-400">siswa</span>
          </div>
          <span className="text-[11px] text-slate-500 block mt-1">
            Kelas {activeRombel?.name}
          </span>
        </div>

        {/* Kehadiran Hari Ini */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Hadir Hari Ini</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono-tabular text-emerald-600">
              {todayStats.hadir}
            </span>
            <span className="text-xs text-slate-400">
              {todayStats.rate !== null ? `(${todayStats.rate.toFixed(0)}%)` : ''}
            </span>
          </div>
          <span className="text-[11px] text-slate-500 block mt-1">
            Dari {todayStats.totalValid} rekaman sesi
          </span>
        </div>

        {/* Sakit / Izin / Dispensasi */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Sakit / Izin / Disp.</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono-tabular text-blue-700">
              {todayStats.sakit + todayStats.izin + todayStats.dispensasi}
            </span>
            <span className="text-xs text-slate-400">
              (S:{todayStats.sakit} I:{todayStats.izin} D:{todayStats.dispensasi})
            </span>
          </div>
          <span className="text-[11px] text-slate-500 block mt-1">
            Ada keterangan resmi
          </span>
        </div>

        {/* Alpa & Terlambat */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Alpa / Terlambat</span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono-tabular text-rose-600">
              {todayStats.alpa + todayStats.terlambat}
            </span>
            <span className="text-xs text-slate-400">
              (A:{todayStats.alpa} T:{todayStats.terlambat})
            </span>
          </div>
          <span className="text-[11px] text-rose-600 font-semibold block mt-1">
            {todayStats.alpa > 0 ? 'Perlu konfirmasi!' : 'Nihil alpa'}
          </span>
        </div>

        {/* Status Sesi Diabsen */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Sesi Mapel Hari Ini</span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono-tabular text-purple-700">
              {recordedSessionsCount}
            </span>
            <span className="text-xs text-slate-400">
              / {expectedSessionsCount} Sesi
            </span>
          </div>
          <span className={`text-[11px] font-medium block mt-1 ${
            pendingSessionsCount > 0 ? 'text-amber-600' : 'text-emerald-600'
          }`}>
            {pendingSessionsCount > 0 ? `${pendingSessionsCount} sesi belum diabsen` : 'Semua sesi lengkap'}
          </span>
        </div>
      </div>

      {/* 3. Navigation Tabs within Dashboard */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('today')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'today'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Kehadiran Hari Ini & Sesi Mapel</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'history'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Filter className="w-3.5 h-3.5" />
          <span>Riwayat & Pencarian Presensi</span>
        </button>

        <button
          onClick={() => setActiveTab('recap')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'recap'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          <span>Rekap Bulanan & Siswa Sering Absen</span>
        </button>

        <button
          onClick={() => setActiveTab('corrections')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 relative ${
            activeTab === 'corrections'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Pengajuan Koreksi Data</span>
          {rombelCorrectionRequests.filter(c => c.status === 'PENDING').length > 0 && (
            <span className="w-4 h-4 rounded-full bg-amber-400 text-slate-900 text-[10px] font-extrabold flex items-center justify-center">
              {rombelCorrectionRequests.filter(c => c.status === 'PENDING').length}
            </span>
          )}
        </button>
      </div>

      {/* 4. Tab 1 Content: Kehadiran Hari Ini & Sesi Mapel */}
      {activeTab === 'today' && (
        <div className="space-y-6">
          {/* Status Sesi Mapel Hari Ini */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Pemantauan Sesi Mata Pelajaran ({formatFullDateIndo(todayStr)})
                </h3>
                <p className="text-xs text-slate-500">
                  Daftar sesi mata pelajaran yang sudah dan belum diisi absensinya oleh guru pengampu
                </p>
              </div>
              <span className="text-xs text-slate-400 font-mono-tabular">
                {todaySessions.length} sesi tercatat di database
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {sessionStatusList.map((item, idx) => {
                const isDone = item.isRecorded;
                return (
                  <div
                    key={idx}
                    className={`rounded-xl border p-4 transition-all ${
                      isDone
                        ? 'bg-emerald-50/40 border-emerald-200'
                        : 'bg-amber-50/40 border-amber-200 border-dashed'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                          {item.schedule.timeStart} - {item.schedule.timeEnd} (R. {item.schedule.room})
                        </span>
                        <h4 className="font-bold text-xs text-slate-900 line-clamp-1">
                          {item.subject?.name || 'Mata Pelajaran'}
                        </h4>
                        <span className="text-[11px] text-slate-500 block truncate">
                          Guru: {item.teacher?.name || '-'}
                        </span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                        isDone
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-amber-100 text-amber-800 border border-amber-300'
                      }`}>
                        {isDone ? 'Sudah Diabsen' : 'Belum Diabsen'}
                      </span>
                    </div>

                    {isDone && item.session && (
                      <div className="mt-3 pt-2.5 border-t border-emerald-100 text-[11px] text-emerald-900 flex items-center justify-between">
                        <span>Pertemuan Ke-{item.session.meetingNumber}</span>
                        <span className="font-medium text-slate-500">
                          {item.session.topic ? `Topik: ${item.session.topic}` : 'Absensi Lengkap'}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Daftar Siswa yang Tidak Hadir Hari Ini */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Daftar Siswa Tidak Masuk / Terlambat Hari Ini
                </h3>
                <p className="text-xs text-slate-500">
                  Catatan ketidakhadiran resmi yang tersimpan di sistem
                </p>
              </div>
            </div>

            {(() => {
              const todaySessionIds = new Set(todaySessions.map(s => s.id));
              const absentRecords = records.filter(r => todaySessionIds.has(r.sessionId) && r.status !== 'H');

              if (absentRecords.length === 0) {
                return (
                  <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                    <p className="text-xs font-semibold text-slate-700">Semua Siswa Tercatat Hadir</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Nihil catatan sakit, izin, alpa, atau terlambat pada sesi yang telah diisi hari ini.
                    </p>
                  </div>
                );
              }

              return (
                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[11px] border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Nama Siswa</th>
                        <th className="py-2.5 px-3">NIS</th>
                        <th className="py-2.5 px-3">Mata Pelajaran</th>
                        <th className="py-2.5 px-3">Status Tercatat</th>
                        <th className="py-2.5 px-3">Keterangan Resmi</th>
                        <th className="py-2.5 px-3 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {absentRecords.map(rec => {
                        const student = students.find(s => s.id === rec.studentId);
                        const session = sessions.find(s => s.id === rec.sessionId);
                        const subject = subjects.find(s => s.id === session?.subjectId);
                        return (
                          <tr key={rec.id} className="hover:bg-slate-50">
                            <td className="py-2.5 px-3 font-semibold text-slate-900">{student?.name}</td>
                            <td className="py-2.5 px-3 font-mono-tabular text-slate-600">{student?.nis}</td>
                            <td className="py-2.5 px-3 text-slate-700">{subject?.name}</td>
                            <td className="py-2.5 px-3">{getStatusBadge(rec.status)}</td>
                            <td className="py-2.5 px-3 text-slate-500 italic">{rec.note || '-'}</td>
                            <td className="py-2.5 px-3 text-right">
                              <button
                                onClick={() => handleOpenCorrection(student, subject?.id, session?.date, rec.status, session?.id)}
                                className="text-amber-700 hover:text-amber-800 font-semibold text-[11px] hover:underline"
                              >
                                Laporkan Ketidaksesuaian
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* 5. Tab 2 Content: Riwayat & Pencarian Presensi */}
      {activeTab === 'history' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Riwayat Presensi Rombel {activeRombel?.name}
              </h3>
              <p className="text-xs text-slate-500">
                Pencarian dan penelusuran status kehadiran berdasarkan tanggal dan mata pelajaran
              </p>
            </div>
            <button
              onClick={() => handleOpenCorrection()}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg flex items-center gap-1.5 self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5 text-amber-400" />
              Ajukan Koreksi Data
            </button>
          </div>

          {/* Filter Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Filter Tanggal
              </label>
              <input
                type="date"
                value={historyDate}
                onChange={e => setHistoryDate(e.target.value)}
                className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Filter Mata Pelajaran
              </label>
              <select
                value={historySubjectId}
                onChange={e => setHistorySubjectId(e.target.value)}
                className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white"
              >
                <option value="all">Semua Mata Pelajaran</option>
                {subjects.map(sb => (
                  <option key={sb.id} value={sb.id}>{sb.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Cari Nama Siswa / NIS
              </label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                <input
                  type="text"
                  placeholder="Ketik nama atau NIS..."
                  value={historySearch}
                  onChange={e => setHistorySearch(e.target.value)}
                  className="w-full text-xs pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg bg-white"
                />
              </div>
            </div>
          </div>

          {/* History Records Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Tanggal</th>
                  <th className="py-2.5 px-3">Mata Pelajaran</th>
                  <th className="py-2.5 px-3">Nama Siswa</th>
                  <th className="py-2.5 px-3">NIS</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Keterangan</th>
                  <th className="py-2.5 px-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredHistory.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400 italic">
                      Tidak ada rekaman presensi yang cocok dengan filter tanggal/mapel/nama.
                    </td>
                  </tr>
                ) : (
                  filteredHistory.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3 font-mono-tabular text-slate-700">
                        {item.session?.date ? formatDateIndo(item.session.date) : '-'}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">
                        {item.subject?.name}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-900">
                        {item.student?.name}
                      </td>
                      <td className="py-2.5 px-3 font-mono-tabular text-slate-500">
                        {item.student?.nis}
                      </td>
                      <td className="py-2.5 px-3">
                        {getStatusBadge(item.record.status)}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 italic max-w-xs truncate">
                        {item.record.note || '-'}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => handleOpenCorrection(
                            item.student,
                            item.subject?.id,
                            item.session?.date,
                            item.record.status,
                            item.session?.id
                          )}
                          className="text-amber-700 hover:text-amber-800 font-semibold text-[11px] hover:underline"
                        >
                          Ajukan Koreksi
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. Tab 3 Content: Rekap Bulanan & Siswa Sering Tidak Hadir */}
      {activeTab === 'recap' && (
        <div className="space-y-6">
          {/* Siswa dengan Ketidakhadiran Terbanyak */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-500" />
                  Daftar Siswa dengan Ketidakhadiran Terbanyak
                </h3>
                <p className="text-xs text-slate-500">
                  Data pemantauan siswa yang memerlukan perhatian khusus dari Wali Kelas dan Guru BK
                </p>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Peringkat</th>
                    <th className="py-2.5 px-3">Nama Siswa</th>
                    <th className="py-2.5 px-3">NIS</th>
                    <th className="py-2.5 px-3 text-center">Sakit</th>
                    <th className="py-2.5 px-3 text-center">Izin</th>
                    <th className="py-2.5 px-3 text-center text-rose-600 font-bold">Alpa</th>
                    <th className="py-2.5 px-3 text-center">Terlambat</th>
                    <th className="py-2.5 px-3 text-center">Persentase</th>
                    <th className="py-2.5 px-3 text-right">Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {topAbsentStudents.map((summary, idx) => (
                    <tr key={summary.student.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-mono-tabular font-bold text-slate-400">
                        #{idx + 1}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">
                        {summary.student.name}
                      </td>
                      <td className="py-2.5 px-3 font-mono-tabular text-slate-600">
                        {summary.student.nis}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono-tabular text-blue-700">{summary.sakit}</td>
                      <td className="py-2.5 px-3 text-center font-mono-tabular text-amber-700">{summary.izin}</td>
                      <td className="py-2.5 px-3 text-center font-mono-tabular font-bold text-rose-600 bg-rose-50/50">
                        {summary.alpa}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono-tabular text-orange-700">{summary.terlambat}</td>
                      <td className="py-2.5 px-3 text-center font-mono-tabular font-bold">
                        <span className={summary.attendanceRate !== null && summary.attendanceRate < 85 ? 'text-rose-600' : 'text-slate-800'}>
                          {summary.attendanceRate !== null ? `${summary.attendanceRate.toFixed(1)}%` : '-'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => handleOpenCorrection(summary.student)}
                          className="px-2.5 py-1 text-[11px] font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 rounded border border-amber-200 transition-colors"
                        >
                          Ajukan Koreksi
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Rekap Bulanan Rombel */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Rekap Kehadiran Siswa Semester Ini
                </h3>
                <p className="text-xs text-slate-500">
                  Total akumulasi presensi seluruh siswa rombel {activeRombel?.name}
                </p>
              </div>

              <button
                onClick={() => onNavigateTab('reports')}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1.5 transition-colors self-start sm:self-auto"
              >
                <Printer className="w-3.5 h-3.5 text-slate-600" />
                Cetak / Ekspor Laporan
              </button>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">No</th>
                    <th className="py-2.5 px-3">Nama Siswa</th>
                    <th className="py-2.5 px-3">NIS</th>
                    <th className="py-2.5 px-3 text-center text-emerald-700">Hadir</th>
                    <th className="py-2.5 px-3 text-center text-blue-700">Sakit</th>
                    <th className="py-2.5 px-3 text-center text-amber-700">Izin</th>
                    <th className="py-2.5 px-3 text-center text-rose-700">Alpa</th>
                    <th className="py-2.5 px-3 text-center text-orange-700">Terlambat</th>
                    <th className="py-2.5 px-3 text-center text-purple-700">Dispensasi</th>
                    <th className="py-2.5 px-3 text-center font-bold">Kehadiran</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {studentSummaries.map((s, idx) => (
                    <tr key={s.student.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-mono-tabular text-slate-400">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{s.student.name}</td>
                      <td className="py-2.5 px-3 font-mono-tabular text-slate-600">{s.student.nis}</td>
                      <td className="py-2.5 px-3 text-center font-mono-tabular text-emerald-700 font-bold">{s.hadir}</td>
                      <td className="py-2.5 px-3 text-center font-mono-tabular text-blue-700">{s.sakit}</td>
                      <td className="py-2.5 px-3 text-center font-mono-tabular text-amber-700">{s.izin}</td>
                      <td className={`py-2.5 px-3 text-center font-mono-tabular font-bold ${s.alpa > 0 ? 'text-rose-600 bg-rose-50/50' : 'text-slate-400'}`}>
                        {s.alpa}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono-tabular text-orange-700">{s.terlambat}</td>
                      <td className="py-2.5 px-3 text-center font-mono-tabular text-purple-700">{s.dispensasi}</td>
                      <td className="py-2.5 px-3 text-center font-mono-tabular font-bold text-slate-900">
                        {s.attendanceRate !== null ? `${s.attendanceRate.toFixed(0)}%` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 7. Tab 4 Content: Status Pengajuan Koreksi Data */}
      {activeTab === 'corrections' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Riwayat Pengajuan Koreksi Absensi ({rombelCorrectionRequests.length} Pengajuan)
              </h3>
              <p className="text-xs text-slate-500">
                Status verifikasi laporan ketidaksesuaian oleh Wali Kelas dan Guru Pengampu
              </p>
            </div>
            <button
              onClick={() => handleOpenCorrection()}
              className="px-4 py-2 text-xs font-bold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-xs flex items-center gap-1.5 transition-colors self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              Ajukan Koreksi Baru
            </button>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Tanggal Pengajuan</th>
                  <th className="py-2.5 px-3">Siswa</th>
                  <th className="py-2.5 px-3">Mata Pelajaran & Tanggal</th>
                  <th className="py-2.5 px-3 text-center">Status Saat Diajukan</th>
                  <th className="py-2.5 px-3 text-center">Usulan Status</th>
                  <th className="py-2.5 px-3">Alasan / Bukti</th>
                  <th className="py-2.5 px-3">Status Verifikasi</th>
                  <th className="py-2.5 px-3">Catatan Peninjau</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rombelCorrectionRequests.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400 italic">
                      Belum ada pengajuan koreksi untuk rombel ini.
                    </td>
                  </tr>
                ) : (
                  rombelCorrectionRequests.map(req => (
                    <tr key={req.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-mono-tabular text-slate-600">
                        {req.submittedAt}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">
                        {req.studentName}
                        <span className="text-[10px] text-slate-400 block font-normal">
                          NIS: {req.studentNis}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-700">
                        <span className="font-medium text-slate-900">{req.subjectName}</span>
                        <span className="text-[10px] text-slate-500 block font-mono-tabular">
                          Sesi: {formatDateIndo(req.attendanceDate)}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {getStatusBadge(req.currentStatus)}
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold">
                        {getStatusBadge(req.proposedStatus)}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700 max-w-xs">
                        <p className="line-clamp-2">{req.reason}</p>
                        {req.supportingEvidence && (
                          <span className="text-[10px] text-indigo-600 font-medium block mt-0.5">
                            Bukti: {req.supportingEvidence}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        {getCorrectionStatusBadge(req.status)}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 max-w-xs italic">
                        {req.reviewNotes || (
                          <span className="text-slate-400 not-italic text-[11px]">
                            Menunggu pemeriksaan wali kelas
                          </span>
                        )}
                        {req.reviewedByName && (
                          <span className="text-[10px] text-slate-500 block not-italic mt-0.5">
                            Oleh: {req.reviewedByName} ({req.reviewedAt})
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Pengajuan Koreksi */}
      <CorrectionRequestModal
        isOpen={showCorrectionModal}
        onClose={() => setShowCorrectionModal(false)}
        targetStudent={selectedCorrectionStudent}
        targetSubjectId={selectedCorrectionSubjectId}
        targetDate={selectedCorrectionDate}
        targetCurrentStatus={selectedCorrectionStatus}
        targetSessionId={selectedCorrectionSessionId}
      />
    </div>
  );
};

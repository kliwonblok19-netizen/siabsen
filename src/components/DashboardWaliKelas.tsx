import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Users, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Calendar, 
  Eye, 
  Edit3, 
  FileSpreadsheet, 
  ShieldAlert,
  ShieldCheck,
  ArrowRight,
  BookOpen,
  UserPlus,
  UserMinus,
  FileCheck,
  Check,
  X,
  MessageSquare,
  Info,
  History
} from 'lucide-react';
import { 
  calculateStudentAttendance, 
  formatDateIndo, 
  formatFullDateIndo 
} from '../utils/attendanceCalculations';
import { Student, AttendanceStatus } from '../types';

interface DashboardWaliKelasProps {
  onNavigateTab: (tab: string) => void;
  onOpenStudentDetail: (student: Student) => void;
}

export const DashboardWaliKelas: React.FC<DashboardWaliKelasProps> = ({
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
    activeAcademicYear,
    correctStudentRecord,
    settings,
    secretaryAssignments,
    assignSecretary,
    revokeSecretaryAssignment,
    correctionRequests,
    reviewCorrectionRequest
  } = useApp();

  // Find homeroom class of current user
  // If user is admin or teacher without homeroom assigned, allow selecting class
  const userHomeroom = rombels.find(r => r.homeroomTeacherId === currentUser.teacherId);
  const [selectedRombelId, setSelectedRombelId] = useState<string>(
    userHomeroom ? userHomeroom.id : (rombels[0]?.id || '')
  );

  const activeRombel = rombels.find(r => r.id === selectedRombelId) || rombels[0];

  // Active Tab: 'monitoring' | 'secretary' | 'corrections'
  const [mainTab, setMainTab] = useState<'monitoring' | 'secretary' | 'corrections'>('monitoring');

  // Secretary Assignment Form State
  const [secretaryStudentId, setSecretaryStudentId] = useState<string>('');
  const [secretaryNotes, setSecretaryNotes] = useState<string>('');
  const [secretaryRevokeReason, setSecretaryRevokeReason] = useState<string>('');
  const [showRevokeModal, setShowRevokeModal] = useState<boolean>(false);

  // Correction Review Action State
  const [reviewNoteInput, setReviewNoteInput] = useState<{ [reqId: string]: string }>({});

  // Active Secretary for this Rombel
  const activeSecretary = useMemo(() => {
    if (!activeRombel) return undefined;
    return secretaryAssignments.find(sa => sa.rombelId === activeRombel.id && sa.isActive);
  }, [secretaryAssignments, activeRombel]);

  // Secretary Assignment History for this Rombel
  const rombelSecretaryHistory = useMemo(() => {
    if (!activeRombel) return [];
    return secretaryAssignments.filter(sa => sa.rombelId === activeRombel.id);
  }, [secretaryAssignments, activeRombel]);

  // Correction Requests for this Rombel
  const rombelCorrectionRequests = useMemo(() => {
    if (!activeRombel) return [];
    return correctionRequests.filter(cr => cr.rombelId === activeRombel.id);
  }, [correctionRequests, activeRombel]);

  const pendingCorrectionCount = useMemo(() => {
    return rombelCorrectionRequests.filter(cr => cr.status === 'PENDING').length;
  }, [rombelCorrectionRequests]);

  // Students in this rombel
  const rombelStudents = useMemo(() => {
    if (!activeRombel) return [];
    return students.filter(s => s.rombelId === activeRombel.id && s.status === 'active');
  }, [students, activeRombel]);

  // Today's date in YYYY-MM-DD
  const todayStr = '2026-10-17';

  // Today's sessions for this class
  const todaySessions = useMemo(() => {
    if (!activeRombel) return [];
    return sessions.filter(s => s.rombelId === activeRombel.id && s.date === todayStr);
  }, [sessions, activeRombel, todayStr]);

  // Today's attendance numbers for this rombel
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

  // Semester attendance summary per student
  const studentSummaries = useMemo(() => {
    return rombelStudents.map(student => {
      return calculateStudentAttendance(student, sessions, records, {
        academicYearId: activeAcademicYear.id
      });
    }).sort((a, b) => b.alpa - a.alpa);
  }, [rombelStudents, sessions, records, activeAcademicYear.id]);

  // Students with high absences (alpa >= 2 or rate < 85%)
  const atRiskStudents = useMemo(() => {
    return studentSummaries.filter(s => s.alpa >= 2 || (s.attendanceRate !== null && s.attendanceRate < 85));
  }, [studentSummaries]);

  // Correction Modal State (Wali Kelas direct correction)
  const [correctingRecord, setCorrectingRecord] = useState<{
    recordId: string;
    studentName: string;
    currentStatus: AttendanceStatus;
    newStatus: AttendanceStatus;
    currentNote: string;
    newNote: string;
    reason: string;
  } | null>(null);

  const handleSaveCorrection = () => {
    if (!correctingRecord) return;
    if (!correctingRecord.reason.trim()) {
      alert('Alasan koreksi wajib diisi untuk catatan audit resmi.');
      return;
    }
    correctStudentRecord(
      correctingRecord.recordId,
      correctingRecord.newStatus,
      correctingRecord.newNote,
      correctingRecord.reason
    );
    setCorrectingRecord(null);
  };

  // Submit Secretary Assignment
  const handleAssignSecretary = (e: React.FormEvent) => {
    e.preventDefault();
    if (!secretaryStudentId || !activeRombel) return;
    assignSecretary(secretaryStudentId, activeRombel.id, secretaryNotes.trim());
    setSecretaryStudentId('');
    setSecretaryNotes('');
  };

  // Revoke Secretary Assignment
  const handleConfirmRevoke = () => {
    if (!activeSecretary) return;
    revokeSecretaryAssignment(activeSecretary.id, secretaryRevokeReason.trim());
    setShowRevokeModal(false);
    setSecretaryRevokeReason('');
  };

  // Process Correction Request from Secretary
  const handleProcessRequest = (
    requestId: string,
    action: 'APPROVED' | 'REJECTED' | 'NEED_INFO'
  ) => {
    const notes = reviewNoteInput[requestId] || (
      action === 'APPROVED' ? 'Disetujui oleh Wali Kelas' :
      action === 'REJECTED' ? 'Ditolak: bukti tidak valid' :
      'Mohon lengkapi bukti'
    );
    reviewCorrectionRequest(requestId, action, notes);
    setReviewNoteInput(prev => {
      const copy = { ...prev };
      delete copy[requestId];
      return copy;
    });
  };

  const getStatusBadge = (st: AttendanceStatus | '-') => {
    switch (st) {
      case 'H': return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Hadir</span>;
      case 'S': return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">Sakit</span>;
      case 'I': return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">Izin</span>;
      case 'A': return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">Alpa</span>;
      case 'T': return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-50 text-orange-700 border border-orange-200">Terlambat</span>;
      case 'D': return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">Dispensasi</span>;
      default: return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">-</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                Wali Kelas: {activeRombel?.homeroomTeacherName || currentUser.name}
              </span>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs text-slate-500 font-medium">
                Tahun Ajaran {activeAcademicYear.name} ({activeAcademicYear.semester})
              </span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-1">
              Monitoring Kehadiran Kelas: {activeRombel ? `${activeRombel.name} (${activeRombel.code})` : 'Belum Ada Rombel'}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Pemantauan kehadiran seluruh mata pelajaran, penugasan sekretaris kelas, dan verifikasi pengajuan koreksi
            </p>
          </div>

          {/* If admin or switching class */}
          {currentUser.role === 'admin' && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium whitespace-nowrap">Pilih Rombel:</span>
              <select
                value={selectedRombelId}
                onChange={e => setSelectedRombelId(e.target.value)}
                className="text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800"
              >
                {rombels.length === 0 ? (
                  <option value="">-- Belum ada rombel --</option>
                ) : (
                  rombels.map(r => (
                    <option key={r.id} value={r.id}>{r.name} ({r.code})</option>
                  ))
                )}
              </select>
            </div>
          )}
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="flex items-center gap-2 mt-5 pt-4 border-t border-slate-100 overflow-x-auto">
          <button
            onClick={() => setMainTab('monitoring')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
              mainTab === 'monitoring'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Monitoring Kehadiran Siswa</span>
          </button>

          <button
            onClick={() => setMainTab('secretary')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
              mainTab === 'secretary'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
            <span>Penunjukan Sekretaris Kelas</span>
            {activeSecretary && (
              <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-100 text-emerald-800 font-semibold">
                Aktif
              </span>
            )}
          </button>

          <button
            onClick={() => setMainTab('corrections')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 relative ${
              mainTab === 'corrections'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <FileCheck className="w-3.5 h-3.5" />
            <span>Pengajuan Koreksi Absensi</span>
            {pendingCorrectionCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-extrabold flex items-center justify-center">
                {pendingCorrectionCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* VIEW 1: MONITORING KEHADIRAN SISWA */}
      {mainTab === 'monitoring' && (
        <div className="space-y-6">
          {/* KPI Cards for this Rombel */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-white border border-slate-200 rounded-xl p-3.5">
              <span className="text-[11px] font-semibold text-slate-500 block">Siswa Aktif</span>
              <span className="text-2xl font-bold text-slate-900 font-mono-tabular block mt-1">
                {rombelStudents.length}
              </span>
              <span className="text-[10px] text-slate-400">Total rombel</span>
            </div>

            <div className="bg-white border border-emerald-200 rounded-xl p-3.5 bg-emerald-50/20">
              <span className="text-[11px] font-semibold text-emerald-800 block">Hadir Hari Ini</span>
              <span className="text-2xl font-bold text-emerald-950 font-mono-tabular block mt-1">
                {todayStats.hadir}
              </span>
              <span className="text-[10px] text-emerald-700">Tercatat di sesi</span>
            </div>

            <div className="bg-white border border-sky-200 rounded-xl p-3.5 bg-sky-50/20">
              <span className="text-[11px] font-semibold text-sky-800 block">Sakit</span>
              <span className="text-2xl font-bold text-sky-950 font-mono-tabular block mt-1">
                {todayStats.sakit}
              </span>
              <span className="text-[10px] text-sky-700">Surat dokter/wali</span>
            </div>

            <div className="bg-white border border-indigo-200 rounded-xl p-3.5 bg-indigo-50/20">
              <span className="text-[11px] font-semibold text-indigo-800 block">Izin</span>
              <span className="text-2xl font-bold text-indigo-950 font-mono-tabular block mt-1">
                {todayStats.izin}
              </span>
              <span className="text-[10px] text-indigo-700">Keperluan resmi</span>
            </div>

            <div className="bg-white border border-rose-200 rounded-xl p-3.5 bg-rose-50/20">
              <span className="text-[11px] font-semibold text-rose-800 block">Alpa</span>
              <span className="text-2xl font-bold text-rose-950 font-mono-tabular block mt-1">
                {todayStats.alpa}
              </span>
              <span className="text-[10px] text-rose-700">Tanpa keterangan</span>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-3.5">
              <span className="text-[11px] font-semibold text-slate-500 block">Persentase</span>
              <span className="text-2xl font-bold text-slate-900 font-mono-tabular block mt-1">
                {todayStats.rate !== null ? `${todayStats.rate.toFixed(1)}%` : 'Belum Ada'}
              </span>
              <span className="text-[10px] text-slate-400">Rasio hari ini</span>
            </div>
          </div>

          {/* Today's Subject Sessions Status */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Status Presensi Mata Pelajaran Hari Ini ({formatFullDateIndo(todayStr)})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Wali kelas memantau apakah guru setiap mata pelajaran sudah mengisi kehadiran siswa
                </p>
              </div>
              <span className="text-xs font-semibold text-slate-500">
                {todaySessions.length} Sesi Tercatat
              </span>
            </div>

            <div className="divide-y divide-slate-100 mt-2">
              {todaySessions.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  Belum ada sesi presensi yang dimasukkan oleh guru mata pelajaran pada hari ini ({formatDateIndo(todayStr)}).
                </div>
              ) : (
                todaySessions.map(session => {
                  const subj = subjects.find(s => s.id === session.subjectId);
                  const tch = teachers.find(t => t.id === session.teacherId);
                  return (
                    <div key={session.id} className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs">
                      <div>
                        <div className="font-semibold text-slate-900 flex items-center gap-2">
                          <span>{subj?.name}</span>
                          <span className="text-slate-400">·</span>
                          <span className="text-slate-600 font-normal">Pertemuan ke-{session.meetingNumber}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                          <span>Guru: {tch?.name}</span>
                          <span>·</span>
                          <span>{session.period}</span>
                          {session.topic && <span>· Topik: "{session.topic}"</span>}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Selesai Dicatat
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Peringatan Siswa Sering Alpa */}
          {atRiskStudents.length > 0 && (
            <div className="bg-rose-50/50 border border-rose-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-xs font-bold text-rose-900">
                    Peringatan Dini: {atRiskStudents.length} Siswa Memiliki Tingkat Ketidakhadiran Tinggi
                  </h4>
                  <p className="text-xs text-rose-700 mt-0.5">
                    Siswa terdeteksi memiliki Alpa ≥ 2 kali atau tingkat kehadiran di bawah standar kelulusan (&lt; 85%).
                  </p>
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {atRiskStudents.map(item => (
                      <div key={item.student.id} className="bg-white p-2.5 rounded-lg border border-rose-200 text-xs flex items-center justify-between">
                        <div>
                          <span className="font-semibold text-slate-900 block">{item.student.name}</span>
                          <span className="text-[11px] text-slate-500">NIS: {item.student.nis}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-rose-600 block">{item.alpa} Alpa</span>
                          <span className="text-[10px] text-slate-500">Hadir: {item.rateFormatted}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tabel Rekap Siswa Rombel */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Rekapitulasi Kehadiran Siswa Semester Ini
                </h3>
                <p className="text-xs text-slate-500">
                  Data akumulasi seluruh pertemuan mata pelajaran semester {activeAcademicYear.semester}
                </p>
              </div>

              <button
                onClick={() => onNavigateTab('reports')}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1.5 transition-colors self-start sm:self-auto"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-slate-600" />
                Ekspor Laporan Rombel
              </button>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">No</th>
                    <th className="py-2.5 px-3">NIS</th>
                    <th className="py-2.5 px-3">Nama Lengkap Siswa</th>
                    <th className="py-2.5 px-3 text-center">JK</th>
                    <th className="py-2.5 px-3 text-center">H</th>
                    <th className="py-2.5 px-3 text-center">S</th>
                    <th className="py-2.5 px-3 text-center">I</th>
                    <th className="py-2.5 px-3 text-center">A</th>
                    <th className="py-2.5 px-3 text-center">T</th>
                    <th className="py-2.5 px-3 text-center">D</th>
                    <th className="py-2.5 px-3 text-center">Total Sesi</th>
                    <th className="py-2.5 px-3 text-center">% Kehadiran</th>
                    <th className="py-2.5 px-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {studentSummaries.map((item, idx) => {
                    const isHighAlpa = item.alpa >= 2;
                    return (
                      <tr 
                        key={item.student.id} 
                        className={`hover:bg-slate-50 transition-colors ${isHighAlpa ? 'bg-rose-50/30' : ''}`}
                      >
                        <td className="py-2.5 px-3 text-slate-400 font-mono-tabular">{idx + 1}</td>
                        <td className="py-2.5 px-3 font-mono-tabular text-slate-600">{item.student.nis}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">
                          <div className="flex items-center gap-2">
                            <span>{item.student.name}</span>
                            {isHighAlpa && (
                              <span className="text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-1.5 rounded">
                                Perlu Perhatian
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono-tabular">{item.student.gender}</td>
                        <td className="py-2.5 px-3 text-center font-mono-tabular text-emerald-700 font-semibold">{item.hadir}</td>
                        <td className="py-2.5 px-3 text-center font-mono-tabular text-sky-700">{item.sakit}</td>
                        <td className="py-2.5 px-3 text-center font-mono-tabular text-indigo-700">{item.izin}</td>
                        <td className="py-2.5 px-3 text-center font-mono-tabular text-rose-700 font-bold">{item.alpa}</td>
                        <td className="py-2.5 px-3 text-center font-mono-tabular text-amber-700">{item.terlambat}</td>
                        <td className="py-2.5 px-3 text-center font-mono-tabular text-purple-700">{item.dispensasi}</td>
                        <td className="py-2.5 px-3 text-center font-mono-tabular text-slate-600">{item.totalValidSessions}</td>
                        <td className="py-2.5 px-3 text-center font-mono-tabular font-bold text-slate-900">
                          {item.rateFormatted}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={() => onOpenStudentDetail(item.student)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 font-medium transition-colors text-xs"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Detail Riwayat
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
      )}

      {/* VIEW 2: PENUNJUKAN & PERGANTIAN SEKRETARIS KELAS */}
      {mainTab === 'secretary' && (
        <div className="space-y-6">
          {/* SOP Guide Card for Homeroom Teacher / Admin */}
          <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 text-xs text-amber-900">
            <div className="flex items-start gap-2.5">
              <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="font-bold text-amber-950">
                  Panduan Penunjukan & Penggantian Sekretaris Kelas (SOP Sekolah)
                </h4>
                <ul className="list-disc list-inside space-y-1 text-amber-900/90 leading-relaxed">
                  <li>Sekretaris kelas harus ditunjuk dari siswa berstatus <strong>Aktif</strong> pada rombel ini.</li>
                  <li>Secara default, 1 rombel memiliki 1 sekretaris aktif. Jika pejabat sekretaris diganti, penugasan sebelumnya otomatis dinonaktifkan tanpa menghapus riwayat audit.</li>
                  <li>Akun pengguna sekretaris langsung terhubung dengan identitas siswa valid (zero duplicate student data).</li>
                  <li>Jika siswa mutasi/pindah kelas atau tidak aktif, hak akses sekretaris otomatis dicabut oleh sistem.</li>
                  <li>Sekretaris hanya berhak memantau data rombelnya dan mengajukan koreksi ke Wali Kelas.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Current Active Secretary Status Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
            <h3 className="text-sm font-bold text-slate-900 mb-3">
              Status Sekretaris Kelas Saat Ini ({activeRombel?.name})
            </h3>

            {activeSecretary ? (
              <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                    {activeSecretary.studentName.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900">{activeSecretary.studentName}</h4>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        Aktif Bertugas
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      NIS: <span className="font-mono-tabular font-medium text-slate-700">{activeSecretary.studentNis}</span> · Ditunjuk pada: {activeSecretary.assignedAt}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Oleh: {activeSecretary.assignedByUserName} · Catatan: "{activeSecretary.notes || '-'}"
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowRevokeModal(true)}
                  className="px-3.5 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg flex items-center gap-1.5 transition-colors self-start sm:self-auto"
                >
                  <UserMinus className="w-3.5 h-3.5 text-rose-600" />
                  Cabut Hak Akses Sekretaris
                </button>
              </div>
            ) : (
              <div className="p-6 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center">
                <UserPlus className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-700">Belum Ada Sekretaris Kelas Aktif</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Tunjuk salah satu siswa dari rombel {activeRombel?.name} menggunakan formulir di bawah.
                </p>
              </div>
            )}
          </div>

          {/* Form Penunjukan / Pergantian Sekretaris */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
            <h3 className="text-sm font-bold text-slate-900 mb-1">
              {activeSecretary ? 'Pergantian Pejabat Sekretaris Kelas' : 'Tunjuk Sekretaris Kelas Baru'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Pilih siswa aktif dari rombel {activeRombel?.name} untuk diberikan hak akses pemantauan dan pengajuan koreksi
            </p>

            <form onSubmit={handleAssignSecretary} className="space-y-4 max-w-xl">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pilih Siswa Calon Sekretaris <span className="text-rose-500">*</span>
                </label>
                <select
                  value={secretaryStudentId}
                  onChange={e => setSecretaryStudentId(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  required
                >
                  <option value="">-- Pilih Siswa Aktif {activeRombel?.name} --</option>
                  {rombelStudents.map(st => (
                    <option key={st.id} value={st.id}>
                      {st.name} (NIS: {st.nis}) {activeSecretary?.studentId === st.id ? ' [Sekretaris Saat Ini]' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catatan atau Surat Keputusan Penugasan (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Penunjukan sekretaris kelas semester genap berdasarkan musyawarah kelas"
                  value={secretaryNotes}
                  onChange={e => setSecretaryNotes(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
              >
                <UserPlus className="w-3.5 h-3.5 text-indigo-400" />
                {activeSecretary ? 'Simpan Pergantian Sekretaris' : 'Tetapkan Sebagai Sekretaris'}
              </button>
            </form>
          </div>

          {/* Histori Penugasan Sekretaris Kelas */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
            <h3 className="text-sm font-bold text-slate-900 mb-1">
              Riwayat Penugasan Sekretaris Kelas ({rombelSecretaryHistory.length} Catatan)
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Jejak penugasan sebelumnya tetap tersimpan dan tidak terhapus saat terjadi pergantian
            </p>

            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Nama Siswa</th>
                    <th className="py-2.5 px-3">NIS</th>
                    <th className="py-2.5 px-3">Mulai Ditugaskan</th>
                    <th className="py-2.5 px-3">Selesai / Dicabut</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Ditunjuk Oleh</th>
                    <th className="py-2.5 px-3">Catatan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rombelSecretaryHistory.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-slate-400 italic">
                        Belum ada riwayat penugasan sekretaris untuk rombel ini.
                      </td>
                    </tr>
                  ) : (
                    rombelSecretaryHistory.map(sa => (
                      <tr key={sa.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-semibold text-slate-900">{sa.studentName}</td>
                        <td className="py-2.5 px-3 font-mono-tabular text-slate-600">{sa.studentNis}</td>
                        <td className="py-2.5 px-3 font-mono-tabular text-slate-700">{sa.assignedAt}</td>
                        <td className="py-2.5 px-3 font-mono-tabular text-slate-500">{sa.deassignedAt || '-'}</td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            sa.isActive
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}>
                            {sa.isActive ? 'Aktif' : 'Nonaktif'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">{sa.assignedByUserName}</td>
                        <td className="py-2.5 px-3 text-slate-500 italic max-w-xs truncate">{sa.notes || '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: PEMERIKSAAN PENGAJUAN KOREKSI DARI SEKRETARIS */}
      {mainTab === 'corrections' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Verifikasi Pengajuan Koreksi Absensi ({rombelCorrectionRequests.length} Pengajuan)
              </h3>
              <p className="text-xs text-slate-500">
                Pemeriksaan ketidaksesuaian data absensi yang diajukan oleh Sekretaris Kelas {activeRombel?.name}
              </p>
            </div>
            {pendingCorrectionCount > 0 && (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                {pendingCorrectionCount} Menunggu Verifikasi
              </span>
            )}
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Pengaju & Waktu</th>
                  <th className="py-2.5 px-3">Siswa & NIS</th>
                  <th className="py-2.5 px-3">Mapel & Tanggal</th>
                  <th className="py-2.5 px-3 text-center">Status Tercatat</th>
                  <th className="py-2.5 px-3 text-center">Usulan Status</th>
                  <th className="py-2.5 px-3">Alasan & Bukti</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Tindakan Otoritas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rombelCorrectionRequests.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400 italic">
                      Tidak ada pengajuan koreksi untuk rombel ini.
                    </td>
                  </tr>
                ) : (
                  rombelCorrectionRequests.map(req => {
                    const isPending = req.status === 'PENDING';
                    const currentNote = reviewNoteInput[req.id] || '';

                    return (
                      <tr key={req.id} className={isPending ? 'bg-amber-50/20 hover:bg-amber-50/30' : 'hover:bg-slate-50'}>
                        <td className="py-2.5 px-3">
                          <span className="font-semibold text-slate-900 block">{req.submittedByName}</span>
                          <span className="text-[10px] text-slate-400 font-mono-tabular">{req.submittedAt}</span>
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">
                          {req.studentName}
                          <span className="text-[10px] text-slate-500 block font-mono-tabular font-normal">
                            NIS: {req.studentNis}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-800">
                          <span className="font-medium">{req.subjectName}</span>
                          <span className="text-[10px] text-slate-500 block font-mono-tabular">
                            Tgl: {formatDateIndo(req.attendanceDate)}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {getStatusBadge(req.currentStatus)}
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold">
                          {getStatusBadge(req.proposedStatus)}
                        </td>
                        <td className="py-2.5 px-3 max-w-xs text-slate-700">
                          <p className="line-clamp-2">{req.reason}</p>
                          {req.supportingEvidence && (
                            <span className="text-[10px] text-indigo-700 font-medium block mt-0.5">
                              Bukti: {req.supportingEvidence}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            req.status === 'PENDING' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                            req.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                            req.status === 'REJECTED' ? 'bg-rose-100 text-rose-800 border border-rose-300' :
                            'bg-blue-100 text-blue-800 border border-blue-300'
                          }`}>
                            {req.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          {isPending ? (
                            <div className="space-y-1.5 flex flex-col items-end">
                              <input
                                type="text"
                                placeholder="Catatan persetujuan..."
                                value={currentNote}
                                onChange={e => setReviewNoteInput(prev => ({ ...prev, [req.id]: e.target.value }))}
                                className="text-[11px] px-2 py-1 border border-slate-200 rounded w-44"
                              />
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleProcessRequest(req.id, 'APPROVED')}
                                  className="px-2 py-1 text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded shadow-2xs flex items-center gap-1 transition-colors"
                                  title="Setujui dan mutakhirkan catatan absensi resmi"
                                >
                                  <Check className="w-3 h-3" />
                                  Setujui & Perbarui
                                </button>
                                <button
                                  onClick={() => handleProcessRequest(req.id, 'REJECTED')}
                                  className="px-2 py-1 text-[11px] font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded transition-colors"
                                  title="Tolak pengajuan koreksi"
                                >
                                  <X className="w-3 h-3" />
                                  Tolak
                                </button>
                                <button
                                  onClick={() => handleProcessRequest(req.id, 'NEED_INFO')}
                                  className="px-2 py-1 text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded transition-colors"
                                  title="Minta informasi/bukti tambahan"
                                >
                                  Info
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="text-[11px] text-slate-500 text-right">
                              <span className="font-medium text-slate-700 block">Selesai Ditinjau</span>
                              <span>Oleh: {req.reviewedByName || '-'}</span>
                              {req.reviewNotes && (
                                <span className="text-[10px] text-slate-400 block italic">
                                  "{req.reviewNotes}"
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Revoke Confirmation Modal */}
      {showRevokeModal && activeSecretary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900">
              Cabut Hak Akses Sekretaris Kelas?
            </h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Tindakan ini akan mencabut hak akses sekretaris untuk <strong className="text-slate-900">{activeSecretary.studentName}</strong> pada rombel {activeRombel?.name}. Riwayat penugasannya tetap tercatat di sistem audit.
            </p>

            <div className="mt-4">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Alasan Pencabutan (Wajib)
              </label>
              <textarea
                value={secretaryRevokeReason}
                onChange={e => setSecretaryRevokeReason(e.target.value)}
                placeholder="Contoh: Evaluasi kedisiplinan atau pergantian pengurus kelas"
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 h-20 resize-none"
                required
              />
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowRevokeModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmRevoke}
                disabled={!secretaryRevokeReason.trim()}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-lg transition-colors"
              >
                Ya, Cabut Akses
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

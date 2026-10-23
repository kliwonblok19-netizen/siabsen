import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Calendar, 
  Clock, 
  BookOpen, 
  CheckCircle2, 
  AlertCircle, 
  ClipboardCheck, 
  Users, 
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { formatDateIndo } from '../utils/attendanceCalculations';

interface DashboardGuruProps {
  onStartAttendance: (scheduleId?: string, rombelId?: string, subjectId?: string) => void;
  onNavigateTab: (tab: string) => void;
}

export const DashboardGuru: React.FC<DashboardGuruProps> = ({
  onStartAttendance,
  onNavigateTab
}) => {
  const { 
    currentUser, 
    teachers, 
    teachingAssignments, 
    schedules, 
    rombels, 
    subjects, 
    sessions, 
    activeAcademicYear,
    correctionRequests,
    reviewCorrectionRequest
  } = useApp();

  const teacher = teachers.find(t => t.id === currentUser.teacherId);

  // Teaching Assignments of this teacher
  const myAssignments = useMemo(() => {
    if (!currentUser.teacherId) return [];
    return teachingAssignments.filter(ta => ta.teacherId === currentUser.teacherId);
  }, [teachingAssignments, currentUser.teacherId]);

  // Correction requests relevant to this teacher's assigned subjects & classes
  const myCorrectionRequests = useMemo(() => {
    if (!currentUser.teacherId) return [];
    return correctionRequests.filter(cr => 
      myAssignments.some(ta => ta.rombelId === cr.rombelId && ta.subjectId === cr.subjectId)
    );
  }, [correctionRequests, myAssignments, currentUser.teacherId]);

  // Schedules of this teacher
  const mySchedules = useMemo(() => {
    if (!currentUser.teacherId) return [];
    return schedules.filter(sch => sch.teacherId === currentUser.teacherId);
  }, [schedules, currentUser.teacherId]);

  // Sessions created by this teacher
  const mySessions = useMemo(() => {
    if (!currentUser.teacherId) return [];
    return sessions.filter(s => s.teacherId === currentUser.teacherId);
  }, [sessions, currentUser.teacherId]);

  const daysIndo = ['', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

  return (
    <div className="space-y-6">
      {/* Teacher / Secretary Profile Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-lg shrink-0">
              {currentUser.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2 py-0.5 rounded border bg-emerald-50 text-emerald-700 border-emerald-200">
                  Guru Pengampu
                </span>
                <span className="text-xs text-slate-400">·</span>
                <span className="text-xs text-slate-500 font-medium">
                  NIP: {teacher?.nip || '-'}
                </span>
              </div>
              <h1 className="text-xl font-bold text-slate-900 mt-1">
                Selamat Datang, {currentUser.name}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Spesialisasi: {teacher?.specialization || 'Guru Kejuruan'} · Tahun Ajaran {activeAcademicYear.name}
              </p>
            </div>
          </div>

          <button
            onClick={() => onStartAttendance()}
            className="px-4 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs flex items-center gap-2 self-start sm:self-auto transition-colors"
          >
            <ClipboardCheck className="w-4 h-4" />
            + Buat Sesi Presensi Baru
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Penugasan Mengajar</span>
            <BookOpen className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 font-mono-tabular">
            {myAssignments.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Mata pelajaran & rombel diampu
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Jadwal Mengajar Mingguan</span>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 font-mono-tabular">
            {mySchedules.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Slot jadwal pembelajaran
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Sesi Selesai Diabsen</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 font-mono-tabular">
            {mySessions.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Total pertemuan tercatat
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Laporan Rekap</span>
            <ClipboardCheck className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="mt-2 text-xs font-bold text-indigo-600 block pt-2">
            <button
              onClick={() => onNavigateTab('reports')}
              className="hover:underline flex items-center gap-1"
            >
              Lihat Rekap Mapel <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Rekap per kelas & siswa
          </div>
        </div>
      </div>

      {/* Jadwal Mengajar Guru Cards */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Jadwal Mengajar Anda Pekan Ini
            </h3>
            <p className="text-xs text-slate-500">
              Pilih jadwal untuk langsung membuka formulir presensi pertemuan siswa
            </p>
          </div>
        </div>

        {mySchedules.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            Belum ada jadwal mengajar yang dialokasikan ke akun Anda.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {mySchedules.map(sch => {
              const r = rombels.find(rm => rm.id === sch.rombelId);
              const subj = subjects.find(s => s.id === sch.subjectId);
              return (
                <div
                  key={sch.id}
                  className="border border-slate-200 rounded-xl p-4 hover:border-indigo-400 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                        Hari {daysIndo[sch.dayOfWeek]}
                      </span>
                      <span className="text-[11px] font-mono-tabular text-slate-500">
                        {sch.timeStart} - {sch.timeEnd}
                      </span>
                    </div>

                    <div className="mt-3">
                      <h4 className="font-bold text-sm text-slate-900 leading-snug">
                        {subj?.name}
                      </h4>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Kelas: <span className="font-semibold text-slate-800">{r?.name} ({r?.code})</span>
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Ruang: {sch.room} · Jam ke-{sch.periodStart} s/d {sch.periodEnd}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <button
                      onClick={() => onStartAttendance(sch.id, sch.rombelId, sch.subjectId)}
                      className="w-full py-1.5 px-3 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-indigo-600 hover:text-white rounded-lg transition-colors flex items-center justify-center gap-1.5"
                    >
                      <ClipboardCheck className="w-3.5 h-3.5" />
                      Catat Presensi Kelas Ini
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Panel Pengajuan Koreksi dari Sekretaris Kelas untuk Mapel Guru Ini */}
      {myCorrectionRequests.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Pengajuan Koreksi dari Sekretaris Kelas ({myCorrectionRequests.length} Pengajuan)
              </h3>
              <p className="text-xs text-slate-500">
                Laporan ketidaksesuaian absensi pada mata pelajaran yang Anda ampu
              </p>
            </div>
            {myCorrectionRequests.filter(c => c.status === 'PENDING').length > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                {myCorrectionRequests.filter(c => c.status === 'PENDING').length} Perlu Diperiksa
              </span>
            )}
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-2 px-3">Tanggal Sesi</th>
                  <th className="py-2 px-3">Kelas & Siswa</th>
                  <th className="py-2 px-3">Mata Pelajaran</th>
                  <th className="py-2 px-3 text-center">Tercatat</th>
                  <th className="py-2 px-3 text-center">Usulan</th>
                  <th className="py-2 px-3">Alasan Sekretaris</th>
                  <th className="py-2 px-3">Status</th>
                  <th className="py-2 px-3 text-right">Aksi Guru</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {myCorrectionRequests.map(req => {
                  const isPending = req.status === 'PENDING';
                  return (
                    <tr key={req.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-mono-tabular text-slate-700">{formatDateIndo(req.attendanceDate)}</td>
                      <td className="py-2.5 px-3">
                        <span className="font-semibold text-slate-900 block">{req.studentName}</span>
                        <span className="text-[10px] text-slate-400 font-mono-tabular">{req.rombelName} · {req.studentNis}</span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-700">{req.subjectName}</td>
                      <td className="py-2.5 px-3 text-center font-bold text-slate-600">{req.currentStatus}</td>
                      <td className="py-2.5 px-3 text-center font-bold text-indigo-700">{req.proposedStatus}</td>
                      <td className="py-2.5 px-3 text-slate-600 max-w-xs truncate" title={req.reason}>
                        {req.reason}
                        {req.supportingEvidence && <span className="block text-[10px] text-indigo-600">Bukti: {req.supportingEvidence}</span>}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          req.status === 'PENDING' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                          req.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                          'bg-rose-50 text-rose-800 border border-rose-200'
                        }`}>
                          {req.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {isPending ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => reviewCorrectionRequest(req.id, 'APPROVED', 'Disetujui oleh Guru Pengampu')}
                              className="px-2 py-1 text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded shadow-2xs"
                            >
                              Setujui
                            </button>
                            <button
                              onClick={() => reviewCorrectionRequest(req.id, 'REJECTED', 'Ditolak oleh Guru Pengampu')}
                              className="px-2 py-1 text-[11px] font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded"
                            >
                              Tolak
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400">Selesai ({req.reviewedByName})</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Riwayat Sesi Presensi Terakhir Oleh Guru Ini */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Riwayat Pertemuan & Presensi Terakhir Anda
            </h3>
            <p className="text-xs text-slate-500">
              Catatan pertemuan yang telah disimpan ke dalam pangkalan data
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px]">
                <th className="py-2.5 px-3">Tanggal</th>
                <th className="py-2.5 px-3">Kelas</th>
                <th className="py-2.5 px-3">Mata Pelajaran</th>
                <th className="py-2.5 px-3">Pertemuan</th>
                <th className="py-2.5 px-3">Materi / Bahasan</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {mySessions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Anda belum memiliki riwayat presensi. Klik tombol di atas untuk mencatat pertemuan pertama.
                  </td>
                </tr>
              ) : (
                mySessions.map(s => {
                  const r = rombels.find(rm => rm.id === s.rombelId);
                  const subj = subjects.find(sb => sb.id === s.subjectId);
                  return (
                    <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3 font-mono-tabular font-medium text-slate-800">
                        {formatDateIndo(s.date)}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">
                        {r?.name}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700">
                        {subj?.name}
                      </td>
                      <td className="py-2.5 px-3 font-mono-tabular">
                        Ke-{s.meetingNumber}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 max-w-xs truncate">
                        {s.topic || '-'}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                          s.status === 'locked' ? 'bg-slate-100 text-slate-700' : 'bg-emerald-50 text-emerald-700'
                        }`}>
                          {s.status === 'locked' ? 'Terkunci' : 'Selesai'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => onStartAttendance(undefined, s.rombelId, s.subjectId)}
                          className="text-indigo-600 hover:text-indigo-800 font-semibold"
                        >
                          Buka / Edit
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

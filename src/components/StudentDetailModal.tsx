import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Student, AttendanceStatus, AttendanceRecord } from '../types';
import { 
  X, 
  Calendar, 
  BookOpen, 
  User, 
  Clock, 
  FileText, 
  Printer, 
  Edit3, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import { formatDateIndo, calculateStudentAttendance } from '../utils/attendanceCalculations';

interface StudentDetailModalProps {
  student: Student | null;
  onClose: () => void;
}

export const StudentDetailModal: React.FC<StudentDetailModalProps> = ({ student, onClose }) => {
  const { 
    sessions, 
    records, 
    subjects, 
    teachers, 
    rombels, 
    departments, 
    currentUser, 
    correctStudentRecord,
    settings,
    activeAcademicYear
  } = useApp();

  const [filterSubjectId, setFilterSubjectId] = useState<string>('all');
  const [editingRecord, setEditingRecord] = useState<{
    record: AttendanceRecord;
    sessionTopic: string;
    subjectName: string;
    newStatus: AttendanceStatus;
    newNote: string;
    reason: string;
  } | null>(null);

  if (!student) return null;

  const rombel = rombels.find(r => r.id === student.rombelId);
  const dept = departments.find(d => d.id === student.departmentId);

  // Overall attendance stats
  const stats = calculateStudentAttendance(student, sessions, records, {
    academicYearId: activeAcademicYear.id
  });

  // Find all attendance records for this student
  const studentRecordsWithSessions = useMemo(() => {
    return records
      .filter(r => r.studentId === student.id)
      .map(r => {
        const session = sessions.find(s => s.id === r.sessionId);
        const subject = subjects.find(sb => sb.id === session?.subjectId);
        const teacher = teachers.find(t => t.id === session?.teacherId);
        return {
          record: r,
          session,
          subject,
          teacher
        };
      })
      .filter(item => {
        if (!item.session) return false;
        if (filterSubjectId !== 'all' && item.session.subjectId !== filterSubjectId) return false;
        return true;
      })
      .sort((a, b) => (b.session?.date || '').localeCompare(a.session?.date || ''));
  }, [records, sessions, subjects, teachers, student.id, filterSubjectId]);

  const handleCorrectionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;
    if (!editingRecord.reason.trim()) {
      alert('Alasan koreksi harus diisi untuk dokumen audit!');
      return;
    }

    correctStudentRecord(
      editingRecord.record.id,
      editingRecord.newStatus,
      editingRecord.newNote,
      editingRecord.reason
    );
    setEditingRecord(null);
  };

  const getStatusBadge = (status: AttendanceStatus) => {
    switch (status) {
      case 'H':
        return <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px]">Hadir</span>;
      case 'S':
        return <span className="font-semibold text-sky-700 bg-sky-50 px-2 py-0.5 rounded text-[11px]">Sakit</span>;
      case 'I':
        return <span className="font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded text-[11px]">Izin</span>;
      case 'A':
        return <span className="font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded text-[11px]">Alpa</span>;
      case 'T':
        return <span className="font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-[11px]">Terlambat</span>;
      case 'D':
        return <span className="font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded text-[11px]">Dispensasi</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] shadow-2xl border border-slate-200 flex flex-col my-auto">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm shrink-0">
              {student.name.charAt(0)}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Riwayat Presensi: {student.name}
              </h2>
              <p className="text-xs text-slate-500">
                NIS: {student.nis} · NISN: {student.nisn || '-'} · Rombel: {rombel?.name} ({dept?.code})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-5 overflow-y-auto flex-1">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-center">
              <span className="text-[10px] text-slate-500 block">Total Sesi</span>
              <span className="font-bold text-sm font-mono-tabular text-slate-900">{stats.totalValidSessions}</span>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2.5 text-center">
              <span className="text-[10px] text-emerald-800 block">Hadir</span>
              <span className="font-bold text-sm font-mono-tabular text-emerald-950">{stats.hadir}</span>
            </div>
            <div className="bg-sky-50 border border-sky-200 rounded-lg p-2.5 text-center">
              <span className="text-[10px] text-sky-800 block">Sakit</span>
              <span className="font-bold text-sm font-mono-tabular text-sky-950">{stats.sakit}</span>
            </div>
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-2.5 text-center">
              <span className="text-[10px] text-indigo-800 block">Izin</span>
              <span className="font-bold text-sm font-mono-tabular text-indigo-950">{stats.izin}</span>
            </div>
            <div className="bg-rose-50 border border-rose-200 rounded-lg p-2.5 text-center">
              <span className="text-[10px] text-rose-800 block">Alpa</span>
              <span className="font-bold text-sm font-mono-tabular text-rose-950">{stats.alpa}</span>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-center">
              <span className="text-[10px] text-amber-800 block">Terlambat</span>
              <span className="font-bold text-sm font-mono-tabular text-amber-950">{stats.terlambat}</span>
            </div>
            <div className="bg-slate-900 text-white rounded-lg p-2.5 text-center">
              <span className="text-[10px] text-slate-300 block">% Kehadiran</span>
              <span className="font-bold text-sm font-mono-tabular text-white">{stats.rateFormatted}</span>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Filter Mapel:</span>
              <select
                value={filterSubjectId}
                onChange={e => setFilterSubjectId(e.target.value)}
                className="text-xs bg-white border border-slate-200 rounded-lg px-3 py-1 text-slate-700"
              >
                <option value="all">Semua Mata Pelajaran</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <span className="text-xs text-slate-400 font-mono-tabular">
              {studentRecordsWithSessions.length} sesi tercatat
            </span>
          </div>

          {/* Historical Log Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Tanggal</th>
                  <th className="py-2.5 px-3">Mata Pelajaran</th>
                  <th className="py-2.5 px-3">Guru Pengampu</th>
                  <th className="py-2.5 px-3">Pertemuan</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Catatan / Alasan</th>
                  {(currentUser.role === 'admin' || (currentUser.role === 'wali_kelas' && settings.allowHomeroomCorrection)) && (
                    <th className="py-2.5 px-3 text-right">Koreksi</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {studentRecordsWithSessions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      Belum ada sesi presensi yang tercatat untuk siswa ini pada mata pelajaran terpilih.
                    </td>
                  </tr>
                ) : (
                  studentRecordsWithSessions.map(({ record, session, subject, teacher }) => (
                    <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3 font-mono-tabular text-slate-800">
                        {formatDateIndo(session?.date)}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-900">
                        {subject?.name || '-'}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">
                        {teacher?.name || '-'}
                      </td>
                      <td className="py-2.5 px-3 font-mono-tabular text-slate-600">
                        Ke-{session?.meetingNumber || 1}
                      </td>
                      <td className="py-2.5 px-3">
                        {getStatusBadge(record.status)}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 italic">
                        {record.note || '-'}
                      </td>
                      {(currentUser.role === 'admin' || (currentUser.role === 'wali_kelas' && settings.allowHomeroomCorrection)) && (
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={() => {
                              setEditingRecord({
                                record,
                                sessionTopic: session?.topic || '',
                                subjectName: subject?.name || '',
                                newStatus: record.status,
                                newNote: record.note || '',
                                reason: ''
                              });
                            }}
                            className="inline-flex items-center gap-1 px-2 py-0.5 text-xs text-indigo-600 hover:text-indigo-900 font-medium hover:bg-indigo-50 rounded"
                          >
                            <Edit3 className="w-3 h-3" />
                            Koreksi
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between rounded-b-2xl">
          <div className="text-[11px] text-slate-500">
            Koreksi data akan diaudit otomatis untuk menjamin integritas laporan resmi.
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Tutup
          </button>
        </div>

      </div>

      {/* Koreksi Record Modal */}
      {editingRecord && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-5 shadow-2xl border border-slate-200 animate-in zoom-in-95">
            <h3 className="text-sm font-bold text-slate-900">
              Koreksi Presensi Resmi (Dengan Catatan Audit)
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Siswa: <span className="font-semibold text-slate-800">{student.name}</span> · Mapel: {editingRecord.subjectName}
            </p>

            <form onSubmit={handleCorrectionSubmit} className="space-y-3 mt-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Status Kehadiran Baru
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['H', 'S', 'I', 'A', 'T', 'D'] as AttendanceStatus[]).map(st => (
                    <button
                      type="button"
                      key={st}
                      onClick={() => setEditingRecord({ ...editingRecord, newStatus: st })}
                      className={`py-1.5 px-2 text-xs font-semibold rounded border transition-colors ${
                        editingRecord.newStatus === st
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {st === 'H' ? 'Hadir (H)' :
                       st === 'S' ? 'Sakit (S)' :
                       st === 'I' ? 'Izin (I)' :
                       st === 'A' ? 'Alpa (A)' :
                       st === 'T' ? 'Terlambat (T)' : 'Dispensasi (D)'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Keterangan Khusus
                </label>
                <input
                  type="text"
                  value={editingRecord.newNote}
                  onChange={e => setEditingRecord({ ...editingRecord, newNote: e.target.value })}
                  placeholder="Contoh: Surat sakit dari RSUD"
                  className="w-full text-xs border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-indigo-600"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Alasan Koreksi <span className="text-rose-500">* (Wajib Audit)</span>
                </label>
                <textarea
                  rows={2}
                  required
                  value={editingRecord.reason}
                  onChange={e => setEditingRecord({ ...editingRecord, reason: e.target.value })}
                  placeholder="Contoh: Orang tua menyusulkan surat izin dokter pada siang hari"
                  className="w-full text-xs border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-indigo-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingRecord(null)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

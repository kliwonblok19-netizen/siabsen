import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  X, 
  Send, 
  AlertCircle, 
  FileText, 
  Calendar, 
  BookOpen, 
  User, 
  CheckCircle2,
  Clock
} from 'lucide-react';
import { AttendanceStatus, Student } from '../types';

interface CorrectionRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetStudent?: Student | null;
  targetSubjectId?: string;
  targetDate?: string;
  targetCurrentStatus?: AttendanceStatus | '-';
  targetSessionId?: string;
}

export const CorrectionRequestModal: React.FC<CorrectionRequestModalProps> = ({
  isOpen,
  onClose,
  targetStudent,
  targetSubjectId,
  targetDate,
  targetCurrentStatus,
  targetSessionId
}) => {
  const { 
    currentUser, 
    students, 
    subjects, 
    sessions, 
    records, 
    rombels,
    submitCorrectionRequest 
  } = useApp();

  // Find user's assigned rombel
  const userRombelId = currentUser.secretaryRombelId || rombels[0]?.id || '';
  const rombelStudents = students.filter(s => s.rombelId === userRombelId && s.status === 'active');

  const [studentId, setStudentId] = useState(targetStudent ? targetStudent.id : (rombelStudents[0]?.id || ''));
  const [subjectId, setSubjectId] = useState(targetSubjectId || subjects[0]?.id || '');
  const [attendanceDate, setAttendanceDate] = useState(targetDate || '2026-10-17');
  const [proposedStatus, setProposedStatus] = useState<AttendanceStatus>('S');
  const [reason, setReason] = useState('');
  const [supportingEvidence, setSupportingEvidence] = useState('');
  const [proposedNote, setProposedNote] = useState('');

  // Update form if props change
  useEffect(() => {
    if (targetStudent) setStudentId(targetStudent.id);
    if (targetSubjectId) setSubjectId(targetSubjectId);
    if (targetDate) setAttendanceDate(targetDate);
    if (targetCurrentStatus && targetCurrentStatus !== '-') {
      // Suggest a sensible different status
      setProposedStatus(targetCurrentStatus === 'A' ? 'S' : 'H');
    }
  }, [targetStudent, targetSubjectId, targetDate, targetCurrentStatus]);

  if (!isOpen) return null;

  // Find current attendance record if it exists
  const currentRecord = records.find(r => {
    const session = sessions.find(s => s.id === r.sessionId);
    return session && 
      session.rombelId === userRombelId && 
      session.subjectId === subjectId && 
      session.date === attendanceDate && 
      r.studentId === studentId;
  });

  const activeCurrentStatus: AttendanceStatus | '-' = targetCurrentStatus || (currentRecord ? currentRecord.status : '-');
  const activeCurrentNote: string = currentRecord?.note || '';

  const getStatusLabel = (st: AttendanceStatus | '-') => {
    switch (st) {
      case 'H': return 'Hadir';
      case 'S': return 'Sakit';
      case 'I': return 'Izin';
      case 'A': return 'Alpa / Tanpa Keterangan';
      case 'T': return 'Terlambat';
      case 'D': return 'Dispensasi';
      default: return 'Belum Ada Rekaman';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId || !subjectId || !attendanceDate || !reason.trim()) {
      return;
    }

    const res = submitCorrectionRequest({
      studentId,
      subjectId,
      attendanceDate,
      proposedStatus,
      reason: reason.trim(),
      supportingEvidence: supportingEvidence.trim(),
      currentStatus: activeCurrentStatus,
      currentNote: activeCurrentNote,
      proposedNote: proposedNote.trim(),
      sessionId: targetSessionId || currentRecord?.sessionId
    });

    if (res.success) {
      setReason('');
      setSupportingEvidence('');
      setProposedNote('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Pengajuan Koreksi Absensi
              </h3>
              <p className="text-xs text-slate-500">
                Laporan ketidaksesuaian data kehadiran kepada Wali Kelas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Security / Workflow Notice */}
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold">Ketentuan Pengajuan Koreksi:</span>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              Pengajuan ini berstatus <span className="font-semibold">Menunggu</span> dan <strong>TIDAK</strong> langsung mengubah absensi resmi. Perubahan catatan resmi hanya berlaku setelah diverifikasi dan disetujui oleh Wali Kelas atau Guru Pengampu.
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Siswa */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Siswa yang Diajukan Koreksi <span className="text-rose-500">*</span>
            </label>
            <select
              value={studentId}
              onChange={e => setStudentId(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              required
            >
              {rombelStudents.map(st => (
                <option key={st.id} value={st.id}>
                  {st.name} (NIS: {st.nis})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Tanggal */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tanggal Absensi <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={attendanceDate}
                onChange={e => setAttendanceDate(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            {/* Mata Pelajaran */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mata Pelajaran <span className="text-rose-500">*</span>
              </label>
              <select
                value={subjectId}
                onChange={e => setSubjectId(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                required
              >
                {subjects.map(sb => (
                  <option key={sb.id} value={sb.id}>
                    {sb.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Status comparison card */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-2 gap-3">
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                Status Tercatat Saat Ini
              </span>
              <div className="mt-1 flex items-center gap-1.5">
                <span className="font-bold text-sm text-slate-800">
                  {getStatusLabel(activeCurrentStatus)}
                </span>
              </div>
              {activeCurrentNote && (
                <span className="text-[11px] text-slate-500 block truncate mt-0.5">
                  Ket: {activeCurrentNote}
                </span>
              )}
            </div>

            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                Usulan Status Baru <span className="text-rose-500">*</span>
              </span>
              <select
                value={proposedStatus}
                onChange={e => setProposedStatus(e.target.value as AttendanceStatus)}
                className="mt-1 w-full text-xs px-2.5 py-1.5 border border-indigo-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold bg-white text-indigo-900"
                required
              >
                <option value="H">Hadir (H)</option>
                <option value="S">Sakit (S)</option>
                <option value="I">Izin (I)</option>
                <option value="A">Alpa (A)</option>
                <option value="T">Terlambat (T)</option>
                <option value="D">Dispensasi (D)</option>
              </select>
            </div>
          </div>

          {/* Alasan Koreksi */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Alasan atau Keterangan Ketidaksesuaian <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Contoh: Siswa menyerahkan surat dokter dari Klinik Medika setelah jam istirahat; sebelumnya tercatat alpa."
              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 h-20 resize-none"
              required
            />
          </div>

          {/* Bukti Pendukung */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Informasi Bukti Pendukung (Opsional)
            </label>
            <input
              type="text"
              value={supportingEvidence}
              onChange={e => setSupportingEvidence(e.target.value)}
              placeholder="Contoh: Surat Dokter No. 042/KM/X/2026 atau Konfirmasi Ortu via WA"
              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Catatan Absensi Baru */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Usulan Catatan di Buku Absensi (Opsional)
            </label>
            <input
              type="text"
              value={proposedNote}
              onChange={e => setProposedNote(e.target.value)}
              placeholder="Contoh: Sakit demam tinggi (Surat dokter terlampir)"
              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Footer Action */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              Kirim Pengajuan Koreksi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

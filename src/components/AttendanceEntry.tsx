import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { AttendanceStatus, Student, AttendanceSession } from '../types';
import { 
  ClipboardCheck, 
  Check, 
  Lock, 
  Unlock, 
  AlertCircle, 
  Calendar, 
  Clock, 
  BookOpen, 
  Users, 
  Save, 
  ArrowLeft,
  FileText,
  UserCheck,
  Zap,
  ListFilter,
  CheckCircle2,
  Trash2,
  Plus,
  Eye,
  EyeOff,
  UserX
} from 'lucide-react';
import { formatDateIndo } from '../utils/attendanceCalculations';

interface AttendanceEntryProps {
  initialRombelId?: string;
  initialSubjectId?: string;
  onBackToDashboard?: () => void;
}

export const AttendanceEntry: React.FC<AttendanceEntryProps> = ({
  initialRombelId,
  initialSubjectId,
  onBackToDashboard
}) => {
  const { 
    currentUser, 
    rombels, 
    subjects, 
    teachers,
    teachingAssignments, 
    students, 
    sessions, 
    records, 
    createAttendanceSession, 
    updateAttendanceRecords,
    lockSession,
    unlockSession,
    activeAcademicYear,
    showToast
  } = useApp();

  const isSecretaryUser = currentUser.role === 'sekretaris';
  const secretaryDefaultRombelId = currentUser.secretaryRombelId || '';

  // Determine allowed classes & subjects for current user
  // If admin: can select ANY class and subject.
  // If secretary: restricted to their class.
  // If teacher: ONLY classes and subjects assigned to them in teachingAssignments!
  const allowedAssignments = useMemo(() => {
    if (currentUser.role === 'admin') {
      return null; // All allowed
    }
    if (isSecretaryUser) {
      return teachingAssignments.filter(ta => ta.rombelId === secretaryDefaultRombelId);
    }
    return teachingAssignments.filter(ta => ta.teacherId === currentUser.teacherId);
  }, [currentUser, teachingAssignments, isSecretaryUser, secretaryDefaultRombelId]);

  const availableRombels = useMemo(() => {
    if (currentUser.role === 'admin') return rombels;
    if (isSecretaryUser) {
      return rombels.filter(r => r.id === secretaryDefaultRombelId);
    }
    if (!allowedAssignments) return [];
    const allowedRombelIds = new Set(allowedAssignments.map(a => a.rombelId));
    return rombels.filter(r => allowedRombelIds.has(r.id));
  }, [currentUser, allowedAssignments, rombels, isSecretaryUser, secretaryDefaultRombelId]);

  // Selected State
  const [selectedRombelId, setSelectedRombelId] = useState<string>(
    initialRombelId || (availableRombels[0]?.id || '')
  );

  const availableSubjectsForRombel = useMemo(() => {
    if (currentUser.role === 'admin') return subjects;
    if (isSecretaryUser) {
      const allowedSubjectIds = new Set(
        teachingAssignments.filter(ta => ta.rombelId === selectedRombelId).map(ta => ta.subjectId)
      );
      return subjects.filter(s => allowedSubjectIds.has(s.id));
    }
    if (!allowedAssignments) return [];
    const allowedSubjectIds = new Set(
      allowedAssignments
        .filter(a => a.rombelId === selectedRombelId)
        .map(a => a.subjectId)
    );
    return subjects.filter(s => allowedSubjectIds.has(s.id));
  }, [currentUser, allowedAssignments, subjects, selectedRombelId, isSecretaryUser, teachingAssignments]);

  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(
    initialSubjectId || (availableSubjectsForRombel[0]?.id || '')
  );

  // Update selectedSubjectId if current becomes invalid
  useEffect(() => {
    if (availableSubjectsForRombel.length > 0) {
      if (!availableSubjectsForRombel.find(s => s.id === selectedSubjectId)) {
        setSelectedSubjectId(availableSubjectsForRombel[0].id);
      }
    }
  }, [availableSubjectsForRombel, selectedSubjectId]);

  // Pelaksana Presensi: Guru vs Sekretaris
  const [recordedByRole, setRecordedByRole] = useState<'guru' | 'sekretaris'>(
    isSecretaryUser ? 'sekretaris' : 'guru'
  );
  const [secretaryName, setSecretaryName] = useState<string>(
    isSecretaryUser ? currentUser.name : 'Anisa Rahmawati (Sekretaris Kelas)'
  );

  // Mode Entri Presensi: 'exception' (Hanya Siswa Tidak Masuk) vs 'full' (Tabel Lengkap)
  const [entryMode, setEntryMode] = useState<'exception' | 'full'>('exception');

  // Quick Absent Input state for exception mode
  const [selectedAbsentStudentId, setSelectedAbsentStudentId] = useState<string>('');
  const [absentStatus, setAbsentStatus] = useState<AttendanceStatus>('S');
  const [absentNote, setAbsentNote] = useState<string>('');
  const [showFullPreviewInExceptionMode, setShowFullPreviewInExceptionMode] = useState<boolean>(false);

  // Session metadata form
  const [sessionDate, setSessionDate] = useState<string>('2026-10-17'); // Context current date
  const [period, setPeriod] = useState<string>('Jam ke-1 s/d 3 (07:15 - 09:30)');
  const [meetingNumber, setMeetingNumber] = useState<number>(1);
  const [topic, setTopic] = useState<string>('');

  // Check if an existing session already exists for this combo
  const existingSession = useMemo(() => {
    return sessions.find(s => 
      s.rombelId === selectedRombelId &&
      s.subjectId === selectedSubjectId &&
      s.date === sessionDate &&
      s.meetingNumber === meetingNumber &&
      s.status !== 'cancelled'
    );
  }, [sessions, selectedRombelId, selectedSubjectId, sessionDate, meetingNumber]);

  // Students in selected rombel
  const rombelStudents = useMemo(() => {
    return students.filter(s => s.rombelId === selectedRombelId && s.status === 'active');
  }, [students, selectedRombelId]);

  // Attendance inputs state: Map of studentId -> { status, note }
  const [studentEntries, setStudentEntries] = useState<Record<string, { status: AttendanceStatus; note: string }>>({});

  // Auto calculate next meeting number when rombel or subject changes
  useEffect(() => {
    const pastSessionsForSubject = sessions.filter(
      s => s.rombelId === selectedRombelId && s.subjectId === selectedSubjectId
    );
    if (pastSessionsForSubject.length > 0) {
      const maxMeeting = Math.max(...pastSessionsForSubject.map(s => s.meetingNumber));
      setMeetingNumber(maxMeeting + 1);
    } else {
      setMeetingNumber(1);
    }
  }, [selectedRombelId, selectedSubjectId, sessions]);

  // Populate studentEntries when students or existingSession changes
  useEffect(() => {
    if (existingSession) {
      // Load existing records
      const existingRecs = records.filter(r => r.sessionId === existingSession.id);
      const newEntries: Record<string, { status: AttendanceStatus; note: string }> = {};
      
      rombelStudents.forEach(st => {
        const found = existingRecs.find(r => r.studentId === st.id);
        if (found) {
          newEntries[st.id] = { status: found.status, note: found.note || '' };
        } else {
          newEntries[st.id] = { status: 'H', note: '' };
        }
      });
      setStudentEntries(newEntries);
      if (existingSession.topic) setTopic(existingSession.topic);
      if (existingSession.period) setPeriod(existingSession.period);
      if (existingSession.recordedByRole) setRecordedByRole(existingSession.recordedByRole);
      if (existingSession.recorderName) setSecretaryName(existingSession.recorderName);
      if (existingSession.inputMode) {
        setEntryMode(existingSession.inputMode === 'exception_only' ? 'exception' : 'full');
      }
    } else {
      // Default all to Hadir (H) as requested: yang tidak dimasukkan otomatis Hadir (H/.)
      const defaults: Record<string, { status: AttendanceStatus; note: string }> = {};
      rombelStudents.forEach(st => {
        defaults[st.id] = { status: 'H', note: '' };
      });
      setStudentEntries(defaults);
    }
  }, [existingSession, rombelStudents, records]);

  // Students who are currently absent (S, I, A, T, D)
  const absentStudents = useMemo(() => {
    return rombelStudents.filter(st => {
      const entry = studentEntries[st.id];
      return entry && entry.status !== 'H';
    });
  }, [rombelStudents, studentEntries]);

  // Students who are currently present (H) and can be added to absent list
  const presentStudents = useMemo(() => {
    return rombelStudents.filter(st => {
      const entry = studentEntries[st.id];
      return !entry || entry.status === 'H';
    });
  }, [rombelStudents, studentEntries]);

  // Mass action: Mark all Present
  const handleMarkAllPresent = () => {
    const updated: Record<string, { status: AttendanceStatus; note: string }> = {};
    rombelStudents.forEach(st => {
      updated[st.id] = { status: 'H', note: '' };
    });
    setStudentEntries(updated);
    showToast('Seluruh siswa ditandai Hadir (H/.)', 'info');
  };

  // Change single student status
  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setStudentEntries(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status
      }
    }));
  };

  // Change single student note
  const handleNoteChange = (studentId: string, note: string) => {
    setStudentEntries(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        note
      }
    }));
  };

  // Handle adding absent student in Exception Mode
  const handleAddAbsentStudent = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedAbsentStudentId) {
      showToast('Pilih nama siswa yang tidak masuk terlebih dahulu.', 'error');
      return;
    }
    const st = rombelStudents.find(s => s.id === selectedAbsentStudentId);
    setStudentEntries(prev => ({
      ...prev,
      [selectedAbsentStudentId]: {
        status: absentStatus,
        note: absentNote.trim()
      }
    }));
    const statusLabel = absentStatus === 'S' ? 'Sakit (S)' : absentStatus === 'I' ? 'Izin (I)' : 'Alpa (A)';
    showToast(`${st?.name} dicatat tidak masuk (${statusLabel})`, 'info');
    setSelectedAbsentStudentId('');
    setAbsentNote('');
  };

  // Handle removing absent student (returns to Hadir)
  const handleRemoveAbsentStudent = (studentId: string) => {
    const st = rombelStudents.find(s => s.id === studentId);
    setStudentEntries(prev => ({
      ...prev,
      [studentId]: {
        status: 'H',
        note: ''
      }
    }));
    showToast(`${st?.name} dikembalikan ke status Hadir (H/.)`, 'info');
  };

  // Counts summary
  const summaryCounts = useMemo(() => {
    const counts = { H: 0, S: 0, I: 0, A: 0, T: 0, D: 0 };
    Object.values(studentEntries).forEach(e => {
      counts[e.status] = (counts[e.status] || 0) + 1;
    });
    return counts;
  }, [studentEntries]);

  const [isSaving, setIsSaving] = useState(false);
  const [showLockConfirm, setShowLockConfirm] = useState(false);
  const [correctionReason, setCorrectionReason] = useState('');
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);

  // Save Attendance with double click protection and validation
  const executeSave = async (reason?: string) => {
    if (!selectedRombelId || !selectedSubjectId) {
      showToast('Pilih rombel dan mata pelajaran terlebih dahulu.', 'error');
      return;
    }

    if (rombelStudents.length === 0) {
      showToast('Tidak ada siswa aktif di rombel terpilih.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      // Yang tidak dimasukkan otomatis menjadi Hadir (H/.)
      const recordList = rombelStudents.map(st => {
        const entry = studentEntries[st.id] || { status: 'H', note: '' };
        return {
          studentId: st.id,
          status: entry.status,
          note: entry.note
        };
      });

      const effectiveAssignment = teachingAssignments.find(
        ta => ta.rombelId === selectedRombelId && ta.subjectId === selectedSubjectId
      );
      const sessionTeacherId = currentUser.teacherId || effectiveAssignment?.teacherId || 'tch-1';

      const actorDesc = recordedByRole === 'sekretaris' 
        ? `Sekretaris Kelas (${secretaryName})` 
        : `Guru (${currentUser.name})`;

      if (existingSession) {
        // Update existing session with reason
        updateAttendanceRecords(
          existingSession.id, 
          recordList, 
          reason || `Pembaruan presensi oleh ${actorDesc}`
        );
      } else {
        // Create new session
        createAttendanceSession(
          {
            academicYearId: activeAcademicYear.id,
            rombelId: selectedRombelId,
            subjectId: selectedSubjectId,
            teacherId: sessionTeacherId,
            date: sessionDate,
            period,
            meetingNumber,
            topic: topic || `Pertemuan ke-${meetingNumber}`,
            status: 'completed',
            recordedByRole,
            recorderName: recordedByRole === 'sekretaris' ? secretaryName : currentUser.name,
            inputMode: entryMode === 'exception' ? 'exception_only' : 'full'
          },
          recordList
        );
      }
    } finally {
      setTimeout(() => setIsSaving(false), 400);
    }
  };

  const handleSaveAttendance = () => {
    if (existingSession && existingSession.status === 'completed') {
      setShowCorrectionModal(true);
    } else {
      executeSave();
    }
  };

  const isLocked = existingSession?.status === 'locked';

  // Selected details
  const activeRombel = rombels.find(r => r.id === selectedRombelId);
  const activeSubject = subjects.find(s => s.id === selectedSubjectId);
  const activeTeacher = teachers.find(t => {
    const ta = teachingAssignments.find(a => a.rombelId === selectedRombelId && a.subjectId === selectedSubjectId);
    return t.id === (currentUser.teacherId || ta?.teacherId);
  });

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${
                isSecretaryUser 
                  ? 'bg-amber-50 text-amber-800 border-amber-200' 
                  : 'bg-indigo-50 text-indigo-700 border-indigo-200'
              }`}>
                {isSecretaryUser ? 'Presensi oleh Sekretaris Kelas' : 'Pencatatan Presensi Guru / Sekretaris'}
              </span>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs text-slate-500 font-medium">
                Tahun Ajaran {activeAcademicYear.name} ({activeAcademicYear.semester})
              </span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-1">
              Pencatatan Presensi Per Pertemuan Mata Pelajaran
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Presensi dicatat per jam mata pelajaran. Siswa yang tidak di-masukkan otomatis berstatus <strong>Hadir (H/.)</strong>.
            </p>
          </div>

          {onBackToDashboard && (
            <button
              onClick={onBackToDashboard}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1.5 self-start sm:self-auto transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Kembali ke Dashboard
            </button>
          )}
        </div>
      </div>

      {/* Lock Warning Notice if locked */}
      {isLocked && (
        <div className="bg-slate-100 border border-slate-300 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Lock className="w-5 h-5 text-slate-700" />
            <div className="text-xs">
              <span className="font-bold text-slate-900 block">
                Sesi Pertemuan Ini Telah Terkunci (Locked)
              </span>
              <span className="text-slate-600">
                Terkunci sejak {existingSession?.lockedAt || 'toleransi batas waktu'}. Perubahan tidak dapat disimpan tanpa otorisasi admin.
              </span>
            </div>
          </div>
          {currentUser.role === 'admin' && (
            <button
              onClick={() => unlockSession(existingSession.id)}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg flex items-center gap-1"
            >
              <Unlock className="w-3.5 h-3.5" />
              Buka Kunci (Admin)
            </button>
          )}
        </div>
      )}

      {/* Sesi Config & Metadata Form */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-3">
          <h3 className="text-sm font-bold text-slate-900">
            1. Konfigurasi Sesi & Pelaksana Presensi
          </h3>

          {/* Pelaksana Presensi Selector */}
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-slate-600">Diabsen oleh:</span>
            <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
              <button
                type="button"
                disabled={isLocked}
                onClick={() => setRecordedByRole('guru')}
                className={`px-2.5 py-1 rounded-md font-semibold text-xs transition-colors flex items-center gap-1.5 ${
                  recordedByRole === 'guru'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                Guru Mata Pelajaran
              </button>
              <button
                type="button"
                disabled={isLocked}
                onClick={() => setRecordedByRole('sekretaris')}
                className={`px-2.5 py-1 rounded-md font-semibold text-xs transition-colors flex items-center gap-1.5 ${
                  recordedByRole === 'sekretaris'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                Sekretaris Kelas
              </button>
            </div>
          </div>
        </div>

        {/* Secretary Name Info if recorded by secretary */}
        {recordedByRole === 'sekretaris' && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-amber-900">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-amber-600 shrink-0" />
              <div>
                <span className="font-bold">Presensi Dilakukan Oleh Sekretaris Kelas:</span>{' '}
                Sekretaris mencatat siswa yang tidak masuk (I, A, S), sedangkan siswa lainnya otomatis Hadir (H/.).
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold shrink-0">Nama Sekretaris:</span>
              <input
                type="text"
                disabled={isLocked}
                value={secretaryName}
                onChange={e => setSecretaryName(e.target.value)}
                placeholder="Nama sekretaris kelas..."
                className="bg-white border border-amber-300 rounded px-2.5 py-1 text-slate-800 text-xs w-52 focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {/* Class / Rombel */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              Kelas / Rombel <span className="text-rose-500">*</span>
            </label>
            <select
              disabled={isLocked || isSecretaryUser}
              value={selectedRombelId}
              onChange={e => setSelectedRombelId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:bg-white focus:ring-1 focus:ring-indigo-600"
            >
              {availableRombels.map(r => (
                <option key={r.id} value={r.id}>{r.name} ({r.code})</option>
              ))}
            </select>
          </div>

          {/* Subject */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              Mata Pelajaran <span className="text-rose-500">*</span>
            </label>
            <select
              disabled={isLocked}
              value={selectedSubjectId}
              onChange={e => setSelectedSubjectId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:bg-white focus:ring-1 focus:ring-indigo-600"
            >
              {availableSubjectsForRombel.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              Tanggal Pertemuan <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              disabled={isLocked}
              value={sessionDate}
              onChange={e => setSessionDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-mono-tabular focus:bg-white focus:ring-1 focus:ring-indigo-600"
            />
          </div>

          {/* Meeting Number & Period */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Pertemuan Ke- <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min={1}
                max={50}
                disabled={isLocked}
                value={meetingNumber}
                onChange={e => setMeetingNumber(parseInt(e.target.value, 10) || 1)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-mono-tabular focus:bg-white focus:ring-1 focus:ring-indigo-600"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Jam Ke-
              </label>
              <input
                type="text"
                disabled={isLocked}
                value={period}
                onChange={e => setPeriod(e.target.value)}
                placeholder="Jam ke-1 s/d 3"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:bg-white focus:ring-1 focus:ring-indigo-600"
              />
            </div>
          </div>
        </div>

        {/* Topic / Materi */}
        <div className="text-xs">
          <label className="font-semibold text-slate-700 block mb-1">
            Topik Pembelajaran / Materi Bahasan
          </label>
          <input
            type="text"
            disabled={isLocked}
            value={topic}
            onChange={e => setTopic(e.target.value)}
            placeholder="Contoh: Penerapan Prinsip Tipografi dan Skema Warna pada Banner Publikasi"
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:bg-white focus:ring-1 focus:ring-indigo-600"
          />
        </div>
      </div>

      {/* Mode Selection Tabs */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          type="button"
          onClick={() => setEntryMode('exception')}
          className={`py-2.5 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            entryMode === 'exception'
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Zap className="w-4 h-4 text-indigo-600" />
          <span>Mode Cepat: Siswa Tidak Masuk Saja (I, A, S)</span>
          <span className="text-[10px] font-semibold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full">
            Rekomendasi
          </span>
        </button>
        <button
          type="button"
          onClick={() => setEntryMode('full')}
          className={`py-2.5 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            entryMode === 'full'
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ListFilter className="w-4 h-4 text-slate-500" />
          <span>Mode Tabel Lengkap Semua Siswa</span>
        </button>
      </div>

      {/* MODE 1: EXCEPTION-BASED ATTENDANCE ENTRY (Hanya siswa tidak masuk saja I, A, S) */}
      {entryMode === 'exception' && (
        <div className="space-y-4">
          {/* Concept Banner */}
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 text-xs text-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-emerald-900 text-sm">
                  Aturan: Siswa yang tidak di-masukkan otomatis berstatus Hadir (H / .)
                </p>
                <p className="text-emerald-800 text-xs mt-0.5">
                  Cukup pilih siswa yang berhalangan masuk dengan status <strong>Izin (I)</strong>, <strong>Alpa (A)</strong>, atau <strong>Sakit (S)</strong>. Seluruh siswa lain di kelas {activeRombel?.name} akan otomatis tercatat hadir.
                </p>
              </div>
            </div>

            {absentStudents.length > 0 && (
              <button
                type="button"
                disabled={isLocked}
                onClick={handleMarkAllPresent}
                className="px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-white hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors whitespace-nowrap self-start sm:self-auto"
              >
                Reset Semua Jadi Hadir
              </button>
            )}
          </div>

          {/* Real-time Summary Stat Ribbon */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs">
              <span className="text-[11px] font-medium text-slate-500 block">Total Siswa Kelas</span>
              <span className="text-xl font-bold text-slate-900 font-mono-tabular">
                {rombelStudents.length}
              </span>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 shadow-xs">
              <span className="text-[11px] font-medium text-emerald-800 block">Hadir Otomatis (H/.)</span>
              <span className="text-xl font-bold text-emerald-800 font-mono-tabular">
                {summaryCounts.H}
              </span>
            </div>
            <div className="bg-sky-50 border border-sky-200 rounded-xl p-3 shadow-xs">
              <span className="text-[11px] font-medium text-sky-800 block">Sakit (S)</span>
              <span className="text-xl font-bold text-sky-800 font-mono-tabular">
                {summaryCounts.S}
              </span>
            </div>
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 shadow-xs">
              <span className="text-[11px] font-medium text-indigo-800 block">Izin (I)</span>
              <span className="text-xl font-bold text-indigo-800 font-mono-tabular">
                {summaryCounts.I}
              </span>
            </div>
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 shadow-xs">
              <span className="text-[11px] font-medium text-rose-800 block">Alpa (A)</span>
              <span className="text-xl font-bold text-rose-800 font-mono-tabular">
                {summaryCounts.A}
              </span>
            </div>
          </div>

          {/* Quick Add Absent Box */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <UserX className="w-4 h-4 text-rose-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Input Siswa yang Tidak Masuk
                </h3>
              </div>
              <span className="text-xs text-slate-500">
                Tersisa {presentStudents.length} siswa berstatus Hadir
              </span>
            </div>

            <form onSubmit={handleAddAbsentStudent} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
              {/* Select Student */}
              <div className="md:col-span-5 text-xs">
                <label className="font-semibold text-slate-700 block mb-1">
                  Pilih Siswa yang Tidak Masuk <span className="text-rose-500">*</span>
                </label>
                <select
                  disabled={isLocked || presentStudents.length === 0}
                  value={selectedAbsentStudentId}
                  onChange={e => setSelectedAbsentStudentId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-xs focus:bg-white focus:ring-1 focus:ring-indigo-600"
                >
                  <option value="">-- Pilih Nama Siswa ({presentStudents.length} siswa hadir) --</option>
                  {presentStudents.map(st => (
                    <option key={st.id} value={st.id}>
                      {st.nis} - {st.name} ({st.gender})
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Radio / Button Group */}
              <div className="md:col-span-3 text-xs">
                <label className="font-semibold text-slate-700 block mb-1">
                  Status Tidak Masuk <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-1">
                  <button
                    type="button"
                    disabled={isLocked}
                    onClick={() => setAbsentStatus('S')}
                    className={`py-2 px-1 text-center rounded-lg font-bold text-xs border transition-colors ${
                      absentStatus === 'S'
                        ? 'bg-sky-600 text-white border-sky-700 shadow-xs'
                        : 'bg-sky-50 text-sky-800 border-sky-200 hover:bg-sky-100'
                    }`}
                  >
                    S (Sakit)
                  </button>
                  <button
                    type="button"
                    disabled={isLocked}
                    onClick={() => setAbsentStatus('I')}
                    className={`py-2 px-1 text-center rounded-lg font-bold text-xs border transition-colors ${
                      absentStatus === 'I'
                        ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs'
                        : 'bg-indigo-50 text-indigo-800 border-indigo-200 hover:bg-indigo-100'
                    }`}
                  >
                    I (Izin)
                  </button>
                  <button
                    type="button"
                    disabled={isLocked}
                    onClick={() => setAbsentStatus('A')}
                    className={`py-2 px-1 text-center rounded-lg font-bold text-xs border transition-colors ${
                      absentStatus === 'A'
                        ? 'bg-rose-600 text-white border-rose-700 shadow-xs'
                        : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
                    }`}
                  >
                    A (Alpa)
                  </button>
                </div>
              </div>

              {/* Note / Keterangan */}
              <div className="md:col-span-3 text-xs">
                <label className="font-semibold text-slate-700 block mb-1">
                  Keterangan / Alasan
                </label>
                <input
                  type="text"
                  disabled={isLocked}
                  value={absentNote}
                  onChange={e => setAbsentNote(e.target.value)}
                  placeholder="Cth: Surat dokter, Acara keluarga..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-xs focus:bg-white focus:ring-1 focus:ring-indigo-600"
                />
              </div>

              {/* Submit Button */}
              <div className="md:col-span-1">
                <button
                  type="submit"
                  disabled={isLocked || !selectedAbsentStudentId}
                  className="w-full py-2 px-3 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed rounded-lg shadow-xs flex items-center justify-center gap-1 transition-colors"
                  title="Tambahkan siswa ke daftar tidak masuk"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah</span>
                </button>
              </div>
            </form>
          </div>

          {/* List of Absent Students */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-slate-900">
                Daftar Siswa Tidak Masuk ({absentStudents.length} Siswa)
              </h3>
              <span className="text-xs text-slate-500">
                {absentStudents.length === 0 ? 'Nihil Ketidakhadiran' : `${absentStudents.length} dari ${rombelStudents.length} siswa`}
              </span>
            </div>

            {absentStudents.length === 0 ? (
              <div className="py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 p-6 space-y-2">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-800">
                  Semua Siswa Hadir Lengkap di Kelas (Nihil Absen)
                </h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Tidak ada siswa yang tercatat sakit, izin, atau alpa. Seluruh {rombelStudents.length} siswa otomatis tersimpan sebagai <strong>Hadir (H/.)</strong> saat Anda menekan tombol simpan presensi di bawah.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[11px] border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3 w-10 text-center">No</th>
                      <th className="py-2.5 px-3 w-28">NIS</th>
                      <th className="py-2.5 px-3">Nama Siswa</th>
                      <th className="py-2.5 px-3 text-center w-12">JK</th>
                      <th className="py-2.5 px-3 text-center w-36">Status Ketidakhadiran</th>
                      <th className="py-2.5 px-3">Keterangan / Alasan</th>
                      <th className="py-2.5 px-3 text-right w-24">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {absentStudents.map((st, idx) => {
                      const entry = studentEntries[st.id] || { status: 'H', note: '' };
                      return (
                        <tr key={st.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-2.5 px-3 text-center font-mono-tabular text-slate-400">{idx + 1}</td>
                          <td className="py-2.5 px-3 font-mono-tabular font-medium text-slate-700">{st.nis}</td>
                          <td className="py-2.5 px-3 font-semibold text-slate-900">{st.name}</td>
                          <td className="py-2.5 px-3 text-center font-mono-tabular text-slate-500">{st.gender}</td>
                          <td className="py-2.5 px-3 text-center">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                              entry.status === 'S'
                                ? 'bg-sky-50 text-sky-800 border-sky-300'
                                : entry.status === 'I'
                                ? 'bg-indigo-50 text-indigo-800 border-indigo-300'
                                : 'bg-rose-50 text-rose-800 border-rose-300'
                            }`}>
                              {entry.status === 'S' ? 'S - Sakit' : entry.status === 'I' ? 'I - Izin' : 'A - Alpa'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-600">
                            {entry.note || <span className="text-slate-400 italic">Tanpa keterangan tambahan</span>}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <button
                              type="button"
                              disabled={isLocked}
                              onClick={() => handleRemoveAbsentStudent(st.id)}
                              className="text-emerald-700 hover:text-emerald-900 font-semibold inline-flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200 text-xs transition-colors"
                              title="Kembalikan siswa ini ke status Hadir"
                            >
                              <Check className="w-3.5 h-3.5" />
                              Jadikan Hadir
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Toggle Full Preview Grid */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowFullPreviewInExceptionMode(!showFullPreviewInExceptionMode)}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 py-1"
              >
                {showFullPreviewInExceptionMode ? <EyeOff className="w-4 h-4 text-slate-500" /> : <Eye className="w-4 h-4 text-slate-500" />}
                <span>
                  {showFullPreviewInExceptionMode 
                    ? 'Sembunyikan Pratinjau Daftar Lengkap Siswa' 
                    : `Lihat Pratinjau Status Seluruh Siswa Kelas (${rombelStudents.length} Siswa)`
                  }
                </span>
              </button>

              {showFullPreviewInExceptionMode && (
                <div className="mt-3 overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[11px] border-b border-slate-200">
                      <tr>
                        <th className="py-2 px-3 w-10 text-center">No</th>
                        <th className="py-2 px-3 w-28">NIS</th>
                        <th className="py-2 px-3">Nama Siswa</th>
                        <th className="py-2 px-3 text-center w-12">JK</th>
                        <th className="py-2 px-3 text-center w-28">Status Akhir</th>
                        <th className="py-2 px-3">Catatan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {rombelStudents.map((st, idx) => {
                        const entry = studentEntries[st.id] || { status: 'H', note: '' };
                        const isPresent = entry.status === 'H';
                        return (
                          <tr key={st.id} className={isPresent ? 'hover:bg-slate-50' : 'bg-rose-50/20'}>
                            <td className="py-2 px-3 text-center font-mono-tabular text-slate-400">{idx + 1}</td>
                            <td className="py-2 px-3 font-mono-tabular text-slate-600">{st.nis}</td>
                            <td className="py-2 px-3 font-semibold text-slate-900">{st.name}</td>
                            <td className="py-2 px-3 text-center font-mono-tabular text-slate-500">{st.gender}</td>
                            <td className="py-2 px-3 text-center">
                              {isPresent ? (
                                <span className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[11px]">
                                  <Check className="w-3 h-3 text-emerald-600" />
                                  Hadir (H/.)
                                </span>
                              ) : (
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold border ${
                                  entry.status === 'S'
                                    ? 'bg-sky-50 text-sky-800 border-sky-300'
                                    : entry.status === 'I'
                                    ? 'bg-indigo-50 text-indigo-800 border-indigo-300'
                                    : 'bg-rose-50 text-rose-800 border-rose-300'
                                }`}>
                                  {entry.status}
                                </span>
                              )}
                            </td>
                            <td className="py-2 px-3 text-slate-500 text-[11px]">
                              {entry.note || (isPresent ? 'Hadir di kelas' : '-')}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODE 2: FULL TABLE ROSTER VIEW (Semua Siswa) */}
      {entryMode === 'full' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                2. Daftar Kehadiran Seluruh Siswa ({rombelStudents.length} Siswa Terdaftar)
              </h3>
              <p className="text-xs text-slate-500">
                Tentukan status kehadiran setiap siswa. Siswa yang tidak diubah tetap berstatus Hadir (H/.).
              </p>
            </div>

            {/* Quick Action Button Strip */}
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                type="button"
                disabled={isLocked}
                onClick={handleMarkAllPresent}
                className="px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                Tandai Semua Hadir (H)
              </button>
            </div>
          </div>

          {/* Real-time Summary Badge Ribbon */}
          <div className="flex flex-wrap items-center gap-3 p-3 bg-slate-50 rounded-lg text-xs font-mono-tabular">
            <span className="font-semibold text-slate-600">Ringkasan Sesi:</span>
            <span className="text-emerald-700 font-bold">Hadir: {summaryCounts.H}</span>
            <span>·</span>
            <span className="text-sky-700 font-bold">Sakit: {summaryCounts.S}</span>
            <span>·</span>
            <span className="text-indigo-700 font-bold">Izin: {summaryCounts.I}</span>
            <span>·</span>
            <span className="text-rose-700 font-bold">Alpa: {summaryCounts.A}</span>
            <span>·</span>
            <span className="text-amber-700 font-bold">Terlambat: {summaryCounts.T}</span>
            <span>·</span>
            <span className="text-purple-700 font-bold">Dispensasi: {summaryCounts.D}</span>
          </div>

          {/* Student List Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">No</th>
                  <th className="py-2.5 px-3">NIS</th>
                  <th className="py-2.5 px-3">Nama Siswa</th>
                  <th className="py-2.5 px-3 text-center">JK</th>
                  <th className="py-2.5 px-3 text-center">Status Kehadiran</th>
                  <th className="py-2.5 px-3">Catatan / Alasan Ketidakhadiran</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rombelStudents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      Tidak ada siswa aktif di rombel terpilih.
                    </td>
                  </tr>
                ) : (
                  rombelStudents.map((st, idx) => {
                    const entry = studentEntries[st.id] || { status: 'H', note: '' };
                    return (
                      <tr 
                        key={st.id} 
                        className={`hover:bg-slate-50 transition-colors ${
                          entry.status === 'A' ? 'bg-rose-50/20' : 
                          entry.status === 'S' ? 'bg-sky-50/20' : 
                          entry.status === 'I' ? 'bg-indigo-50/20' : ''
                        }`}
                      >
                        <td className="py-2.5 px-3 font-mono-tabular text-slate-400">{idx + 1}</td>
                        <td className="py-2.5 px-3 font-mono-tabular text-slate-600">{st.nis}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">{st.name}</td>
                        <td className="py-2.5 px-3 text-center font-mono-tabular text-slate-500">{st.gender}</td>
                        
                        {/* Attendance Buttons: H, S, I, A, T, D */}
                        <td className="py-2.5 px-3 text-center">
                          <div className="inline-flex items-center p-0.5 bg-slate-100 rounded-lg border border-slate-200">
                            {(['H', 'S', 'I', 'A', 'T', 'D'] as AttendanceStatus[]).map(stOption => {
                              const isSelected = entry.status === stOption;
                              let activeClass = 'bg-white text-slate-900 shadow-xs font-bold';
                              if (isSelected) {
                                if (stOption === 'H') activeClass = 'bg-emerald-600 text-white font-bold shadow-xs';
                                else if (stOption === 'S') activeClass = 'bg-sky-600 text-white font-bold shadow-xs';
                                else if (stOption === 'I') activeClass = 'bg-indigo-600 text-white font-bold shadow-xs';
                                else if (stOption === 'A') activeClass = 'bg-rose-600 text-white font-bold shadow-xs';
                                else if (stOption === 'T') activeClass = 'bg-amber-600 text-white font-bold shadow-xs';
                                else if (stOption === 'D') activeClass = 'bg-purple-600 text-white font-bold shadow-xs';
                              }

                              return (
                                <button
                                  key={stOption}
                                  type="button"
                                  disabled={isLocked}
                                  onClick={() => handleStatusChange(st.id, stOption)}
                                  className={`px-2 py-1 text-xs rounded transition-all ${
                                    isSelected ? activeClass : 'text-slate-600 hover:text-slate-900'
                                  }`}
                                  title={`Tandai status ${stOption}`}
                                >
                                  {stOption}
                                </button>
                              );
                            })}
                          </div>
                        </td>

                        {/* Note Input */}
                        <td className="py-2.5 px-3">
                          <input
                            type="text"
                            disabled={isLocked}
                            value={entry.note}
                            onChange={e => handleNoteChange(st.id, e.target.value)}
                            placeholder={entry.status === 'H' ? 'Hadir' : 'Keterangan/alasan...'}
                            className="w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-600 focus:bg-white px-2 py-1 text-slate-800 text-xs rounded transition-all"
                          />
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

      {/* Save Action Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="text-xs text-slate-500">
          <p className="font-semibold text-slate-800">
            Status Sesi: {existingSession ? `Tercatat (${existingSession.status})` : 'Belum Tersimpan'}
          </p>
          <p className="mt-0.5">
            Pelaksana: <strong>{recordedByRole === 'sekretaris' ? `Sekretaris Kelas (${secretaryName})` : `Guru (${currentUser.name})`}</strong> · Mode: <strong>{entryMode === 'exception' ? 'Hanya Siswa Tidak Masuk' : 'Daftar Lengkap'}</strong>
          </p>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          {existingSession && !isLocked && (
            <button
              type="button"
              onClick={() => setShowLockConfirm(true)}
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <Lock className="w-3.5 h-3.5 text-slate-600" />
              Kunci Sesi Ini
            </button>
          )}

          {!isLocked && (
            <button
              type="button"
              disabled={isSaving}
              onClick={handleSaveAttendance}
              className="px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Menyimpan Presensi...' : existingSession ? 'Simpan Pembaruan Presensi' : 'Simpan Presensi Pertemuan'}
            </button>
          )}
        </div>
      </div>

      {/* Confirmation Modal for Session Lock */}
      {showLockConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-800 flex items-center justify-center mx-auto mb-4">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 text-center">
              Kunci Sesi Presensi Pertemuan Ini?
            </h3>
            <p className="text-xs text-slate-600 text-center mt-2 leading-relaxed">
              Setelah dikunci, sesi presensi tidak dapat lagi diubah oleh guru maupun sekretaris. Perbaikan data hanya dapat dilakukan melalui persetujuan Administrator atau prosedur audit wali kelas.
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowLockConfirm(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  if (existingSession) lockSession(existingSession.id);
                  setShowLockConfirm(false);
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs"
              >
                Ya, Kunci Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Audited Reason Modal for Updating Completed Attendance */}
      {showCorrectionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-900">
              Alasan Pembaruan / Koreksi Presensi
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Sesi presensi ini telah disimpan sebelumnya. Masukkan alasan perubahan data kehadiran untuk audit resmi sekolah:
            </p>

            <textarea
              rows={3}
              value={correctionReason}
              onChange={e => setCorrectionReason(e.target.value)}
              placeholder="Contoh: Siswa atas nama Fajar membawa surat izin resmi dari orang tua..."
              className="mt-3 w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:bg-white focus:ring-1 focus:ring-indigo-600"
            />

            <div className="mt-4 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowCorrectionModal(false)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={!correctionReason.trim()}
                onClick={() => {
                  setShowCorrectionModal(false);
                  executeSave(correctionReason);
                }}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg"
              >
                Simpan dengan Audit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

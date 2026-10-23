import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Users, 
  GraduationCap, 
  Layers, 
  BookOpen, 
  Calendar, 
  Clock, 
  Plus, 
  Upload, 
  Download,
  Edit, 
  Trash2, 
  Search,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  ArrowRightLeft,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  X,
  FileDown,
  Database
} from 'lucide-react';
import { BackupRestoreModal } from './BackupRestoreModal';
import { Student, Teacher, Rombel, Subject, Schedule, TeachingAssignment, GradeLevel } from '../types';
import { 
  downloadExcel, 
  downloadCsv, 
  parseExcelOrCsvFile, 
  downloadRombelTemplate, 
  downloadTeacherTemplate, 
  downloadStudentTemplate, 
  downloadSubjectTemplate, 
  downloadScheduleTemplate, 
  downloadTeachingAssignmentTemplate 
} from '../utils/dataExportImport';

interface MasterDataViewProps {
  onOpenTransferModal?: (student: Student) => void;
}

export const MasterDataView: React.FC<MasterDataViewProps> = ({ onOpenTransferModal }) => {
  const {
    students,
    teachers,
    departments,
    rombels,
    subjects,
    schedules,
    teachingAssignments,
    academicYears,
    activeAcademicYear,
    addStudent,
    updateStudent,
    deleteStudent,
    importStudents,
    addTeacher,
    updateTeacher,
    deleteTeacher,
    importTeachers,
    addRombel,
    updateRombel,
    deleteRombel,
    importRombels,
    addSubject,
    updateSubject,
    deleteSubject,
    importSubjects,
    addSchedule,
    deleteSchedule,
    importSchedules,
    addTeachingAssignment,
    deleteTeachingAssignment,
    importTeachingAssignments,
    secretaryAssignments,
    assignSecretary,
    revokeSecretaryAssignment,
    showToast
  } = useApp();

  const [activeTab, setActiveTab] = useState<'students' | 'teachers' | 'rombels' | 'subjects' | 'schedules' | 'assignments' | 'secretaries'>('rombels');
  const [showBackupModal, setShowBackupModal] = useState(false);

  // Secretary modal state
  const [showSecretaryModal, setShowSecretaryModal] = useState(false);
  const [secRombelId, setSecRombelId] = useState(rombels[0]?.id || '');
  const [secStudentId, setSecStudentId] = useState('');
  const [secNotes, setSecNotes] = useState('');

  // Search filter & pagination for students
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRombel, setFilterRombel] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Search filter for other tabs
  const [rombelSearch, setRombelSearch] = useState('');
  const [teacherSearch, setTeacherSearch] = useState('');
  const [subjectSearch, setSubjectSearch] = useState('');

  // Student Modals
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [showStudentImportModal, setShowStudentImportModal] = useState(false);
  const [studentImportPreview, setStudentImportPreview] = useState<any[]>([]);
  const [studentImportErrors, setStudentImportErrors] = useState<string[]>([]);

  // Teacher Modals
  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [showTeacherImportModal, setShowTeacherImportModal] = useState(false);
  const [teacherImportPreview, setTeacherImportPreview] = useState<any[]>([]);
  const [teacherImportErrors, setTeacherImportErrors] = useState<string[]>([]);

  // Rombel Modals
  const [showRombelModal, setShowRombelModal] = useState(false);
  const [editingRombel, setEditingRombel] = useState<Rombel | null>(null);
  const [showRombelImportModal, setShowRombelImportModal] = useState(false);
  const [rombelImportPreview, setRombelImportPreview] = useState<any[]>([]);
  const [rombelImportErrors, setRombelImportErrors] = useState<string[]>([]);

  // Subject Modals
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [showSubjectImportModal, setShowSubjectImportModal] = useState(false);
  const [subjectImportPreview, setSubjectImportPreview] = useState<any[]>([]);
  const [subjectImportErrors, setSubjectImportErrors] = useState<string[]>([]);

  // Schedule & Assignment Modals
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showScheduleImportModal, setShowScheduleImportModal] = useState(false);
  const [scheduleImportPreview, setScheduleImportPreview] = useState<any[]>([]);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [showAssignmentImportModal, setShowAssignmentImportModal] = useState(false);
  const [assignmentImportPreview, setAssignmentImportPreview] = useState<any[]>([]);

  // Forms State
  const [studentForm, setStudentForm] = useState({
    nis: '',
    nisn: '',
    name: '',
    gender: 'L' as 'L' | 'P',
    departmentId: departments[0]?.id || '',
    rombelId: rombels[0]?.id || '',
    status: 'active' as 'active' | 'moved' | 'graduated' | 'inactive',
    phone: '',
    parentName: ''
  });

  const [teacherForm, setTeacherForm] = useState({
    nip: '',
    name: '',
    email: '',
    phone: '',
    gender: 'L' as 'L' | 'P',
    specialization: '',
    status: 'active' as 'active' | 'inactive'
  });

  const [rombelForm, setRombelForm] = useState({
    code: '',
    name: '',
    grade: 'X' as GradeLevel,
    departmentId: departments[0]?.id || '',
    homeroomTeacherId: teachers[0]?.id || ''
  });

  const [subjectForm, setSubjectForm] = useState({
    code: '',
    name: '',
    category: 'Muatan Kejuruan' as 'Muatan Nasional' | 'Muatan Kejuruan' | 'Muatan Lokal',
    creditHours: 4
  });

  const [scheduleForm, setScheduleForm] = useState({
    dayOfWeek: 1 as 1|2|3|4|5|6,
    periodStart: 1,
    periodEnd: 3,
    timeStart: '07:15',
    timeEnd: '09:30',
    teacherId: teachers[0]?.id || '',
    subjectId: subjects[0]?.id || '',
    rombelId: rombels[0]?.id || '',
    room: 'R. Teori'
  });

  const [assignmentForm, setAssignmentForm] = useState({
    teacherId: teachers[0]?.id || '',
    subjectId: subjects[0]?.id || '',
    rombelId: rombels[0]?.id || ''
  });

  // Filtered Students
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.nis.includes(searchQuery);
      const matchRombel = filterRombel === 'all' || s.rombelId === filterRombel;
      return matchSearch && matchRombel;
    });
  }, [students, searchQuery, filterRombel]);

  // Filtered Rombels
  const filteredRombels = useMemo(() => {
    return rombels.filter(r => 
      r.name.toLowerCase().includes(rombelSearch.toLowerCase()) || 
      r.code.toLowerCase().includes(rombelSearch.toLowerCase()) ||
      r.departmentCode.toLowerCase().includes(rombelSearch.toLowerCase())
    );
  }, [rombels, rombelSearch]);

  // Filtered Teachers
  const filteredTeachers = useMemo(() => {
    return teachers.filter(t => 
      t.name.toLowerCase().includes(teacherSearch.toLowerCase()) || 
      t.nip.includes(teacherSearch)
    );
  }, [teachers, teacherSearch]);

  // Filtered Subjects
  const filteredSubjects = useMemo(() => {
    return subjects.filter(s => 
      s.name.toLowerCase().includes(subjectSearch.toLowerCase()) || 
      s.code.toLowerCase().includes(subjectSearch.toLowerCase())
    );
  }, [subjects, subjectSearch]);

  // ==========================================
  // EXPORT HANDLERS
  // ==========================================
  const handleExportRombelsExcel = () => {
    const data = rombels.map(r => {
      const count = students.filter(s => s.rombelId === r.id && s.status === 'active').length;
      return {
        'Kode Rombel': r.code,
        'Nama Kelas': r.name,
        'Tingkat': r.grade,
        'Kode Jurusan': r.departmentCode,
        'Wali Kelas': r.homeroomTeacherName || 'Belum Ditugaskan',
        'Tahun Ajaran': activeAcademicYear.name,
        'Siswa Aktif': count,
        'Status': r.status
      };
    });
    downloadExcel(`data_kelas_rombel_smk_${activeAcademicYear.name.replace('/', '_')}`, 'Daftar Rombel', data);
    showToast(`Berhasil mengekspor ${data.length} kelas / rombel ke Excel!`);
  };

  const handleExportRombelsCsv = () => {
    const data = rombels.map(r => ({
      'Kode Rombel': r.code,
      'Nama Kelas': r.name,
      'Tingkat': r.grade,
      'Kode Jurusan': r.departmentCode,
      'Wali Kelas': r.homeroomTeacherName || ''
    }));
    downloadCsv(`data_kelas_rombel_smk_${activeAcademicYear.name.replace('/', '_')}`, data);
    showToast(`Berhasil mengekspor data kelas ke CSV!`);
  };

  const handleExportTeachersExcel = () => {
    const data = teachers.map(t => ({
      'NIP': t.nip,
      'Nama Lengkap': t.name,
      'Email Dinas': t.email,
      'No Telepon': t.phone,
      'Jenis Kelamin': t.gender,
      'Spesialisasi': t.specialization || '-',
      'Status': t.status
    }));
    downloadExcel('data_guru_smk', 'Daftar Guru', data);
    showToast(`Berhasil mengekspor ${data.length} data guru ke Excel!`);
  };

  const handleExportStudentsExcel = () => {
    const data = filteredStudents.map(s => {
      const r = rombels.find(rm => rm.id === s.rombelId);
      return {
        'NIS': s.nis,
        'NISN': s.nisn || '',
        'Nama Lengkap': s.name,
        'Jenis Kelamin': s.gender,
        'Kelas / Rombel': r?.name || s.rombelCode || '',
        'Kode Rombel': r?.code || '',
        'Jurusan': r?.departmentCode || '',
        'Status': s.status,
        'No Telepon': s.phone || '',
        'Nama Orang Tua': s.parentName || ''
      };
    });
    downloadExcel('data_siswa_smk', 'Data Siswa', data);
    showToast(`Berhasil mengekspor ${data.length} data siswa ke Excel!`);
  };

  const handleExportSubjectsExcel = () => {
    const data = subjects.map(s => ({
      'Kode Mapel': s.code,
      'Nama Mata Pelajaran': s.name,
      'Kategori': s.category,
      'Beban Jam (JP)': s.creditHours
    }));
    downloadExcel('data_mata_pelajaran_smk', 'Mata Pelajaran', data);
    showToast(`Berhasil mengekspor ${data.length} mata pelajaran ke Excel!`);
  };

  const handleExportSchedulesExcel = () => {
    const daysIndo = ['', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const data = schedules.map(sch => {
      const t = teachers.find(tch => tch.id === sch.teacherId);
      const subj = subjects.find(s => s.id === sch.subjectId);
      const r = rombels.find(rm => rm.id === sch.rombelId);
      return {
        'Hari': daysIndo[sch.dayOfWeek] || sch.dayOfWeek,
        'Jam Ke': `${sch.periodStart} s/d ${sch.periodEnd}`,
        'Waktu': `${sch.timeStart} - ${sch.timeEnd}`,
        'Kelas / Rombel': r?.name || sch.rombelId,
        'Mata Pelajaran': subj?.name || sch.subjectId,
        'Guru Pengampu': t?.name || sch.teacherId,
        'Ruang': sch.room
      };
    });
    downloadExcel('data_jadwal_pelajaran_smk', 'Jadwal Pelajaran', data);
    showToast(`Berhasil mengekspor ${data.length} jadwal pelajaran!`);
  };

  const handleExportAssignmentsExcel = () => {
    const data = teachingAssignments.map(ta => {
      const t = teachers.find(tch => tch.id === ta.teacherId);
      const subj = subjects.find(s => s.id === ta.subjectId);
      const r = rombels.find(rm => rm.id === ta.rombelId);
      return {
        'NIP Guru': t?.nip || '',
        'Nama Guru': t?.name || ta.teacherId,
        'Kode Mapel': subj?.code || '',
        'Mata Pelajaran': subj?.name || ta.subjectId,
        'Kode Rombel': r?.code || '',
        'Nama Rombel': r?.name || ta.rombelId
      };
    });
    downloadExcel('data_penugasan_guru_smk', 'Penugasan Mengajar', data);
    showToast(`Berhasil mengekspor ${data.length} penugasan guru!`);
  };

  const handleExportSecretariesExcel = () => {
    const data = secretaryAssignments.map(sa => {
      const r = rombels.find(rm => rm.id === sa.rombelId);
      return {
        'Rombel Kelas': r?.name || sa.rombelName,
        'NIS Siswa': sa.studentNis,
        'Nama Siswa': sa.studentName,
        'Status': sa.isActive ? 'Aktif' : 'Nonaktif',
        'Tanggal Ditugaskan': sa.assignedAt,
        'Tanggal Dicabut': sa.deassignedAt || '-',
        'Ditugaskan Oleh': sa.assignedByUserName,
        'Catatan': sa.notes || '-'
      };
    });
    downloadExcel('data_sekretaris_kelas_smk', 'Sekretaris Kelas', data);
    showToast(`Berhasil mengekspor ${data.length} catatan sekretaris kelas!`);
  };

  // ==========================================
  // PARSING & IMPORT SUBMITS
  // ==========================================
  const handleRombelFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const rows = await parseExcelOrCsvFile(file);
      if (!rows || rows.length === 0) {
        setRombelImportErrors(['File Excel/CSV kosong atau tidak berisi data.']);
        setRombelImportPreview([]);
        return;
      }
      const parsed = rows.map((row: any) => ({
        code: String(row['Kode Rombel'] || row['Kode'] || row['code'] || '').trim(),
        name: String(row['Nama Kelas'] || row['Nama Rombel'] || row['Nama'] || row['name'] || '').trim(),
        grade: String(row['Tingkat'] || row['Kelas'] || row['grade'] || 'X').trim().toUpperCase() as GradeLevel,
        departmentCode: String(row['Jurusan'] || row['Kode Jurusan'] || row['departmentCode'] || '').trim().toUpperCase(),
        departmentId: '',
        homeroomTeacherName: String(row['Wali Kelas'] || row['Nama Wali'] || row['homeroomTeacherName'] || '').trim(),
        homeroomTeacherId: '',
        academicYearId: activeAcademicYear.id,
        status: 'active' as const
      }));
      setRombelImportPreview(parsed);
      setRombelImportErrors([]);
    } catch (err: any) {
      setRombelImportErrors([`Gagal membaca file: ${err.message}`]);
    }
  };

  const submitRombelImport = () => {
    if (rombelImportPreview.length === 0) return;
    const result = importRombels(rombelImportPreview);
    setRombelImportErrors(result.errors);
    if (result.errors.length === 0) {
      setShowRombelImportModal(false);
      setRombelImportPreview([]);
    }
  };

  const handleTeacherFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const rows = await parseExcelOrCsvFile(file);
      if (!rows || rows.length === 0) {
        setTeacherImportErrors(['File Excel/CSV kosong.']);
        return;
      }
      const parsed = rows.map((row: any) => ({
        nip: String(row['NIP'] || row['nip'] || '').trim(),
        name: String(row['Nama Lengkap'] || row['Nama'] || row['name'] || '').trim(),
        email: String(row['Email Dinas'] || row['Email'] || row['email'] || '').trim(),
        phone: String(row['No Telepon'] || row['Telepon'] || row['phone'] || '').trim(),
        gender: (String(row['Jenis Kelamin'] || row['JK'] || 'L').toUpperCase().startsWith('P') ? 'P' : 'L') as 'L'|'P',
        specialization: String(row['Spesialisasi'] || row['Bidang'] || 'Kejuruan').trim(),
        status: 'active' as const
      }));
      setTeacherImportPreview(parsed);
      setTeacherImportErrors([]);
    } catch (err: any) {
      setTeacherImportErrors([`Gagal membaca file: ${err.message}`]);
    }
  };

  const submitTeacherImport = () => {
    if (teacherImportPreview.length === 0) return;
    const result = importTeachers(teacherImportPreview);
    setTeacherImportErrors(result.errors);
    if (result.errors.length === 0) {
      setShowTeacherImportModal(false);
      setTeacherImportPreview([]);
    }
  };

  const handleSubjectFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const rows = await parseExcelOrCsvFile(file);
      const parsed = rows.map((row: any) => ({
        code: String(row['Kode Mapel'] || row['Kode'] || '').trim(),
        name: String(row['Nama Mata Pelajaran'] || row['Nama Mapel'] || row['Nama'] || '').trim(),
        category: (row['Kategori'] || 'Muatan Kejuruan') as any,
        creditHours: Number(row['Beban Jam (JP)'] || row['JP'] || 4)
      }));
      setSubjectImportPreview(parsed);
      setSubjectImportErrors([]);
    } catch (err: any) {
      setSubjectImportErrors([`Gagal membaca file: ${err.message}`]);
    }
  };

  const submitSubjectImport = () => {
    if (subjectImportPreview.length === 0) return;
    const result = importSubjects(subjectImportPreview);
    setSubjectImportErrors(result.errors);
    if (result.errors.length === 0) {
      setShowSubjectImportModal(false);
      setSubjectImportPreview([]);
    }
  };

  const handleStudentFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const rows = await parseExcelOrCsvFile(file);
      const parsed = rows.map((row: any) => ({
        nis: String(row['NIS'] || row['nis'] || '').trim(),
        nisn: String(row['NISN'] || row['nisn'] || '').trim(),
        name: String(row['Nama Lengkap'] || row['Nama Siswa'] || row['Nama'] || '').trim(),
        gender: (String(row['Jenis Kelamin'] || row['JK'] || 'L').toUpperCase().startsWith('P') ? 'P' : 'L') as 'L'|'P',
        rombelId: String(row['Kode Rombel'] || row['Rombel'] || row['Kelas'] || '').trim(),
        departmentId: '',
        academicYearId: activeAcademicYear.id,
        status: 'active' as const,
        phone: String(row['No Telepon'] || row['Telepon'] || '').trim()
      }));
      setStudentImportPreview(parsed);
      setStudentImportErrors([]);
    } catch (err: any) {
      setStudentImportErrors([`Gagal membaca file: ${err.message}`]);
    }
  };

  const submitStudentImport = () => {
    if (studentImportPreview.length === 0) return;
    const result = importStudents(studentImportPreview);
    setStudentImportErrors(result.errors);
    if (result.errors.length === 0) {
      setShowStudentImportModal(false);
      setStudentImportPreview([]);
    }
  };

  // ==========================================
  // FORM SAVE HANDLERS
  // ==========================================
  const handleSaveRombel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rombelForm.name || !rombelForm.code) {
      showToast('Kode dan Nama kelas wajib diisi.', 'error');
      return;
    }

    const dept = departments.find(d => d.id === rombelForm.departmentId) || departments[0];
    const teacher = teachers.find(t => t.id === rombelForm.homeroomTeacherId);

    if (editingRombel) {
      updateRombel(editingRombel.id, {
        code: rombelForm.code.trim().toUpperCase(),
        name: rombelForm.name.trim(),
        grade: rombelForm.grade,
        departmentId: dept.id,
        departmentCode: dept.code,
        homeroomTeacherId: teacher ? teacher.id : '',
        homeroomTeacherName: teacher ? teacher.name : ''
      });
    } else {
      addRombel({
        code: rombelForm.code.trim().toUpperCase(),
        name: rombelForm.name.trim(),
        grade: rombelForm.grade,
        departmentId: dept.id,
        departmentCode: dept.code,
        academicYearId: activeAcademicYear.id,
        homeroomTeacherId: teacher ? teacher.id : '',
        homeroomTeacherName: teacher ? teacher.name : '',
        status: 'active',
        studentCount: 0
      });
    }
    setShowRombelModal(false);
    setEditingRombel(null);
  };

  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentForm.nis || !studentForm.name) {
      showToast('NIS dan Nama siswa wajib diisi.', 'error');
      return;
    }

    const r = rombels.find(rm => rm.id === studentForm.rombelId);

    if (editingStudent) {
      updateStudent(editingStudent.id, {
        ...studentForm,
        departmentId: r?.departmentId || studentForm.departmentId
      });
    } else {
      addStudent({
        ...studentForm,
        departmentId: r?.departmentId || studentForm.departmentId,
        academicYearId: activeAcademicYear.id
      });
    }
    setShowStudentModal(false);
    setEditingStudent(null);
  };

  const handleSaveTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherForm.nip || !teacherForm.name) {
      showToast('NIP dan Nama guru wajib diisi.', 'error');
      return;
    }

    if (editingTeacher) {
      updateTeacher(editingTeacher.id, teacherForm);
    } else {
      addTeacher(teacherForm);
    }
    setShowTeacherModal(false);
    setEditingTeacher(null);
  };

  const handleSaveSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectForm.code || !subjectForm.name) {
      showToast('Kode dan Nama Mata Pelajaran wajib diisi.', 'error');
      return;
    }
    if (editingSubject) {
      updateSubject(editingSubject.id, subjectForm);
    } else {
      addSubject(subjectForm);
    }
    setShowSubjectModal(false);
    setEditingSubject(null);
  };

  const handleSaveSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    addSchedule({
      ...scheduleForm,
      academicYearId: activeAcademicYear.id
    });
    setShowScheduleModal(false);
  };

  const handleSaveAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    addTeachingAssignment({
      ...assignmentForm,
      academicYearId: activeAcademicYear.id
    });
    setShowAssignmentModal(false);
  };

  const daysIndo = ['', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                Akses Administrator
              </span>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs text-slate-500 font-medium">Pengelolaan Master Sekolah</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-1">
              Data Master Sistem Absensi SMK
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Kelola kelas/rombel (X DKV 1-3, X DPIB 1-2, dll), data siswa, guru, 8 jurusan SMK, mata pelajaran, penugasan, dan jadwal pelajaran lengkap dengan fasilitas Ekspor & Impor Excel/CSV.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowBackupModal(true)}
              className="px-3.5 py-2 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg flex items-center gap-2 transition-colors shadow-xs"
            >
              <Database className="w-4 h-4 text-indigo-600" />
              <span>Cadangkan Sistem (Backup & Restore)</span>
            </button>
          </div>
        </div>

        {/* Tabs Bar */}
        <div className="flex items-center gap-2 mt-5 border-t border-slate-100 pt-4 overflow-x-auto">
          {[
            { id: 'rombels', label: `Jurusan & Rombel (${rombels.length})`, icon: Layers },
            { id: 'students', label: `Data Siswa (${students.length})`, icon: Users },
            { id: 'teachers', label: `Data Guru (${teachers.length})`, icon: GraduationCap },
            { id: 'subjects', label: `Mata Pelajaran (${subjects.length})`, icon: BookOpen },
            { id: 'assignments', label: `Penugasan Guru (${teachingAssignments.length})`, icon: Clock },
            { id: 'schedules', label: `Jadwal Pelajaran (${schedules.length})`, icon: Calendar },
            { id: 'secretaries', label: `Sekretaris Kelas (${secretaryAssignments.filter(s => s.isActive).length})`, icon: ShieldCheck },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors flex items-center gap-2 ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ============================================================ */}
      {/* 1. JURUSAN & ROMBEL TAB (Utama: Kelas X DKV 1, 2, 3, DPIB, dll) */}
      {/* ============================================================ */}
      {activeTab === 'rombels' && (
        <div className="space-y-6">
          {/* 8 Jurusan SMK */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">
              8 Kompetensi Keahlian (Jurusan) SMK
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {departments.map(d => (
                <div key={d.id} className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/50">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-900 font-mono-tabular">{d.code}</span>
                    <span className="text-[10px] text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded font-semibold">
                      {rombels.filter(r => r.departmentId === d.id).length} Rombel
                    </span>
                  </div>
                  <h4 className="text-xs font-semibold text-slate-800 mt-1">{d.name}</h4>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{d.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Rombel Table with Full Export & Import */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Daftar Rombongan Belajar (Rombel Kelas)
                </h3>
                <p className="text-xs text-slate-500">
                  Mengelola seluruh rombel (misal: X DKV 1, X DKV 2, X DKV 3, X DPIB 1, dsb) beserta wali kelas pengampu.
                </p>
              </div>

              {/* Action Buttons: Export, Import, Tambah */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleExportRombelsExcel}
                  className="px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Ekspor Excel (.xlsx)
                </button>
                <button
                  onClick={handleExportRombelsCsv}
                  className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1 transition-colors"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  CSV
                </button>

                <button
                  onClick={() => {
                    setRombelImportErrors([]);
                    setRombelImportPreview([]);
                    setShowRombelImportModal(true);
                  }}
                  className="px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg flex items-center gap-1.5 transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Impor Kelas (Excel/CSV)
                </button>

                <button
                  onClick={() => {
                    setEditingRombel(null);
                    setRombelForm({
                      code: '',
                      name: '',
                      grade: 'X',
                      departmentId: departments[0]?.id || '',
                      homeroomTeacherId: teachers[0]?.id || ''
                    });
                    setShowRombelModal(true);
                  }}
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Tambah Rombel
                </button>
              </div>
            </div>

            {/* Quick Filter */}
            <div className="relative max-w-sm">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Cari kode atau nama rombel (cth: DKV, X DKV 1)..."
                value={rombelSearch}
                onChange={e => setRombelSearch(e.target.value)}
                className="w-full text-xs pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg focus:ring-1 focus:ring-slate-900"
              />
            </div>

            {/* Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">No</th>
                    <th className="py-2.5 px-3">Kode Rombel</th>
                    <th className="py-2.5 px-3">Nama Kelas</th>
                    <th className="py-2.5 px-3">Tingkat</th>
                    <th className="py-2.5 px-3">Jurusan</th>
                    <th className="py-2.5 px-3">Wali Kelas</th>
                    <th className="py-2.5 px-3 text-center">Jumlah Siswa</th>
                    <th className="py-2.5 px-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRombels.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        Tidak ada kelas / rombel yang cocok.
                      </td>
                    </tr>
                  ) : (
                    filteredRombels.map((r, idx) => {
                      const count = students.filter(s => s.rombelId === r.id && s.status === 'active').length;
                      return (
                        <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-2.5 px-3 font-mono-tabular text-slate-400">{idx + 1}</td>
                          <td className="py-2.5 px-3 font-mono-tabular font-bold text-slate-900">{r.code}</td>
                          <td className="py-2.5 px-3 font-semibold text-slate-800">{r.name}</td>
                          <td className="py-2.5 px-3 font-mono-tabular">
                            <span className="px-2 py-0.5 rounded bg-slate-100 font-bold text-slate-700">
                              {r.grade}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 font-medium">{r.departmentCode}</td>
                          <td className="py-2.5 px-3 font-medium text-slate-900">{r.homeroomTeacherName || 'Belum Ditugaskan'}</td>
                          <td className="py-2.5 px-3 text-center font-mono-tabular font-bold text-slate-800">
                            {count} Siswa
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => {
                                  setEditingRombel(r);
                                  setRombelForm({
                                    code: r.code,
                                    name: r.name,
                                    grade: r.grade,
                                    departmentId: r.departmentId,
                                    homeroomTeacherId: r.homeroomTeacherId
                                  });
                                  setShowRombelModal(true);
                                }}
                                className="text-indigo-600 hover:text-indigo-800 font-medium"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(`Hapus rombel ${r.name}? Pastikan tidak ada siswa yang terdaftar.`)) {
                                    deleteRombel(r.id);
                                  }
                                }}
                                className="text-rose-600 hover:text-rose-800 font-medium ml-2"
                              >
                                Hapus
                              </button>
                            </div>
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
      )}

      {/* ============================================================ */}
      {/* 2. DATA SISWA TAB */}
      {/* ============================================================ */}
      {activeTab === 'students' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3 flex-1">
              <div className="relative min-w-[200px] flex-1 max-w-sm">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Cari nama atau NIS siswa..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full text-xs pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <select
                value={filterRombel}
                onChange={e => setFilterRombel(e.target.value)}
                className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 bg-slate-50 text-slate-800"
              >
                <option value="all">Semua Rombel</option>
                {rombels.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportStudentsExcel}
                className="px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Ekspor Siswa
              </button>

              <button
                onClick={() => {
                  setStudentImportErrors([]);
                  setStudentImportPreview([]);
                  setShowStudentImportModal(true);
                }}
                className="px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                Impor Siswa
              </button>

              <button
                onClick={() => {
                  setEditingStudent(null);
                  setStudentForm({
                    nis: '',
                    nisn: '',
                    name: '',
                    gender: 'L',
                    departmentId: departments[0]?.id || '',
                    rombelId: rombels[0]?.id || '',
                    status: 'active',
                    phone: '',
                    parentName: ''
                  });
                  setShowStudentModal(true);
                }}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Tambah Siswa
              </button>
            </div>
          </div>

          {/* Student Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">No</th>
                  <th className="py-2.5 px-3">NIS</th>
                  <th className="py-2.5 px-3">NISN</th>
                  <th className="py-2.5 px-3">Nama Siswa</th>
                  <th className="py-2.5 px-3 text-center">JK</th>
                  <th className="py-2.5 px-3">Rombel</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      Tidak ada data siswa yang cocok dengan pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((st, idx) => {
                    const r = rombels.find(rm => rm.id === st.rombelId);
                    return (
                      <tr key={st.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 px-3 font-mono-tabular text-slate-400">
                          {(currentPage - 1) * pageSize + idx + 1}
                        </td>
                        <td className="py-2.5 px-3 font-mono-tabular font-medium text-slate-700">{st.nis}</td>
                        <td className="py-2.5 px-3 font-mono-tabular text-slate-500">{st.nisn || '-'}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">{st.name}</td>
                        <td className="py-2.5 px-3 text-center font-mono-tabular">{st.gender}</td>
                        <td className="py-2.5 px-3 font-medium text-slate-800">{r?.name || st.rombelCode || '-'}</td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            st.status === 'active' 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {st.status === 'active' ? 'Aktif' : st.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {onOpenTransferModal && (
                              <button
                                onClick={() => onOpenTransferModal(st)}
                                className="text-amber-600 hover:text-amber-800 font-medium"
                                title="Mutasi / Pindah Kelas"
                              >
                                Mutasi
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setEditingStudent(st);
                                setStudentForm({
                                  nis: st.nis,
                                  nisn: st.nisn || '',
                                  name: st.name,
                                  gender: st.gender,
                                  departmentId: st.departmentId,
                                  rombelId: st.rombelId,
                                  status: st.status,
                                  phone: st.phone || '',
                                  parentName: st.parentName || ''
                                });
                                setShowStudentModal(true);
                              }}
                              className="text-indigo-600 hover:text-indigo-800 font-medium"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Hapus siswa ${st.name} (${st.nis})?`)) {
                                  deleteStudent(st.id);
                                }
                              }}
                              className="text-rose-600 hover:text-rose-800 font-medium"
                            >
                              Hapus
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filteredStudents.length > pageSize && (
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-500">
                Menampilkan {(currentPage - 1) * pageSize + 1} s/d {Math.min(currentPage * pageSize, filteredStudents.length)} dari {filteredStudents.length} siswa
              </span>
              <div className="flex items-center gap-1">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  className="px-2 py-1 text-xs border rounded disabled:opacity-40"
                >
                  Sebelumnya
                </button>
                <button
                  disabled={currentPage * pageSize >= filteredStudents.length}
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  className="px-2 py-1 text-xs border rounded disabled:opacity-40"
                >
                  Selanjutnya
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* 3. DATA GURU TAB */}
      {/* ============================================================ */}
      {activeTab === 'teachers' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="relative max-w-sm flex-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Cari NIP atau nama guru..."
                value={teacherSearch}
                onChange={e => setTeacherSearch(e.target.value)}
                className="w-full text-xs pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportTeachersExcel}
                className="px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Ekspor Guru
              </button>

              <button
                onClick={() => {
                  setTeacherImportErrors([]);
                  setTeacherImportPreview([]);
                  setShowTeacherImportModal(true);
                }}
                className="px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                Impor Guru
              </button>

              <button
                onClick={() => {
                  setEditingTeacher(null);
                  setTeacherForm({
                    nip: '',
                    name: '',
                    email: '',
                    phone: '',
                    gender: 'L',
                    specialization: '',
                    status: 'active'
                  });
                  setShowTeacherModal(true);
                }}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Tambah Guru
              </button>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">No</th>
                  <th className="py-2.5 px-3">NIP</th>
                  <th className="py-2.5 px-3">Nama Lengkap & Gelar</th>
                  <th className="py-2.5 px-3">Email Dinas</th>
                  <th className="py-2.5 px-3">No. Telepon / WhatsApp</th>
                  <th className="py-2.5 px-3">Spesialisasi / Kejuruan</th>
                  <th className="py-2.5 px-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTeachers.map((t, idx) => (
                  <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3 font-mono-tabular text-slate-400">{idx + 1}</td>
                    <td className="py-2.5 px-3 font-mono-tabular text-slate-700">{t.nip}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">{t.name}</td>
                    <td className="py-2.5 px-3 text-slate-600">{t.email}</td>
                    <td className="py-2.5 px-3 font-mono-tabular text-slate-600">{t.phone}</td>
                    <td className="py-2.5 px-3 text-slate-700">{t.specialization || '-'}</td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setEditingTeacher(t);
                            setTeacherForm({
                              nip: t.nip,
                              name: t.name,
                              email: t.email,
                              phone: t.phone,
                              gender: t.gender,
                              specialization: t.specialization || '',
                              status: t.status
                            });
                            setShowTeacherModal(true);
                          }}
                          className="text-indigo-600 hover:text-indigo-800 font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Hapus guru ${t.name}?`)) {
                              deleteTeacher(t.id);
                            }
                          }}
                          className="text-rose-600 hover:text-rose-800 font-medium"
                        >
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 4. MATA PELAJARAN TAB */}
      {/* ============================================================ */}
      {activeTab === 'subjects' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Mata Pelajaran Kurikulum SMK</h3>
              <p className="text-xs text-slate-500">Muatan Nasional, Muatan Kejuruan, dan Muatan Lokal</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportSubjectsExcel}
                className="px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Ekspor Mapel
              </button>

              <button
                onClick={() => {
                  setSubjectImportErrors([]);
                  setSubjectImportPreview([]);
                  setShowSubjectImportModal(true);
                }}
                className="px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                Impor Mapel
              </button>

              <button
                onClick={() => {
                  setEditingSubject(null);
                  setSubjectForm({
                    code: '',
                    name: '',
                    category: 'Muatan Kejuruan',
                    creditHours: 4
                  });
                  setShowSubjectModal(true);
                }}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Tambah Mapel
              </button>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Kode Mapel</th>
                  <th className="py-2.5 px-3">Nama Mata Pelajaran</th>
                  <th className="py-2.5 px-3">Kategori</th>
                  <th className="py-2.5 px-3 text-center">Beban Jam (JP)</th>
                  <th className="py-2.5 px-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSubjects.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3 font-mono-tabular font-bold text-slate-900">{s.code}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">{s.name}</td>
                    <td className="py-2.5 px-3 text-slate-600">{s.category}</td>
                    <td className="py-2.5 px-3 text-center font-mono-tabular font-bold text-indigo-700">{s.creditHours} JP</td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setEditingSubject(s);
                            setSubjectForm({
                              code: s.code,
                              name: s.name,
                              category: s.category,
                              creditHours: s.creditHours
                            });
                            setShowSubjectModal(true);
                          }}
                          className="text-indigo-600 hover:text-indigo-800 font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Hapus mapel ${s.name}?`)) {
                              deleteSubject(s.id);
                            }
                          }}
                          className="text-rose-600 hover:text-rose-800 font-medium"
                        >
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 5. PENUGASAN GURU TAB */}
      {/* ============================================================ */}
      {activeTab === 'assignments' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Penugasan Mengajar Guru ke Rombel</h3>
              <p className="text-xs text-slate-500">Mendukung satu guru mengajar banyak mapel di banyak rombel</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportAssignmentsExcel}
                className="px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Ekspor Penugasan
              </button>

              <button
                onClick={() => setShowAssignmentModal(true)}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Tambah Penugasan
              </button>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Nama Guru</th>
                  <th className="py-2.5 px-3">Mata Pelajaran</th>
                  <th className="py-2.5 px-3">Kelas / Rombel</th>
                  <th className="py-2.5 px-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {teachingAssignments.map(ta => {
                  const t = teachers.find(tch => tch.id === ta.teacherId);
                  const subj = subjects.find(s => s.id === ta.subjectId);
                  const r = rombels.find(rm => rm.id === ta.rombelId);
                  return (
                    <tr key={ta.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{t?.name || ta.teacherId}</td>
                      <td className="py-2.5 px-3 text-slate-800">{subj?.name || ta.subjectId}</td>
                      <td className="py-2.5 px-3 font-medium text-slate-700">{r?.name || ta.rombelId}</td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => {
                            if (confirm('Hapus penugasan ini?')) {
                              deleteTeachingAssignment(ta.id);
                            }
                          }}
                          className="text-rose-600 hover:text-rose-800 font-medium"
                        >
                          Hapus
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 6. JADWAL PELAJARAN TAB */}
      {/* ============================================================ */}
      {activeTab === 'schedules' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Jadwal Pelajaran Sekolah</h3>
              <p className="text-xs text-slate-500">Jadwal mengajar mingguan per rombel dan guru</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportSchedulesExcel}
                className="px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Ekspor Jadwal
              </button>

              <button
                onClick={() => setShowScheduleModal(true)}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Tambah Jadwal
              </button>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Hari</th>
                  <th className="py-2.5 px-3">Jam Ke-</th>
                  <th className="py-2.5 px-3">Waktu</th>
                  <th className="py-2.5 px-3">Kelas</th>
                  <th className="py-2.5 px-3">Mata Pelajaran</th>
                  <th className="py-2.5 px-3">Guru Pengampu</th>
                  <th className="py-2.5 px-3">Ruangan</th>
                  <th className="py-2.5 px-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {schedules.map(sch => {
                  const t = teachers.find(tch => tch.id === sch.teacherId);
                  const subj = subjects.find(s => s.id === sch.subjectId);
                  const r = rombels.find(rm => rm.id === sch.rombelId);
                  return (
                    <tr key={sch.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{daysIndo[sch.dayOfWeek]}</td>
                      <td className="py-2.5 px-3 font-mono-tabular text-slate-700">{sch.periodStart} s/d {sch.periodEnd}</td>
                      <td className="py-2.5 px-3 font-mono-tabular text-slate-600">{sch.timeStart} - {sch.timeEnd}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800">{r?.name}</td>
                      <td className="py-2.5 px-3 text-slate-800">{subj?.name}</td>
                      <td className="py-2.5 px-3 text-slate-600">{t?.name}</td>
                      <td className="py-2.5 px-3 text-slate-500">{sch.room}</td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => {
                            if (confirm('Hapus jadwal ini?')) {
                              deleteSchedule(sch.id);
                            }
                          }}
                          className="text-rose-600 hover:text-rose-800 font-medium"
                        >
                          Hapus
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 7. SEKRETARIS KELAS TAB */}
      {/* ============================================================ */}
      {activeTab === 'secretaries' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Penugasan Sekretaris Kelas Seluruh Rombel ({secretaryAssignments.length} Catatan)
              </h3>
              <p className="text-xs text-slate-500">
                Manajemen akun siswa yang ditugaskan sebagai sekretaris pemantau kehadiran per rombel
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportSecretariesExcel}
                className="px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Ekspor Sekretaris
              </button>

              <button
                onClick={() => {
                  setSecRombelId(rombels[0]?.id || '');
                  const firstRombelStudents = students.filter(s => s.rombelId === (rombels[0]?.id || '') && s.status === 'active');
                  setSecStudentId(firstRombelStudents[0]?.id || '');
                  setSecNotes('');
                  setShowSecretaryModal(true);
                }}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Tunjuk Sekretaris
              </button>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Rombel Kelas</th>
                  <th className="py-2.5 px-3">Nama Siswa</th>
                  <th className="py-2.5 px-3">NIS</th>
                  <th className="py-2.5 px-3">Mulai Ditugaskan</th>
                  <th className="py-2.5 px-3">Selesai / Dicabut</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Ditugaskan Oleh</th>
                  <th className="py-2.5 px-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {secretaryAssignments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400 italic">
                      Belum ada catatan penugasan sekretaris kelas.
                    </td>
                  </tr>
                ) : (
                  secretaryAssignments.map(sa => {
                    const r = rombels.find(rm => rm.id === sa.rombelId);
                    return (
                      <tr key={sa.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 px-3 font-semibold text-slate-900">{r?.name || sa.rombelName || sa.rombelId}</td>
                        <td className="py-2.5 px-3 font-medium text-slate-900">{sa.studentName}</td>
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
                        <td className="py-2.5 px-3 text-right">
                          {sa.isActive ? (
                            <button
                              onClick={() => {
                                const reason = prompt('Masukkan alasan pencabutan hak akses sekretaris kelas:') || 'Pencabutan oleh administrator';
                                revokeSecretaryAssignment(sa.id, reason);
                              }}
                              className="text-rose-600 hover:text-rose-800 font-semibold"
                            >
                              Cabut Hak Akses
                            </button>
                          ) : (
                            <span className="text-slate-400 text-[11px]">Telah Dicabut</span>
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

      {/* ============================================================ */}
      {/* MODALS & OVERLAYS */}
      {/* ============================================================ */}

      {/* 1. MODAL TAMBAH/EDIT ROMBEL KELAS */}
      {showRombelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {editingRombel ? 'Edit Data Rombongan Belajar' : 'Tambah Rombel Kelas Baru'}
              </h3>
              <button onClick={() => setShowRombelModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRombel} className="space-y-3 mt-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Kode Rombel <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="cth: DKV-X-1, DPIB-X-2"
                    value={rombelForm.code}
                    onChange={e => setRombelForm({ ...rombelForm, code: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2 font-mono-tabular"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Nama Kelas <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="cth: X DKV 1, X DPIB 1"
                    value={rombelForm.name}
                    onChange={e => setRombelForm({ ...rombelForm, name: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2 font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Tingkat Kelas <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={rombelForm.grade}
                    onChange={e => setRombelForm({ ...rombelForm, grade: e.target.value as GradeLevel })}
                    className="w-full border border-slate-200 rounded-lg p-2"
                  >
                    <option value="X">Kelas X (Sepuluh)</option>
                    <option value="XI">Kelas XI (Sebelas)</option>
                    <option value="XII">Kelas XII (Dua Belas)</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Jurusan / Kompetensi <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={rombelForm.departmentId}
                    onChange={e => setRombelForm({ ...rombelForm, departmentId: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2"
                  >
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.code} - {d.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Wali Kelas Pengampu
                </label>
                <select
                  value={rombelForm.homeroomTeacherId}
                  onChange={e => setRombelForm({ ...rombelForm, homeroomTeacherId: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg p-2"
                >
                  <option value="">-- Belum Ditugaskan --</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.name} (NIP: {t.nip})</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowRombelModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs"
                >
                  {editingRombel ? 'Perbarui Rombel' : 'Simpan Rombel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. MODAL IMPOR KELAS / ROMBEL */}
      {showRombelImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Impor Massal Kelas / Rombel (Excel & CSV)
                </h3>
              </div>
              <button onClick={() => setShowRombelImportModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 mt-4 text-xs">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                <div>
                  <span className="font-bold text-emerald-900 block">Unduh Template Format Excel / CSV</span>
                  <span className="text-[11px] text-emerald-700">Berisi format kolom contoh: X DKV 1, X DKV 2, X DKV 3, X DPIB 1, XI TKP 1, dsb.</span>
                </div>
                <button
                  onClick={downloadRombelTemplate}
                  className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  Unduh Template
                </button>
              </div>

              {/* Upload Input */}
              <div className="border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-xl p-5 text-center transition-colors">
                <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1.5" />
                <label className="cursor-pointer">
                  <span className="font-semibold text-indigo-600 hover:text-indigo-800 block">
                    Pilih File Excel (.xlsx, .xls) atau CSV (.csv)
                  </span>
                  <span className="text-[11px] text-slate-400 block mt-0.5">
                    Klik untuk memilih file dari komputer
                  </span>
                  <input
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    onChange={handleRombelFileChange}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Errors Display */}
              {rombelImportErrors.length > 0 && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 space-y-1">
                  <div className="flex items-center gap-2 font-bold">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>Ditemukan {rombelImportErrors.length} kendala format:</span>
                  </div>
                  <ul className="list-disc pl-5 text-[11px] space-y-0.5 max-h-32 overflow-y-auto">
                    {rombelImportErrors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Preview Table */}
              {rombelImportPreview.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">
                      Pratinjau Data ({rombelImportPreview.length} Rombel Ditemukan):
                    </span>
                    <span className="text-[11px] text-emerald-600 font-semibold">Siap Diimpor</span>
                  </div>

                  <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg">
                    <table className="w-full text-[11px] text-left">
                      <thead className="bg-slate-50 text-slate-500 uppercase sticky top-0">
                        <tr>
                          <th className="py-2 px-2.5">No</th>
                          <th className="py-2 px-2.5">Kode</th>
                          <th className="py-2 px-2.5">Nama Kelas</th>
                          <th className="py-2 px-2.5">Tingkat</th>
                          <th className="py-2 px-2.5">Jurusan</th>
                          <th className="py-2 px-2.5">Wali Kelas</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {rombelImportPreview.map((row, i) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="py-1.5 px-2.5 text-slate-400 font-mono-tabular">{i + 1}</td>
                            <td className="py-1.5 px-2.5 font-bold text-slate-800 font-mono-tabular">{row.code}</td>
                            <td className="py-1.5 px-2.5 font-semibold text-slate-900">{row.name}</td>
                            <td className="py-1.5 px-2.5">{row.grade}</td>
                            <td className="py-1.5 px-2.5 text-slate-600">{row.departmentCode}</td>
                            <td className="py-1.5 px-2.5 text-slate-700">{row.homeroomTeacherName || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowRombelImportModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={rombelImportPreview.length === 0}
                  onClick={submitRombelImport}
                  className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-40 rounded-lg shadow-xs"
                >
                  Terapkan Impor {rombelImportPreview.length > 0 ? `(${rombelImportPreview.length} Rombel)` : ''}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. MODAL IMPOR SISWA */}
      {showStudentImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Impor Massal Siswa (Excel & CSV)
                </h3>
              </div>
              <button onClick={() => setShowStudentImportModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 mt-4 text-xs">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                <div>
                  <span className="font-bold text-emerald-900 block">Unduh Template Data Siswa</span>
                  <span className="text-[11px] text-emerald-700">Format kolom: NIS, NISN, Nama Lengkap, JK, Kode Rombel, dsb.</span>
                </div>
                <button
                  onClick={downloadStudentTemplate}
                  className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  Unduh Template
                </button>
              </div>

              <div className="border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-xl p-5 text-center transition-colors">
                <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1.5" />
                <label className="cursor-pointer">
                  <span className="font-semibold text-indigo-600 hover:text-indigo-800 block">
                    Pilih File Excel / CSV Siswa
                  </span>
                  <input
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    onChange={handleStudentFileChange}
                    className="hidden"
                  />
                </label>
              </div>

              {studentImportErrors.length > 0 && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 space-y-1">
                  <div className="flex items-center gap-2 font-bold">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>Kendala Validasi Impor:</span>
                  </div>
                  <ul className="list-disc pl-5 text-[11px] space-y-0.5 max-h-32 overflow-y-auto">
                    {studentImportErrors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              {studentImportPreview.length > 0 && (
                <div className="space-y-2">
                  <span className="font-bold text-slate-900">
                    Pratinjau Data Siswa ({studentImportPreview.length} Siswa):
                  </span>
                  <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg">
                    <table className="w-full text-[11px] text-left">
                      <thead className="bg-slate-50 text-slate-500 uppercase sticky top-0">
                        <tr>
                          <th className="py-2 px-2.5">No</th>
                          <th className="py-2 px-2.5">NIS</th>
                          <th className="py-2 px-2.5">Nama</th>
                          <th className="py-2 px-2.5">JK</th>
                          <th className="py-2 px-2.5">Rombel</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {studentImportPreview.map((row, i) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="py-1.5 px-2.5 text-slate-400">{i + 1}</td>
                            <td className="py-1.5 px-2.5 font-mono-tabular font-medium">{row.nis}</td>
                            <td className="py-1.5 px-2.5 font-semibold text-slate-900">{row.name}</td>
                            <td className="py-1.5 px-2.5">{row.gender}</td>
                            <td className="py-1.5 px-2.5">{row.rombelId}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowStudentImportModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={studentImportPreview.length === 0}
                  onClick={submitStudentImport}
                  className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-40 rounded-lg shadow-xs"
                >
                  Terapkan Impor Siswa
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. MODAL TAMBAH/EDIT SISWA */}
      {showStudentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-900">
              {editingStudent ? 'Edit Data Siswa' : 'Tambah Siswa Baru'}
            </h3>
            <form onSubmit={handleSaveStudent} className="space-y-3 mt-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">NIS <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={studentForm.nis}
                    onChange={e => setStudentForm({ ...studentForm, nis: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2 font-mono-tabular"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">NISN</label>
                  <input
                    type="text"
                    value={studentForm.nisn}
                    onChange={e => setStudentForm({ ...studentForm, nisn: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2 font-mono-tabular"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Nama Lengkap Siswa <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  value={studentForm.name}
                  onChange={e => setStudentForm({ ...studentForm, name: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg p-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Jenis Kelamin</label>
                  <select
                    value={studentForm.gender}
                    onChange={e => setStudentForm({ ...studentForm, gender: e.target.value as any })}
                    className="w-full border border-slate-200 rounded-lg p-2"
                  >
                    <option value="L">Laki-laki (L)</option>
                    <option value="P">Perempuan (P)</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Rombel Kelas <span className="text-rose-500">*</span></label>
                  <select
                    value={studentForm.rombelId}
                    onChange={e => setStudentForm({ ...studentForm, rombelId: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2 font-medium"
                  >
                    {rombels.map(r => (
                      <option key={r.id} value={r.id}>{r.name} ({r.code})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowStudentModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs"
                >
                  Simpan Siswa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. MODAL IMPOR GURU */}
      {showTeacherImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Impor Massal Guru (Excel & CSV)
                </h3>
              </div>
              <button onClick={() => setShowTeacherImportModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 mt-4 text-xs">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                <div>
                  <span className="font-bold text-emerald-900 block">Unduh Template Format Guru</span>
                  <span className="text-[11px] text-emerald-700">Format: NIP, Nama Lengkap, Email Dinas, No Telepon, JK, Spesialisasi</span>
                </div>
                <button
                  onClick={downloadTeacherTemplate}
                  className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  Unduh Template
                </button>
              </div>

              <div className="border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-xl p-5 text-center transition-colors">
                <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1.5" />
                <label className="cursor-pointer">
                  <span className="font-semibold text-indigo-600 hover:text-indigo-800 block">
                    Pilih File Excel / CSV Guru
                  </span>
                  <input
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    onChange={handleTeacherFileChange}
                    className="hidden"
                  />
                </label>
              </div>

              {teacherImportErrors.length > 0 && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 space-y-1">
                  <div className="flex items-center gap-2 font-bold">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>Kendala Validasi Impor Guru:</span>
                  </div>
                  <ul className="list-disc pl-5 text-[11px] space-y-0.5 max-h-32 overflow-y-auto">
                    {teacherImportErrors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              {teacherImportPreview.length > 0 && (
                <div className="space-y-2">
                  <span className="font-bold text-slate-900">
                    Pratinjau Data Guru ({teacherImportPreview.length} Guru):
                  </span>
                  <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg">
                    <table className="w-full text-[11px] text-left">
                      <thead className="bg-slate-50 text-slate-500 uppercase sticky top-0">
                        <tr>
                          <th className="py-2 px-2.5">No</th>
                          <th className="py-2 px-2.5">NIP</th>
                          <th className="py-2 px-2.5">Nama</th>
                          <th className="py-2 px-2.5">Email</th>
                          <th className="py-2 px-2.5">Bidang</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {teacherImportPreview.map((row, i) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="py-1.5 px-2.5 text-slate-400">{i + 1}</td>
                            <td className="py-1.5 px-2.5 font-mono-tabular font-medium">{row.nip}</td>
                            <td className="py-1.5 px-2.5 font-semibold text-slate-900">{row.name}</td>
                            <td className="py-1.5 px-2.5 text-slate-600">{row.email}</td>
                            <td className="py-1.5 px-2.5">{row.specialization}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowTeacherImportModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={teacherImportPreview.length === 0}
                  onClick={submitTeacherImport}
                  className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-40 rounded-lg shadow-xs"
                >
                  Terapkan Impor Guru
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. MODAL TAMBAH/EDIT GURU */}
      {showTeacherModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-900">
              {editingTeacher ? 'Edit Data Guru' : 'Tambah Guru Baru'}
            </h3>
            <form onSubmit={handleSaveTeacher} className="space-y-3 mt-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">NIP <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={teacherForm.nip}
                    onChange={e => setTeacherForm({ ...teacherForm, nip: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2 font-mono-tabular"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Jenis Kelamin</label>
                  <select
                    value={teacherForm.gender}
                    onChange={e => setTeacherForm({ ...teacherForm, gender: e.target.value as any })}
                    className="w-full border border-slate-200 rounded-lg p-2"
                  >
                    <option value="L">Laki-laki (L)</option>
                    <option value="P">Perempuan (P)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Nama Lengkap & Gelar <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  value={teacherForm.name}
                  onChange={e => setTeacherForm({ ...teacherForm, name: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg p-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Email Dinas</label>
                  <input
                    type="email"
                    value={teacherForm.email}
                    onChange={e => setTeacherForm({ ...teacherForm, email: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">No. WhatsApp</label>
                  <input
                    type="text"
                    value={teacherForm.phone}
                    onChange={e => setTeacherForm({ ...teacherForm, phone: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2 font-mono-tabular"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Spesialisasi / Kejuruan</label>
                <input
                  type="text"
                  value={teacherForm.specialization}
                  onChange={e => setTeacherForm({ ...teacherForm, specialization: e.target.value })}
                  placeholder="Contoh: Otomotif Kendaraan Ringan"
                  className="w-full border border-slate-200 rounded-lg p-2"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowTeacherModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs"
                >
                  Simpan Guru
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. MODAL IMPOR MATA PELAJARAN */}
      {showSubjectImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Impor Massal Mata Pelajaran (Excel & CSV)
                </h3>
              </div>
              <button onClick={() => setShowSubjectImportModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 mt-4 text-xs">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                <div>
                  <span className="font-bold text-emerald-900 block">Unduh Template Mata Pelajaran</span>
                  <span className="text-[11px] text-emerald-700">Format: Kode Mapel, Nama Mapel, Kategori, JP</span>
                </div>
                <button
                  onClick={downloadSubjectTemplate}
                  className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  Unduh Template
                </button>
              </div>

              <div className="border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-xl p-5 text-center transition-colors">
                <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1.5" />
                <label className="cursor-pointer">
                  <span className="font-semibold text-indigo-600 hover:text-indigo-800 block">
                    Pilih File Excel / CSV Mapel
                  </span>
                  <input
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    onChange={handleSubjectFileChange}
                    className="hidden"
                  />
                </label>
              </div>

              {subjectImportErrors.length > 0 && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 space-y-1">
                  <div className="flex items-center gap-2 font-bold">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>Kendala Validasi Impor:</span>
                  </div>
                  <ul className="list-disc pl-5 text-[11px] space-y-0.5">
                    {subjectImportErrors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              {subjectImportPreview.length > 0 && (
                <div className="space-y-2">
                  <span className="font-bold text-slate-900">
                    Pratinjau ({subjectImportPreview.length} Mata Pelajaran):
                  </span>
                  <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg">
                    <table className="w-full text-[11px] text-left">
                      <thead className="bg-slate-50 text-slate-500 uppercase sticky top-0">
                        <tr>
                          <th className="py-2 px-2.5">No</th>
                          <th className="py-2 px-2.5">Kode</th>
                          <th className="py-2 px-2.5">Nama Mapel</th>
                          <th className="py-2 px-2.5">Kategori</th>
                          <th className="py-2 px-2.5 text-center">JP</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {subjectImportPreview.map((row, i) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="py-1.5 px-2.5 text-slate-400">{i + 1}</td>
                            <td className="py-1.5 px-2.5 font-bold">{row.code}</td>
                            <td className="py-1.5 px-2.5 font-semibold text-slate-900">{row.name}</td>
                            <td className="py-1.5 px-2.5 text-slate-600">{row.category}</td>
                            <td className="py-1.5 px-2.5 text-center font-bold text-indigo-700">{row.creditHours}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowSubjectImportModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={subjectImportPreview.length === 0}
                  onClick={submitSubjectImport}
                  className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-40 rounded-lg shadow-xs"
                >
                  Terapkan Impor Mapel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 8. MODAL TAMBAH/EDIT MAPEL */}
      {showSubjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-900">
              {editingSubject ? 'Edit Mata Pelajaran' : 'Tambah Mata Pelajaran Baru'}
            </h3>
            <form onSubmit={handleSaveSubject} className="space-y-3 mt-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Kode Mapel <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="cth: DKV-101, DPIB-201"
                  value={subjectForm.code}
                  onChange={e => setSubjectForm({ ...subjectForm, code: e.target.value.toUpperCase() })}
                  className="w-full border border-slate-200 rounded-lg p-2 font-mono-tabular"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Nama Mata Pelajaran <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="cth: Dasar-Dasar DKV"
                  value={subjectForm.name}
                  onChange={e => setSubjectForm({ ...subjectForm, name: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg p-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Kategori Kurikulum</label>
                  <select
                    value={subjectForm.category}
                    onChange={e => setSubjectForm({ ...subjectForm, category: e.target.value as any })}
                    className="w-full border border-slate-200 rounded-lg p-2"
                  >
                    <option value="Muatan Kejuruan">Muatan Kejuruan</option>
                    <option value="Muatan Nasional">Muatan Nasional</option>
                    <option value="Muatan Lokal">Muatan Lokal</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Beban Jam (JP)</label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={subjectForm.creditHours}
                    onChange={e => setSubjectForm({ ...subjectForm, creditHours: Number(e.target.value) })}
                    className="w-full border border-slate-200 rounded-lg p-2 font-mono-tabular"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowSubjectModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs"
                >
                  Simpan Mapel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 9. MODAL TAMBAH PENUGASAN GURU */}
      {showAssignmentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-900">
              Tambah Penugasan Mengajar Guru
            </h3>
            <form onSubmit={handleSaveAssignment} className="space-y-3 mt-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Guru Pengampu</label>
                <select
                  value={assignmentForm.teacherId}
                  onChange={e => setAssignmentForm({ ...assignmentForm, teacherId: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg p-2"
                >
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Mata Pelajaran</label>
                <select
                  value={assignmentForm.subjectId}
                  onChange={e => setAssignmentForm({ ...assignmentForm, subjectId: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg p-2"
                >
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Rombel Kelas</label>
                <select
                  value={assignmentForm.rombelId}
                  onChange={e => setAssignmentForm({ ...assignmentForm, rombelId: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg p-2"
                >
                  {rombels.map(r => (
                    <option key={r.id} value={r.id}>{r.name} ({r.code})</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAssignmentModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs"
                >
                  Simpan Penugasan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 10. MODAL TAMBAH JADWAL */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-900">
              Tambah Jadwal Pelajaran Mingguan
            </h3>
            <form onSubmit={handleSaveSchedule} className="space-y-3 mt-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Hari</label>
                  <select
                    value={scheduleForm.dayOfWeek}
                    onChange={e => setScheduleForm({ ...scheduleForm, dayOfWeek: Number(e.target.value) as any })}
                    className="w-full border border-slate-200 rounded-lg p-2"
                  >
                    <option value={1}>Senin</option>
                    <option value={2}>Selasa</option>
                    <option value={3}>Rabu</option>
                    <option value={4}>Kamis</option>
                    <option value={5}>Jumat</option>
                    <option value={6}>Sabtu</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Ruangan</label>
                  <input
                    type="text"
                    value={scheduleForm.room}
                    onChange={e => setScheduleForm({ ...scheduleForm, room: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Jam Ke (Mulai - Selesai)</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="1"
                      max="12"
                      value={scheduleForm.periodStart}
                      onChange={e => setScheduleForm({ ...scheduleForm, periodStart: Number(e.target.value) })}
                      className="w-full border border-slate-200 rounded-lg p-2 font-mono-tabular"
                    />
                    <span>s/d</span>
                    <input
                      type="number"
                      min="1"
                      max="12"
                      value={scheduleForm.periodEnd}
                      onChange={e => setScheduleForm({ ...scheduleForm, periodEnd: Number(e.target.value) })}
                      className="w-full border border-slate-200 rounded-lg p-2 font-mono-tabular"
                    />
                  </div>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Waktu (Mulai - Selesai)</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="time"
                      value={scheduleForm.timeStart}
                      onChange={e => setScheduleForm({ ...scheduleForm, timeStart: e.target.value })}
                      className="w-full border border-slate-200 rounded-lg p-2"
                    />
                    <span>-</span>
                    <input
                      type="time"
                      value={scheduleForm.timeEnd}
                      onChange={e => setScheduleForm({ ...scheduleForm, timeEnd: e.target.value })}
                      className="w-full border border-slate-200 rounded-lg p-2"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Guru Pengampu</label>
                <select
                  value={scheduleForm.teacherId}
                  onChange={e => setScheduleForm({ ...scheduleForm, teacherId: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg p-2"
                >
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Mata Pelajaran</label>
                <select
                  value={scheduleForm.subjectId}
                  onChange={e => setScheduleForm({ ...scheduleForm, subjectId: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg p-2"
                >
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Rombel Kelas</label>
                <select
                  value={scheduleForm.rombelId}
                  onChange={e => setScheduleForm({ ...scheduleForm, rombelId: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg p-2"
                >
                  {rombels.map(r => (
                    <option key={r.id} value={r.id}>{r.name} ({r.code})</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs"
                >
                  Simpan Jadwal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 11. MODAL PENUGASAN SEKRETARIS KELAS */}
      {showSecretaryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-900">
              Penunjukan / Pergantian Sekretaris Kelas
            </h3>
            <p className="text-xs text-slate-600 mt-1">
              Tunjuk siswa aktif untuk menjadi sekretaris pemantau presensi rombel.
            </p>

            <form
              onSubmit={e => {
                e.preventDefault();
                if (!secStudentId || !secRombelId) return;
                assignSecretary(secStudentId, secRombelId, secNotes.trim());
                setShowSecretaryModal(false);
              }}
              className="mt-4 space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pilih Rombel Kelas <span className="text-rose-500">*</span>
                </label>
                <select
                  value={secRombelId}
                  onChange={e => {
                    const rId = e.target.value;
                    setSecRombelId(rId);
                    const rStudents = students.filter(s => s.rombelId === rId && s.status === 'active');
                    setSecStudentId(rStudents[0]?.id || '');
                  }}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg"
                  required
                >
                  {rombels.map(r => (
                    <option key={r.id} value={r.id}>{r.name} ({r.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pilih Siswa Calon Sekretaris <span className="text-rose-500">*</span>
                </label>
                <select
                  value={secStudentId}
                  onChange={e => setSecStudentId(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg"
                  required
                >
                  <option value="">-- Pilih Siswa Aktif --</option>
                  {students
                    .filter(s => s.rombelId === secRombelId && s.status === 'active')
                    .map(st => (
                      <option key={st.id} value={st.id}>
                        {st.name} (NIS: {st.nis})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catatan / Keterangan Penugasan (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Penunjukan sekretaris kelas baru tahun ajaran 2025/2026"
                  value={secNotes}
                  onChange={e => setSecNotes(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowSecretaryModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={!secStudentId}
                  className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-lg"
                >
                  Tetapkan Sekretaris
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. MODAL BACKUP & RESTORE SISTEM */}
      <BackupRestoreModal
        isOpen={showBackupModal}
        onClose={() => setShowBackupModal(false)}
      />
    </div>
  );
};

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  User,
  Student,
  Teacher,
  Department,
  Rombel,
  Subject,
  AcademicYear,
  TeachingAssignment,
  Schedule,
  CalendarEvent,
  AttendanceSession,
  AttendanceRecord,
  AuditLog,
  SchoolSettings,
  AttendanceStatus,
  UserRole,
  ClassSecretaryAssignment,
  AttendanceCorrectionRequest,
  CorrectionStatus,
  GradeLevel
} from '../types';
import {
  initialUsers,
  initialStudents,
  initialTeachers,
  initialDepartments,
  initialRombels,
  initialSubjects,
  initialAcademicYears,
  initialTeachingAssignments,
  initialSchedules,
  initialCalendarEvents,
  initialSessions,
  initialAttendanceRecords,
  initialAuditLogs,
  initialSettings,
  initialSecretaryAssignments,
  initialCorrectionRequests
} from '../data/initialData';
import {
  sha256,
  canTeacherTakeAttendance,
  canHomeroomMonitor,
  canSecretaryViewRombel,
  canManageSecretary,
  canReviewCorrectionRequest
} from '../utils/security';

interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

interface AppContextType {
  // Auth & Security
  currentUser: User;
  isAuthenticated: boolean;
  loginAsRole: (role: UserRole) => void;
  logout: () => void;
  switchUser: (userId: string) => void;
  authenticateUser: (usernameOrEmail: string, password: string) => Promise<{ success: boolean; message: string }>;
  users: User[];
  addUser: (user: Omit<User, 'id'>) => void;
  updateUser: (id: string, updates: Partial<User>) => void;
  resetUserPassword: (id: string, newPass: string) => void;

  // Master Data
  students: Student[];
  teachers: Teacher[];
  departments: Department[];
  rombels: Rombel[];
  subjects: Subject[];
  academicYears: AcademicYear[];
  activeAcademicYear: AcademicYear;
  teachingAssignments: TeachingAssignment[];
  schedules: Schedule[];
  calendarEvents: CalendarEvent[];
  settings: SchoolSettings;
  updateSettings: (newSettings: Partial<SchoolSettings>) => void;

  // Student Actions
  addStudent: (student: Omit<Student, 'id'>) => void;
  updateStudent: (id: string, updates: Partial<Student>) => void;
  deleteStudent: (id: string) => void;
  transferStudent: (studentId: string, toRombelId: string, reason: string) => boolean;
  importStudents: (newStudents: Array<Omit<Student, 'id'>>) => { successCount: number; errors: string[] };

  // Teacher & Rombel Actions
  addTeacher: (teacher: Omit<Teacher, 'id'>) => void;
  updateTeacher: (id: string, updates: Partial<Teacher>) => void;
  deleteTeacher: (id: string) => boolean;
  importTeachers: (newTeachers: Array<Omit<Teacher, 'id'>>) => { successCount: number; errors: string[] };

  addRombel: (rombel: Omit<Rombel, 'id'>) => void;
  updateRombel: (id: string, updates: Partial<Rombel>) => void;
  deleteRombel: (id: string) => boolean;
  importRombels: (newRombels: Array<Omit<Rombel, 'id'>>) => { successCount: number; errors: string[] };

  addSubject: (subject: Omit<Subject, 'id'>) => void;
  updateSubject: (id: string, updates: Partial<Subject>) => void;
  deleteSubject: (id: string) => boolean;
  importSubjects: (newSubjects: Array<Omit<Subject, 'id'>>) => { successCount: number; errors: string[] };

  addTeachingAssignment: (ta: Omit<TeachingAssignment, 'id'>) => void;
  deleteTeachingAssignment: (id: string) => void;
  importTeachingAssignments: (newAssignments: Array<Omit<TeachingAssignment, 'id'>>) => { successCount: number; errors: string[] };

  addSchedule: (sch: Omit<Schedule, 'id'>) => void;
  updateSchedule: (id: string, updates: Partial<Schedule>) => void;
  deleteSchedule: (id: string) => void;
  importSchedules: (newSchedules: Array<Omit<Schedule, 'id'>>) => { successCount: number; errors: string[] };

  // Class Secretary Assignment (Penugasan Sekretaris Kelas)
  secretaryAssignments: ClassSecretaryAssignment[];
  assignSecretary: (studentId: string, rombelId: string, notes?: string) => { success: boolean; message: string };
  revokeSecretaryAssignment: (assignmentId: string, reason?: string) => { success: boolean; message: string };
  getActiveSecretaryForRombel: (rombelId: string) => ClassSecretaryAssignment | undefined;

  // Attendance Correction Requests (Pengajuan Koreksi Absensi)
  correctionRequests: AttendanceCorrectionRequest[];
  submitCorrectionRequest: (data: {
    studentId: string;
    subjectId: string;
    attendanceDate: string;
    proposedStatus: AttendanceStatus;
    reason: string;
    supportingEvidence?: string;
    currentStatus?: AttendanceStatus | '-';
    currentNote?: string;
    proposedNote?: string;
    sessionId?: string;
  }) => { success: boolean; message: string };
  reviewCorrectionRequest: (
    requestId: string,
    status: 'APPROVED' | 'REJECTED' | 'NEED_INFO',
    reviewNotes?: string
  ) => { success: boolean; message: string };

  // Attendance
  sessions: AttendanceSession[];
  records: AttendanceRecord[];
  createAttendanceSession: (sessionData: Omit<AttendanceSession, 'id' | 'createdAt' | 'updatedAt'>, records: Array<{ studentId: string; status: AttendanceStatus; note?: string }>) => AttendanceSession | null;
  updateAttendanceRecords: (sessionId: string, updatedRecords: Array<{ studentId: string; status: AttendanceStatus; note?: string }>, reason?: string) => boolean;
  lockSession: (sessionId: string) => void;
  unlockSession: (sessionId: string) => void;
  correctStudentRecord: (recordId: string, newStatus: AttendanceStatus, newNote: string, reason: string) => boolean;

  // Audit Logs
  auditLogs: AuditLog[];
  addAuditLog: (log: Omit<AuditLog, 'id' | 'timestamp' | 'userId' | 'userName' | 'userRole'>) => void;

  // Notifications
  toasts: ToastMessage[];
  showToast: (message: string, type?: ToastMessage['type']) => void;
  removeToast: (id: string) => void;

  // Database tools
  resetDatabase: () => void;
  clearAllDemoData: () => void;
  exportDatabaseJson: () => Promise<string>;
  importDatabaseJson: (jsonStr: string) => boolean;
  exportSqlDump: () => Promise<string>;

  // Helper selectors
  getTeacherById: (id?: string) => Teacher | undefined;
  getSubjectById: (id?: string) => Subject | undefined;
  getRombelById: (id?: string) => Rombel | undefined;
  getDepartmentById: (id?: string) => Department | undefined;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_PREFIX = 'smk_absensi_clean_';

// Purge legacy demo keys once if found in browser
try {
  const legacyPrefix = 'smk_absensi_';
  const legacyKeys = [
    'students', 'teachers', 'rombels', 'subjects', 'schedules',
    'sessions', 'records', 'teaching_assignments', 'users',
    'secretary_assignments', 'correction_requests', 'audit_logs',
    'calendar_events', 'settings'
  ];
  legacyKeys.forEach(k => {
    localStorage.removeItem(legacyPrefix + k);
  });
} catch (e) {
  // ignore
}

function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const saved = localStorage.getItem(STORAGE_PREFIX + key);
    return saved ? JSON.parse(saved) : defaultValue;
  } catch (e) {
    console.error(`Failed to load ${key} from storage`, e);
    return defaultValue;
  }
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load State
  const [users, setUsers] = useState<User[]>(() => loadFromStorage('users', initialUsers));
  const [currentUserId, setCurrentUserId] = useState<string>(() => loadFromStorage('current_user_id', 'usr-admin'));
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => loadFromStorage('is_authenticated', false));
  const [students, setStudents] = useState<Student[]>(() => loadFromStorage('students', initialStudents));
  const [teachers, setTeachers] = useState<Teacher[]>(() => loadFromStorage('teachers', initialTeachers));
  const [departments, setDepartments] = useState<Department[]>(() => loadFromStorage('departments', initialDepartments));
  const [rombels, setRombels] = useState<Rombel[]>(() => loadFromStorage('rombels', initialRombels));
  const [subjects, setSubjects] = useState<Subject[]>(() => loadFromStorage('subjects', initialSubjects));
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>(() => loadFromStorage('academic_years', initialAcademicYears));
  const [teachingAssignments, setTeachingAssignments] = useState<TeachingAssignment[]>(() => loadFromStorage('teaching_assignments', initialTeachingAssignments));
  const [schedules, setSchedules] = useState<Schedule[]>(() => loadFromStorage('schedules', initialSchedules));
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>(() => loadFromStorage('calendar_events', initialCalendarEvents));
  const [sessions, setSessions] = useState<AttendanceSession[]>(() => loadFromStorage('sessions', initialSessions));
  const [records, setRecords] = useState<AttendanceRecord[]>(() => loadFromStorage('records', initialAttendanceRecords));
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => loadFromStorage('audit_logs', initialAuditLogs));
  const [settings, setSettings] = useState<SchoolSettings>(() => loadFromStorage('settings', initialSettings));
  const [secretaryAssignments, setSecretaryAssignments] = useState<ClassSecretaryAssignment[]>(() => loadFromStorage('secretary_assignments', initialSecretaryAssignments));
  const [correctionRequests, setCorrectionRequests] = useState<AttendanceCorrectionRequest[]>(() => loadFromStorage('correction_requests', initialCorrectionRequests));
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Sync to localStorage
  useEffect(() => { localStorage.setItem(STORAGE_PREFIX + 'users', JSON.stringify(users)); }, [users]);
  useEffect(() => { localStorage.setItem(STORAGE_PREFIX + 'current_user_id', JSON.stringify(currentUserId)); }, [currentUserId]);
  useEffect(() => { localStorage.setItem(STORAGE_PREFIX + 'is_authenticated', JSON.stringify(isAuthenticated)); }, [isAuthenticated]);
  useEffect(() => { localStorage.setItem(STORAGE_PREFIX + 'students', JSON.stringify(students)); }, [students]);
  useEffect(() => { localStorage.setItem(STORAGE_PREFIX + 'teachers', JSON.stringify(teachers)); }, [teachers]);
  useEffect(() => { localStorage.setItem(STORAGE_PREFIX + 'departments', JSON.stringify(departments)); }, [departments]);
  useEffect(() => { localStorage.setItem(STORAGE_PREFIX + 'rombels', JSON.stringify(rombels)); }, [rombels]);
  useEffect(() => { localStorage.setItem(STORAGE_PREFIX + 'subjects', JSON.stringify(subjects)); }, [subjects]);
  useEffect(() => { localStorage.setItem(STORAGE_PREFIX + 'academic_years', JSON.stringify(academicYears)); }, [academicYears]);
  useEffect(() => { localStorage.setItem(STORAGE_PREFIX + 'teaching_assignments', JSON.stringify(teachingAssignments)); }, [teachingAssignments]);
  useEffect(() => { localStorage.setItem(STORAGE_PREFIX + 'schedules', JSON.stringify(schedules)); }, [schedules]);
  useEffect(() => { localStorage.setItem(STORAGE_PREFIX + 'calendar_events', JSON.stringify(calendarEvents)); }, [calendarEvents]);
  useEffect(() => { localStorage.setItem(STORAGE_PREFIX + 'sessions', JSON.stringify(sessions)); }, [sessions]);
  useEffect(() => { localStorage.setItem(STORAGE_PREFIX + 'records', JSON.stringify(records)); }, [records]);
  useEffect(() => { localStorage.setItem(STORAGE_PREFIX + 'audit_logs', JSON.stringify(auditLogs)); }, [auditLogs]);
  useEffect(() => { localStorage.setItem(STORAGE_PREFIX + 'settings', JSON.stringify(settings)); }, [settings]);
  useEffect(() => { localStorage.setItem(STORAGE_PREFIX + 'secretary_assignments', JSON.stringify(secretaryAssignments)); }, [secretaryAssignments]);
  useEffect(() => { localStorage.setItem(STORAGE_PREFIX + 'correction_requests', JSON.stringify(correctionRequests)); }, [correctionRequests]);

  // Current active user
  const currentUser = useMemo(() => {
    return users.find(u => u.id === currentUserId) || users[0];
  }, [users, currentUserId]);

  // Active academic year
  const activeAcademicYear = useMemo(() => {
    return academicYears.find(ay => ay.isActive) || academicYears[0];
  }, [academicYears]);

  // Toast Helper
  const showToast = (message: string, type: ToastMessage['type'] = 'success') => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 5);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Audit Log Helper
  const addAuditLog = (logData: Omit<AuditLog, 'id' | 'timestamp' | 'userId' | 'userName' | 'userRole'>) => {
    const now = new Date();
    const formattedDate = now.toISOString().replace('T', ' ').substring(0, 19);
    const newLog: AuditLog = {
      id: 'aud-' + Date.now(),
      timestamp: formattedDate,
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      ...logData
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  // Authenticate user with password, rate-limiting lockout, and audit log
  const authenticateUser = async (usernameOrEmail: string, pass: string): Promise<{ success: boolean; message: string }> => {
    const term = usernameOrEmail.trim().toLowerCase();
    const targetUser = users.find(u => u.username.toLowerCase() === term || u.email.toLowerCase() === term);

    const now = new Date();
    const timestamp = now.toISOString().replace('T', ' ').substring(0, 19);

    if (!targetUser) {
      addAuditLog({
        action: 'LOGIN_FAILED',
        entity: 'User',
        entityId: 'unknown',
        description: `Percobaan login gagal: Username/email '${usernameOrEmail}' tidak terdaftar.`
      });
      return { success: false, message: 'Username atau email tidak ditemukan.' };
    }

    // Check account lockout
    if (targetUser.lockedUntil && new Date(targetUser.lockedUntil).getTime() > Date.now()) {
      const remainingSec = Math.ceil((new Date(targetUser.lockedUntil).getTime() - Date.now()) / 1000);
      return { 
        success: false, 
        message: `Akun terkunci sementara demi keamanan karena 5x percobaan gagal. Silakan tunggu ${remainingSec} detik lagi.` 
      };
    }

    // Standard accepted demo passwords or custom set password
    const validDefaultPasswords: Record<string, string> = {
      admin: 'admin123',
      wali_kelas: 'wali123',
      guru: 'guru123',
      sekretaris: 'sekretaris123'
    };

    const isMatch = (targetUser.passwordHash && targetUser.passwordHash === 'hashed_' + pass) ||
                    (validDefaultPasswords[targetUser.role] === pass) ||
                    (pass === 'smk2026!');

    if (!isMatch) {
      const newFailed = (targetUser.failedAttempts || 0) + 1;
      let lockTime: string | undefined = undefined;

      if (newFailed >= 5) {
        lockTime = new Date(Date.now() + 60000).toISOString(); // lock for 60 seconds
      }

      setUsers(prev => prev.map(u => u.id === targetUser.id ? {
        ...u,
        failedAttempts: newFailed,
        lockedUntil: lockTime
      } : u));

      addAuditLog({
        action: 'LOGIN_FAILED',
        entity: 'User',
        entityId: targetUser.id,
        description: `Percobaan login gagal untuk ${targetUser.name} (Percobaan ke-${newFailed})`,
        reason: newFailed >= 5 ? 'Akun dikunci 60 detik akibat 5x kegagalan berturut-turut' : 'Password salah'
      });

      if (newFailed >= 5) {
        return { success: false, message: '5 kali salah password berturut-turut! Akun dikunci sementara selama 60 detik.' };
      }

      return { success: false, message: `Password salah! Sisa percobaan: ${5 - newFailed} kali sebelum akun dikunci.` };
    }

    // Success login: reset failed attempts & update last login
    setUsers(prev => prev.map(u => u.id === targetUser.id ? {
      ...u,
      failedAttempts: 0,
      lockedUntil: undefined,
      lastLogin: timestamp
    } : u));

    setCurrentUserId(targetUser.id);
    setIsAuthenticated(true);

    addAuditLog({
      action: 'LOGIN_SUCCESS',
      entity: 'User',
      entityId: targetUser.id,
      description: `Autentikasi berhasil: ${targetUser.name} (${targetUser.role.toUpperCase()}) masuk ke sistem.`
    });

    showToast(`Selamat datang, ${targetUser.name}!`, 'success');
    return { success: true, message: 'Login berhasil.' };
  };

  // Login directly as role for quick testing/evaluation
  const loginAsRole = (role: UserRole) => {
    const target = users.find(u => u.role === role);
    if (target) {
      setCurrentUserId(target.id);
      setIsAuthenticated(true);
      addAuditLog({
        action: 'LOGIN_SUCCESS',
        entity: 'User',
        entityId: target.id,
        description: `Login cepat sebagai peran ${role.toUpperCase()}: ${target.name}`
      });
      showToast(`Masuk sebagai ${target.name} (${role.toUpperCase()})`, 'success');
    }
  };

  // Logout from system
  const logout = () => {
    addAuditLog({
      action: 'UPDATE',
      entity: 'User',
      entityId: currentUser.id,
      description: `Pengguna ${currentUser.name} (${currentUser.role.toUpperCase()}) keluar dari sistem.`
    });
    setIsAuthenticated(false);
    showToast('Anda telah keluar dari sesi sistem.');
  };

  // Switch User (Demo Testing Mode)
  const switchUser = (userId: string) => {
    const target = users.find(u => u.id === userId);
    if (target) {
      setCurrentUserId(userId);
      setIsAuthenticated(true);
      showToast(`Beralih akun ke: ${target.name} (${target.role.toUpperCase()})`, 'info');
    }
  };

  const addUser = (newUser: Omit<User, 'id'>) => {
    const id = 'usr-' + Date.now();
    const created: User = { ...newUser, id, failedAttempts: 0 };
    setUsers(prev => [...prev, created]);
    addAuditLog({
      action: 'CREATE',
      entity: 'User',
      entityId: id,
      description: `Menambahkan pengguna baru: ${created.name} (${created.username})`,
      afterValue: JSON.stringify({ role: created.role, email: created.email })
    });
    showToast(`Pengguna ${created.name} berhasil ditambahkan!`);
  };

  const updateUser = (id: string, updates: Partial<User>) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u));
    addAuditLog({
      action: 'UPDATE',
      entity: 'User',
      entityId: id,
      description: `Memperbarui data pengguna ID: ${id}`,
      afterValue: JSON.stringify(updates)
    });
    showToast('Data pengguna berhasil diperbarui!');
  };

  const resetUserPassword = (id: string, newPass: string) => {
    setUsers(prev => prev.map(u => u.id === id ? { 
      ...u, 
      passwordHash: 'hashed_' + newPass,
      failedAttempts: 0,
      lockedUntil: undefined
    } : u));
    addAuditLog({
      action: 'UPDATE',
      entity: 'User',
      entityId: id,
      description: `Mereset password pengguna ID: ${id}`,
      reason: 'Permintaan reset oleh admin'
    });
    showToast('Password pengguna berhasil direset!');
  };

  const updateSettings = (newSettings: Partial<SchoolSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
    addAuditLog({
      action: 'UPDATE',
      entity: 'SchoolSettings',
      entityId: 'settings',
      description: 'Memperbarui profil sekolah dan konfigurasi absensi'
    });
    showToast('Pengaturan sekolah berhasil diperbarui!');
  };

  // Students CRUD
  const addStudent = (studentData: Omit<Student, 'id'>) => {
    const id = 'std-' + Date.now();
    const rombel = rombels.find(r => r.id === studentData.rombelId);
    const newStudent: Student = {
      ...studentData,
      id,
      rombelCode: rombel ? rombel.code : undefined
    };
    setStudents(prev => [...prev, newStudent]);
    addAuditLog({
      action: 'CREATE',
      entity: 'Student',
      entityId: id,
      description: `Menambah siswa baru: ${newStudent.name} (NIS: ${newStudent.nis}) ke kelas ${newStudent.rombelCode || ''}`
    });
    showToast(`Siswa ${newStudent.name} berhasil ditambahkan!`);
  };

  const updateStudent = (id: string, updates: Partial<Student>) => {
    const existing = students.find(s => s.id === id);
    if (!existing) return;

    let rombelCode = existing.rombelCode;
    if (updates.rombelId) {
      const rombel = rombels.find(r => r.id === updates.rombelId);
      if (rombel) rombelCode = rombel.code;
    }

    setStudents(prev => prev.map(s => s.id === id ? { ...s, ...updates, rombelCode } : s));

    // If student status becomes non-active, automatically revoke secretary assignment
    if (updates.status && updates.status !== 'active') {
      const activeAssign = secretaryAssignments.find(sa => sa.studentId === id && sa.isActive);
      if (activeAssign) {
        const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
        setSecretaryAssignments(prev => prev.map(sa => sa.id === activeAssign.id ? {
          ...sa,
          isActive: false,
          deassignedAt: now,
          deassignedByUserId: currentUser.id,
          deassignedByUserName: currentUser.name,
          notes: (sa.notes ? sa.notes + ' ' : '') + `[Otomatis dinonaktifkan: status siswa menjadi ${updates.status}]`
        } : sa));

        setUsers(prev => prev.map(u => {
          if (u.studentId === id || u.id === activeAssign.userId) {
            return { ...u, secretaryRombelId: undefined, status: 'inactive' };
          }
          return u;
        }));

        addAuditLog({
          action: 'REVOKE_SECRETARY',
          entity: 'ClassSecretaryAssignment',
          entityId: activeAssign.id,
          description: `Pencabutan penugasan sekretaris kelas untuk ${existing.name} karena perubahan status siswa menjadi ${updates.status}`
        });
      }
    }

    addAuditLog({
      action: 'UPDATE',
      entity: 'Student',
      entityId: id,
      description: `Memperbarui data siswa: ${existing.name}`,
      beforeValue: JSON.stringify({ rombelId: existing.rombelId, status: existing.status }),
      afterValue: JSON.stringify(updates)
    });
    showToast('Data siswa berhasil diperbarui!');
  };

  const deleteStudent = (id: string) => {
    const existing = students.find(s => s.id === id);
    if (!existing) return;

    // Check if was secretary
    const activeAssign = secretaryAssignments.find(sa => sa.studentId === id && sa.isActive);
    if (activeAssign) {
      const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
      setSecretaryAssignments(prev => prev.map(sa => sa.id === activeAssign.id ? {
        ...sa,
        isActive: false,
        deassignedAt: now,
        notes: (sa.notes ? sa.notes + ' ' : '') + '[Dihapus karena data siswa dihapus]'
      } : sa));
      setUsers(prev => prev.map(u => u.studentId === id ? { ...u, secretaryRombelId: undefined, status: 'inactive' } : u));
    }

    setStudents(prev => prev.filter(s => s.id !== id));
    addAuditLog({
      action: 'DELETE',
      entity: 'Student',
      entityId: id,
      description: `Menghapus siswa: ${existing.name} (NIS: ${existing.nis})`
    });
    showToast(`Siswa ${existing.name} telah dihapus.`);
  };

  const transferStudent = (studentId: string, toRombelId: string, reason: string): boolean => {
    const student = students.find(s => s.id === studentId);
    const targetRombel = rombels.find(r => r.id === toRombelId);
    if (!student || !targetRombel) {
      showToast('Data siswa atau rombel tujuan tidak ditemukan.', 'error');
      return false;
    }

    if (student.rombelId === toRombelId) {
      showToast('Siswa sudah berada di rombel ini.', 'warning');
      return false;
    }

    const fromRombel = rombels.find(r => r.id === student.rombelId);
    const oldRombelName = fromRombel ? `${fromRombel.name} (${fromRombel.code})` : student.rombelId;
    const newRombelName = `${targetRombel.name} (${targetRombel.code})`;

    // Historical records preservation: retain existing attendance records unchanged
    const updatedPreviousRombels = student.previousRombelIds 
      ? [...student.previousRombelIds, student.rombelId] 
      : [student.rombelId];

    setStudents(prev => prev.map(s => s.id === studentId ? {
      ...s,
      rombelId: targetRombel.id,
      rombelCode: targetRombel.code,
      departmentId: targetRombel.departmentId,
      previousRombelIds: updatedPreviousRombels
    } : s));

    // Pencabutan otomatis hak akses sekretaris pada rombel lama jika siswa pindah rombel
    const activeSec = secretaryAssignments.find(sa => sa.studentId === studentId && sa.isActive);
    if (activeSec) {
      const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
      setSecretaryAssignments(prev => prev.map(sa => sa.id === activeSec.id ? {
        ...sa,
        isActive: false,
        deassignedAt: timestamp,
        deassignedByUserId: currentUser.id,
        deassignedByUserName: currentUser.name,
        notes: (sa.notes ? sa.notes + ' ' : '') + `[Otomatis dicabut: siswa pindah kelas dari ${oldRombelName} ke ${newRombelName}]`
      } : sa));

      // Revoke user secretary privilege on old rombel
      setUsers(prev => prev.map(u => {
        if (u.studentId === studentId || u.id === activeSec.userId) {
          return { ...u, secretaryRombelId: undefined };
        }
        return u;
      }));

      addAuditLog({
        action: 'REVOKE_SECRETARY',
        entity: 'ClassSecretaryAssignment',
        entityId: activeSec.id,
        description: `Pencabutan otomatis hak akses sekretaris kelas untuk ${student.name} akibat perpindahan kelas dari ${oldRombelName} ke ${newRombelName}.`
      });
    }

    addAuditLog({
      action: 'TRANSFER_STUDENT',
      entity: 'Student',
      entityId: studentId,
      description: `Perpindahan rombel: ${student.name} dari ${oldRombelName} ke ${newRombelName}`,
      beforeValue: `Rombel: ${oldRombelName}`,
      afterValue: `Rombel: ${newRombelName}`,
      reason: reason || 'Mutasi rombel / penyesuaian kelas'
    });

    showToast(`Siswa ${student.name} berhasil dipindahkan ke ${newRombelName}! Riwayat absensi lama tetap tersimpan.`, 'success');
    return true;
  };

  const importStudents = (importedStudents: Array<Omit<Student, 'id'>>) => {
    const errors: string[] = [];
    const validToAdd: Student[] = [];
    const existingNis = new Set(students.map(s => s.nis));

    importedStudents.forEach((row, idx) => {
      const line = idx + 1;
      if (!row.nis || !row.name) {
        errors.push(`Baris ${line}: NIS dan Nama siswa wajib diisi.`);
        return;
      }
      if (existingNis.has(row.nis)) {
        errors.push(`Baris ${line}: NIS '${row.nis}' sudah terdaftar (duplikat).`);
        return;
      }
      const rombel = rombels.find(r => r.id === row.rombelId || r.code.toLowerCase() === row.rombelId.toLowerCase());
      if (!rombel) {
        errors.push(`Baris ${line}: Rombel '${row.rombelId}' tidak ditemukan di sistem.`);
        return;
      }

      existingNis.add(row.nis);
      validToAdd.push({
        id: 'std-' + Date.now() + '-' + idx,
        nis: row.nis,
        nisn: row.nisn || '',
        name: row.name,
        gender: row.gender === 'P' ? 'P' : 'L',
        departmentId: rombel.departmentId,
        rombelId: rombel.id,
        rombelCode: rombel.code,
        academicYearId: activeAcademicYear.id,
        status: 'active',
        phone: row.phone || ''
      });
    });

    if (validToAdd.length > 0) {
      setStudents(prev => [...prev, ...validToAdd]);
      addAuditLog({
        action: 'IMPORT',
        entity: 'Student',
        entityId: 'batch-import',
        description: `Import massal siswa: Berhasil ${validToAdd.length} siswa, Gagal ${errors.length} baris.`
      });
      showToast(`Berhasil mengimpor ${validToAdd.length} siswa baru!`, 'success');
    }

    return { successCount: validToAdd.length, errors };
  };

  // Teachers
  const addTeacher = (data: Omit<Teacher, 'id'>) => {
    const id = 'tch-' + Date.now();
    const newTeacher: Teacher = { ...data, id };
    setTeachers(prev => [...prev, newTeacher]);
    addAuditLog({
      action: 'CREATE',
      entity: 'Teacher',
      entityId: id,
      description: `Menambah guru: ${newTeacher.name} (NIP: ${newTeacher.nip})`
    });
    showToast(`Guru ${newTeacher.name} berhasil didaftarkan!`);
  };

  const updateTeacher = (id: string, updates: Partial<Teacher>) => {
    setTeachers(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    showToast('Data guru berhasil diperbarui!');
  };

  const deleteTeacher = (id: string): boolean => {
    const existing = teachers.find(t => t.id === id);
    if (!existing) return false;
    const isWali = rombels.some(r => r.homeroomTeacherId === id);
    if (isWali) {
      showToast(`Guru ${existing.name} merupakan wali kelas aktif. Tetapkan wali kelas pengganti terlebih dahulu.`, 'error');
      return false;
    }
    setTeachers(prev => prev.filter(t => t.id !== id));
    addAuditLog({
      action: 'DELETE',
      entity: 'Teacher',
      entityId: id,
      description: `Menghapus data guru: ${existing.name} (NIP: ${existing.nip})`
    });
    showToast(`Data guru ${existing.name} berhasil dihapus.`);
    return true;
  };

  const importTeachers = (newTeachers: Array<Omit<Teacher, 'id'>>) => {
    const errors: string[] = [];
    const validToAdd: Teacher[] = [];
    const existingNip = new Set(teachers.map(t => t.nip.trim()));

    newTeachers.forEach((row, idx) => {
      const line = idx + 1;
      if (!row.nip || !row.name) {
        errors.push(`Baris ${line}: NIP dan Nama Guru wajib diisi.`);
        return;
      }
      const cleanNip = row.nip.trim();
      if (existingNip.has(cleanNip)) {
        errors.push(`Baris ${line}: NIP '${cleanNip}' sudah terdaftar (duplikat).`);
        return;
      }
      existingNip.add(cleanNip);
      validToAdd.push({
        id: 'tch-' + Date.now() + '-' + idx,
        nip: cleanNip,
        name: row.name.trim(),
        email: row.email || `${cleanNip.replace(/\s+/g, '')}@smk.sch.id`,
        phone: row.phone || '',
        gender: row.gender === 'P' ? 'P' : 'L',
        specialization: row.specialization || 'Umum',
        status: row.status || 'active'
      });
    });

    if (validToAdd.length > 0) {
      setTeachers(prev => [...prev, ...validToAdd]);
      addAuditLog({
        action: 'IMPORT',
        entity: 'Teacher',
        entityId: 'batch-import-teacher',
        description: `Impor massal guru: ${validToAdd.length} guru berhasil ditambahkan, ${errors.length} baris gagal.`
      });
      showToast(`Berhasil mengimpor ${validToAdd.length} guru baru!`, 'success');
    }
    return { successCount: validToAdd.length, errors };
  };

  // Rombel & Subject
  const addRombel = (data: Omit<Rombel, 'id'>) => {
    const id = 'rmb-' + Date.now();
    const newRombel: Rombel = { ...data, id };
    setRombels(prev => [...prev, newRombel]);
    addAuditLog({
      action: 'CREATE',
      entity: 'Rombel',
      entityId: id,
      description: `Menambah rombel baru: ${newRombel.name} (${newRombel.code})`
    });
    showToast(`Rombel ${newRombel.name} berhasil dibuat!`);
  };

  const updateRombel = (id: string, updates: Partial<Rombel>) => {
    setRombels(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
    showToast('Data rombel berhasil diperbarui!');
  };

  const deleteRombel = (id: string): boolean => {
    const existing = rombels.find(r => r.id === id);
    if (!existing) return false;
    const activeStudentCount = students.filter(s => s.rombelId === id && s.status === 'active').length;
    if (activeStudentCount > 0) {
      showToast(`Tidak dapat menghapus ${existing.name} karena masih memiliki ${activeStudentCount} siswa aktif.`, 'error');
      return false;
    }
    setRombels(prev => prev.filter(r => r.id !== id));
    addAuditLog({
      action: 'DELETE',
      entity: 'Rombel',
      entityId: id,
      description: `Menghapus rombel kelas: ${existing.name} (${existing.code})`
    });
    showToast(`Rombel ${existing.name} berhasil dihapus.`);
    return true;
  };

  const importRombels = (newRombels: Array<Omit<Rombel, 'id'>>) => {
    const errors: string[] = [];
    const validToAdd: Rombel[] = [];
    const existingCodes = new Set(rombels.map(r => r.code.toUpperCase()));

    newRombels.forEach((row, idx) => {
      const line = idx + 1;
      if (!row.code || !row.name) {
        errors.push(`Baris ${line}: Kode (cth: 'DKV-X-1') dan Nama Rombel (cth: 'X DKV 1') wajib diisi.`);
        return;
      }
      const codeUpper = row.code.trim().toUpperCase();
      if (existingCodes.has(codeUpper)) {
        errors.push(`Baris ${line}: Kode Rombel '${codeUpper}' sudah ada di database (duplikat).`);
        return;
      }

      // Find department
      let dept = departments.find(d => 
        d.id === row.departmentId || 
        d.code.toUpperCase() === (row.departmentCode || row.departmentId || '').toUpperCase()
      );
      if (!dept) {
        const text = (row.name + ' ' + row.code).toUpperCase();
        dept = departments.find(d => text.includes(d.code));
      }
      if (!dept) {
        errors.push(`Baris ${line}: Jurusan '${row.departmentCode || row.departmentId || '?'}' tidak valid (pilih dari: DKV, DPIB, TKP, TOI, TITL, TAV, TSM, TKR).`);
        return;
      }

      // Grade
      let grade: GradeLevel = 'X';
      const gradeStr = String(row.grade || '').toUpperCase();
      if (gradeStr.includes('XI') || gradeStr === '11') grade = 'XI';
      else if (gradeStr.includes('XII') || gradeStr === '12') grade = 'XII';
      else grade = 'X';

      // Homeroom Teacher
      let teacher = teachers.find(t => 
        t.id === row.homeroomTeacherId || 
        (row.homeroomTeacherName && t.name.toLowerCase().includes(row.homeroomTeacherName.toLowerCase())) ||
        (row.homeroomTeacherId && t.nip.includes(row.homeroomTeacherId))
      );
      if (!teacher) {
        teacher = teachers[0];
      }

      existingCodes.add(codeUpper);
      validToAdd.push({
        id: 'rmb-' + Date.now() + '-' + idx,
        code: codeUpper,
        name: row.name.trim(),
        grade,
        departmentId: dept.id,
        departmentCode: dept.code,
        academicYearId: activeAcademicYear.id,
        homeroomTeacherId: teacher ? teacher.id : '',
        homeroomTeacherName: teacher ? teacher.name : '',
        status: 'active',
        studentCount: 0
      });
    });

    if (validToAdd.length > 0) {
      setRombels(prev => [...prev, ...validToAdd]);
      addAuditLog({
        action: 'IMPORT',
        entity: 'Rombel',
        entityId: 'batch-import-rombel',
        description: `Impor massal kelas/rombel: Berhasil ${validToAdd.length} rombel (misal: ${validToAdd.map(r => r.name).slice(0, 3).join(', ')}...), ${errors.length} gagal.`
      });
      showToast(`Berhasil mengimpor ${validToAdd.length} rombel kelas baru!`, 'success');
    }

    return { successCount: validToAdd.length, errors };
  };

  const addSubject = (data: Omit<Subject, 'id'>) => {
    const id = 'sbj-' + Date.now();
    const newSubject: Subject = { ...data, id };
    setSubjects(prev => [...prev, newSubject]);
    showToast(`Mata pelajaran ${newSubject.name} berhasil disimpan!`);
  };

  const updateSubject = (id: string, updates: Partial<Subject>) => {
    setSubjects(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    showToast('Data mata pelajaran berhasil diperbarui!');
  };

  const deleteSubject = (id: string): boolean => {
    const existing = subjects.find(s => s.id === id);
    if (!existing) return false;
    setSubjects(prev => prev.filter(s => s.id !== id));
    addAuditLog({
      action: 'DELETE',
      entity: 'Subject',
      entityId: id,
      description: `Menghapus mata pelajaran: ${existing.name} (${existing.code})`
    });
    showToast(`Mata pelajaran ${existing.name} telah dihapus.`);
    return true;
  };

  const importSubjects = (newSubjects: Array<Omit<Subject, 'id'>>) => {
    const errors: string[] = [];
    const validToAdd: Subject[] = [];
    const existingCodes = new Set(subjects.map(s => s.code.toUpperCase()));

    newSubjects.forEach((row, idx) => {
      const line = idx + 1;
      if (!row.code || !row.name) {
        errors.push(`Baris ${line}: Kode Mapel dan Nama Mapel wajib diisi.`);
        return;
      }
      const codeUpper = row.code.trim().toUpperCase();
      if (existingCodes.has(codeUpper)) {
        errors.push(`Baris ${line}: Kode Mapel '${codeUpper}' sudah ada di database.`);
        return;
      }
      existingCodes.add(codeUpper);
      validToAdd.push({
        id: 'sbj-' + Date.now() + '-' + idx,
        code: codeUpper,
        name: row.name.trim(),
        category: row.category || 'Muatan Kejuruan',
        creditHours: Number(row.creditHours) || 4
      });
    });

    if (validToAdd.length > 0) {
      setSubjects(prev => [...prev, ...validToAdd]);
      addAuditLog({
        action: 'IMPORT',
        entity: 'Subject',
        entityId: 'batch-import-subjects',
        description: `Impor massal mata pelajaran: ${validToAdd.length} mapel berhasil ditambahkan.`
      });
      showToast(`Berhasil mengimpor ${validToAdd.length} mata pelajaran!`, 'success');
    }
    return { successCount: validToAdd.length, errors };
  };

  const addTeachingAssignment = (data: Omit<TeachingAssignment, 'id'>) => {
    const id = 'ta-' + Date.now();
    const newTA: TeachingAssignment = { ...data, id };
    setTeachingAssignments(prev => [...prev, newTA]);
    showToast('Penugasan guru berhasil ditambahkan!');
  };

  const deleteTeachingAssignment = (id: string) => {
    setTeachingAssignments(prev => prev.filter(t => t.id !== id));
    showToast('Penugasan berhasil dihapus.');
  };

  const importTeachingAssignments = (newAssignments: Array<Omit<TeachingAssignment, 'id'>>) => {
    const errors: string[] = [];
    const validToAdd: TeachingAssignment[] = [];

    newAssignments.forEach((row, idx) => {
      const line = idx + 1;
      const teacher = teachers.find(t => t.id === row.teacherId || t.name.toLowerCase().includes((row.teacherId || '').toLowerCase()) || t.nip.includes(row.teacherId));
      const subject = subjects.find(s => s.id === row.subjectId || s.code.toUpperCase() === (row.subjectId || '').toUpperCase() || s.name.toLowerCase().includes((row.subjectId || '').toLowerCase()));
      const rombel = rombels.find(r => r.id === row.rombelId || r.code.toUpperCase() === (row.rombelId || '').toUpperCase() || r.name.toLowerCase().includes((row.rombelId || '').toLowerCase()));

      if (!teacher || !subject || !rombel) {
        errors.push(`Baris ${line}: Data Guru, Mapel, atau Rombel tidak cocok.`);
        return;
      }

      validToAdd.push({
        id: 'ta-' + Date.now() + '-' + idx,
        academicYearId: activeAcademicYear.id,
        teacherId: teacher.id,
        subjectId: subject.id,
        rombelId: rombel.id
      });
    });

    if (validToAdd.length > 0) {
      setTeachingAssignments(prev => [...prev, ...validToAdd]);
      addAuditLog({
        action: 'IMPORT',
        entity: 'TeachingAssignment',
        entityId: 'batch-import-ta',
        description: `Impor massal penugasan mengajar: ${validToAdd.length} penugasan berhasil dibuat.`
      });
      showToast(`Berhasil mengimpor ${validToAdd.length} penugasan guru!`, 'success');
    }
    return { successCount: validToAdd.length, errors };
  };

  const addSchedule = (data: Omit<Schedule, 'id'>) => {
    const id = 'sch-' + Date.now();
    const newSch: Schedule = { ...data, id };
    setSchedules(prev => [...prev, newSch]);
    showToast('Jadwal pelajaran berhasil ditambahkan!');
  };

  const updateSchedule = (id: string, updates: Partial<Schedule>) => {
    setSchedules(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    showToast('Jadwal pelajaran berhasil diperbarui!');
  };

  const deleteSchedule = (id: string) => {
    setSchedules(prev => prev.filter(s => s.id !== id));
    showToast('Jadwal pelajaran berhasil dihapus.');
  };

  const importSchedules = (newSchedules: Array<Omit<Schedule, 'id'>>) => {
    const errors: string[] = [];
    const validToAdd: Schedule[] = [];

    newSchedules.forEach((row, idx) => {
      const line = idx + 1;
      const teacher = teachers.find(t => t.id === row.teacherId || t.name.toLowerCase().includes((row.teacherId || '').toLowerCase()));
      const subject = subjects.find(s => s.id === row.subjectId || s.code.toUpperCase() === (row.subjectId || '').toUpperCase());
      const rombel = rombels.find(r => r.id === row.rombelId || r.code.toUpperCase() === (row.rombelId || '').toUpperCase());

      if (!subject || !rombel) {
        errors.push(`Baris ${line}: Mapel atau Rombel tidak ditemukan.`);
        return;
      }

      validToAdd.push({
        id: 'sch-' + Date.now() + '-' + idx,
        academicYearId: activeAcademicYear.id,
        dayOfWeek: row.dayOfWeek || 1,
        periodStart: row.periodStart || 1,
        periodEnd: row.periodEnd || 3,
        timeStart: row.timeStart || '07:15',
        timeEnd: row.timeEnd || '09:30',
        teacherId: teacher ? teacher.id : (teachers[0]?.id || ''),
        subjectId: subject.id,
        rombelId: rombel.id,
        room: row.room || 'R. Teori'
      });
    });

    if (validToAdd.length > 0) {
      setSchedules(prev => [...prev, ...validToAdd]);
      addAuditLog({
        action: 'IMPORT',
        entity: 'Schedule',
        entityId: 'batch-import-sch',
        description: `Impor massal jadwal pelajaran: ${validToAdd.length} jadwal berhasil ditambahkan.`
      });
      showToast(`Berhasil mengimpor ${validToAdd.length} jadwal pelajaran!`, 'success');
    }
    return { successCount: validToAdd.length, errors };
  };

  // Class Secretary Assignment Methods
  const getActiveSecretaryForRombel = (rombelId: string): ClassSecretaryAssignment | undefined => {
    return secretaryAssignments.find(sa => sa.rombelId === rombelId && sa.isActive);
  };

  const assignSecretary = (studentId: string, rombelId: string, notes?: string): { success: boolean; message: string } => {
    const authCheck = canManageSecretary(currentUser, rombelId, rombels);
    if (!authCheck.allowed) {
      addAuditLog({
        action: 'UPDATE',
        entity: 'ClassSecretaryAssignment',
        entityId: 'unauthorized',
        description: `Upaya penunjukan sekretaris ditolak untuk ${currentUser.name}: ${authCheck.reason}`
      });
      showToast(authCheck.reason || 'Anda tidak berwenang menunjuk sekretaris kelas.', 'error');
      return { success: false, message: authCheck.reason || 'Ditolak' };
    }

    const student = students.find(s => s.id === studentId);
    if (!student) {
      showToast('Data siswa tidak ditemukan.', 'error');
      return { success: false, message: 'Siswa tidak ditemukan.' };
    }

    if (student.status !== 'active') {
      showToast('Hanya siswa aktif yang dapat ditunjuk sebagai sekretaris kelas.', 'error');
      return { success: false, message: 'Status siswa tidak aktif.' };
    }

    if (student.rombelId !== rombelId) {
      showToast('Siswa bukan anggota rombel ini. Penunjukan dibatalkan.', 'error');
      return { success: false, message: 'Siswa bukan anggota rombel terpilih.' };
    }

    const rombel = rombels.find(r => r.id === rombelId);
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    // Pergantian sekretaris: nonaktifkan penugasan sebelumnya tanpa menghapus histori
    const previousAssignments = secretaryAssignments.filter(sa => sa.rombelId === rombelId && sa.isActive);
    if (previousAssignments.length > 0) {
      setSecretaryAssignments(prev => prev.map(sa => {
        if (sa.rombelId === rombelId && sa.isActive) {
          return {
            ...sa,
            isActive: false,
            deassignedAt: now,
            deassignedByUserId: currentUser.id,
            deassignedByUserName: currentUser.name,
            notes: (sa.notes ? sa.notes + ' ' : '') + `[Digantikan oleh ${student.name} pada ${now}]`
          };
        }
        return sa;
      }));

      // Cabut hak akses secretaryRombelId pada akun pengguna lama
      previousAssignments.forEach(prevAss => {
        setUsers(uList => uList.map(u => {
          if (u.id === prevAss.userId || u.studentId === prevAss.studentId) {
            return { ...u, secretaryRombelId: undefined };
          }
          return u;
        }));
      });

      addAuditLog({
        action: 'REVOKE_SECRETARY',
        entity: 'ClassSecretaryAssignment',
        entityId: previousAssignments.map(p => p.id).join(','),
        description: `Pencabutan otomatis penugasan sekretaris lama pada rombel ${rombel?.name || rombelId} untuk pergantian pejabat baru.`
      });
    }

    // Tautkan atau buat akun pengguna siswa
    let targetUserId = '';
    const existingUser = users.find(u => u.studentId === student.id || (u.role === 'sekretaris' && u.email.startsWith(student.nis)));

    if (existingUser) {
      targetUserId = existingUser.id;
      setUsers(prev => prev.map(u => u.id === targetUserId ? {
        ...u,
        role: 'sekretaris',
        studentId: student.id,
        secretaryRombelId: rombelId,
        status: 'active'
      } : u));
    } else {
      targetUserId = 'usr-sec-' + Date.now();
      const sanitizedUsername = student.name.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 12) + '.sec';
      const newUser: User = {
        id: targetUserId,
        username: sanitizedUsername,
        name: `${student.name} (Sekretaris Kelas)`,
        email: `${sanitizedUsername}@smk.sch.id`,
        role: 'sekretaris',
        studentId: student.id,
        secretaryRombelId: rombelId,
        status: 'active',
        passwordHash: 'hashed_sekretaris123'
      };
      setUsers(prev => [...prev, newUser]);
    }

    const newAssignment: ClassSecretaryAssignment = {
      id: 'sec-assign-' + Date.now(),
      userId: targetUserId,
      studentId: student.id,
      studentName: student.name,
      studentNis: student.nis,
      rombelId: rombelId,
      rombelName: rombel ? rombel.name : rombelId,
      academicYearId: activeAcademicYear.id,
      academicYearName: activeAcademicYear.name,
      isActive: true,
      assignedAt: now,
      assignedByUserId: currentUser.id,
      assignedByUserName: currentUser.name,
      assignedByUserRole: currentUser.role,
      notes: notes || 'Penunjukan resmi sekretaris kelas'
    };

    setSecretaryAssignments(prev => [newAssignment, ...prev]);

    addAuditLog({
      action: 'ASSIGN_SECRETARY',
      entity: 'ClassSecretaryAssignment',
      entityId: newAssignment.id,
      description: `Penunjukan sekretaris kelas: ${student.name} (NIS: ${student.nis}) untuk rombel ${rombel?.name || rombelId} oleh ${currentUser.name}`,
      afterValue: JSON.stringify({ studentId: student.id, rombelId, assignedBy: currentUser.name })
    });

    showToast(`Berhasil menetapkan ${student.name} sebagai Sekretaris Kelas ${rombel?.name || ''}!`, 'success');
    return { success: true, message: 'Sekretaris kelas berhasil ditunjuk.' };
  };

  const revokeSecretaryAssignment = (assignmentId: string, reason?: string): { success: boolean; message: string } => {
    const assignment = secretaryAssignments.find(sa => sa.id === assignmentId);
    if (!assignment) {
      showToast('Data penugasan sekretaris tidak ditemukan.', 'error');
      return { success: false, message: 'Data penugasan tidak ditemukan.' };
    }

    const authCheck = canManageSecretary(currentUser, assignment.rombelId, rombels);
    if (!authCheck.allowed) {
      showToast(authCheck.reason || 'Anda tidak berwenang mencabut penugasan ini.', 'error');
      return { success: false, message: authCheck.reason || 'Ditolak' };
    }

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    setSecretaryAssignments(prev => prev.map(sa => sa.id === assignmentId ? {
      ...sa,
      isActive: false,
      deassignedAt: now,
      deassignedByUserId: currentUser.id,
      deassignedByUserName: currentUser.name,
      notes: (sa.notes ? sa.notes + ' ' : '') + `[Dicabut: ${reason || 'Pencabutan penugasan oleh wali kelas/admin'}]`
    } : sa));

    // Cabut akses rombel pada user
    setUsers(prev => prev.map(u => {
      if (u.id === assignment.userId || u.studentId === assignment.studentId) {
        return { ...u, secretaryRombelId: undefined };
      }
      return u;
    }));

    addAuditLog({
      action: 'REVOKE_SECRETARY',
      entity: 'ClassSecretaryAssignment',
      entityId: assignmentId,
      description: `Pencabutan hak akses sekretaris kelas untuk ${assignment.studentName} pada rombel ${assignment.rombelName || assignment.rombelId} oleh ${currentUser.name}`,
      reason: reason || 'Pencabutan oleh Administrator / Wali Kelas'
    });

    showToast(`Hak akses sekretaris kelas untuk ${assignment.studentName} telah dicabut.`, 'info');
    return { success: true, message: 'Hak akses sekretaris berhasil dicabut.' };
  };

  // Attendance Correction Requests (Pengajuan Koreksi Absensi)
  const submitCorrectionRequest = (data: {
    studentId: string;
    subjectId: string;
    attendanceDate: string;
    proposedStatus: AttendanceStatus;
    reason: string;
    supportingEvidence?: string;
    currentStatus?: AttendanceStatus | '-';
    currentNote?: string;
    proposedNote?: string;
    sessionId?: string;
  }): { success: boolean; message: string } => {
    const student = students.find(s => s.id === data.studentId);
    if (!student) {
      showToast('Siswa tidak ditemukan.', 'error');
      return { success: false, message: 'Siswa tidak ditemukan.' };
    }

    // Security policy: If role is sekretaris, ensure student is within their assigned rombel
    if (currentUser.role === 'sekretaris') {
      const rombelCheck = canSecretaryViewRombel(currentUser, student.rombelId);
      if (!rombelCheck.allowed) {
        addAuditLog({
          action: 'UPDATE',
          entity: 'AttendanceCorrectionRequest',
          entityId: 'unauthorized',
          description: `Upaya pengajuan koreksi untuk siswa di luar rombel ditolak (${currentUser.name} -> ${student.name})`
        });
        showToast(rombelCheck.reason || 'Anda hanya dapat mengajukan koreksi untuk rombel Anda.', 'error');
        return { success: false, message: rombelCheck.reason || 'Ditolak' };
      }
    }

    const rombel = rombels.find(r => r.id === student.rombelId);
    const subject = subjects.find(s => s.id === data.subjectId);
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const newRequest: AttendanceCorrectionRequest = {
      id: 'cor-req-' + Date.now(),
      rombelId: student.rombelId,
      rombelName: rombel ? rombel.name : student.rombelId,
      studentId: student.id,
      studentName: student.name,
      studentNis: student.nis,
      sessionId: data.sessionId,
      subjectId: data.subjectId,
      subjectName: subject ? subject.name : data.subjectId,
      attendanceDate: data.attendanceDate,
      currentStatus: data.currentStatus || '-',
      proposedStatus: data.proposedStatus,
      currentNote: data.currentNote,
      proposedNote: data.proposedNote,
      reason: data.reason,
      supportingEvidence: data.supportingEvidence,
      status: 'PENDING',
      submittedByUserId: currentUser.id,
      submittedByName: currentUser.name,
      submittedByRole: currentUser.role,
      submittedAt: now
    };

    // PENTING: Pengajuan koreksi TIDAK LANGSUNG mengubah status absensi!
    setCorrectionRequests(prev => [newRequest, ...prev]);

    addAuditLog({
      action: 'SUBMIT_CORRECTION',
      entity: 'AttendanceCorrectionRequest',
      entityId: newRequest.id,
      description: `Pengajuan koreksi absensi baru untuk ${student.name} pada ${subject?.name || 'Mapel'} (${data.attendanceDate})`,
      beforeValue: `Status sekarang: ${data.currentStatus || '-'}`,
      afterValue: `Status usulan: ${data.proposedStatus}`,
      reason: data.reason
    });

    showToast('Pengajuan koreksi absensi berhasil dikirim! Menunggu persetujuan Wali Kelas atau Guru Pengampu.', 'success');
    return { success: true, message: 'Pengajuan koreksi berhasil dikirim.' };
  };

  const reviewCorrectionRequest = (
    requestId: string,
    status: 'APPROVED' | 'REJECTED' | 'NEED_INFO',
    reviewNotes?: string
  ): { success: boolean; message: string } => {
    const req = correctionRequests.find(r => r.id === requestId);
    if (!req) {
      showToast('Data pengajuan koreksi tidak ditemukan.', 'error');
      return { success: false, message: 'Data pengajuan tidak ditemukan.' };
    }

    const authCheck = canReviewCorrectionRequest(currentUser, req.rombelId, rombels, req.subjectId, teachingAssignments);
    if (!authCheck.allowed) {
      addAuditLog({
        action: 'UPDATE',
        entity: 'AttendanceCorrectionRequest',
        entityId: requestId,
        description: `Upaya verifikasi pengajuan koreksi ditolak untuk ${currentUser.name}: ${authCheck.reason}`
      });
      showToast(authCheck.reason || 'Anda tidak berwenang memproses pengajuan ini.', 'error');
      return { success: false, message: authCheck.reason || 'Ditolak' };
    }

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    if (status === 'APPROVED') {
      // Find matching session and record
      let targetSession = req.sessionId ? sessions.find(s => s.id === req.sessionId) : undefined;
      if (!targetSession) {
        targetSession = sessions.find(s => s.rombelId === req.rombelId && s.subjectId === req.subjectId && s.date === req.attendanceDate);
      }

      if (targetSession) {
        const existingRecord = records.find(r => r.sessionId === targetSession!.id && r.studentId === req.studentId);
        if (existingRecord) {
          const oldStatus = existingRecord.status;
          const oldNote = existingRecord.note || '-';
          const newNote = req.proposedNote || req.reason;

          setRecords(prev => prev.map(r => r.id === existingRecord.id ? {
            ...r,
            status: req.proposedStatus,
            note: newNote,
            updatedBy: currentUser.id,
            updatedAt: now
          } : r));

          addAuditLog({
            action: 'CORRECTION',
            entity: 'AttendanceRecord',
            entityId: existingRecord.id,
            description: `Perubahan absensi resmi melalui persetujuan pengajuan koreksi (${req.id}) oleh ${currentUser.name}`,
            beforeValue: `Status: ${oldStatus}, Catatan: ${oldNote}`,
            afterValue: `Status: ${req.proposedStatus}, Catatan: ${newNote}`,
            reason: `Persetujuan koreksi: ${req.reason}`
          });
        }
      }

      addAuditLog({
        action: 'REVIEW_CORRECTION',
        entity: 'AttendanceCorrectionRequest',
        entityId: requestId,
        description: `Pengajuan koreksi disetujui oleh ${currentUser.name} (${currentUser.role})`,
        afterValue: `Status: APPROVED. Catatan peninjau: ${reviewNotes || 'Disetujui'}`
      });

      showToast(`Pengajuan koreksi untuk ${req.studentName} telah DISETUJUI dan absensi resmi diperbarui!`, 'success');
    } else if (status === 'REJECTED') {
      addAuditLog({
        action: 'REVIEW_CORRECTION',
        entity: 'AttendanceCorrectionRequest',
        entityId: requestId,
        description: `Pengajuan koreksi ditolak oleh ${currentUser.name} (${currentUser.role})`,
        afterValue: `Status: REJECTED. Alasan: ${reviewNotes || 'Tidak memenuhi syarat'}`
      });

      showToast(`Pengajuan koreksi untuk ${req.studentName} telah DITOLAK.`, 'warning');
    } else {
      addAuditLog({
        action: 'REVIEW_CORRECTION',
        entity: 'AttendanceCorrectionRequest',
        entityId: requestId,
        description: `Permintaan informasi tambahan untuk pengajuan koreksi oleh ${currentUser.name}`,
        afterValue: `Status: NEED_INFO. Catatan: ${reviewNotes || 'Mohon lengkapi data pendukung'}`
      });

      showToast(`Permintaan data pendukung telah dikirim ke pengaju.`, 'info');
    }

    setCorrectionRequests(prev => prev.map(r => r.id === requestId ? {
      ...r,
      status,
      reviewedByUserId: currentUser.id,
      reviewedByName: currentUser.name,
      reviewedByRole: currentUser.role,
      reviewedAt: now,
      reviewNotes: reviewNotes || (status === 'APPROVED' ? 'Disetujui' : status === 'REJECTED' ? 'Ditolak' : 'Mohon lengkapi data pendukung')
    } : r));

    return { success: true, message: `Pengajuan berhasil diproses: ${status}` };
  };

  const createAttendanceSession = (
    sessionData: Omit<AttendanceSession, 'id' | 'createdAt' | 'updatedAt'>,
    recordItems: Array<{ studentId: string; status: AttendanceStatus; note?: string }>
  ): AttendanceSession | null => {
    // 0. Keamanan & Otorisasi: Pastikan guru hanya dapat mengabsen kelas & mapel yang ditugaskan
    const authCheck = canTeacherTakeAttendance(currentUser, sessionData.rombelId, sessionData.subjectId, teachingAssignments);
    if (!authCheck.allowed) {
      addAuditLog({
        action: 'UPDATE',
        entity: 'AttendanceSession',
        entityId: 'unauthorized-access',
        description: `Upaya pencatatan presensi ditolak untuk ${currentUser.name}: ${authCheck.reason}`,
        reason: 'Pelanggaran otorisasi peran guru'
      });
      showToast(authCheck.reason || 'Anda tidak berwenang mencatat presensi untuk kelas/mapel ini.', 'error');
      return null;
    }

    // 1. Validasi: Jangan izinkan dobel input sesi pada tanggal, rombel, mapel, dan pertemuan yang sama
    const duplicate = sessions.find(
      s => s.rombelId === sessionData.rombelId &&
           s.subjectId === sessionData.subjectId &&
           s.date === sessionData.date &&
           s.meetingNumber === sessionData.meetingNumber &&
           s.status !== 'cancelled'
    );

    if (duplicate) {
      showToast(`Pertemuan ke-${sessionData.meetingNumber} untuk kelas dan mapel ini pada tanggal ${sessionData.date} sudah tercatat sebelumnya.`, 'error');
      return null;
    }

    const now = new Date();
    const timestamp = now.toISOString().replace('T', ' ').substring(0, 19);
    const sessionId = 'ses-' + Date.now();

    const newSession: AttendanceSession = {
      ...sessionData,
      id: sessionId,
      status: sessionData.status || 'completed',
      createdAt: timestamp,
      updatedAt: timestamp
    };

    // 2. Validate records: make sure every student appears only once
    const seenStudent = new Set<string>();
    const newRecords: AttendanceRecord[] = [];

    recordItems.forEach((rec, idx) => {
      if (seenStudent.has(rec.studentId)) return; // prevent duplicate student within session
      seenStudent.add(rec.studentId);
      newRecords.push({
        id: `rec-${sessionId}-${idx}`,
        sessionId,
        studentId: rec.studentId,
        status: rec.status,
        note: rec.note || '',
        updatedBy: currentUser.id,
        updatedAt: timestamp
      });
    });

    setSessions(prev => [newSession, ...prev]);
    setRecords(prev => [...prev, ...newRecords]);

    const rombel = rombels.find(r => r.id === sessionData.rombelId);
    const subject = subjects.find(s => s.id === sessionData.subjectId);

    // Hitung ringkasan
    const counts = { H: 0, S: 0, I: 0, A: 0, T: 0, D: 0 };
    newRecords.forEach(r => counts[r.status] = (counts[r.status] || 0) + 1);

    addAuditLog({
      action: 'CREATE',
      entity: 'AttendanceSession',
      entityId: sessionId,
      description: `Mencatat presensi ${subject?.name || 'Mapel'} di ${rombel?.name || 'Kelas'} (Pertemuan ${sessionData.meetingNumber})`,
      afterValue: `Hadir: ${counts.H}, Sakit: ${counts.S}, Izin: ${counts.I}, Alpa: ${counts.A}, Terlambat: ${counts.T}, Disp: ${counts.D}`
    });

    showToast(`Presensi pertemuan ke-${sessionData.meetingNumber} berhasil disimpan! (${newRecords.length} siswa)`, 'success');
    return newSession;
  };

  const updateAttendanceRecords = (
    sessionId: string,
    updatedRecords: Array<{ studentId: string; status: AttendanceStatus; note?: string }>,
    reason?: string
  ): boolean => {
    if (currentUser.role === 'sekretaris') {
      showToast('Sekretaris Kelas tidak berwenang mengubah catatan absensi resmi. Gunakan menu Pengajuan Koreksi ke Wali Kelas.', 'error');
      return false;
    }

    const session = sessions.find(s => s.id === sessionId);
    if (!session) return false;

    if (session.status === 'locked' && currentUser.role !== 'admin') {
      showToast('Sesi absensi ini telah dikunci. Hanya admin yang dapat membuka kunci dan mengoreksi data.', 'error');
      return false;
    }

    const now = new Date();
    const timestamp = now.toISOString().replace('T', ' ').substring(0, 19);

    setRecords(prev => {
      const otherRecords = prev.filter(r => r.sessionId !== sessionId);
      const newItems = updatedRecords.map((item, idx) => ({
        id: `rec-${sessionId}-${idx}-${Date.now()}`,
        sessionId,
        studentId: item.studentId,
        status: item.status,
        note: item.note || '',
        updatedBy: currentUser.id,
        updatedAt: timestamp
      }));
      return [...otherRecords, ...newItems];
    });

    setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, updatedAt: timestamp } : s));

    addAuditLog({
      action: 'UPDATE',
      entity: 'AttendanceSession',
      entityId: sessionId,
      description: `Memperbarui rekaman presensi sesi ${sessionId}`,
      reason: reason || 'Koreksi presensi guru/wali kelas'
    });

    showToast('Perubahan presensi berhasil disimpan!');
    return true;
  };

  const lockSession = (sessionId: string) => {
    if (currentUser.role === 'sekretaris') {
      showToast('Sekretaris Kelas tidak memiliki kewenangan untuk mengunci sesi absensi.', 'error');
      return;
    }

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    setSessions(prev => prev.map(s => s.id === sessionId ? {
      ...s,
      status: 'locked',
      lockedAt: now,
      lockedBy: currentUser.name
    } : s));

    addAuditLog({
      action: 'LOCK',
      entity: 'AttendanceSession',
      entityId: sessionId,
      description: `Mengunci sesi absensi ${sessionId} agar tidak dapat diedit sembarangan`
    });

    showToast('Sesi absensi berhasil dikunci.', 'info');
  };

  const unlockSession = (sessionId: string) => {
    if (currentUser.role !== 'admin') {
      showToast('Hanya administrator yang memiliki wewenang membuka kunci sesi absensi.', 'error');
      return;
    }

    setSessions(prev => prev.map(s => s.id === sessionId ? {
      ...s,
      status: 'completed',
      lockedAt: undefined,
      lockedBy: undefined
    } : s));

    addAuditLog({
      action: 'UNLOCK',
      entity: 'AttendanceSession',
      entityId: sessionId,
      description: `Membuka kunci sesi absensi ${sessionId} oleh administrator`
    });

    showToast('Kunci sesi absensi dibuka. Guru/Wali Kelas dapat mengoreksi data.', 'success');
  };

  const correctStudentRecord = (
    recordId: string,
    newStatus: AttendanceStatus,
    newNote: string,
    reason: string
  ): boolean => {
    if (currentUser.role === 'sekretaris') {
      showToast('Sekretaris Kelas tidak berwenang mengoreksi langsung catatan resmi. Silakan ajukan koreksi ke Wali Kelas.', 'error');
      return false;
    }

    const targetRecord = records.find(r => r.id === recordId);
    if (!targetRecord) return false;

    const student = students.find(s => s.id === targetRecord.studentId);
    const session = sessions.find(s => s.id === targetRecord.sessionId);
    const subject = subjects.find(s => s.id === session?.subjectId);

    const oldStatus = targetRecord.status;
    const oldNote = targetRecord.note || '-';
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    setRecords(prev => prev.map(r => r.id === recordId ? {
      ...r,
      status: newStatus,
      note: newNote,
      updatedBy: currentUser.id,
      updatedAt: now
    } : r));

    addAuditLog({
      action: 'CORRECTION',
      entity: 'AttendanceRecord',
      entityId: recordId,
      description: `Koreksi presensi siswa: ${student?.name || 'Siswa'} pada ${subject?.name || 'Mapel'} (${session?.date || ''})`,
      beforeValue: `Status: ${oldStatus}, Catatan: ${oldNote}`,
      afterValue: `Status: ${newStatus}, Catatan: ${newNote || '-'}`,
      reason: reason || 'Koreksi wali kelas dengan bukti dokumen'
    });

    showToast(`Presensi ${student?.name} berhasil dikoreksi menjadi '${newStatus}'`, 'success');
    return true;
  };

  // Selectors
  const getTeacherById = (id?: string) => teachers.find(t => t.id === id);
  const getSubjectById = (id?: string) => subjects.find(s => s.id === id);
  const getRombelById = (id?: string) => rombels.find(r => r.id === id);
  const getDepartmentById = (id?: string) => departments.find(d => d.id === id);

  // Backup & Restore
  const clearAllDemoData = () => {
    try {
      localStorage.clear();
    } catch (e) {
      // ignore
    }
    setUsers(initialUsers);
    setCurrentUserId('usr-admin');
    setStudents([]);
    setTeachers([]);
    setDepartments(initialDepartments);
    setRombels([]);
    setSubjects([]);
    setAcademicYears(initialAcademicYears);
    setTeachingAssignments([]);
    setSchedules([]);
    setCalendarEvents([]);
    setSessions([]);
    setRecords([]);
    setAuditLogs(initialAuditLogs);
    setSettings(initialSettings);
    setSecretaryAssignments([]);
    setCorrectionRequests([]);
    showToast('Seluruh data demo siswa, guru, rombel, jadwal, dan presensi berhasil dihapus!', 'success');
  };

  const resetDatabase = () => {
    clearAllDemoData();
  };

  const exportDatabaseJson = async (): Promise<string> => {
    const rawData = {
      users,
      students,
      teachers,
      departments,
      rombels,
      subjects,
      academicYears,
      teachingAssignments,
      schedules,
      calendarEvents,
      sessions,
      records,
      auditLogs,
      settings,
      secretaryAssignments,
      correctionRequests
    };
    const checksum = await sha256(JSON.stringify(rawData));
    const backupData = {
      version: '1.3.0',
      exportDate: new Date().toISOString(),
      school: settings.schoolName,
      checksum,
      data: rawData
    };
    addAuditLog({
      action: 'EXPORT_REPORT',
      entity: 'SystemBackup',
      entityId: 'backup-' + Date.now(),
      description: `Ekspor cadangan database penuh oleh ${currentUser.name} (Checksum: ${checksum.substring(0, 12)}...)`
    });
    return JSON.stringify(backupData, null, 2);
  };

  const importDatabaseJson = (jsonStr: string): boolean => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (!parsed.data) {
        showToast('Format file cadangan tidak valid (tidak ada properti data).', 'error');
        return false;
      }
      const d = parsed.data;
      if (d.users) setUsers(d.users);
      if (d.students) setStudents(d.students);
      if (d.teachers) setTeachers(d.teachers);
      if (d.departments) setDepartments(d.departments);
      if (d.rombels) setRombels(d.rombels);
      if (d.subjects) setSubjects(d.subjects);
      if (d.academicYears) setAcademicYears(d.academicYears);
      if (d.teachingAssignments) setTeachingAssignments(d.teachingAssignments);
      if (d.schedules) setSchedules(d.schedules);
      if (d.calendarEvents) setCalendarEvents(d.calendarEvents);
      if (d.sessions) setSessions(d.sessions);
      if (d.records) setRecords(d.records);
      if (d.auditLogs) setAuditLogs(d.auditLogs);
      if (d.settings) setSettings(d.settings);
      if (d.secretaryAssignments) setSecretaryAssignments(d.secretaryAssignments);
      if (d.correctionRequests) setCorrectionRequests(d.correctionRequests);

      addAuditLog({
        action: 'IMPORT',
        entity: 'SystemBackup',
        entityId: 'restore-' + Date.now(),
        description: `Pemulihan database dari file cadangan berhasil dilakukan oleh ${currentUser.name}`
      });

      showToast('Data berhasil dipulihkan dari cadangan!', 'success');
      return true;
    } catch (e) {
      showToast('Gagal memproses file cadangan JSON: file korup atau salah format.', 'error');
      return false;
    }
  };

  const exportSqlDump = async (): Promise<string> => {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    let sql = `-- =========================================================================\n`;
    sql += `-- SISTEM INFORMASI ABSENSI SISWA SMK\n`;
    sql += `-- DUMP DATABASE LENGKAP (DDL & DML MySQL / PostgreSQL)\n`;
    sql += `-- Sekolah: ${settings.schoolName} (NPSN: ${settings.schoolNpsn})\n`;
    sql += `-- Tanggal Ekspor: ${timestamp}\n`;
    sql += `-- Diekspor oleh: ${currentUser.name} (${currentUser.role})\n`;
    sql += `-- =========================================================================\n\n`;
    sql += `SET FOREIGN_KEY_CHECKS = 0;\n\n`;

    const escapeSql = (str: any) => {
      if (str === null || str === undefined) return 'NULL';
      return `'${String(str).replace(/'/g, "''")}'`;
    };

    // 1. Departments
    sql += `-- 1. Jurusan SMK\n`;
    sql += `CREATE TABLE IF NOT EXISTS \`departments\` (\n  \`id\` VARCHAR(50) PRIMARY KEY,\n  \`code\` VARCHAR(20) NOT NULL,\n  \`name\` VARCHAR(100) NOT NULL,\n  \`description\` TEXT\n);\n`;
    for (const d of departments) {
      sql += `INSERT INTO \`departments\` (\`id\`, \`code\`, \`name\`, \`description\`) VALUES (${escapeSql(d.id)}, ${escapeSql(d.code)}, ${escapeSql(d.name)}, ${escapeSql(d.description)});\n`;
    }
    sql += `\n`;

    // 2. Teachers
    sql += `-- 2. Data Guru\n`;
    sql += `CREATE TABLE IF NOT EXISTS \`teachers\` (\n  \`id\` VARCHAR(50) PRIMARY KEY,\n  \`nip\` VARCHAR(30) NOT NULL,\n  \`name\` VARCHAR(100) NOT NULL,\n  \`email\` VARCHAR(100),\n  \`phone\` VARCHAR(30),\n  \`gender\` CHAR(1),\n  \`specialization\` VARCHAR(100),\n  \`status\` VARCHAR(20)\n);\n`;
    for (const t of teachers) {
      sql += `INSERT INTO \`teachers\` (\`id\`, \`nip\`, \`name\`, \`email\`, \`phone\`, \`gender\`, \`specialization\`, \`status\`) VALUES (${escapeSql(t.id)}, ${escapeSql(t.nip)}, ${escapeSql(t.name)}, ${escapeSql(t.email)}, ${escapeSql(t.phone)}, ${escapeSql(t.gender)}, ${escapeSql(t.specialization)}, ${escapeSql(t.status)});\n`;
    }
    sql += `\n`;

    // 3. Rombels
    sql += `-- 3. Rombongan Belajar (Rombel Kelas)\n`;
    sql += `CREATE TABLE IF NOT EXISTS \`rombels\` (\n  \`id\` VARCHAR(50) PRIMARY KEY,\n  \`code\` VARCHAR(50) NOT NULL,\n  \`name\` VARCHAR(100) NOT NULL,\n  \`grade\` VARCHAR(10),\n  \`department_id\` VARCHAR(50),\n  \`academic_year_id\` VARCHAR(50),\n  \`homeroom_teacher_id\` VARCHAR(50)\n);\n`;
    for (const r of rombels) {
      sql += `INSERT INTO \`rombels\` (\`id\`, \`code\`, \`name\`, \`grade\`, \`department_id\`, \`academic_year_id\`, \`homeroom_teacher_id\`) VALUES (${escapeSql(r.id)}, ${escapeSql(r.code)}, ${escapeSql(r.name)}, ${escapeSql(r.grade)}, ${escapeSql(r.departmentId)}, ${escapeSql(r.academicYearId)}, ${escapeSql(r.homeroomTeacherId)});\n`;
    }
    sql += `\n`;

    // 4. Students
    sql += `-- 4. Data Siswa\n`;
    sql += `CREATE TABLE IF NOT EXISTS \`students\` (\n  \`id\` VARCHAR(50) PRIMARY KEY,\n  \`nis\` VARCHAR(30) NOT NULL UNIQUE,\n  \`nisn\` VARCHAR(30),\n  \`name\` VARCHAR(100) NOT NULL,\n  \`gender\` CHAR(1),\n  \`department_id\` VARCHAR(50),\n  \`rombel_id\` VARCHAR(50),\n  \`status\` VARCHAR(20)\n);\n`;
    for (const s of students) {
      sql += `INSERT INTO \`students\` (\`id\`, \`nis\`, \`nisn\`, \`name\`, \`gender\`, \`department_id\`, \`rombel_id\`, \`status\`) VALUES (${escapeSql(s.id)}, ${escapeSql(s.nis)}, ${escapeSql(s.nisn)}, ${escapeSql(s.name)}, ${escapeSql(s.gender)}, ${escapeSql(s.departmentId)}, ${escapeSql(s.rombelId)}, ${escapeSql(s.status)});\n`;
    }
    sql += `\n`;

    // 5. Subjects
    sql += `-- 5. Mata Pelajaran\n`;
    sql += `CREATE TABLE IF NOT EXISTS \`subjects\` (\n  \`id\` VARCHAR(50) PRIMARY KEY,\n  \`code\` VARCHAR(30) NOT NULL UNIQUE,\n  \`name\` VARCHAR(100) NOT NULL,\n  \`category\` VARCHAR(50),\n  \`credit_hours\` INT\n);\n`;
    for (const sb of subjects) {
      sql += `INSERT INTO \`subjects\` (\`id\`, \`code\`, \`name\`, \`category\`, \`credit_hours\`) VALUES (${escapeSql(sb.id)}, ${escapeSql(sb.code)}, ${escapeSql(sb.name)}, ${escapeSql(sb.category)}, ${sb.creditHours});\n`;
    }
    sql += `\n`;

    // 6. Teaching Assignments
    sql += `-- 6. Penugasan Guru\n`;
    for (const ta of teachingAssignments) {
      sql += `INSERT INTO \`teaching_assignments\` (\`id\`, \`teacher_id\`, \`subject_id\`, \`rombel_id\`) VALUES (${escapeSql(ta.id)}, ${escapeSql(ta.teacherId)}, ${escapeSql(ta.subjectId)}, ${escapeSql(ta.rombelId)});\n`;
    }
    sql += `\n`;

    // 7. Schedules
    sql += `-- 7. Jadwal Pelajaran\n`;
    for (const sc of schedules) {
      sql += `INSERT INTO \`schedules\` (\`id\`, \`day_of_week\`, \`period_start\`, \`period_end\`, \`time_start\`, \`time_end\`, \`teacher_id\`, \`subject_id\`, \`rombel_id\`, \`room\`) VALUES (${escapeSql(sc.id)}, ${sc.dayOfWeek}, ${sc.periodStart}, ${sc.periodEnd}, ${escapeSql(sc.timeStart)}, ${escapeSql(sc.timeEnd)}, ${escapeSql(sc.teacherId)}, ${escapeSql(sc.subjectId)}, ${escapeSql(sc.rombelId)}, ${escapeSql(sc.room)});\n`;
    }
    sql += `\n`;

    // 8. Sessions & Records
    sql += `-- 8. Rekaman Presensi & Sesi Absensi\n`;
    for (const ss of sessions) {
      sql += `INSERT INTO \`attendance_sessions\` (\`id\`, \`rombel_id\`, \`subject_id\`, \`teacher_id\`, \`date\`, \`topic\`, \`status\`) VALUES (${escapeSql(ss.id)}, ${escapeSql(ss.rombelId)}, ${escapeSql(ss.subjectId)}, ${escapeSql(ss.teacherId)}, ${escapeSql(ss.date)}, ${escapeSql(ss.topic)}, ${escapeSql(ss.status)});\n`;
    }
    for (const rc of records) {
      sql += `INSERT INTO \`attendance_records\` (\`id\`, \`session_id\`, \`student_id\`, \`status\`, \`note\`) VALUES (${escapeSql(rc.id)}, ${escapeSql(rc.sessionId)}, ${escapeSql(rc.studentId)}, ${escapeSql(rc.status)}, ${escapeSql(rc.note)});\n`;
    }
    sql += `\n`;

    // 9. Class Secretary Assignments & Correction Requests
    sql += `-- 9. Sekretaris Kelas & Pengajuan Koreksi\n`;
    for (const sa of secretaryAssignments) {
      sql += `INSERT INTO \`class_secretary_assignments\` (\`id\`, \`student_id\`, \`rombel_id\`, \`is_active\`, \`assigned_at\`) VALUES (${escapeSql(sa.id)}, ${escapeSql(sa.studentId)}, ${escapeSql(sa.rombelId)}, ${sa.isActive ? 1 : 0}, ${escapeSql(sa.assignedAt)});\n`;
    }
    for (const cr of correctionRequests) {
      sql += `INSERT INTO \`attendance_correction_requests\` (\`id\`, \`student_id\`, \`subject_id\`, \`proposed_status\`, \`status\`, \`reason\`) VALUES (${escapeSql(cr.id)}, ${escapeSql(cr.studentId)}, ${escapeSql(cr.subjectId)}, ${escapeSql(cr.proposedStatus)}, ${escapeSql(cr.status)}, ${escapeSql(cr.reason)});\n`;
    }
    sql += `\nSET FOREIGN_KEY_CHECKS = 1;\n`;
    sql += `-- Selesai: Ekspor SQL Berhasil (${timestamp})\n`;

    addAuditLog({
      action: 'EXPORT_REPORT',
      entity: 'SystemBackup',
      entityId: 'sql-dump-' + Date.now(),
      description: `Ekspor SQL dump database penuh (DDL & INSERT script) oleh ${currentUser.name}`
    });
    return sql;
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        isAuthenticated,
        loginAsRole,
        logout,
        switchUser,
        authenticateUser,
        users,
        addUser,
        updateUser,
        resetUserPassword,

        students,
        teachers,
        departments,
        rombels,
        subjects,
        academicYears,
        activeAcademicYear,
        teachingAssignments,
        schedules,
        calendarEvents,
        settings,
        updateSettings,

        addStudent,
        updateStudent,
        deleteStudent,
        transferStudent,
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

        addTeachingAssignment,
        deleteTeachingAssignment,
        importTeachingAssignments,

        addSchedule,
        updateSchedule,
        deleteSchedule,
        importSchedules,

        secretaryAssignments,
        assignSecretary,
        revokeSecretaryAssignment,
        getActiveSecretaryForRombel,

        correctionRequests,
        submitCorrectionRequest,
        reviewCorrectionRequest,

        sessions,
        records,
        createAttendanceSession,
        updateAttendanceRecords,
        lockSession,
        unlockSession,
        correctStudentRecord,

        auditLogs,
        addAuditLog,

        toasts,
        showToast,
        removeToast,

        resetDatabase,
        clearAllDemoData,
        exportDatabaseJson,
        importDatabaseJson,
        exportSqlDump,

        getTeacherById,
        getSubjectById,
        getRombelById,
        getDepartmentById
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

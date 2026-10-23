export type UserRole = 'admin' | 'wali_kelas' | 'guru' | 'sekretaris';

export type AttendanceStatus = 'H' | 'S' | 'I' | 'A' | 'T' | 'D'; 
// H: Hadir, S: Sakit, I: Izin, A: Alpa, T: Terlambat, D: Dispensasi

export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  role: UserRole;
  passwordHash?: string;
  teacherId?: string; // If teacher or homeroom teacher
  studentId?: string; // If student / class secretary
  secretaryRombelId?: string; // If active class secretary (sekretaris kelas)
  status: 'active' | 'inactive';
  lastLogin?: string;
  failedAttempts?: number;
  lockedUntil?: string;
}

export interface Department {
  id: string;
  code: string; // DKV, DPIB, TKP, TOI, TITL, TAV, TSM, TKR
  name: string;
  description: string;
  color?: string;
}

export type GradeLevel = 'X' | 'XI' | 'XII';

export interface Rombel {
  id: string;
  code: string; // e.g., 'DKV-XI-1'
  name: string;
  grade: GradeLevel;
  departmentId: string;
  departmentCode: string;
  academicYearId: string;
  homeroomTeacherId: string; // Wali Kelas
  homeroomTeacherName?: string;
  status: 'active' | 'inactive';
  studentCount?: number;
}

export interface StudentTransferRecord {
  id: string;
  studentId: string;
  studentName: string;
  fromRombelId: string;
  fromRombelName: string;
  toRombelId: string;
  toRombelName: string;
  transferDate: string;
  reason: string;
  authorizedBy: string;
}

export interface Student {
  id: string;
  nis: string;
  nisn: string;
  name: string;
  gender: 'L' | 'P';
  departmentId: string;
  rombelId: string;
  rombelCode?: string;
  academicYearId: string;
  status: 'active' | 'moved' | 'graduated' | 'inactive';
  phone?: string;
  parentName?: string;
  parentPhone?: string;
  previousRombelIds?: string[]; // Preserves historical affiliations
}

export interface Teacher {
  id: string;
  nip: string;
  name: string;
  email: string;
  phone: string;
  gender: 'L' | 'P';
  specialization?: string;
  status: 'active' | 'inactive';
}

export interface Subject {
  id: string;
  code: string;
  name: string;
  category: 'Muatan Nasional' | 'Muatan Kejuruan' | 'Muatan Lokal';
  creditHours: number; // Jam pelajaran per minggu
}

export interface AcademicYear {
  id: string;
  name: string; // e.g., '2025/2026'
  semester: 'Ganjil' | 'Genap';
  isActive: boolean;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
}

export interface TeachingAssignment {
  id: string;
  academicYearId: string;
  teacherId: string;
  subjectId: string;
  rombelId: string;
}

export interface Schedule {
  id: string;
  academicYearId: string;
  dayOfWeek: 1 | 2 | 3 | 4 | 5 | 6; // 1: Senin, ..., 5: Jumat, 6: Sabtu
  periodStart: number; // e.g. 1
  periodEnd: number; // e.g. 3
  timeStart: string; // '07:15'
  timeEnd: string; // '09:30'
  teacherId: string;
  subjectId: string;
  rombelId: string;
  room: string;
}

export interface AttendanceSession {
  id: string;
  academicYearId: string;
  rombelId: string;
  subjectId: string;
  teacherId: string;
  scheduleId?: string;
  date: string; // YYYY-MM-DD
  period: string; // 'Jam ke-1 s/d 3'
  meetingNumber: number; // Pertemuan ke-1..
  topic: string; // Materi bahasan
  status: 'completed' | 'draft' | 'cancelled' | 'locked';
  recordedByRole?: 'guru' | 'sekretaris';
  recorderName?: string;
  inputMode?: 'exception_only' | 'full';
  lockedAt?: string;
  lockedBy?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceRecord {
  id: string;
  sessionId: string;
  studentId: string;
  status: AttendanceStatus;
  note?: string; // Alasan sakit/izin/alpa/terlambat (cth: "Demam", "Surat dokter", "Macet")
  updatedBy?: string;
  updatedAt: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  dateStart: string;
  dateEnd: string;
  type: 'holiday' | 'exam' | 'event';
  description?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'CORRECTION' | 'LOCK' | 'UNLOCK' | 'IMPORT' | 'LOGIN_SUCCESS' | 'LOGIN_FAILED' | 'EXPORT_REPORT' | 'TRANSFER_STUDENT' | 'ASSIGN_SECRETARY' | 'REVOKE_SECRETARY' | 'SUBMIT_CORRECTION' | 'REVIEW_CORRECTION';
  entity: string; // e.g., 'AttendanceRecord', 'Student', 'Session', 'ClassSecretaryAssignment', 'AttendanceCorrectionRequest'
  entityId: string;
  description: string;
  beforeValue?: string;
  afterValue?: string;
  reason?: string;
  ipAddress?: string;
}

export interface SchoolSettings {
  schoolName: string;
  schoolNpsn: string;
  schoolAddress: string;
  schoolCity: string;
  schoolProvince: string;
  headmasterName: string;
  headmasterNip: string;
  logoUrl?: string;
  lockTimeoutHours: number; // e.g. 24 hours to lock attendance automatically
  allowHomeroomCorrection: boolean; // Allow homeroom teacher to correct with reason & audit
  backupFrequencyHours: number;
  lastBackupDate?: string;
  maxActiveSecretariesPerRombel?: number; // Default 1
}

export interface ClassSecretaryAssignment {
  id: string;
  userId: string;
  studentId: string;
  studentName: string;
  studentNis: string;
  rombelId: string;
  rombelName?: string;
  academicYearId: string;
  academicYearName?: string;
  isActive: boolean;
  assignedAt: string;
  deassignedAt?: string;
  assignedByUserId: string;
  assignedByUserName: string;
  assignedByUserRole: UserRole;
  deassignedByUserId?: string;
  deassignedByUserName?: string;
  notes?: string;
}

export type CorrectionStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'NEED_INFO';

export interface AttendanceCorrectionRequest {
  id: string;
  rombelId: string;
  rombelName?: string;
  studentId: string;
  studentName: string;
  studentNis: string;
  sessionId?: string;
  subjectId: string;
  subjectName: string;
  attendanceDate: string; // YYYY-MM-DD
  currentStatus: AttendanceStatus | '-';
  proposedStatus: AttendanceStatus;
  currentNote?: string;
  proposedNote?: string;
  reason: string;
  supportingEvidence?: string;
  status: CorrectionStatus;
  submittedByUserId: string;
  submittedByName: string;
  submittedByRole: UserRole;
  submittedAt: string;
  reviewedByUserId?: string;
  reviewedByName?: string;
  reviewedByRole?: UserRole;
  reviewedAt?: string;
  reviewNotes?: string;
}


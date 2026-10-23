import { 
  Department, 
  Rombel, 
  Student, 
  Teacher, 
  Subject, 
  AcademicYear, 
  TeachingAssignment, 
  Schedule, 
  AttendanceSession, 
  AttendanceRecord, 
  User, 
  CalendarEvent, 
  AuditLog, 
  SchoolSettings,
  ClassSecretaryAssignment,
  AttendanceCorrectionRequest
} from '../types';

export const initialSettings: SchoolSettings = {
  schoolName: 'SMK NEGERI 1 TEKNOLOGI & INDUSTRI',
  schoolNpsn: '20223948',
  schoolAddress: 'Jl. Pendidikan Kejuruan No. 45, Kawasan Industri',
  schoolCity: 'Kota Bandung',
  schoolProvince: 'Jawa Barat',
  headmasterName: 'Dr. Drs. H. Suryana, M.M.Pd.',
  headmasterNip: '19680512 199303 1 004',
  lockTimeoutHours: 48,
  allowHomeroomCorrection: true,
  backupFrequencyHours: 24
};

export const initialDepartments: Department[] = [
  { id: 'dept-dkv', code: 'DKV', name: 'Desain Komunikasi Visual', description: 'Penguasaan komunikasi visual, ilustrasi digital, multimedia, fotografi, dan periklanan.', color: 'purple' },
  { id: 'dept-dpib', code: 'DPIB', name: 'Desain Pemodelan dan Informasi Bangunan', description: 'Perencanaan dan penggambaran arsitektur serta konstruksi bangunan berbasis BIM dan CAD.', color: 'blue' },
  { id: 'dept-tkp', code: 'TKP', name: 'Teknik Konstruksi dan Perumahan', description: 'Konstruksi sipil, pengerjaan kayu dan beton, utilitas, serta manajemen proyek perumahan.', color: 'amber' },
  { id: 'dept-toi', code: 'TOI', name: 'Teknik Otomasi Industri', description: 'Sistem otomasi, kontrol berbasis PLC, pneumatik, robotika, dan mikrokontroler industri.', color: 'emerald' },
  { id: 'dept-titl', code: 'TITL', name: 'Teknik Instalasi Tenaga Listrik', description: 'Instalasi penerangan, tenaga motor listrik, panel distribusi, dan energi terbarukan.', color: 'yellow' },
  { id: 'dept-tav', code: 'TAV', name: 'Teknik Audio Video', description: 'Perancangan, perbaikan, dan instalasi sistem audio video, elektronika digital, dan broadcasting.', color: 'indigo' },
  { id: 'dept-tsm', code: 'TSM', name: 'Teknik Sepeda Motor', description: 'Perawatan berkala, perbaikan mesin, kelistrikan, sasis sepeda motor konvensional dan injeksi.', color: 'cyan' },
  { id: 'dept-tkr', code: 'TKR', name: 'Teknik Kendaraan Ringan', description: 'Teknologi otomotif roda empat, engine management system, chasis, dan kelistrikan mobil.', color: 'rose' },
];

export const initialAcademicYears: AcademicYear[] = [
  { id: 'ay-2025-1', name: '2025/2026', semester: 'Ganjil', isActive: false, startDate: '2025-07-14', endDate: '2025-12-20' },
  { id: 'ay-2025-2', name: '2025/2026', semester: 'Genap', isActive: true, startDate: '2026-01-05', endDate: '2026-06-26' },
];

// Clean state: Tanpa data demo guru
export const initialTeachers: Teacher[] = [];

// Akun Administrator utama untuk akses awal sistem
export const initialUsers: User[] = [
  {
    id: 'usr-admin',
    username: 'admin',
    name: 'Administrator Utama',
    email: 'admin@smk.sch.id',
    role: 'admin',
    status: 'active',
    lastLogin: '2026-10-19 08:00:00'
  }
];

// Clean state: Tanpa data demo rombel (siap diinput / diimpor dari Excel)
export const initialRombels: Rombel[] = [];

// Clean state: Tanpa data demo mata pelajaran
export const initialSubjects: Subject[] = [];

// Clean state: Tanpa data demo siswa
export const initialStudents: Student[] = [];

// Clean state: Tanpa data demo penugasan
export const initialTeachingAssignments: TeachingAssignment[] = [];

// Clean state: Tanpa data demo jadwal
export const initialSchedules: Schedule[] = [];

// Clean state: Tanpa data demo kalender
export const initialCalendarEvents: CalendarEvent[] = [];

// Clean state: Tanpa data demo sesi absensi
export const initialSessions: AttendanceSession[] = [];

// Clean state: Tanpa data demo catatan kehadiran
export const initialAttendanceRecords: AttendanceRecord[] = [];

// Audit Log inisialisasi sistem bersih
export const initialAuditLogs: AuditLog[] = [
  {
    id: 'aud-clean-init',
    timestamp: '2026-10-19 08:00:00',
    userId: 'usr-admin',
    userName: 'Administrator Utama',
    userRole: 'admin',
    action: 'CREATE',
    entity: 'System',
    entityId: 'clean-database',
    description: 'Sistem diinisialisasi dalam kondisi bersih tanpa data demo. Siap untuk input dan impor data sekolah riil.'
  }
];

// Clean state: Tanpa data demo penugasan sekretaris
export const initialSecretaryAssignments: ClassSecretaryAssignment[] = [];

// Clean state: Tanpa data demo pengajuan koreksi
export const initialCorrectionRequests: AttendanceCorrectionRequest[] = [];

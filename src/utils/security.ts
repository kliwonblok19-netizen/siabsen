import { User, UserRole, TeachingAssignment, Rombel } from '../types';

/**
 * Computes SHA-256 hash string from input text
 */
export async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * Sanitize plain text string to prevent XSS injection
 */
export function sanitizeInput(input?: string): string {
  if (!input) return '';
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim();
}

/**
 * Validates uploaded spreadsheet file for size and extension
 */
export function validateImportFile(file: File): { isValid: boolean; error?: string } {
  const allowedExtensions = ['.xlsx', '.xls', '.csv'];
  const maxSizeBytes = 5 * 1024 * 1024; // 5 MB

  const fileName = file.name.toLowerCase();
  const hasValidExt = allowedExtensions.some(ext => fileName.endsWith(ext));

  if (!hasValidExt) {
    return {
      isValid: false,
      error: 'Format file tidak didukung! Harap unggah file spreadsheet berekstensi .xlsx, .xls, atau .csv.'
    };
  }

  if (file.size > maxSizeBytes) {
    return {
      isValid: false,
      error: `Ukuran file melebihi batas maksimum (${(file.size / (1024 * 1024)).toFixed(2)} MB > 5 MB).`
    };
  }

  return { isValid: true };
}

/**
 * Policy: Check if user is authorized to take attendance for given class and subject
 */
export function canTeacherTakeAttendance(
  user: User,
  rombelId: string,
  subjectId: string,
  teachingAssignments: TeachingAssignment[]
): { allowed: boolean; reason?: string } {
  // Admin has school-wide override authority
  if (user.role === 'admin') {
    return { allowed: true };
  }

  // Sekretaris TIDAK BOLEH mengubah status absensi resmi secara langsung
  if (user.role === 'sekretaris') {
    return {
      allowed: false,
      reason: 'Pembatasan Kewenangan: Sekretaris Kelas tidak berwenang mencatat atau mengubah absensi resmi secara langsung. Gunakan fitur Pengajuan Koreksi ke Wali Kelas.'
    };
  }

  if (user.role !== 'guru' && user.role !== 'wali_kelas') {
    return {
      allowed: false,
      reason: 'Hanya Guru Pengampu atau Administrator yang berwenang mencatat presensi resmi.'
    };
  }

  if (!user.teacherId) {
    return {
      allowed: false,
      reason: 'Akun Anda belum ditautkan dengan data profil guru di sistem.'
    };
  }

  const isAssigned = teachingAssignments.some(
    ta => ta.teacherId === user.teacherId && ta.rombelId === rombelId && ta.subjectId === subjectId
  );

  if (!isAssigned) {
    return {
      allowed: false,
      reason: 'Pelanggaran Hak Akses: Anda tidak ditugaskan mengajar mata pelajaran ini pada kelas tersebut.'
    };
  }

  return { allowed: true };
}

/**
 * Policy: Check if homeroom teacher is authorized to monitor a given class
 */
export function canHomeroomMonitor(
  user: User,
  targetRombelId: string,
  rombels: Rombel[]
): { allowed: boolean; reason?: string } {
  if (user.role === 'admin') {
    return { allowed: true };
  }

  if (user.role !== 'wali_kelas') {
    return {
      allowed: false,
      reason: 'Akses khusus Wali Kelas dan Administrator.'
    };
  }

  const userHomeroom = rombels.find(r => r.homeroomTeacherId === user.teacherId);
  if (!userHomeroom || userHomeroom.id !== targetRombelId) {
    return {
      allowed: false,
      reason: `Pelanggaran Akses Lintas Rombel: Anda hanya berwenang memantau kelas binaan Anda (${userHomeroom?.name || 'Rombel Anda'}).`
    };
  }

  return { allowed: true };
}

/**
 * Policy: Check if a class secretary is authorized to access a given rombel
 */
export function canSecretaryViewRombel(
  user: User,
  targetRombelId: string
): { allowed: boolean; reason?: string } {
  if (user.role === 'admin') {
    return { allowed: true };
  }

  if (user.role !== 'sekretaris') {
    return { allowed: true }; // other roles are governed by their respective policies
  }

  if (!user.secretaryRombelId) {
    return {
      allowed: false,
      reason: 'Akun sekretaris Anda belum memiliki penugasan rombel aktif.'
    };
  }

  if (user.secretaryRombelId !== targetRombelId) {
    return {
      allowed: false,
      reason: 'Pelanggaran Hak Akses: Sekretaris Kelas hanya berwenang mengakses data rombel tempat ia ditugaskan.'
    };
  }

  return { allowed: true };
}

/**
 * Policy: Check if secretary can access a specific student's attendance
 */
export function canSecretaryAccessStudent(
  user: User,
  student: { rombelId: string }
): { allowed: boolean; reason?: string } {
  return canSecretaryViewRombel(user, student.rombelId);
}

/**
 * Policy: Check if user is authorized to assign or replace a class secretary
 */
export function canManageSecretary(
  user: User,
  rombelId: string,
  rombels: Rombel[]
): { allowed: boolean; reason?: string } {
  if (user.role === 'admin') {
    return { allowed: true };
  }

  if (user.role === 'wali_kelas') {
    const homeroom = rombels.find(r => r.id === rombelId && r.homeroomTeacherId === user.teacherId);
    if (homeroom) {
      return { allowed: true };
    }
    return {
      allowed: false,
      reason: 'Wali kelas hanya dapat menunjuk sekretaris untuk kelas binaannya sendiri.'
    };
  }

  return {
    allowed: false,
    reason: 'Hanya Administrator dan Wali Kelas yang berwenang menunjuk atau mengganti sekretaris kelas.'
  };
}

/**
 * Policy: Check if user is authorized to review/approve an attendance correction request
 */
export function canReviewCorrectionRequest(
  user: User,
  rombelId: string,
  rombels: Rombel[],
  subjectId?: string,
  teachingAssignments?: TeachingAssignment[]
): { allowed: boolean; reason?: string } {
  if (user.role === 'admin') {
    return { allowed: true };
  }

  if (user.role === 'wali_kelas') {
    const homeroom = rombels.find(r => r.id === rombelId && r.homeroomTeacherId === user.teacherId);
    if (homeroom) {
      return { allowed: true };
    }
  }

  if (user.role === 'guru' && user.teacherId && subjectId && teachingAssignments) {
    const isTeacherOfSubject = teachingAssignments.some(
      ta => ta.teacherId === user.teacherId && ta.rombelId === rombelId && ta.subjectId === subjectId
    );
    if (isTeacherOfSubject) {
      return { allowed: true };
    }
  }

  return {
    allowed: false,
    reason: 'Hanya Wali Kelas binaan, Guru pengampu mapel bersangkutan, atau Administrator yang berwenang memproses pengajuan koreksi ini.'
  };
}


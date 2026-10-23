import * as XLSX from 'xlsx';
import { 
  Student, 
  AttendanceSession, 
  AttendanceRecord, 
  Rombel, 
  Subject, 
  AttendanceStatus,
  SchoolSettings,
  Schedule
} from '../types';

export interface StudentAttendanceSummary {
  student: Student;
  hadir: number;
  sakit: number;
  izin: number;
  alpa: number;
  terlambat: number;
  dispensasi: number;
  totalValidSessions: number;
  attendanceRate: number | null; // null if no valid sessions
  rateFormatted: string; // e.g. "95.5%" or "Belum ada sesi"
}

export interface ClassSessionStatus {
  session?: AttendanceSession;
  subject: Subject;
  teacherName: string;
  period: string;
  timeRange: string;
  isRecorded: boolean;
  status: 'completed' | 'locked' | 'unrecorded' | 'cancelled';
}

/**
 * Format date to standard Indonesian DD-MM-YYYY
 */
export function formatDateIndo(dateStr?: string): string {
  if (!dateStr) return '-';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return dateStr;
}

/**
 * Format full Indonesian date with Day name (e.g., "Sabtu, 17 Oktober 2026")
 */
export function formatFullDateIndo(dateStr?: string): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;

  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

/**
 * Calculates student attendance summary for given scope
 */
export function calculateStudentAttendance(
  student: Student,
  allSessions: AttendanceSession[],
  allRecords: AttendanceRecord[],
  options?: {
    academicYearId?: string;
    month?: number; // 1-12
    year?: number;
    subjectId?: string;
    startDate?: string;
    endDate?: string;
  }
): StudentAttendanceSummary {
  // 1. Filter sessions belonging to student's rombel and matching options
  const validSessions = allSessions.filter(s => {
    if (s.rombelId !== student.rombelId) return false;
    if (s.status === 'cancelled') return false; // exclude cancelled
    if (options?.academicYearId && s.academicYearId !== options.academicYearId) return false;
    if (options?.subjectId && s.subjectId !== options.subjectId) return false;
    
    if (options?.startDate && s.date < options.startDate) return false;
    if (options?.endDate && s.date > options.endDate) return false;

    if (options?.month !== undefined && options?.year !== undefined) {
      const parts = s.date.split('-');
      const sYear = parseInt(parts[0], 10);
      const sMonth = parseInt(parts[1], 10);
      if (sYear !== options.year || sMonth !== options.month) return false;
    }

    return true;
  });

  const validSessionIds = new Set(validSessions.map(s => s.id));

  // 2. Filter records of this student in those valid sessions
  const studentRecords = allRecords.filter(r => 
    r.studentId === student.id && validSessionIds.has(r.sessionId)
  );

  let hadir = 0;
  let sakit = 0;
  let izin = 0;
  let alpa = 0;
  let terlambat = 0;
  let dispensasi = 0;

  studentRecords.forEach(r => {
    switch (r.status) {
      case 'H': hadir++; break;
      case 'S': sakit++; break;
      case 'I': izin++; break;
      case 'A': alpa++; break;
      case 'T': terlambat++; break;
      case 'D': dispensasi++; break;
    }
  });

  const totalValidRecorded = studentRecords.length;

  let attendanceRate: number | null = null;
  let rateFormatted = 'Belum ada data';

  if (totalValidRecorded > 0) {
    // Formula Section J: (Hadir / Total sesi valid tercatat) * 100
    // Dispensasi is also counted as school sanctioned absence or present depending on rules;
    // here we consider pure Hadir in the numerator and optionally dispensasi note:
    const rate = ((hadir) / totalValidRecorded) * 100;
    attendanceRate = Math.round(rate * 10) / 10;
    rateFormatted = `${attendanceRate.toFixed(1)}%`;
  }

  return {
    student,
    hadir,
    sakit,
    izin,
    alpa,
    terlambat,
    dispensasi,
    totalValidSessions: totalValidRecorded,
    attendanceRate,
    rateFormatted
  };
}

/**
 * Metric 2: Calculates teacher attendance compliance rate
 * (Jumlah sesi yang sudah diisi / Sesi yang seharusnya diisi) * 100%
 */
export function calculateTeacherComplianceRate(
  teacherId: string,
  allSessions: AttendanceSession[],
  allSchedules: Schedule[],
  academicYearId: string
): {
  recordedCount: number;
  expectedWeeklyCount: number;
  compliancePercentage: number | null;
  complianceFormatted: string;
} {
  const teacherSchedules = allSchedules.filter(
    sch => sch.teacherId === teacherId && sch.academicYearId === academicYearId
  );
  
  const teacherSessions = allSessions.filter(
    s => s.teacherId === teacherId && s.academicYearId === academicYearId && s.status !== 'cancelled'
  );

  const recordedCount = teacherSessions.length;
  // If schedule has 5 slots per week, over a typical 16-week semester, expected is schedules.length * weeks elapsed.
  // We can measure against weekly baseline or recorded sessions directly:
  const expectedWeeklyCount = teacherSchedules.length;

  let compliancePercentage: number | null = null;
  let complianceFormatted = 'Belum ada jadwal';

  if (expectedWeeklyCount > 0) {
    // Sesi tercatat vs target minimal
    const rate = Math.min(100, Math.round((recordedCount / (expectedWeeklyCount * 4)) * 100)); // monthly benchmark
    compliancePercentage = rate;
    complianceFormatted = `${rate}%`;
  }

  return {
    recordedCount,
    expectedWeeklyCount,
    compliancePercentage,
    complianceFormatted
  };
}

/**
 * Export generic tabular data to real XLSX format and trigger browser download
 */
export function exportToExcel(
  filename: string,
  sheets: Array<{ sheetName: string; data: Record<string, any>[] }>
) {
  const wb = XLSX.utils.book_new();

  sheets.forEach(({ sheetName, data }) => {
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, sheetName.substring(0, 31)); // max sheet name length
  });

  XLSX.writeFile(wb, `${filename}.xlsx`);
}

/**
 * Export data to CSV format
 */
export function exportToCSV(filename: string, headers: string[], rows: (string | number)[][]) {
  const escapeCsv = (val: string | number) => {
    const str = String(val ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const csvContent = [
    headers.map(escapeCsv).join(','),
    ...rows.map(row => row.map(escapeCsv).join(','))
  ].join('\n');

  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}


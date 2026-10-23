import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { 
  FileSpreadsheet, 
  Printer, 
  Download, 
  Calendar, 
  Users, 
  Filter, 
  BookOpen, 
  ChevronRight,
  School,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { 
  formatDateIndo, 
  formatFullDateIndo, 
  calculateStudentAttendance,
  exportToExcel,
  exportToCSV
} from '../utils/attendanceCalculations';
import { AttendanceStatus, Student } from '../types';

export const ReportsView: React.FC = () => {
  const { 
    currentUser,
    students, 
    rombels, 
    departments, 
    subjects, 
    teachers, 
    sessions, 
    records, 
    academicYears, 
    activeAcademicYear, 
    settings 
  } = useApp();

  // Active Report Tab: 'daily' | 'monthly' | 'yearly' | 'student' | 'teacher'
  const [activeTab, setActiveTab] = useState<'daily' | 'monthly' | 'yearly' | 'student' | 'teacher'>('daily');

  // Common Filters - Strictly isolate if current user is sekretaris
  const assignedRombelId = currentUser.role === 'sekretaris' 
    ? (currentUser.secretaryRombelId || rombels[0]?.id || '') 
    : (rombels[0]?.id || '');

  const [selectedRombelId, setSelectedRombelId] = useState<string>(assignedRombelId);
  const effectiveRombelId = currentUser.role === 'sekretaris' ? assignedRombelId : selectedRombelId;
  const [selectedDeptId, setSelectedDeptId] = useState<string>('all');
  
  // Available rombels for dropdown
  const allowedRombels = useMemo(() => {
    if (currentUser.role === 'sekretaris') {
      return rombels.filter(r => r.id === assignedRombelId);
    }
    return rombels;
  }, [rombels, currentUser, assignedRombelId]);

  // Daily Filter
  const [dailyDate, setDailyDate] = useState<string>('2026-10-17'); // Context current date

  // Monthly Filter
  const [monthlyMonth, setMonthlyMonth] = useState<number>(10); // Oktober
  const [monthlyYear, setMonthlyYear] = useState<number>(2026);
  const [monthlySubjectId, setMonthlySubjectId] = useState<string>('all');
  const [hadirSymbol, setHadirSymbol] = useState<'.' | 'H'>('.');
  const [monthDateMode, setMonthDateMode] = useState<'recorded_only' | 'all_days'>('recorded_only');

  // Yearly Filter
  const [selectedAcademicYearId, setSelectedAcademicYearId] = useState<string>(activeAcademicYear.id);

  // Student Filter (Only students from assigned class if sekretaris)
  const allowedStudents = useMemo(() => {
    if (currentUser.role === 'sekretaris') {
      return students.filter(s => s.rombelId === assignedRombelId);
    }
    return students;
  }, [students, currentUser, assignedRombelId]);

  const [selectedStudentId, setSelectedStudentId] = useState<string>(allowedStudents[0]?.id || students[0]?.id || '');

  // Teacher Filter
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(teachers[0]?.id || '');

  const activeRombel = rombels.find(r => r.id === effectiveRombelId) || rombels[0];
  const activeStudent = students.find(s => s.id === selectedStudentId) || allowedStudents[0] || students[0];
  const activeTeacher = teachers.find(t => t.id === selectedTeacherId) || teachers[0];

  // Month names in Indonesian
  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const dayNamesShort = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

  // 1. DATA LAPORAN HARIAN
  const dailyData = useMemo(() => {
    // Sesi-sesi pada hari tersebut untuk rombel terpilih
    const daySessions = sessions.filter(
      s => s.date === dailyDate && s.rombelId === effectiveRombelId && s.status !== 'cancelled'
    );

    const rombelStudents = students.filter(s => s.rombelId === effectiveRombelId && s.status === 'active');

    // Matrix: student -> array of { session, record }
    const rows = rombelStudents.map(st => {
      const sessionRecords = daySessions.map(session => {
        const rec = records.find(r => r.sessionId === session.id && r.studentId === st.id);
        return {
          session,
          status: rec ? rec.status : ('-' as const),
          note: rec?.note || ''
        };
      });

      // Daily totals for this student
      let h = 0, s = 0, i = 0, a = 0, t = 0, d = 0;
      sessionRecords.forEach(sr => {
        if (sr.status === 'H') h++;
        else if (sr.status === 'S') s++;
        else if (sr.status === 'I') i++;
        else if (sr.status === 'A') a++;
        else if (sr.status === 'T') t++;
        else if (sr.status === 'D') d++;
      });

      return {
        student: st,
        sessionRecords,
        h, s, i, a, t, d
      };
    });

    return {
      daySessions,
      rombelStudents,
      rows
    };
  }, [dailyDate, effectiveRombelId, sessions, records, students]);

  // 2. DATA LAPORAN BULANAN (MATRIKS TANGGAL & STATUS H/./S/I/A)
  const monthlyData = useMemo(() => {
    const rombelStudents = students.filter(s => s.rombelId === effectiveRombelId && s.status === 'active');

    // Filter sessions in this month for this rombel
    const monthSessions = sessions.filter(s => {
      if (s.rombelId !== effectiveRombelId || s.status === 'cancelled') return false;
      if (monthlySubjectId !== 'all' && s.subjectId !== monthlySubjectId) return false;
      const parts = s.date.split('-');
      return parseInt(parts[0], 10) === monthlyYear && parseInt(parts[1], 10) === monthlyMonth;
    }).sort((a, b) => a.date.localeCompare(b.date));

    // Determine list of dates to show in columns
    const daysInMonth = new Date(monthlyYear, monthlyMonth, 0).getDate();
    const recordedDates = Array.from(new Set(monthSessions.map(s => s.date))).sort();
    
    let datesToShow: string[] = [];
    if (monthDateMode === 'all_days') {
      for (let d = 1; d <= daysInMonth; d++) {
        const dd = String(d).padStart(2, '0');
        const mm = String(monthlyMonth).padStart(2, '0');
        datesToShow.push(`${monthlyYear}-${mm}-${dd}`);
      }
    } else {
      datesToShow = recordedDates;
    }

    // For each student, compute attendance status per date and totals
    const matrixRows = rombelStudents.map(student => {
      let h = 0, s = 0, i = 0, a = 0, t = 0, d = 0;
      const dateMap: Record<string, { status: string; rawStatus: string; isHoliday: boolean }> = {};

      datesToShow.forEach(dateStr => {
        const dayOfWeek = new Date(dateStr).getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

        const sessionsOnDate = monthSessions.filter(sess => sess.date === dateStr);
        if (sessionsOnDate.length === 0) {
          dateMap[dateStr] = { status: isWeekend ? 'L' : '-', rawStatus: '-', isHoliday: true };
          return;
        }

        const sessionIdsOnDate = new Set(sessionsOnDate.map(sess => sess.id));
        const recs = records.filter(r => r.studentId === student.id && sessionIdsOnDate.has(r.sessionId));

        if (recs.length === 0) {
          dateMap[dateStr] = { status: '-', rawStatus: '-', isHoliday: false };
          return;
        }

        const hasA = recs.some(r => r.status === 'A');
        const hasS = recs.some(r => r.status === 'S');
        const hasI = recs.some(r => r.status === 'I');
        const hasT = recs.some(r => r.status === 'T');
        const hasD = recs.some(r => r.status === 'D');

        if (hasA) {
          a++;
          dateMap[dateStr] = { status: 'A', rawStatus: 'A', isHoliday: false };
        } else if (hasS) {
          s++;
          dateMap[dateStr] = { status: 'S', rawStatus: 'S', isHoliday: false };
        } else if (hasI) {
          i++;
          dateMap[dateStr] = { status: 'I', rawStatus: 'I', isHoliday: false };
        } else if (hasT) {
          t++;
          dateMap[dateStr] = { status: 'T', rawStatus: 'T', isHoliday: false };
        } else if (hasD) {
          d++;
          dateMap[dateStr] = { status: 'D', rawStatus: 'D', isHoliday: false };
        } else {
          h++;
          dateMap[dateStr] = { status: hadirSymbol, rawStatus: 'H', isHoliday: false };
        }
      });

      const totalRecorded = h + s + i + a + t + d;
      const rate = totalRecorded > 0 ? (h / totalRecorded) * 100 : 0;
      const rateFormatted = totalRecorded > 0 ? `${rate.toFixed(1)}%` : '0.0%';

      return {
        student,
        dateMap,
        h,
        s,
        i,
        a,
        t,
        d,
        totalRecorded,
        rate,
        rateFormatted
      };
    });

    // Calculate per-date totals across students for footer
    const perDateTotals: Record<string, { h: number; s: number; i: number; a: number }> = {};
    datesToShow.forEach(dateStr => {
      let countH = 0, countS = 0, countI = 0, countA = 0;
      matrixRows.forEach(r => {
        const item = r.dateMap[dateStr];
        if (item) {
          if (item.rawStatus === 'H') countH++;
          else if (item.rawStatus === 'S') countS++;
          else if (item.rawStatus === 'I') countI++;
          else if (item.rawStatus === 'A') countA++;
        }
      });
      perDateTotals[dateStr] = { h: countH, s: countS, i: countI, a: countA };
    });

    // Grand totals
    const grandTotals = {
      h: matrixRows.reduce((acc, r) => acc + r.h, 0),
      s: matrixRows.reduce((acc, r) => acc + r.s, 0),
      i: matrixRows.reduce((acc, r) => acc + r.i, 0),
      a: matrixRows.reduce((acc, r) => acc + r.a, 0)
    };

    const summaries = rombelStudents.map(student => {
      return calculateStudentAttendance(student, sessions, records, {
        month: monthlyMonth,
        year: monthlyYear,
        subjectId: monthlySubjectId === 'all' ? undefined : monthlySubjectId
      });
    }).sort((a, b) => b.alpa - a.alpa);

    return {
      monthSessions,
      datesToShow,
      matrixRows,
      perDateTotals,
      grandTotals,
      summaries
    };
  }, [effectiveRombelId, monthlySubjectId, monthlyMonth, monthlyYear, monthDateMode, hadirSymbol, students, sessions, records]);

  // 3. DATA LAPORAN TAHUNAN / SEMESTER
  const yearlyData = useMemo(() => {
    const rombelStudents = students.filter(s => s.rombelId === effectiveRombelId && s.status === 'active');

    const summaries = rombelStudents.map(student => {
      return calculateStudentAttendance(student, sessions, records, {
        academicYearId: selectedAcademicYearId
      });
    }).sort((a, b) => b.alpa - a.alpa);

    return {
      summaries
    };
  }, [effectiveRombelId, selectedAcademicYearId, students, sessions, records]);

  // 4. DATA LAPORAN PER SISWA
  const studentData = useMemo(() => {
    if (!activeStudent) return null;

    const stats = calculateStudentAttendance(activeStudent, sessions, records, {
      academicYearId: selectedAcademicYearId
    });

    const history = records
      .filter(r => r.studentId === activeStudent.id)
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
      .filter(item => item.session && (!selectedAcademicYearId || item.session.academicYearId === selectedAcademicYearId))
      .sort((a, b) => (b.session?.date || '').localeCompare(a.session?.date || ''));

    return { stats, history };
  }, [activeStudent, sessions, records, subjects, teachers, selectedAcademicYearId]);

  // 5. DATA LAPORAN GURU & BEBAN MENGAJAR
  const teacherData = useMemo(() => {
    if (!activeTeacher) return null;

    const teacherSessions = sessions.filter(s => s.teacherId === activeTeacher.id);

    // Group sessions by subject and class
    const sessionSummaryByMapel = teacherSessions.map(s => {
      const r = rombels.find(rm => rm.id === s.rombelId);
      const subj = subjects.find(sb => sb.id === s.subjectId);
      const sessionRecs = records.filter(rec => rec.sessionId === s.id);
      let h = 0, a = 0;
      sessionRecs.forEach(rc => {
        if (rc.status === 'H') h++;
        else if (rc.status === 'A') a++;
      });
      return {
        session: s,
        rombelName: r?.name || s.rombelId,
        subjectName: subj?.name || s.subjectId,
        totalSiswa: sessionRecs.length,
        hadir: h,
        alpa: a
      };
    });

    return {
      teacherSessions,
      sessionSummaryByMapel
    };
  }, [activeTeacher, sessions, records, rombels, subjects]);

  // EXPORT EXCEL HANDLER
  const handleExportExcel = () => {
    if (activeTab === 'daily') {
      const data = dailyData.rows.map((row, idx) => {
        const item: Record<string, any> = {
          'No': idx + 1,
          'NIS': row.student.nis,
          'Nama Siswa': row.student.name,
          'JK': row.student.gender
        };
        dailyData.daySessions.forEach((s, sIdx) => {
          const subj = subjects.find(sub => sub.id === s.subjectId);
          item[`Sesi ${sIdx + 1} (${subj?.code || 'Mapel'})`] = row.sessionRecords[sIdx]?.status || '-';
        });
        item['Total H'] = row.h;
        item['Total S'] = row.s;
        item['Total I'] = row.i;
        item['Total A'] = row.a;
        item['Total T'] = row.t;
        item['Total D'] = row.d;
        return item;
      });

      exportToExcel(`Laporan_Presensi_Harian_${activeRombel?.code}_${dailyDate}`, [
        { sheetName: 'Presensi Harian', data }
      ]);
    } else if (activeTab === 'monthly') {
      const data = monthlyData.matrixRows.map((row, idx) => {
        const item: Record<string, any> = {
          'No': idx + 1,
          'NIS': row.student.nis,
          'Nama Siswa': row.student.name,
          'JK': row.student.gender
        };

        monthlyData.datesToShow.forEach(dateStr => {
          const dayNum = dateStr.substring(8);
          item[`Tgl ${dayNum}`] = row.dateMap[dateStr]?.status || '-';
        });

        item['Hadir (H)'] = row.h;
        item['Sakit (S)'] = row.s;
        item['Izin (I)'] = row.i;
        item['Alpa (A)'] = row.a;
        item['Total Kehadiran'] = row.h;
        item['Persentase Kehadiran'] = row.rateFormatted;
        return item;
      });

      exportToExcel(`Laporan_Presensi_Bulanan_Matriks_${activeRombel?.code}_${monthNames[monthlyMonth - 1]}_${monthlyYear}`, [
        { sheetName: 'Buku Presensi Bulanan', data }
      ]);
    } else if (activeTab === 'yearly') {
      const data = yearlyData.summaries.map((s, idx) => ({
        'No': idx + 1,
        'NIS': s.student.nis,
        'Nama Siswa': s.student.name,
        'JK': s.student.gender,
        'Hadir (H)': s.hadir,
        'Sakit (S)': s.sakit,
        'Izin (I)': s.izin,
        'Alpa (A)': s.alpa,
        'Terlambat (T)': s.terlambat,
        'Dispensasi (D)': s.dispensasi,
        'Total Pertemuan': s.totalValidSessions,
        'Persentase Kehadiran': s.rateFormatted
      }));

      exportToExcel(`Laporan_Presensi_Tahunan_${activeRombel?.code}_${activeAcademicYear.name.replace('/', '-')}`, [
        { sheetName: 'Rekap Tahunan', data }
      ]);
    } else if (activeTab === 'student' && studentData) {
      const data = studentData.history.map((h, idx) => ({
        'No': idx + 1,
        'Tanggal': formatDateIndo(h.session?.date),
        'Mata Pelajaran': h.subject?.name,
        'Guru Pengampu': h.teacher?.name,
        'Pertemuan': `Ke-${h.session?.meetingNumber}`,
        'Status': h.record.status,
        'Catatan / Alasan': h.record.note || '-'
      }));

      exportToExcel(`Kartu_Presensi_${activeStudent?.nis}_${activeStudent?.name.replace(/\s+/g, '_')}`, [
        { sheetName: 'Riwayat Siswa', data }
      ]);
    } else if (activeTab === 'teacher' && teacherData) {
      const data = teacherData.sessionSummaryByMapel.map((item, idx) => ({
        'No': idx + 1,
        'Tanggal': formatDateIndo(item.session.date),
        'Kelas': item.rombelName,
        'Mata Pelajaran': item.subjectName,
        'Pertemuan Ke': item.session.meetingNumber,
        'Materi': item.session.topic || '-',
        'Jumlah Siswa': item.totalSiswa,
        'Hadir': item.hadir,
        'Alpa': item.alpa
      }));

      exportToExcel(`Laporan_Mengajar_${activeTeacher?.name.replace(/\s+/g, '_')}`, [
        { sheetName: 'Beban Mengajar', data }
      ]);
    }
  };

  // EXPORT CSV HANDLER
  const handleExportCSV = () => {
    if (activeTab === 'monthly') {
      const headers = ['No', 'NIS', 'Nama', 'JK', 'Hadir', 'Sakit', 'Izin', 'Alpa', 'Terlambat', 'Dispensasi', 'Total Sesi', 'Persentase'];
      const rows = monthlyData.summaries.map((s, idx) => [
        idx + 1, s.student.nis, s.student.name, s.student.gender, s.hadir, s.sakit, s.izin, s.alpa, s.terlambat, s.dispensasi, s.totalValidSessions, s.rateFormatted
      ]);
      exportToCSV(`Laporan_Bulanan_${activeRombel?.code}`, headers, rows);
    } else {
      handleExportExcel();
    }
  };

  // PRINT HANDLER
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      
      {/* Controls & Nav Ribbon (Hidden on print) */}
      <div className="no-print space-y-4">
        {/* Title Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Modul Pelaporan Resmi
                </span>
                <span className="text-xs text-slate-400">·</span>
                <span className="text-xs text-slate-500 font-medium">Format Sesuai Aturan Seksi I & J</span>
              </div>
              <h1 className="text-xl font-bold text-slate-900 mt-1">
                Laporan & Rekapitulasi Presensi Kehadiran Siswa
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Pilih periode pelaporan untuk melihat rekapitulasi, cetak dokumen resmi (Kop Surat SMK), atau ekspor ke Excel
              </p>
            </div>

            {/* Print & Export Actions */}
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                onClick={handleExportCSV}
                className="px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg flex items-center gap-1.5 transition-colors"
                title="Unduh file CSV"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                CSV
              </button>
              <button
                onClick={handleExportExcel}
                className="px-3.5 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg flex items-center gap-1.5 transition-colors"
                title="Unduh file Excel (.xlsx) asli"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                Ekspor Excel (.xlsx)
              </button>
              <button
                onClick={handlePrint}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                Cetak / Simpan PDF
              </button>
            </div>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
          {[
            { id: 'daily', label: '1. Laporan Harian' },
            { id: 'monthly', label: '2. Laporan Bulanan' },
            { id: 'yearly', label: '3. Laporan Semester / Tahunan' },
            { id: 'student', label: '4. Rekap Individual Siswa' },
            ...(currentUser.role !== 'sekretaris' ? [{ id: 'teacher', label: '5. Laporan Beban Guru' }] : [])
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Filter Toolbar Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex flex-wrap items-center gap-4 text-xs">
            {/* Rombel Filter for Tabs 1, 2, 3 */}
            {(activeTab === 'daily' || activeTab === 'monthly' || activeTab === 'yearly') && (
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-700">Rombel:</span>
                <select
                  value={selectedRombelId}
                  disabled={currentUser.role === 'sekretaris'}
                  onChange={e => setSelectedRombelId(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 font-medium text-slate-800 disabled:opacity-85 disabled:cursor-not-allowed"
                >
                  {allowedRombels.map(r => (
                    <option key={r.id} value={r.id}>{r.name} ({r.code})</option>
                  ))}
                </select>
                {currentUser.role === 'sekretaris' && (
                  <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-medium">
                    Terkunci ke Rombel Penugasan
                  </span>
                )}
              </div>
            )}

            {/* Daily Date Filter */}
            {activeTab === 'daily' && (
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-700">Tanggal:</span>
                <input
                  type="date"
                  value={dailyDate}
                  onChange={e => setDailyDate(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 font-mono-tabular text-slate-800"
                />
              </div>
            )}

            {/* Monthly Month & Year & Options */}
            {activeTab === 'monthly' && (
              <>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-700">Bulan:</span>
                  <select
                    value={monthlyMonth}
                    onChange={e => setMonthlyMonth(parseInt(e.target.value, 10))}
                    className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800"
                  >
                    {monthNames.map((name, idx) => (
                      <option key={idx + 1} value={idx + 1}>{name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-700">Tahun:</span>
                  <input
                    type="number"
                    value={monthlyYear}
                    onChange={e => setMonthlyYear(parseInt(e.target.value, 10))}
                    className="w-20 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 font-mono-tabular text-slate-800"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-700">Mata Pelajaran:</span>
                  <select
                    value={monthlySubjectId}
                    onChange={e => setMonthlySubjectId(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 max-w-xs"
                  >
                    <option value="all">Semua Mata Pelajaran (Presensi Harian Kelas)</option>
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-700">Simbol Hadir:</span>
                  <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
                    <button
                      type="button"
                      onClick={() => setHadirSymbol('.')}
                      className={`px-2 py-1 text-xs font-bold rounded transition-colors ${
                        hadirSymbol === '.' ? 'bg-white shadow-xs text-indigo-700' : 'text-slate-600'
                      }`}
                      title="Tampilkan Hadir sebagai tanda titik ( . )"
                    >
                      Titik ( . )
                    </button>
                    <button
                      type="button"
                      onClick={() => setHadirSymbol('H')}
                      className={`px-2 py-1 text-xs font-bold rounded transition-colors ${
                        hadirSymbol === 'H' ? 'bg-white shadow-xs text-indigo-700' : 'text-slate-600'
                      }`}
                      title="Tampilkan Hadir sebagai huruf ( H )"
                    >
                      Huruf ( H )
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-700">Kolom Tanggal:</span>
                  <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
                    <button
                      type="button"
                      onClick={() => setMonthDateMode('recorded_only')}
                      className={`px-2 py-1 text-xs font-semibold rounded transition-colors ${
                        monthDateMode === 'recorded_only' ? 'bg-white shadow-xs text-indigo-700' : 'text-slate-600'
                      }`}
                    >
                      Hari Pembelajaran Saja
                    </button>
                    <button
                      type="button"
                      onClick={() => setMonthDateMode('all_days')}
                      className={`px-2 py-1 text-xs font-semibold rounded transition-colors ${
                        monthDateMode === 'all_days' ? 'bg-white shadow-xs text-indigo-700' : 'text-slate-600'
                      }`}
                    >
                      Kalender (1 - 31)
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Academic Year Filter */}
            {(activeTab === 'yearly' || activeTab === 'student') && (
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-700">Tahun Ajaran:</span>
                <select
                  value={selectedAcademicYearId}
                  onChange={e => setSelectedAcademicYearId(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800"
                >
                  {academicYears.map(ay => (
                    <option key={ay.id} value={ay.id}>{ay.name} - Semester {ay.semester}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Student Picker */}
            {activeTab === 'student' && (
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-700">Pilih Siswa:</span>
                <select
                  value={selectedStudentId}
                  onChange={e => setSelectedStudentId(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 max-w-xs"
                >
                  {allowedStudents.map(st => (
                    <option key={st.id} value={st.id}>
                      {st.name} ({st.nis} - {st.rombelCode})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Teacher Picker */}
            {activeTab === 'teacher' && (
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-700">Pilih Guru:</span>
                <select
                  value={selectedTeacherId}
                  onChange={e => setSelectedTeacherId(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 max-w-xs"
                >
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.name} (NIP: {t.nip})</option>
                  ))}
                </select>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* PRINT-READY CONTAINER WITH KOP SURAT SMK */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 print:border-none print:p-0 print:shadow-none print-break-inside-avoid">
        
        {/* Official School Letterhead (KOP SURAT) */}
        <div className="border-b-2 border-slate-900 pb-3 mb-4 text-center">
          <div className="flex items-center justify-center gap-4">
            <div className="w-16 h-16 rounded bg-slate-900 text-white flex items-center justify-center font-bold text-xl print:border print:border-black shrink-0">
              SMK
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                PEMERINTAH DAERAH PROVINSI {settings.schoolProvince.toUpperCase()}
              </h2>
              <h1 className="text-lg font-black text-slate-950 uppercase tracking-tight">
                {settings.schoolName}
              </h1>
              <p className="text-xs text-slate-600 mt-0.5">
                NPSN: {settings.schoolNpsn} · {settings.schoolAddress}, {settings.schoolCity}
              </p>
            </div>
          </div>
          <div className="w-full border-b border-slate-400 mt-3" />
        </div>

        {/* 1. VIEW TAB: LAPORAN HARIAN */}
        {activeTab === 'daily' && (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-base font-bold text-slate-900 uppercase tracking-tight">
                Laporan Presensi Harian Siswa
              </h3>
              <p className="text-xs text-slate-600">
                Hari/Tanggal: <span className="font-semibold text-slate-900">{formatFullDateIndo(dailyDate)}</span> · Rombel: <span className="font-semibold text-slate-900">{activeRombel?.name}</span> · Wali Kelas: {activeRombel?.homeroomTeacherName}
              </p>
            </div>

            {dailyData.daySessions.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                Tidak ada sesi presensi mata pelajaran yang tercatat pada tanggal {formatDateIndo(dailyDate)} untuk kelas {activeRombel?.name}.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border border-slate-200">
                  <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-2.5 border-r border-slate-200 w-8 text-center">No</th>
                      <th className="py-2 px-2.5 border-r border-slate-200 w-24">NIS</th>
                      <th className="py-2 px-2.5 border-r border-slate-200">Nama Siswa</th>
                      <th className="py-2 px-2.5 border-r border-slate-200 w-8 text-center">JK</th>
                      {dailyData.daySessions.map((s, idx) => {
                        const subj = subjects.find(sub => sub.id === s.subjectId);
                        const tch = teachers.find(t => t.id === s.teacherId);
                        return (
                          <th key={s.id} className="py-2 px-2 border-r border-slate-200 text-center max-w-[120px]">
                            <div className="font-bold text-slate-900 truncate">{subj?.name}</div>
                            <div className="text-[10px] text-slate-500 font-normal truncate">{tch?.name}</div>
                            <div className="text-[9px] text-slate-400 font-normal">P.{s.meetingNumber}</div>
                          </th>
                        );
                      })}
                      <th className="py-2 px-2 text-center w-8 bg-emerald-50 text-emerald-900 border-r border-slate-200">H</th>
                      <th className="py-2 px-2 text-center w-8 bg-sky-50 text-sky-900 border-r border-slate-200">S</th>
                      <th className="py-2 px-2 text-center w-8 bg-indigo-50 text-indigo-900 border-r border-slate-200">I</th>
                      <th className="py-2 px-2 text-center w-8 bg-rose-50 text-rose-900 border-r border-slate-200">A</th>
                      <th className="py-2 px-2 text-center w-8 bg-amber-50 text-amber-900 border-r border-slate-200">T</th>
                      <th className="py-2 px-2 text-center w-8 bg-purple-50 text-purple-900">D</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {dailyData.rows.map((row, idx) => (
                      <tr key={row.student.id} className="hover:bg-slate-50">
                        <td className="py-2 px-2.5 text-center font-mono-tabular border-r border-slate-200">{idx + 1}</td>
                        <td className="py-2 px-2.5 font-mono-tabular border-r border-slate-200 text-slate-600">{row.student.nis}</td>
                        <td className="py-2 px-2.5 font-semibold text-slate-900 border-r border-slate-200">{row.student.name}</td>
                        <td className="py-2 px-2.5 text-center font-mono-tabular border-r border-slate-200">{row.student.gender}</td>
                        {row.sessionRecords.map((sr, sIdx) => {
                          let badgeBg = 'text-slate-400';
                          if (sr.status === 'H') badgeBg = 'font-bold text-emerald-700 bg-emerald-50';
                          else if (sr.status === 'S') badgeBg = 'font-bold text-sky-700 bg-sky-50';
                          else if (sr.status === 'I') badgeBg = 'font-bold text-indigo-700 bg-indigo-50';
                          else if (sr.status === 'A') badgeBg = 'font-bold text-rose-700 bg-rose-50';
                          else if (sr.status === 'T') badgeBg = 'font-bold text-amber-700 bg-amber-50';
                          else if (sr.status === 'D') badgeBg = 'font-bold text-purple-700 bg-purple-50';

                          return (
                            <td key={sIdx} className={`py-2 px-2 text-center border-r border-slate-200 font-mono-tabular ${badgeBg}`}>
                              {sr.status}
                            </td>
                          );
                        })}
                        <td className="py-2 px-2 text-center font-mono-tabular font-bold text-emerald-800 bg-emerald-50/50 border-r border-slate-200">{row.h}</td>
                        <td className="py-2 px-2 text-center font-mono-tabular font-bold text-sky-800 bg-sky-50/50 border-r border-slate-200">{row.s}</td>
                        <td className="py-2 px-2 text-center font-mono-tabular font-bold text-indigo-800 bg-indigo-50/50 border-r border-slate-200">{row.i}</td>
                        <td className="py-2 px-2 text-center font-mono-tabular font-bold text-rose-800 bg-rose-50/50 border-r border-slate-200">{row.a}</td>
                        <td className="py-2 px-2 text-center font-mono-tabular font-bold text-amber-800 bg-amber-50/50 border-r border-slate-200">{row.t}</td>
                        <td className="py-2 px-2 text-center font-mono-tabular font-bold text-purple-800 bg-purple-50/50">{row.d}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 2. VIEW TAB: LAPORAN BULANAN (MATRIKS BUKU ABSENSI PER TANGGAL) */}
        {activeTab === 'monthly' && (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-base font-bold text-slate-900 uppercase tracking-tight">
                Buku Rekapitulasi Presensi Bulanan Siswa (Matriks Tanggal)
              </h3>
              <p className="text-xs text-slate-600">
                Bulan: <span className="font-semibold text-slate-900">{monthNames[monthlyMonth - 1]} {monthlyYear}</span> · Kelas: <span className="font-semibold text-slate-900">{activeRombel?.name}</span> · Mapel: <span className="font-semibold text-slate-900">{monthlySubjectId === 'all' ? 'Semua Mata Pelajaran' : subjects.find(s => s.id === monthlySubjectId)?.name}</span> · Wali Kelas: {activeRombel?.homeroomTeacherName}
              </p>
            </div>

            {/* Legend & Summary Ribbon */}
            <div className="no-print flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-semibold text-slate-700">Keterangan Status:</span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-5 h-5 rounded bg-emerald-50 text-emerald-800 font-extrabold flex items-center justify-center border border-emerald-200">
                    {hadirSymbol}
                  </span>
                  <span>Hadir ({hadirSymbol})</span>
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-5 h-5 rounded bg-sky-50 text-sky-800 font-bold flex items-center justify-center border border-sky-200">
                    S
                  </span>
                  <span>Sakit</span>
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-5 h-5 rounded bg-indigo-50 text-indigo-800 font-bold flex items-center justify-center border border-indigo-200">
                    I
                  </span>
                  <span>Izin</span>
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-5 h-5 rounded bg-rose-50 text-rose-800 font-bold flex items-center justify-center border border-rose-200">
                    A
                  </span>
                  <span>Alpa</span>
                </span>
                <span className="text-slate-400">·</span>
                <span className="text-slate-500">- : Tidak ada jam / libur</span>
              </div>

              <div className="flex items-center gap-2 font-mono-tabular">
                <span className="font-semibold text-slate-600">Total Hari Pembelajaran:</span>
                <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                  {monthlyData.datesToShow.length} Hari
                </span>
              </div>
            </div>

            {monthlyData.datesToShow.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                Tidak ada data sesi presensi untuk kelas {activeRombel?.name} pada bulan {monthNames[monthlyMonth - 1]} {monthlyYear}.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border border-slate-200 border-collapse">
                  <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th rowSpan={2} className="py-2 px-2 border border-slate-200 w-8 text-center">No</th>
                      <th rowSpan={2} className="py-2 px-2 border border-slate-200 w-24">NIS</th>
                      <th rowSpan={2} className="py-2 px-2 border border-slate-200 min-w-[140px]">Nama Siswa</th>
                      <th rowSpan={2} className="py-2 px-1 border border-slate-200 w-7 text-center">JK</th>
                      
                      {/* Tanggal Headers Group */}
                      <th colSpan={monthlyData.datesToShow.length} className="py-1.5 px-2 border border-slate-200 text-center bg-slate-50 text-[11px] font-bold">
                        Tanggal Kehadiran ({monthNames[monthlyMonth - 1]} {monthlyYear})
                      </th>

                      {/* Summary Headers Group */}
                      <th colSpan={6} className="py-1.5 px-2 border border-slate-200 text-center bg-indigo-50 text-indigo-950 text-[11px] font-bold">
                        Jumlah / Total
                      </th>
                    </tr>

                    <tr>
                      {/* Subheaders for each date */}
                      {monthlyData.datesToShow.map(dateStr => {
                        const dayNum = dateStr.substring(8);
                        const dayIndex = new Date(dateStr).getDay();
                        const isSunday = dayIndex === 0;
                        return (
                          <th 
                            key={dateStr} 
                            className={`py-1 px-1 border border-slate-200 text-center min-w-[26px] max-w-[32px] ${
                              isSunday ? 'bg-rose-50 text-rose-700' : 'bg-slate-50'
                            }`}
                            title={`Tanggal ${formatDateIndo(dateStr)}`}
                          >
                            <div className="font-bold text-[11px] font-mono-tabular leading-tight">{dayNum}</div>
                            <div className="text-[9px] text-slate-400 font-normal leading-none">{dayNamesShort[dayIndex]}</div>
                          </th>
                        );
                      })}

                      {/* Subheaders for totals */}
                      <th className="py-1 px-1.5 border border-slate-200 text-center w-8 bg-emerald-50 text-emerald-950 font-bold">H</th>
                      <th className="py-1 px-1.5 border border-slate-200 text-center w-8 bg-sky-50 text-sky-950 font-bold">S</th>
                      <th className="py-1 px-1.5 border border-slate-200 text-center w-8 bg-indigo-50 text-indigo-950 font-bold">I</th>
                      <th className="py-1 px-1.5 border border-slate-200 text-center w-8 bg-rose-50 text-rose-950 font-bold">A</th>
                      <th className="py-1 px-2 border border-slate-200 text-center w-12 bg-slate-200 text-slate-900 font-bold">Total</th>
                      <th className="py-1 px-2 border border-slate-200 text-center w-14 bg-slate-900 text-white font-bold">%</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-200">
                    {monthlyData.matrixRows.map((row, idx) => (
                      <tr key={row.student.id} className="hover:bg-slate-50">
                        <td className="py-1.5 px-2 text-center font-mono-tabular border border-slate-200 text-slate-400">{idx + 1}</td>
                        <td className="py-1.5 px-2 font-mono-tabular border border-slate-200 text-slate-600">{row.student.nis}</td>
                        <td className="py-1.5 px-2 font-semibold text-slate-900 border border-slate-200 truncate">{row.student.name}</td>
                        <td className="py-1.5 px-1 text-center font-mono-tabular border border-slate-200 text-slate-500">{row.student.gender}</td>

                        {/* Each Date Cell */}
                        {monthlyData.datesToShow.map(dateStr => {
                          const cell = row.dateMap[dateStr];
                          const raw = cell ? cell.rawStatus : '-';
                          let cellContent = cell ? cell.status : '-';
                          let cellClass = 'text-slate-300 font-mono-tabular';

                          if (raw === 'H') {
                            cellClass = 'text-emerald-700 font-bold bg-emerald-50/40 font-mono-tabular';
                          } else if (raw === 'S') {
                            cellClass = 'text-sky-700 font-bold bg-sky-50 font-mono-tabular';
                          } else if (raw === 'I') {
                            cellClass = 'text-indigo-700 font-bold bg-indigo-50 font-mono-tabular';
                          } else if (raw === 'A') {
                            cellClass = 'text-rose-700 font-black bg-rose-100 font-mono-tabular';
                          }

                          return (
                            <td 
                              key={dateStr} 
                              className={`py-1 px-0.5 text-center border border-slate-200 text-xs ${cellClass}`}
                            >
                              {cellContent === '.' ? (
                                <span className="text-emerald-700 font-black text-sm">·</span>
                              ) : (
                                cellContent
                              )}
                            </td>
                          );
                        })}

                        {/* Summary / Total Columns */}
                        <td className="py-1.5 px-1.5 text-center font-mono-tabular font-bold text-emerald-800 bg-emerald-50/50 border border-slate-200">{row.h}</td>
                        <td className="py-1.5 px-1.5 text-center font-mono-tabular font-bold text-sky-800 bg-sky-50/50 border border-slate-200">{row.s}</td>
                        <td className="py-1.5 px-1.5 text-center font-mono-tabular font-bold text-indigo-800 bg-indigo-50/50 border border-slate-200">{row.i}</td>
                        <td className="py-1.5 px-1.5 text-center font-mono-tabular font-bold text-rose-800 bg-rose-50/50 border border-slate-200">{row.a}</td>
                        <td className="py-1.5 px-2 text-center font-mono-tabular font-bold text-slate-900 bg-slate-100 border border-slate-200">{row.h}</td>
                        <td className="py-1.5 px-2 text-center font-mono-tabular font-bold text-slate-900 border border-slate-200">
                          {row.rateFormatted}
                        </td>
                      </tr>
                    ))}
                  </tbody>

                  {/* Matrix Footer showing daily totals */}
                  <tfoot className="bg-slate-50 font-bold text-xs border-t-2 border-slate-300">
                    <tr>
                      <td colSpan={4} className="py-1.5 px-2 border border-slate-200 text-right font-bold text-emerald-800">
                        Jumlah Hadir (H/.)
                      </td>
                      {monthlyData.datesToShow.map(dateStr => (
                        <td key={dateStr} className="py-1.5 px-0.5 border border-slate-200 text-center font-mono-tabular text-emerald-800 text-[11px]">
                          {monthlyData.perDateTotals[dateStr]?.h ?? '-'}
                        </td>
                      ))}
                      <td className="py-1.5 px-1.5 border border-slate-200 text-center font-mono-tabular text-emerald-900 bg-emerald-100/60">{monthlyData.grandTotals.h}</td>
                      <td colSpan={5} className="border border-slate-200 bg-slate-100"></td>
                    </tr>
                    <tr>
                      <td colSpan={4} className="py-1.5 px-2 border border-slate-200 text-right font-bold text-sky-800">
                        Jumlah Sakit (S)
                      </td>
                      {monthlyData.datesToShow.map(dateStr => (
                        <td key={dateStr} className="py-1.5 px-0.5 border border-slate-200 text-center font-mono-tabular text-sky-800 text-[11px]">
                          {monthlyData.perDateTotals[dateStr]?.s || '-'}
                        </td>
                      ))}
                      <td className="border border-slate-200"></td>
                      <td className="py-1.5 px-1.5 border border-slate-200 text-center font-mono-tabular text-sky-900 bg-sky-100/60">{monthlyData.grandTotals.s}</td>
                      <td colSpan={4} className="border border-slate-200 bg-slate-100"></td>
                    </tr>
                    <tr>
                      <td colSpan={4} className="py-1.5 px-2 border border-slate-200 text-right font-bold text-indigo-800">
                        Jumlah Izin (I)
                      </td>
                      {monthlyData.datesToShow.map(dateStr => (
                        <td key={dateStr} className="py-1.5 px-0.5 border border-slate-200 text-center font-mono-tabular text-indigo-800 text-[11px]">
                          {monthlyData.perDateTotals[dateStr]?.i || '-'}
                        </td>
                      ))}
                      <td colSpan={2} className="border border-slate-200"></td>
                      <td className="py-1.5 px-1.5 border border-slate-200 text-center font-mono-tabular text-indigo-900 bg-indigo-100/60">{monthlyData.grandTotals.i}</td>
                      <td colSpan={3} className="border border-slate-200 bg-slate-100"></td>
                    </tr>
                    <tr>
                      <td colSpan={4} className="py-1.5 px-2 border border-slate-200 text-right font-bold text-rose-800">
                        Jumlah Alpa (A)
                      </td>
                      {monthlyData.datesToShow.map(dateStr => (
                        <td key={dateStr} className="py-1.5 px-0.5 border border-slate-200 text-center font-mono-tabular text-rose-800 text-[11px]">
                          {monthlyData.perDateTotals[dateStr]?.a || '-'}
                        </td>
                      ))}
                      <td colSpan={3} className="border border-slate-200"></td>
                      <td className="py-1.5 px-1.5 border border-slate-200 text-center font-mono-tabular text-rose-900 bg-rose-100/60">{monthlyData.grandTotals.a}</td>
                      <td colSpan={2} className="border border-slate-200 bg-slate-100"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            {/* Formula footnote as mandated by Section J */}
            <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded border border-slate-200">
              <span className="font-bold text-slate-700">Aturan Perhitungan Persentase:</span> % Kehadiran = (Jumlah hari/sesi berstatus Hadir / Total sesi valid tercatat) × 100%. Sesi libur, dibatalkan, dan belum diabsen dikecualikan dari pembagi.
            </div>
          </div>
        )}

        {/* 3. VIEW TAB: LAPORAN TAHUNAN / SEMESTER */}
        {activeTab === 'yearly' && (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-base font-bold text-slate-900 uppercase tracking-tight">
                Rekapitulasi Presensi Semester / Tahunan
              </h3>
              <p className="text-xs text-slate-600">
                Tahun Ajaran: <span className="font-semibold text-slate-900">{activeAcademicYear.name} ({activeAcademicYear.semester})</span> · Rombel: <span className="font-semibold text-slate-900">{activeRombel?.name}</span>
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border border-slate-200">
                <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3 border-r border-slate-200 w-10 text-center">No</th>
                    <th className="py-2.5 px-3 border-r border-slate-200 w-28">NIS</th>
                    <th className="py-2.5 px-3 border-r border-slate-200">Nama Siswa</th>
                    <th className="py-2.5 px-3 border-r border-slate-200 w-12 text-center">JK</th>
                    <th className="py-2.5 px-3 border-r border-slate-200 w-12 text-center text-emerald-800">H</th>
                    <th className="py-2.5 px-3 border-r border-slate-200 w-12 text-center text-sky-800">S</th>
                    <th className="py-2.5 px-3 border-r border-slate-200 w-12 text-center text-indigo-800">I</th>
                    <th className="py-2.5 px-3 border-r border-slate-200 w-12 text-center text-rose-800 font-bold">A</th>
                    <th className="py-2.5 px-3 border-r border-slate-200 w-12 text-center text-amber-800">T</th>
                    <th className="py-2.5 px-3 border-r border-slate-200 w-12 text-center text-purple-800">D</th>
                    <th className="py-2.5 px-3 border-r border-slate-200 w-24 text-center">Total Sesi</th>
                    <th className="py-2.5 px-3 text-center w-28 bg-slate-900 text-white">% Kehadiran</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {yearlyData.summaries.map((item, idx) => (
                    <tr key={item.student.id} className="hover:bg-slate-50">
                      <td className="py-2 px-3 text-center font-mono-tabular border-r border-slate-200">{idx + 1}</td>
                      <td className="py-2 px-3 font-mono-tabular border-r border-slate-200 text-slate-600">{item.student.nis}</td>
                      <td className="py-2 px-3 font-semibold text-slate-900 border-r border-slate-200">{item.student.name}</td>
                      <td className="py-2 px-3 text-center font-mono-tabular border-r border-slate-200">{item.student.gender}</td>
                      <td className="py-2 px-3 text-center font-mono-tabular font-bold text-emerald-700 border-r border-slate-200">{item.hadir}</td>
                      <td className="py-2 px-3 text-center font-mono-tabular text-sky-700 border-r border-slate-200">{item.sakit}</td>
                      <td className="py-2 px-3 text-center font-mono-tabular text-indigo-700 border-r border-slate-200">{item.izin}</td>
                      <td className="py-2 px-3 text-center font-mono-tabular font-bold text-rose-700 border-r border-slate-200">{item.alpa}</td>
                      <td className="py-2 px-3 text-center font-mono-tabular text-amber-700 border-r border-slate-200">{item.terlambat}</td>
                      <td className="py-2 px-3 text-center font-mono-tabular text-purple-700 border-r border-slate-200">{item.dispensasi}</td>
                      <td className="py-2 px-3 text-center font-mono-tabular text-slate-700 border-r border-slate-200">{item.totalValidSessions}</td>
                      <td className="py-2 px-3 text-center font-mono-tabular font-bold text-slate-900">
                        {item.rateFormatted}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 4. VIEW TAB: REKAP INDIVIDUAL SISWA */}
        {activeTab === 'student' && studentData && (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-base font-bold text-slate-900 uppercase tracking-tight">
                Kartu Riwayat Kehadiran Siswa
              </h3>
            </div>

            {/* Student Metadata Box */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-lg border border-slate-200 text-xs">
              <div>
                <span className="text-slate-500 block">Nama Siswa:</span>
                <span className="font-bold text-slate-900">{activeStudent.name}</span>
              </div>
              <div>
                <span className="text-slate-500 block">NIS / NISN:</span>
                <span className="font-mono-tabular text-slate-800">{activeStudent.nis} / {activeStudent.nisn || '-'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Kelas / Rombel:</span>
                <span className="font-medium text-slate-800">{activeRombel?.name}</span>
              </div>
              <div>
                <span className="text-slate-500 block">% Kehadiran Kumulatif:</span>
                <span className="font-bold text-indigo-700 font-mono-tabular text-sm">{studentData.stats.rateFormatted}</span>
              </div>
            </div>

            {/* History Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border border-slate-200">
                <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-2.5 border-r border-slate-200 w-10 text-center">No</th>
                    <th className="py-2 px-2.5 border-r border-slate-200 w-28">Tanggal</th>
                    <th className="py-2 px-2.5 border-r border-slate-200">Mata Pelajaran</th>
                    <th className="py-2 px-2.5 border-r border-slate-200">Guru Pengampu</th>
                    <th className="py-2 px-2.5 border-r border-slate-200 text-center w-20">Pertemuan</th>
                    <th className="py-2 px-2.5 border-r border-slate-200 text-center w-20">Status</th>
                    <th className="py-2 px-2.5">Catatan / Alasan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {studentData.history.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-slate-400">
                        Belum ada riwayat sesi tercatat untuk siswa ini.
                      </td>
                    </tr>
                  ) : (
                    studentData.history.map((h, idx) => (
                      <tr key={h.record.id}>
                        <td className="py-2 px-2.5 text-center font-mono-tabular border-r border-slate-200">{idx + 1}</td>
                        <td className="py-2 px-2.5 font-mono-tabular border-r border-slate-200 text-slate-700">{formatDateIndo(h.session?.date)}</td>
                        <td className="py-2 px-2.5 font-semibold text-slate-900 border-r border-slate-200">{h.subject?.name}</td>
                        <td className="py-2 px-2.5 text-slate-600 border-r border-slate-200">{h.teacher?.name}</td>
                        <td className="py-2 px-2.5 text-center font-mono-tabular border-r border-slate-200">Ke-{h.session?.meetingNumber}</td>
                        <td className="py-2 px-2.5 text-center font-bold font-mono-tabular border-r border-slate-200">
                          {h.record.status === 'H' ? <span className="text-emerald-700">Hadir</span> :
                           h.record.status === 'S' ? <span className="text-sky-700">Sakit</span> :
                           h.record.status === 'I' ? <span className="text-indigo-700">Izin</span> :
                           h.record.status === 'A' ? <span className="text-rose-700">Alpa</span> :
                           h.record.status === 'T' ? <span className="text-amber-700">Terlambat</span> : 'Dispensasi'}
                        </td>
                        <td className="py-2 px-2.5 text-slate-600 italic">{h.record.note || '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 5. VIEW TAB: LAPORAN BEBAN MENGAJAR GURU */}
        {activeTab === 'teacher' && teacherData && (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-base font-bold text-slate-900 uppercase tracking-tight">
                Laporan Keterlaksanaan Presensi Guru Mata Pelajaran
              </h3>
              <p className="text-xs text-slate-600">
                Nama Guru: <span className="font-semibold text-slate-900">{activeTeacher.name}</span> (NIP: {activeTeacher.nip}) · Spesialisasi: {activeTeacher.specialization || '-'}
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border border-slate-200">
                <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-2.5 border-r border-slate-200 w-10 text-center">No</th>
                    <th className="py-2 px-2.5 border-r border-slate-200 w-28">Tanggal</th>
                    <th className="py-2 px-2.5 border-r border-slate-200">Kelas</th>
                    <th className="py-2 px-2.5 border-r border-slate-200">Mata Pelajaran</th>
                    <th className="py-2 px-2.5 border-r border-slate-200 text-center w-24">Pertemuan</th>
                    <th className="py-2 px-2.5 border-r border-slate-200">Materi Pokok</th>
                    <th className="py-2 px-2.5 border-r border-slate-200 text-center w-20">Siswa</th>
                    <th className="py-2 px-2.5 text-center w-24 text-emerald-800">Hadir</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {teacherData.sessionSummaryByMapel.map((item, idx) => (
                    <tr key={item.session.id}>
                      <td className="py-2 px-2.5 text-center font-mono-tabular border-r border-slate-200">{idx + 1}</td>
                      <td className="py-2 px-2.5 font-mono-tabular border-r border-slate-200">{formatDateIndo(item.session.date)}</td>
                      <td className="py-2 px-2.5 font-semibold text-slate-900 border-r border-slate-200">{item.rombelName}</td>
                      <td className="py-2 px-2.5 text-slate-800 border-r border-slate-200">{item.subjectName}</td>
                      <td className="py-2 px-2.5 text-center font-mono-tabular border-r border-slate-200">Ke-{item.session.meetingNumber}</td>
                      <td className="py-2 px-2.5 text-slate-600 border-r border-slate-200 truncate max-w-xs">{item.session.topic || '-'}</td>
                      <td className="py-2 px-2.5 text-center font-mono-tabular border-r border-slate-200">{item.totalSiswa}</td>
                      <td className="py-2 px-2.5 text-center font-mono-tabular font-bold text-emerald-700">{item.hadir}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Official Signatures Section (Tanda Tangan Pengesahan) */}
        <div className="mt-8 pt-6 border-t border-slate-200 grid grid-cols-2 text-xs text-center print-break-inside-avoid">
          <div>
            <p className="text-slate-600">Mengetahui,</p>
            <p className="font-bold text-slate-900 mt-0.5">Kepala {settings.schoolName}</p>
            <div className="h-16" />
            <p className="font-bold text-slate-900 underline">{settings.headmasterName}</p>
            <p className="text-slate-500 font-mono-tabular text-[11px]">NIP. {settings.headmasterNip}</p>
          </div>

          <div>
            <p className="text-slate-600">{settings.schoolCity}, 17 Oktober 2026</p>
            <p className="font-bold text-slate-900 mt-0.5">
              {activeTab === 'teacher' ? 'Guru Mata Pelajaran' : 'Wali Kelas / Pengelola Absensi'}
            </p>
            <div className="h-16" />
            <p className="font-bold text-slate-900 underline">
              {activeTab === 'teacher' ? activeTeacher.name : (activeRombel?.homeroomTeacherName || 'Siti Nurhaliza, M.Pd.')}
            </p>
            <p className="text-slate-500 font-mono-tabular text-[11px]">
              NIP. {activeTab === 'teacher' ? activeTeacher.nip : '19820315 200801 2 011'}
            </p>
          </div>
        </div>

      </div>

    </div>
  );
};

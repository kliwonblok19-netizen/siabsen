import * as XLSX from 'xlsx';

/**
 * Universal helper to export data to Excel (.xlsx) file
 */
export const downloadExcel = (filename: string, sheetName: string, data: any[]) => {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, sheetName.substring(0, 31));
  XLSX.writeFile(wb, `${filename}.xlsx`);
};

/**
 * Universal helper to export data to CSV file
 */
export const downloadCsv = (filename: string, data: any[]) => {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);
  const csvOutput = XLSX.utils.sheet_to_csv(ws);
  const blob = new Blob([csvOutput], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Parse an uploaded .xlsx, .xls, or .csv file into JSON array
 */
export const parseExcelOrCsvFile = (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const wb = XLSX.read(data, { type: 'binary' });
        const firstSheetName = wb.SheetNames[0];
        const ws = wb.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json(ws);
        resolve(json);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsBinaryString(file);
  });
};

/**
 * Template generators with realistic SMK sample data
 */
export const downloadRombelTemplate = () => {
  const sampleData = [
    {
      'Kode Rombel': 'DKV-X-1',
      'Nama Kelas': 'X DKV 1',
      'Tingkat': 'X',
      'Jurusan': 'DKV',
      'Wali Kelas': 'Ratna Dewi, S.Pd.'
    },
    {
      'Kode Rombel': 'DKV-X-2',
      'Nama Kelas': 'X DKV 2',
      'Tingkat': 'X',
      'Jurusan': 'DKV',
      'Wali Kelas': 'Dewi Lestari, S.Pd.'
    },
    {
      'Kode Rombel': 'DKV-X-3',
      'Nama Kelas': 'X DKV 3',
      'Tingkat': 'X',
      'Jurusan': 'DKV',
      'Wali Kelas': 'Drs. Budi Santoso, M.Kom.'
    },
    {
      'Kode Rombel': 'DPIB-X-1',
      'Nama Kelas': 'X DPIB 1',
      'Tingkat': 'X',
      'Jurusan': 'DPIB',
      'Wali Kelas': 'Fitri Handayani, S.Pd.'
    },
    {
      'Kode Rombel': 'DPIB-X-2',
      'Nama Kelas': 'X DPIB 2',
      'Tingkat': 'X',
      'Jurusan': 'DPIB',
      'Wali Kelas': 'Rudi Hermawan, S.T.'
    },
    {
      'Kode Rombel': 'TKP-XI-1',
      'Nama Kelas': 'XI TKP 1',
      'Tingkat': 'XI',
      'Jurusan': 'TKP',
      'Wali Kelas': 'Rudi Hermawan, S.T.'
    },
    {
      'Kode Rombel': 'TOI-XII-1',
      'Nama Kelas': 'XII TOI 1',
      'Tingkat': 'XII',
      'Jurusan': 'TOI',
      'Wali Kelas': 'Hendra Wijaya, S.T., M.T.'
    },
    {
      'Kode Rombel': 'TKR-XII-1',
      'Nama Kelas': 'XII TKR 1',
      'Tingkat': 'XII',
      'Jurusan': 'TKR',
      'Wali Kelas': 'Ahmad Fauzi, S.T.'
    }
  ];
  downloadExcel('template_import_kelas_rombel_smk', 'Template Rombel', sampleData);
};

export const downloadTeacherTemplate = () => {
  const sampleData = [
    {
      'NIP': '19850101 201001 1 005',
      'Nama Lengkap': 'Ir. H. Gunawan Wibisono, M.T.',
      'Email Dinas': 'gunawan.wibisono@smk.sch.id',
      'No Telepon': '081233445566',
      'Jenis Kelamin (L/P)': 'L',
      'Spesialisasi': 'Teknik Otomasi Industri',
      'Status': 'active'
    },
    {
      'NIP': '19880415 201202 2 008',
      'Nama Lengkap': 'Endah Suryani, S.Kom., M.Cs.',
      'Email Dinas': 'endah.suryani@smk.sch.id',
      'No Telepon': '081399887766',
      'Jenis Kelamin (L/P)': 'P',
      'Spesialisasi': 'Desain Komunikasi Visual',
      'Status': 'active'
    }
  ];
  downloadExcel('template_import_guru_smk', 'Template Guru', sampleData);
};

export const downloadStudentTemplate = () => {
  const sampleData = [
    {
      'NIS': '24251001',
      'NISN': '0089123401',
      'Nama Lengkap': 'Rizky Alamsyah',
      'Jenis Kelamin (L/P)': 'L',
      'Kode Rombel': 'DKV-X-1',
      'No Telepon': '081200112233',
      'Nama Orang Tua': 'H. Alamsyah'
    },
    {
      'NIS': '24251002',
      'NISN': '0089123402',
      'Nama Lengkap': 'Salma Salsabila',
      'Jenis Kelamin (L/P)': 'P',
      'Kode Rombel': 'DKV-X-1',
      'No Telepon': '081200112234',
      'Nama Orang Tua': 'Muhammad Subhan'
    },
    {
      'NIS': '24252001',
      'NISN': '0089123403',
      'Nama Lengkap': 'Daffa Arya Saputra',
      'Jenis Kelamin (L/P)': 'L',
      'Kode Rombel': 'DPIB-X-1',
      'No Telepon': '081200112235',
      'Nama Orang Tua': 'Budi Saputra'
    }
  ];
  downloadExcel('template_import_siswa_smk', 'Template Siswa', sampleData);
};

export const downloadSubjectTemplate = () => {
  const sampleData = [
    {
      'Kode Mapel': 'DPIB-101',
      'Nama Mata Pelajaran': 'Dasar-Dasar Desain Pemodelan Bangunan',
      'Kategori': 'Muatan Kejuruan',
      'Beban Jam (JP)': 6
    },
    {
      'Kode Mapel': 'TOI-201',
      'Nama Mata Pelajaran': 'Sistem Kontrol Elektropneumatik & PLC',
      'Kategori': 'Muatan Kejuruan',
      'Beban Jam (JP)': 8
    },
    {
      'Kode Mapel': 'UMUM-103',
      'Nama Mata Pelajaran': 'Bahasa Inggris Kejuruan',
      'Kategori': 'Muatan Nasional',
      'Beban Jam (JP)': 3
    }
  ];
  downloadExcel('template_import_mapel_smk', 'Template Mapel', sampleData);
};

export const downloadScheduleTemplate = () => {
  const sampleData = [
    {
      'Hari (1=Senin..6=Sabtu)': 1,
      'Jam Ke Mulai': 1,
      'Jam Ke Selesai': 3,
      'Waktu Mulai': '07:15',
      'Waktu Selesai': '09:30',
      'Kode Rombel': 'DKV-X-1',
      'Kode Mapel': 'DKV-101',
      'NIP/Nama Guru': 'Ratna Dewi, S.Pd.',
      'Ruang': 'Lab Komputer DKV 1'
    },
    {
      'Hari (1=Senin..6=Sabtu)': 2,
      'Jam Ke Mulai': 1,
      'Jam Ke Selesai': 4,
      'Waktu Mulai': '07:15',
      'Waktu Selesai': '10:15',
      'Kode Rombel': 'DPIB-X-1',
      'Kode Mapel': 'UMUM-102',
      'NIP/Nama Guru': 'Fitri Handayani, S.Pd.',
      'Ruang': 'R. Teori DPIB 1'
    }
  ];
  downloadExcel('template_import_jadwal_smk', 'Template Jadwal', sampleData);
};

export const downloadTeachingAssignmentTemplate = () => {
  const sampleData = [
    {
      'NIP/Nama Guru': 'Ratna Dewi, S.Pd.',
      'Kode Mapel': 'DKV-101',
      'Kode Rombel': 'DKV-X-1'
    },
    {
      'NIP/Nama Guru': 'Dewi Lestari, S.Pd.',
      'Kode Mapel': 'DKV-101',
      'Kode Rombel': 'DKV-X-2'
    },
    {
      'NIP/Nama Guru': 'Fitri Handayani, S.Pd.',
      'Kode Mapel': 'UMUM-102',
      'Kode Rombel': 'DPIB-X-1'
    }
  ];
  downloadExcel('template_import_penugasan_guru_smk', 'Template Penugasan', sampleData);
};

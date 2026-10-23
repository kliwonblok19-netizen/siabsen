import React, { useState } from 'react';
import { 
  ERD_DOCUMENTATION, 
  MYSQL_DDL_SCHEMA, 
  LARAVEL_MIGRATION_SAMPLE, 
  LARAVEL_CONTROLLER_SAMPLE,
  LARAVEL_SECRETARY_CORRECTION_SAMPLE 
} from '../data/laravelSchemaDocs';
import { 
  FileCode2, 
  Copy, 
  Check, 
  Download, 
  Layers, 
  Database, 
  ShieldCheck, 
  Workflow, 
  Terminal,
  UserCheck 
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const ArchitectureDocsView: React.FC = () => {
  const { showToast } = useApp();
  const [activeSubTab, setActiveSubTab] = useState<'erd' | 'mysql' | 'migration' | 'controller' | 'secretary'>('erd');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    showToast('Kode berhasil disalin ke papan klip!', 'success');
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleDownloadFile = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`File ${filename} berhasil diunduh!`, 'info');
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                Arsitektur & Spesifikasi Teknis
              </span>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs text-slate-500 font-medium">Dokumentasi Sistem Lengkap Sesuai Permintaan</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-1">
              Rancangan ERD, Skema Database MySQL & Kode Laravel
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Struktur normalisasi data (3NF), alur otorisasi multi-role, skema migrasi database, dan controller backend siap pakai
            </p>
          </div>
        </div>

        {/* Sub-Tabs */}
        <div className="flex items-center gap-2 mt-5 border-t border-slate-100 pt-4 overflow-x-auto">
          {[
            { id: 'erd', label: '1. ERD & Alur Kerja', icon: Workflow },
            { id: 'mysql', label: '2. MySQL DDL Schema', icon: Database },
            { id: 'migration', label: '3. Migration Laravel', icon: FileCode2 },
            { id: 'controller', label: '4. Controller & Middleware', icon: Terminal },
            { id: 'secretary', label: '5. Sekretaris & Koreksi API', icon: UserCheck }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
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

      {/* 1. ERD & ALUR KERJA VIEW */}
      {activeSubTab === 'erd' && (
        <div className="space-y-6">
          {/* Alur Kerja Pengguna */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              Alur Kerja Pengguna (User Workflows) - 4 Peran Terintegrasi
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
                <span className="font-bold text-slate-900 text-sm block mb-1">A. Guru Mata Pelajaran</span>
                <ol className="list-decimal pl-4 space-y-1.5 text-slate-600 mt-2">
                  <li>Login menggunakan email/username.</li>
                  <li>Sistem menyaring jadwal mengajar guru pada hari tersebut.</li>
                  <li>Guru memilih kelas dan mata pelajaran yang diampunya.</li>
                  <li>Guru membuat sesi pertemuan (tanggal, jam ke-, nomor pertemuan, materi).</li>
                  <li>Sistem menampilkan siswa aktif di rombel tersebut.</li>
                  <li>Guru mengisi status presensi (H, S, I, A, T, D) dengan tombol massal "Tandai Semua Hadir".</li>
                  <li>Guru memberikan catatan/alasan untuk siswa yang tidak hadir.</li>
                  <li>Sistem mencegah data ganda dan menyimpan sesi. Guru dapat mengunci sesi.</li>
                </ol>
              </div>

              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
                <span className="font-bold text-slate-900 text-sm block mb-1">B. Wali Kelas</span>
                <ol className="list-decimal pl-4 space-y-1.5 text-slate-600 mt-2">
                  <li>Login dan langsung diarahkan ke rombel binaannya.</li>
                  <li>Melihat radar absensi siswa hari ini dari seluruh mata pelajaran.</li>
                  <li>Memeriksa siswa rawan alpa (&ge; 2 alpa atau kehadiran &lt; 85%).</li>
                  <li>Membuka detail seorang siswa untuk melihat seluruh riwayat absensi lintas mapel.</li>
                  <li>Menunjuk atau mengganti Sekretaris Kelas untuk rombelnya.</li>
                  <li>Memeriksa dan menyetujui pengajuan koreksi absensi dari sekretaris.</li>
                  <li>Mencetak atau mengekspor rekapitulasi kehadiran bulanan dan semester.</li>
                </ol>
              </div>

              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
                <span className="font-bold text-slate-900 text-sm block mb-1">C. Sekretaris Kelas (Baru)</span>
                <ol className="list-decimal pl-4 space-y-1.5 text-slate-600 mt-2">
                  <li>Login menggunakan akun siswa terverifikasi tanpa data duplikat.</li>
                  <li>Akses diisolasi ketat hanya ke rombel tempat ia ditugaskan.</li>
                  <li>Melihat radar monitoring absensi harian dan rekap bulanan/semester.</li>
                  <li>Melihat status sesi mapel yang sudah dan belum diabsen guru.</li>
                  <li>Dilarang mengubah absensi langsung, mengunci, atau kelola user.</li>
                  <li>Mengajukan permohonan koreksi absensi (status PENDING).</li>
                  <li>Menunggu persetujuan resmi Wali Kelas atau Guru Mapel.</li>
                </ol>
              </div>

              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
                <span className="font-bold text-slate-900 text-sm block mb-1">D. Administrator</span>
                <ol className="list-decimal pl-4 space-y-1.5 text-slate-600 mt-2">
                  <li>Mengelola data master: siswa (import Excel), guru, rombel, mapel, jadwal.</li>
                  <li>Menunjuk dan mencabut Sekretaris Kelas lintas rombel.</li>
                  <li>Memantau ringkasan kehadiran seluruh sekolah secara real-time.</li>
                  <li>Membuka kunci sesi absensi yang terkunci jika ada permohonan revisi resmi.</li>
                  <li>Memeriksa seluruh catatan Audit Trail perubahan data.</li>
                  <li>Melakukan pencadangan (backup) dan pemulihan (restore) database.</li>
                </ol>
              </div>
            </div>
          </div>

          {/* ERD Breakdown */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              Spesifikasi Relasi Tabel Database (ERD)
            </h3>
            <pre className="text-xs font-mono bg-slate-900 text-slate-200 p-4 rounded-xl overflow-x-auto whitespace-pre-wrap leading-relaxed">
              {ERD_DOCUMENTATION}
            </pre>
          </div>
        </div>
      )}

      {/* 2. MYSQL SCHEMA VIEW */}
      {activeSubTab === 'mysql' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                MySQL / MariaDB DDL Script Lengkap
              </h3>
              <p className="text-xs text-slate-500">
                Tabel lengkap dengan Foreign Keys, Indexing, dan Unique Constraints pencegah duplikasi data
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCopy(MYSQL_DDL_SCHEMA, 'mysql')}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1.5 transition-colors"
              >
                {copiedKey === 'mysql' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                Salin SQL
              </button>
              <button
                onClick={() => handleDownloadFile('schema_smk_absensi.sql', MYSQL_DDL_SCHEMA)}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Unduh .sql
              </button>
            </div>
          </div>

          <pre className="text-xs font-mono bg-slate-900 text-emerald-400 p-4 rounded-xl overflow-x-auto max-h-[500px]">
            {MYSQL_DDL_SCHEMA}
          </pre>
        </div>
      )}

      {/* 3. LARAVEL MIGRATION VIEW */}
      {activeSubTab === 'migration' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                File Migrasi Laravel 11 / 10
              </h3>
              <p className="text-xs text-slate-500">
                Contoh implementasi migration Laravel dengan relasi cascade dan unique constraints
              </p>
            </div>
            <button
              onClick={() => handleCopy(LARAVEL_MIGRATION_SAMPLE, 'migration')}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              {copiedKey === 'migration' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              Salin Kode Migrasi
            </button>
          </div>

          <pre className="text-xs font-mono bg-slate-900 text-amber-300 p-4 rounded-xl overflow-x-auto max-h-[500px]">
            {LARAVEL_MIGRATION_SAMPLE}
          </pre>
        </div>
      )}

      {/* 4. LARAVEL CONTROLLER VIEW */}
      {activeSubTab === 'controller' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Backend Controller & Middleware Laravel
              </h3>
              <p className="text-xs text-slate-500">
                Validasi input, DB::transaction, otorisasi penugasan mengajar, dan pencatatan audit log otomatis
              </p>
            </div>
            <button
              onClick={() => handleCopy(LARAVEL_CONTROLLER_SAMPLE, 'controller')}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              {copiedKey === 'controller' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              Salin Kode Controller
            </button>
          </div>

          <pre className="text-xs font-mono bg-slate-900 text-sky-300 p-4 rounded-xl overflow-x-auto max-h-[500px]">
            {LARAVEL_CONTROLLER_SAMPLE}
          </pre>
        </div>
      )}

      {/* 5. LARAVEL SECRETARY & CORRECTION API VIEW */}
      {activeSubTab === 'secretary' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Arsitektur Backend & API Pengajuan Koreksi Sekretaris (Laravel)
              </h3>
              <p className="text-xs text-slate-500">
                Otorisasi isolasi rombel ketat, validasi status PENDING, alur persetujuan Wali Kelas/Guru, dan audit trail resmi
              </p>
            </div>
            <button
              onClick={() => handleCopy(LARAVEL_SECRETARY_CORRECTION_SAMPLE, 'secretary')}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              {copiedKey === 'secretary' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              Salin Kode API Sekretaris
            </button>
          </div>

          <pre className="text-xs font-mono bg-slate-900 text-emerald-300 p-4 rounded-xl overflow-x-auto max-h-[500px]">
            {LARAVEL_SECRETARY_CORRECTION_SAMPLE}
          </pre>
        </div>
      )}

    </div>
  );
};

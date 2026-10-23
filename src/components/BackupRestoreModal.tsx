import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Database, 
  Download, 
  Upload, 
  RotateCcw, 
  X, 
  AlertTriangle, 
  CheckCircle2, 
  FileCode, 
  Layers, 
  ShieldCheck, 
  Info,
  Calendar
} from 'lucide-react';

interface BackupRestoreModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BackupRestoreModal: React.FC<BackupRestoreModalProps> = ({ isOpen, onClose }) => {
  const { 
    exportDatabaseJson, 
    importDatabaseJson, 
    exportSqlDump, 
    resetDatabase, 
    settings, 
    students, 
    teachers, 
    rombels, 
    sessions, 
    records, 
    showToast 
  } = useApp();

  const [activeTab, setActiveTab] = useState<'backup' | 'restore' | 'reset'>('backup');
  const [importText, setImportText] = useState('');
  const [parsedDataSummary, setParsedDataSummary] = useState<any | null>(null);
  const [confirmRestore, setConfirmRestore] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);

  if (!isOpen) return null;

  const handleDownloadBackupJson = async () => {
    try {
      setLoadingAction(true);
      const jsonStr = await exportDatabaseJson();
      const filename = `backup_smk_absensi_${new Date().toISOString().substring(0, 10)}.json`;
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Cadangan JSON database berhasil diunduh!', 'success');
    } catch (e: any) {
      showToast('Gagal mengunduh cadangan JSON: ' + e.message, 'error');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleDownloadSqlDump = async () => {
    try {
      setLoadingAction(true);
      const sqlStr = await exportSqlDump();
      const filename = `smk_absensi_dump_${new Date().toISOString().substring(0, 10)}.sql`;
      const blob = new Blob([sqlStr], { type: 'application/sql' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('SQL dump lengkap database berhasil diekspor!', 'success');
    } catch (e: any) {
      showToast('Gagal mengekspor SQL dump: ' + e.message, 'error');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      setImportText(text);
      try {
        const parsed = JSON.parse(text);
        if (parsed.data) {
          setParsedDataSummary({
            version: parsed.version || '1.0',
            school: parsed.school || settings.schoolName,
            exportDate: parsed.exportDate || 'N/A',
            checksum: parsed.checksum ? parsed.checksum.substring(0, 16) + '...' : 'Tervalidasi',
            rombelsCount: parsed.data.rombels?.length || 0,
            studentsCount: parsed.data.students?.length || 0,
            teachersCount: parsed.data.teachers?.length || 0,
            subjectsCount: parsed.data.subjects?.length || 0,
            sessionsCount: parsed.data.sessions?.length || 0,
            recordsCount: parsed.data.records?.length || 0,
            secretariesCount: parsed.data.secretaryAssignments?.length || 0,
            correctionsCount: parsed.data.correctionRequests?.length || 0
          });
        } else {
          setParsedDataSummary(null);
          showToast('Format cadangan JSON tidak valid (atribut data tidak ditemukan).', 'error');
        }
      } catch (err) {
        setParsedDataSummary(null);
        showToast('File tidak dapat dibaca sebagai JSON yang valid.', 'error');
      }
    };
    reader.readAsText(file);
  };

  const handleRestoreSubmit = () => {
    if (!importText.trim()) {
      showToast('Pilih file cadangan JSON terlebih dahulu.', 'error');
      return;
    }
    if (!confirmRestore) {
      showToast('Harap beri centang konfirmasi penimpaan database terlebih dahulu.', 'warning');
      return;
    }
    const success = importDatabaseJson(importText);
    if (success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Pencadangan & Pemulihan Sistem (Backup & Restore)
              </h3>
              <p className="text-[11px] text-slate-500">
                {settings.schoolName} · Manajemen Keutuhan Data Sekolah
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center gap-2 my-4">
          <button
            onClick={() => setActiveTab('backup')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
              activeTab === 'backup'
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            Unduh Cadangan (Backup)
          </button>
          <button
            onClick={() => setActiveTab('restore')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
              activeTab === 'restore'
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            Pulihkan Data (Restore)
          </button>
          <button
            onClick={() => setActiveTab('reset')}
            className={`py-1.5 px-3 text-xs font-semibold rounded-lg border transition-colors ${
              activeTab === 'reset'
                ? 'bg-rose-600 text-white border-rose-600'
                : 'bg-white text-rose-600 border-rose-200 hover:bg-rose-50'
            }`}
          >
            Hapus Data Demo
          </button>
        </div>

        {/* 1. BACKUP TAB */}
        {activeTab === 'backup' && (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <span className="font-bold text-slate-900 block text-xs">
                Statistik Data Sistem Saat Ini:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                <div className="p-2 bg-white rounded-lg border border-slate-200">
                  <span className="text-slate-500 block">Rombel</span>
                  <span className="font-bold text-slate-900 text-sm font-mono-tabular">{rombels.length}</span>
                </div>
                <div className="p-2 bg-white rounded-lg border border-slate-200">
                  <span className="text-slate-500 block">Siswa Aktif</span>
                  <span className="font-bold text-slate-900 text-sm font-mono-tabular">{students.length}</span>
                </div>
                <div className="p-2 bg-white rounded-lg border border-slate-200">
                  <span className="text-slate-500 block">Guru</span>
                  <span className="font-bold text-slate-900 text-sm font-mono-tabular">{teachers.length}</span>
                </div>
                <div className="p-2 bg-white rounded-lg border border-slate-200">
                  <span className="text-slate-500 block">Rekaman Absensi</span>
                  <span className="font-bold text-slate-900 text-sm font-mono-tabular">{records.length}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2.5">
              {/* JSON Backup Button */}
              <div className="p-3.5 bg-indigo-50/50 border border-indigo-200 rounded-xl flex items-center justify-between gap-3">
                <div>
                  <span className="font-bold text-slate-900 block">Cadangan JSON (.json)</span>
                  <span className="text-[11px] text-slate-600">
                    Snapshot lengkap terenkripsi dengan SHA-256 Checksum untuk pemulihan instan.
                  </span>
                </div>
                <button
                  disabled={loadingAction}
                  onClick={handleDownloadBackupJson}
                  className="px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 rounded-lg shadow-xs flex items-center gap-1.5 transition-colors shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  Unduh JSON
                </button>
              </div>

              {/* SQL Dump Backup Button */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3">
                <div>
                  <span className="font-bold text-slate-900 block">SQL Dump DDL & DML (.sql)</span>
                  <span className="text-[11px] text-slate-600">
                    Skrip SQL standar untuk migrasi ke server MySQL, MariaDB, atau PostgreSQL.
                  </span>
                </div>
                <button
                  disabled={loadingAction}
                  onClick={handleDownloadSqlDump}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-800 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg shadow-xs flex items-center gap-1.5 transition-colors shrink-0"
                >
                  <FileCode className="w-3.5 h-3.5 text-slate-600" />
                  Ekspor SQL
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 2. RESTORE TAB */}
        {activeTab === 'restore' && (
          <div className="space-y-4 text-xs">
            <p className="text-slate-600 leading-relaxed">
              Pulihkan database sekolah dari file cadangan JSON yang valid. Sistem akan memeriksa integritas data sebelum proses penimpaan dilakukan.
            </p>

            <div className="border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-xl p-4 text-center transition-colors">
              <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1.5" />
              <label className="cursor-pointer">
                <span className="font-semibold text-indigo-600 hover:text-indigo-800 block">
                  Pilih file cadangan JSON (.json)
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  Klik untuk menelusuri dari penyimpanan perangkat
                </span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Inspection Summary */}
            {parsedDataSummary && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2 text-emerald-900">
                <div className="flex items-center gap-2 font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>File Cadangan Terverifikasi: {parsedDataSummary.school}</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-emerald-800 pt-1">
                  <div>Rombel: <span className="font-bold">{parsedDataSummary.rombelsCount}</span></div>
                  <div>Siswa: <span className="font-bold">{parsedDataSummary.studentsCount}</span></div>
                  <div>Guru: <span className="font-bold">{parsedDataSummary.teachersCount}</span></div>
                  <div>Mapel: <span className="font-bold">{parsedDataSummary.subjectsCount}</span></div>
                  <div>Sesi: <span className="font-bold">{parsedDataSummary.sessionsCount}</span></div>
                  <div>Presensi: <span className="font-bold">{parsedDataSummary.recordsCount}</span></div>
                  <div>Sekretaris: <span className="font-bold">{parsedDataSummary.secretariesCount}</span></div>
                  <div>Koreksi: <span className="font-bold">{parsedDataSummary.correctionsCount}</span></div>
                </div>

                <div className="pt-2 border-t border-emerald-200">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-800">
                    <input
                      type="checkbox"
                      checked={confirmRestore}
                      onChange={e => setConfirmRestore(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Saya mengonfirmasi untuk menimpa data sistem saat ini dengan cadangan ini.</span>
                  </label>
                </div>
              </div>
            )}

            <button
              disabled={!parsedDataSummary || !confirmRestore}
              onClick={handleRestoreSubmit}
              className="w-full py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
            >
              <Database className="w-3.5 h-3.5" />
              Terapkan Pemulihan Database Sekarang
            </button>
          </div>
        )}

        {/* 3. RESET / CLEAN TAB */}
        {activeTab === 'reset' && (
          <div className="space-y-4 text-xs">
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl space-y-2 text-rose-900">
              <div className="flex items-center gap-2 font-bold text-xs">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Hapus & Bersihkan Seluruh Data Demo</span>
              </div>
              <p className="text-[11px] text-rose-800 leading-relaxed">
                Tindakan ini akan mengosongkan seluruh data demo (siswa, guru, kelas, jadwal, dan riwayat presensi) sehingga database sistem absensi menjadi bersih untuk input data riil sekolah. Akun Administrator Utama tetap dipertahankan untuk mengelola sistem.
              </p>
            </div>

            {!showResetConfirm ? (
              <button
                type="button"
                onClick={() => setShowResetConfirm(true)}
                className="w-full py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Hapus Semua Data Demo Sekarang
              </button>
            ) : (
              <div className="p-3.5 bg-slate-900 text-white rounded-xl space-y-3">
                <p className="text-xs font-semibold text-rose-400">
                  Apakah Anda benar-benar yakin ingin menghapus seluruh data demo?
                </p>
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => setShowResetConfirm(false)}
                    className="px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
                  >
                    Batal
                  </button>
                  <button
                    onClick={() => {
                      resetDatabase();
                      setShowResetConfirm(false);
                      onClose();
                    }}
                    className="px-3.5 py-1.5 text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-lg"
                  >
                    Ya, Bersihkan Database
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Modal Footer */}
        <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};

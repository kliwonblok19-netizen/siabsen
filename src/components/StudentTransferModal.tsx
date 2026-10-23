import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Student } from '../types';
import { ArrowRightLeft, X, AlertCircle, CheckCircle2 } from 'lucide-react';

interface StudentTransferModalProps {
  student: Student | null;
  onClose: () => void;
}

export const StudentTransferModal: React.FC<StudentTransferModalProps> = ({ student, onClose }) => {
  const { rombels, transferStudent, showToast } = useApp();
  const [targetRombelId, setTargetRombelId] = useState<string>('');
  const [reason, setReason] = useState<string>('');

  if (!student) return null;

  const currentRombel = rombels.find(r => r.id === student.rombelId);
  const otherRombels = rombels.filter(r => r.id !== student.rombelId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetRombelId) {
      showToast('Pilih rombel tujuan perpindahan.', 'error');
      return;
    }
    if (!reason.trim()) {
      showToast('Alasan perpindahan wajib diisi untuk catatan audit resmi.', 'error');
      return;
    }

    const ok = transferStudent(student.id, targetRombelId, reason);
    if (ok) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-900">
              Mutasi / Perpindahan Kelas Siswa
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info Box */}
        <div className="mt-4 p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-900">
          <p className="font-semibold">Perlindungan Data Historis:</p>
          <p className="text-[11px] text-indigo-800 mt-0.5">
            Perpindahan kelas tidak akan menghapus atau mengubah catatan presensi yang telah berlangsung di kelas lama ({currentRombel?.name}). Riwayat absensi masa lalu tetap utuh.
          </p>
        </div>

        {/* Student Details */}
        <div className="mt-4 space-y-2 text-xs">
          <div className="flex justify-between py-1 border-b border-slate-100">
            <span className="text-slate-500">Nama Siswa:</span>
            <span className="font-bold text-slate-900">{student.name}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-100">
            <span className="text-slate-500">NIS / NISN:</span>
            <span className="font-mono-tabular text-slate-800">{student.nis} / {student.nisn || '-'}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-100">
            <span className="text-slate-500">Kelas Saat Ini:</span>
            <span className="font-semibold text-slate-800">{currentRombel?.name} ({currentRombel?.code})</span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-3 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              Rombel Tujuan Baru <span className="text-rose-500">*</span>
            </label>
            <select
              required
              value={targetRombelId}
              onChange={e => setTargetRombelId(e.target.value)}
              className="w-full border border-slate-200 rounded-lg p-2.5 bg-slate-50 text-slate-800 focus:bg-white focus:ring-1 focus:ring-indigo-600"
            >
              <option value="">-- Pilih Rombel Tujuan --</option>
              {otherRombels.map(r => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.code} - {r.departmentCode})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              Alasan Mutasi / Perpindahan <span className="text-rose-500">* (Wajib Audit)</span>
            </label>
            <textarea
              rows={2}
              required
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Contoh: Penyesuaian peminatan kejuruan / keputusan rapat dewan guru No. 04/SMK/2026"
              className="w-full border border-slate-200 rounded-lg p-2.5 focus:ring-1 focus:ring-indigo-600"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs"
            >
              Proses Perpindahan
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

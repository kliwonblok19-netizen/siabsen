import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Settings, Save, School, ShieldAlert, Clock } from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { settings, updateSettings, showToast } = useApp();

  const [form, setForm] = useState({
    schoolName: settings.schoolName,
    schoolNpsn: settings.schoolNpsn,
    schoolAddress: settings.schoolAddress,
    schoolCity: settings.schoolCity,
    schoolProvince: settings.schoolProvince,
    headmasterName: settings.headmasterName,
    headmasterNip: settings.headmasterNip,
    lockTimeoutHours: settings.lockTimeoutHours,
    allowHomeroomCorrection: settings.allowHomeroomCorrection
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(form);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
            Konfigurasi Institusi
          </span>
          <span className="text-xs text-slate-400">·</span>
          <span className="text-xs text-slate-500 font-medium">Pengaturan Profil & Toleransi Waktu</span>
        </div>
        <h1 className="text-xl font-bold text-slate-900 mt-1">
          Pengaturan Sekolah & Kebijakan Absensi
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Data ini digunakan pada Kop Surat resmi cetak laporan, kartu absensi, dan aturan penguncian presensi
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Identitas Sekolah */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
            <School className="w-4 h-4 text-slate-500" />
            1. Identitas Resmi Sekolah (Kop Surat)
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Nama Satuan Pendidikan (SMK)</label>
              <input
                type="text"
                required
                value={form.schoolName}
                onChange={e => setForm({ ...form, schoolName: e.target.value })}
                className="w-full border border-slate-200 rounded-lg p-2.5 font-bold"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">NPSN</label>
              <input
                type="text"
                required
                value={form.schoolNpsn}
                onChange={e => setForm({ ...form, schoolNpsn: e.target.value })}
                className="w-full border border-slate-200 rounded-lg p-2.5 font-mono-tabular"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="font-semibold text-slate-700 block mb-1">Alamat Sekolah</label>
              <input
                type="text"
                required
                value={form.schoolAddress}
                onChange={e => setForm({ ...form, schoolAddress: e.target.value })}
                className="w-full border border-slate-200 rounded-lg p-2.5"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Kabupaten / Kota</label>
              <input
                type="text"
                required
                value={form.schoolCity}
                onChange={e => setForm({ ...form, schoolCity: e.target.value })}
                className="w-full border border-slate-200 rounded-lg p-2.5"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Provinsi</label>
              <input
                type="text"
                required
                value={form.schoolProvince}
                onChange={e => setForm({ ...form, schoolProvince: e.target.value })}
                className="w-full border border-slate-200 rounded-lg p-2.5"
              />
            </div>
          </div>
        </div>

        {/* Kepala Sekolah */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-slate-500" />
            2. Pejabat Pengesah Laporan (Kepala Sekolah)
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Nama Kepala Sekolah Lengkap & Gelar</label>
              <input
                type="text"
                required
                value={form.headmasterName}
                onChange={e => setForm({ ...form, headmasterName: e.target.value })}
                className="w-full border border-slate-200 rounded-lg p-2.5 font-semibold"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">NIP Kepala Sekolah</label>
              <input
                type="text"
                required
                value={form.headmasterNip}
                onChange={e => setForm({ ...form, headmasterNip: e.target.value })}
                className="w-full border border-slate-200 rounded-lg p-2.5 font-mono-tabular"
              />
            </div>
          </div>
        </div>

        {/* Kebijakan Presensi & Lock */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-500" />
            3. Kebijakan & Toleransi Presensi
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Batas Waktu Toleransi Penguncian (Jam)</label>
              <input
                type="number"
                min={1}
                max={168}
                value={form.lockTimeoutHours}
                onChange={e => setForm({ ...form, lockTimeoutHours: parseInt(e.target.value, 10) || 24 })}
                className="w-full border border-slate-200 rounded-lg p-2.5 font-mono-tabular"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Setelah batas waktu terlewati, sesi absensi terkunci dan hanya dapat diedit via persetujuan admin.
              </span>
            </div>

            <div className="flex flex-col justify-center">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.allowHomeroomCorrection}
                  onChange={e => setForm({ ...form, allowHomeroomCorrection: e.target.checked })}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                />
                <span className="font-semibold text-slate-800">
                  Izinkan Wali Kelas Mengoreksi Presensi Siswa (Wajib Alasan & Audit Log)
                </span>
              </label>
              <span className="text-[11px] text-slate-500 mt-1 pl-7">
                Jika diaktifkan, wali kelas dapat memperbarui status siswa rombelnya dengan merekam riwayat audit resmi.
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs flex items-center gap-2 transition-colors"
          >
            <Save className="w-4 h-4" />
            Simpan Konfigurasi Sekolah
          </button>
        </div>
      </form>
    </div>
  );
};

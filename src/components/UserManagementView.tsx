import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ShieldCheck, Plus, Key, CheckCircle2, XCircle, Search } from 'lucide-react';
import { User, UserRole } from '../types';

export const UserManagementView: React.FC = () => {
  const { 
    users, 
    teachers, 
    rombels, 
    students, 
    addUser, 
    updateUser, 
    resetUserPassword, 
    assignSecretary,
    showToast 
  } = useApp();
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [resetModalUser, setResetModalUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');

  const [form, setForm] = useState({
    username: '',
    name: '',
    email: '',
    role: 'guru' as UserRole,
    teacherId: teachers[0]?.id || '',
    studentId: '',
    secretaryRombelId: rombels[0]?.id || '',
    status: 'active' as 'active' | 'inactive'
  });

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.username || !form.name || !form.email) {
      showToast('Lengkapi semua kolom formulir akun.', 'error');
      return;
    }

    if (form.role === 'sekretaris' && (!form.studentId || !form.secretaryRombelId)) {
      showToast('Sekretaris harus ditautkan ke rombel dan siswa yang valid.', 'error');
      return;
    }

    addUser({
      ...form,
      passwordHash: 'hashed_password_default123'
    });

    if (form.role === 'sekretaris' && form.studentId && form.secretaryRombelId) {
      assignSecretary(form.studentId, form.secretaryRombelId, 'Dibuat melalui modul Pengguna & Akses');
    }

    setShowAddModal(false);
    setForm({
      username: '',
      name: '',
      email: '',
      role: 'guru',
      teacherId: teachers[0]?.id || '',
      studentId: '',
      secretaryRombelId: rombels[0]?.id || '',
      status: 'active'
    });
  };

  const handleResetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetModalUser || !newPassword.trim()) return;
    resetUserPassword(resetModalUser.id, newPassword);
    setResetModalUser(null);
    setNewPassword('');
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                Otorisasi Keamanan
              </span>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs text-slate-500 font-medium">RBAC (Role-Based Access Control)</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-1">
              Pengguna & Hak Akses Sistem
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Kelola akun administrator, wali kelas, dan guru mata pelajaran serta pengaturan reset password
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs flex items-center gap-1.5 transition-colors self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            Tambah Pengguna Baru
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="overflow-x-auto border border-slate-200 rounded-lg">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">No</th>
                <th className="py-2.5 px-3">Nama Pengguna</th>
                <th className="py-2.5 px-3">Username</th>
                <th className="py-2.5 px-3">Email</th>
                <th className="py-2.5 px-3">Peran (Role)</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Terakhir Masuk</th>
                <th className="py-2.5 px-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u, idx) => (
                <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-2.5 px-3 font-mono-tabular text-slate-400">{idx + 1}</td>
                  <td className="py-2.5 px-3 font-semibold text-slate-900">{u.name}</td>
                  <td className="py-2.5 px-3 font-mono-tabular text-slate-700">{u.username}</td>
                  <td className="py-2.5 px-3 text-slate-600">{u.email}</td>
                  <td className="py-2.5 px-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                      u.role === 'admin' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                      u.role === 'wali_kelas' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                      u.role === 'sekretaris' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                      'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}>
                      {u.role === 'admin' ? 'Administrator' : u.role === 'wali_kelas' ? 'Wali Kelas' : u.role === 'sekretaris' ? 'Sekretaris Kelas' : 'Guru Mapel'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      {u.status === 'active' ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-mono-tabular text-slate-500">
                    {u.lastLogin || '-'}
                  </td>
                  <td className="py-2.5 px-3 text-right space-x-2">
                    <button
                      onClick={() => setResetModalUser(u)}
                      className="inline-flex items-center gap-1 text-slate-700 hover:text-slate-900 font-medium px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded"
                    >
                      <Key className="w-3 h-3 text-amber-500" />
                      Reset Pass
                    </button>
                    {u.status === 'active' ? (
                      <button
                        onClick={() => updateUser(u.id, { status: 'inactive' })}
                        className="text-rose-600 hover:text-rose-800 font-medium"
                      >
                        Nonaktifkan
                      </button>
                    ) : (
                      <button
                        onClick={() => updateUser(u.id, { status: 'active' })}
                        className="text-emerald-600 hover:text-emerald-800 font-medium"
                      >
                        Aktifkan
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL RESET PASSWORD */}
      {resetModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900">
              Reset Password Pengguna
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Atur ulang password untuk akun: <span className="font-semibold text-slate-800">{resetModalUser.name}</span>
            </p>
            <form onSubmit={handleResetSubmit} className="space-y-3 mt-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Password Baru
                </label>
                <input
                  type="password"
                  required
                  placeholder="Ketik password baru..."
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setResetModalUser(null)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs"
                >
                  Simpan Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH PENGGUNA */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900">
              Tambah Pengguna Sistem Baru
            </h3>
            <form onSubmit={handleCreateUser} className="space-y-3 mt-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Nama Lengkap <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg p-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Username <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={form.username}
                    onChange={e => setForm({ ...form, username: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2 font-mono-tabular"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Peran (Role) <span className="text-rose-500">*</span></label>
                  <select
                    value={form.role}
                    onChange={e => setForm({ ...form, role: e.target.value as any })}
                    className="w-full border border-slate-200 rounded-lg p-2"
                  >
                    <option value="guru">Guru Mata Pelajaran</option>
                    <option value="wali_kelas">Wali Kelas</option>
                    <option value="sekretaris">Sekretaris Kelas</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
              </div>

              {form.role === 'sekretaris' ? (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Rombel Penugasan <span className="text-rose-500">*</span></label>
                      <select
                        value={form.secretaryRombelId}
                        onChange={e => {
                          const rId = e.target.value;
                          const rStudents = students.filter(s => s.rombelId === rId && s.status === 'active');
                          const firstSt = rStudents[0];
                          setForm({
                            ...form,
                            secretaryRombelId: rId,
                            studentId: firstSt ? firstSt.id : '',
                            name: firstSt ? `${firstSt.name} (Sekretaris Kelas)` : form.name
                          });
                        }}
                        className="w-full border border-slate-200 rounded-lg p-2"
                      >
                        {rombels.map(r => (
                          <option key={r.id} value={r.id}>{r.name} ({r.code})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Pilih Siswa Aktif <span className="text-rose-500">*</span></label>
                      <select
                        value={form.studentId}
                        onChange={e => {
                          const stId = e.target.value;
                          const st = students.find(s => s.id === stId);
                          setForm({
                            ...form,
                            studentId: stId,
                            name: st ? `${st.name} (Sekretaris Kelas)` : form.name,
                            username: st ? `sekretaris_${st.nis}` : form.username,
                            email: st ? `sekretaris.${st.nis}@smk.sch.id` : form.email
                          });
                        }}
                        className="w-full border border-slate-200 rounded-lg p-2"
                      >
                        <option value="">-- Pilih Siswa --</option>
                        {students
                          .filter(s => s.rombelId === form.secretaryRombelId && s.status === 'active')
                          .map(st => (
                            <option key={st.id} value={st.id}>{st.name} (NIS: {st.nis})</option>
                          ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Email Akun <span className="text-rose-500">*</span></label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={e => setForm({ ...form, email: e.target.value })}
                      className="w-full border border-slate-200 rounded-lg p-2"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Email <span className="text-rose-500">*</span></label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={e => setForm({ ...form, email: e.target.value })}
                      className="w-full border border-slate-200 rounded-lg p-2"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Tautkan ke Data Guru (Opsional)</label>
                    <select
                      value={form.teacherId}
                      onChange={e => setForm({ ...form, teacherId: e.target.value })}
                      className="w-full border border-slate-200 rounded-lg p-2"
                    >
                      <option value="">-- Tanpa Relasi Guru --</option>
                      {teachers.map(t => (
                        <option key={t.id} value={t.id}>{t.name} (NIP: {t.nip})</option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs"
                >
                  Buat Pengguna
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { History, Search, ShieldCheck, Filter, FileText } from 'lucide-react';
import { formatDateIndo } from '../utils/attendanceCalculations';

export const AuditLogView: React.FC = () => {
  const { auditLogs } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAction, setFilterAction] = useState('all');

  const filteredLogs = useMemo(() => {
    return auditLogs.filter(log => {
      const matchSearch = 
        log.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (log.reason && log.reason.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchAction = filterAction === 'all' || log.action === filterAction;
      return matchSearch && matchAction;
    });
  }, [auditLogs, searchQuery, filterAction]);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                Integritas & Kepatuhan
              </span>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs text-slate-500 font-medium">Rekaman Jejak Audit Tidak Dapat Dihapus</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-1">
              Audit Log & Riwayat Perubahan Data
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Mencatat pengguna, waktu, aksi perubahan, nilai sebelum vs sesudah, serta alasan koreksi resmi
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Table */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari deskripsi, nama pengguna, atau alasan..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg focus:ring-1 focus:ring-slate-900"
            />
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-slate-600">Aksi:</span>
            <select
              value={filterAction}
              onChange={e => setFilterAction(e.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-1.5 bg-slate-50 text-slate-800"
            >
              <option value="all">Semua Aksi</option>
              <option value="CREATE">CREATE (Tambah)</option>
              <option value="UPDATE">UPDATE (Perbarui)</option>
              <option value="CORRECTION">CORRECTION (Koreksi)</option>
              <option value="LOCK">LOCK (Kunci)</option>
              <option value="UNLOCK">UNLOCK (Buka Kunci)</option>
              <option value="IMPORT">IMPORT (Impor)</option>
              <option value="DELETE">DELETE (Hapus)</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto border border-slate-200 rounded-lg">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Waktu (WIB)</th>
                <th className="py-2.5 px-3">Pengguna</th>
                <th className="py-2.5 px-3 text-center">Aksi</th>
                <th className="py-2.5 px-3">Entitas</th>
                <th className="py-2.5 px-3">Deskripsi Aktivitas</th>
                <th className="py-2.5 px-3">Detail Perubahan</th>
                <th className="py-2.5 px-3">Alasan Koreksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Tidak ada log audit yang cocok dengan filter.
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => {
                  let actionClass = 'bg-slate-100 text-slate-700';
                  if (log.action === 'CREATE') actionClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                  else if (log.action === 'CORRECTION') actionClass = 'bg-amber-50 text-amber-800 border-amber-200';
                  else if (log.action === 'LOCK') actionClass = 'bg-purple-50 text-purple-700 border-purple-200';
                  else if (log.action === 'DELETE') actionClass = 'bg-rose-50 text-rose-700 border-rose-200';

                  return (
                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3 font-mono-tabular text-slate-600 whitespace-nowrap">
                        {log.timestamp}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-900">
                        <div>{log.userName}</div>
                        <span className="text-[10px] text-slate-400 capitalize">{log.userRole.replace('_', ' ')}</span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${actionClass}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono-tabular text-slate-600">
                        {log.entity}
                      </td>
                      <td className="py-2.5 px-3 text-slate-800 max-w-xs font-medium">
                        {log.description}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 font-mono text-[11px] max-w-xs truncate">
                        {log.afterValue || log.beforeValue || '-'}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 italic">
                        {log.reason || '-'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

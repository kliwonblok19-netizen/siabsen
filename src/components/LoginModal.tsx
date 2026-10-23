import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { KeyRound, ShieldAlert, X, CheckCircle2, User, Lock, ArrowRight } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const { authenticateUser } = useApp();
  const [usernameOrEmail, setUsernameOrEmail] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    const result = await authenticateUser(usernameOrEmail, password);
    setLoading(false);

    if (result.success) {
      onClose();
    } else {
      setErrorMessage(result.message);
    }
  };

  const handleQuickFill = (u: string, p: string) => {
    setUsernameOrEmail(u);
    setPassword(p);
    setErrorMessage(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
              <KeyRound className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Masuk ke Akun Sistem
              </h3>
              <p className="text-[11px] text-slate-500">
                Autentikasi Aman & Proteksi Brute-Force
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

        {/* Error Alert */}
        {errorMessage && (
          <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              Username atau Email Dinas
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                required
                value={usernameOrEmail}
                onChange={e => setUsernameOrEmail(e.target.value)}
                placeholder="cth: admin atau siti.wali"
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-slate-900"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 rounded-lg shadow-xs transition-colors flex items-center justify-center gap-2"
          >
            {loading ? 'Memverifikasi...' : 'Masuk Sekarang'}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Demo Fast Account Switch Buttons */}
        <div className="mt-5 pt-4 border-t border-slate-100 text-xs">
          <span className="font-semibold text-slate-600 block mb-2">
            Kredensial Demo untuk Pengujian:
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => handleQuickFill('admin', 'admin123')}
              className="p-2 border border-slate-200 hover:border-slate-400 rounded-lg text-left bg-slate-50 transition-colors"
            >
              <span className="font-bold text-slate-900 block truncate">Admin</span>
              <span className="text-[10px] text-slate-500 font-mono block">admin123</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('siti.wali', 'wali123')}
              className="p-2 border border-slate-200 hover:border-slate-400 rounded-lg text-left bg-slate-50 transition-colors"
            >
              <span className="font-bold text-slate-900 block truncate">Wali Kelas</span>
              <span className="text-[10px] text-slate-500 font-mono block">wali123</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('ahmad.guru', 'guru123')}
              className="p-2 border border-slate-200 hover:border-slate-400 rounded-lg text-left bg-slate-50 transition-colors"
            >
              <span className="font-bold text-slate-900 block truncate">Guru Mapel</span>
              <span className="text-[10px] text-slate-500 font-mono block">guru123</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('sekretaris', 'sekretaris123')}
              className="p-2 border border-indigo-200 hover:border-indigo-400 rounded-lg text-left bg-indigo-50/50 transition-colors"
            >
              <span className="font-bold text-indigo-900 block truncate">Sekretaris</span>
              <span className="text-[10px] text-indigo-700 font-mono block">sekretaris123</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

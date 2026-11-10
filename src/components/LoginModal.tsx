import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Lock, User as UserIcon, Shield, ArrowRight, AlertCircle } from 'lucide-react';

export const LoginModal: React.FC = () => {
  const { currentUser, login, logout, isLoginModalOpen, closeLoginModal, openAdminModal } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isLoginModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password.');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    const result = await login(username.trim(), password.trim());
    setIsSubmitting(false);
    if (!result.success) {
      setError(result.error || 'Authentication failed. Please check your credentials.');
    } else {
      setUsername('');
      setPassword('');
    }
  };

  const fillCredentials = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 font-sans">
      <div className="bg-white border-2 border-black max-w-md w-full p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b-2 border-black">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-black text-white font-bold flex items-center justify-center text-xs">
              CUET
            </div>
            <div>
              <h2 className="text-sm font-bold uppercase tracking-tight text-black">
                Faculty & Admin Authentication
              </h2>
              <p className="text-[11px] font-mono text-neutral-600">
                Department of Computer Science and Engineering
              </p>
            </div>
          </div>
          <button
            onClick={closeLoginModal}
            className="p-1 text-black hover:bg-neutral-100 border border-black"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current User Session Bar */}
        {currentUser && (
          <div className="p-3 mb-4 bg-neutral-50 border border-black flex items-center justify-between text-xs font-mono">
            <div>
              <div className="text-[10px] uppercase text-neutral-500 font-bold">Currently Signed In:</div>
              <div className="font-bold text-black text-sm">{currentUser.name}</div>
              <div className="text-neutral-600 text-[11px]">
                {currentUser.role === 'admin' ? 'System Administrator' : `Coordinator (Batch ${currentUser.assignedBatchId})`}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {currentUser.role === 'admin' && (
                <button
                  type="button"
                  onClick={() => {
                    closeLoginModal();
                    openAdminModal();
                  }}
                  className="px-2 py-1 text-[11px] font-bold border border-black bg-black text-white hover:bg-neutral-800 transition-colors"
                >
                  Manage Users
                </button>
              )}
              <button
                type="button"
                onClick={logout}
                className="px-2 py-1 text-[11px] font-bold border border-black bg-white hover:bg-black hover:text-white transition-colors"
              >
                Log Out
              </button>
            </div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4 mb-4">
          {error && (
            <div className="p-2.5 bg-neutral-100 border border-black text-xs text-black flex items-center gap-2 font-mono">
              <AlertCircle className="w-4 h-4 shrink-0 text-black" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-black mb-1">
              Username:
            </label>
            <div className="relative">
              <UserIcon className="w-4 h-4 absolute left-3 top-2.5 text-neutral-500" />
              <input
                type="text"
                placeholder="e.g. rashadur, mamun, admin"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full text-xs pl-9 pr-3 py-2 border border-black font-mono outline-none focus:bg-neutral-50"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-black mb-1">
              Password:
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-2.5 text-neutral-500" />
              <input
                type="password"
                placeholder="Enter password..."
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full text-xs pl-9 pr-3 py-2 border border-black font-mono outline-none focus:bg-neutral-50"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 text-xs font-bold uppercase tracking-wider border-2 border-black bg-black text-white hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50"
          >
            <span>{isSubmitting ? 'Authenticating...' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Demo Credentials Helper */}
        <div className="border-t border-neutral-300 pt-3">
          <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 font-bold mb-2">
            Quick Test Logins (Click to autofill):
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <button
              type="button"
              onClick={() => fillCredentials('admin', 'admin123')}
              className="p-2 border border-black bg-white hover:bg-black hover:text-white transition-colors text-left"
            >
              <div className="font-bold flex items-center gap-1">
                <Shield className="w-3 h-3 text-current" />
                <span>Admin Account</span>
              </div>
              <div className="text-[10px] opacity-75">admin / admin123</div>
            </button>

            <button
              type="button"
              onClick={() => fillCredentials('rashadur', 'cuet123')}
              className="p-2 border border-black bg-white hover:bg-black hover:text-white transition-colors text-left"
            >
              <div className="font-bold">Coord. Rashadur</div>
              <div className="text-[10px] opacity-75">Batch 2022 (cuet123)</div>
            </button>

            <button
              type="button"
              onClick={() => fillCredentials('mamun', 'cuet123')}
              className="p-2 border border-black bg-white hover:bg-black hover:text-white transition-colors text-left"
            >
              <div className="font-bold">Coord. Mamun</div>
              <div className="text-[10px] opacity-75">Batch 2025 (cuet123)</div>
            </button>

            <button
              type="button"
              onClick={() => fillCredentials('rizvi', 'cuet123')}
              className="p-2 border border-black bg-white hover:bg-black hover:text-white transition-colors text-left"
            >
              <div className="font-bold">Coord. Rizvi</div>
              <div className="text-[10px] opacity-75">Batch 2024 (cuet123)</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

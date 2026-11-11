import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, User, Shield, ArrowRight, AlertCircle } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, currentUser } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password.');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    const res = await login(username.trim(), password.trim());
    setIsSubmitting(false);

    if (res.success) {
      if (currentUser?.role === 'coordinator' && currentUser.assignedBatchId) {
        navigate(`/batch/${currentUser.assignedBatchId}`);
      } else {
        navigate('/portal');
      }
    } else {
      setError(res.error || 'Invalid username or password.');
    }
  };

  const handleAutofill = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col justify-between font-sans text-black">
      {/* Top Academic Masthead */}
      <header className="border-b-2 border-black bg-white">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/portal"
              className="w-10 h-10 border-2 border-black flex items-center justify-center font-bold text-base tracking-tighter bg-black text-white hover:bg-neutral-800 transition-colors"
            >
              CUET
            </Link>
            <div>
              <h1 className="text-sm font-bold tracking-tight uppercase leading-none">
                Department of Computer Science and Engineering
              </h1>
              <p className="text-xs text-neutral-600 font-mono mt-0.5">
                Chittagong University of Engineering & Technology
              </p>
            </div>
          </div>
          {/* <Link
            to="/portal"
            className="text-xs font-mono font-bold flex items-center gap-1.5 border border-black px-3 py-1.5 bg-white hover:bg-black hover:text-white transition-colors"
          >
            <span>Browse Portal as Guest</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link> */}
        </div>
      </header>

      {/* Main Login Card */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white border-2 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          {/* Header */}
          <div className="text-center pb-5 mb-6 border-b-2 border-black">
            <span className="inline-block px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-widest bg-neutral-100 border border-black mb-2">
              Authentication Portal
            </span>
            <h2 className="text-2xl font-bold uppercase tracking-tight text-black">
              User Sign In
            </h2>
            <p className="text-xs text-neutral-600 font-mono mt-1">
              Course Coordinators & Department Administrator
            </p>
          </div>

          {/* Already logged in notice */}
          {currentUser && (
            <div className="mb-5 p-3 bg-neutral-100 border border-black text-xs font-mono flex items-center justify-between">
              <div>
                <span className="text-neutral-500">Active user:</span> <strong>{currentUser.name}</strong> ({currentUser.role})
              </div>
              <button
                onClick={() => navigate('/portal')}
                className="text-[11px] underline font-bold hover:text-neutral-700"
              >
                Go to Portal →
              </button>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="p-3 mb-5 bg-neutral-100 border border-black text-xs font-mono text-black flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-black" />
              <span>{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4 mb-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-black mb-1.5">
                Username / User ID:
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-3 text-neutral-500" />
                <input
                  type="text"
                  placeholder="e.g. admin, rashadur, mamun"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full text-xs pl-9 pr-3 py-2.5 border border-black font-mono bg-white outline-none focus:bg-neutral-50"
                  required
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-black mb-1.5">
                Password:
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-3 text-neutral-500" />
                <input
                  type="password"
                  placeholder="Enter password..."
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full text-xs pl-9 pr-3 py-2.5 border border-black font-mono bg-white outline-none focus:bg-neutral-50"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 text-xs font-bold uppercase tracking-wider border-2 border-black bg-black text-white hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50 mt-2"
            >
              <span>{isSubmitting ? 'Verifying...' : 'Sign In to Routine System'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Demo Credentials Helper */}
          <div className="border-t border-neutral-300 pt-4">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 font-bold">
                Test Accounts (Click to Autofill):
              </span>
              <span className="text-[10px] font-mono text-neutral-400">1-click demo</span>
            </div>

            <div className="space-y-1.5 text-xs font-mono">
              {/* Admin Account */}
              <button
                type="button"
                onClick={() => handleAutofill('admin', 'admin123')}
                className="w-full p-2 border border-black bg-neutral-50 hover:bg-black hover:text-white transition-colors text-left flex items-center justify-between group"
              >
                <div>
                  <div className="font-bold flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5" />
                    <span>Admin Account (Head of Dept)</span>
                  </div>
                  <div className="text-[10px] opacity-75">Creates coordinator accounts & assigns batches</div>
                </div>
                <span className="text-[10px] font-bold px-1.5 py-0.5 border border-current">
                  admin / admin123
                </span>
              </button>

              {/* Coordinator 2022 */}
              <button
                type="button"
                onClick={() => handleAutofill('rashadur', 'cuet123')}
                className="w-full p-2 border border-black bg-white hover:bg-black hover:text-white transition-colors text-left flex items-center justify-between group"
              >
                <div>
                  <div className="font-bold">Coordinator: Md. Rashadur Rahman</div>
                  <div className="text-[10px] opacity-75">Assigned to: Batch 2022 (L-3 T-II)</div>
                </div>
                <span className="text-[10px] font-bold px-1.5 py-0.5 border border-current">
                  rashadur / cuet123
                </span>
              </button>

              {/* Coordinator 2025 */}
              <button
                type="button"
                onClick={() => handleAutofill('mamun', 'cuet123')}
                className="w-full p-2 border border-black bg-white hover:bg-black hover:text-white transition-colors text-left flex items-center justify-between group"
              >
                <div>
                  <div className="font-bold">Coordinator: Md. Al-Mamun Provath</div>
                  <div className="text-[10px] opacity-75">Assigned to: Batch 2025 (L-1 T-I)</div>
                </div>
                <span className="text-[10px] font-bold px-1.5 py-0.5 border border-current">
                  mamun / cuet123
                </span>
              </button>

              {/* Coordinator 2024 */}
              <button
                type="button"
                onClick={() => handleAutofill('rizvi', 'cuet123')}
                className="w-full p-2 border border-black bg-white hover:bg-black hover:text-white transition-colors text-left flex items-center justify-between group"
              >
                <div>
                  <div className="font-bold">Coordinator: Md. Atiqul Islam Rizvi</div>
                  <div className="text-[10px] opacity-75">Assigned to: Batch 2024 (L-2 T-I)</div>
                </div>
                <span className="text-[10px] font-bold px-1.5 py-0.5 border border-current">
                  rizvi / cuet123
                </span>
              </button>
            </div>

            {/* Guest / Student Access Option */}
            <div className="mt-4 pt-3 border-t border-neutral-200 text-center">
              <button
                type="button"
                onClick={() => navigate('/portal')}
                className="text-xs font-mono text-neutral-600 hover:text-black hover:underline inline-flex items-center gap-1.5 font-semibold"
              >
                <span>Continue to Semester Portal as Guest (Read-Only)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t-2 border-black bg-white py-3 text-center text-xs font-mono text-neutral-500">
        CUET CSE Routine Management System • Authentication & Authorization Gateway
      </footer>
    </div>
  );
};

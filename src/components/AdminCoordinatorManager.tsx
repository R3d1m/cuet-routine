import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRoutine } from '../context/RoutineContext';
import { api } from '../services/api';
import { User } from '../types';
import { X, UserPlus, Shield, Trash2, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

export const AdminCoordinatorManager: React.FC = () => {
  const { isAdminModalOpen, closeAdminModal, isAdmin, currentUser } = useAuth();
  const { teachers, batches } = useRoutine();

  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [selectedTeacherId, setSelectedTeacherId] = useState(teachers[0]?.id || '');
  const [assignedBatchId, setAssignedBatchId] = useState(batches[0]?.id || '2026');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const fetched = await api.getUsers();
      setUsers(fetched);
    } catch (e: any) {
      setError('Failed to load users: ' + (e.message || 'Server error'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAdminModalOpen) {
      fetchUsers();
    }
  }, [isAdminModalOpen]);

  if (!isAdminModalOpen || !isAdmin) return null;

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Please provide a username and password.');
      return;
    }

    const teacher = teachers.find(t => t.id === selectedTeacherId);
    const teacherName = teacher ? teacher.name : username;

    setIsSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    try {
      await api.createUser({
        username: username.trim().toLowerCase(),
        password: password.trim(),
        role: 'coordinator',
        name: teacherName,
        teacher_id: selectedTeacherId,
        assigned_batch_id: assignedBatchId
      });

      setSuccessMsg(`Coordinator account "${username.toLowerCase()}" created and assigned to Batch ${assignedBatchId}.`);
      setUsername('');
      setPassword('');
      fetchUsers();
    } catch (err: any) {
      setError(err.message || 'Failed to create coordinator account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId: string, targetUsername: string) => {
    if (targetUsername === 'admin') {
      alert('The admin account cannot be deleted.');
      return;
    }
    if (!confirm(`Are you sure you want to delete coordinator account "${targetUsername}"?`)) {
      return;
    }

    try {
      await api.deleteUser(userId);
      setSuccessMsg(`Account "${targetUsername}" deleted.`);
      fetchUsers();
    } catch (err: any) {
      setError(err.message || 'Failed to delete user.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 font-sans">
      <div className="bg-white border-2 border-black max-w-2xl w-full p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b-2 border-black">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-black text-white font-bold flex items-center justify-center text-xs">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold uppercase tracking-tight text-black">
                Admin Panel • Course Coordinator Accounts
              </h2>
              <p className="text-[11px] font-mono text-neutral-600">
                Create and manage coordinator credentials and batch assignments
              </p>
            </div>
          </div>
          <button
            onClick={closeAdminModal}
            className="p-1 text-black hover:bg-neutral-100 border border-black"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Feedback messages */}
        {error && (
          <div className="p-2.5 mb-3 bg-neutral-100 border border-black text-xs font-mono flex items-center gap-2 text-black">
            <AlertCircle className="w-4 h-4 shrink-0 text-black" />
            <span>{error}</span>
          </div>
        )}
        {successMsg && (
          <div className="p-2.5 mb-3 bg-neutral-50 border border-black text-xs font-mono flex items-center gap-2 text-black">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-black" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Section 1: Create New Coordinator Account Form */}
        <div className="border border-black p-4 bg-neutral-50 mb-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-black flex items-center gap-1.5 mb-3">
            <UserPlus className="w-3.5 h-3.5" />
            <span>Create New Coordinator Account</span>
          </h3>

          <form onSubmit={handleCreateUser} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-black mb-1">
                  Username:
                </label>
                <input
                  type="text"
                  placeholder="e.g. shafin, tista"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full text-xs p-2 border border-black font-mono bg-white outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-black mb-1">
                  Password:
                </label>
                <input
                  type="text"
                  placeholder="e.g. cuet123"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full text-xs p-2 border border-black font-mono bg-white outline-none"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-black mb-1">
                  Assign Faculty Member:
                </label>
                <select
                  value={selectedTeacherId}
                  onChange={e => setSelectedTeacherId(e.target.value)}
                  className="w-full text-xs p-2 border border-black font-mono bg-white outline-none"
                >
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.initials}) — {t.designation}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-black mb-1">
                  Assigned Batch Routine:
                </label>
                <select
                  value={assignedBatchId}
                  onChange={e => setAssignedBatchId(e.target.value)}
                  className="w-full text-xs p-2 border border-black font-mono bg-white outline-none"
                >
                  {batches.map(b => (
                    <option key={b.id} value={b.id}>
                      Batch {b.id} (Level-{b.level} {b.term})
                    </option>
                  ))}
                  <option value="2026">Batch 2026 (Upcoming / New)</option>
                  <option value="2027">Batch 2027 (Upcoming / New)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-bold uppercase tracking-wider border-2 border-black bg-black text-white hover:bg-neutral-800 transition-colors flex items-center gap-1.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50"
              >
                <span>{isSubmitting ? 'Creating...' : 'Create Coordinator Account'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Section 2: Existing Accounts Table */}
        <div className="flex items-center justify-between pb-2 mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-black">
            Registered Accounts ({users.length})
          </span>
          <button
            onClick={fetchUsers}
            title="Refresh list"
            className="p-1 border border-black text-xs hover:bg-neutral-100 flex items-center gap-1"
          >
            <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="text-[10px] font-mono">Refresh</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto border border-black">
          <table className="w-full border-collapse text-left text-xs font-mono">
            <thead>
              <tr className="bg-black text-white text-[11px] uppercase tracking-wider">
                <th className="p-2 border-r border-neutral-700">Username</th>
                <th className="p-2 border-r border-neutral-700">Name / Faculty</th>
                <th className="p-2 border-r border-neutral-700">Role</th>
                <th className="p-2 border-r border-neutral-700">Assigned Batch</th>
                <th className="p-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-b border-neutral-300 last:border-b-0 hover:bg-neutral-50">
                  <td className="p-2 border-r border-neutral-300 font-bold text-black">
                    {u.username}
                  </td>
                  <td className="p-2 border-r border-neutral-300">
                    {u.name}
                  </td>
                  <td className="p-2 border-r border-neutral-300">
                    <span className={`px-1.5 py-0.5 text-[10px] font-bold border uppercase ${
                      u.role === 'admin' 
                        ? 'bg-black text-white border-black' 
                        : 'bg-neutral-100 text-black border-neutral-400'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="p-2 border-r border-neutral-300">
                    {u.assignedBatchId ? (
                      <span className="font-bold">Batch {u.assignedBatchId}</span>
                    ) : (
                      <span className="text-neutral-400">All (Admin)</span>
                    )}
                  </td>
                  <td className="p-2 text-right">
                    {u.username !== 'admin' && u.id !== currentUser?.id && (
                      <button
                        onClick={() => handleDeleteUser(u.id, u.username)}
                        title="Delete account"
                        className="p-1 border border-black text-black hover:bg-black hover:text-white transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="pt-3 mt-3 border-t border-black flex justify-between items-center text-xs font-mono">
          <span className="text-neutral-500 text-[11px]">
            Coordinators can only modify routines for their assigned batch.
          </span>
          <button
            onClick={closeAdminModal}
            className="px-4 py-1.5 border border-black font-bold uppercase hover:bg-black hover:text-white transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

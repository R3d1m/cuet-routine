import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useRoutine } from '../context/RoutineContext';
import { useAuth } from '../context/AuthContext';
import { Calendar, Layers, Printer, Clock, BookOpen, Users, Home, PlusCircle, User, Shield } from 'lucide-react';

export type ViewTab = 'routine' | 'quota' | 'labs' | 'faculty' | 'lifecycle' | 'print';

interface HeaderProps {
  currentTab: ViewTab;
}

export const Header: React.FC<HeaderProps> = ({ currentTab }) => {
  const navigate = useNavigate();
  const { batchId } = useParams<{ batchId: string }>();
  const { batches, activeBatchId, setActiveBatchId, activeBatch } = useRoutine();
  const { currentUser, openLoginModal, canEditBatch, isAdmin, openAdminModal, logout } = useAuth();

  const currentBatchId = batchId || activeBatchId;
  const isCoordinator = canEditBatch(activeBatch);

  const handleBatchChange = (newId: string) => {
    setActiveBatchId(newId);
    if (currentTab === 'routine') {
      navigate(`/batch/${newId}`);
    } else {
      navigate(`/batch/${newId}/${currentTab}`);
    }
  };

  const handleTabClick = (tab: ViewTab) => {
    if (tab === 'routine') {
      navigate(`/batch/${currentBatchId}`);
    } else {
      navigate(`/batch/${currentBatchId}/${tab}`);
    }
  };

  return (
    <header className="border-b-2 border-black bg-white no-print">
      {/* Top Academic Masthead Bar */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/portal')}
            title="Return to Portal"
            className="w-9 h-9 border-2 border-black flex items-center justify-center font-bold text-base tracking-tighter bg-black text-white hover:bg-neutral-800 transition-colors"
          >
            CUET
          </button>
          <div>
            <h1 className="text-base font-bold tracking-tight text-black uppercase leading-none">
              Department of Computer Science & Engineering
            </h1>
            <p className="text-[11px] text-neutral-600 font-mono mt-0.5">
              Semester Class & Lab Routine Management System
            </p>
          </div>
        </div>

        {/* User Authentication & Batch Status */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* User Account / Profile Badge */}
          {currentUser ? (
            <div className="flex items-center gap-1.5">
              <button
                onClick={openLoginModal}
                title="Click to switch user or view profile"
                className="flex items-center gap-2 border-2 border-black px-2.5 py-1 bg-white hover:bg-neutral-100 transition-all text-left"
              >
                <div className={`w-6 h-6 text-white text-[10px] font-bold flex items-center justify-center font-mono ${currentUser.role === 'admin' ? 'bg-neutral-900' : 'bg-black'}`}>
                  {currentUser.role === 'admin' ? 'ADM' : 'CC'}
                </div>
                <div>
                  <div className="text-xs font-bold leading-tight text-black flex items-center gap-1">
                    <span>{currentUser.name}</span>
                    <span className="text-[9px] px-1 py-0.2 border border-black font-mono uppercase bg-neutral-100">
                      {currentUser.role === 'admin' ? 'Admin' : `Batch ${currentUser.assignedBatchId}`}
                    </span>
                  </div>
                  <div className="text-[10px] text-neutral-500 font-mono leading-tight">
                    User: @{currentUser.username}
                  </div>
                </div>
              </button>

              {isAdmin && (
                <button
                  onClick={openAdminModal}
                  title="Open Admin Coordinator Accounts Manager"
                  className="px-2 py-1.5 text-xs font-bold border-2 border-black bg-neutral-100 text-black hover:bg-black hover:text-white transition-colors flex items-center gap-1"
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>Admin Panel</span>
                </button>
              )}

              <button
                onClick={logout}
                title="Sign out of current account"
                className="px-2 py-1.5 text-xs font-mono border border-black text-neutral-600 hover:bg-black hover:text-white transition-colors"
              >
                Exit
              </button>
            </div>
          ) : (
            <button
              onClick={openLoginModal}
              className="px-3 py-1.5 text-xs font-bold border-2 border-black bg-black text-white hover:bg-neutral-800 transition-colors flex items-center gap-1.5"
            >
              <User className="w-3.5 h-3.5" />
              <span>Log In</span>
            </button>
          )}

          {/* Batch Switcher */}
          <div className="flex items-center border border-black px-2 py-1 bg-white">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-600 mr-1.5">Batch:</span>
            <select
              value={currentBatchId}
              onChange={e => handleBatchChange(e.target.value)}
              className="text-xs font-bold bg-transparent outline-none cursor-pointer"
            >
              {batches.map(b => (
                <option key={b.id} value={b.id}>
                  Batch {b.id} — L{b.level} {b.term} {b.isArchived ? '(Archived)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Edit Permission Status Pill */}
          <div className={`px-2.5 py-1 text-[11px] font-mono border flex items-center gap-1.5 ${
            isCoordinator 
              ? 'bg-black text-white border-black font-bold'
              : 'bg-neutral-100 text-neutral-700 border-black'
          }`}>
            <span className={`w-2 h-2 rounded-full ${isCoordinator ? 'bg-white' : 'bg-neutral-400'}`}></span>
            <span>
              {isCoordinator 
                ? (isAdmin ? 'Admin Mode (Full Access)' : `Editing Enabled (Batch ${activeBatch.id})`) 
                : `Read-Only (Coordinator: ${activeBatch.coordinatorName})`}
            </span>
          </div>

          <button
            onClick={() => navigate('/create')}
            className="px-2.5 py-1 text-xs font-bold bg-black text-white hover:bg-neutral-800 transition-colors flex items-center gap-1 border border-black"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>+ Create</span>
          </button>

          <button
            onClick={() => navigate('/portal')}
            className="px-2 py-1 text-xs font-semibold border border-black hover:bg-neutral-100 transition-colors flex items-center gap-1"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Portal</span>
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="max-w-7xl mx-auto px-4 flex items-center gap-1 border-t border-neutral-200 overflow-x-auto">
        <button
          onClick={() => handleTabClick('routine')}
          className={`px-3 py-2 text-xs font-medium border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
            currentTab === 'routine'
              ? 'border-black text-black font-bold bg-neutral-50'
              : 'border-transparent text-neutral-600 hover:text-black hover:border-neutral-300'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Weekly Timetable</span>
        </button>

        <button
          onClick={() => handleTabClick('quota')}
          className={`px-3 py-2 text-xs font-medium border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
            currentTab === 'quota'
              ? 'border-black text-black font-bold bg-neutral-50'
              : 'border-transparent text-neutral-600 hover:text-black hover:border-neutral-300'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Course Credits & Quotas</span>
        </button>

        <button
          onClick={() => handleTabClick('labs')}
          className={`px-3 py-2 text-xs font-medium border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
            currentTab === 'labs'
              ? 'border-black text-black font-bold bg-neutral-50'
              : 'border-transparent text-neutral-600 hover:text-black hover:border-neutral-300'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Lab Occupancy Matrix</span>
        </button>

        <button
          onClick={() => handleTabClick('faculty')}
          className={`px-3 py-2 text-xs font-medium border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
            currentTab === 'faculty'
              ? 'border-black text-black font-bold bg-neutral-50'
              : 'border-transparent text-neutral-600 hover:text-black hover:border-neutral-300'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Faculty Preferences</span>
        </button>

        <button
          onClick={() => handleTabClick('lifecycle')}
          className={`px-3 py-2 text-xs font-medium border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
            currentTab === 'lifecycle'
              ? 'border-black text-black font-bold bg-neutral-50'
              : 'border-transparent text-neutral-600 hover:text-black hover:border-neutral-300'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Batch Lifecycle & PL / DL</span>
        </button>

        <button
          onClick={() => handleTabClick('print')}
          className={`px-3 py-2 text-xs font-medium border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ml-auto ${
            currentTab === 'print'
              ? 'border-black text-black font-bold bg-neutral-50'
              : 'border-transparent text-neutral-600 hover:text-black hover:border-neutral-300'
          }`}
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Official Print & Export</span>
        </button>
      </div>
    </header>
  );
};

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useRoutine } from '../context/RoutineContext';
import { useAuth } from '../context/AuthContext';
import { AdminDashboard } from './AdminDashboard';
import { PlusCircle, Calendar, ArrowRight, BookOpen, Layers, Clock, Archive, Lock, ExternalLink, User } from 'lucide-react';

interface LandingPortalProps {
  onOpenExisting: (batchId: string) => void;
  onCreateNew: () => void;
}

export const LandingPortal: React.FC<LandingPortalProps> = ({
  onOpenExisting,
  onCreateNew
}) => {
  const navigate = useNavigate();
  const { batches, setActiveBatchId, slots } = useRoutine();
  const { currentUser, logout } = useAuth();

  // Admin View: When logged in as Administrator, show only Appointed Course Coordinators by Batch and Add Teacher
  if (currentUser?.role === 'admin') {
    return <AdminDashboard onOpenRoutine={onOpenExisting} />;
  }

  // Active batches (all 4-year degrees in progress; PL/DL does not end the degree)
  const activeBatches = batches.filter(b => !b.isDegreeCompleted);
  // Concluded semester routines (archived for exams)
  const pastBatches = batches.filter(b => b.isArchived || b.isDegreeCompleted);

  // Selected batch for the active routine card
  const [selectedBatchId, setSelectedBatchId] = useState<string>(
    activeBatches[0]?.id || batches[0]?.id || '2022'
  );

  const handleOpenSelected = () => {
    setActiveBatchId(selectedBatchId);
    onOpenExisting(selectedBatchId);
  };

  const handleOpenPastSemester = (batchId: string) => {
    setActiveBatchId(batchId);
    onOpenExisting(batchId);
  };

  const hasActiveSemester = activeBatches.length > 0;

  return (
    <div className="min-h-screen bg-white text-black flex flex-col justify-between font-sans">
      {/* Top Academic Masthead */}
      <div className="border-b-2 border-black bg-white">
        <div className="max-w-6xl mx-auto px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 border-2 border-black flex items-center justify-center font-bold text-base tracking-tighter bg-black text-white">
              CUET
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight uppercase leading-none">
                Department of Computer Science and Engineering
              </h1>
              <p className="text-xs text-neutral-600 font-mono mt-0.5">
                Chittagong University of Engineering & Technology
              </p>
            </div>
          </div>

          {/* User Auth & Login Controls */}
          <div className="flex items-center gap-3">
            {currentUser ? (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  title="Switch user account"
                  className="flex items-center gap-2 border-2 border-black px-2.5 py-1.5 bg-white hover:bg-neutral-100 transition-colors text-left"
                >
                  <div className="w-6 h-6 bg-black text-white text-[10px] font-bold flex items-center justify-center font-mono">
                    CC
                  </div>
                  <div>
                    <div className="text-xs font-bold leading-tight text-black flex items-center gap-1.5">
                      <span>{currentUser.name}</span>
                      <span className="text-[9px] px-1 py-0.2 border border-black font-mono uppercase bg-neutral-100">
                        {`Batch ${currentUser.assignedBatchId}`}
                      </span>
                    </div>
                    <div className="text-[10px] text-neutral-500 font-mono leading-tight">
                      Signed in as @{currentUser.username}
                    </div>
                  </div>
                </Link>

                <button
                  onClick={() => {
                    logout();
                    navigate('/');
                  }}
                  className="px-2.5 py-1.5 text-xs font-mono font-bold border border-black hover:bg-black hover:text-white transition-colors"
                >
                  Log Out
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="px-4 py-2 text-xs font-bold border-2 border-black bg-black text-white hover:bg-neutral-800 transition-colors flex items-center gap-1.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              >
                <User className="w-3.5 h-3.5" />
                <span>Faculty / Admin Sign In</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-5xl mx-auto px-6 py-10 w-full flex-1 flex flex-col justify-center">
        {/* Title Header */}
        <div className="text-center mb-8">
          <span className="inline-block px-2.5 py-0.5 text-[11px] font-mono font-bold uppercase tracking-widest bg-neutral-100 border border-black mb-3">
            Course Coordinator Gateway
          </span>
          <h2 className="text-3xl font-bold tracking-tight uppercase text-black">
            Semester Routine Management
          </h2>
          {/* <p className="text-xs text-neutral-600 max-w-lg mx-auto mt-2">
            Automated conflict resolution with senior faculty priority, physical lab scheduling, and 5-batch clash detection.
          </p> */}
        </div>

        {/* PRIMARY ACTIONS AREA */}
        {hasActiveSemester ? (
          /* Case A: Active Semesters are Running -> Show Both Options */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto w-full mb-12">
            {/* Option 01: Current Active Routine */}
            <div className="border-2 border-black p-6 bg-white hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-black">
                  <span className="text-[11px] font-bold font-mono uppercase tracking-wider text-neutral-500">
                    Active Semester
                  </span>
                  <Calendar className="w-5 h-5 text-black" />
                </div>

                <h3 className="text-xl font-bold uppercase tracking-tight text-black mb-2">
                  Current Routine (View & Edit)
                </h3>
                <p className="text-xs text-neutral-600 mb-6">
                  Inspect and modify an active semester routine.
                </p>

                {/* Active Batch Selector */}
                <div className="mb-4">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-black mb-1">
                    Select Active Batch:
                  </label>
                  <select
                    value={selectedBatchId}
                    onChange={e => setSelectedBatchId(e.target.value)}
                    className="w-full text-xs p-2.5 border border-black bg-white font-mono font-semibold"
                  >
                    {activeBatches.map(b => {
                      const batchSlotCount = slots.filter(s => s.batchId === b.id).length;
                      const statusTag = b.isArchived 
                        ? `[Term Concluded on ${b.plDlDate || 'PL/DL'} • Next Term Available]` 
                        : `(${batchSlotCount} sessions in progress)`;
                      return (
                        <option key={b.id} value={b.id}>
                          Batch {b.id} — Level-{b.level} {b.term} {statusTag}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Quick Batch Details */}
                {(() => {
                  const current = batches.find(b => b.id === selectedBatchId);
                  if (!current) return null;
                  return (
                    <div className="p-3 bg-neutral-50 border border-neutral-300 text-[11px] font-mono space-y-1.5 mb-6">
                      <div><span className="text-neutral-500">Course Coordinator:</span> <span className="font-bold text-black">{current.coordinatorName}</span></div>
                      <div><span className="text-neutral-500">Degree Roadmap:</span> <span className="font-bold text-black">Level-{current.level} {current.term} (Active 4-Year Degree)</span></div>
                      <div><span className="text-neutral-500">Academic Year:</span> <span className="font-semibold text-black">{current.academicYear}</span></div>
                      {current.isArchived ? (
                        <div className="pt-1 text-[10px] text-neutral-800 bg-neutral-200 p-2 border border-black">
                          <strong>Semester Status:</strong> Routine concluded on {current.plDlDate}. Classrooms and labs released for exams. Coordinator retains full access to batch; open workspace to advance to next semester.
                        </div>
                      ) : (
                        <div><span className="text-neutral-500">Classrooms:</span> <span className="font-semibold text-black">Sec-A ({current.defaultRoomA}), Sec-B ({current.defaultRoomB})</span></div>
                      )}
                    </div>
                  );
                })()}
              </div>

              <button
                onClick={handleOpenSelected}
                className="w-full py-3 text-xs font-bold uppercase tracking-wider border-2 border-black bg-white text-black hover:bg-black hover:text-white transition-colors flex items-center justify-center gap-2"
              >
                <span>Open Batch Timetable</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Option 02: Create New Routine */}
            <div className="border-2 border-black p-6 bg-black text-white hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-neutral-700">
                  <span className="text-[11px] font-bold font-mono uppercase tracking-wider text-neutral-400">
                    New Semester
                  </span>
                  <PlusCircle className="w-5 h-5 text-white" />
                </div>

                <h3 className="text-xl font-bold uppercase tracking-tight text-white mb-2">
                  Create New Routine
                </h3>
                <p className="text-xs text-neutral-300 mb-6">
                  Start a step-by-step routine generation wizard for an upcoming semester.
                </p>

                {/* Features List */}
                <div className="space-y-2 mb-6 text-xs font-mono">
                  <div className="flex items-center gap-2 text-neutral-300">
                    <BookOpen className="w-3.5 h-3.5 text-white" />
                    <span>Auto-loads official syllabus</span>
                  </div>
                  {/* <div className="flex items-center gap-2 text-neutral-300">
                    <ShieldCheck className="w-3.5 h-3.5 text-white" />
                    <span>Senior faculty priority conflict engine</span>
                  </div> */}
                  <div className="flex items-center gap-2 text-neutral-300">
                    <Layers className="w-3.5 h-3.5 text-white" />
                    <span>"Any Available CSE Lab" smart routing</span>
                  </div>
                  <div className="flex items-center gap-2 text-neutral-300">
                    <Clock className="w-3.5 h-3.5 text-white" />
                    <span>Drag-and-drop interactive canvas</span>
                  </div>
                </div>
              </div>

              <button
                onClick={onCreateNew}
                className="w-full py-3 text-xs font-bold uppercase tracking-wider border-2 border-white bg-white text-black hover:bg-neutral-200 transition-colors flex items-center justify-center gap-2"
              >
                <span>Create New Routine</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          /* Case B: Semester Completed & New One Hasn't Started Yet -> Show ONLY Create New Routine */
          <div className="max-w-2xl mx-auto w-full mb-12">
            <div className="border-2 border-black p-8 bg-black text-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex items-center justify-between pb-3 mb-5 border-b border-neutral-700">
                <span className="text-xs font-bold font-mono uppercase tracking-wider text-neutral-400">
                  Semester Completed • New Semester Setup
                </span>
                <PlusCircle className="w-6 h-6 text-white" />
              </div>

              <h3 className="text-2xl font-bold uppercase tracking-tight text-white mb-2">
                Create New Semester Routine
              </h3>
              <p className="text-xs text-neutral-300 mb-6 leading-relaxed">
                {/* The previous academic semester has completed. All classrooms and specialized laboratories have been released. 
                Begin scheduling the new upcoming semester with the automated CUET routine generator. */}
              </p>

              {/* Features List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8 text-xs font-mono">
                <div className="flex items-center gap-2 text-neutral-300">
                  <BookOpen className="w-4 h-4 text-white shrink-0" />
                  <span>Official CUET syllabus</span>
                </div>
                {/* <div className="flex items-center gap-2 text-neutral-300">
                  <ShieldCheck className="w-4 h-4 text-white shrink-0" />
                  <span>Senior faculty clash precedence</span>
                </div> */}
                <div className="flex items-center gap-2 text-neutral-300">
                  <Layers className="w-4 h-4 text-white shrink-0" />
                  <span>Free classroom & lab auto-routing</span>
                </div>
                <div className="flex items-center gap-2 text-neutral-300">
                  <Clock className="w-4 h-4 text-white shrink-0" />
                  <span>Drag-and-drop routine</span>
                </div>
              </div>

              <button
                onClick={onCreateNew}
                className="w-full py-3.5 text-xs font-bold uppercase tracking-wider border-2 border-white bg-white text-black hover:bg-neutral-200 transition-colors flex items-center justify-center gap-2 shadow-[2px_2px_0px_0px_rgba(255,255,255,0.8)]"
              >
                <span>Start Routine Creation</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* SECTION 2: PAST SEMESTER ROUTINES (ARCHIVE) */}
        {pastBatches.length > 0 && (
          <div className="max-w-4xl mx-auto w-full pt-6 border-t-2 border-black">
            <div className="flex flex-wrap items-center justify-between pb-3 mb-4 border-b border-black gap-2">
              <div className="flex items-center gap-2">
                <Archive className="w-4 h-4 text-black" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-black">
                  Past Semester Routines (Official Archived)
                </h3>
              </div>
              <span className="text-[11px] font-mono text-neutral-600">
                Click any semester to view its official final routine
              </span>
            </div>

            {/* Official Format Table for Past Routines */}
            <div className="overflow-x-auto border-2 border-black">
              <table className="w-full border-collapse text-left text-xs font-mono">
                <thead>
                  <tr className="bg-black text-white text-[11px] uppercase tracking-wider">
                    <th className="p-3 border-r border-neutral-700">Academic Semester</th>
                    <th className="p-3 border-r border-neutral-700">Batch & Year</th>
                    <th className="p-3 border-r border-neutral-700">Course Coordinator</th>
                    <th className="p-3 border-r border-neutral-700">Completion Status</th>
                    <th className="p-3 text-right">Official Record</th>
                  </tr>
                </thead>
                <tbody>
                  {pastBatches.map(batch => (
                    <tr
                      key={batch.id}
                      onClick={() => handleOpenPastSemester(batch.id)}
                      className="border-b border-black last:border-b-0 hover:bg-neutral-100 cursor-pointer group transition-colors"
                    >
                      {/* Semester Name (Clickable) */}
                      <td className="p-3 border-r border-black font-bold text-black group-hover:underline flex items-center gap-2">
                        <Lock className="w-3.5 h-3.5 text-neutral-500 group-hover:text-black shrink-0" />
                        <span>Level-{batch.level} {batch.term}</span>
                      </td>

                      {/* Batch & Academic Year */}
                      <td className="p-3 border-r border-black">
                        <div>Batch {batch.id}</div>
                        <div className="text-[10px] text-neutral-500">{batch.academicYear}</div>
                      </td>

                      {/* Coordinator */}
                      <td className="p-3 border-r border-black">
                        {batch.coordinatorName}
                      </td>

                      {/* Completion / PL DL */}
                      <td className="p-3 border-r border-black text-[11px]">
                        <span className="px-1.5 py-0.5 bg-neutral-200 text-neutral-800 font-bold border border-neutral-400 inline-block mb-0.5">
                          PL / DL Commenced
                        </span>
                        <div className="text-neutral-500 text-[10px]">
                          {batch.plDlDate || batch.endOfClasses} • Classrooms Freed
                        </div>
                      </td>

                      {/* Action Link */}
                      <td className="p-3 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenPastSemester(batch.id);
                          }}
                          className="px-3 py-1 text-xs font-bold border border-black bg-white text-black hover:bg-black hover:text-white transition-colors flex items-center gap-1.5 ml-auto"
                        >
                          <span>View Routine</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Academic Footer */}
      <div className="border-t border-neutral-200 py-4 text-center text-xs font-mono text-neutral-500">
        Chittagong University of Engineering & Technology • Department of Computer Science and Engineering
      </div>
    </div>
  );
};

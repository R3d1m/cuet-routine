import React, { useState } from 'react';
import { useRoutine } from '../context/RoutineContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { 
  Calendar, 
  Lock, 
  AlertTriangle, 
  CheckCircle, 
  Printer, 
  ShieldCheck,
  GraduationCap,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const BatchLifecycleModal: React.FC = () => {
  const { activeBatch, updateBatchLifecycle, advanceBatchSemester, reopenBatchSemester } = useRoutine();
  const { canEditBatch } = useAuth();
  const navigate = useNavigate();

  const isCoordinator = canEditBatch(activeBatch);

  // PL / DL Date picker state
  const [plDlDate, setPlDlDate] = useState<string>(
    activeBatch.plDlDate || new Date().toISOString().split('T')[0]
  );
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isAdvancing, setIsAdvancing] = useState<boolean>(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  // Calendar dates editing
  const [commencementDate, setCommencementDate] = useState(activeBatch.commencementDate);
  const [midBreakStart, setMidBreakStart] = useState(activeBatch.midBreakStart);
  const [midBreakEnd, setMidBreakEnd] = useState(activeBatch.midBreakEnd);
  const [endOfClasses, setEndOfClasses] = useState(activeBatch.endOfClasses);
  const [savedDates, setSavedDates] = useState(false);

  const isArchived = activeBatch.isArchived;

  // Calculate next semester
  const getNextTerm = () => {
    if (activeBatch.term === 'Term-I') {
      return { level: activeBatch.level, term: 'Term-II', title: `Level-${activeBatch.level} Term-II` };
    }
    if (activeBatch.level < 4) {
      return { level: activeBatch.level + 1, term: 'Term-I', title: `Level-${activeBatch.level + 1} Term-I` };
    }
    return { level: 4, term: 'Term-II', title: 'Degree Completion (Graduation)' };
  };

  const nextTermInfo = getNextTerm();

  // Degree Terms (8 terms across 4 years)
  const degreeTerms = [
    { level: 1, term: 'Term-I', label: 'L-1 T-I' },
    { level: 1, term: 'Term-II', label: 'L-1 T-II' },
    { level: 2, term: 'Term-I', label: 'L-2 T-I' },
    { level: 2, term: 'Term-II', label: 'L-2 T-II' },
    { level: 3, term: 'Term-I', label: 'L-3 T-I' },
    { level: 3, term: 'Term-II', label: 'L-3 T-II' },
    { level: 4, term: 'Term-I', label: 'L-4 T-I' },
    { level: 4, term: 'Term-II', label: 'L-4 T-II' },
  ];

  const currentTermIndex = degreeTerms.findIndex(
    t => t.level === activeBatch.level && t.term === activeBatch.term
  );

  const handleSaveCalendarDates = (e: React.FormEvent) => {
    e.preventDefault();
    if (isArchived) return;

    updateBatchLifecycle(activeBatch.id, {
      commencementDate,
      midBreakStart,
      midBreakEnd,
      endOfClasses
    }, false);

    setSavedDates(true);
    setTimeout(() => setSavedDates(false), 2500);
  };

  const handleConfirmStartPlDl = async () => {
    setIsProcessing(true);
    try {
      await api.startPlDl(activeBatch.id, plDlDate);

      updateBatchLifecycle(activeBatch.id, {
        isArchived: true,
        plDlDate: plDlDate,
        examMode: {
          isEnabled: true,
          examDay: 'THU',
          time: '1:00 PM - 4:00 PM',
          startWeek: 15,
          endWeek: 18,
          lockedClassrooms: [activeBatch.defaultRoomA, activeBatch.defaultRoomB]
        }
      }, true);

      setShowConfirmModal(false);
      setActionSuccessMessage(
        `Semester Level-${activeBatch.level} ${activeBatch.term} routine finalized and concluded on ${plDlDate}. All classrooms and laboratories released for exams. You retain coordinator access to Batch ${activeBatch.id} throughout the 4-year degree.`
      );
    } catch (err: any) {
      console.error('Error starting PL / DL:', err);
      updateBatchLifecycle(activeBatch.id, {
        isArchived: true,
        plDlDate: plDlDate
      }, true);
      setShowConfirmModal(false);
      setActionSuccessMessage(`PL / DL commenced on ${plDlDate}. Semester routine concluded.`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle advancing to next semester
  const handleAdvanceSemester = async () => {
    if (!confirm(`Advance Batch ${activeBatch.id} to ${nextTermInfo.title}? This will finalize the current term and let you create the new routine.`)) {
      return;
    }

    setIsAdvancing(true);
    try {
      const res = await advanceBatchSemester(activeBatch.id);
      if (res.degreeCompleted) {
        setActionSuccessMessage(`Congratulations! Batch ${activeBatch.id} has fulfilled all 4-year degree requirements.`);
      } else {
        setActionSuccessMessage(`Batch ${activeBatch.id} has officially advanced to ${nextTermInfo.title}. You can now create the new semester routine.`);
      }
    } catch (err: any) {
      console.error('Failed to advance semester:', err);
      alert('Failed to advance semester: ' + (err.message || 'Server error'));
    } finally {
      setIsAdvancing(false);
    }
  };

  // Handle re-opening semester routine
  const handleReopenSemester = async () => {
    if (!confirm(`Re-open routine for Level-${activeBatch.level} ${activeBatch.term}? This allows editing schedule slots again.`)) {
      return;
    }

    try {
      await reopenBatchSemester(activeBatch.id);
      setActionSuccessMessage(`Routine for Level-${activeBatch.level} ${activeBatch.term} has been re-opened for editing.`);
    } catch (err: any) {
      alert('Failed to re-open semester: ' + (err.message || 'Server error'));
    }
  };

  return (
    <div className="max-w-4xl mx-auto my-6 p-6 bg-white border-2 border-black">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between pb-4 mb-6 border-b-2 border-black gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-neutral-500 bg-neutral-100 px-2 py-0.5 border border-black inline-block">
              Undergraduate Degree Governance
            </span>
            <span className="text-[10px] font-mono font-bold text-neutral-600">
              Session: {activeBatch.academicYear}
            </span>
          </div>
          <h2 className="text-lg font-bold uppercase tracking-tight text-black flex items-center gap-2 mt-1">
            <span>Batch {activeBatch.id} Lifecycle & Degree Progression</span>
          </h2>
          <p className="text-xs text-neutral-600 font-mono mt-0.5">
            Course Coordinator: <strong className="text-black">{activeBatch.coordinatorName}</strong> • Retains full coordinator access throughout the 4-year degree
          </p>
        </div>

        <div className={`px-3 py-1 text-xs border font-mono font-bold flex items-center gap-1.5 ${
          isArchived ? 'bg-neutral-100 text-black border-black' : 'bg-black text-white border-black'
        }`}>
          {isArchived ? <Lock className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
          <span>{isArchived ? 'TERM CONCLUDED (PL / DL)' : 'CLASSES IN SESSION'}</span>
        </div>
      </div>

      {/* 4-YEAR DEGREE PROGRESSION ROADMAP */}
      <div className="mb-8 p-4 bg-neutral-50 border-2 border-black">
        <div className="flex items-center justify-between pb-2 mb-3 border-b border-black">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-black font-mono">
            <GraduationCap className="w-4 h-4" />
            <span>4-Year Degree Roadmap (8 Academic Terms)</span>
          </div>
          <span className="text-[10px] font-mono text-neutral-600">
            Term {currentTermIndex >= 0 ? currentTermIndex + 1 : 1} of 8
          </span>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5 text-center font-mono">
          {degreeTerms.map((term, idx) => {
            const isPast = idx < currentTermIndex;
            const isCurrent = idx === currentTermIndex;

            return (
              <div
                key={term.label}
                className={`p-2 border text-xs transition-colors ${
                  isCurrent
                    ? 'border-2 border-black bg-white font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                    : isPast
                    ? 'border-black bg-neutral-200 text-neutral-800'
                    : 'border-neutral-300 bg-white text-neutral-400'
                }`}
              >
                <div className="text-[11px] font-bold">{term.label}</div>
                <div className="text-[9px] mt-0.5 uppercase tracking-tighter">
                  {isCurrent ? (isArchived ? 'PL/DL Done' : 'In Session') : isPast ? 'Completed' : 'Upcoming'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Success Banner */}
      {actionSuccessMessage && (
        <div className="mb-6 p-4 bg-black text-white border border-black flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-mono">
            <CheckCircle className="w-4 h-4 text-white shrink-0" />
            <span>{actionSuccessMessage}</span>
          </div>
          <button
            onClick={() => setActionSuccessMessage(null)}
            className="px-2 py-0.5 bg-white text-black text-[11px] font-bold font-mono hover:bg-neutral-100 ml-4 shrink-0"
          >
            ✕
          </button>
        </div>
      )}

      {/* SECTION 1: SEMESTER ROUTINE & PL / DL CONTROLLER */}
      <div className="border-2 border-black p-6 bg-neutral-50 mb-8">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-black">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-black" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-black">
              Current Semester: Level-{activeBatch.level} {activeBatch.term} Routine Status
            </h3>
          </div>
          <span className="text-xs font-mono font-bold">
            {isArchived ? 'Concluded' : 'Active Classes'}
          </span>
        </div>

        {isArchived ? (
          /* Concluded Semester View */
          <div className="space-y-5">
            <div className="p-4 bg-white border border-black text-xs font-mono space-y-2">
              <div className="text-black font-bold uppercase flex items-center gap-2 text-sm">
                <Lock className="w-4 h-4 text-black" />
                <span>Semester Routine Concluded (PL / DL Active)</span>
              </div>
              <p className="text-neutral-700">
                Preparatory Leave (PL / DL) commenced on <strong className="text-black">{activeBatch.plDlDate || plDlDate}</strong>.
              </p>
              <ul className="list-disc list-inside text-neutral-600 space-y-1 pt-1">
                <li>All regular classrooms ({activeBatch.defaultRoomA}, {activeBatch.defaultRoomB}) and specialized laboratories have been freed for term-final exams.</li>
                <li>This semester's routine is permanently preserved in official archive format.</li>
                <li><strong>Your coordinator access continues:</strong> You can advance Batch {activeBatch.id} to {nextTermInfo.title} to create the next semester routine.</li>
              </ul>
            </div>

            {/* Advance to Next Semester Box */}
            {isCoordinator && (
              <div className="p-5 border-2 border-black bg-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase text-neutral-500 bg-neutral-100 px-1.5 py-0.5 border border-black inline-block mb-1">
                    Degree Progression
                  </span>
                  <div className="text-base font-bold uppercase tracking-tight text-black">
                    Advance Batch {activeBatch.id} to {nextTermInfo.title}
                  </div>
                  <p className="text-xs text-neutral-600 font-mono mt-0.5">
                    Closes out this term and unlocks new routine generation for the upcoming semester.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleAdvanceSemester}
                  disabled={isAdvancing}
                  className="px-5 py-2.5 text-xs font-bold uppercase tracking-wider bg-black text-white hover:bg-neutral-800 transition-colors flex items-center gap-2 border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50 shrink-0"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isAdvancing ? 'Advancing...' : `Advance to ${nextTermInfo.title} →`}</span>
                </button>
              </div>
            )}

            {/* Secondary Actions */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => navigate(`/batch/${activeBatch.id}/print`)}
                className="px-4 py-2 text-xs font-bold bg-neutral-100 text-black hover:bg-neutral-200 transition-colors uppercase tracking-wider flex items-center gap-2 border border-black"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>View Official Print Format</span>
              </button>

              {isCoordinator && (
                <button
                  type="button"
                  onClick={handleReopenSemester}
                  className="px-4 py-2 text-xs font-mono font-bold border border-black hover:bg-neutral-100 transition-colors flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Re-open Current Routine for Edits</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Active State: Date Picker + Single Button */
          <div className="space-y-4">
            {!isCoordinator && (
              <div className="p-3 bg-neutral-100 border border-black text-xs font-mono text-neutral-800">
                <strong>Read-Only Notice:</strong> Batch {activeBatch.id} is coordinated by <strong>{activeBatch.coordinatorName}</strong>. You have view access, but only the designated coordinator can commence Preparatory Leave (PL / DL).
              </div>
            )}

            <div className="p-4 bg-white border border-black flex flex-wrap items-end gap-4">
              <div className="flex-1 min-w-[240px]">
                <label className="block text-xs font-bold uppercase tracking-wider text-black mb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  <span>Select PL / DL Commencement Date:</span>
                </label>
                <input
                  type="date"
                  value={plDlDate}
                  onChange={e => setPlDlDate(e.target.value)}
                  disabled={!isCoordinator}
                  className="w-full text-xs p-2 border border-black font-mono bg-white font-bold disabled:bg-neutral-100"
                />
              </div>

              <button
                type="button"
                disabled={!isCoordinator}
                onClick={() => setShowConfirmModal(true)}
                className="px-6 py-2.5 text-xs font-bold bg-black text-white hover:bg-neutral-800 transition-all uppercase tracking-wider flex items-center gap-2 border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Lock className="w-4 h-4" />
                <span>Start PL / DL</span>
              </button>
            </div>

            <div className="text-[11px] text-neutral-600 font-mono">
              * Commencing PL / DL finalizes this semester's routine and releases all classrooms and labs for term-final exams. The Course Coordinator retains full access to coordinate the batch and advance to the next semester.
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal for Starting PL/DL */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white border-2 border-black max-w-lg w-full p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center gap-2 text-black mb-3">
              <AlertTriangle className="w-5 h-5 text-black" />
              <h3 className="text-sm font-bold uppercase tracking-wider">
                Confirm Commencement of PL / DL
              </h3>
            </div>

            <div className="space-y-3 text-xs text-neutral-800 font-mono py-2 border-y border-black mb-4">
              <p>
                You are about to finalize classes for <strong>Batch {activeBatch.id} (Level-{activeBatch.level} {activeBatch.term})</strong> on:
              </p>
              <div className="p-2 bg-neutral-100 font-bold text-center border border-black text-sm">
                {plDlDate}
              </div>
              <p className="text-black font-semibold">
                This action will:
              </p>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-neutral-700">
                <li>Free all allocated classrooms ({activeBatch.defaultRoomA}, {activeBatch.defaultRoomB}) and laboratories for exams</li>
                <li>Finalize this semester's routine into official archive format</li>
                <li><strong>Maintain your coordinator access</strong> so you can advance to the next semester ({nextTermInfo.title})</li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-3 py-1.5 text-xs font-bold border border-black hover:bg-neutral-100 font-mono uppercase"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleConfirmStartPlDl}
                className="px-5 py-1.5 text-xs font-bold bg-black text-white hover:bg-neutral-800 uppercase font-mono shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              >
                {isProcessing ? 'Processing...' : 'Confirm & Start PL / DL'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: Academic Calendar Dates */}
      <div className={`border border-black p-4 bg-white ${isArchived ? 'opacity-75' : ''}`}>
        <div className="flex items-center gap-2 pb-2 mb-3 border-b border-neutral-200">
          <Calendar className="w-4 h-4 text-black" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-black">
            Academic Calendar & Term Dates
          </h3>
        </div>

        <form onSubmit={handleSaveCalendarDates} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-800 mb-1">
                Commencement of Classes
              </label>
              <input
                type="date"
                value={commencementDate}
                onChange={e => setCommencementDate(e.target.value)}
                disabled={isArchived}
                className="w-full text-xs p-2 border border-black font-mono bg-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-800 mb-1">
                Mid-Break Start
              </label>
              <input
                type="date"
                value={midBreakStart}
                onChange={e => setMidBreakStart(e.target.value)}
                disabled={isArchived}
                className="w-full text-xs p-2 border border-black font-mono bg-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-800 mb-1">
                Mid-Break End
              </label>
              <input
                type="date"
                value={midBreakEnd}
                onChange={e => setMidBreakEnd(e.target.value)}
                disabled={isArchived}
                className="w-full text-xs p-2 border border-black font-mono bg-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-800 mb-1">
                End of Classes
              </label>
              <input
                type="date"
                value={endOfClasses}
                onChange={e => setEndOfClasses(e.target.value)}
                disabled={isArchived}
                className="w-full text-xs p-2 border border-black font-mono bg-white"
              />
            </div>
          </div>

          {!isArchived && (
            <div className="flex items-center justify-between pt-2 border-t border-neutral-200">
              {savedDates ? (
                <span className="text-xs font-bold text-black flex items-center gap-1 font-mono">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Calendar dates saved.</span>
                </span>
              ) : <div />}

              {isCoordinator ? (
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold border border-black bg-white hover:bg-neutral-100 uppercase font-mono"
                >
                  Save Calendar Dates
                </button>
              ) : (
                <span className="text-[11px] font-mono text-neutral-500">
                  Read-only: Coordinated by {activeBatch.coordinatorName}
                </span>
              )}
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

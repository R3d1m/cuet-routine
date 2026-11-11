import React, { useState, useEffect, useMemo } from 'react';
import { useRoutine } from '../context/RoutineContext';
import { useAuth } from '../context/AuthContext';
import { Day, FacultyPreference } from '../types';
import { api } from '../services/api';
import { 
  Calendar, 
  Check, 
  User, 
  Save, 
  Lock,
  Plus,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

interface FacultyAvailabilityTableProps {
  batchId?: string;
  isEmbeddedInWizard?: boolean;
  assignedTeacherIds?: string[];
  teacherCourseMap?: Record<string, string[]>;
}

interface RoutineCommitment {
  slotId: string;
  batchId: string;
  courseCode: string;
  day: Day;
  period: number;
  roomId: string;
  roomName: string;
  section: string;
}

const DAYS: Day[] = ['SUN', 'MON', 'TUE', 'WED', 'THU'];
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

const PERIOD_LABELS: Record<number, string> = {
  1: '08:10 - 09:00',
  2: '09:00 - 09:50',
  3: '09:50 - 10:40',
  4: '10:45 - 11:35',
  5: '11:35 - 12:25',
  6: '12:25 - 01:15',
  7: '01:45 - 02:35',
  8: '02:35 - 03:25',
  9: '03:25 - 04:15',
};

export const FacultyAvailabilityTable: React.FC<FacultyAvailabilityTableProps> = ({ 
  batchId,
  isEmbeddedInWizard = false,
  assignedTeacherIds = [],
  teacherCourseMap = {}
}) => {
  const { activeBatch, batches, teachers, rooms, slots, activeBatchSlots } = useRoutine();
  const { canEditBatch, currentUser } = useAuth();

  const currentBatchId = batchId || activeBatch?.id || '2022';
  const targetBatch = batches.find(b => b.id === currentBatchId) || activeBatch;
  // Coordinators and Administrators can edit teacher availability slots
  const isAuthorized = Boolean(
    currentUser && (
      currentUser.role === 'coordinator' || 
      currentUser.role === 'admin' || 
      canEditBatch(targetBatch) || 
      isEmbeddedInWizard
    )
  );

  const [preferences, setPreferences] = useState<Record<string, FacultyPreference>>({});
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [preferenceNotes, setPreferenceNotes] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Locally added teachers via table controls
  const [manuallyAddedTeacherIds, setManuallyAddedTeacherIds] = useState<string[]>([]);
  const [newTeacherInputId, setNewTeacherInputId] = useState<string>('');

  // Map of roomId -> shortName for display
  const roomNameMap = useMemo(() => {
    const map = new Map<string, string>();
    rooms.forEach(r => map.set(r.id, r.shortName || r.name));
    return map;
  }, [rooms]);

  // Load faculty preferences from API
  const loadPreferences = async () => {
    try {
      const data = await api.getFacultyPreferences(currentBatchId);
      const prefMap: Record<string, FacultyPreference> = {};
      data.forEach(p => {
        prefMap[p.teacherId] = p;
      });
      setPreferences(prefMap);
    } catch (err) {
      console.warn('Could not load faculty preferences:', err);
    }
  };

  useEffect(() => {
    loadPreferences();
  }, [currentBatchId]);

  // 1. EXTRACT ALL CURRENT ROUTINE COMMITMENTS FOR ALL TEACHERS ACROSS ALL BATCHES
  const teacherRoutineCommitmentsMap = useMemo(() => {
    const map = new Map<string, Map<string, RoutineCommitment>>();

    slots.forEach(slot => {
      slot.teacherIds.forEach(tid => {
        if (!map.has(tid)) {
          map.set(tid, new Map<string, RoutineCommitment>());
        }
        const teacherMap = map.get(tid)!;

        // Expand across periodSpan (e.g. 3-period lab block occupies periodStart, +1, +2)
        const span = slot.periodSpan || 1;
        for (let offset = 0; offset < span; offset++) {
          const p = slot.periodStart + offset;
          const slotKey = `${slot.day}-${p}`;
          teacherMap.set(slotKey, {
            slotId: slot.id,
            batchId: slot.batchId,
            courseCode: slot.courseCode,
            day: slot.day,
            period: p,
            roomId: slot.roomId,
            roomName: roomNameMap.get(slot.roomId) || slot.roomId,
            section: slot.section
          });
        }
      });
    });

    return map;
  }, [slots, roomNameMap]);

  // 2. AUTOMATIC COURSE TEACHER LIST AGGREGATION:
  // - Teachers assigned in wizard step 2 (`assignedTeacherIds`)
  // - Teachers in current routine slots for this batch (`activeBatchSlots`)
  // - Teachers manually added via "+ Add Course Teacher"
  // - Teachers with existing saved preferences for this batch
  const courseTeachers = useMemo(() => {
    const teacherIdSet = new Set<string>();

    // From wizard course assignments
    assignedTeacherIds.forEach(id => teacherIdSet.add(id));

    // From current routine slots for this batch
    activeBatchSlots.forEach(s => {
      s.teacherIds.forEach(id => teacherIdSet.add(id));
    });

    // From manually added teachers in this component
    manuallyAddedTeacherIds.forEach(id => teacherIdSet.add(id));

    // From existing preferences for this batch
    Object.keys(preferences).forEach(id => teacherIdSet.add(id));

    // If still empty (e.g. fresh batch setup), show initial department teachers as options
    if (teacherIdSet.size === 0 && !isEmbeddedInWizard) {
      teachers.slice(0, 5).forEach(t => teacherIdSet.add(t.id));
    }

    return teachers.filter(t => teacherIdSet.has(t.id)).sort((a, b) => a.rank - b.rank);
  }, [assignedTeacherIds, activeBatchSlots, manuallyAddedTeacherIds, preferences, teachers, isEmbeddedInWizard]);

  // Auto-select the first teacher if none is currently selected
  useEffect(() => {
    if ((!selectedTeacherId || !courseTeachers.some(t => t.id === selectedTeacherId)) && courseTeachers.length > 0) {
      setSelectedTeacherId(courseTeachers[0].id);
    }
  }, [courseTeachers, selectedTeacherId]);

  // Compute available slots: all 45 slots minus slots where teacher has class in current routines
  const getFreeSlotsFromCurrentRoutines = (teacherId: string): string[] => {
    const commitments = teacherRoutineCommitmentsMap.get(teacherId) || new Map();
    const freeSlots: string[] = [];
    DAYS.forEach(day => {
      PERIODS.forEach(p => {
        const key = `${day}-${p}`;
        if (!commitments.has(key)) {
          freeSlots.push(key);
        }
      });
    });
    return freeSlots;
  };

  // When teacher selection changes, load their availability slots:
  // - If saved preference exists: use saved availabilitySlots
  // - Otherwise: automatically fetch free slots from current routines!
  useEffect(() => {
    if (!selectedTeacherId) {
      setSelectedSlots([]);
      setPreferenceNotes('');
      return;
    }

    const existing = preferences[selectedTeacherId];
    if (existing && existing.availabilitySlots !== undefined && existing.availabilitySlots !== null) {
      setSelectedSlots(existing.availabilitySlots);
      setPreferenceNotes(existing.notes || '');
    } else {
      // Auto-fetch free slots from current routines!
      const routineFreeSlots = getFreeSlotsFromCurrentRoutines(selectedTeacherId);
      setSelectedSlots(routineFreeSlots);
      setPreferenceNotes('');
    }
  }, [selectedTeacherId, preferences, teacherRoutineCommitmentsMap]);

  // Current commitments for the selected teacher
  const currentTeacherCommitments = useMemo(() => {
    return selectedTeacherId 
      ? teacherRoutineCommitmentsMap.get(selectedTeacherId) || new Map<string, RoutineCommitment>()
      : new Map<string, RoutineCommitment>();
  }, [selectedTeacherId, teacherRoutineCommitmentsMap]);

  // Helper to update slots and live preferences state simultaneously
  const applySlotsToSelectedTeacher = (newSlots: string[]) => {
    if (!isAuthorized || !selectedTeacherId) return;
    setSelectedSlots(newSlots);

    // Keep preferences map in sync so top table count updates immediately
    setPreferences(prev => {
      const existing = prev[selectedTeacherId];
      return {
        ...prev,
        [selectedTeacherId]: {
          id: existing?.id,
          batchId: currentBatchId,
          teacherId: selectedTeacherId,
          preferredDays: existing?.preferredDays || ['SUN', 'MON', 'TUE', 'WED', 'THU'],
          preferredTimeOfDay: existing?.preferredTimeOfDay || 'any',
          maxClassesPerDay: existing?.maxClassesPerDay || 2,
          notes: preferenceNotes || existing?.notes || '',
          availabilitySlots: newSlots
        }
      };
    });
  };

  // Toggle a single slot
  const handleToggleSlot = (slotKey: string) => {
    if (!isAuthorized || !selectedTeacherId) return;
    const newSlots = selectedSlots.includes(slotKey) 
      ? selectedSlots.filter(s => s !== slotKey)
      : [...selectedSlots, slotKey];
    applySlotsToSelectedTeacher(newSlots);
  };

  // 1-Click: Sync with Current Routines
  const handleSyncWithRoutines = (teacherIdToSync?: string) => {
    const tid = teacherIdToSync || selectedTeacherId;
    if (!tid) return;

    const freeSlots = getFreeSlotsFromCurrentRoutines(tid);
    if (!teacherIdToSync || teacherIdToSync === selectedTeacherId) {
      applySlotsToSelectedTeacher(freeSlots);
    }

    // If saving directly for a teacher row
    if (teacherIdToSync) {
      const existing = preferences[tid];
      const updatedPref: FacultyPreference = {
        id: existing?.id,
        batchId: currentBatchId,
        teacherId: tid,
        preferredDays: existing?.preferredDays || ['SUN', 'MON', 'TUE', 'WED', 'THU'],
        preferredTimeOfDay: existing?.preferredTimeOfDay || 'any',
        maxClassesPerDay: existing?.maxClassesPerDay || 2,
        notes: existing?.notes || 'Synced from current routines',
        availabilitySlots: freeSlots
      };
      api.saveFacultyPreference(currentBatchId, updatedPref).then(() => {
        setPreferences(prev => ({ ...prev, [tid]: updatedPref }));
        setSaveSuccessMsg(`Synced ${teachers.find(t => t.id === tid)?.name} with current routines!`);
        setTimeout(() => setSaveSuccessMsg(null), 3000);
      });
    }
  };

  // Quick preset toggles
  const handleSelectAll = () => {
    const all: string[] = [];
    DAYS.forEach(d => PERIODS.forEach(p => all.push(`${d}-${p}`)));
    applySlotsToSelectedTeacher(all);
  };

  const handleClearAll = () => {
    applySlotsToSelectedTeacher([]);
  };

  const handleSelectMorning = () => {
    const morningSlots: string[] = [];
    DAYS.forEach(d => [1, 2, 3].forEach(p => morningSlots.push(`${d}-${p}`)));
    applySlotsToSelectedTeacher(morningSlots);
  };

  const handleSelectMidDay = () => {
    const midSlots: string[] = [];
    DAYS.forEach(d => [4, 5, 6].forEach(p => midSlots.push(`${d}-${p}`)));
    applySlotsToSelectedTeacher(midSlots);
  };

  const handleSelectAfternoon = () => {
    const aftSlots: string[] = [];
    DAYS.forEach(d => [7, 8, 9].forEach(p => aftSlots.push(`${d}-${p}`)));
    applySlotsToSelectedTeacher(aftSlots);
  };

  // Add course teacher via dropdown
  const handleAddCourseTeacher = () => {
    if (!newTeacherInputId) return;
    if (!manuallyAddedTeacherIds.includes(newTeacherInputId)) {
      setManuallyAddedTeacherIds(prev => [...prev, newTeacherInputId]);
    }
    // Select the newly added teacher
    setSelectedTeacherId(newTeacherInputId);
    setNewTeacherInputId('');
    // Auto-fetch free slots from current routines
    const freeSlots = getFreeSlotsFromCurrentRoutines(newTeacherInputId);
    setSelectedSlots(freeSlots);
    // Auto‑save a default preference for this teacher
    const defaultPref: FacultyPreference = {
      id: undefined,
      batchId: currentBatchId,
      teacherId: newTeacherInputId,
      preferredDays: ['SUN', 'MON', 'TUE', 'WED', 'THU'],
      preferredTimeOfDay: 'any',
      maxClassesPerDay: 2,
      notes: 'Auto‑created from course teacher addition',
      availabilitySlots: freeSlots,
    };
    api.saveFacultyPreference(currentBatchId, defaultPref).then(() => {
      setPreferences(prev => ({ ...prev, [newTeacherInputId]: defaultPref }));
    }).catch(err => {
      console.warn('Failed to auto‑save preference for new teacher:', err);
    });
  };

  // Save preference to backend
  const handleSavePreference = async () => {
    if (!selectedTeacherId) return;

    setIsSaving(true);
    const existing = preferences[selectedTeacherId];
    const updatedPref: FacultyPreference = {
      id: existing?.id,
      batchId: currentBatchId,
      teacherId: selectedTeacherId,
      preferredDays: existing?.preferredDays || ['SUN', 'MON', 'TUE', 'WED', 'THU'],
      preferredTimeOfDay: existing?.preferredTimeOfDay || 'any',
      maxClassesPerDay: existing?.maxClassesPerDay || 2,
      notes: preferenceNotes,
      availabilitySlots: selectedSlots
    };

    try {
      await api.saveFacultyPreference(currentBatchId, updatedPref);
      setPreferences(prev => ({
        ...prev,
        [selectedTeacherId]: updatedPref
      }));
      setSaveSuccessMsg('Preference saved successfully!');
      setTimeout(() => setSaveSuccessMsg(null), 3000);
    } catch (err: any) {
      alert(`Failed to save availability preference: ${err.message || 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const selectedTeacher = teachers.find(t => t.id === selectedTeacherId);
  const totalClassesInRoutines = currentTeacherCommitments.size;

  return (
    <div className="mt-8 border-2 border-black bg-white p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
      {/* Title & Advisory Banner */}
      <div className="flex flex-wrap items-start justify-between gap-4 pb-4 mb-6 border-b-2 border-black">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-5 h-5 text-black" />
            <h3 className="text-base font-bold uppercase tracking-tight text-black">
              Faculty Availability Preference List
            </h3>
            <span className="px-2 py-0.5 text-[9px] font-mono font-bold uppercase bg-black text-white">
              Current Routines Sync
            </span>
            <span className="px-2 py-0.5 text-[9px] font-mono font-bold uppercase bg-neutral-200 border border-black text-black">
              Non-Binding Guide
            </span>
          </div>
          <p className="text-xs text-neutral-600 font-mono">
            Automatically tracks course teachers and fetches their live class commitments from current routines across all departmental batches.
          </p>
        </div>

        {isAuthorized ? (
          <div className="px-3 py-1.5 bg-black text-white border border-black text-xs font-mono flex items-center gap-2 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Coordinator Mode: Slot Editing Enabled</span>
          </div>
        ) : (
          <div className="px-3 py-1.5 bg-neutral-100 border border-black text-xs font-mono flex items-center gap-2">
            <Lock className="w-3.5 h-3.5" />
            <span>Read-Only: Coordinated by {targetBatch?.coordinatorName || 'Batch Coordinator'}</span>
          </div>
        )}
      </div>

      {/* Course Teachers Table (Automatically populated from course teacher assignment & current routines) */}
      <div className="mb-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-black flex items-center gap-1.5">
              <User className="w-4 h-4" />
              <span>Assigned Course Teachers for this Batch ({courseTeachers.length})</span>
            </h4>
            <span className="text-[10px] font-mono text-neutral-500">
              * Auto-added when assigned to courses
            </span>
          </div>

          {/* Add Course Teacher Input */}
          {isAuthorized && (
            <div className="flex items-center gap-2">
              <select
                value={newTeacherInputId}
                onChange={e => setNewTeacherInputId(e.target.value)}
                className="text-xs p-1.5 border border-black bg-white font-mono min-w-[200px]"
              >
                <option value="">+ Add Course Teacher to List...</option>
                {teachers
                  .filter(t => !courseTeachers.some(ct => ct.id === t.id))
                  .map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.initials}) - {t.designation}
                    </option>
                  ))}
              </select>
              <button
                type="button"
                onClick={handleAddCourseTeacher}
                disabled={!newTeacherInputId}
                className="px-3 py-1.5 text-xs font-bold bg-black text-white hover:bg-neutral-800 disabled:opacity-40 border border-black uppercase tracking-wider flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>
          )}
        </div>

        {courseTeachers.length === 0 ? (
          <div className="p-4 border-2 border-dashed border-neutral-300 text-center text-xs font-mono text-neutral-600 bg-neutral-50">
            No course teachers assigned yet. Assign faculty to courses in the table above or select a teacher from the dropdown above to automatically add them here.
          </div>
        ) : (
          <div className="border border-black overflow-x-auto shadow-sm">
            <table className="w-full text-left border-collapse text-xs font-mono">
              <thead>
                <tr className="bg-neutral-100 border-b border-black text-[11px] uppercase">
                  <th className="p-2.5 border-r border-black font-bold">Faculty Member</th>
                  <th className="p-2.5 border-r border-black font-bold">Assigned Course(s)</th>
                  <th className="p-2.5 border-r border-black font-bold">Current Routines Commitment</th>
                  <th className="p-2.5 border-r border-black font-bold">Available Preference Slots</th>
                  <th className="p-2.5 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black">
                {courseTeachers.map(teacher => {
                  const commitments = teacherRoutineCommitmentsMap.get(teacher.id) || new Map();
                  const routineClassCount = commitments.size;
                  const pref = preferences[teacher.id];
                  const availableCount = pref?.availabilitySlots?.length ?? (45 - routineClassCount);
                  const isSelected = selectedTeacherId === teacher.id;

                  // Find courses assigned in wizard or active routine
                  const assignedCodes = teacherCourseMap[teacher.id] || [];
                  const activeRoutineCodes = Array.from(new Set(
                    activeBatchSlots
                      .filter(s => s.teacherIds.includes(teacher.id))
                      .map(s => s.courseCode)
                  ));
                  const allAssignedCourses = Array.from(new Set([...assignedCodes, ...activeRoutineCodes]));

                  // Batches in which this teacher has classes
                  const activeBatchesInvolved = Array.from(new Set(
                    Array.from(commitments.values()).map(c => `Batch ${c.batchId}`)
                  ));

                  return (
                    <tr 
                      key={teacher.id} 
                      className={`transition-colors ${isSelected ? 'bg-neutral-100 font-medium' : 'hover:bg-neutral-50'}`}
                    >
                      {/* Teacher details */}
                      <td className="p-2.5 border-r border-black">
                        <div className="font-bold text-black text-sm">{teacher.name}</div>
                        <div className="text-[10px] text-neutral-600 flex items-center gap-1.5 mt-0.5">
                          <span className="font-bold px-1 bg-black text-white text-[9px]">{teacher.initials}</span>
                          <span>{teacher.designation}</span>
                          <span className="opacity-75">• Dept. of {teacher.department}</span>
                        </div>
                      </td>

                      {/* Assigned Courses */}
                      <td className="p-2.5 border-r border-black">
                        {allAssignedCourses.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {allAssignedCourses.map(c => (
                              <span key={c} className="px-1.5 py-0.5 bg-neutral-200 border border-black text-[10px] font-bold">
                                {c}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[10px] text-neutral-400 italic">Pool member</span>
                        )}
                      </td>

                      {/* Current Routines Commitments */}
                      <td className="p-2.5 border-r border-black">
                        {routineClassCount > 0 ? (
                          <div>
                            <span className="px-1.5 py-0.5 bg-neutral-800 text-white text-[10px] font-bold inline-block mb-1">
                              {routineClassCount} Classes in Current Routines
                            </span>
                            <div className="text-[10px] text-neutral-600">
                              Active in: {activeBatchesInvolved.join(', ')}
                            </div>
                          </div>
                        ) : (
                          <span className="text-[10px] text-emerald-800 font-bold flex items-center gap-1">
                            <Check className="w-3 h-3 text-emerald-700" />
                            <span>100% Free (No classes in routines)</span>
                          </span>
                        )}
                      </td>

                      {/* Available Preference Slots */}
                      <td className="p-2.5 border-r border-black font-bold">
                        <span className="px-2 py-0.5 bg-black text-white text-[10px]">
                          {availableCount} / 45 Slots
                        </span>
                        {routineClassCount > 0 && (
                          <span className="ml-1.5 text-[10px] text-neutral-500 font-normal">
                            ({routineClassCount} occupied in routines)
                          </span>
                        )}
                      </td>

                      {/* Action buttons */}
                      <td className="p-2.5 text-right space-x-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedTeacherId(teacher.id)}
                          className={`px-2.5 py-1 text-[10px] font-bold border border-black transition-colors ${
                            isSelected 
                              ? 'bg-black text-white' 
                              : 'bg-white text-black hover:bg-neutral-100'
                          }`}
                        >
                          {isSelected ? 'Editing Slots' : 'Configure Slots'}
                        </button>

                        {isAuthorized && (
                          <button
                            type="button"
                            onClick={() => handleSyncWithRoutines(teacher.id)}
                            title="Auto-fetch and save availability directly from current routine schedules"
                            className="px-2 py-1 text-[10px] font-bold border border-black bg-neutral-100 hover:bg-black hover:text-white transition-colors inline-flex items-center gap-1"
                          >
                            <RefreshCw className="w-3 h-3" />
                            <span>Sync</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Selected Teacher Detailed Slots Matrix */}
      {selectedTeacher && (
        <div className="pt-6 border-t-2 border-black">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-black text-white text-xs font-mono font-bold">
                  Active Configuration
                </span>
                <h4 className="text-sm font-bold uppercase text-black">
                  Availability Grid: {selectedTeacher.name} ({selectedTeacher.initials})
                </h4>
              </div>
              <p className="text-xs text-neutral-600 font-mono mt-0.5">
                {selectedTeacher.designation} • {selectedSlots.length} available slots selected •{' '}
                {totalClassesInRoutines > 0 ? (
                  <span className="font-bold text-neutral-900 underline">
                    {totalClassesInRoutines} class periods booked in current routines
                  </span>
                ) : (
                  <span className="text-emerald-700 font-bold">No classes booked in current routines</span>
                )}
              </p>
            </div>

            {/* Quick Presets & Auto-Sync Controls */}
            {isAuthorized && (
              <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono">
                <button
                  type="button"
                  onClick={() => handleSyncWithRoutines()}
                  title="Auto-set available slots by excluding all periods occupied in current routines"
                  className="px-2.5 py-1.5 bg-neutral-900 text-white font-bold border border-black hover:bg-neutral-800 transition-colors flex items-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Auto-Sync from Current Routines</span>
                </button>
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="px-2 py-1 bg-white border border-black hover:bg-black hover:text-white transition-colors"
                >
                  All (45)
                </button>
                <button
                  type="button"
                  onClick={handleSelectMorning}
                  className="px-2 py-1 bg-white border border-black hover:bg-black hover:text-white transition-colors"
                >
                  Morning (P1-3)
                </button>
                <button
                  type="button"
                  onClick={handleSelectMidDay}
                  className="px-2 py-1 bg-white border border-black hover:bg-black hover:text-white transition-colors"
                >
                  Mid-Day (P4-6)
                </button>
                <button
                  type="button"
                  onClick={handleSelectAfternoon}
                  className="px-2 py-1 bg-white border border-black hover:bg-black hover:text-white transition-colors"
                >
                  Afternoon (P7-9)
                </button>
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="px-2 py-1 bg-neutral-200 border border-black hover:bg-neutral-300 text-neutral-800 transition-colors"
                >
                  Clear All
                </button>
              </div>
            )}
          </div>

          {/* Interactive Matrix with Live Routine Annotations */}
          <div className="overflow-x-auto border-2 border-black mb-4">
            <table className="w-full text-center border-collapse text-xs font-mono">
              <thead>
                <tr className="bg-black text-white text-[10px]">
                  <th className="p-2 border-r border-neutral-700 w-16">Day</th>
                  {PERIODS.map(p => (
                    <th key={p} className="p-1.5 border-r border-neutral-700 min-w-[70px]">
                      <div>Period {p}</div>
                      <div className="text-[8px] font-normal opacity-75">{PERIOD_LABELS[p]}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DAYS.map(day => (
                  <tr key={day} className="border-b border-black">
                    <td className="p-2 border-r border-black font-bold bg-neutral-100 text-black text-xs">
                      {day}
                    </td>
                    {PERIODS.map(p => {
                      const slotKey = `${day}-${p}`;
                      const isAvailable = selectedSlots.includes(slotKey);
                      const commitment = currentTeacherCommitments.get(slotKey);

                      return (
                        <td 
                          key={p} 
                          className="p-1 border-r border-black last:border-r-0 align-top"
                        >
                          <button
                            type="button"
                            onClick={() => handleToggleSlot(slotKey)}
                            disabled={!isAuthorized}
                            className={`w-full min-h-[50px] p-1 text-[10px] font-bold border transition-all flex flex-col justify-between items-center ${
                              commitment
                                ? isAvailable
                                  ? 'bg-neutral-800 text-white border-black ring-2 ring-amber-400 hover:bg-neutral-700'
                                  : 'bg-neutral-900 text-neutral-300 border-black opacity-90 hover:opacity-100'
                                : isAvailable
                                  ? 'bg-black text-white border-black hover:bg-neutral-800 shadow-sm'
                                  : 'bg-neutral-50 text-neutral-400 border-neutral-300 hover:bg-neutral-200 hover:text-black line-through'
                            } ${!isAuthorized ? 'cursor-not-allowed opacity-50' : 'cursor-pointer active:scale-95'}`}
                          >
                            <span className="text-[9px] uppercase tracking-wider font-mono">
                              {commitment ? (isAvailable ? 'OVERRIDE: YES' : 'IN CLASS') : (isAvailable ? 'AVAILABLE' : 'UNAVAILABLE')}
                            </span>

                            {commitment ? (
                              <div className="text-[8px] leading-tight font-normal text-amber-300 bg-black/60 px-1 py-0.5 rounded-sm w-full mt-0.5 truncate" title={`Batch ${commitment.batchId}: ${commitment.courseCode} (${commitment.roomName})`}>
                                [B-{commitment.batchId}] {commitment.courseCode}
                              </div>
                            ) : (
                              <span className="text-[8px] opacity-75 font-mono">
                                {isAvailable ? '✓ Available' : '✗ Off'}
                              </span>
                            )}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Notes and Save Row */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 border border-black bg-neutral-50">
            <div className="flex-1 min-w-[280px]">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-black mb-1">
                Preference Notes / Teaching Constraints:
              </label>
              <input
                type="text"
                placeholder="e.g. Avoid late afternoons or prefers 2 classes per day"
                value={preferenceNotes}
                onChange={e => setPreferenceNotes(e.target.value)}
                disabled={!isAuthorized}
                className="w-full text-xs p-2 border border-black bg-white font-mono"
              />
            </div>

            {isAuthorized && (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleSavePreference}
                  disabled={isSaving}
                  className="py-2.5 px-6 bg-black text-white text-xs font-bold uppercase tracking-wider border-2 border-black hover:bg-neutral-800 disabled:opacity-50 transition-colors flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'Saving...' : 'Save Availability Preference'}</span>
                </button>

                {saveSuccessMsg && (
                  <div className="text-xs font-mono font-bold text-black flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-emerald-700" />
                    <span>{saveSuccessMsg}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FacultyAvailabilityTable;

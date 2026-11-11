import React, { useState, useEffect, useMemo } from 'react';
import { useRoutine } from '../context/RoutineContext';
import { useAuth } from '../context/AuthContext';
import { Day, FacultyPreference, Teacher } from '../types';
import { api } from '../services/api';
import { Users, Check, Plus, Info, Save, Lock } from 'lucide-react';
import { SearchableTeacherSelect } from './SearchableTeacherSelect';
import { FacultyAvailabilityTable } from './FacultyAvailabilityTable';

export const FacultyPreferenceManager: React.FC = () => {
  const { activeBatch, teachers, activeBatchSlots } = useRoutine();
  const { canEditBatch, currentUser } = useAuth();
  const isCoordinator = Boolean(currentUser && (currentUser.role === 'coordinator' || currentUser.role === 'admin' || canEditBatch(activeBatch)));
  
  const [preferences, setPreferences] = useState<Record<string, FacultyPreference>>({});
  const [editingTeacherId, setEditingTeacherId] = useState<string | null>(null);
  const [saveSuccessTeacherId, setSaveSuccessTeacherId] = useState<string | null>(null);

  // Form state for currently editing teacher
  const [editDays, setEditDays] = useState<Day[]>(['SUN', 'MON', 'TUE', 'WED', 'THU']);
  const [editTimeOfDay, setEditTimeOfDay] = useState<'morning' | 'midday' | 'afternoon' | 'any'>('any');
  const [editMaxClasses, setEditMaxClasses] = useState<number>(2);
  const [editNotes, setEditNotes] = useState<string>('');

  // Selected extra teacher to add to batch
  const [extraTeacherId, setExtraTeacherId] = useState<string>('');

  const days: Day[] = ['SUN', 'MON', 'TUE', 'WED', 'THU'];

  // Load preferences from backend on mount or batch change
  useEffect(() => {
    let isMounted = true;
    const loadPrefs = async () => {
      try {
        const data = await api.getFacultyPreferences(activeBatch.id);
        if (isMounted) {
          const map: Record<string, FacultyPreference> = {};
          data.forEach(p => {
            map[p.teacherId] = p;
          });
          setPreferences(map);
        }
      } catch (err) {
        console.error('Error fetching faculty preferences:', err);
      }
    };
    loadPrefs();
    return () => { isMounted = false; };
  }, [activeBatch.id]);

  // Find all faculty assigned to this batch (via slots, curriculum or preferences)
  const batchFacultyList: Teacher[] = useMemo(() => {
    const teacherIdSet = new Set<string>();

    // From active batch slots
    activeBatchSlots.forEach(s => {
      s.teacherIds.forEach(tid => teacherIdSet.add(tid));
    });

    // From existing preferences for this batch
    Object.keys(preferences).forEach(tid => teacherIdSet.add(tid));

    // Default sample teachers if fresh batch
    if (teacherIdSet.size === 0) {
      teachers.slice(0, 6).forEach(t => teacherIdSet.add(t.id));
    }

    return teachers.filter(t => teacherIdSet.has(t.id)).sort((a, b) => a.rank - b.rank);
  }, [activeBatchSlots, preferences, teachers]);

  const handleStartEdit = (teacher: Teacher) => {
    const current = preferences[teacher.id] || {
      batchId: activeBatch.id,
      teacherId: teacher.id,
      preferredDays: ['SUN', 'MON', 'TUE', 'WED', 'THU'],
      preferredTimeOfDay: 'any',
      maxClassesPerDay: 2,
      notes: ''
    };

    setEditingTeacherId(teacher.id);
    setEditDays(current.preferredDays || ['SUN', 'MON', 'TUE', 'WED', 'THU']);
    setEditTimeOfDay(current.preferredTimeOfDay || 'any');
    setEditMaxClasses(current.maxClassesPerDay || 2);
    setEditNotes(current.notes || '');
  };

  const handleSaveEdit = async (teacherId: string, customPref?: FacultyPreference) => {
    const updatedPref: FacultyPreference = customPref || {
      batchId: activeBatch.id,
      teacherId,
      preferredDays: editDays,
      preferredTimeOfDay: editTimeOfDay,
      maxClassesPerDay: editMaxClasses,
      notes: editNotes
    };

    try {
      await api.saveFacultyPreference(activeBatch.id, updatedPref);
      setPreferences(prev => ({
        ...prev,
        [teacherId]: updatedPref
      }));
      setEditingTeacherId(null);
      setSaveSuccessTeacherId(teacherId);
      setTimeout(() => setSaveSuccessTeacherId(null), 3000);
    } catch (err) {
      console.error('Failed to save preference:', err);
      // Still update local state
      setPreferences(prev => ({
        ...prev,
        [teacherId]: updatedPref
      }));
      setEditingTeacherId(null);
    }
  };

  const handleToggleDay = (day: Day) => {
    if (editDays.includes(day)) {
      if (editDays.length > 1) {
        setEditDays(editDays.filter(d => d !== day));
      }
    } else {
      setEditDays([...editDays, day]);
    }
  };

  const handleAddExtraFaculty = () => {
    if (!extraTeacherId) return;
    const newPref: FacultyPreference = {
      batchId: activeBatch.id,
      teacherId: extraTeacherId,
      preferredDays: ['SUN', 'MON', 'TUE', 'WED', 'THU'],
      preferredTimeOfDay: 'any',
      maxClassesPerDay: 2,
      notes: 'Added to batch faculty pool'
    };
    handleSaveEdit(extraTeacherId, newPref);
    setExtraTeacherId('');
  };

  return (
    <div className="max-w-7xl mx-auto my-6 p-6 bg-white border-2 border-black">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between pb-4 mb-6 border-b-2 border-black gap-4">
        <div>
          <h2 className="text-lg font-bold uppercase tracking-tight text-black flex items-center gap-2">
            <Users className="w-5 h-5" />
            <span>Batch Faculty Availability & Time Preferences</span>
          </h2>
          <p className="text-xs text-neutral-600 font-mono mt-0.5">
            Batch {activeBatch.id} (Level-{activeBatch.level} {activeBatch.term}) • Coordinator: {activeBatch.coordinatorName}
          </p>
        </div>

        <div className="text-xs font-mono px-3 py-1.5 border border-black bg-neutral-50">
          <span className="text-neutral-500">Assigned Faculty: </span>
          <span className="font-bold text-black">{batchFacultyList.length} Teachers</span>
        </div>
      </div>

      {/* Non-Coordinator Read-Only Notice */}
      {!isCoordinator && (
        <div className="mb-6 p-3 bg-neutral-100 border-2 border-black flex items-center gap-2 text-xs font-mono">
          <Lock className="w-4 h-4 text-black shrink-0" />
          <span><strong>READ-ONLY ACCESS:</strong> Batch {activeBatch.id} is coordinated by <strong>{activeBatch.coordinatorName}</strong>. Only the designated coordinator can adjust faculty preferences.</span>
        </div>
      )}

      {/* Guide Note */}
      <div className="mb-6 p-3 bg-neutral-100 border border-black flex items-start gap-2.5 text-xs text-neutral-800">
        <Info className="w-4 h-4 text-black shrink-0 mt-0.5" />
        <div>
          <strong>Coordinator Notice:</strong> The routine scheduler and conflict resolution algorithm prioritize senior faculty (Professors & Associate Professors) and will strictly respect the preferred days and time slots configured below.
        </div>
      </div>

      {/* Add Faculty to this Batch Pool (Coordinator only) */}
      {isCoordinator && !activeBatch.isArchived && (
        <div className="mb-6 p-4 border border-black bg-white flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[280px]">
            <label className="block text-xs font-bold uppercase tracking-wider text-black mb-1">
              + Add Faculty Member to this Batch
            </label>
            <SearchableTeacherSelect
              selectedTeacherIds={extraTeacherId ? [extraTeacherId] : []}
              onChange={(tIds) => setExtraTeacherId(tIds[tIds.length - 1] || '')}
            />
          </div>
          <button
            onClick={handleAddExtraFaculty}
            disabled={!extraTeacherId}
            className="px-4 py-2 text-xs font-bold bg-black text-white hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed border border-black flex items-center gap-1 uppercase tracking-wider"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add to Batch</span>
          </button>
        </div>
      )}

      {/* Faculty List Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left border-2 border-black">
          <thead>
            <tr className="bg-black text-white text-xs font-mono">
              <th className="p-3 border-r border-neutral-700 w-1/4">Faculty Member</th>
              <th className="p-3 border-r border-neutral-700 w-1/4">Preferred Teaching Days</th>
              <th className="p-3 border-r border-neutral-700 w-1/5">Preferred Time Block</th>
              <th className="p-3 border-r border-neutral-700 w-1/6">Max Classes / Day</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="text-xs">
            {batchFacultyList.map(teacher => {
              const pref = preferences[teacher.id] || {
                preferredDays: ['SUN', 'MON', 'TUE', 'WED', 'THU'],
                preferredTimeOfDay: 'any',
                maxClassesPerDay: 2,
                notes: ''
              };

              const isEditing = editingTeacherId === teacher.id;
              const isSavedJustNow = saveSuccessTeacherId === teacher.id;

              return (
                <React.Fragment key={teacher.id}>
                  <tr className={`border-b border-black transition-colors ${
                    isEditing ? 'bg-neutral-100' : 'hover:bg-neutral-50'
                  }`}>
                    {/* Faculty Details */}
                    <td className="p-3 border-r border-black font-medium align-top">
                      <div className="font-bold text-black text-sm">{teacher.name}</div>
                      <div className="text-[11px] font-mono text-neutral-600 mt-0.5">
                        {teacher.designation} • Dept. of {teacher.department}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 bg-black text-white">
                          {teacher.initials}
                        </span>
                        <span className="text-[10px] font-mono border border-black px-1.5 py-0.2 text-black">
                          Rank {teacher.rank}
                        </span>
                        {teacher.isExternal && (
                          <span className="text-[10px] font-mono border border-black bg-neutral-200 px-1 py-0.2">
                            EXTERNAL
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Preferred Days */}
                    <td className="p-3 border-r border-black align-top">
                      <div className="flex flex-wrap gap-1">
                        {days.map(d => {
                          const isPref = pref.preferredDays?.includes(d);
                          return (
                            <span
                              key={d}
                              className={`text-[10px] font-mono font-bold px-1.5 py-0.5 border ${
                                isPref
                                  ? 'bg-black text-white border-black'
                                  : 'bg-neutral-100 text-neutral-400 border-neutral-300 line-through'
                              }`}
                            >
                              {d}
                            </span>
                          );
                        })}
                      </div>
                      {pref.notes && (
                        <div className="mt-1.5 text-[11px] font-mono text-neutral-600 italic">
                          "{pref.notes}"
                        </div>
                      )}
                    </td>

                    {/* Preferred Time Block */}
                    <td className="p-3 border-r border-black align-top font-mono">
                      {pref.preferredTimeOfDay === 'morning' && (
                        <span className="font-bold text-black bg-neutral-200 px-2 py-0.5 border border-black inline-block">
                          Morning (08:10 – 10:30)
                        </span>
                      )}
                      {pref.preferredTimeOfDay === 'midday' && (
                        <span className="font-bold text-black bg-neutral-200 px-2 py-0.5 border border-black inline-block">
                          Mid-Day (10:45 – 01:00)
                        </span>
                      )}
                      {pref.preferredTimeOfDay === 'afternoon' && (
                        <span className="font-bold text-black bg-neutral-200 px-2 py-0.5 border border-black inline-block">
                          Afternoon (01:45 – 04:00)
                        </span>
                      )}
                      {pref.preferredTimeOfDay === 'any' && (
                        <span className="text-neutral-600 border border-neutral-300 px-2 py-0.5 inline-block">
                          Any Period (Flexible)
                        </span>
                      )}
                    </td>

                    {/* Max Classes */}
                    <td className="p-3 border-r border-black align-top font-mono">
                      <span className="font-bold text-black">{pref.maxClassesPerDay || 2}</span>
                      <span className="text-neutral-500 text-[11px]"> slots / day</span>
                    </td>

                    {/* Actions */}
                    <td className="p-3 text-right align-top">
                      {isSavedJustNow ? (
                        <span className="text-xs font-bold text-black flex items-center justify-end gap-1">
                          <Check className="w-3.5 h-3.5" />
                          <span>Saved!</span>
                        </span>
                      ) : isCoordinator && !activeBatch.isArchived ? (
                        <button
                          onClick={() => handleStartEdit(teacher)}
                          className={`px-3 py-1 text-xs font-bold border border-black transition-colors ${
                            isEditing ? 'bg-black text-white' : 'bg-white text-black hover:bg-neutral-100'
                          }`}
                        >
                          {isEditing ? 'Editing...' : 'Set Preferences'}
                        </button>
                      ) : (
                        <span className="text-[10px] text-neutral-400 font-mono">Read-Only</span>
                      )}
                    </td>
                  </tr>

                  {/* Inline Edit Row */}
                  {isEditing && (
                    <tr className="border-b-2 border-black bg-neutral-50">
                      <td colSpan={5} className="p-4">
                        <div className="border border-black bg-white p-4 space-y-4">
                          <div className="flex items-center justify-between pb-2 border-b border-neutral-200">
                            <span className="text-xs font-bold uppercase text-black">
                              Configure Availability for: {teacher.name} ({teacher.initials})
                            </span>
                            <span className="text-[11px] font-mono text-neutral-500">
                              Rank {teacher.rank} • {teacher.designation}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Day Selection */}
                            <div>
                              <label className="block text-[11px] font-bold uppercase tracking-wider text-black mb-1.5">
                                Available Days:
                              </label>
                              <div className="flex gap-1.5">
                                {days.map(d => {
                                  const active = editDays.includes(d);
                                  return (
                                    <button
                                      type="button"
                                      key={d}
                                      onClick={() => handleToggleDay(d)}
                                      className={`px-2.5 py-1 text-xs font-mono font-bold border-2 transition-all ${
                                        active
                                          ? 'bg-black text-white border-black'
                                          : 'bg-white text-neutral-400 border-neutral-300'
                                      }`}
                                    >
                                      {d}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Preferred Time Block */}
                            <div>
                              <label className="block text-[11px] font-bold uppercase tracking-wider text-black mb-1.5">
                                Preferred Time Slot:
                              </label>
                              <select
                                value={editTimeOfDay}
                                onChange={e => setEditTimeOfDay(e.target.value as any)}
                                className="w-full text-xs p-2 border border-black bg-white font-mono"
                              >
                                <option value="any">Flexible / Any Period</option>
                                <option value="morning">Morning (08:10 – 10:30)</option>
                                <option value="midday">Mid-Day (10:45 – 01:00)</option>
                                <option value="afternoon">Afternoon (01:45 – 04:00)</option>
                              </select>
                            </div>

                            {/* Max Classes / Day */}
                            <div>
                              <label className="block text-[11px] font-bold uppercase tracking-wider text-black mb-1.5">
                                Max Classes / Day:
                              </label>
                              <select
                                value={editMaxClasses}
                                onChange={e => setEditMaxClasses(parseInt(e.target.value, 10))}
                                className="w-full text-xs p-2 border border-black bg-white font-mono"
                              >
                                <option value={1}>1 Class per day</option>
                                <option value={2}>2 Classes per day</option>
                                <option value={3}>3 Classes per day</option>
                              </select>
                            </div>
                          </div>

                          {/* Notes */}
                          <div>
                            <label className="block text-[11px] font-bold uppercase tracking-wider text-black mb-1">
                              Coordinator Scheduling Notes:
                            </label>
                            <input
                              type="text"
                              value={editNotes}
                              onChange={e => setEditNotes(e.target.value)}
                              placeholder="e.g. Research commitments on Wednesday; prefers consecutive slots"
                              className="w-full text-xs p-2 border border-black font-mono"
                            />
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-200">
                            <button
                              type="button"
                              onClick={() => setEditingTeacherId(null)}
                              className="px-3 py-1.5 text-xs font-semibold border border-black hover:bg-neutral-100"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveEdit(teacher.id)}
                              className="px-4 py-1.5 text-xs font-bold bg-black text-white hover:bg-neutral-800 flex items-center gap-1.5"
                            >
                              <Save className="w-3.5 h-3.5" />
                              <span>Save Preferences</span>
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Table below Faculty Assignment for Faculty Availability Preference List */}
      <FacultyAvailabilityTable batchId={activeBatch.id} assignedTeacherIds={batchFacultyList.map(t => t.id)} />
    </div>
  );
};

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
  Info, 
  Lock
} from 'lucide-react';

interface FacultyAvailabilityTableProps {
  batchId?: string;
  isEmbeddedInWizard?: boolean;
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
  batchId
}) => {
  const { activeBatch, batches, teachers } = useRoutine();
  const { canEditBatch } = useAuth();

  const currentBatchId = batchId || activeBatch?.id || '2022';
  const targetBatch = batches.find(b => b.id === currentBatchId) || activeBatch;
  const isAuthorized = canEditBatch(targetBatch);

  const [preferences, setPreferences] = useState<Record<string, FacultyPreference>>({});
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [preferenceNotes, setPreferenceNotes] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

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

  // When teacher selection changes, load their current availability slots
  useEffect(() => {
    if (!selectedTeacherId) {
      setSelectedSlots([]);
      setPreferenceNotes('');
      return;
    }

    const existing = preferences[selectedTeacherId];
    if (existing && existing.availabilitySlots && existing.availabilitySlots.length > 0) {
      setSelectedSlots(existing.availabilitySlots);
      setPreferenceNotes(existing.notes || '');
    } else {
      // Default: all slots available
      const allSlots: string[] = [];
      DAYS.forEach(day => {
        PERIODS.forEach(p => {
          allSlots.push(`${day}-${p}`);
        });
      });
      setSelectedSlots(allSlots);
      setPreferenceNotes('');
    }
  }, [selectedTeacherId, preferences]);

  // Toggle a single slot
  const handleToggleSlot = (slotKey: string) => {
    if (!isAuthorized) return;
    setSelectedSlots(prev => 
      prev.includes(slotKey) 
        ? prev.filter(s => s !== slotKey)
        : [...prev, slotKey]
    );
  };

  // Quick preset toggles
  const handleSelectAll = () => {
    const all: string[] = [];
    DAYS.forEach(d => PERIODS.forEach(p => all.push(`${d}-${p}`)));
    setSelectedSlots(all);
  };

  const handleClearAll = () => {
    setSelectedSlots([]);
  };

  const handleSelectMorning = () => {
    const morningSlots: string[] = [];
    DAYS.forEach(d => [1, 2, 3].forEach(p => morningSlots.push(`${d}-${p}`)));
    setSelectedSlots(morningSlots);
  };

  const handleSelectMidDay = () => {
    const midSlots: string[] = [];
    DAYS.forEach(d => [4, 5, 6].forEach(p => midSlots.push(`${d}-${p}`)));
    setSelectedSlots(midSlots);
  };

  const handleSelectAfternoon = () => {
    const aftSlots: string[] = [];
    DAYS.forEach(d => [7, 8, 9].forEach(p => aftSlots.push(`${d}-${p}`)));
    setSelectedSlots(aftSlots);
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

  // Teachers who have configured preferences
  const teachersWithPrefs = useMemo(() => {
    return Object.values(preferences).filter(p => p.availabilitySlots && p.availabilitySlots.length > 0);
  }, [preferences]);

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
            <span className="px-2 py-0.5 text-[9px] font-mono font-bold uppercase bg-neutral-200 border border-black text-black">
              Advisory / Non-Binding
            </span>
          </div>
          <p className="text-xs text-neutral-600 font-mono">
            Coordinators can record preferred available teaching slots for department faculty for Batch {currentBatchId}.
            This schedule serves as a reference guideline and is <span className="font-bold underline">not a hard blocking constraint</span>.
          </p>
        </div>

        {!isAuthorized && (
          <div className="px-3 py-1.5 bg-neutral-100 border border-black text-xs font-mono flex items-center gap-2">
            <Lock className="w-3.5 h-3.5" />
            <span>Read-Only: Coordinated by {targetBatch.coordinatorName}</span>
          </div>
        )}
      </div>

      {/* Advisory Info Card */}
      <div className="p-3 mb-6 bg-neutral-50 border border-black text-xs font-mono flex items-start gap-2.5">
        <Info className="w-4 h-4 text-black shrink-0 mt-0.5" />
        <div className="text-neutral-700 leading-relaxed">
          <strong>Coordinator Usage:</strong> Use this preference table to map out which periods a teacher is comfortable taking classes (e.g., avoiding early morning or late afternoon). Slots can still be manually assigned during timetable authoring if needed.
        </div>
      </div>

      {/* Teacher Selection & Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Step 1: Select Teacher */}
        <div className="md:col-span-1 space-y-3">
          <label className="block text-xs font-bold uppercase tracking-wider text-black">
            1. Select Faculty Member:
          </label>
          <select
            value={selectedTeacherId}
            onChange={e => setSelectedTeacherId(e.target.value)}
            disabled={!isAuthorized}
            className="w-full text-xs p-2.5 border-2 border-black bg-white font-mono font-bold focus:outline-none focus:ring-1 focus:ring-black"
          >
            <option value="">-- Choose a Teacher --</option>
            {teachers.map(t => {
              const hasPref = preferences[t.id]?.availabilitySlots && preferences[t.id].availabilitySlots!.length > 0;
              return (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.initials}) - {t.designation} {hasPref ? '✓' : ''}
                </option>
              );
            })}
          </select>

          {selectedTeacherId && (
            <div className="p-3 border border-black bg-neutral-50 text-xs font-mono space-y-1">
              {(() => {
                const t = teachers.find(x => x.id === selectedTeacherId);
                if (!t) return null;
                return (
                  <>
                    <div className="font-bold text-black">{t.name}</div>
                    <div className="text-[11px] text-neutral-600">{t.designation} • Dept. of {t.department}</div>
                    <div className="text-[11px] font-bold text-black pt-1">
                      Available Slots Selected: <span className="underline">{selectedSlots.length} of 45</span>
                    </div>
                  </>
                );
              })()}
            </div>
          )}

          {/* Quick Presets */}
          {selectedTeacherId && isAuthorized && (
            <div className="pt-2">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-600 mb-2">
                Quick Selection Presets:
              </label>
              <div className="flex flex-wrap gap-1.5 text-[11px] font-mono">
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
                  Morning (P1-P3)
                </button>
                <button
                  type="button"
                  onClick={handleSelectMidDay}
                  className="px-2 py-1 bg-white border border-black hover:bg-black hover:text-white transition-colors"
                >
                  Mid-Day (P4-P6)
                </button>
                <button
                  type="button"
                  onClick={handleSelectAfternoon}
                  className="px-2 py-1 bg-white border border-black hover:bg-black hover:text-white transition-colors"
                >
                  Afternoon (P7-P9)
                </button>
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="px-2 py-1 bg-neutral-200 border border-black hover:bg-neutral-300 text-neutral-800 transition-colors"
                >
                  Clear All
                </button>
              </div>
            </div>
          )}

          {/* Notes Input */}
          {selectedTeacherId && (
            <div className="pt-2">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-black mb-1">
                Preference Notes / Remarks:
              </label>
              <input
                type="text"
                placeholder="e.g. Prefers Tuesday mornings or no classes after 2 PM"
                value={preferenceNotes}
                onChange={e => setPreferenceNotes(e.target.value)}
                disabled={!isAuthorized}
                className="w-full text-xs p-2 border border-black bg-white font-mono"
              />
            </div>
          )}

          {/* Save Button */}
          {selectedTeacherId && isAuthorized && (
            <div className="pt-2">
              <button
                type="button"
                onClick={handleSavePreference}
                disabled={isSaving}
                className="w-full py-2.5 px-4 bg-black text-white text-xs font-bold uppercase tracking-wider border-2 border-black hover:bg-neutral-800 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Saving...' : 'Save Availability Preference'}</span>
              </button>

              {saveSuccessMsg && (
                <div className="mt-2 text-xs font-mono font-bold text-black flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5" />
                  <span>{saveSuccessMsg}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Step 2: Interactive Slots Matrix */}
        <div className="md:col-span-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-black mb-2">
            2. Available Periods Grid (Click cells to toggle availability):
          </label>

          {!selectedTeacherId ? (
            <div className="h-64 border-2 border-dashed border-neutral-300 flex flex-col items-center justify-center text-neutral-500 font-mono text-xs">
              <Calendar className="w-8 h-8 mb-2 opacity-40 text-black" />
              <span>Please select a faculty member on the left to configure availability</span>
            </div>
          ) : (
            <div className="overflow-x-auto border-2 border-black">
              <table className="w-full text-center border-collapse text-xs font-mono">
                <thead>
                  <tr className="bg-black text-white text-[10px]">
                    <th className="p-2 border-r border-neutral-700 w-16">Day</th>
                    {PERIODS.map(p => (
                      <th key={p} className="p-1.5 border-r border-neutral-700 min-w-[50px]">
                        <div>P{p}</div>
                        <div className="text-[8px] font-normal opacity-75">{PERIOD_LABELS[p].split(' - ')[0]}</div>
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

                        return (
                          <td 
                            key={p} 
                            className="p-1 border-r border-black last:border-r-0"
                          >
                            <button
                              type="button"
                              onClick={() => handleToggleSlot(slotKey)}
                              disabled={!isAuthorized}
                              title={`${day} Period ${p} (${PERIOD_LABELS[p]}): ${isAvailable ? 'Available' : 'Unavailable'}`}
                              className={`w-full py-2 px-1 text-[10px] font-bold border transition-colors ${
                                isAvailable
                                  ? 'bg-black text-white border-black hover:bg-neutral-800'
                                  : 'bg-neutral-50 text-neutral-400 border-neutral-300 hover:bg-neutral-200 hover:text-black line-through'
                              } ${!isAuthorized ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                            >
                              {isAvailable ? 'YES' : 'NO'}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Summary Table: Configured Faculty Availability for this Batch */}
      {teachersWithPrefs.length > 0 && (
        <div className="mt-8 pt-6 border-t-2 border-black">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-black flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>Configured Teacher Availability Preferences ({teachersWithPrefs.length} Recorded)</span>
            </h4>
            <span className="text-[11px] font-mono text-neutral-500">
              Batch {currentBatchId} Master Records
            </span>
          </div>

          <div className="border border-black overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-mono">
              <thead>
                <tr className="bg-neutral-100 border-b border-black text-[11px] uppercase">
                  <th className="p-2.5 border-r border-black font-bold">Faculty Member</th>
                  <th className="p-2.5 border-r border-black font-bold">Available Slots</th>
                  <th className="p-2.5 border-r border-black font-bold">Availability Summary</th>
                  <th className="p-2.5 border-r border-black font-bold">Remarks</th>
                  <th className="p-2.5 font-bold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black">
                {teachersWithPrefs.map(pref => {
                  const teacher = teachers.find(t => t.id === pref.teacherId);
                  if (!teacher) return null;
                  const count = pref.availabilitySlots?.length || 0;

                  return (
                    <tr key={pref.teacherId} className="hover:bg-neutral-50 transition-colors">
                      <td className="p-2.5 border-r border-black font-medium">
                        <div className="font-bold text-black">{teacher.name}</div>
                        <div className="text-[10px] text-neutral-600">{teacher.designation} ({teacher.initials})</div>
                      </td>
                      <td className="p-2.5 border-r border-black font-bold">
                        <span className="px-2 py-0.5 bg-black text-white text-[10px]">
                          {count} / 45 Slots
                        </span>
                      </td>
                      <td className="p-2.5 border-r border-black text-[11px] text-neutral-700">
                        {count === 45 ? (
                          <span className="text-neutral-800 font-bold">Flexible across all working days</span>
                        ) : (
                          <span>
                            Available on {Array.from(new Set(pref.availabilitySlots?.map(s => s.split('-')[0]))).join(', ')}
                          </span>
                        )}
                      </td>
                      <td className="p-2.5 border-r border-black text-[11px] text-neutral-600 italic">
                        {pref.notes || '—'}
                      </td>
                      <td className="p-2.5 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedTeacherId(teacher.id)}
                          className="px-2 py-1 text-[10px] font-bold border border-black bg-white hover:bg-black hover:text-white transition-colors"
                        >
                          Edit Slots
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacultyAvailabilityTable;

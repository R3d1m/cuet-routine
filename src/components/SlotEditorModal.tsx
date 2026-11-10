import React, { useState, useEffect, useMemo } from 'react';
import { RoutineSlot, Course, Day, Period, Section, SubGroup } from '../types';
import { useRoutine } from '../context/RoutineContext';
import { SearchableTeacherSelect } from './SearchableTeacherSelect';
import { X, Trash2, Check, ShieldAlert } from 'lucide-react';

interface SlotEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSlot?: Partial<RoutineSlot>;
  preselectedCourse?: Course;
}

export const SlotEditorModal: React.FC<SlotEditorModalProps> = ({
  isOpen,
  onClose,
  initialSlot,
  preselectedCourse
}) => {
  const { 
    activeBatch, 
    courses, 
    rooms, 
    addOrUpdateSlot, 
    deleteSlot, 
    checkConflicts 
  } = useRoutine();

  const [section, setSection] = useState<Section>(initialSlot?.section || 'A');
  const [subGroup, setSubGroup] = useState<SubGroup>(initialSlot?.subGroup || 'ALL');
  const [day, setDay] = useState<Day>(initialSlot?.day || 'SUN');
  const [periodStart, setPeriodStart] = useState<Period>(initialSlot?.periodStart || 2);
  const [periodSpan, setPeriodSpan] = useState<number>(initialSlot?.periodSpan || 1);
  const [courseCode, setCourseCode] = useState<string>(
    initialSlot?.courseCode || preselectedCourse?.code || courses[0]?.code || ''
  );
  const [teacherIds, setTeacherIds] = useState<string[]>(initialSlot?.teacherIds || []);
  const [roomId, setRoomId] = useState<string>(
    initialSlot?.roomId || (section === 'A' ? activeBatch.defaultRoomA : activeBatch.defaultRoomB)
  );
  const [isCT, setIsCT] = useState<boolean>(initialSlot?.isCT || false);
  const [note, setNote] = useState<string>(initialSlot?.note || '');

  // Current selected course details
  const selectedCourse = useMemo(() => {
    return courses.find(c => c.code === courseCode);
  }, [courses, courseCode]);

  // Adjust span and defaults based on course type
  useEffect(() => {
    if (selectedCourse) {
      if (selectedCourse.type === 'sessional') {
        setPeriodSpan(3);
        // Valid 3-period block starts: 1, 4, 7
        if (![1, 4, 7].includes(periodStart)) {
          setPeriodStart(7); // default afternoon lab
        }
        if (selectedCourse.defaultLabId) {
          setRoomId(selectedCourse.defaultLabId);
        }
        if (subGroup === 'ALL') {
          setSubGroup(section === 'A' ? 'A1' : 'B1');
        }
      } else {
        setPeriodSpan(1);
        setSubGroup('ALL');
        setRoomId(section === 'A' ? activeBatch.defaultRoomA : activeBatch.defaultRoomB);
      }
    }
  }, [selectedCourse, section]);

  // Real-time conflict checking
  const conflictReport = useMemo(() => {
    return checkConflicts({
      id: initialSlot?.id,
      batchId: activeBatch.id,
      section,
      subGroup,
      day,
      periodStart,
      periodSpan,
      teacherIds,
      roomId
    });
  }, [initialSlot?.id, activeBatch.id, section, subGroup, day, periodStart, periodSpan, teacherIds, roomId, checkConflicts]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newSlot: RoutineSlot = {
      id: initialSlot?.id || `slot-${Date.now()}`,
      batchId: activeBatch.id,
      section,
      subGroup,
      day,
      periodStart,
      periodSpan,
      courseCode,
      teacherIds,
      roomId,
      isCT,
      note: note.trim() || undefined
    };

    addOrUpdateSlot(newSlot);
    onClose();
  };

  const handleDelete = () => {
    if (initialSlot?.id) {
      deleteSlot(initialSlot.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-[1px]">
      <div className="bg-white border-2 border-black max-w-2xl w-full max-h-[92vh] overflow-y-auto p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-5 border-b-2 border-black">
          <div>
            <h2 className="text-base font-bold uppercase tracking-tight text-black">
              {initialSlot?.id ? 'Edit Routine Slot' : 'Assign New Routine Slot'}
            </h2>
            <p className="text-xs text-neutral-600 font-mono">
              Batch {activeBatch.id} • Level-{activeBatch.level} {activeBatch.term}
            </p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-neutral-100 border border-black">
            <X className="w-4 h-4 text-black" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Section & SubGroup */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-black mb-1">
                Section
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSection('A')}
                  className={`py-1.5 text-xs font-bold border ${
                    section === 'A' ? 'bg-black text-white border-black' : 'border-neutral-300 hover:border-black'
                  }`}
                >
                  Section A
                </button>
                <button
                  type="button"
                  onClick={() => setSection('B')}
                  className={`py-1.5 text-xs font-bold border ${
                    section === 'B' ? 'bg-black text-white border-black' : 'border-neutral-300 hover:border-black'
                  }`}
                >
                  Section B
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-black mb-1">
                Subgroup / Batch Division
              </label>
              <select
                value={subGroup}
                onChange={e => setSubGroup(e.target.value as SubGroup)}
                className="w-full text-xs p-2 border border-black bg-white"
              >
                <option value="ALL">Entire Section ({section})</option>
                <option value={section === 'A' ? 'A1' : 'B1'}>{section === 'A' ? 'Group A1' : 'Group B1'}</option>
                <option value={section === 'A' ? 'A2' : 'B2'}>{section === 'A' ? 'Group A2' : 'Group B2'}</option>
              </select>
            </div>
          </div>

          {/* Course Selection */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-black mb-1">
              Course Offering
            </label>
            <select
              value={courseCode}
              onChange={e => setCourseCode(e.target.value)}
              className="w-full text-xs p-2 border border-black bg-white font-mono"
            >
              <optgroup label="Theory Courses">
                {courses
                  .filter(c => c.type === 'theory')
                  .map(c => (
                    <option key={c.code} value={c.code}>
                      {c.code} — {c.title} ({c.credit} Credits)
                    </option>
                  ))}
              </optgroup>
              <optgroup label="Sessional / Labs">
                {courses
                  .filter(c => c.type === 'sessional')
                  .map(c => (
                    <option key={c.code} value={c.code}>
                      [LAB] {c.code} — {c.title} ({c.credit} Credits)
                    </option>
                  ))}
              </optgroup>
            </select>
          </div>

          {/* Timing: Day & Periods */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-black mb-1">
                Day of Week
              </label>
              <select
                value={day}
                onChange={e => setDay(e.target.value as Day)}
                className="w-full text-xs p-2 border border-black bg-white font-mono"
              >
                <option value="SUN">Sunday</option>
                <option value="MON">Monday</option>
                <option value="TUE">Tuesday</option>
                <option value="WED">Wednesday</option>
                <option value="THU">Thursday</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-black mb-1">
                Start Period
              </label>
              <select
                value={periodStart}
                onChange={e => setPeriodStart(Number(e.target.value) as Period)}
                className="w-full text-xs p-2 border border-black bg-white font-mono"
              >
                {selectedCourse?.type === 'sessional' ? (
                  <>
                    <option value={1}>Period 1 (8:10 – 10:30)</option>
                    <option value={4}>Period 4 (10:45 – 1:00)</option>
                    <option value={7}>Period 7 (1:45 – 4:00)</option>
                  </>
                ) : (
                  Array.from({ length: 9 }, (_, i) => i + 1).map(p => (
                    <option key={p} value={p}>
                      Period {p}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-black mb-1">
                Period Duration
              </label>
              <div className="p-2 border border-neutral-300 bg-neutral-100 text-xs font-mono">
                {periodSpan === 3 ? '3 Continuous Periods (Lab)' : '1 Period (45 min)'}
              </div>
            </div>
          </div>

          {/* Room Selection */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-black mb-1">
              Classroom / Physical Laboratory
            </label>
            <select
              value={roomId}
              onChange={e => setRoomId(e.target.value)}
              className="w-full text-xs p-2 border border-black bg-white font-mono"
            >
              <optgroup label="CSE In-House Labs (5th & 3rd Floor)">
                {rooms
                  .filter(r => r.roomType === 'inhouse_lab')
                  .map(r => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
              </optgroup>
              <optgroup label="External / Allied Labs">
                {rooms
                  .filter(r => r.roomType === 'external_lab')
                  .map(r => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
              </optgroup>
              <optgroup label="Classrooms (Academic Building-3)">
                {rooms
                  .filter(r => r.roomType === 'classroom')
                  .map(r => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
              </optgroup>
            </select>
          </div>

          {/* Assigned Faculty with Search and Seniority */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-black mb-1">
              Assigned Faculty Member(s)
            </label>
            <SearchableTeacherSelect
              selectedTeacherIds={teacherIds}
              onChange={setTeacherIds}
              day={day}
              periodStart={periodStart}
              periodSpan={periodSpan}
            />
            <p className="text-[11px] text-neutral-500 mt-1 font-mono">
              * Assign 2 teachers for theory; 2–3 teachers for sessionals/labs.
            </p>
          </div>

          {/* Optional Class Test flag or Custom Note */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <label className="flex items-center gap-2 cursor-pointer border border-neutral-300 p-2">
              <input
                type="checkbox"
                checked={isCT}
                onChange={e => setIsCT(e.target.checked)}
                className="rounded-none border-black text-black focus:ring-0"
              />
              <span className="text-xs font-semibold">Designate as Class Test (CT) Slot</span>
            </label>

            <div>
              <input
                type="text"
                placeholder="Optional note (e.g. CSE-300 / CSE-302)"
                value={note}
                onChange={e => setNote(e.target.value)}
                className="w-full text-xs p-2 border border-neutral-300"
              />
            </div>
          </div>

          {/* Conflict Warnings Box */}
          {conflictReport.hasConflict && (
            <div className="p-3 bg-neutral-50 border-2 border-black space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-black">
                <ShieldAlert className="w-4 h-4" />
                <span>Active Scheduling Conflict Detected</span>
              </div>
              <ul className="space-y-1">
                {conflictReport.conflicts.map((c, i) => (
                  <li key={i} className="text-xs font-mono flex items-start gap-1.5">
                    <span className="font-bold">•</span>
                    <span>{c.message}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t-2 border-black">
            {initialSlot?.id ? (
              <button
                type="button"
                onClick={handleDelete}
                className="px-3 py-1.5 text-xs font-medium border border-neutral-400 hover:bg-neutral-100 flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Slot</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 text-xs font-medium border border-black hover:bg-neutral-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-1.5 text-xs font-bold bg-black text-white hover:bg-neutral-800 transition-colors flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{initialSlot?.id ? 'Update Slot' : 'Save Slot'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

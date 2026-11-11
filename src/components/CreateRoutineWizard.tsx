import React, { useState, useMemo } from 'react';
import { useRoutine } from '../context/RoutineContext';
import { useAuth } from '../context/AuthContext';
import { 
  Day, 
  Period, 
  Section, 
  RoutineSlot, 
  CourseAssignmentConfig, 
  Batch, 
  Course 
} from '../types';
import { CUET_CSE_CURRICULUM } from '../data/cuetCurriculum';
import { SearchableTeacherSelect } from './SearchableTeacherSelect';
import { FacultyAvailabilityTable } from './FacultyAvailabilityTable';
import { 
  ArrowLeft, 
  ArrowRight, 
  Sparkles, 
  Check, 
  Save 
} from 'lucide-react';

interface CreateRoutineWizardProps {
  onCancel: () => void;
  onFinished: (batchId: string) => void;
}

export const CreateRoutineWizard: React.FC<CreateRoutineWizardProps> = ({
  onCancel,
  onFinished
}) => {
  const { 
    rooms, 
    teachers, 
    slots: globalSlots, 
    addOrUpdateSlot, 
    batches,
    createOrUpdateBatch,
    updateBatchLifecycle, 
    checkConflicts 
  } = useRoutine();
  const { currentUser } = useAuth();

  // Wizard Steps: 1 = Basic Info, 2 = Course & Faculty Setup, 3 = Canvas Review & Drag-Drop
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1: Batch Info
  const [level, setLevel] = useState<number>(1);
  const [term, setTerm] = useState<'Term-I' | 'Term-II'>('Term-I');
  const [batchId, setBatchId] = useState<string>('2026');
  const [academicYear, setAcademicYear] = useState<string>('2025-2026');
  const [coordinatorName, setCoordinatorName] = useState<string>(currentUser?.name || 'Dr. Pranab Kumar Dhar');
  const [roomA, setRoomA] = useState<string>('');
  const [roomB, setRoomB] = useState<string>('');

  // Map classrooms currently assigned to OTHER active batches
  const classroomOccupancy = useMemo(() => {
    const map = new Map<string, string>(); // roomId -> batchId
    batches.forEach(b => {
      // If batch is in Exam Mode, its regular classes are finished, so its classrooms are freed up!
      if (b.id !== batchId && !b.examMode.isEnabled) {
        if (b.defaultRoomA) map.set(b.defaultRoomA, b.id);
        if (b.defaultRoomB) map.set(b.defaultRoomB, b.id);
      }
    });
    return map;
  }, [batches, batchId]);

  // Available classrooms for Section A (filter out occupied rooms)
  const availableRoomsForA = useMemo(() => {
    return rooms.filter(r => r.roomType === 'classroom' && !classroomOccupancy.has(r.id));
  }, [rooms, classroomOccupancy]);

  // Available classrooms for Section B (filter out occupied rooms AND roomA)
  const availableRoomsForB = useMemo(() => {
    return rooms.filter(r => r.roomType === 'classroom' && !classroomOccupancy.has(r.id) && r.id !== roomA);
  }, [rooms, classroomOccupancy, roomA]);

  // Auto-select initial available rooms
  React.useEffect(() => {
    if (availableRoomsForA.length > 0 && (!roomA || !availableRoomsForA.some(r => r.id === roomA))) {
      setRoomA(availableRoomsForA[0].id);
    }
  }, [availableRoomsForA, roomA]);

  React.useEffect(() => {
    if (availableRoomsForB.length > 0 && (!roomB || !availableRoomsForB.some(r => r.id === roomB))) {
      setRoomB(availableRoomsForB[0].id);
    }
  }, [availableRoomsForB, roomB]);

  // Step 2: Auto-loaded courses from Handbook
  const curriculumKey = useMemo(() => {
    const termKey = term.includes('II') ? 'T2' : 'T1';
    return `L${level}${termKey}`;
  }, [level, term]);

  const courses: Course[] = useMemo(() => {
    const found = CUET_CSE_CURRICULUM[curriculumKey];
    return found ? found.courses : [];
  }, [curriculumKey]);

  // Course configuration state (Teachers, Desired Slots, Lab Requirement)
  const [courseConfigs, setCourseConfigs] = useState<Record<string, CourseAssignmentConfig>>({});

  // Initialize course configs when courses change
  React.useEffect(() => {
    const initialConfigs: Record<string, CourseAssignmentConfig> = {};
    courses.forEach(c => {
      // Default lab logic: hardware labs to specific lab, general programming labs to 'any_cse_lab'
      let defaultLab = 'any_cse_lab';
      if (c.type === 'theory') {
        defaultLab = 'classroom';
      } else if (c.code.includes('EE-') || c.code === 'CSE-222' || c.code === 'CSE-334') {
        defaultLab = 'lab-mp'; // Microprocessor / Electrical
      } else if (c.code.includes('Phy-')) {
        defaultLab = 'lab-physics';
      } else if (c.code.includes('ME-')) {
        defaultLab = 'lab-drawing';
      } else if (c.code.includes('EE-284')) {
        defaultLab = 'lab-machine';
      }

      initialConfigs[c.code] = {
        courseCode: c.code,
        teacherIds: [],
        labRoomRequirement: defaultLab,
        preferredDays: ['SUN', 'MON', 'TUE', 'WED', 'THU'],
        preferredTimeOfDay: 'any'
      };
    });
    setCourseConfigs(initialConfigs);
  }, [courses]);

  // Extract all teachers assigned across courses in Step 2 for automatic availability table sync:
  const assignedCourseTeacherIds = useMemo(() => {
    const ids = new Set<string>();
    Object.values(courseConfigs).forEach(cfg => {
      (cfg.teacherIds || []).forEach(tid => ids.add(tid));
    });
    return Array.from(ids);
  }, [courseConfigs]);

  const teacherCourseMap = useMemo(() => {
    const map: Record<string, string[]> = {};
    Object.entries(courseConfigs).forEach(([code, cfg]) => {
      (cfg.teacherIds || []).forEach(tid => {
        if (!map[tid]) map[tid] = [];
        map[tid].push(code);
      });
    });
    return map;
  }, [courseConfigs]);

  // Step 3: Generated Slots
  const [generatedSlots, setGeneratedSlots] = useState<RoutineSlot[]>([]);
  const [activeCanvasSection, setActiveCanvasSection] = useState<Section>('A');
  const [draggedSlotId, setDraggedSlotId] = useState<string | null>(null);

  // In-house general labs for 'any_cse_lab' selection
  const generalCseLabs = ['lab-compiler', 'lab-multimedia', 'lab-os', 'lab-comp'];

  // Helper to update a single course's config
  const updateConfig = (code: string, updates: Partial<CourseAssignmentConfig>) => {
    setCourseConfigs(prev => ({
      ...prev,
      [code]: {
        ...prev[code],
        ...updates
      }
    }));
  };

  // --- AUTOMATED SCHEDULING ENGINE ---
  const handleGenerateRoutine = () => {
    const newSlots: RoutineSlot[] = [];
    const days: Day[] = ['SUN', 'MON', 'TUE', 'WED', 'THU'];

    // Standard 3-period continuous lab blocks
    const labBlocks: { start: Period; span: number; name: string }[] = [
      { start: 1, span: 3, name: 'Morning' },   // Periods 1, 2, 3
      { start: 4, span: 3, name: 'Mid-day' },   // Periods 4, 5, 6
      { start: 7, span: 3, name: 'Afternoon' }, // Periods 7, 8, 9
    ];

    // Standard lecture periods ordered by typical scheduling preference
    const theoryPeriods: Period[] = [2, 3, 4, 5, 1, 6, 7, 8];

    // Helper: is a room busy in global slots or in current batch slots?
    const isRoomOccupied = (roomId: string, day: Day, start: Period, span: number): boolean => {
      if (!roomId) return false;
      const periods = Array.from({ length: span }, (_, i) => start + i);
      const inGlobal = globalSlots.some(
        s => s.roomId === roomId && s.day === day && periods.some(p => p >= s.periodStart && p < s.periodStart + s.periodSpan)
      );
      const inCurrent = newSlots.some(
        s => s.roomId === roomId && s.day === day && periods.some(p => p >= s.periodStart && p < s.periodStart + s.periodSpan)
      );
      return inGlobal || inCurrent;
    };

    // Helper: is a teacher busy in global slots or in current batch slots?
    const isTeacherOccupied = (teacherId: string, day: Day, start: Period, span: number): boolean => {
      if (!teacherId) return false;
      const periods = Array.from({ length: span }, (_, i) => start + i);
      const inGlobal = globalSlots.some(
        s => s.teacherIds.includes(teacherId) && s.day === day && periods.some(p => p >= s.periodStart && p < s.periodStart + s.periodSpan)
      );
      const inCurrent = newSlots.some(
        s => s.teacherIds.includes(teacherId) && s.day === day && periods.some(p => p >= s.periodStart && p < s.periodStart + s.periodSpan)
      );
      return inGlobal || inCurrent;
    };

    // Helper: is the section busy at the given time?
    const isSectionBusy = (sec: Section, day: Day, start: Period, span: number): boolean => {
      const periods = Array.from({ length: span }, (_, i) => start + i);
      return newSlots.some(
        s => s.batchId === batchId && s.section === sec && s.day === day &&
          periods.some(p => p >= s.periodStart && p < s.periodStart + s.periodSpan)
      );
    };

    // Helper: find the best available lab
    const pickLabRoom = (req: string, day: Day, start: Period): string => {
      if (req === 'any_cse_lab') {
        for (const labId of generalCseLabs) {
          if (!isRoomOccupied(labId, day, start, 3)) {
            return labId;
          }
        }
        return generalCseLabs[0];
      }
      return req || generalCseLabs[0];
    };

    // =========================================================================
    // 1. ALLOCATE SESSIONAL LABS FIRST:
    //    RULE: EXACTLY ONE LAB OF EACH COURSE PER SECTION (3-Period Continuous Block)
    // =========================================================================
    const sessionalCourses = courses.filter(c => c.type === 'sessional');
    const sections: Section[] = ['A', 'B'];

    sections.forEach((sec, secIdx) => {
      // Keep track of which days already have a lab for this section to distribute evenly
      const daysWithLab = new Set<Day>();

      sessionalCourses.forEach((c, cIdx) => {
        const config = courseConfigs[c.code] || {
          courseCode: c.code,
          teacherIds: [],
          labRoomRequirement: 'any_cse_lab',
          preferredDays: days,
          preferredTimeOfDay: 'any'
        };

        let placed = false;

        // Rotate starting day between Section A and Section B
        const startDayIdx = (cIdx + secIdx * 2) % 5;
        const prioritizedDays: Day[] = [];
        for (let i = 0; i < 5; i++) {
          prioritizedDays.push(days[(startDayIdx + i) % 5]);
        }

        // Alternating preferred blocks (Sec A prefers Mid-day/Morning; Sec B prefers Morning/Afternoon)
        const candidateBlocks = sec === 'A'
          ? [labBlocks[1], labBlocks[0], labBlocks[2]] // Mid-day (P4-6), Morning (P1-3), Afternoon (P7-9)
          : [labBlocks[0], labBlocks[2], labBlocks[1]]; // Morning (P1-3), Afternoon (P7-9), Mid-day (P4-6)

        // Pass 1: Try days that do not have a lab yet for this section
        for (const day of prioritizedDays) {
          if (placed) break;
          if (daysWithLab.has(day) && daysWithLab.size < 5 && sessionalCourses.length <= 5) {
            continue;
          }

          for (const block of candidateBlocks) {
            if (isSectionBusy(sec, day, block.start, 3)) continue;

            const selectedRoomId = pickLabRoom(config.labRoomRequirement, day, block.start);
            if (isRoomOccupied(selectedRoomId, day, block.start, 3)) continue;

            const teacherClash = config.teacherIds.length > 0 &&
              config.teacherIds.some(tid => isTeacherOccupied(tid, day, block.start, 3));
            if (teacherClash) continue;

            // Place single lab for this section
            newSlots.push({
              id: `gen-lab-${sec}-${c.code}-${day}-P${block.start}-${Date.now()}-${Math.random().toString(36).substring(7)}`,
              batchId,
              section: sec,
              subGroup: 'ALL',
              day,
              periodStart: block.start,
              periodSpan: 3,
              courseCode: c.code,
              teacherIds: config.teacherIds,
              roomId: selectedRoomId
            });
            daysWithLab.add(day);
            placed = true;
            break;
          }
        }

        // Pass 2: If not placed, relax single-lab-per-day restriction
        if (!placed) {
          for (const day of days) {
            if (placed) break;
            for (const block of labBlocks) {
              if (isSectionBusy(sec, day, block.start, 3)) continue;

              const selectedRoomId = pickLabRoom(config.labRoomRequirement, day, block.start);
              if (isRoomOccupied(selectedRoomId, day, block.start, 3)) continue;

              const teacherClash = config.teacherIds.length > 0 &&
                config.teacherIds.some(tid => isTeacherOccupied(tid, day, block.start, 3));
              if (teacherClash) continue;

              newSlots.push({
                id: `gen-lab-${sec}-${c.code}-${day}-P${block.start}-${Date.now()}-${Math.random().toString(36).substring(7)}`,
                batchId,
                section: sec,
                subGroup: 'ALL',
                day,
                periodStart: block.start,
                periodSpan: 3,
                courseCode: c.code,
                teacherIds: config.teacherIds,
                roomId: selectedRoomId
              });
              daysWithLab.add(day);
              placed = true;
              break;
            }
          }
        }

        // Fallback Pass: Place on a free section block so exactly one lab is guaranteed
        if (!placed) {
          const fallbackDay = days[(cIdx + secIdx * 2) % 5];
          const fallbackBlock = labBlocks[(secIdx + cIdx) % 3];
          newSlots.push({
            id: `gen-lab-fb-${sec}-${c.code}-${fallbackDay}-P${fallbackBlock.start}-${Date.now()}`,
            batchId,
            section: sec,
            subGroup: 'ALL',
            day: fallbackDay,
            periodStart: fallbackBlock.start,
            periodSpan: 3,
            courseCode: c.code,
            teacherIds: config.teacherIds,
            roomId: pickLabRoom(config.labRoomRequirement, fallbackDay, fallbackBlock.start)
          });
          daysWithLab.add(fallbackDay);
        }
      });
    });

    // =========================================================================
    // 2. ALLOCATE THEORY COURSES:
    //    RULE: 3 CLASSES FOR 3 CREDITS, 2 CLASSES FOR 2 CREDITS PER SECTION
    //    (EACH CLASS ON A DISTINCT DAY)
    // =========================================================================
    const theoryCourses = courses.filter(c => c.type === 'theory');

    sections.forEach((sec, secIdx) => {
      const defaultRoom = sec === 'A' ? roomA : roomB;

      theoryCourses.forEach((c, cIdx) => {
        const config = courseConfigs[c.code] || {
          courseCode: c.code,
          teacherIds: [],
          labRoomRequirement: 'classroom',
          preferredDays: days,
          preferredTimeOfDay: 'any'
        };

        // Determine classes needed per section:
        // 3 credits -> 3 classes; 2 credits -> 2 classes; 4 credits -> 4 classes
        const creditVal = Math.round(c.credit);
        const classesNeeded = creditVal === 2 ? 2 : (creditVal === 4 ? 4 : 3);
        let classesPlaced = 0;

        // Keep track of days assigned to this course for this section (1 class per day rule)
        const assignedDays = new Set<Day>();

        // Rotate starting day so different courses are distributed across the week
        const startDayIdx = (cIdx * 2 + secIdx) % 5;
        const prioritizedDays: Day[] = [];
        for (let i = 0; i < 5; i++) {
          prioritizedDays.push(days[(startDayIdx + i) % 5]);
        }

        // Pass 1: Ideal placement (distinct days, preferred theory periods, strict conflict checks)
        for (const day of prioritizedDays) {
          if (classesPlaced >= classesNeeded) break;
          if (assignedDays.has(day)) continue;

          for (const period of theoryPeriods) {
            if (isSectionBusy(sec, day, period, 1)) continue;
            if (isRoomOccupied(defaultRoom, day, period, 1)) continue;

            const teacherClash = config.teacherIds.length > 0 &&
              config.teacherIds.some(tid => isTeacherOccupied(tid, day, period, 1));
            if (teacherClash) continue;

            newSlots.push({
              id: `gen-th-${sec}-${c.code}-${day}-P${period}-${Date.now()}-${Math.random().toString(36).substring(7)}`,
              batchId,
              section: sec,
              subGroup: 'ALL',
              day,
              periodStart: period,
              periodSpan: 1,
              courseCode: c.code,
              teacherIds: config.teacherIds,
              roomId: defaultRoom
            });
            assignedDays.add(day);
            classesPlaced++;
            break;
          }
        }

        // Pass 2: If more classes are needed, try any remaining day where section & room are free
        if (classesPlaced < classesNeeded) {
          for (const day of days) {
            if (classesPlaced >= classesNeeded) break;
            if (assignedDays.has(day)) continue;

            for (const period of [1, 2, 3, 4, 5, 6, 7, 8] as Period[]) {
              if (isSectionBusy(sec, day, period, 1)) continue;
              if (isRoomOccupied(defaultRoom, day, period, 1)) continue;

              const teacherClash = config.teacherIds.length > 0 &&
                config.teacherIds.some(tid => isTeacherOccupied(tid, day, period, 1));
              if (teacherClash) continue;

              newSlots.push({
                id: `gen-th-${sec}-${c.code}-${day}-P${period}-${Date.now()}-${Math.random().toString(36).substring(7)}`,
                batchId,
                section: sec,
                subGroup: 'ALL',
                day,
                periodStart: period,
                periodSpan: 1,
                courseCode: c.code,
                teacherIds: config.teacherIds,
                roomId: defaultRoom
              });
              assignedDays.add(day);
              classesPlaced++;
              break;
            }
          }
        }

        // Pass 3 (Guarantee Fallback): Ensure the exact credit quota (3 classes for 3 cr, 2 classes for 2 cr) is fulfilled
        if (classesPlaced < classesNeeded) {
          for (const day of days) {
            if (classesPlaced >= classesNeeded) break;
            for (const period of [2, 3, 4, 5, 1, 6, 7, 8] as Period[]) {
              if (classesPlaced >= classesNeeded) break;
              if (isSectionBusy(sec, day, period, 1)) continue;

              newSlots.push({
                id: `gen-th-fb-${sec}-${c.code}-${day}-P${period}-${Date.now()}`,
                batchId,
                section: sec,
                subGroup: 'ALL',
                day,
                periodStart: period,
                periodSpan: 1,
                courseCode: c.code,
                teacherIds: config.teacherIds,
                roomId: defaultRoom
              });
              assignedDays.add(day);
              classesPlaced++;
              break;
            }
          }
        }
      });
    });

    setGeneratedSlots(newSlots);
    setStep(3);
  };

  // --- DRAG AND DROP HANDLERS ---
  const handleDragStart = (e: React.DragEvent, slotId: string) => {
    e.dataTransfer.setData('text/plain', slotId);
    setDraggedSlotId(slotId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetDay: Day, targetPeriod: Period) => {
    e.preventDefault();
    const slotId = e.dataTransfer.getData('text/plain') || draggedSlotId;
    if (!slotId) return;

    setGeneratedSlots(prev =>
      prev.map(slot => {
        if (slot.id === slotId) {
          return {
            ...slot,
            day: targetDay,
            periodStart: targetPeriod
          };
        }
        return slot;
      })
    );
    setDraggedSlotId(null);
  };

  // --- SAVE & FINALIZE ---
  const handleFinalizeRoutine = () => {
    // 1. Create or update batch
    const newBatch: Batch = {
      id: batchId,
      level,
      term,
      academicYear,
      coordinatorName,
      defaultRoomA: roomA,
      defaultRoomB: roomB,
      commencementDate: '2026-07-01',
      midBreakStart: '2026-09-01',
      midBreakEnd: '2026-09-15',
      endOfClasses: '2026-11-01',
      examMode: {
        isEnabled: false,
        examDay: 'THU',
        time: '1:00 PM - 4:00 PM',
        startWeek: 14,
        endWeek: 18,
        lockedClassrooms: [roomA, roomB]
      }
    };

    updateBatchLifecycle(batchId, newBatch);

    // 2. Commit all slots
    generatedSlots.forEach(s => addOrUpdateSlot(s));

    onFinished(batchId);
  };

  return (
    <div className="max-w-7xl mx-auto my-8 px-4 font-sans text-black">
      {/* Wizard Progress Bar */}
      <div className="flex items-center justify-between pb-4 mb-8 border-b-2 border-black">
        <div>
          <span className="text-[11px] font-mono font-bold uppercase tracking-widest bg-black text-white px-2 py-0.5">
            Routine Generation Wizard
          </span>
          <h1 className="text-xl font-bold uppercase tracking-tight text-black mt-1">
            Create Semester Routine: Level-{level} {term} (Batch {batchId})
          </h1>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <div className={`px-3 py-1 border ${step === 1 ? 'bg-black text-white border-black font-bold' : 'border-neutral-300 text-neutral-600'}`}>
            1. Level & Term
          </div>
          <span>→</span>
          <div className={`px-3 py-1 border ${step === 2 ? 'bg-black text-white border-black font-bold' : 'border-neutral-300 text-neutral-600'}`}>
            2. Faculty & Lab Allocation
          </div>
          <span>→</span>
          <div className={`px-3 py-1 border ${step === 3 ? 'bg-black text-white border-black font-bold' : 'border-neutral-300 text-neutral-600'}`}>
            3. Interactive Canvas (Drag & Drop)
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* STEP 1: LEVEL, TERM & BASIC INFORMATION */}
      {/* ========================================================================= */}
      {step === 1 && (
        <div className="max-w-2xl mx-auto border-2 border-black p-6 bg-white space-y-6">
          <div className="border-b border-black pb-3">
            <h2 className="text-base font-bold uppercase tracking-tight">Step 1: Select Academic Level & Semester</h2>
            <p className="text-xs text-neutral-600 mt-0.5 font-mono">
              Selecting the Level and Semester automatically loads all verified courses from the CUET CSE Undergraduate Handbook.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1">Academic Level</label>
              <select
                value={level}
                onChange={e => setLevel(Number(e.target.value))}
                className="w-full text-xs p-2.5 border border-black bg-white font-mono font-bold"
              >
                <option value={1}>Level-1 (1st Year)</option>
                <option value={2}>Level-2 (2nd Year)</option>
                <option value={3}>Level-3 (3rd Year)</option>
                <option value={4}>Level-4 (4th Year)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1">Semester / Term</label>
              <select
                value={term}
                onChange={e => setTerm(e.target.value as 'Term-I' | 'Term-II')}
                className="w-full text-xs p-2.5 border border-black bg-white font-mono font-bold"
              >
                <option value="Term-I">Term-I</option>
                <option value="Term-II">Term-II</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1">Batch Identifier</label>
              <input
                type="text"
                placeholder="e.g. 2026"
                value={batchId}
                onChange={e => setBatchId(e.target.value)}
                className="w-full text-xs p-2 border border-black font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1">Academic Year</label>
              <input
                type="text"
                placeholder="e.g. 2025-2026"
                value={academicYear}
                onChange={e => setAcademicYear(e.target.value)}
                className="w-full text-xs p-2 border border-black font-mono font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1">Course Coordinator</label>
            <input
              type="text"
              placeholder="e.g. Md. Rashadur Rahman"
              value={coordinatorName}
              onChange={e => setCoordinatorName(e.target.value)}
              className="w-full text-xs p-2 border border-black font-semibold"
            />
          </div>

          <div className="border border-black p-3 bg-neutral-50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-black">Section Classroom Assignment</span>
              <span className="text-[11px] font-mono text-neutral-600">
                {availableRoomsForA.length} free classrooms available
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider mb-1">Section A Classroom</label>
                {availableRoomsForA.length === 0 ? (
                  <div className="p-2 border border-red-500 bg-red-50 text-red-700 text-xs font-mono">
                    No free classrooms available!
                  </div>
                ) : (
                  <select
                    value={roomA}
                    onChange={e => setRoomA(e.target.value)}
                    className="w-full text-xs p-2 border border-black bg-white font-mono font-bold"
                  >
                    {availableRoomsForA.map(r => (
                      <option key={r.id} value={r.id}>{r.name} ({r.floor})</option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider mb-1">Section B Classroom</label>
                {availableRoomsForB.length === 0 ? (
                  <div className="p-2 border border-red-500 bg-red-50 text-red-700 text-xs font-mono">
                    No free classrooms available!
                  </div>
                ) : (
                  <select
                    value={roomB}
                    onChange={e => setRoomB(e.target.value)}
                    className="w-full text-xs p-2 border border-black bg-white font-mono font-bold"
                  >
                    {availableRoomsForB.map(r => (
                      <option key={r.id} value={r.id}>{r.name} ({r.floor})</option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* Note showing occupied classrooms */}
            <div className="pt-2 border-t border-neutral-200 text-[10px] font-mono text-neutral-600">
              <span className="font-bold text-black">Note:</span> Classrooms occupied by other active batches are hidden automatically:
              <div className="flex flex-wrap gap-1 mt-1">
                {Array.from(classroomOccupancy.entries()).map(([rId, bId]) => {
                  const rObj = rooms.find(rm => rm.id === rId);
                  return (
                    <span key={rId} className="px-1.5 py-0.5 bg-neutral-200 text-neutral-800 border border-neutral-300">
                      {rObj?.shortName || rId}: Batch {bId}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t-2 border-black">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-xs font-bold border border-black hover:bg-neutral-100"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={async () => {
                const existing = batches.find(b => b.id === batchId);
                if (!existing) {
                  const draftBatch: Batch = {
                    id: batchId,
                    level,
                    term,
                    academicYear,
                    coordinatorName,
                    defaultRoomA: roomA || 'room-3301',
                    defaultRoomB: roomB || 'room-3302',
                    commencementDate: '2026-07-01',
                    midBreakStart: '2026-09-01',
                    midBreakEnd: '2026-09-15',
                    endOfClasses: '2026-11-01',
                    isArchived: false,
                    examMode: {
                      isEnabled: false,
                      examDay: 'THU',
                      time: '1:00 PM - 4:00 PM',
                      startWeek: 14,
                      endWeek: 18,
                      lockedClassrooms: [roomA, roomB].filter(Boolean)
                    }
                  };
                  await createOrUpdateBatch(draftBatch);
                }
                setStep(2);
              }}
              className="px-6 py-2 text-xs font-bold bg-black text-white hover:bg-neutral-800 flex items-center gap-2"
            >
              <span>Continue to Course & Faculty Setup</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 2: AUTO-LOADED COURSES, TEACHER ASSIGNMENT & LAB ALLOCATION */}
      {/* ========================================================================= */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 border-2 border-black bg-neutral-50">
            <div>
              <h2 className="text-base font-bold uppercase tracking-tight text-black">
                Step 2: Assign Faculty, Desired Slots & Physical Laboratories
              </h2>
              <p className="text-xs text-neutral-600 font-mono mt-0.5">
                Loaded {courses.length} courses for Level-{level} {term}. Allocate teachers and specify lab requirements.
              </p>
            </div>
            <div className="text-right text-xs font-mono">
              <span className="font-bold text-black">{courses.filter(c => c.type === 'theory').length} Theory</span> •{' '}
              <span className="font-bold text-black">{courses.filter(c => c.type === 'sessional').length} Sessional</span>
            </div>
          </div>

          {/* Courses Configuration Table */}
          <div className="border-2 border-black bg-white overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-black text-white font-mono text-[11px] uppercase">
                  <th className="p-2.5 border-r border-neutral-700 w-28">Course No.</th>
                  <th className="p-2.5 border-r border-neutral-700 w-48">Title & Type</th>
                  <th className="p-2.5 border-r border-neutral-700 w-16 text-center">Credit</th>
                  <th className="p-2.5 border-r border-neutral-700 w-72">Assign Faculty</th>
                  <th className="p-2.5">Laboratory / Room Requirement</th>
                </tr>
              </thead>
              <tbody>
                {courses.map(course => {
                  const config = courseConfigs[course.code] || {
                    courseCode: course.code,
                    teacherIds: [],
                    labRoomRequirement: course.type === 'theory' ? 'classroom' : 'any_cse_lab',
                    preferredDays: ['SUN', 'MON', 'TUE', 'WED', 'THU'],
                    preferredTimeOfDay: 'any'
                  };

                  const isSessional = course.type === 'sessional';

                  return (
                    <tr key={course.code} className="border-b border-black hover:bg-neutral-50/50">
                      {/* Code */}
                      <td className="p-2.5 border-r border-black font-mono font-bold align-top bg-neutral-50">
                        <div>{course.code}</div>
                        <div className="text-[10px] text-neutral-500 font-normal">
                          {isSessional ? '3-Hr Block' : `${course.credit} Classes/Wk`}
                        </div>
                      </td>

                      {/* Title & Type */}
                      <td className="p-2.5 border-r border-black align-top">
                        <div className="font-bold text-black">{course.title}</div>
                        <span className={`inline-block px-1.5 py-0.5 text-[10px] font-mono uppercase mt-1 border ${
                          isSessional ? 'bg-neutral-100 border-black text-black font-bold' : 'border-neutral-300 text-neutral-600'
                        }`}>
                          {isSessional ? 'Sessional / Lab' : 'Theory'}
                        </span>
                      </td>

                      {/* Credit */}
                      <td className="p-2.5 border-r border-black font-mono text-center font-bold align-top">
                        {course.credit.toFixed(isSessional ? 2 : 1)}
                      </td>

                      {/* Searchable Faculty Select */}
                      <td className="p-2.5 border-r border-black align-top">
                        <SearchableTeacherSelect
                          selectedTeacherIds={config.teacherIds}
                          onChange={ids => updateConfig(course.code, { teacherIds: ids })}
                        />
                      </td>

                      {/* Lab Requirement Selector */}
                      <td className="p-2.5 align-top">
                        {isSessional ? (
                          <div className="space-y-1.5">
                            <label className="block text-[11px] font-bold uppercase text-neutral-700">
                              Lab Facility:
                            </label>
                            <select
                              value={config.labRoomRequirement}
                              onChange={e => updateConfig(course.code, { labRoomRequirement: e.target.value })}
                              className="w-full text-xs p-1.5 border border-black bg-white font-mono font-semibold"
                            >
                              <option value="any_cse_lab">★ Any Available General CSE Lab (Compiler, Multimedia, OS, Computer)</option>
                              <optgroup label="Specific In-House CSE Labs">
                                <option value="lab-compiler">Compiler Lab (5th Floor)</option>
                                <option value="lab-multimedia">Multimedia Lab (5th Floor)</option>
                                <option value="lab-network">Network & Communication Lab (5th Floor)</option>
                                <option value="lab-mp">Microprocessor & Interfacing Lab (5th Floor)</option>
                                <option value="lab-os">Operating System Lab (3rd Floor)</option>
                                <option value="lab-comp">Computer Lab (3rd Floor)</option>
                              </optgroup>
                              <optgroup label="Specialized External Labs">
                                <option value="lab-physics">Physics Lab (Dept. of Physics)</option>
                                <option value="lab-machine">Machine Lab, Dept. of EEE (Ground Floor)</option>
                                <option value="lab-drawing">Drawing Lab (Mechanical Dept.)</option>
                              </optgroup>
                            </select>
                            <p className="text-[10px] text-neutral-500 font-mono">
                              * For software/programming labs, "Any Available CSE Lab" dynamically picks the free room.
                            </p>
                          </div>
                        ) : (
                          <div className="text-[11px] font-mono text-neutral-600 p-2 bg-neutral-50 border border-neutral-200">
                            Auto-routed to Section Classroom ({roomA} / {roomB})
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table below Faculty Assignment for Faculty Availability Preference List */}
          <FacultyAvailabilityTable 
            batchId={batchId}
            isEmbeddedInWizard={true}
            assignedTeacherIds={assignedCourseTeacherIds}
            teacherCourseMap={teacherCourseMap}
          />

          {/* Action Bar */}
          <div className="flex items-center justify-between p-4 border-2 border-black bg-white">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-4 py-2 text-xs font-bold border border-black hover:bg-neutral-100 flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Step 1</span>
            </button>

            <button
              type="button"
              onClick={handleGenerateRoutine}
              className="px-8 py-3 text-xs font-bold bg-black text-white hover:bg-neutral-800 transition-colors flex items-center gap-2 uppercase tracking-wider"
            >
              <Sparkles className="w-4 h-4" />
              <span>Auto-Generate Routine with Seniority Priority</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 3: INTERACTIVE CANVAS WITH DRAG-AND-DROP SOLVER */}
      {/* ========================================================================= */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between p-4 border-2 border-black bg-white gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono font-bold uppercase tracking-widest bg-black text-white px-2 py-0.5">
                  Step 3: Fine-Tune & Drag-and-Drop Canvas
                </span>
                <span className="text-xs font-mono font-bold text-neutral-600">
                  Total Generated Sessions: {generatedSlots.length}
                </span>
              </div>
              <h2 className="text-base font-bold uppercase tracking-tight text-black mt-1">
                Generated Weekly Schedule for Batch {batchId}
              </h2>
              <p className="text-xs text-neutral-600 font-mono">
                Drag any class or 3-period lab block to another cell to adjust timing and resolve conflicts.
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Section Toggle */}
              <div className="flex items-center border border-black bg-white">
                <button
                  onClick={() => setActiveCanvasSection('A')}
                  className={`px-3 py-1.5 text-xs font-bold ${
                    activeCanvasSection === 'A' ? 'bg-black text-white' : 'hover:bg-neutral-100'
                  }`}
                >
                  Section A ({generatedSlots.filter(s => s.section === 'A').length})
                </button>
                <button
                  onClick={() => setActiveCanvasSection('B')}
                  className={`px-3 py-1.5 text-xs font-bold border-l border-black ${
                    activeCanvasSection === 'B' ? 'bg-black text-white' : 'hover:bg-neutral-100'
                  }`}
                >
                  Section B ({generatedSlots.filter(s => s.section === 'B').length})
                </button>
              </div>

              {/* Commit / Save */}
              <button
                onClick={handleFinalizeRoutine}
                className="px-5 py-2 text-xs font-bold bg-black text-white hover:bg-neutral-800 transition-colors flex items-center gap-1.5 uppercase tracking-wider"
              >
                <Save className="w-4 h-4" />
                <span>Save Routine</span>
              </button>
            </div>
          </div>

          {/* Canvas Matrix Table */}
          <div className="border-2 border-black bg-white overflow-x-auto">
            <table className="w-full border-collapse text-center">
              <thead>
                <tr className="bg-neutral-100 border-b-2 border-black text-xs font-mono">
                  <th className="border-r border-black p-2 font-bold w-16">Day</th>
                  <th className="border-r border-black p-1 font-bold">1<br/><span className="text-[10px] text-neutral-500 font-normal">8:10-9:00</span></th>
                  <th className="border-r border-black p-1 font-bold">2<br/><span className="text-[10px] text-neutral-500 font-normal">9:00-9:45</span></th>
                  <th className="border-r border-black p-1 font-bold">3<br/><span className="text-[10px] text-neutral-500 font-normal">9:45-10:30</span></th>
                  <th className="border-r border-black p-0.5 bg-neutral-200 text-[10px] font-bold w-5 uppercase [writing-mode:vertical-lr] rotate-180">Break</th>
                  <th className="border-r border-black p-1 font-bold">4<br/><span className="text-[10px] text-neutral-500 font-normal">10:45-11:30</span></th>
                  <th className="border-r border-black p-1 font-bold">5<br/><span className="text-[10px] text-neutral-500 font-normal">11:30-12:15</span></th>
                  <th className="border-r border-black p-1 font-bold">6<br/><span className="text-[10px] text-neutral-500 font-normal">12:15-1:00</span></th>
                  <th className="border-r border-black p-0.5 bg-neutral-200 text-[10px] font-bold w-5 uppercase [writing-mode:vertical-lr] rotate-180">Lunch</th>
                  <th className="border-r border-black p-1 font-bold">7<br/><span className="text-[10px] text-neutral-500 font-normal">1:45-2:30</span></th>
                  <th className="border-r border-black p-1 font-bold">8<br/><span className="text-[10px] text-neutral-500 font-normal">2:30-3:15</span></th>
                  <th className="p-1 font-bold">9<br/><span className="text-[10px] text-neutral-500 font-normal">3:15-4:00</span></th>
                </tr>
              </thead>
              <tbody>
                {(['SUN', 'MON', 'TUE', 'WED', 'THU'] as Day[]).map(day => {
                  const daySlots = generatedSlots.filter(
                    s => s.section === activeCanvasSection && s.day === day
                  );

                  const cells: React.ReactNode[] = [];
                  let p = 1;

                  while (p <= 9) {
                    if (p === 4) {
                      cells.push(<td key={`brk-${day}`} className="border-r border-black bg-neutral-100 p-0" />);
                    }
                    if (p === 7) {
                      cells.push(<td key={`lnch-${day}`} className="border-r border-black bg-neutral-100 p-0" />);
                    }

                    const currentPeriod = p as Period;
                    const slot = daySlots.find(
                      s => currentPeriod >= s.periodStart && currentPeriod < s.periodStart + s.periodSpan
                    );

                    if (slot) {
                      if (slot.periodStart === currentPeriod) {
                        const span = slot.periodSpan;
                        const isLab = span === 3;
                        const report = checkConflicts(slot);
                        const roomObj = rooms.find(r => r.id === slot.roomId);

                        cells.push(
                          <td
                            key={`gen-cell-${slot.id}`}
                            colSpan={span}
                            onDragOver={handleDragOver}
                            onDrop={e => handleDrop(e, day, currentPeriod)}
                            className={`border-r border-b border-black p-1 relative ${
                              isLab ? 'bg-neutral-100' : 'bg-white'
                            } ${report.hasConflict ? 'ring-2 ring-red-600 bg-red-50' : ''}`}
                          >
                            <div
                              draggable
                              onDragStart={e => handleDragStart(e, slot.id)}
                              className="border border-black p-1.5 cursor-grab active:cursor-grabbing bg-white hover:shadow-md transition-shadow min-h-[58px] flex flex-col justify-between"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-mono font-bold text-xs text-black">
                                  {slot.courseCode}
                                </span>
                                {slot.subGroup !== 'ALL' && (
                                  <span className="text-[10px] font-mono px-1 bg-black text-white">
                                    {slot.subGroup}
                                  </span>
                                )}
                              </div>

                              <div className="text-[11px] font-semibold text-neutral-800 line-clamp-1">
                                {roomObj ? roomObj.shortName : slot.roomId}
                              </div>

                              <div className="text-[10px] font-mono text-neutral-500">
                                {slot.teacherIds
                                  .map(id => teachers.find(t => t.id === id)?.initials || id)
                                  .join(', ')}
                              </div>
                            </div>
                          </td>
                        );
                        p += span;
                        continue;
                      } else {
                        p++;
                        continue;
                      }
                    } else {
                      // Empty Drop Target
                      cells.push(
                        <td
                          key={`empty-${day}-${p}`}
                          onDragOver={handleDragOver}
                          onDrop={e => handleDrop(e, day, currentPeriod)}
                          className="border-r border-b border-black p-1 hover:bg-neutral-50 cursor-pointer min-w-[72px]"
                        >
                          <div className="h-[58px] flex items-center justify-center text-[10px] text-neutral-300 font-mono">
                            Drop Here
                          </div>
                        </td>
                      );
                      p++;
                    }
                  }

                  return (
                    <tr key={day} className="border-b border-black">
                      <td className="border-r border-black p-2 font-bold text-xs bg-neutral-50 font-mono">
                        {day}
                      </td>
                      {cells}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between p-4 border-2 border-black bg-white">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="px-4 py-2 text-xs font-bold border border-black hover:bg-neutral-100 flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Faculty & Lab Selection</span>
            </button>

            <button
              type="button"
              onClick={handleFinalizeRoutine}
              className="px-8 py-2.5 text-xs font-bold bg-black text-white hover:bg-neutral-800 transition-colors uppercase tracking-wider flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>Finalize & Open in Full Timetable View</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

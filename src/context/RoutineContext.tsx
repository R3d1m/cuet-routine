import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { 
  Batch, 
  Course, 
  Teacher, 
  Room, 
  RoutineSlot, 
  ConflictReport, 
  ConflictItem, 
  Day, 
  Period, 
  Section, 
  SubGroup 
} from '../types';
import { INITIAL_BATCHES, INITIAL_SLOTS } from '../data/initialState';
import { CUET_CSE_FACULTY } from '../data/cuetFaculty';
import { CUET_CSE_ROOMS } from '../data/cuetRooms';
import { CUET_CSE_CURRICULUM } from '../data/cuetCurriculum';
import { api } from '../services/api';

interface RoutineContextType {
  batches: Batch[];
  activeBatchId: string;
  setActiveBatchId: (id: string) => void;
  activeBatch: Batch;
  courses: Course[];
  teachers: Teacher[];
  addTeacher: (teacher: Omit<Teacher, 'id'>) => Promise<Teacher>;
  deleteTeacher: (teacherId: string) => Promise<void>;
  appointCoordinator: (batchId: string, teacherId: string, coordinatorName: string, username?: string, password?: string) => Promise<void>;
  rooms: Room[];
  slots: RoutineSlot[];
  activeBatchSlots: RoutineSlot[];
  addOrUpdateSlot: (slot: RoutineSlot) => Promise<void>;
  deleteSlot: (slotId: string) => Promise<void>;
  updateBatchLifecycle: (batchId: string, updates: Partial<Batch>, freeUpClassesForExam?: boolean) => void;
  advanceBatchSemester: (batchId: string) => Promise<{ nextLevel: number; nextTerm: string; degreeCompleted: boolean }>;
  reopenBatchSemester: (batchId: string) => Promise<void>;
  checkConflicts: (
    candidate: {
      id?: string;
      batchId: string;
      section: Section;
      subGroup: SubGroup;
      day: Day;
      periodStart: Period;
      periodSpan: number;
      courseCode?: string;
      teacherIds: string[];
      roomId: string;
    }
  ) => ConflictReport;
  courseQuota: Record<string, { scheduled: number; required: number; isComplete: boolean }>;
  isLoadingFromBackend: boolean;
}

const RoutineContext = createContext<RoutineContextType | undefined>(undefined);

export const RoutineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [batches, setBatches] = useState<Batch[]>(INITIAL_BATCHES);
  const [activeBatchId, setActiveBatchId] = useState<string>('2022');
  const [teachers, setTeachers] = useState<Teacher[]>(CUET_CSE_FACULTY);
  const [rooms, setRooms] = useState<Room[]>(CUET_CSE_ROOMS);
  const [slots, setSlots] = useState<RoutineSlot[]>(INITIAL_SLOTS);
  const [isLoadingFromBackend, setIsLoadingFromBackend] = useState<boolean>(true);

  // Initialize from NeonDB/FastAPI backend on startup
  useEffect(() => {
    let isMounted = true;
    const initData = async () => {
      try {
        const [backendTeachers, backendRooms, backendBatches] = await Promise.all([
          api.getTeachers(),
          api.getRooms(),
          api.getBatches()
        ]);

        if (isMounted) {
          if (backendTeachers.length > 0) setTeachers(backendTeachers);
          if (backendRooms.length > 0) setRooms(backendRooms);
          if (backendBatches.length > 0) {
            setBatches(prev => {
              // Merge backend batches with existing defaults
              const map = new Map(prev.map(b => [b.id, b]));
              backendBatches.forEach(b => map.set(b.id, { ...map.get(b.id), ...b }));
              return Array.from(map.values());
            });
          }
        }
      } catch (err) {
        console.warn('Backend sync warning, using local initial dataset:', err);
      } finally {
        if (isMounted) setIsLoadingFromBackend(false);
      }
    };

    initData();
    return () => { isMounted = false; };
  }, []);

  // Fetch slots for active batch from backend if available
  useEffect(() => {
    let isMounted = true;
    const fetchSlots = async () => {
      try {
        const backendSlots = await api.getRoutineSlots(activeBatchId);
        if (isMounted && backendSlots.length > 0) {
          setSlots(prev => {
            const others = prev.filter(s => s.batchId !== activeBatchId);
            return [...others, ...backendSlots];
          });
        }
      } catch (e) {
        console.warn('Failed to load slots from backend:', e);
      }
    };
    fetchSlots();
    return () => { isMounted = false; };
  }, [activeBatchId]);

  const activeBatch = useMemo(() => {
    return batches.find(b => b.id === activeBatchId) || batches[0];
  }, [batches, activeBatchId]);

  // Retrieve curriculum for the active batch
  const courses = useMemo(() => {
    const termKey = activeBatch.term.includes('II') ? 'T2' : 'T1';
    const key = `L${activeBatch.level}${termKey}`;
    const found = CUET_CSE_CURRICULUM[key];
    if (found) return found.courses;
    return CUET_CSE_CURRICULUM['L3T2'].courses;
  }, [activeBatch.level, activeBatch.term]);

  const activeBatchSlots = useMemo(() => {
    return slots.filter(s => s.batchId === activeBatchId);
  }, [slots, activeBatchId]);

  const addTeacher = async (newTeacherData: Omit<Teacher, 'id'>): Promise<Teacher> => {
    try {
      const created = await api.createTeacher(newTeacherData);
      setTeachers(prev => [...prev, created]);
      return created;
    } catch (e) {
      const fallbackTeacher: Teacher = {
        ...newTeacherData,
        id: `ext-${Date.now()}`
      };
      setTeachers(prev => [...prev, fallbackTeacher]);
      return fallbackTeacher;
    }
  };

  const deleteTeacher = async (teacherId: string): Promise<void> => {
    try {
      await api.deleteTeacher(teacherId);
      setTeachers(prev => prev.filter(t => t.id !== teacherId));
    } catch (e) {
      console.error('Failed to delete teacher:', e);
      throw e;
    }
  };

  const appointCoordinator = async (
    batchId: string, 
    teacherId: string, 
    coordinatorName: string, 
    username?: string, 
    password?: string
  ): Promise<void> => {
    try {
      await api.appointCoordinator({
        batchId,
        teacherId,
        coordinatorName,
        username,
        password
      });
      setBatches(prev => prev.map(b => b.id === batchId ? { ...b, coordinatorName } : b));
    } catch (e) {
      console.error('Failed to appoint coordinator:', e);
      setBatches(prev => prev.map(b => b.id === batchId ? { ...b, coordinatorName } : b));
      throw e;
    }
  };

  const addOrUpdateSlot = async (slot: RoutineSlot) => {
    // If batch is archived, prevent editing
    const b = batches.find(bt => bt.id === slot.batchId);
    if (b?.isArchived) {
      alert('This routine is locked and archived (PL / DL commenced). Edits are not permitted.');
      return;
    }

    // Optimistic local update
    setSlots(prev => {
      const idx = prev.findIndex(s => s.id === slot.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = slot;
        return next;
      }
      return [...prev, slot];
    });

    // Save to backend
    try {
      await api.saveRoutineSlot(slot);
    } catch (e) {
      console.warn('Backend slot save note (persisted locally):', e);
    }
  };

  const deleteSlot = async (slotId: string) => {
    const slot = slots.find(s => s.id === slotId);
    if (slot) {
      const b = batches.find(bt => bt.id === slot.batchId);
      if (b?.isArchived) {
        alert('Routine is locked and archived. Cannot delete slots.');
        return;
      }
    }

    setSlots(prev => prev.filter(s => s.id !== slotId));

    try {
      await api.deleteRoutineSlot(slotId);
    } catch (e) {
      console.warn('Backend slot delete note:', e);
    }
  };

  const updateBatchLifecycle = (batchId: string, updates: Partial<Batch>, freeUpClassesForExam: boolean = true) => {
    setBatches(prev => prev.map(b => b.id === batchId ? { ...b, ...updates } : b));

    // When PL / DL is commenced or batch is archived, free up all classrooms & labs for this batch
    if (updates.isArchived && freeUpClassesForExam) {
      setSlots(prev => prev.filter(s => s.batchId !== batchId));
    }
  };

  const advanceBatchSemester = async (batchId: string): Promise<{ nextLevel: number; nextTerm: string; degreeCompleted: boolean }> => {
    try {
      const res = await api.advanceSemester(batchId);
      if (res.degree_completed) {
        setBatches(prev => prev.map(b => b.id === batchId ? { ...b, isDegreeCompleted: true } : b));
        return { nextLevel: 4, nextTerm: 'Term-II', degreeCompleted: true };
      }

      setBatches(prev => prev.map(b => {
        if (b.id !== batchId) return b;
        return {
          ...b,
          level: res.batch.level,
          term: res.batch.term,
          isArchived: false,
          plDlDate: undefined
        };
      }));

      return { nextLevel: res.batch.level, nextTerm: res.batch.term, degreeCompleted: false };
    } catch (e) {
      console.warn('Backend advance-semester fallback:', e);
      let nextLevel = 1;
      let nextTerm = 'Term-I';
      let degreeCompleted = false;

      setBatches(prev => prev.map(b => {
        if (b.id !== batchId) return b;
        if (b.term === 'Term-I') {
          nextLevel = b.level;
          nextTerm = 'Term-II';
        } else {
          if (b.level < 4) {
            nextLevel = b.level + 1;
            nextTerm = 'Term-I';
          } else {
            degreeCompleted = true;
            return { ...b, isDegreeCompleted: true };
          }
        }
        return {
          ...b,
          level: nextLevel,
          term: nextTerm,
          isArchived: false,
          plDlDate: undefined
        };
      }));

      return { nextLevel, nextTerm, degreeCompleted };
    }
  };

  const reopenBatchSemester = async (batchId: string): Promise<void> => {
    try {
      await api.reopenSemester(batchId);
    } catch (e) {
      console.warn('Backend reopen-semester fallback:', e);
    }
    setBatches(prev => prev.map(b => b.id === batchId ? { ...b, isArchived: false, plDlDate: undefined } : b));
  };

  // Helper to check if two batches have overlapping calendar active periods
  const areBatchesOverlapping = (b1: Batch, b2: Batch): boolean => {
    const start1 = new Date(b1.commencementDate).getTime();
    const end1 = new Date(b1.endOfClasses).getTime();
    const start2 = new Date(b2.commencementDate).getTime();
    const end2 = new Date(b2.endOfClasses).getTime();
    return !(end1 < start2 || start1 > end2);
  };

  // Helper to detect whether a course or slot is a lab / sessional
  const isLab = (courseCode: string = '', periodSpan: number = 1): boolean => {
    const match = courseCode.match(/(\d+)$/);
    if (match) {
      const num = parseInt(match[1], 10);
      return num % 2 === 0;
    }
    return periodSpan >= 3;
  };

  // Core Conflict Engine with Seniority Priority & Co-Teaching Concurrency Rule
  const checkConflicts = (
    candidate: {
      id?: string;
      batchId: string;
      section: Section;
      subGroup: SubGroup;
      day: Day;
      periodStart: Period;
      periodSpan: number;
      courseCode?: string;
      teacherIds: string[];
      roomId: string;
    }
  ): ConflictReport => {
    const conflicts: ConflictItem[] = [];
    const candidateBatch = batches.find(b => b.id === candidate.batchId)!;

    // Archived batches do not accept new slots
    if (candidateBatch?.isArchived) {
      conflicts.push({
        type: 'EXAM_MODE_LOCK',
        message: `Batch ${candidate.batchId} routine is deactivated and permanently locked due to PL / DL. No edits permitted.`,
        severity: 'error'
      });
      return { hasConflict: true, conflicts };
    }

    const candidatePeriods: number[] = [];
    for (let p = candidate.periodStart; p < candidate.periodStart + candidate.periodSpan; p++) {
      candidatePeriods.push(p);
    }

    const room = rooms.find(r => r.id === candidate.roomId);
    const candidateIsLab = isLab(candidate.courseCode, candidate.periodSpan);

    // Check collisions against existing slots
    for (const slot of slots) {
      if (candidate.id && slot.id === candidate.id) continue;
      if (slot.day !== candidate.day) continue;

      const otherBatch = batches.find(b => b.id === slot.batchId);
      // If other batch is archived, its slots have been freed and do not cause collisions
      if (otherBatch?.isArchived) continue;

      // Check period overlap
      const slotPeriods: number[] = [];
      for (let p = slot.periodStart; p < slot.periodStart + slot.periodSpan; p++) {
        slotPeriods.push(p);
      }
      const hasPeriodOverlap = candidatePeriods.some(cp => slotPeriods.includes(cp));
      if (!hasPeriodOverlap) continue;

      const calendarsOverlap = candidate.batchId === slot.batchId || (otherBatch && areBatchesOverlapping(candidateBatch, otherBatch));
      if (!calendarsOverlap) continue;

      // A. Batch Double-Booking
      if (candidate.batchId === slot.batchId && candidate.section === slot.section) {
        const subGroupConflict = 
          candidate.subGroup === 'ALL' || 
          slot.subGroup === 'ALL' || 
          candidate.subGroup === slot.subGroup;

        if (subGroupConflict) {
          conflicts.push({
            type: 'BATCH_DOUBLE_BOOK',
            message: `Batch ${candidate.batchId} Section ${candidate.section} (${candidate.subGroup}) already has ${slot.courseCode} scheduled in this period.`,
            severity: 'error',
            conflictingBatchId: slot.batchId
          });
        }
      }

      // B. Room Collision
      if (candidate.roomId === slot.roomId) {
        const rName = room?.name || candidate.roomId;
        conflicts.push({
          type: 'ROOM_COLLISION',
          message: `Room "${rName}" is already occupied by Batch ${slot.batchId} (${slot.courseCode}) on ${slot.day} Period ${slot.periodStart}.`,
          severity: 'error',
          conflictingBatchId: slot.batchId
        });
      }

      // C. Teacher Collision with Co-Teaching Concurrency Rule & Seniority Priority Resolution
      const slotIsLab = isLab(slot.courseCode, slot.periodSpan);
      const isParallelTheoryAndLab = (candidateIsLab && !slotIsLab) || (!candidateIsLab && slotIsLab);

      // RULE 10: "for theory and lab at the same time it gets handled by one teacher taking the theory and other at the lab- so don't flag it as conflict."
      if (isParallelTheoryAndLab) {
        // Course teachers coordinate theory and lab responsibilities internally; bypass conflict!
        continue;
      }

      const commonTeachers = candidate.teacherIds.filter(tid => slot.teacherIds.includes(tid));
      for (const tId of commonTeachers) {
        const teacher = teachers.find(t => t.id === tId);
        const tName = teacher ? teacher.name : tId;
        const rank = teacher ? teacher.rank : 4;

        if (candidate.batchId !== slot.batchId) {
          if (rank <= 2) {
            conflicts.push({
              type: 'SENIORITY_OVERRIDE',
              message: `Teacher conflict: ${tName} (${teacher?.designation}) is already booked by Batch ${slot.batchId}. Senior faculty availability takes strict precedence.`,
              severity: 'error',
              conflictingBatchId: slot.batchId,
              seniorTeacherName: tName
            });
          } else {
            conflicts.push({
              type: 'TEACHER_COLLISION',
              message: `Teacher clash: ${tName} (${teacher?.designation}) is simultaneously scheduled in Batch ${slot.batchId} (${slot.courseCode}).`,
              severity: 'error',
              conflictingBatchId: slot.batchId,
              juniorTeacherName: tName
            });
          }
        } else {
          conflicts.push({
            type: 'TEACHER_COLLISION',
            message: `${tName} cannot take two concurrent sessions (${slot.courseCode} & candidate) in Batch ${candidate.batchId}.`,
            severity: 'error'
          });
        }
      }
    }

    return {
      hasConflict: conflicts.length > 0,
      conflicts
    };
  };

  // Course Quota Tracker: e.g. 3 credit = 3 classes per week
  const courseQuota = useMemo(() => {
    const quotaMap: Record<string, { scheduled: number; required: number; isComplete: boolean }> = {};
    
    courses.forEach(c => {
      const required = c.type === 'theory' ? c.credit : 2;
      const scheduledCount = activeBatchSlots.filter(s => s.courseCode === c.code || s.courseCode.startsWith(c.code)).length;
      quotaMap[c.code] = {
        scheduled: scheduledCount,
        required,
        isComplete: scheduledCount >= required
      };
    });

    return quotaMap;
  }, [courses, activeBatchSlots]);

  return (
    <RoutineContext.Provider
      value={{
        batches,
        activeBatchId,
        setActiveBatchId,
        activeBatch,
        courses,
        teachers,
        addTeacher,
        deleteTeacher,
        appointCoordinator,
        rooms,
        slots,
        activeBatchSlots,
        addOrUpdateSlot,
        deleteSlot,
        updateBatchLifecycle,
        advanceBatchSemester,
        reopenBatchSemester,
        checkConflicts,
        courseQuota,
        isLoadingFromBackend
      }}
    >
      {children}
    </RoutineContext.Provider>
  );
};

export const useRoutine = () => {
  const context = useContext(RoutineContext);
  if (!context) {
    throw new Error('useRoutine must be used within a RoutineProvider');
  }
  return context;
};

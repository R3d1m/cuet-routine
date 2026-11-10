export type TeacherDesignation = 
  | 'Professor' 
  | 'Associate Professor' 
  | 'Assistant Professor' 
  | 'Lecturer' 
  | 'External';

export interface Teacher {
  id: string;
  name: string;
  designation: TeacherDesignation;
  rank: number; // 1 = Professor, 2 = Associate Prof, 3 = Assistant Prof, 4 = Lecturer, 5 = External
  department: string;
  initials: string;
  email?: string;
  isExternal?: boolean;
}

export type RoomType = 'classroom' | 'inhouse_lab' | 'external_lab';

export interface Room {
  id: string;
  name: string;
  shortName: string;
  building: string;
  floor: string;
  roomType: RoomType;
  capacity: number;
}

export type CourseType = 'theory' | 'sessional';

export interface Course {
  code: string;
  title: string;
  credit: number;
  type: CourseType;
  contactHours: number; // e.g. 3.0 cr = 3 hrs/wk (3 classes), 1.5 cr = 3 hrs block
  defaultLabId?: string; // specific lab ID or 'any_cse_lab'
  suggestedDepartment?: string;
}

export type Day = 'SUN' | 'MON' | 'TUE' | 'WED' | 'THU';
export type Period = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
export type Section = 'A' | 'B';
export type SubGroup = 'ALL' | 'A1' | 'A2' | 'B1' | 'B2';

export interface RoutineSlot {
  id: string;
  batchId: string;
  section: Section;
  subGroup: SubGroup;
  day: Day;
  periodStart: Period;
  periodSpan: number; // 1 for theory, 3 for lab blocks
  courseCode: string;
  teacherIds: string[];
  roomId: string;
  isCT?: boolean;
  note?: string;
}

export interface ExamModeConfig {
  isEnabled: boolean;
  examDay: Day;
  time: string; // "1:00 PM - 4:00 PM"
  startWeek: number;
  endWeek: number;
  lockedClassrooms: string[];
}

export interface Batch {
  id: string; // e.g. "2025", "2024", "2023", "2022", "2021"
  level: number;
  term: string; // "Term-I" | "Term-II"
  academicYear: string;
  coordinatorName: string;
  defaultRoomA: string;
  defaultRoomB: string;
  commencementDate: string;
  midBreakStart: string;
  midBreakEnd: string;
  endOfClasses: string;
  examMode: ExamModeConfig;
  isArchived?: boolean;
  plDlDate?: string;
  isDegreeCompleted?: boolean;
}

export interface FacultyPreference {
  id?: string;
  batchId: string;
  teacherId: string;
  preferredDays: Day[];
  preferredTimeOfDay: 'morning' | 'midday' | 'afternoon' | 'any';
  maxClassesPerDay?: number;
  notes?: string;
}

export type ConflictType = 
  | 'TEACHER_COLLISION' 
  | 'ROOM_COLLISION' 
  | 'EXAM_MODE_LOCK' 
  | 'BATCH_DOUBLE_BOOK' 
  | 'SENIORITY_OVERRIDE';

export interface ConflictItem {
  type: ConflictType;
  message: string;
  severity: 'error' | 'warning';
  conflictingBatchId?: string;
  seniorTeacherName?: string;
  juniorTeacherName?: string;
}

export interface ConflictReport {
  hasConflict: boolean;
  conflicts: ConflictItem[];
}

export interface CourseAssignmentConfig {
  courseCode: string;
  teacherIds: string[];
  labRoomRequirement: string; // specific lab ID, 'any_cse_lab', or 'classroom'
  preferredDays: Day[];
  preferredTimeOfDay: 'morning' | 'midday' | 'afternoon' | 'any';
}

export interface User {
  id: string;
  username: string;
  role: 'admin' | 'coordinator';
  name: string;
  teacherId?: string;
  assignedBatchId?: string;
}


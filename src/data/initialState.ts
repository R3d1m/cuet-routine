import { Batch, RoutineSlot } from '../types';

export const INITIAL_BATCHES: Batch[] = [
  {
    id: '2026',
    level: 1,
    term: 'Term-I',
    academicYear: '2025-2026',
    coordinatorName: 'Dr. Pranab Kumar Dhar',
    defaultRoomA: 'room-3301',
    defaultRoomB: 'room-3302',
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
      lockedClassrooms: ['room-3301', 'room-3302']
    }
  },
  {
    id: '2025',
    level: 1,
    term: 'Term-I',
    academicYear: '2024-2025',
    coordinatorName: 'Md. Al-Mamun Provath',
    defaultRoomA: 'room-3303',
    defaultRoomB: 'room-3307',
    commencementDate: '2026-07-05',
    midBreakStart: '2026-09-01',
    midBreakEnd: '2026-09-14',
    endOfClasses: '2026-10-30',
    examMode: {
      isEnabled: false,
      examDay: 'THU',
      time: '1:00 PM - 4:00 PM',
      startWeek: 14,
      endWeek: 18,
      lockedClassrooms: ['room-3303', 'room-3307', 'room-3306', 'room-3308', 'room-3406', 'room-3408', 'room-3403', 'room-3305']
    }
  },
  {
    id: '2024',
    level: 2,
    term: 'Term-I',
    academicYear: '2025-2026',
    coordinatorName: 'Md. Atiqul Islam Rizvi',
    defaultRoomA: 'room-3306',
    defaultRoomB: 'room-3308',
    commencementDate: '2026-08-11',
    midBreakStart: '2026-10-01',
    midBreakEnd: '2026-10-15',
    endOfClasses: '2026-11-20',
    examMode: {
      isEnabled: false,
      examDay: 'MON',
      time: '1:00 PM - 4:00 PM',
      startWeek: 14,
      endWeek: 18,
      lockedClassrooms: ['room-3303', 'room-3307', 'room-3306', 'room-3308', 'room-3406', 'room-3408', 'room-3403', 'room-3305']
    }
  },
  {
    id: '2023',
    level: 2,
    term: 'Term-II',
    academicYear: '2024-2025',
    coordinatorName: 'Hasan Murad',
    defaultRoomA: 'room-3406',
    defaultRoomB: 'room-3408',
    commencementDate: '2025-04-20',
    midBreakStart: '2025-06-15',
    midBreakEnd: '2025-06-30',
    endOfClasses: '2025-08-15',
    examMode: {
      isEnabled: true,
      examDay: 'THU',
      time: '1:00 PM - 4:00 PM',
      startWeek: 14,
      endWeek: 18,
      lockedClassrooms: ['room-3406', 'room-3408']
    },
    isArchived: true,
    plDlDate: '2025-08-15'
  },
  {
    id: '2022',
    level: 3,
    term: 'Term-II',
    academicYear: '2025-2026',
    coordinatorName: 'Md. Rashadur Rahman',
    defaultRoomA: 'room-3403',
    defaultRoomB: 'room-3305',
    commencementDate: '2026-07-06',
    midBreakStart: '2026-09-10',
    midBreakEnd: '2026-09-24',
    endOfClasses: '2026-11-05',
    examMode: {
      isEnabled: false,
      examDay: 'WED',
      time: '1:00 PM - 4:00 PM',
      startWeek: 14,
      endWeek: 18,
      lockedClassrooms: ['room-3303', 'room-3307', 'room-3306', 'room-3308', 'room-3406', 'room-3408', 'room-3403', 'room-3305']
    }
  },
  {
    id: '2021',
    level: 4,
    term: 'Term-I',
    academicYear: '2025-2026',
    coordinatorName: 'Mir. Md. Saki Kowsar',
    defaultRoomA: 'room-3403',
    defaultRoomB: 'room-3305',
    commencementDate: '2026-06-01',
    midBreakStart: '2026-08-01',
    midBreakEnd: '2026-08-15',
    endOfClasses: '2026-10-15',
    examMode: {
      isEnabled: false,
      examDay: 'SUN',
      time: '1:00 PM - 4:00 PM',
      startWeek: 14,
      endWeek: 18,
      lockedClassrooms: ['room-3303', 'room-3307', 'room-3306', 'room-3308', 'room-3406', 'room-3408', 'room-3403', 'room-3305']
    }
  }
];

// Prepopulated slots extracted from the official routines
export const INITIAL_SLOTS: RoutineSlot[] = [
  // ==========================================
  // --- BATCH 2022 (L3-T2) SECTION A ---
  // ==========================================
  { id: 's1', batchId: '2022', section: 'A', subGroup: 'ALL', day: 'SUN', periodStart: 2, periodSpan: 1, courseCode: 'CSE-321', teacherIds: ['t-sct'], roomId: 'room-3403' },
  { id: 's2', batchId: '2022', section: 'A', subGroup: 'ALL', day: 'SUN', periodStart: 3, periodSpan: 1, courseCode: 'CSE-347', teacherIds: ['t-ad', 't-mf'], roomId: 'room-3403' },
  { id: 's3', batchId: '2022', section: 'A', subGroup: 'ALL', day: 'SUN', periodStart: 4, periodSpan: 3, courseCode: 'CSE-300', teacherIds: ['t-sct', 't-msa'], roomId: 'lab-os', note: 'CSE-300/CSE-302' },
  { id: 's4', batchId: '2022', section: 'A', subGroup: 'A2', day: 'SUN', periodStart: 7, periodSpan: 3, courseCode: 'CSE-346', teacherIds: ['t-mmh', 't-aa', 't-ab'], roomId: 'lab-multimedia' },

  { id: 's5', batchId: '2022', section: 'A', subGroup: 'A1', day: 'MON', periodStart: 1, periodSpan: 3, courseCode: 'CSE-346', teacherIds: ['t-mmh', 't-aa', 't-ab'], roomId: 'lab-multimedia' },
  { id: 's6', batchId: '2022', section: 'A', subGroup: 'ALL', day: 'MON', periodStart: 4, periodSpan: 1, courseCode: 'CSE-345', teacherIds: ['t-mmh', 't-aa'], roomId: 'room-3403' },
  { id: 's7', batchId: '2022', section: 'A', subGroup: 'ALL', day: 'MON', periodStart: 5, periodSpan: 1, courseCode: 'CSE-355', teacherIds: ['t-msk', 't-mrh'], roomId: 'room-3403' },
  { id: 's8', batchId: '2022', section: 'A', subGroup: 'ALL', day: 'MON', periodStart: 6, periodSpan: 1, courseCode: 'CSE-311', teacherIds: ['t-mhc', 't-mrr'], roomId: 'room-3403' },

  { id: 's9', batchId: '2022', section: 'A', subGroup: 'ALL', day: 'TUE', periodStart: 2, periodSpan: 1, courseCode: 'CSE-347', teacherIds: ['t-ad', 't-mf'], roomId: 'room-3403' },
  { id: 's10', batchId: '2022', section: 'A', subGroup: 'ALL', day: 'TUE', periodStart: 4, periodSpan: 1, courseCode: 'CSE-311', teacherIds: ['t-mhc', 't-mrr'], roomId: 'room-3403' },
  { id: 's11', batchId: '2022', section: 'A', subGroup: 'ALL', day: 'TUE', periodStart: 5, periodSpan: 1, courseCode: 'CSE-355', teacherIds: ['t-msk', 't-mrh'], roomId: 'room-3403' },
  { id: 's12', batchId: '2022', section: 'A', subGroup: 'ALL', day: 'TUE', periodStart: 6, periodSpan: 1, courseCode: 'CSE-321', teacherIds: ['t-sct'], roomId: 'room-3403' },
  { id: 's13', batchId: '2022', section: 'A', subGroup: 'A1', day: 'TUE', periodStart: 7, periodSpan: 3, courseCode: 'CSE-312', teacherIds: ['t-mhc', 't-mrr'], roomId: 'lab-network' },

  { id: 's14', batchId: '2022', section: 'A', subGroup: 'ALL', day: 'WED', periodStart: 3, periodSpan: 1, courseCode: 'CSE-311', teacherIds: ['t-mhc', 't-mrr'], roomId: 'room-3403' },
  { id: 's15', batchId: '2022', section: 'A', subGroup: 'ALL', day: 'WED', periodStart: 4, periodSpan: 1, courseCode: 'CSE-345', teacherIds: ['t-mmh', 't-aa'], roomId: 'room-3403' },
  { id: 's16', batchId: '2022', section: 'A', subGroup: 'ALL', day: 'WED', periodStart: 5, periodSpan: 1, courseCode: 'CSE-355', teacherIds: ['t-msk', 't-mrh'], roomId: 'room-3403' },
  { id: 's17', batchId: '2022', section: 'A', subGroup: 'ALL', day: 'WED', periodStart: 6, periodSpan: 1, courseCode: 'CSE-347', teacherIds: ['t-ad', 't-mf'], roomId: 'room-3403' },
  { id: 's18', batchId: '2022', section: 'A', subGroup: 'A2', day: 'WED', periodStart: 7, periodSpan: 3, courseCode: 'CSE-312', teacherIds: ['t-mhc', 't-mrr'], roomId: 'lab-network' },

  { id: 's19', batchId: '2022', section: 'A', subGroup: 'ALL', day: 'THU', periodStart: 2, periodSpan: 1, courseCode: 'CSE-345', teacherIds: ['t-mmh', 't-aa'], roomId: 'room-3403' },
  { id: 's20', batchId: '2022', section: 'A', subGroup: 'ALL', day: 'THU', periodStart: 3, periodSpan: 1, courseCode: 'CSE-321', teacherIds: ['t-sct'], roomId: 'room-3403' },
  { id: 's21', batchId: '2022', section: 'A', subGroup: 'ALL', day: 'THU', periodStart: 4, periodSpan: 3, courseCode: 'CSE-356', teacherIds: ['t-msk', 't-mrh'], roomId: 'lab-compiler' },

  // ==========================================
  // --- BATCH 2022 (L3-T2) SECTION B ---
  // ==========================================
  { id: 's22', batchId: '2022', section: 'B', subGroup: 'ALL', day: 'SUN', periodStart: 2, periodSpan: 1, courseCode: 'CSE-347', teacherIds: ['t-ad', 't-mf'], roomId: 'room-3305' },
  { id: 's23', batchId: '2022', section: 'B', subGroup: 'ALL', day: 'SUN', periodStart: 3, periodSpan: 1, courseCode: 'CSE-321', teacherIds: ['t-sct'], roomId: 'room-3305' },
  { id: 's24', batchId: '2022', section: 'B', subGroup: 'B1', day: 'SUN', periodStart: 4, periodSpan: 3, courseCode: 'CSE-346', teacherIds: ['t-mmh', 't-aa', 't-ab'], roomId: 'lab-multimedia' },
  { id: 's25', batchId: '2022', section: 'B', subGroup: 'ALL', day: 'SUN', periodStart: 7, periodSpan: 3, courseCode: 'CSE-302', teacherIds: ['t-msa', 't-msk'], roomId: 'room-3305' },

  { id: 's26', batchId: '2022', section: 'B', subGroup: 'ALL', day: 'MON', periodStart: 2, periodSpan: 1, courseCode: 'CSE-311', teacherIds: ['t-mhc', 't-mrr'], roomId: 'room-3305' },
  { id: 's27', batchId: '2022', section: 'B', subGroup: 'ALL', day: 'MON', periodStart: 3, periodSpan: 1, courseCode: 'CSE-345', teacherIds: ['t-mmh', 't-aa'], roomId: 'room-3305' },
  { id: 's28', batchId: '2022', section: 'B', subGroup: 'ALL', day: 'MON', periodStart: 4, periodSpan: 1, courseCode: 'CSE-355', teacherIds: ['t-msk', 't-mrh'], roomId: 'room-3305' },

  { id: 's29', batchId: '2022', section: 'B', subGroup: 'ALL', day: 'TUE', periodStart: 3, periodSpan: 1, courseCode: 'CSE-347', teacherIds: ['t-ad', 't-mf'], roomId: 'room-3305' },
  { id: 's30', batchId: '2022', section: 'B', subGroup: 'ALL', day: 'TUE', periodStart: 4, periodSpan: 1, courseCode: 'CSE-321', teacherIds: ['t-sct'], roomId: 'room-3305' },
  { id: 's31', batchId: '2022', section: 'B', subGroup: 'ALL', day: 'TUE', periodStart: 5, periodSpan: 1, courseCode: 'CSE-311', teacherIds: ['t-mhc', 't-mrr'], roomId: 'room-3305' },
  { id: 's32', batchId: '2022', section: 'B', subGroup: 'ALL', day: 'TUE', periodStart: 6, periodSpan: 1, courseCode: 'CSE-355', teacherIds: ['t-msk', 't-mrh'], roomId: 'room-3305' },
  { id: 's33', batchId: '2022', section: 'B', subGroup: 'ALL', day: 'TUE', periodStart: 7, periodSpan: 3, courseCode: 'CSE-356', teacherIds: ['t-msk', 't-mrh'], roomId: 'lab-multimedia', note: 'CSE-356/CSE-300' },

  { id: 's34', batchId: '2022', section: 'B', subGroup: 'ALL', day: 'WED', periodStart: 2, periodSpan: 1, courseCode: 'CSE-311', teacherIds: ['t-mhc', 't-mrr'], roomId: 'room-3305' },
  { id: 's35', batchId: '2022', section: 'B', subGroup: 'ALL', day: 'WED', periodStart: 4, periodSpan: 1, courseCode: 'CSE-347', teacherIds: ['t-ad', 't-mf'], roomId: 'room-3305' },
  { id: 's36', batchId: '2022', section: 'B', subGroup: 'ALL', day: 'WED', periodStart: 5, periodSpan: 1, courseCode: 'CSE-345', teacherIds: ['t-mmh', 't-aa'], roomId: 'room-3305' },
  { id: 's37', batchId: '2022', section: 'B', subGroup: 'ALL', day: 'WED', periodStart: 6, periodSpan: 1, courseCode: 'CSE-355', teacherIds: ['t-msk', 't-mrh'], roomId: 'room-3305' },
  { id: 's38', batchId: '2022', section: 'B', subGroup: 'B2', day: 'WED', periodStart: 7, periodSpan: 3, courseCode: 'CSE-346', teacherIds: ['t-mmh', 't-aa', 't-ab'], roomId: 'lab-multimedia' },

  { id: 's39', batchId: '2022', section: 'B', subGroup: 'ALL', day: 'THU', periodStart: 2, periodSpan: 1, courseCode: 'CSE-321', teacherIds: ['t-sct'], roomId: 'room-3305' },
  { id: 's40', batchId: '2022', section: 'B', subGroup: 'ALL', day: 'THU', periodStart: 3, periodSpan: 1, courseCode: 'CSE-345', teacherIds: ['t-mmh', 't-aa'], roomId: 'room-3305' },
  { id: 's41', batchId: '2022', section: 'B', subGroup: 'B2', day: 'THU', periodStart: 4, periodSpan: 3, courseCode: 'CSE-312', teacherIds: ['t-mhc', 't-mrr'], roomId: 'lab-network' },
  { id: 's42', batchId: '2022', section: 'B', subGroup: 'B1', day: 'THU', periodStart: 7, periodSpan: 3, courseCode: 'CSE-312', teacherIds: ['t-mhc', 't-mrr'], roomId: 'lab-network' },

  // ==========================================
  // --- BATCH 2025 (L1-T1) SAMPLE LABS ---
  // ==========================================
  { id: 's43', batchId: '2025', section: 'A', subGroup: 'A2', day: 'SUN', periodStart: 4, periodSpan: 3, courseCode: 'Phy-142', teacherIds: ['ext-nj'], roomId: 'lab-physics' },
  { id: 's44', batchId: '2025', section: 'A', subGroup: 'ALL', day: 'SUN', periodStart: 7, periodSpan: 3, courseCode: 'CSE-100', teacherIds: ['t-kd', 't-mf'], roomId: 'lab-comp' },
  { id: 's45', batchId: '2025', section: 'A', subGroup: 'A1', day: 'WED', periodStart: 7, periodSpan: 3, courseCode: 'CSE-142', teacherIds: ['t-muh', 't-ah', 't-shs'], roomId: 'lab-compiler' },

  // ==========================================
  // --- BATCH 2024 (L2-T1) SAMPLE LABS ---
  // ==========================================
  { id: 's46', batchId: '2024', section: 'A', subGroup: 'A2', day: 'SUN', periodStart: 4, periodSpan: 3, courseCode: 'CSE-242', teacherIds: ['t-mair', 't-ssa'], roomId: 'lab-compiler' },
  { id: 's47', batchId: '2024', section: 'A', subGroup: 'A1', day: 'SUN', periodStart: 7, periodSpan: 3, courseCode: 'CSE-242', teacherIds: ['t-mair', 't-ssa'], roomId: 'lab-compiler' },
  { id: 's48', batchId: '2024', section: 'A', subGroup: 'A1', day: 'MON', periodStart: 4, periodSpan: 3, courseCode: 'CSE-222', teacherIds: ['t-pkd', 't-mor', 't-ab'], roomId: 'lab-network' },

  // ==========================================
  // --- BATCH 2023 (L2-T2) SAMPLE LABS ---
  // ==========================================
  { id: 's49', batchId: '2023', section: 'A', subGroup: 'ALL', day: 'SUN', periodStart: 4, periodSpan: 3, courseCode: 'CSE-224', teacherIds: ['t-ahmah', 't-ssa'], roomId: 'lab-compiler', note: 'CSE-224 / EE-284' },
  { id: 's50', batchId: '2023', section: 'A', subGroup: 'A1', day: 'MON', periodStart: 7, periodSpan: 3, courseCode: 'CSE-244', teacherIds: ['t-hm', 't-ah'], roomId: 'lab-os' },
  { id: 's51', batchId: '2023', section: 'A', subGroup: 'A2', day: 'WED', periodStart: 7, periodSpan: 3, courseCode: 'CSE-252', teacherIds: ['t-sa', 't-mair'], roomId: 'lab-os' }
];

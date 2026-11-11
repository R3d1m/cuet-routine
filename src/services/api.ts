import { Teacher, Room, Batch, RoutineSlot, FacultyPreference, User } from '../types';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

function getAuthHeaders(): Record<string, string> {
  try {
    const raw = localStorage.getItem('cuet_routine_auth_user_session');
    if (raw) {
      const u = JSON.parse(raw);
      const h: Record<string, string> = {};
      if (u.role) h['x-user-role'] = u.role;
      if (u.assignedBatchId) h['x-user-batch'] = u.assignedBatchId;
      return h;
    }
  } catch (e) {
    // Ignore storage parse error
  }
  return {};
}

export const api = {
  // Teachers
  async getTeachers(): Promise<Teacher[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/teachers`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data.map((t: any) => ({
        id: t.id,
        name: t.name,
        designation: t.designation,
        rank: t.rank,
        department: t.department,
        initials: t.initials,
        email: t.email,
        isExternal: t.is_external
      }));
    } catch (e) {
      console.warn('API getTeachers failed, falling back to local state:', e);
      return [];
    }
  },

  async createTeacher(teacher: Omit<Teacher, 'id'>): Promise<Teacher> {
    try {
      const res = await fetch(`${API_BASE_URL}/teachers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: teacher.name,
          designation: teacher.designation,
          rank: teacher.rank,
          department: teacher.department,
          initials: teacher.initials,
          email: teacher.email || null,
          is_external: Boolean(teacher.isExternal)
        })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const t = await res.json();
      return {
        id: t.id,
        name: t.name,
        designation: t.designation,
        rank: t.rank,
        department: t.department,
        initials: t.initials,
        email: t.email,
        isExternal: t.is_external
      };
    } catch (e) {
      console.error('API createTeacher failed:', e);
      throw e;
    }
  },

  async deleteTeacher(teacherId: string): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE_URL}/teachers/${teacherId}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  },

  // Rooms
  async getRooms(): Promise<Room[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/rooms`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data.map((r: any) => ({
        id: r.id,
        name: r.name,
        shortName: r.short_name,
        building: r.building,
        floor: r.floor,
        roomType: r.room_type,
        capacity: r.capacity
      }));
    } catch (e) {
      console.warn('API getRooms failed:', e);
      return [];
    }
  },

  // Batches
  async getBatches(): Promise<Batch[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/batches`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data.map((b: any) => ({
        id: b.id,
        level: b.level,
        term: b.term,
        academicYear: b.academic_year,
        coordinatorName: b.coordinator_name,
        defaultRoomA: b.default_room_a,
        defaultRoomB: b.default_room_b,
        commencementDate: b.commencement_date,
        midBreakStart: b.mid_break_start,
        midBreakEnd: b.mid_break_end,
        endOfClasses: b.end_of_classes,
        isArchived: b.is_archived,
        plDlDate: b.pl_dl_date,
        examMode: {
          isEnabled: b.is_archived,
          examDay: 'THU',
          time: '1:00 PM - 4:00 PM',
          startWeek: 15,
          endWeek: 18,
          lockedClassrooms: [b.default_room_a, b.default_room_b]
        }
      }));
    } catch (e) {
      console.warn('API getBatches failed:', e);
      return [];
    }
  },

  // Start PL / DL (Permanent Archival Lock)
  async startPlDl(batchId: string, plDlDate: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE_URL}/batches/${batchId}/start-pl-dl`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pl_dl_date: plDlDate })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  },

  // Appoint Coordinator to Batch
  async appointCoordinator(params: {
    batchId: string;
    teacherId: string;
    coordinatorName: string;
    username?: string;
    password?: string;
  }): Promise<{ success: boolean; batch_id: string; coordinator_name: string; username?: string }> {
    const res = await fetch(`${API_BASE_URL}/batches/${params.batchId}/appoint-coordinator`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        batch_id: params.batchId,
        teacher_id: params.teacherId,
        coordinator_name: params.coordinatorName,
        username: params.username || null,
        password: params.password || null
      })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to appoint coordinator' }));
      throw new Error(err.detail || 'Failed to appoint coordinator');
    }
    return await res.json();
  },

  // Advance Batch to Next Semester (Degree Progression)
  async advanceSemester(batchId: string): Promise<{
    success: boolean;
    degree_completed: boolean;
    message?: string;
    batch?: any;
  }> {
    const res = await fetch(`${API_BASE_URL}/batches/${batchId}/advance-semester`, {
      method: 'POST'
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to advance semester' }));
      throw new Error(err.detail || 'Failed to advance semester');
    }
    return await res.json();
  },

  // Re-open Current Semester Routine
  async reopenSemester(batchId: string): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE_URL}/batches/${batchId}/reopen-semester`, {
      method: 'POST'
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to reopen semester' }));
      throw new Error(err.detail || 'Failed to reopen semester');
    }
    return await res.json();
  },

  // Routine Slots
  async getAllRoutineSlots(): Promise<RoutineSlot[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/routines`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data.map((s: any) => ({
        id: s.id,
        batchId: s.batch_id,
        section: s.section,
        subGroup: s.sub_group,
        day: s.day,
        periodStart: s.period_start,
        periodSpan: s.period_span,
        courseCode: s.course_code,
        teacherIds: s.teacher_ids || [],
        roomId: s.room_id,
        isCT: s.is_ct,
        note: s.note
      }));
    } catch (e) {
      console.warn('API getAllRoutineSlots failed, falling back to local slots:', e);
      return [];
    }
  },

  async getRoutineSlots(batchId: string): Promise<RoutineSlot[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/routines/${batchId}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data.map((s: any) => ({
        id: s.id,
        batchId: s.batch_id,
        section: s.section,
        subGroup: s.sub_group,
        day: s.day,
        periodStart: s.period_start,
        periodSpan: s.period_span,
        courseCode: s.course_code,
        teacherIds: s.teacher_ids,
        roomId: s.room_id,
        isCT: s.is_ct,
        note: s.note
      }));
    } catch (e) {
      console.warn(`API getRoutineSlots failed for ${batchId}:`, e);
      return [];
    }
  },

  async saveRoutineSlot(slot: RoutineSlot, user?: User | null): Promise<{ success: boolean }> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (user) {
      headers['x-user-role'] = user.role;
      if (user.assignedBatchId) headers['x-user-batch'] = user.assignedBatchId;
    }

    const res = await fetch(`${API_BASE_URL}/routines/slots`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        id: slot.id,
        batch_id: slot.batchId,
        section: slot.section,
        sub_group: slot.subGroup,
        day: slot.day,
        period_start: slot.periodStart,
        period_span: slot.periodSpan,
        course_code: slot.courseCode,
        teacher_ids: slot.teacherIds,
        room_id: slot.roomId,
        is_ct: slot.isCT ?? false,
        note: slot.note || null
      })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: `HTTP ${res.status}` }));
      throw new Error(err.detail || `HTTP ${res.status}`);
    }
    return await res.json();
  },

  async deleteRoutineSlot(slotId: string, user?: User | null): Promise<{ success: boolean }> {
    const headers: Record<string, string> = {};
    if (user) {
      headers['x-user-role'] = user.role;
      if (user.assignedBatchId) headers['x-user-batch'] = user.assignedBatchId;
    }

    const res = await fetch(`${API_BASE_URL}/routines/slots/${slotId}`, {
      method: 'DELETE',
      headers
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  },

  // Faculty Preferences
  async getFacultyPreferences(batchId: string): Promise<FacultyPreference[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/faculty-preferences/${batchId}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data.map((p: any) => ({
        id: p.id,
        batchId: p.batch_id,
        teacherId: p.teacher_id,
        preferredDays: p.preferred_days,
        preferredTimeOfDay: p.preferred_time_of_day,
        maxClassesPerDay: p.max_classes_per_day,
        notes: p.notes,
        availabilitySlots: p.availability_slots || []
      }));
    } catch (e) {
      console.warn(`API getFacultyPreferences failed for ${batchId}:`, e);
      return [];
    }
  },

  async saveFacultyPreference(batchId: string, pref: FacultyPreference): Promise<{ success: boolean }> {
    const authHeaders = getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/faculty-preferences/${batchId}`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...authHeaders
      },
      body: JSON.stringify({
        id: pref.id,
        batch_id: batchId,
        teacher_id: pref.teacherId,
        preferred_days: pref.preferredDays,
        preferred_time_of_day: pref.preferredTimeOfDay,
        max_classes_per_day: pref.maxClassesPerDay || 2,
        notes: pref.notes || '',
        availability_slots: pref.availabilitySlots || []
      })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  },

  async clearAllRoutines(): Promise<{ success: boolean; deleted_count: number }> {
    const res = await fetch(`${API_BASE_URL}/routines/clear`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  },

  // Authentication & Coordinator User Management
  async loginUser(username: string, password: string): Promise<User> {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Invalid credentials' }));
      throw new Error(err.detail || 'Login failed');
    }
    const data = await res.json();
    return {
      id: data.id,
      username: data.username,
      role: data.role,
      name: data.name,
      teacherId: data.teacher_id,
      assignedBatchId: data.assigned_batch_id
    };
  },

  async getUsers(): Promise<User[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/users`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data.map((u: any) => ({
        id: u.id,
        username: u.username,
        role: u.role,
        name: u.name,
        teacherId: u.teacher_id,
        assignedBatchId: u.assigned_batch_id
      }));
    } catch (e) {
      console.warn('API getUsers failed:', e);
      return [];
    }
  },

  async createUser(userData: {
    username: string;
    password: string;
    role?: 'admin' | 'coordinator';
    name: string;
    teacher_id?: string;
    assigned_batch_id?: string;
  }): Promise<User> {
    const res = await fetch(`${API_BASE_URL}/auth/create-user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to create user' }));
      throw new Error(err.detail || 'Failed to create user');
    }
    const data = await res.json();
    return {
      id: data.id,
      username: data.username,
      role: data.role,
      name: data.name,
      teacherId: data.teacher_id,
      assignedBatchId: data.assigned_batch_id
    };
  },

  async deleteUser(userId: string): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE_URL}/auth/users/${userId}`, {
      method: 'DELETE'
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to delete user' }));
      throw new Error(err.detail || 'Failed to delete user');
    }
    return await res.json();
  }
};


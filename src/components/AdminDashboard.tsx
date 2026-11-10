import React, { useState, useEffect } from 'react';
import { useRoutine } from '../context/RoutineContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Teacher, Batch, User, TeacherDesignation } from '../types';
import { 
  Shield, 
  UserPlus, 
  UserCheck, 
  Calendar, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  ExternalLink,
  Lock,
  User as UserIcon,
  RefreshCw
} from 'lucide-react';

interface AdminDashboardProps {
  onOpenRoutine: (batchId: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onOpenRoutine }) => {
  const { batches, teachers, addTeacher, deleteTeacher, appointCoordinator } = useRoutine();
  const { currentUser, logout } = useAuth();

  // Active view tab: 'coordinators' | 'teachers'
  const [activeTab, setActiveTab] = useState<'coordinators' | 'teachers'>('coordinators');

  // Users list from backend
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState<boolean>(false);

  // Success / error banners
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Appoint Coordinator Modal / Form State
  const [appointingBatch, setAppointingBatch] = useState<Batch | null>(null);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const [coordinatorUsername, setCoordinatorUsername] = useState<string>('');
  const [coordinatorPassword, setCoordinatorPassword] = useState<string>('');
  const [isSubmittingAppointment, setIsSubmittingAppointment] = useState<boolean>(false);

  // Add Teacher Form State
  const [teacherName, setTeacherName] = useState<string>('');
  const [teacherInitials, setTeacherInitials] = useState<string>('');
  const [teacherDesignation, setTeacherDesignation] = useState<TeacherDesignation>('Assistant Professor');
  const [teacherRank, setTeacherRank] = useState<number>(3);
  const [teacherDepartment, setTeacherDepartment] = useState<string>('Computer Science and Engineering');
  const [teacherEmail, setTeacherEmail] = useState<string>('');
  const [teacherIsExternal, setTeacherIsExternal] = useState<boolean>(false);
  const [isSubmittingTeacher, setIsSubmittingTeacher] = useState<boolean>(false);

  // Teacher Search Filter
  const [facultySearch, setFacultySearch] = useState<string>('');

  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const fetched = await api.getUsers();
      setUsers(fetched);
    } catch (e) {
      console.warn('Failed to load users:', e);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const showNotification = (type: 'success' | 'error', text: string) => {
    setStatusMessage({ type, text });
    setTimeout(() => {
      setStatusMessage(null);
    }, 6000);
  };

  // Open the appoint coordinator modal for a batch
  const handleOpenAppointModal = (batch: Batch) => {
    setAppointingBatch(batch);
    // Find current coordinator teacher if exists
    const currentTeacher = teachers.find(
      t => t.name.toLowerCase().trim() === (batch.coordinatorName || '').toLowerCase().trim()
    );
    const initialTeacherId = currentTeacher?.id || teachers[0]?.id || '';
    setSelectedTeacherId(initialTeacherId);

    // Check if there is already a user account for this teacher
    const teacherUser = users.find(
      u => (initialTeacherId && u.teacherId === initialTeacherId) ||
           (currentTeacher && u.name.toLowerCase().trim() === currentTeacher.name.toLowerCase().trim())
    );
    const batchUser = users.find(u => u.assignedBatchId === batch.id);
    const existingUser = teacherUser || batchUser;

    if (existingUser) {
      setCoordinatorUsername(existingUser.username);
      setCoordinatorPassword('');
    } else {
      // Suggest username from teacher initials or batch
      const teacherObj = teachers.find(t => t.id === initialTeacherId);
      const suggestedUser = teacherObj ? teacherObj.initials.toLowerCase() : `coord_${batch.id}`;
      setCoordinatorUsername(suggestedUser);
      setCoordinatorPassword('cuet123');
    }
  };

  // Handle saving coordinator appointment
  const handleSaveAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appointingBatch || !selectedTeacherId) return;

    const teacher = teachers.find(t => t.id === selectedTeacherId);
    if (!teacher) return;

    setIsSubmittingAppointment(true);
    try {
      await appointCoordinator(
        appointingBatch.id,
        teacher.id,
        teacher.name,
        coordinatorUsername.trim() || undefined,
        coordinatorPassword.trim() || undefined
      );

      showNotification(
        'success',
        `Successfully appointed ${teacher.name} (${teacher.designation}) as Course Coordinator for Batch ${appointingBatch.id}.`
      );
      setAppointingBatch(null);
      fetchUsers();
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to appoint course coordinator.');
    } finally {
      setIsSubmittingAppointment(false);
    }
  };

  // Handle adding new teacher to department
  const handleAddTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherName.trim() || !teacherInitials.trim()) {
      showNotification('error', 'Please provide both Teacher Full Name and Initials.');
      return;
    }

    setIsSubmittingTeacher(true);
    try {
      const created = await addTeacher({
        name: teacherName.trim(),
        initials: teacherInitials.trim().toUpperCase(),
        designation: teacherDesignation,
        rank: teacherRank,
        department: teacherDepartment.trim() || 'Computer Science and Engineering',
        email: teacherEmail.trim() || undefined,
        isExternal: teacherIsExternal
      });

      showNotification(
        'success',
        `Faculty member "${created.name}" (${created.designation}, Initials: ${created.initials}) added to the department successfully.`
      );

      // Reset form
      setTeacherName('');
      setTeacherInitials('');
      setTeacherEmail('');
      setTeacherIsExternal(false);
      setTeacherDesignation('Assistant Professor');
      setTeacherRank(3);
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to add teacher to the department.');
    } finally {
      setIsSubmittingTeacher(false);
    }
  };

  // Handle deleting a teacher
  const handleDeleteTeacher = async (teacher: Teacher) => {
    // Check if teacher is currently assigned as coordinator
    const assignedBatch = batches.find(
      b => (b.coordinatorName || '').trim().toLowerCase() === teacher.name.trim().toLowerCase()
    );
    if (assignedBatch) {
      alert(`Cannot delete ${teacher.name} because they are currently appointed as Course Coordinator for Batch ${assignedBatch.id}. Please reassign the coordinator first.`);
      return;
    }

    if (!confirm(`Are you sure you want to remove ${teacher.name} (${teacher.designation}) from the department faculty roster?`)) {
      return;
    }

    try {
      await deleteTeacher(teacher.id);
      showNotification('success', `Removed ${teacher.name} from the department.`);
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to delete faculty member.');
    }
  };

  // Filtered faculty list
  const filteredTeachers = teachers.filter(t => {
    const q = facultySearch.toLowerCase();
    return (
      t.name.toLowerCase().includes(q) ||
      t.initials.toLowerCase().includes(q) ||
      t.designation.toLowerCase().includes(q) ||
      t.department.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-white text-black flex flex-col justify-between font-sans">
      {/* Top Academic Masthead */}
      <header className="border-b-2 border-black bg-white no-print">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 border-2 border-black flex items-center justify-center font-bold text-base tracking-tighter bg-black text-white">
              CUET
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold tracking-tight uppercase leading-none">
                  Department of Computer Science and Engineering
                </h1>
                <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase bg-black text-white">
                  Admin Gateway
                </span>
              </div>
              <p className="text-xs text-neutral-600 font-mono mt-0.5">
                Chittagong University of Engineering & Technology • Head of Department Governance
              </p>
            </div>
          </div>

          {/* Admin User Info & Log Out */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 border-2 border-black px-3 py-1.5 bg-neutral-50">
              <div className="w-6 h-6 bg-black text-white text-[10px] font-bold flex items-center justify-center font-mono">
                ADM
              </div>
              <div>
                <div className="text-xs font-bold leading-tight flex items-center gap-1.5">
                  <span>{currentUser?.name || 'Head of CSE Department'}</span>
                  <span className="text-[9px] px-1 py-0.2 border border-black font-mono uppercase bg-neutral-200">
                    Admin
                  </span>
                </div>
                <div className="text-[10px] text-neutral-500 font-mono leading-tight">
                  @{currentUser?.username || 'admin'}
                </div>
              </div>
            </div>

            <button
              onClick={logout}
              className="px-3 py-1.5 text-xs font-mono font-bold border-2 border-black bg-white hover:bg-black hover:text-white transition-colors"
            >
              Log Out
            </button>
          </div>
        </div>

        {/* Admin Navigation Tabs */}
        <div className="border-t border-black bg-neutral-100 px-6">
          <div className="max-w-7xl mx-auto flex items-center gap-2">
            <button
              onClick={() => setActiveTab('coordinators')}
              className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 flex items-center gap-2 transition-colors ${
                activeTab === 'coordinators'
                  ? 'border-black text-black bg-white'
                  : 'border-transparent text-neutral-600 hover:text-black'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>Appointed Course Coordinators ({batches.length} Batches)</span>
            </button>

            <button
              onClick={() => setActiveTab('teachers')}
              className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 flex items-center gap-2 transition-colors ${
                activeTab === 'teachers'
                  ? 'border-black text-black bg-white'
                  : 'border-transparent text-neutral-600 hover:text-black'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>Add & Manage Department Teachers ({teachers.length})</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Admin Workspace Content */}
      <main className="max-w-7xl mx-auto px-6 py-8 w-full flex-1">
        {/* Status Notification Banner */}
        {statusMessage && (
          <div
            className={`p-4 mb-6 border-2 border-black flex items-center justify-between text-xs font-mono shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] ${
              statusMessage.type === 'success' ? 'bg-neutral-100 text-black' : 'bg-red-50 text-red-900 border-red-900'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-black" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-red-700" />
              )}
              <span className="font-semibold">{statusMessage.text}</span>
            </div>
            <button
              onClick={() => setStatusMessage(null)}
              className="font-bold underline text-[11px] ml-4 hover:text-neutral-600"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* TAB 1: APPOINTED COURSE COORDINATORS BY BATCH */}
        {activeTab === 'coordinators' && (
          <div>
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 mb-6 border-b-2 border-black">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-neutral-500 bg-neutral-100 px-2 py-0.5 border border-black inline-block mb-1">
                  Departmental Governance
                </span>
                <h2 className="text-xl font-bold uppercase tracking-tight text-black">
                  Appointed Course Coordinators According to Batches
                </h2>
                <p className="text-xs text-neutral-600 font-mono mt-0.5">
                  Each batch is officially assigned a faculty member as Course Coordinator responsible for that semester's routine.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={fetchUsers}
                  disabled={isLoadingUsers}
                  className="px-3 py-1.5 text-xs font-mono font-bold border border-black hover:bg-neutral-100 transition-colors flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingUsers ? 'animate-spin' : ''}`} />
                  <span>Refresh Accounts</span>
                </button>
              </div>
            </div>

            {/* Batches & Coordinators Table */}
            <div className="border-2 border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b-2 border-black bg-neutral-100 font-mono uppercase text-[11px] tracking-wider">
                    <th className="p-3.5 border-r border-black font-bold">Academic Batch</th>
                    <th className="p-3.5 border-r border-black font-bold">Level & Term</th>
                    <th className="p-3.5 border-r border-black font-bold">Semester Status</th>
                    <th className="p-3.5 border-r border-black font-bold">Appointed Course Coordinator</th>
                    <th className="p-3.5 border-r border-black font-bold">Coordinator Login Account</th>
                    <th className="p-3.5 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black font-mono">
                  {batches.map(batch => {
                    // Match teacher info
                    const coordTeacher = teachers.find(
                      t => t.name.toLowerCase().trim() === (batch.coordinatorName || '').toLowerCase().trim()
                    );
                    // Match user account: Prioritize user account belonging to the appointed teacher
                    const userAccount = (coordTeacher && users.find(
                      u => u.teacherId === coordTeacher.id || u.name.toLowerCase().trim() === coordTeacher.name.toLowerCase().trim()
                    )) || users.find(u => u.assignedBatchId === batch.id);

                    return (
                      <tr key={batch.id} className="hover:bg-neutral-50 transition-colors">
                        {/* Batch ID */}
                        <td className="p-3.5 border-r border-black font-bold text-sm">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 bg-black inline-block"></span>
                            <span>Batch {batch.id}</span>
                          </div>
                          <span className="text-[10px] text-neutral-500 block font-normal">
                            Session: {batch.academicYear}
                          </span>
                        </td>

                        {/* Level & Term */}
                        <td className="p-3.5 border-r border-black font-bold">
                          <div>Level-{batch.level} {batch.term}</div>
                          <span className="text-[10px] text-neutral-500 font-normal">
                            Rooms: {batch.defaultRoomA}, {batch.defaultRoomB}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="p-3.5 border-r border-black">
                          {batch.isDegreeCompleted ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-neutral-200 border border-black text-[10px] uppercase font-bold text-neutral-900">
                              <CheckCircle2 className="w-3 h-3 text-black" />
                              <span>Degree Completed</span>
                            </span>
                          ) : batch.isArchived ? (
                            <div>
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-neutral-200 border border-black text-[10px] uppercase font-bold text-neutral-800">
                                <Lock className="w-3 h-3" />
                                <span>Term Concluded (PL/DL)</span>
                              </span>
                              <div className="text-[10px] text-neutral-500 font-mono mt-0.5">
                                Degree In Progress
                              </div>
                            </div>
                          ) : (
                            <div>
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-black text-white text-[10px] uppercase font-bold">
                                <span>In Session</span>
                              </span>
                              <div className="text-[10px] text-neutral-500 font-mono mt-0.5">
                                Degree In Progress
                              </div>
                            </div>
                          )}
                        </td>

                        {/* Appointed Coordinator Teacher */}
                        <td className="p-3.5 border-r border-black">
                          <div className="font-bold text-sm text-black">
                            {batch.coordinatorName || '— Not Appointed —'}
                          </div>
                          {coordTeacher && (
                            <div className="text-[11px] text-neutral-600 mt-0.5">
                              <span>{coordTeacher.designation}</span>
                              <span className="mx-1">•</span>
                              <span className="font-bold text-black border border-black px-1 text-[10px]">
                                {coordTeacher.initials}
                              </span>
                              {coordTeacher.email && (
                                <span className="ml-1 text-[10px] text-neutral-500">
                                  ({coordTeacher.email})
                                </span>
                              )}
                            </div>
                          )}
                        </td>

                        {/* User Account */}
                        <td className="p-3.5 border-r border-black">
                          {userAccount ? (
                            <div className="flex items-center gap-1.5">
                              <span className="px-1.5 py-0.5 bg-neutral-100 border border-black font-bold text-xs">
                                @{userAccount.username}
                              </span>
                              <span className="text-[10px] text-neutral-500">
                                ({userAccount.role})
                              </span>
                            </div>
                          ) : (
                            <span className="text-[11px] text-neutral-400 italic">
                              No login account assigned
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="p-3.5 text-right space-x-2">
                          <button
                            onClick={() => handleOpenAppointModal(batch)}
                            className="px-2.5 py-1 text-xs font-bold border border-black bg-white hover:bg-black hover:text-white transition-colors"
                          >
                            Appoint / Reassign
                          </button>

                          <button
                            onClick={() => onOpenRoutine(batch.id)}
                            title="View official batch routine in read-only mode"
                            className="px-2.5 py-1 text-xs font-bold border border-black bg-neutral-100 hover:bg-neutral-200 transition-colors inline-flex items-center gap-1"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>View Routine</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Quick Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              <div className="border-2 border-black p-5 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex items-center justify-between pb-2 border-b border-neutral-300 mb-3">
                  <span className="text-[10px] font-mono uppercase text-neutral-500 font-bold">Total Batches</span>
                  <Calendar className="w-4 h-4" />
                </div>
                <div className="text-2xl font-bold font-mono">{batches.length}</div>
                <p className="text-xs text-neutral-600 mt-1">
                  Active: {batches.filter(b => !b.isArchived).length} | Completed / PL: {batches.filter(b => b.isArchived).length}
                </p>
              </div>

              <div className="border-2 border-black p-5 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex items-center justify-between pb-2 border-b border-neutral-300 mb-3">
                  <span className="text-[10px] font-mono uppercase text-neutral-500 font-bold">Appointed Coordinators</span>
                  <UserCheck className="w-4 h-4" />
                </div>
                <div className="text-2xl font-bold font-mono">
                  {batches.filter(b => b.coordinatorName).length} / {batches.length}
                </div>
                <p className="text-xs text-neutral-600 mt-1">
                  Faculty assigned to oversee specific undergraduate batches.
                </p>
              </div>

              <div className="border-2 border-black p-5 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex items-center justify-between pb-2 border-b border-neutral-300 mb-3">
                  <span className="text-[10px] font-mono uppercase text-neutral-500 font-bold">Department Faculty</span>
                  <Shield className="w-4 h-4" />
                </div>
                <div className="text-2xl font-bold font-mono">{teachers.length}</div>
                <p className="text-xs text-neutral-600 mt-1">
                  {teachers.filter(t => !t.isExternal).length} Internal CSE Faculty, {teachers.filter(t => t.isExternal).length} External
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ADD TEACHER IN DEPARTMENT & FACULTY DIRECTORY */}
        {activeTab === 'teachers' && (
          <div className="space-y-8">
            {/* Header */}
            <div className="pb-4 border-b-2 border-black">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-neutral-500 bg-neutral-100 px-2 py-0.5 border border-black inline-block mb-1">
                Faculty Governance
              </span>
              <h2 className="text-xl font-bold uppercase tracking-tight text-black">
                Add Teacher & Manage Department Faculty
              </h2>
              <p className="text-xs text-neutral-600 font-mono mt-0.5">
                Register new faculty members to the Department of Computer Science & Engineering. Newly added teachers can immediately be appointed as course coordinators or assigned to class schedules.
              </p>
            </div>

            {/* Grid: Left Column = Add Teacher Form, Right Column = Instructions / Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Add Teacher Form */}
              <div className="lg:col-span-2 border-2 border-black p-6 bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex items-center gap-2 pb-4 mb-5 border-b-2 border-black">
                  <UserPlus className="w-5 h-5" />
                  <h3 className="text-base font-bold uppercase tracking-tight">
                    Add New Teacher to Department
                  </h3>
                </div>

                <form onSubmit={handleAddTeacher} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Full Name */}
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold uppercase tracking-wider mb-1">
                        Teacher Full Name *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Dr. Mohammad Shamsul Arefin"
                        value={teacherName}
                        onChange={e => setTeacherName(e.target.value)}
                        className="w-full text-xs font-mono p-2.5 border border-black outline-none focus:bg-neutral-50"
                        required
                      />
                    </div>

                    {/* Initials */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider mb-1">
                        Short Code / Initials *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. MSA, MIK, MRR"
                        value={teacherInitials}
                        onChange={e => setTeacherInitials(e.target.value.toUpperCase())}
                        maxLength={6}
                        className="w-full text-xs font-mono p-2.5 border border-black outline-none focus:bg-neutral-50 uppercase font-bold"
                        required
                      />
                      <span className="text-[10px] text-neutral-500 font-mono mt-0.5 block">
                        Used on official class routine slots
                      </span>
                    </div>

                    {/* Designation & Rank */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider mb-1">
                        Designation / Position *
                      </label>
                      <select
                        value={teacherDesignation}
                        onChange={e => {
                          const des = e.target.value as TeacherDesignation;
                          setTeacherDesignation(des);
                          if (des === 'Professor') setTeacherRank(1);
                          else if (des === 'Associate Professor') setTeacherRank(2);
                          else if (des === 'Assistant Professor') setTeacherRank(3);
                          else if (des === 'Lecturer') setTeacherRank(4);
                          else setTeacherRank(5);
                        }}
                        className="w-full text-xs font-mono p-2.5 border border-black outline-none focus:bg-neutral-50 bg-white"
                        required
                      >
                        <option value="Professor">Professor (Rank 1 - Senior Priority)</option>
                        <option value="Associate Professor">Associate Professor (Rank 2)</option>
                        <option value="Assistant Professor">Assistant Professor (Rank 3)</option>
                        <option value="Lecturer">Lecturer (Rank 4)</option>
                        <option value="External">External Faculty / Adjunct (Rank 5)</option>
                      </select>
                    </div>

                    {/* Department */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider mb-1">
                        Department
                      </label>
                      <input
                        type="text"
                        value={teacherDepartment}
                        onChange={e => setTeacherDepartment(e.target.value)}
                        placeholder="Computer Science and Engineering"
                        className="w-full text-xs font-mono p-2.5 border border-black outline-none focus:bg-neutral-50"
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider mb-1">
                        Official Email
                      </label>
                      <input
                        type="email"
                        placeholder="e.g. teacher@cuet.ac.bd"
                        value={teacherEmail}
                        onChange={e => setTeacherEmail(e.target.value)}
                        className="w-full text-xs font-mono p-2.5 border border-black outline-none focus:bg-neutral-50"
                      />
                    </div>

                    {/* External Checkbox */}
                    <div className="sm:col-span-2 pt-2">
                      <label className="flex items-center gap-2.5 text-xs font-mono cursor-pointer">
                        <input
                          type="checkbox"
                          checked={teacherIsExternal}
                          onChange={e => setTeacherIsExternal(e.target.checked)}
                          className="w-4 h-4 border-2 border-black accent-black"
                        />
                        <span className="font-bold">
                          External Faculty / Allied Department (e.g. Mathematics, EEE, Humanities)
                        </span>
                      </label>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-neutral-300 flex items-center justify-end gap-3">
                    <button
                      type="submit"
                      disabled={isSubmittingTeacher}
                      className="px-5 py-2.5 text-xs font-bold uppercase tracking-wider border-2 border-black bg-black text-white hover:bg-neutral-800 transition-colors flex items-center gap-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>{isSubmittingTeacher ? 'Registering...' : 'Add Teacher to Department'}</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Side Guide / Quick Stats */}
              <div className="space-y-6">
                <div className="border-2 border-black p-5 bg-neutral-50 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <h4 className="text-xs font-bold font-mono uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5" />
                    <span>Seniority Priority Rules</span>
                  </h4>
                  <ul className="text-xs font-mono text-neutral-700 space-y-2 list-disc list-inside">
                    <li>
                      <strong>Professors (Rank 1):</strong> Have top priority during conflict resolution and morning class scheduling.
                    </li>
                    <li>
                      <strong>Associate & Assistant Professors:</strong> Eligible for Course Coordinator appointment.
                    </li>
                    <li>
                      <strong>Lecturers:</strong> Scheduled based on lab assignments and section distribution.
                    </li>
                  </ul>
                </div>

                <div className="border-2 border-black p-5 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <h4 className="text-xs font-bold font-mono uppercase tracking-wider mb-2">
                    Department Faculty Count
                  </h4>
                  <div className="text-3xl font-bold font-mono">{teachers.length}</div>
                  <div className="text-xs font-mono text-neutral-600 mt-2 space-y-1">
                    <div>Professors: {teachers.filter(t => t.rank === 1).length}</div>
                    <div>Associate Professors: {teachers.filter(t => t.rank === 2).length}</div>
                    <div>Assistant Professors: {teachers.filter(t => t.rank === 3).length}</div>
                    <div>Lecturers: {teachers.filter(t => t.rank === 4).length}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Department Faculty Directory */}
            <div className="mt-10">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-3 mb-4 border-b-2 border-black">
                <div>
                  <h3 className="text-base font-bold uppercase tracking-tight">
                    Department Faculty Directory ({teachers.length} Members)
                  </h3>
                  <p className="text-xs text-neutral-600 font-mono">
                    All appointed teachers sorted by seniority rank.
                  </p>
                </div>

                {/* Search input */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-neutral-500" />
                  <input
                    type="text"
                    placeholder="Search faculty by name, initials..."
                    value={facultySearch}
                    onChange={e => setFacultySearch(e.target.value)}
                    className="text-xs font-mono pl-8 pr-3 py-2 border border-black w-64 outline-none focus:bg-neutral-50"
                  />
                </div>
              </div>

              {/* Table */}
              <div className="border-2 border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b-2 border-black bg-neutral-100 font-mono uppercase text-[11px] tracking-wider">
                      <th className="p-3 border-r border-black font-bold">Initials</th>
                      <th className="p-3 border-r border-black font-bold">Faculty Name</th>
                      <th className="p-3 border-r border-black font-bold">Designation & Rank</th>
                      <th className="p-3 border-r border-black font-bold">Department</th>
                      <th className="p-3 border-r border-black font-bold">Coordinator Status</th>
                      <th className="p-3 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black font-mono">
                    {filteredTeachers.map(teacher => {
                      // Check if appointed to any batch
                      const appointedBatch = batches.find(
                        b => (b.coordinatorName || '').trim().toLowerCase() === teacher.name.trim().toLowerCase()
                      );

                      return (
                        <tr key={teacher.id} className="hover:bg-neutral-50 transition-colors">
                          {/* Initials */}
                          <td className="p-3 border-r border-black font-bold">
                            <span className="px-1.5 py-0.5 border border-black bg-neutral-100 text-xs">
                              {teacher.initials}
                            </span>
                          </td>

                          {/* Name & Email */}
                          <td className="p-3 border-r border-black font-bold">
                            <div>{teacher.name}</div>
                            {teacher.email && (
                              <span className="text-[10px] text-neutral-500 font-normal block">
                                {teacher.email}
                              </span>
                            )}
                          </td>

                          {/* Designation */}
                          <td className="p-3 border-r border-black">
                            <span className="font-semibold">{teacher.designation}</span>
                            <span className="text-[10px] text-neutral-500 block">
                              Rank {teacher.rank}
                            </span>
                          </td>

                          {/* Department */}
                          <td className="p-3 border-r border-black">
                            <span>{teacher.department}</span>
                            {teacher.isExternal && (
                              <span className="ml-1.5 px-1 py-0.2 border border-black text-[9px] uppercase bg-neutral-200">
                                External
                              </span>
                            )}
                          </td>

                          {/* Coordinator Status */}
                          <td className="p-3 border-r border-black">
                            {appointedBatch ? (
                              <span className="inline-flex items-center gap-1 font-bold text-black border border-black px-2 py-0.5 bg-neutral-100 text-[10px] uppercase">
                                <UserCheck className="w-3 h-3" />
                                <span>Batch {appointedBatch.id} Coordinator</span>
                              </span>
                            ) : (
                              <span className="text-neutral-400 text-[11px] italic">
                                Available
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="p-3 text-right">
                            <button
                              onClick={() => handleDeleteTeacher(teacher)}
                              title={`Remove ${teacher.name} from faculty`}
                              className="p-1 border border-neutral-400 hover:border-black hover:bg-neutral-100 text-neutral-600 hover:text-black transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* APPOINT COORDINATOR MODAL */}
      {appointingBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 font-sans no-print">
          <div className="bg-white border-2 border-black max-w-lg w-full p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col">
            <div className="flex items-center justify-between pb-3 mb-4 border-b-2 border-black">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-500">
                  Faculty Appointment
                </span>
                <h3 className="text-base font-bold uppercase tracking-tight">
                  Appoint Course Coordinator for Batch {appointingBatch.id}
                </h3>
              </div>
              <button
                onClick={() => setAppointingBatch(null)}
                className="w-7 h-7 border border-black flex items-center justify-center hover:bg-black hover:text-white font-mono text-xs font-bold transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAppointment} className="space-y-4">
              <div className="p-3 bg-neutral-100 border border-black text-xs font-mono">
                <div><strong>Batch:</strong> {appointingBatch.id} (Level-{appointingBatch.level} {appointingBatch.term})</div>
                <div><strong>Session:</strong> {appointingBatch.academicYear}</div>
                <div><strong>Current Coordinator:</strong> {appointingBatch.coordinatorName || 'None'}</div>
              </div>

              {/* Select Faculty Member */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1">
                  Select Faculty Member to Appoint:
                </label>
                <select
                  value={selectedTeacherId}
                  onChange={e => {
                    const tid = e.target.value;
                    setSelectedTeacherId(tid);
                    const t = teachers.find(item => item.id === tid);
                    if (t) {
                      const teacherUser = users.find(
                        u => u.teacherId === tid || u.name.toLowerCase().trim() === t.name.toLowerCase().trim()
                      );
                      if (teacherUser) {
                        setCoordinatorUsername(teacherUser.username);
                        setCoordinatorPassword('');
                      } else {
                        setCoordinatorUsername(t.initials.toLowerCase());
                        setCoordinatorPassword('cuet123');
                      }
                    }
                  }}
                  className="w-full text-xs font-mono p-2.5 border border-black outline-none bg-white focus:bg-neutral-50"
                  required
                >
                  {teachers
                    .filter(t => !t.isExternal)
                    .map(t => (
                      <option key={t.id} value={t.id}>
                        [{t.initials}] {t.name} — {t.designation}
                      </option>
                    ))}
                </select>
              </div>

              {/* Coordinator Login Credentials (Optional or Set) */}
              <div className="border-t border-neutral-300 pt-3">
                <div className="text-[11px] font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <UserIcon className="w-3.5 h-3.5" />
                  <span>Assign / Update Portal Login Account:</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-mono uppercase text-neutral-600 mb-0.5">
                      Username:
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. rashadur"
                      value={coordinatorUsername}
                      onChange={e => setCoordinatorUsername(e.target.value.toLowerCase())}
                      className="w-full text-xs font-mono p-2 border border-black outline-none focus:bg-neutral-50"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono uppercase text-neutral-600 mb-0.5">
                      Password:
                    </label>
                    <input
                      type="password"
                      placeholder="Enter password..."
                      value={coordinatorPassword}
                      onChange={e => setCoordinatorPassword(e.target.value)}
                      className="w-full text-xs font-mono p-2 border border-black outline-none focus:bg-neutral-50"
                    />
                  </div>
                </div>
                <span className="text-[10px] text-neutral-500 font-mono mt-1 block">
                  Enables this teacher to log in and manage the routine for Batch {appointingBatch.id}.
                </span>
              </div>

              <div className="pt-4 border-t border-black flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAppointingBatch(null)}
                  className="px-3 py-1.5 text-xs font-mono font-bold border border-black hover:bg-neutral-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAppointment}
                  className="px-4 py-1.5 text-xs font-bold uppercase border-2 border-black bg-black text-white hover:bg-neutral-800 transition-colors flex items-center gap-1.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>{isSubmittingAppointment ? 'Appointing...' : 'Confirm Appointment'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t-2 border-black bg-white py-3 px-6 text-center text-xs font-mono text-neutral-500 no-print">
        CUET CSE Routine Management System • Department Administration & Course Coordinator Governance
      </footer>
    </div>
  );
};

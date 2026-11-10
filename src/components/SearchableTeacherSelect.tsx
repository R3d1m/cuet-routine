import React, { useState, useMemo, useRef, useEffect } from 'react';
import { TeacherDesignation, Day, Period } from '../types';
import { useRoutine } from '../context/RoutineContext';
import { Search, Plus, X, UserCheck, AlertCircle } from 'lucide-react';

interface SearchableTeacherSelectProps {
  selectedTeacherIds: string[];
  onChange: (teacherIds: string[]) => void;
  day?: Day;
  periodStart?: Period;
  periodSpan?: number;
}

export const SearchableTeacherSelect: React.FC<SearchableTeacherSelectProps> = ({
  selectedTeacherIds,
  onChange,
  day,
  periodStart,
  periodSpan = 1
}) => {
  const { teachers, addTeacher, slots } = useRoutine();
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isAddingExternal, setIsAddingExternal] = useState(false);

  // New external instructor state
  const [extName, setExtName] = useState('');
  const [extDept, setExtDept] = useState('Mathematics');
  const [extDesignation, setExtDesignation] = useState<TeacherDesignation>('Assistant Professor');

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter teachers by name, initials, or designation
  const filteredTeachers = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return teachers;
    return teachers.filter(
      t =>
        t.name.toLowerCase().includes(term) ||
        t.initials.toLowerCase().includes(term) ||
        t.designation.toLowerCase().includes(term) ||
        t.department.toLowerCase().includes(term)
    );
  }, [teachers, searchTerm]);

  // Check if a teacher is busy at the given slot
  const isTeacherBusy = (teacherId: string): { busy: boolean; details?: string } => {
    if (!day || !periodStart) return { busy: false };
    const periods = Array.from({ length: periodSpan }, (_, i) => periodStart + i);
    const clash = slots.find(
      s =>
        s.day === day &&
        s.teacherIds.includes(teacherId) &&
        periods.some(p => p >= s.periodStart && p < s.periodStart + s.periodSpan)
    );
    if (clash) {
      return { busy: true, details: `Batch ${clash.batchId} (${clash.courseCode})` };
    }
    return { busy: false };
  };

  const handleToggle = (teacherId: string) => {
    if (selectedTeacherIds.includes(teacherId)) {
      onChange(selectedTeacherIds.filter(id => id !== teacherId));
    } else {
      onChange([...selectedTeacherIds, teacherId]);
    }
  };

  const handleAddExternal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!extName.trim()) return;

    const rankMap: Record<TeacherDesignation, number> = {
      'Professor': 1,
      'Associate Professor': 2,
      'Assistant Professor': 3,
      'Lecturer': 4,
      'External': 5
    };

    // Calculate simple initials
    const parts = extName.trim().split(' ');
    const initials = parts.map(p => p[0]).join('').toUpperCase().slice(0, 4);

    const created = await addTeacher({
      name: extName.trim(),
      designation: extDesignation,
      rank: rankMap[extDesignation] || 5,
      department: extDept,
      initials,
      isExternal: true
    });

    onChange([...selectedTeacherIds, created.id]);
    setExtName('');
    setIsAddingExternal(false);
    setIsOpen(false);
  };

  const getBadgeStyle = (rank: number, isExternal?: boolean) => {
    if (isExternal) {
      return 'bg-neutral-100 text-black border border-dashed border-black font-medium';
    }
    switch (rank) {
      case 1:
        return 'bg-black text-white font-semibold'; // Professor
      case 2:
        return 'bg-neutral-800 text-white font-medium'; // Assoc. Prof
      case 3:
        return 'bg-neutral-200 text-black font-medium border border-neutral-400'; // Asst. Prof
      case 4:
      default:
        return 'bg-white text-black font-normal border border-neutral-300'; // Lecturer
    }
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* Selected Teachers Pills */}
      <div className="flex flex-wrap gap-1.5 mb-2 min-h-[32px] p-1.5 border border-black bg-white">
        {selectedTeacherIds.length === 0 ? (
          <span className="text-xs text-neutral-500 py-0.5 px-1">No faculty assigned. Click below to select...</span>
        ) : (
          selectedTeacherIds.map(id => {
            const teacher = teachers.find(t => t.id === id);
            if (!teacher) return null;
            return (
              <span
                key={id}
                className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs bg-black text-white font-mono"
              >
                <span>{teacher.name} ({teacher.initials})</span>
                <button
                  type="button"
                  onClick={() => handleToggle(id)}
                  className="hover:opacity-75 focus:outline-none"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              </span>
            );
          })
        )}
      </div>

      {/* Trigger & Search Bar */}
      <div className="flex items-center border border-black px-2.5 py-1.5 bg-white">
        <Search className="w-4 h-4 text-neutral-500 mr-2 shrink-0" />
        <input
          type="text"
          placeholder="Search faculty by name, initials, or rank..."
          value={searchTerm}
          onFocus={() => setIsOpen(true)}
          onChange={e => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
          }}
          className="w-full text-xs outline-none bg-transparent placeholder-neutral-400"
        />
        <button
          type="button"
          onClick={() => setIsAddingExternal(!isAddingExternal)}
          className="ml-2 px-2 py-0.5 text-[11px] border border-black bg-white hover:bg-black hover:text-white transition-colors flex items-center gap-1 whitespace-nowrap"
        >
          <Plus className="w-3 h-3" />
          <span>+ Other Dept</span>
        </button>
      </div>

      {/* Quick Add External Instructor Form */}
      {isAddingExternal && (
        <div className="absolute z-50 left-0 right-0 mt-1 p-3 bg-white border-2 border-black shadow-lg">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-neutral-200">
            <span className="text-xs font-bold uppercase tracking-wider">Quick-Add Instructor (Other Department)</span>
            <button
              type="button"
              onClick={() => setIsAddingExternal(false)}
              className="text-neutral-500 hover:text-black"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <form onSubmit={handleAddExternal} className="space-y-2">
            <div>
              <label className="block text-[11px] font-medium text-neutral-700">Full Name & Title</label>
              <input
                type="text"
                required
                placeholder="e.g. Prof. Dr. Nusrat Jahan"
                value={extName}
                onChange={e => setExtName(e.target.value)}
                className="w-full text-xs p-1.5 border border-black mt-0.5"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-medium text-neutral-700">Department</label>
                <select
                  value={extDept}
                  onChange={e => setExtDept(e.target.value)}
                  className="w-full text-xs p-1.5 border border-black mt-0.5 bg-white"
                >
                  <option value="Physics">Physics</option>
                  <option value="Mathematics">Mathematics</option>
                  <option value="Humanities">Humanities</option>
                  <option value="EEE">EEE</option>
                  <option value="Mechanical">Mechanical</option>
                  <option value="Chemistry">Chemistry</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-neutral-700">Designation</label>
                <select
                  value={extDesignation}
                  onChange={e => setExtDesignation(e.target.value as TeacherDesignation)}
                  className="w-full text-xs p-1.5 border border-black mt-0.5 bg-white"
                >
                  <option value="Professor">Professor</option>
                  <option value="Associate Professor">Associate Professor</option>
                  <option value="Assistant Professor">Assistant Professor</option>
                  <option value="Lecturer">Lecturer</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAddingExternal(false)}
                className="px-2.5 py-1 text-xs border border-neutral-400 hover:bg-neutral-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1 text-xs bg-black text-white font-medium hover:bg-neutral-800"
              >
                Add & Assign
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Dropdown Options List */}
      {isOpen && !isAddingExternal && (
        <div className="absolute z-40 left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-white border border-black shadow-lg">
          <div className="p-1.5 bg-neutral-100 border-b border-neutral-200 text-[10px] uppercase font-bold tracking-wider text-neutral-600 flex justify-between">
            <span>Faculty Member ({filteredTeachers.length})</span>
            <span>Priority Rank</span>
          </div>

          {filteredTeachers.length === 0 ? (
            <div className="p-4 text-center text-xs text-neutral-500">
              No faculty found matching "{searchTerm}". Use "+ Other Dept" to add.
            </div>
          ) : (
            filteredTeachers.map(teacher => {
              const isSelected = selectedTeacherIds.includes(teacher.id);
              const busyInfo = isTeacherBusy(teacher.id);

              return (
                <div
                  key={teacher.id}
                  onClick={() => handleToggle(teacher.id)}
                  className={`flex items-center justify-between p-2 cursor-pointer border-b border-neutral-100 text-xs transition-colors ${
                    isSelected ? 'bg-neutral-100 font-medium' : 'hover:bg-neutral-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      readOnly
                      className="rounded-none border-black text-black focus:ring-0"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-black">{teacher.name}</span>
                        <span className="text-[10px] font-mono text-neutral-500">[{teacher.initials}]</span>
                      </div>
                      <div className="text-[11px] text-neutral-600 flex items-center gap-1.5 mt-0.5">
                        <span>{teacher.designation}</span>
                        <span>•</span>
                        <span className="font-mono">{teacher.department}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {busyInfo.busy ? (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] bg-red-100 text-red-800 border border-red-300">
                        <AlertCircle className="w-2.5 h-2.5" />
                        <span>Busy: {busyInfo.details}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] bg-neutral-100 text-neutral-700 border border-neutral-200">
                        <UserCheck className="w-2.5 h-2.5" />
                        <span>Free</span>
                      </span>
                    )}

                    <span className={`px-1.5 py-0.5 text-[10px] ${getBadgeStyle(teacher.rank, teacher.isExternal)}`}>
                      Rank {teacher.rank}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

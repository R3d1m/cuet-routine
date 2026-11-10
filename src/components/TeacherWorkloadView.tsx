import React, { useState, useMemo } from 'react';
import { useRoutine } from '../context/RoutineContext';
import { Day, Period } from '../types';
import { Users } from 'lucide-react';

export const TeacherWorkloadView: React.FC = () => {
  const { teachers, slots, rooms } = useRoutine();
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(teachers[0]?.id || '');

  const selectedTeacher = useMemo(() => {
    return teachers.find(t => t.id === selectedTeacherId);
  }, [teachers, selectedTeacherId]);

  const teacherSlots = useMemo(() => {
    return slots.filter(s => s.teacherIds.includes(selectedTeacherId));
  }, [slots, selectedTeacherId]);

  const days: Day[] = ['SUN', 'MON', 'TUE', 'WED', 'THU'];

  const getRoomName = (roomId: string) => {
    const r = rooms.find(rm => rm.id === roomId);
    return r ? r.shortName : roomId;
  };

  // Calculate total contact hours
  const totalContactPeriods = useMemo(() => {
    return teacherSlots.reduce((acc, s) => acc + s.periodSpan, 0);
  }, [teacherSlots]);

  return (
    <div className="max-w-7xl mx-auto my-6 p-6 bg-white border-2 border-black">
      <div className="flex flex-wrap items-center justify-between pb-4 mb-6 border-b-2 border-black gap-4">
        <div>
          <h2 className="text-lg font-bold uppercase tracking-tight text-black flex items-center gap-2">
            <Users className="w-5 h-5" />
            <span>Faculty Individual Teaching Schedule & Workload</span>
          </h2>
          <p className="text-xs text-neutral-600 font-mono mt-0.5">
            Inspect individual faculty commitments across all 5 undergraduate batches.
          </p>
        </div>

        {/* Teacher Selector */}
        <div className="flex items-center border border-black px-2.5 py-1 bg-white">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-600 mr-2">Select Faculty:</span>
          <select
            value={selectedTeacherId}
            onChange={e => setSelectedTeacherId(e.target.value)}
            className="text-xs font-bold bg-transparent outline-none cursor-pointer"
          >
            {teachers.map(t => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.designation}) — {t.department}
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedTeacher && (
        <div className="mb-6 p-4 border border-black bg-neutral-50 flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
          <div>
            <span className="font-bold text-sm text-black">{selectedTeacher.name}</span>
            <span className="ml-2 px-1.5 py-0.5 bg-black text-white text-[11px]">Rank {selectedTeacher.rank}</span>
            <div className="text-neutral-600 mt-1">
              {selectedTeacher.designation} • Department of {selectedTeacher.department}
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-lg font-bold text-black">{teacherSlots.length}</div>
              <div className="text-[10px] text-neutral-500 uppercase">Assigned Sessions</div>
            </div>
            <div className="text-center border-l border-neutral-300 pl-6">
              <div className="text-lg font-bold text-black">{totalContactPeriods}</div>
              <div className="text-[10px] text-neutral-500 uppercase">Weekly Contact Periods</div>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Matrix */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-center border-2 border-black">
          <thead>
            <tr className="bg-black text-white text-xs font-mono">
              <th className="p-2 border-r border-neutral-700 w-16">Day</th>
              {Array.from({ length: 9 }, (_, i) => i + 1).map(p => (
                <th key={p} className="p-2 border-r border-neutral-700">
                  P{p}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="text-xs font-mono">
            {days.map(day => {
              const daySlots = teacherSlots.filter(s => s.day === day);

              const cells: React.ReactNode[] = [];
              let p = 1;

              while (p <= 9) {
                const currentPeriod = p as Period;
                const slot = daySlots.find(
                  s => currentPeriod >= s.periodStart && currentPeriod < s.periodStart + s.periodSpan
                );

                if (slot) {
                  if (slot.periodStart === currentPeriod) {
                    const span = slot.periodSpan;
                    

                    cells.push(
                      <td
                        key={`t-slot-${slot.id}`}
                        colSpan={span}
                        className="p-1 border-r border-b border-black bg-neutral-100"
                      >
                        <div className="p-1.5 border border-black bg-white">
                          <div className="font-bold text-black">{slot.courseCode}</div>
                          <div className="text-[10px] text-neutral-600">
                            Batch {slot.batchId} (Sec {slot.section})
                          </div>
                          <div className="text-[10px] text-neutral-500 line-clamp-1">
                            {getRoomName(slot.roomId)}
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
                  cells.push(
                    <td key={`t-empty-${day}-${p}`} className="p-1 border-r border-b border-black text-neutral-300">
                      —
                    </td>
                  );
                  p++;
                }
              }

              return (
                <tr key={day} className="border-b border-black">
                  <td className="p-2 border-r border-black font-bold bg-neutral-50">{day}</td>
                  {cells}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

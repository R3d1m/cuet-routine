import React, { useState } from 'react';
import { useRoutine } from '../context/RoutineContext';
import { Day } from '../types';
import { Layers, CheckCircle2, Monitor, Info } from 'lucide-react';

export const LabOccupancyMatrix: React.FC = () => {
  const { rooms, slots, batches, teachers } = useRoutine();

  const labRooms = rooms.filter(r => r.roomType === 'inhouse_lab' || r.roomType === 'external_lab');
  const [selectedLabId, setSelectedLabId] = useState<string>(labRooms[0]?.id || 'lab-comp');

  const selectedLab = labRooms.find(r => r.id === selectedLabId) || labRooms[0];

  const days: Day[] = ['SUN', 'MON', 'TUE', 'WED', 'THU'];
  const dayNames: Record<Day, string> = {
    SUN: 'Sunday',
    MON: 'Monday',
    TUE: 'Tuesday',
    WED: 'Wednesday',
    THU: 'Thursday'
  };

  const blocks = [
    { id: 'block-morning', name: 'Morning Block', periods: [1, 2, 3], time: '08:10 – 10:30' },
    { id: 'block-midday', name: 'Mid-Day Block', periods: [4, 5, 6], time: '10:45 – 01:00' },
    { id: 'block-afternoon', name: 'Afternoon Block', periods: [7, 8, 9], time: '01:45 – 04:00' },
  ];

  // Helper to find slots in this specific lab on a specific day & block
  const getLabOccupants = (day: Day, blockPeriods: number[]) => {
    return slots.filter(
      s =>
        s.roomId === selectedLabId &&
        s.day === day &&
        blockPeriods.some(p => p >= s.periodStart && p < s.periodStart + s.periodSpan)
    );
  };

  // Calculate utilization stats for the selected lab
  const totalWeeklyBlocks = days.length * blocks.length; // 5 days * 3 blocks = 15 blocks
  let occupiedBlocks = 0;
  days.forEach(d => {
    blocks.forEach(b => {
      const occupants = getLabOccupants(d, b.periods);
      if (occupants.length > 0) occupiedBlocks++;
    });
  });
  const utilizationRate = Math.round((occupiedBlocks / totalWeeklyBlocks) * 100);

  return (
    <div className="max-w-7xl mx-auto my-6 p-6 bg-white border-2 border-black">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between pb-4 mb-6 border-b-2 border-black gap-4">
        <div>
          <h2 className="text-lg font-bold uppercase tracking-tight text-black flex items-center gap-2">
            <Layers className="w-5 h-5" />
            <span>Weekly Laboratory Allocation Schedule</span>
          </h2>
          <p className="text-xs text-neutral-600 font-mono mt-0.5">
            Select an individual laboratory to view its complete Sunday–Thursday schedule across all active academic batches.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 border border-black bg-neutral-50 text-right">
            <div className="text-[10px] uppercase font-mono text-neutral-500">Weekly Utilization</div>
            <div className="text-xs font-bold text-black font-mono">
              {occupiedBlocks} / {totalWeeklyBlocks} Blocks ({utilizationRate}%)
            </div>
          </div>
        </div>
      </div>

      {/* Lab Selector Dropdown */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <label className="text-xs font-bold uppercase tracking-wider text-black flex items-center gap-1.5 shrink-0">
          <Monitor className="w-4 h-4" />
          <span>Select Target Laboratory Facility:</span>
        </label>
        <div className="flex-1 min-w-[280px] max-w-xl">
          <select
            value={selectedLabId}
            onChange={e => setSelectedLabId(e.target.value)}
            className="w-full text-xs font-bold p-2.5 border-2 border-black bg-white font-mono cursor-pointer outline-none focus:bg-neutral-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
          >
            <optgroup label="CSE In-House Laboratories">
              {labRooms
                .filter(r => r.roomType === 'inhouse_lab')
                .map(lab => (
                  <option key={lab.id} value={lab.id}>
                    {lab.name} — {lab.building}, Floor {lab.floor} (Cap: {lab.capacity})
                  </option>
                ))}
            </optgroup>
            <optgroup label="External Departmental Laboratories">
              {labRooms
                .filter(r => r.roomType === 'external_lab')
                .map(lab => (
                  <option key={lab.id} value={lab.id}>
                    [EXTERNAL] {lab.name} — {lab.building} (Cap: {lab.capacity})
                  </option>
                ))}
            </optgroup>
          </select>
        </div>
      </div>

      {/* Selected Lab Details Bar */}
      <div className="bg-neutral-100 border border-black p-3 mb-4 flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
        <div className="flex items-center gap-3">
          <span className="font-bold uppercase text-black text-sm">{selectedLab.name}</span>
          <span className="text-neutral-500">|</span>
          <span className="text-neutral-700">{selectedLab.building}, Room {selectedLab.shortName}</span>
          <span className="text-neutral-500">|</span>
          <span className="text-neutral-700">Student Capacity: {selectedLab.capacity}</span>
        </div>
        <div className="text-[11px] text-neutral-600 flex items-center gap-1">
          <Info className="w-3.5 h-3.5" />
          <span>3-period contiguous sessional blocks (Periods 1-3, 4-6, 7-9)</span>
        </div>
      </div>

      {/* Weekly Schedule Table (Sunday to Thursday) */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left border-2 border-black">
          <thead>
            <tr className="bg-black text-white text-xs font-mono">
              <th className="p-3 border-r border-neutral-700 w-36 uppercase tracking-wider">Day</th>
              <th className="p-3 border-r border-neutral-700 w-1/3">
                <div className="font-bold">Block 1: Morning</div>
                <div className="text-[11px] text-neutral-300 font-normal">08:10 – 10:30 (Periods 1, 2, 3)</div>
              </th>
              <th className="p-3 border-r border-neutral-700 w-1/3">
                <div className="font-bold">Block 2: Mid-Day</div>
                <div className="text-[11px] text-neutral-300 font-normal">10:45 – 01:00 (Periods 4, 5, 6)</div>
              </th>
              <th className="p-3 w-1/3">
                <div className="font-bold">Block 3: Afternoon</div>
                <div className="text-[11px] text-neutral-300 font-normal">01:45 – 04:00 (Periods 7, 8, 9)</div>
              </th>
            </tr>
          </thead>
          <tbody className="text-xs">
            {days.map(day => (
              <tr key={day} className="border-b border-black hover:bg-neutral-50/50">
                {/* Day Cell */}
                <td className="p-3 border-r border-black font-bold bg-neutral-50 align-top">
                  <div className="text-black text-sm">{dayNames[day]}</div>
                  <div className="text-[11px] font-mono text-neutral-500">{day}</div>
                </td>

                {/* 3 Blocks */}
                {blocks.map(block => {
                  const occupants = getLabOccupants(day, block.periods);

                  return (
                    <td key={block.id} className="p-3 border-r border-black last:border-r-0 align-top">
                      {occupants.length === 0 ? (
                        <div className="h-full min-h-[70px] flex items-center justify-center p-2 border border-dashed border-neutral-300 bg-neutral-50/40 text-neutral-400 text-xs font-mono">
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-neutral-400" />
                          <span>AVAILABLE / FREE</span>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {occupants.map(slot => {
                            const batch = batches.find(b => b.id === slot.batchId);
                            const teacherObjs = slot.teacherIds.map(tid => teachers.find(t => t.id === tid)).filter(Boolean);
                            const isArchived = batch?.isArchived;

                            return (
                              <div
                                key={slot.id}
                                className={`p-2.5 border border-black ${
                                  isArchived ? 'bg-neutral-200 text-neutral-600' : 'bg-white'
                                } shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]`}
                              >
                                <div className="flex items-center justify-between mb-1 pb-1 border-b border-neutral-200">
                                  <span className="font-bold font-mono text-xs text-black">
                                    {slot.courseCode}
                                  </span>
                                  <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 bg-black text-white">
                                    Sec {slot.section} {slot.subGroup !== 'ALL' ? `(${slot.subGroup})` : ''}
                                  </span>
                                </div>

                                <div className="text-[11px] font-semibold text-black">
                                  Batch {slot.batchId} {batch ? `(L-${batch.level} T-${batch.term.replace('Term-', '')})` : ''}
                                </div>

                                {teacherObjs.length > 0 && (
                                  <div className="mt-1.5 text-[10px] font-mono text-neutral-700">
                                    <span className="text-neutral-500">Faculty: </span>
                                    {teacherObjs.map(t => t?.initials || t?.name).join(', ')}
                                  </div>
                                )}

                                {slot.note && (
                                  <div className="mt-1 text-[10px] text-neutral-500 italic">
                                    {slot.note}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer Notes */}
      <div className="mt-4 pt-3 border-t border-neutral-300 flex flex-wrap items-center justify-between text-[11px] text-neutral-600 font-mono">
        <div>
          * Sessional laboratories follow standardized 3-hour blocks to prevent period overlap.
        </div>
        <div>
          CUET Department of Computer Science & Engineering
        </div>
      </div>
    </div>
  );
};

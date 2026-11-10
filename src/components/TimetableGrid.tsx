import React, { useState } from 'react';
import { useRoutine } from '../context/RoutineContext';
import { useAuth } from '../context/AuthContext';
import { Day, Period, RoutineSlot, Section } from '../types';
import { SlotEditorModal } from './SlotEditorModal';
import { Plus, Edit2, AlertCircle, Lock, Printer } from 'lucide-react';
import { Link } from 'react-router-dom';

export const TimetableGrid: React.FC = () => {
  const { activeBatch, activeBatchSlots, rooms, teachers, checkConflicts } = useRoutine();
  const { canEditBatch, canEditSlot, openLoginModal } = useAuth();

  const isCoordinator = canEditBatch(activeBatch);

  const [activeSection, setActiveSection] = useState<Section | 'BOTH'>('BOTH');
  const [editingSlot, setEditingSlot] = useState<Partial<RoutineSlot> | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const days: Day[] = ['SUN', 'MON', 'TUE', 'WED', 'THU'];
  const dayLabels: Record<Day, string> = {
    SUN: 'SUN',
    MON: 'MON',
    TUE: 'TUE',
    WED: 'WED',
    THU: 'THU'
  };

  

  const getRoomName = (roomId: string) => {
    const r = rooms.find(rm => rm.id === roomId);
    return r ? r.shortName : roomId;
  };

  const getTeacherInitials = (tIds: string[]) => {
    return tIds
      .map(id => {
        const t = teachers.find(tch => tch.id === id);
        return t ? t.initials : id;
      })
      .join(', ');
  };

  const handleSlotClick = (slot: RoutineSlot) => {
    if (activeBatch.isArchived) return;
    // Teacher can view slot, but only coordinator or assigned teacher can edit
    if (!canEditSlot(slot, activeBatch)) {
      alert(`Read-Only: This class is scheduled in Batch ${activeBatch.id} (Coordinated by ${activeBatch.coordinatorName}). You do not have permission to edit this slot.`);
      return;
    }
    setEditingSlot(slot);
    setIsModalOpen(true);
  };

  const handleEmptyCellClick = (section: Section, day: Day, period: Period) => {
    if (activeBatch.isArchived) return;
    if (!isCoordinator) {
      alert(`Read-Only: Batch ${activeBatch.id} is coordinated by ${activeBatch.coordinatorName}. Only the designated course coordinator can add classes to this routine.`);
      return;
    }
    setEditingSlot({
      section,
      day,
      periodStart: period,
      periodSpan: [1, 4, 7].includes(period) ? 3 : 1
    });
    setIsModalOpen(true);
  };

  const renderSectionTable = (section: Section) => {
    const defaultRoomId = section === 'A' ? activeBatch.defaultRoomA : activeBatch.defaultRoomB;
    const defaultRoom = rooms.find(r => r.id === defaultRoomId);

    return (
      <div className="mb-8 border-2 border-black bg-white">
        {/* Section Header */}
        <div className="flex items-center justify-between bg-black text-white px-4 py-2">
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold tracking-wider uppercase">Section - {section}</span>
            <span className="text-xs font-mono text-neutral-300">
              [Default Room: {defaultRoom?.name || 'Classroom'}]
            </span>
          </div>
          {!activeBatch.isArchived && isCoordinator && (
            <button
              onClick={() => {
                setEditingSlot({ section, day: 'SUN', periodStart: 2 });
                setIsModalOpen(true);
              }}
              className="px-2 py-0.5 text-xs bg-white text-black font-semibold hover:bg-neutral-200 transition-colors flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />
              <span>Add Class / Lab</span>
            </button>
          )}
        </div>

        {/* Weekly Matrix Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-center">
            <thead>
              <tr className="bg-neutral-100 border-b border-black text-xs font-mono">
                <th className="border-r border-black p-1.5 w-16 font-bold">Day</th>
                <th className="border-r border-black p-1 font-bold">1<br/><span className="text-[10px] font-normal text-neutral-500">8:10-9:00</span></th>
                <th className="border-r border-black p-1 font-bold">2<br/><span className="text-[10px] font-normal text-neutral-500">9:00-9:45</span></th>
                <th className="border-r border-black p-1 font-bold">3<br/><span className="text-[10px] font-normal text-neutral-500">9:45-10:30</span></th>
                
                {/* Break Divider */}
                <th className="border-r border-black p-0.5 bg-neutral-200 text-[10px] font-bold w-6 uppercase tracking-tighter [writing-mode:vertical-lr] rotate-180">
                  Break
                </th>

                <th className="border-r border-black p-1 font-bold">4<br/><span className="text-[10px] font-normal text-neutral-500">10:45-11:30</span></th>
                <th className="border-r border-black p-1 font-bold">5<br/><span className="text-[10px] font-normal text-neutral-500">11:30-12:15</span></th>
                <th className="border-r border-black p-1 font-bold">6<br/><span className="text-[10px] font-normal text-neutral-500">12:15-1:00</span></th>

                {/* Lunch Divider */}
                <th className="border-r border-black p-0.5 bg-neutral-200 text-[10px] font-bold w-6 uppercase tracking-tighter [writing-mode:vertical-lr] rotate-180">
                  Lunch
                </th>

                <th className="border-r border-black p-1 font-bold">7<br/><span className="text-[10px] font-normal text-neutral-500">1:45-2:30</span></th>
                <th className="border-r border-black p-1 font-bold">8<br/><span className="text-[10px] font-normal text-neutral-500">2:30-3:15</span></th>
                <th className="p-1 font-bold">9<br/><span className="text-[10px] font-normal text-neutral-500">3:15-4:00</span></th>
              </tr>
            </thead>
            <tbody>
              {days.map(day => {
                const daySlots = activeBatchSlots.filter(
                  s => s.section === section && s.day === day
                );

                // Build cells covering periods 1 to 9
                const cells: React.ReactNode[] = [];
                let p = 1;

                while (p <= 9) {
                  // Add Break before Period 4
                  if (p === 4) {
                    cells.push(
                      <td key={`break-${day}`} className="border-r border-black bg-neutral-100 p-0 text-[10px] font-mono text-neutral-400">
                      </td>
                    );
                  }
                  // Add Lunch before Period 7
                  if (p === 7) {
                    cells.push(
                      <td key={`lunch-${day}`} className="border-r border-black bg-neutral-100 p-0 text-[10px] font-mono text-neutral-400">
                      </td>
                    );
                  }

                  const currentPeriod = p as Period;
                  const matchingSlot = daySlots.find(
                    s => currentPeriod >= s.periodStart && currentPeriod < s.periodStart + s.periodSpan
                  );

                  if (matchingSlot) {
                    // Only render on the starting period of the slot
                    if (matchingSlot.periodStart === currentPeriod) {
                      const span = matchingSlot.periodSpan;
                      const isLab = span === 3;
                      const report = checkConflicts(matchingSlot);

                      cells.push(
                        <td
                          key={`slot-${matchingSlot.id}`}
                          colSpan={span}
                          onClick={() => handleSlotClick(matchingSlot)}
                          className={`border-r border-b border-black p-1 cursor-pointer transition-all relative group ${
                            isLab ? 'bg-neutral-100 hover:bg-neutral-200' : 'bg-white hover:bg-neutral-50'
                          } ${report.hasConflict ? 'ring-2 ring-red-600 bg-red-50' : ''}`}
                        >
                          <div className="flex flex-col items-center justify-center min-h-[54px]">
                            <div className="flex items-center gap-1">
                              <span className="font-bold text-xs text-black font-mono">
                                {matchingSlot.courseCode}
                              </span>
                              {matchingSlot.subGroup !== 'ALL' && (
                                <span className="text-[10px] px-1 bg-black text-white font-mono">
                                  {matchingSlot.subGroup}
                                </span>
                              )}
                              {matchingSlot.isCT && (
                                <span className="text-[10px] font-bold text-black border border-black px-1">
                                  CT
                                </span>
                              )}
                            </div>

                            {/* Lab / Room Name */}
                            {isLab ? (
                              <div className="text-[11px] font-semibold text-neutral-800 line-clamp-1 mt-0.5">
                                {getRoomName(matchingSlot.roomId)}
                              </div>
                            ) : null}

                            {/* Teachers initials */}
                            <div className="text-[10px] font-mono text-neutral-600 mt-0.5">
                              {getTeacherInitials(matchingSlot.teacherIds)}
                            </div>

                            {/* Hover edit hint */}
                            <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Edit2 className="w-2.5 h-2.5 text-neutral-400" />
                            </div>

                            {report.hasConflict && (
                              <div className="absolute bottom-1 right-1" title={report.conflicts[0].message}>
                                <AlertCircle className="w-3 h-3 text-red-600" />
                              </div>
                            )}
                          </div>
                        </td>
                      );
                      p += span;
                      continue;
                    } else {
                      // Covered by earlier span
                      p++;
                      continue;
                    }
                  } else {
                    // Empty Cell
                    cells.push(
                      <td
                        key={`empty-${day}-${p}`}
                        onClick={() => handleEmptyCellClick(section, day, currentPeriod)}
                        className={`border-r border-b border-black p-1 ${
                          activeBatch.isArchived || !isCoordinator ? 'cursor-default' : 'hover:bg-neutral-100 cursor-pointer group'
                        } min-w-[72px]`}
                      >
                        <div className="h-[54px] flex items-center justify-center">
                          {!activeBatch.isArchived && isCoordinator && (
                            <Plus className="w-3 h-3 text-neutral-300 group-hover:text-black opacity-0 group-hover:opacity-100 transition-opacity" />
                          )}
                        </div>
                      </td>
                    );
                    p++;
                  }
                }

                return (
                  <tr key={day} className="border-b border-black">
                    <td className="border-r border-black p-2 font-bold text-xs bg-neutral-50 font-mono">
                      {dayLabels[day]}
                    </td>
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

  return (
    <div className="max-w-7xl mx-auto my-6 px-4">
      {/* Permanent Archival Banner */}
      {activeBatch.isArchived && (
        <div className="mb-4 p-4 bg-black text-white text-xs font-mono flex flex-wrap items-center justify-between gap-4 border-2 border-black">
          <div className="flex items-center gap-3">
            <Lock className="w-5 h-5 text-white shrink-0" />
            <div>
              <div className="font-bold text-sm uppercase">ROUTINE PERMANENTLY DEACTIVATED & ARCHIVED</div>
              <div className="text-neutral-300 text-[11px] mt-0.5">
                Preparatory Leave (PL / DL) commenced on {activeBatch.plDlDate || 'exam period'}. All classrooms and laboratories have been released. Routine is locked in read-only Official Format.
              </div>
            </div>
          </div>
          <Link
            to={`/batch/${activeBatch.id}/print`}
            className="px-3.5 py-1.5 bg-white text-black text-xs font-bold font-mono hover:bg-neutral-100 flex items-center gap-1.5 shrink-0"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>View Official Print Format</span>
          </Link>
        </div>
      )}

      {/* Non-Coordinator Read-Only Banner */}
      {!activeBatch.isArchived && !isCoordinator && (
        <div className="mb-4 p-3.5 bg-neutral-100 text-neutral-800 text-xs font-mono flex flex-wrap items-center justify-between gap-2 border-2 border-black">
          <div className="flex items-center gap-2.5">
            <Lock className="w-4 h-4 text-black shrink-0" />
            <div>
              <span className="font-bold uppercase text-black">READ-ONLY ACCESS:</span>
              <span> Coordinated by <strong>{activeBatch.coordinatorName}</strong>. You have full viewing and print access, but only the designated coordinator can modify this routine.</span>
            </div>
          </div>
          <button
            onClick={openLoginModal}
            className="px-2.5 py-1 bg-black text-white text-[11px] font-bold hover:bg-neutral-800 shrink-0 font-mono"
          >
            Switch User Profile
          </button>
        </div>
      )}

      {/* Exam Mode Banner */}
      {!activeBatch.isArchived && activeBatch.examMode.isEnabled && (
        <div className="mb-4 p-3 bg-black text-white text-xs font-mono flex flex-wrap items-center justify-between gap-2 border-2 border-black">
          <div className="flex items-center gap-2">
            <span className="px-1.5 py-0.5 bg-white text-black font-bold uppercase text-[10px]">Active</span>
            <span className="font-bold">TERM FINAL EXAM PERIOD ACTIVE:</span>
            <span>Regular semester classes are freed up. 5-week exams running on {activeBatch.examMode.examDay} from 1:00 PM to 4:00 PM.</span>
          </div>
          <div className="text-[11px] text-neutral-300">
            [Classrooms Booked 1PM–4PM • In-House Labs Free]
          </div>
        </div>
      )}

      {/* Controls Bar */}
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-neutral-300">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-black">
            Semester Class Routine (Weekly Schedule)
          </h2>
          <p className="text-xs text-neutral-600 font-mono">
            Click any cell to edit or place class / 3-period lab block.
          </p>
        </div>

        {/* Section View Switcher */}
        <div className="flex items-center border border-black bg-white">
          <button
            onClick={() => setActiveSection('BOTH')}
            className={`px-3 py-1 text-xs font-semibold ${
              activeSection === 'BOTH' ? 'bg-black text-white' : 'hover:bg-neutral-100'
            }`}
          >
            Both Sections
          </button>
          <button
            onClick={() => setActiveSection('A')}
            className={`px-3 py-1 text-xs font-semibold border-l border-black ${
              activeSection === 'A' ? 'bg-black text-white' : 'hover:bg-neutral-100'
            }`}
          >
            Section A
          </button>
          <button
            onClick={() => setActiveSection('B')}
            className={`px-3 py-1 text-xs font-semibold border-l border-black ${
              activeSection === 'B' ? 'bg-black text-white' : 'hover:bg-neutral-100'
            }`}
          >
            Section B
          </button>
        </div>
      </div>

      {/* Routine Tables */}
      {(activeSection === 'BOTH' || activeSection === 'A') && renderSectionTable('A')}
      {(activeSection === 'BOTH' || activeSection === 'B') && renderSectionTable('B')}

      {/* Slot Editor Modal */}
      {isModalOpen && (
        <SlotEditorModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          initialSlot={editingSlot || undefined}
        />
      )}
    </div>
  );
};

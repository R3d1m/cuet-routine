import React from 'react';
import { useRoutine } from '../context/RoutineContext';
import { Day, Period, Section } from '../types';
import { Printer, ArrowLeft } from 'lucide-react';

interface OfficialPrintLayoutProps {
  onBack?: () => void;
}

export const OfficialPrintLayout: React.FC<OfficialPrintLayoutProps> = ({ onBack }) => {
  const { activeBatch, activeBatchSlots, courses, teachers, rooms } = useRoutine();

  const days: Day[] = ['SUN', 'MON', 'TUE', 'WED', 'THU'];

  const getRoomName = (roomId: string) => {
    const r = rooms.find(rm => rm.id === roomId);
    return r ? r.shortName : roomId;
  };

  const getTeacherNames = (courseCode: string) => {
    const slotsForCourse = activeBatchSlots.filter(s => s.courseCode === courseCode || s.courseCode.startsWith(courseCode));
    const teacherIdSet = new Set<string>();
    slotsForCourse.forEach(s => s.teacherIds.forEach(id => teacherIdSet.add(id)));

    if (teacherIdSet.size === 0) return 'TBA';
    return Array.from(teacherIdSet)
      .map(id => teachers.find(t => t.id === id)?.name || id)
      .join('\n');
  };

  const renderSectionPrintTable = (section: Section) => {
    return (
      <div className="mb-4">
        <div className="text-center font-bold text-xs underline mb-1 uppercase">
          Section - {section}
        </div>
        <table className="w-full border-collapse border border-black text-[10px] text-center">
          <thead>
            <tr className="border-b border-black bg-neutral-50 font-bold">
              <th className="border-r border-black p-1 w-12">Period</th>
              <th className="border-r border-black p-0.5">1</th>
              <th className="border-r border-black p-0.5">2</th>
              <th className="border-r border-black p-0.5">3</th>
              <th className="border-r border-black p-0.5 w-4 font-normal text-[9px] [writing-mode:vertical-lr] rotate-180" rowSpan={6}>
                Break
              </th>
              <th className="border-r border-black p-0.5">4</th>
              <th className="border-r border-black p-0.5">5</th>
              <th className="border-r border-black p-0.5">6</th>
              <th className="border-r border-black p-0.5 w-4 font-normal text-[9px] [writing-mode:vertical-lr] rotate-180" rowSpan={6}>
                Lunch
              </th>
              <th className="border-r border-black p-0.5">7</th>
              <th className="border-r border-black p-0.5">8</th>
              <th className="p-0.5">9</th>
            </tr>
            <tr className="border-b border-black text-[9px] font-mono">
              <th className="border-r border-black p-0.5">Time</th>
              <th className="border-r border-black p-0.5 leading-tight">8:10<br/>to<br/>9:00</th>
              <th className="border-r border-black p-0.5 leading-tight">9:00<br/>to<br/>9:45</th>
              <th className="border-r border-black p-0.5 leading-tight">9:45<br/>to<br/>10:30</th>
              <th className="border-r border-black p-0.5 leading-tight">10:45<br/>to<br/>11:30</th>
              <th className="border-r border-black p-0.5 leading-tight">11:30<br/>to<br/>12:15</th>
              <th className="border-r border-black p-0.5 leading-tight">12:15<br/>to<br/>1:00</th>
              <th className="border-r border-black p-0.5 leading-tight">1:45<br/>to<br/>2:30</th>
              <th className="border-r border-black p-0.5 leading-tight">2:30<br/>to<br/>3:15</th>
              <th className="p-0.5 leading-tight">3:15<br/>to<br/>4:00</th>
            </tr>
          </thead>
          <tbody>
            {days.map(day => {
              const daySlots = activeBatchSlots.filter(s => s.section === section && s.day === day);
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
                        key={`print-slot-${slot.id}`}
                        colSpan={span}
                        className="border-r border-b border-black p-1 font-bold leading-tight align-middle"
                      >
                        <div>
                          {slot.note || slot.courseCode}
                          {slot.subGroup !== 'ALL' && ` (${slot.subGroup})`}
                          {slot.isCT && ' / CT'}
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
                  // Period 1 default CT slot check
                  cells.push(
                    <td key={`print-empty-${day}-${p}`} className="border-r border-b border-black p-1">
                      {p === 1 ? 'CT' : ''}
                    </td>
                  );
                  p++;
                }
              }

              return (
                <tr key={day} className="border-b border-black">
                  <td className="border-r border-black p-1 font-bold font-mono">{day}</td>
                  {cells[0]}
                  {cells[1]}
                  {cells[2]}
                  {cells[3]}
                  {cells[4]}
                  {cells[5]}
                  {cells[6]}
                  {cells[7]}
                  {cells[8]}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto my-6 bg-white p-8 border border-neutral-300 print:border-none print:p-0 print:m-0 font-sans text-black">
      {/* Top Action Bar (hidden in print) */}
      <div className="no-print flex items-center justify-between pb-4 mb-6 border-b border-neutral-300">
        <button
          onClick={onBack}
          className="px-3 py-1 text-xs border border-black hover:bg-neutral-100 flex items-center gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Editor</span>
        </button>

        <button
          onClick={() => window.print()}
          className="px-4 py-1.5 text-xs font-bold bg-black text-white hover:bg-neutral-800 transition-colors flex items-center gap-1.5"
        >
          <Printer className="w-4 h-4" />
          <span>Print / Export PDF</span>
        </button>
      </div>

      {/* Official Header */}
      <div className="text-center mb-4">
        <div className="w-12 h-12 mx-auto mb-1 border-2 border-black flex items-center justify-center font-bold text-xs tracking-tighter">
          CUET
        </div>
        <h1 className="text-sm font-bold uppercase tracking-tight">
          Department of Computer Science and Engineering
        </h1>
        <h2 className="text-xs font-bold uppercase tracking-wider">
          CHITTAGONG UNIVERSITY OF ENGINEERING & TECHNOLOGY
        </h2>
        <div className="mt-2 text-xs font-bold uppercase underline">
          CLASS ROUTINE Level-{activeBatch.level}, {activeBatch.term} (Batch: {activeBatch.id})
        </div>
        <div className="text-[11px] font-mono mt-0.5">
          Academic Year: {activeBatch.academicYear}
        </div>
        <div className="text-[10px] font-mono mt-0.5">
          Class Room: Sec-A ({getRoomName(activeBatch.defaultRoomA)}), Sec-B ({getRoomName(activeBatch.defaultRoomB)}) [Academic Building-3]
        </div>
        <div className="text-[10px] font-mono mt-0.5">
          Effective from: {activeBatch.commencementDate}
        </div>
      </div>

      {/* Section A Routine Table */}
      {renderSectionPrintTable('A')}

      {/* Section B Routine Table */}
      {renderSectionPrintTable('B')}

      {/* Course Summary Table */}
      <div className="mt-4 mb-4">
        <table className="w-full border-collapse border border-black text-[10px]">
          <thead>
            <tr className="border-b border-black bg-neutral-50 font-bold">
              <th className="border-r border-black p-1 w-20 text-center">Course No.</th>
              <th className="border-r border-black p-1 text-left">Course Title</th>
              <th className="border-r border-black p-1 w-14 text-center">Credit</th>
              <th className="p-1 text-left">Teacher's Name</th>
            </tr>
          </thead>
          <tbody>
            {courses.map(course => (
              <tr key={course.code} className="border-b border-black">
                <td className="border-r border-black p-1 text-center font-bold font-mono align-top">
                  {course.code}
                </td>
                <td className="border-r border-black p-1 align-top">
                  <div className="font-semibold">{course.title}</div>
                  {course.type === 'sessional' && course.defaultLabId && (
                    <div className="text-[9px] text-neutral-600 font-mono italic">
                      {rooms.find(r => r.id === course.defaultLabId)?.name || 'Lab'}
                    </div>
                  )}
                </td>
                <td className="border-r border-black p-1 text-center font-mono align-top">
                  {course.credit.toFixed(course.type === 'sessional' ? 2 : 1)}
                </td>
                <td className="p-1 whitespace-pre-line font-mono align-top text-[9.5px]">
                  {getTeacherNames(course.code)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Class Test Schedule Table */}
      <div className="mt-4 mb-6">
        <div className="text-center font-bold text-[10px] underline mb-1 uppercase">
          Class Test Schedule
        </div>
        <table className="w-full border-collapse border border-black text-[9px] text-center font-mono">
          <thead>
            <tr className="border-b border-black bg-neutral-50">
              <th className="border-r border-black p-0.5 w-24">Course No.</th>
              {Array.from({ length: 13 }, (_, i) => (
                <th key={i + 1} className="border-r border-black p-0.5">
                  {i + 1}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {courses.filter(c => c.type === 'theory').map(course => (
              <tr key={`ct-${course.code}`} className="border-b border-black">
                <td className="border-r border-black p-0.5 font-bold text-left pl-1">
                  {course.code}
                </td>
                <td className="border-r border-black p-0.5"></td>
                <td className="border-r border-black p-0.5"></td>
                <td className="border-r border-black p-0.5">MON</td>
                <td className="border-r border-black p-0.5"></td>
                <td className="border-r border-black p-0.5">MON</td>
                <td className="border-r border-black p-0.5"></td>
                <td className="border-r border-black p-0.5"></td>
                <td className="border-r border-black p-0.5">MON</td>
                <td className="border-r border-black p-0.5"></td>
                <td className="border-r border-black p-0.5">MON</td>
                <td className="border-r border-black p-0.5"></td>
                <td className="p-0.5"></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Official Signature & Circulation Footer */}
      <div className="pt-4 border-t border-black text-[9px] font-mono">
        <div className="flex justify-between items-end">
          <div>
            <div className="font-bold">Ref. No: CUET/CSE/</div>
            <div className="mt-1 font-bold">Copy forwarded for information, circulation and necessary action to:</div>
            <ol className="list-decimal list-inside space-y-0.5 mt-0.5 text-[8.5px]">
              <li>Dean, Faculty of Electrical & Computer Engineering.</li>
              <li>Registrar, CUET, Chittagong.</li>
              <li>All Head of the Department, CUET</li>
              <li>All Teachers Concerned, CUET</li>
              <li>Controller of Exam., CUET</li>
              <li>Deputy Registrar (Legal/Estate, Academic & Security), CUET</li>
              <li>PS to VC, CUET</li>
              <li>Notice Boards of Dept. of CSE, CUET</li>
              <li>Guard File</li>
            </ol>
          </div>

          <div className="text-center">
            <div className="border-t border-black pt-1 font-bold">
              ({activeBatch.coordinatorName})
            </div>
            <div>Course Coordinator</div>
            <div>({activeBatch.id} Batch) Dept. of CSE, CUET</div>
            <div className="mt-2 text-left">Date: ...........................</div>
          </div>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { useRoutine } from '../context/RoutineContext';
import { useAuth } from '../context/AuthContext';
import { Course } from '../types';
import { CheckCircle2, AlertCircle, Plus, Lock } from 'lucide-react';

interface CourseQuotaTrackerProps {
  onQuickAssign?: (course: Course) => void;
}

export const CourseQuotaTracker: React.FC<CourseQuotaTrackerProps> = ({ onQuickAssign }) => {
  const { courses, courseQuota, activeBatch, rooms } = useRoutine();
  const { canEditBatch } = useAuth();
  const isCoordinator = canEditBatch(activeBatch);

  const theoryCourses = courses.filter(c => c.type === 'theory');
  const sessionalCourses = courses.filter(c => c.type === 'sessional');

  const getLabName = (labId?: string) => {
    if (!labId) return 'Lab Room';
    const r = rooms.find(room => room.id === labId);
    return r ? r.shortName : labId;
  };

  return (
    <div className="bg-white p-6 border-2 border-black max-w-7xl mx-auto my-6">
      <div className="flex items-center justify-between pb-4 mb-6 border-b-2 border-black">
        <div>
          <h2 className="text-lg font-bold uppercase tracking-tight text-black">
            Course Credit to Weekly Class Allocation Tracker
          </h2>
          <p className="text-xs text-neutral-600 mt-0.5">
            Batch {activeBatch.id} ({activeBatch.academicYear}) • Level-{activeBatch.level} {activeBatch.term}
          </p>
        </div>
        <div className="text-right font-mono text-xs text-neutral-700">
          <div><span className="font-bold">Theory Rule:</span> 1.0 Credit = 1 Class / Week</div>
          <div><span className="font-bold">Sessional Rule:</span> 1.5 Credit = 3-Period Continuous Block</div>
        </div>
      </div>

      {/* Non-Coordinator Read-Only Notice */}
      {!isCoordinator && (
        <div className="mb-6 p-3 bg-neutral-100 border-2 border-black flex items-center gap-2 text-xs font-mono">
          <Lock className="w-4 h-4 text-black shrink-0" />
          <span><strong>READ-ONLY:</strong> Batch {activeBatch.id} is coordinated by <strong>{activeBatch.coordinatorName}</strong>. Quick course assignments are reserved for the designated coordinator.</span>
        </div>
      )}

      {/* Theory Courses Section */}
      <div className="mb-8">
        <h3 className="text-xs font-bold uppercase tracking-wider bg-black text-white px-2 py-1 mb-3 inline-block">
          Theory Courses ({theoryCourses.length})
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {theoryCourses.map(course => {
            const quota = courseQuota[course.code] || { scheduled: 0, required: course.credit, isComplete: false };
            const isFull = quota.scheduled >= quota.required;

            return (
              <div
                key={course.code}
                className={`p-3 border transition-all ${
                  isFull 
                    ? 'border-black bg-neutral-50' 
                    : 'border-neutral-400 bg-white'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-xs font-bold text-black bg-neutral-200 px-1.5 py-0.5">
                      {course.code}
                    </span>
                    <span className="ml-2 font-mono text-[11px] font-semibold text-neutral-700">
                      {course.credit.toFixed(1)} Credits
                    </span>
                  </div>
                  {isFull ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-black">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Fulfilled</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-neutral-600">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{quota.required - quota.scheduled} needed</span>
                    </span>
                  )}
                </div>

                <div className="mt-2 text-xs font-semibold text-neutral-900 line-clamp-1">
                  {course.title}
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-neutral-200 pt-2 text-xs">
                  <div className="font-mono">
                    <span className="font-bold text-black">{quota.scheduled}</span>
                    <span className="text-neutral-500"> / {quota.required} classes/wk</span>
                  </div>
                  {onQuickAssign && isCoordinator && !activeBatch.isArchived && (
                    <button
                      onClick={() => onQuickAssign(course)}
                      className="px-2 py-0.5 text-[11px] border border-black hover:bg-black hover:text-white transition-colors flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Assign</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sessional / Lab Courses Section */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider bg-black text-white px-2 py-1 mb-3 inline-block">
          Sessional / Laboratory Courses ({sessionalCourses.length})
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {sessionalCourses.map(course => {
            const quota = courseQuota[course.code] || { scheduled: 0, required: 2, isComplete: false };
            const isFull = quota.scheduled >= quota.required;

            return (
              <div
                key={course.code}
                className={`p-3 border transition-all ${
                  isFull 
                    ? 'border-black bg-neutral-50' 
                    : 'border-neutral-400 bg-white'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-xs font-bold text-black bg-neutral-200 px-1.5 py-0.5">
                      {course.code}
                    </span>
                    <span className="ml-2 font-mono text-[11px] font-semibold text-neutral-700">
                      {course.credit.toFixed(2)} Credits
                    </span>
                  </div>
                  {isFull ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-black">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Fulfilled</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-neutral-600">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{quota.required - quota.scheduled} needed</span>
                    </span>
                  )}
                </div>

                <div className="mt-2 text-xs font-semibold text-neutral-900 line-clamp-1">
                  {course.title}
                </div>

                <div className="mt-1.5 text-[11px] text-neutral-600 font-mono">
                  Default: <span className="font-bold text-black">{getLabName(course.defaultLabId)}</span>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-neutral-200 pt-2 text-xs">
                  <div className="font-mono">
                    <span className="font-bold text-black">{quota.scheduled}</span>
                    <span className="text-neutral-500"> / {quota.required} blocks (Sec A/B)</span>
                  </div>
                  {onQuickAssign && isCoordinator && !activeBatch.isArchived && (
                    <button
                      onClick={() => onQuickAssign(course)}
                      className="px-2 py-0.5 text-[11px] border border-black hover:bg-black hover:text-white transition-colors flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Assign</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

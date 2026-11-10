import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useParams, Navigate } from 'react-router-dom';
import { RoutineProvider, useRoutine } from './context/RoutineContext';
import { AuthProvider } from './context/AuthContext';
import { LoginModal } from './components/LoginModal';
import { LandingPortal } from './components/LandingPortal';
import { CreateRoutineWizard } from './components/CreateRoutineWizard';
import { Header, ViewTab } from './components/Header';
import { TimetableGrid } from './components/TimetableGrid';
import { CourseQuotaTracker } from './components/CourseQuotaTracker';
import { BatchLifecycleModal } from './components/BatchLifecycleModal';
import { LabOccupancyMatrix } from './components/LabOccupancyMatrix';
import { FacultyPreferenceManager } from './components/FacultyPreferenceManager';
import { OfficialPrintLayout } from './components/OfficialPrintLayout';
import { SlotEditorModal } from './components/SlotEditorModal';
import { AdminCoordinatorManager } from './components/AdminCoordinatorManager';
import { LoginPage } from './components/LoginPage';
import { Course } from './types';

// Sync batchId from URL param to RoutineContext state
const BatchParamSynchronizer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { batchId } = useParams<{ batchId: string }>();
  const { activeBatchId, setActiveBatchId, batches } = useRoutine();

  useEffect(() => {
    if (batchId && batchId !== activeBatchId) {
      const exists = batches.some(b => b.id === batchId);
      if (exists) {
        setActiveBatchId(batchId);
      }
    }
  }, [batchId, activeBatchId, batches, setActiveBatchId]);

  return <>{children}</>;
};

// Layout for all batch tabs (Timetable, Quota, Labs, Faculty, Lifecycle)
const BatchWorkspaceLayout: React.FC<{ tab: ViewTab }> = ({ tab }) => {
  const navigate = useNavigate();
  const { batchId } = useParams<{ batchId: string }>();
  const { activeBatch } = useRoutine();

  const [quickAssignCourse, setQuickAssignCourse] = useState<Course | undefined>(undefined);
  const [isSlotModalOpen, setIsSlotModalOpen] = useState<boolean>(false);

  const handleQuickAssign = (course: Course) => {
    if (activeBatch.isArchived) {
      alert('This batch routine is permanently archived (PL / DL commenced). Edits are disabled.');
      return;
    }
    setQuickAssignCourse(course);
    setIsSlotModalOpen(true);
  };

  return (
    <BatchParamSynchronizer>
      <div className="min-h-screen bg-white flex flex-col font-sans text-black">
        <Header currentTab={tab} />

        <main className="flex-1 pb-16">
          {tab === 'routine' && <TimetableGrid />}
          {tab === 'quota' && <CourseQuotaTracker onQuickAssign={handleQuickAssign} />}
          {tab === 'labs' && <LabOccupancyMatrix />}
          {tab === 'faculty' && <FacultyPreferenceManager />}
          {tab === 'lifecycle' && <BatchLifecycleModal />}
          {tab === 'print' && (
            <OfficialPrintLayout onBack={() => navigate(`/batch/${batchId || activeBatch.id}`)} />
          )}
        </main>

        {/* Quick Assign Slot Editor Modal */}
        {isSlotModalOpen && !activeBatch.isArchived && (
          <SlotEditorModal
            isOpen={isSlotModalOpen}
            onClose={() => {
              setIsSlotModalOpen(false);
              setQuickAssignCourse(undefined);
            }}
            preselectedCourse={quickAssignCourse}
          />
        )}
      </div>
    </BatchParamSynchronizer>
  );
};

// Landing Page Wrapper
const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <LandingPortal
      onOpenExisting={(batchId) => navigate(`/batch/${batchId}`)}
      onCreateNew={() => navigate('/create')}
    />
  );
};

// Wizard Page Wrapper
const WizardPage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-white font-sans text-black">
      <CreateRoutineWizard
        onCancel={() => navigate('/portal')}
        onFinished={(newBatchId) => navigate(`/batch/${newBatchId}`)}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <RoutineProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route path="/portal" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/create" element={<WizardPage />} />
            
            {/* Individual Sub-Routes for each view */}
            <Route path="/batch/:batchId" element={<BatchWorkspaceLayout tab="routine" />} />
            <Route path="/batch/:batchId/quota" element={<BatchWorkspaceLayout tab="quota" />} />
            <Route path="/batch/:batchId/labs" element={<BatchWorkspaceLayout tab="labs" />} />
            <Route path="/batch/:batchId/faculty" element={<BatchWorkspaceLayout tab="faculty" />} />
            <Route path="/batch/:batchId/lifecycle" element={<BatchWorkspaceLayout tab="lifecycle" />} />
            <Route path="/batch/:batchId/print" element={<BatchWorkspaceLayout tab="print" />} />

            {/* Catch-all fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <LoginModal />
          <AdminCoordinatorManager />
        </BrowserRouter>
      </AuthProvider>
    </RoutineProvider>
  );
};

export default App;

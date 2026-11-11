import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Batch, RoutineSlot } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  currentUser: User | null;
  isAdmin: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; user?: User; error?: string }>;
  logout: () => void;
  canEditBatch: (batch: Batch) => boolean;
  canEditSlot: (slot: RoutineSlot, batch: Batch) => boolean;
  isLoginModalOpen: boolean;
  openLoginModal: () => void;
  closeLoginModal: () => void;
  isAdminModalOpen: boolean;
  openAdminModal: () => void;
  closeAdminModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'cuet_routine_auth_user_session';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem(AUTH_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to parse saved auth session:', e);
    }
    return null;
  });

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }, [currentUser]);

  const login = async (username: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> => {
    try {
      const user = await api.loginUser(username, password);
      setCurrentUser(user);
      setIsLoginModalOpen(false);
      return { success: true, user };
    } catch (err: any) {
      console.error('Login error:', err);
      return { success: false, error: err.message || 'Invalid username or password' };
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  const isAdmin = currentUser?.role === 'admin';

  // Strict Permission Check:
  // 1. Degree completion locks batch for everyone.
  // 2. Admin can edit any active batch.
  // 3. Coordinator retains coordinator access for their assigned batch throughout the 4-year degree (PL/DL concluding a semester does not revoke access).
  const canEditBatch = (batch: Batch): boolean => {
    if (!currentUser) return false;
    if (batch.isDegreeCompleted) return false; // Locked only when 4-year degree completes

    if (currentUser.role === 'admin') return true;

    if (currentUser.role === 'coordinator') {
      if (currentUser.assignedBatchId && currentUser.assignedBatchId === batch.id) {
        return true;
      }
      // Also match coordinator name
      const coordNameClean = (batch.coordinatorName || '').trim().toLowerCase();
      const currentNameClean = (currentUser.name || '').trim().toLowerCase();
      if (coordNameClean && currentNameClean) {
        if (coordNameClean === currentNameClean) return true;
        if (coordNameClean.includes(currentNameClean) || currentNameClean.includes(coordNameClean)) return true;
      }
    }

    return false;
  };

  // Check if current user can edit a specific slot
  const canEditSlot = (slot: RoutineSlot, batch: Batch): boolean => {
    if (!currentUser) return false;
    if (batch.isArchived) return false;

    if (canEditBatch(batch)) return true;

    // Assigned course teacher can edit their own class slot
    if (currentUser.teacherId && slot.teacherIds.includes(currentUser.teacherId)) {
      return true;
    }

    return false;
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAdmin,
        login,
        logout,
        canEditBatch,
        canEditSlot,
        isLoginModalOpen,
        openLoginModal: () => setIsLoginModalOpen(true),
        closeLoginModal: () => setIsLoginModalOpen(false),
        isAdminModalOpen,
        openAdminModal: () => setIsAdminModalOpen(true),
        closeAdminModal: () => setIsAdminModalOpen(false)
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

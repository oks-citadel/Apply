import { create } from 'zustand';
import {
  AuthState,
  Resume,
  Application,
  UserStats,
  ExtensionSettings,
  MessageType,
} from '@shared/types';
import { sendToBackground } from '@shared/messaging';

interface ExtensionState {
  // Auth
  auth: AuthState;
  isLoading: boolean;
  error: string | null;

  // Resumes
  resumes: Resume[];
  activeResume: Resume | null;

  // Applications
  recentApplications: Application[];
  stats: UserStats | null;

  // Settings
  settings: ExtensionSettings | null;

  // UI State
  currentView: 'dashboard' | 'login' | 'settings' | 'resume-selector';

  // Actions
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;

  loadResumes: () => Promise<void>;
  selectResume: (resumeId: string) => Promise<void>;

  loadStats: () => Promise<void>;
  loadRecentApplications: () => Promise<void>;

  loadSettings: () => Promise<void>;
  updateSettings: (settings: Partial<ExtensionSettings>) => Promise<void>;

  setCurrentView: (view: 'dashboard' | 'login' | 'settings' | 'resume-selector') => void;
  setError: (error: string | null) => void;
}

export const useExtensionStore = create<ExtensionState>((set, get) => ({
  // Initial state
  auth: { isAuthenticated: false },
  isLoading: false,
  error: null,
  resumes: [],
  activeResume: null,
  recentApplications: [],
  stats: null,
  settings: null,
  currentView: 'dashboard',

  // Auth actions
  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const authState = await sendToBackground<
        { email: string; password: string },
        AuthState
      >(MessageType.LOGIN, { email, password });

      set({ auth: authState, currentView: 'dashboard', isLoading: false });

      // Load initial data
      await Promise.all([
        get().loadResumes(),
        get().loadStats(),
        get().loadRecentApplications(),
        get().loadSettings(),
      ]);
    } catch (error: any) {
      set({
        error: error.message || 'Login failed',
        isLoading: false,
      });
      throw error;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await sendToBackground(MessageType.LOGOUT);
      set({
        auth: { isAuthenticated: false },
        resumes: [],
        activeResume: null,
        recentApplications: [],
        stats: null,
        currentView: 'login',
        isLoading: false,
      });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  checkAuth: async () => {
    try {
      const authState = await sendToBackground<void, AuthState>(
        MessageType.CHECK_AUTH
      );

      set({ auth: authState });

      if (authState.isAuthenticated) {
        set({ currentView: 'dashboard' });
        // Load data in background
        Promise.all([
          get().loadResumes(),
          get().loadStats(),
          get().loadRecentApplications(),
          get().loadSettings(),
        ]);
      } else {
        set({ currentView: 'login' });
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      set({ auth: { isAuthenticated: false }, currentView: 'login' });
    }
  },

  // Resume actions
  loadResumes: async () => {
    try {
      const resumes = await sendToBackground<void, Resume[]>(
        MessageType.GET_RESUMES
      );

      const activeResume = await sendToBackground<void, Resume | null>(
        MessageType.GET_ACTIVE_RESUME
      );

      set({ resumes, activeResume });
    } catch (error: any) {
      console.error('Failed to load resumes:', error);
      set({ error: error.message });
    }
  },

  selectResume: async (resumeId: string) => {
    try {
      await sendToBackground(MessageType.SELECT_RESUME, { resumeId });

      const resume = get().resumes.find((r) => r.id === resumeId);
      if (resume) {
        set({ activeResume: resume });
      }
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  // Stats actions
  loadStats: async () => {
    try {
      const stats = await sendToBackground<void, UserStats>(
        MessageType.GET_STATS
      );
      set({ stats });
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  },

  loadRecentApplications: async () => {
    try {
      const applications = await sendToBackground<void, Application[]>(
        MessageType.GET_RECENT_APPLICATIONS
      );
      set({ recentApplications: applications });
    } catch (error) {
      console.error('Failed to load recent applications:', error);
    }
  },

  // Settings actions
  loadSettings: async () => {
    try {
      const settings = await sendToBackground<void, ExtensionSettings>(
        MessageType.GET_SETTINGS
      );
      set({ settings });
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  },

  updateSettings: async (newSettings: Partial<ExtensionSettings>) => {
    try {
      const settings = await sendToBackground<
        Partial<ExtensionSettings>,
        ExtensionSettings
      >(MessageType.UPDATE_SETTINGS, newSettings);
      set({ settings });
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  // UI actions
  setCurrentView: (view) => set({ currentView: view }),
  setError: (error) => set({ error }),
}));

/**
 * AppContext.js
 * ────────────────────────────────────────────────────────────────
 * Global application state using React Context + useReducer.
 *
 * Provides:
 *   - phoneme data (loaded from JSON)
 *   - word data
 *   - scope/sequence data
 *   - settings (teacher mode, blend speed, etc.)
 *   - progress helpers
 *   - audio engine access
 * ────────────────────────────────────────────────────────────────
 */
import { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import phonemesData from '@/data/phonemes.json';
import wordsData from '@/data/words.json';
import sequenceData from '@/data/scopeAndSequence.json';
import {
  getProgress,
  getSettings,
  recordTrial,
  completeModule,
  getLevelProgress,
  getWeakPhonemes,
  getOverallScore,
  getPhonemeHeatmap,
  resetProgress,
  downloadProgress,
} from '@/lib/progressTracker';
import { initAudio } from '@/lib/audioEngine';

// ── Initial state ─────────────────────────────────────────────────

const initialState = {
  // Data
  phonemes: phonemesData.phonemes,
  words: wordsData.words,
  minimalPairs: wordsData.minimalPairs,
  levels: sequenceData.levels,

  // Settings
  teacherMode: false,
  blendSpeed: 40,          // slider value 0–100
  lockedLevel: null,
  focusPhonemes: [],

  // UI state
  isLoaded: false,
  currentLevel: 1,
  feedback: null,          // { type: 'correct'|'incorrect'|'info', message, phonemeId }
};

// ── Reducer ───────────────────────────────────────────────────────

function reducer(state, action) {
  switch (action.type) {
    case 'INIT':
      return { ...state, ...action.payload, isLoaded: true };

    case 'SET_TEACHER_MODE':
      return { ...state, teacherMode: action.payload };

    case 'SET_BLEND_SPEED':
      return { ...state, blendSpeed: action.payload };

    case 'SET_LOCKED_LEVEL':
      return { ...state, lockedLevel: action.payload };

    case 'SET_FOCUS_PHONEMES':
      return { ...state, focusPhonemes: action.payload };

    case 'SET_CURRENT_LEVEL':
      return { ...state, currentLevel: action.payload };

    case 'SET_FEEDBACK':
      return { ...state, feedback: action.payload };

    case 'CLEAR_FEEDBACK':
      return { ...state, feedback: null };

    default:
      return state;
  }
}

// ── Context ───────────────────────────────────────────────────────

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Load settings and init audio on mount
  useEffect(() => {
    initAudio();
    const settings = getSettings();
    dispatch({
      type: 'INIT',
      payload: {
        teacherMode:   settings.teacherMode   ?? false,
        blendSpeed:    settings.blendSpeed    ?? 40,
        lockedLevel:   settings.lockedLevel   ?? null,
        focusPhonemes: settings.focusPhonemes ?? [],
      },
    });
  }, []);

  // ── Actions ─────────────────────────────────────────────────────

  const setTeacherMode = useCallback((on) => {
    dispatch({ type: 'SET_TEACHER_MODE', payload: on });
    getSettings({ teacherMode: on });
  }, []);

  const setBlendSpeed = useCallback((val) => {
    dispatch({ type: 'SET_BLEND_SPEED', payload: val });
    getSettings({ blendSpeed: val });
  }, []);

  const setLockedLevel = useCallback((level) => {
    dispatch({ type: 'SET_LOCKED_LEVEL', payload: level });
    getSettings({ lockedLevel: level });
  }, []);

  const setFocusPhonemes = useCallback((ids) => {
    dispatch({ type: 'SET_FOCUS_PHONEMES', payload: ids });
    getSettings({ focusPhonemes: ids });
  }, []);

  const showFeedback = useCallback((feedback) => {
    dispatch({ type: 'SET_FEEDBACK', payload: feedback });
    if (feedback?.autoClear !== false) {
      setTimeout(() => dispatch({ type: 'CLEAR_FEEDBACK' }), 3000);
    }
  }, []);

  const clearFeedback = useCallback(() => {
    dispatch({ type: 'CLEAR_FEEDBACK' });
  }, []);

  // ── Data helpers ─────────────────────────────────────────────────

  /**
   * Find a phoneme by ID.
   * @param {string} id
   */
  const getPhonemeById = useCallback((id) => {
    return state.phonemes.find(p => p.id === id) || null;
  }, [state.phonemes]);

  /**
   * Get all phonemes for a specific level.
   * @param {number} levelId
   */
  const getPhonemesForLevel = useCallback((levelId) => {
    const level = state.levels.find(l => l.id === levelId);
    if (!level) return [];
    return level.phonemeIds.map(id => state.phonemes.find(p => p.id === id)).filter(Boolean);
  }, [state.levels, state.phonemes]);

  /**
   * Get all CVC words for a specific level.
   * @param {number} levelId
   */
  const getWordsForLevel = useCallback((levelId) => {
    return state.words.filter(w => w.level === levelId);
  }, [state.words]);

  /**
   * Get minimal pairs for a level.
   * @param {number} levelId
   */
  const getMinimalPairsForLevel = useCallback((levelId) => {
    return state.minimalPairs.filter(mp => mp.level === levelId);
  }, [state.minimalPairs]);

  /**
   * Check whether a level is accessible to the student.
   * @param {number} levelId
   */
  const isLevelUnlocked = useCallback((levelId) => {
    if (state.teacherMode) return true;
    if (state.lockedLevel !== null && levelId > state.lockedLevel) return false;
    const prog = getLevelProgress(levelId);
    return prog.unlocked;
  }, [state.teacherMode, state.lockedLevel]);

  // ── Progress helpers (re-exported for convenience) ───────────────

  const value = {
    // State
    ...state,

    // Actions
    setTeacherMode,
    setBlendSpeed,
    setLockedLevel,
    setFocusPhonemes,
    showFeedback,
    clearFeedback,
    dispatch,

    // Data helpers
    getPhonemeById,
    getPhonemesForLevel,
    getWordsForLevel,
    getMinimalPairsForLevel,
    isLevelUnlocked,

    // Progress (from progressTracker)
    recordTrial,
    completeModule,
    getLevelProgress,
    getWeakPhonemes,
    getOverallScore,
    getPhonemeHeatmap,
    resetProgress,
    downloadProgress,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

/**
 * Hook to access the app context.
 */
export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}

export default AppContext;

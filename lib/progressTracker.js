/**
 * progressTracker.js
 * ────────────────────────────────────────────────────────────────
 * Manages student progress using localStorage.
 *
 * Data model:
 *   phonemeStats[phonemeId] = {
 *     attempts:      number,   // total attempts
 *     correct:       number,   // correct responses
 *     totalTimeMs:   number,   // cumulative response time (ms)
 *     lastAttempt:   ISO date, // most recent attempt timestamp
 *     errors: {
 *       vowelConfusion:    number,
 *       finalConsonantDrop: number,
 *       blendOmission:     number,
 *       other:             number
 *     }
 *   }
 *
 *   levelProgress[levelId] = {
 *     unlocked:   boolean,
 *     startedAt:  ISO date | null,
 *     modules: {
 *       [moduleId]: { completed: boolean, stars: 0–3 }
 *     }
 *   }
 *
 *   settings = {
 *     teacherMode:     boolean,
 *     lockedLevel:     number | null,   // max unlocked level
 *     focusPhonemes:   string[],        // teacher-selected subset
 *     blendSpeed:      number,          // slider default (0-100)
 *   }
 * ────────────────────────────────────────────────────────────────
 */

const STORAGE_KEY = 'soundbridge_progress_v1';

// ── Storage helpers ──────────────────────────────────────────────

function load() {
  if (typeof window === 'undefined') return getDefaultState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultState();
    return JSON.parse(raw);
  } catch {
    return getDefaultState();
  }
}

function save(state) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('progressTracker: could not save to localStorage', e);
  }
}

function getDefaultState() {
  return {
    phonemeStats:  {},
    levelProgress: {
      1: { unlocked: true,  startedAt: null, modules: {} },
      2: { unlocked: false, startedAt: null, modules: {} },
      3: { unlocked: false, startedAt: null, modules: {} },
      4: { unlocked: false, startedAt: null, modules: {} },
    },
    settings: {
      teacherMode:   false,
      lockedLevel:   null,
      focusPhonemes: [],
      blendSpeed:    40,
    },
    totalSessionCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function getDefaultPhonemeStats() {
  return {
    attempts:    0,
    correct:     0,
    totalTimeMs: 0,
    lastAttempt: null,
    errors: {
      vowelConfusion:     0,
      finalConsonantDrop: 0,
      blendOmission:      0,
      other:              0,
    },
  };
}

// ── Public API ───────────────────────────────────────────────────

/**
 * Returns the full progress state.
 */
export function getProgress() {
  return load();
}

/**
 * Records the result of a single phoneme trial.
 *
 * @param {string} phonemeId
 * @param {boolean} correct
 * @param {number} responseTimeMs
 * @param {string} [errorType] - 'vowelConfusion' | 'finalConsonantDrop' | 'blendOmission' | 'other'
 */
export function recordTrial(phonemeId, correct, responseTimeMs = 0, errorType = null) {
  const state = load();

  if (!state.phonemeStats[phonemeId]) {
    state.phonemeStats[phonemeId] = getDefaultPhonemeStats();
  }

  const stats = state.phonemeStats[phonemeId];
  stats.attempts    += 1;
  stats.correct     += correct ? 1 : 0;
  stats.totalTimeMs += responseTimeMs;
  stats.lastAttempt  = new Date().toISOString();

  if (!correct && errorType && stats.errors[errorType] !== undefined) {
    stats.errors[errorType] += 1;
  } else if (!correct) {
    stats.errors.other += 1;
  }

  state.updatedAt = new Date().toISOString();
  save(state);
}

/**
 * Returns accuracy (0–1) for a phoneme. Returns null if no data.
 *
 * @param {string} phonemeId
 * @returns {number|null}
 */
export function getPhonemeAccuracy(phonemeId) {
  const state = load();
  const stats = state.phonemeStats[phonemeId];
  if (!stats || stats.attempts === 0) return null;
  return stats.correct / stats.attempts;
}

/**
 * Returns mastery status for a phoneme:
 *   'mastered'  — ≥80% accuracy over ≥5 attempts
 *   'developing' — <80% accuracy but ≥3 attempts
 *   'weak'      — <60% accuracy over ≥3 attempts
 *   'new'       — <3 attempts
 *
 * @param {string} phonemeId
 * @returns {'mastered'|'developing'|'weak'|'new'}
 */
export function getPhonemeStatus(phonemeId) {
  const state = load();
  const stats = state.phonemeStats[phonemeId];
  if (!stats || stats.attempts < 3) return 'new';
  const acc = stats.correct / stats.attempts;
  if (acc >= 0.8) return 'mastered';
  if (acc >= 0.6) return 'developing';
  return 'weak';
}

/**
 * Returns an array of phoneme IDs where accuracy is below the
 * weakness threshold (< 0.7), sorted worst-first.
 *
 * @param {number} [threshold=0.7]
 * @returns {string[]}
 */
export function getWeakPhonemes(threshold = 0.7) {
  const state = load();
  return Object.entries(state.phonemeStats)
    .filter(([, stats]) => stats.attempts >= 3 && (stats.correct / stats.attempts) < threshold)
    .sort(([, a], [, b]) => (a.correct / a.attempts) - (b.correct / b.attempts))
    .map(([id]) => id);
}

/**
 * Marks a level module as completed with a star rating.
 *
 * @param {number} levelId
 * @param {string} moduleId
 * @param {number} stars - 1, 2, or 3
 */
export function completeModule(levelId, moduleId, stars) {
  const state = load();
  if (!state.levelProgress[levelId]) return;
  if (!state.levelProgress[levelId].modules) {
    state.levelProgress[levelId].modules = {};
  }

  const existing = state.levelProgress[levelId].modules[moduleId];
  // Only update if new star count is higher
  if (!existing || stars > existing.stars) {
    state.levelProgress[levelId].modules[moduleId] = {
      completed: true,
      stars,
      completedAt: new Date().toISOString(),
    };
  }

  // Unlock next level if all modules in this level have been completed
  const modulesInLevel = Object.values(state.levelProgress[levelId].modules);
  const allCompleted = modulesInLevel.length >= 3 &&
    modulesInLevel.every(m => m.completed);

  if (allCompleted && state.levelProgress[levelId + 1]) {
    state.levelProgress[levelId + 1].unlocked = true;
  }

  state.updatedAt = new Date().toISOString();
  save(state);
}

/**
 * Returns progress data for a specific level.
 *
 * @param {number} levelId
 * @returns {object}
 */
export function getLevelProgress(levelId) {
  const state = load();
  return state.levelProgress[levelId] || { unlocked: false, modules: {} };
}

/**
 * Returns the overall mastery score (0–100) based on all phoneme accuracy.
 *
 * @returns {number}
 */
export function getOverallScore() {
  const state = load();
  const entries = Object.values(state.phonemeStats).filter(s => s.attempts >= 2);
  if (entries.length === 0) return 0;
  const total = entries.reduce((sum, s) => sum + (s.correct / s.attempts), 0);
  return Math.round((total / entries.length) * 100);
}

/**
 * Returns a phoneme heatmap — array of { phonemeId, accuracy, status }.
 *
 * @returns {Array<{phonemeId: string, accuracy: number|null, status: string}>}
 */
export function getPhonemeHeatmap() {
  const state = load();
  return Object.entries(state.phonemeStats).map(([phonemeId, stats]) => ({
    phonemeId,
    accuracy: stats.attempts > 0 ? stats.correct / stats.attempts : null,
    status: getPhonemeStatus(phonemeId),
    attempts: stats.attempts,
    errors: stats.errors,
    avgResponseMs: stats.attempts > 0 ? Math.round(stats.totalTimeMs / stats.attempts) : null,
  }));
}

/**
 * Returns/updates app settings.
 *
 * @param {object} [updates] - Partial settings to merge
 * @returns {object} Current settings
 */
export function getSettings(updates) {
  const state = load();
  if (updates) {
    state.settings = { ...state.settings, ...updates };
    state.updatedAt = new Date().toISOString();
    save(state);
  }
  return state.settings;
}

/**
 * Resets all progress data (teacher action).
 */
export function resetProgress() {
  save(getDefaultState());
}

/**
 * Exports progress as a JSON string for teacher download.
 *
 * @returns {string} JSON
 */
export function exportProgress() {
  const state = load();
  const report = {
    exportedAt: new Date().toISOString(),
    overallScore: getOverallScore(),
    weakPhonemes: getWeakPhonemes(),
    phonemeHeatmap: getPhonemeHeatmap(),
    levelProgress: state.levelProgress,
    rawStats: state.phonemeStats,
  };
  return JSON.stringify(report, null, 2);
}

/**
 * Triggers a browser download of the progress JSON.
 */
export function downloadProgress() {
  const json = exportProgress();
  const blob = new Blob([json], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `soundbridge-progress-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

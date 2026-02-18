/**
 * TeacherPanel.jsx
 * ────────────────────────────────────────────────────────────────
 * Teacher control panel. Allows teachers to:
 * - View phoneme accuracy heatmap
 * - Select which phoneme set to focus on
 * - Lock/unlock levels
 * - Reset student progress
 * - Export/download progress report
 * - View error type breakdown
 * ────────────────────────────────────────────────────────────────
 */
import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import {
  getPhonemeHeatmap,
  getWeakPhonemes,
  getOverallScore,
  getLevelProgress,
  resetProgress,
  downloadProgress,
  getSettings,
} from '@/lib/progressTracker';
import ProgressBar from '@/components/ui/ProgressBar';

export default function TeacherPanel() {
  const {
    phonemes,
    levels,
    teacherMode,
    setTeacherMode,
    lockedLevel,
    setLockedLevel,
    focusPhonemes,
    setFocusPhonemes,
  } = useApp();

  const [heatmap, setHeatmap] = useState([]);
  const [overallScore, setOverallScore] = useState(0);
  const [weakPhonemes, setWeakPhonemes] = useState([]);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState('progress'); // 'progress' | 'settings' | 'sequence'

  useEffect(() => {
    refreshData();
  }, []);

  function refreshData() {
    setHeatmap(getPhonemeHeatmap());
    setOverallScore(getOverallScore());
    setWeakPhonemes(getWeakPhonemes());
  }

  const getPhoneme = (id) => phonemes.find(p => p.id === id);

  const handleReset = () => {
    if (!showResetConfirm) {
      setShowResetConfirm(true);
      return;
    }
    resetProgress();
    refreshData();
    setShowResetConfirm(false);
  };

  const toggleFocusPhoneme = (id) => {
    if (focusPhonemes.includes(id)) {
      setFocusPhonemes(focusPhonemes.filter(p => p !== id));
    } else {
      setFocusPhonemes([...focusPhonemes, id]);
    }
  };

  const statusColor = {
    mastered: 'bg-emerald-400 border-emerald-500',
    developing: 'bg-amber-400 border-amber-500',
    weak: 'bg-red-400 border-red-500',
    new: 'bg-slate-200 border-slate-300',
  };

  const statusText = {
    mastered: 'text-emerald-800',
    developing: 'text-amber-800',
    weak: 'text-red-800',
    new: 'text-slate-500',
  };

  if (!teacherMode) {
    return (
      <div className="text-center py-16 space-y-4">
        <div className="text-5xl">🔒</div>
        <p className="text-slate-600 font-medium">Teacher mode is off.</p>
        <button
          onClick={() => setTeacherMode(true)}
          className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold transition-colors"
        >
          Enable Teacher Mode
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <span className="text-3xl">👩‍🏫</span>
        <div>
          <h1 className="text-xl font-bold text-slate-800">Teacher Dashboard</h1>
          <p className="text-sm text-slate-500">Monitor progress and control scope</p>
        </div>
        <button
          onClick={() => setTeacherMode(false)}
          className="ml-auto px-3 py-1.5 text-xs bg-amber-100 border border-amber-300 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors"
        >
          Exit Teacher Mode
        </button>
      </div>

      {/* Overall score summary */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="text-3xl font-bold text-blue-600">{overallScore}%</div>
            <div className="text-sm text-slate-500">Overall Mastery</div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={refreshData}
              className="px-3 py-1.5 text-xs bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
            >
              🔄 Refresh
            </button>
            <button
              onClick={downloadProgress}
              className="px-3 py-1.5 text-xs bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
            >
              📥 Export
            </button>
          </div>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <StatCard
            value={heatmap.filter(h => h.status === 'mastered').length}
            label="Mastered"
            color="bg-emerald-50 border-emerald-200 text-emerald-700"
          />
          <StatCard
            value={heatmap.filter(h => h.status === 'developing').length}
            label="Developing"
            color="bg-amber-50 border-amber-200 text-amber-700"
          />
          <StatCard
            value={weakPhonemes.length}
            label="Weak"
            color="bg-red-50 border-red-200 text-red-700"
          />
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
        {['progress', 'settings', 'sequence'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold capitalize transition-all ${
              activeTab === tab
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab === 'progress' ? '📊 Progress' : tab === 'settings' ? '⚙️ Settings' : '📋 Sequence'}
          </button>
        ))}
      </div>

      {/* Progress tab */}
      {activeTab === 'progress' && (
        <div className="space-y-4">
          {/* Phoneme heatmap */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            <h3 className="font-semibold text-slate-700 mb-3 text-sm">Phoneme Accuracy Heatmap</h3>
            <div className="flex flex-wrap gap-2">
              {phonemes.map(ph => {
                const entry = heatmap.find(h => h.phonemeId === ph.id);
                const acc = entry?.accuracy;
                const status = entry?.status || 'new';
                const pct = acc !== null && acc !== undefined ? Math.round(acc * 100) : null;

                return (
                  <div
                    key={ph.id}
                    className={`flex flex-col items-center gap-0.5 p-2 rounded-xl border w-14 ${statusColor[status]}`}
                    title={`${ph.ipa}: ${pct !== null ? pct + '%' : 'not attempted'}\nAttempts: ${entry?.attempts || 0}`}
                  >
                    <div className="font-bold text-white text-sm">{ph.graphemes[0]}</div>
                    <div className="text-white text-xs font-mono opacity-90">{pct !== null ? `${pct}%` : '—'}</div>
                  </div>
                );
              })}
            </div>
            <div className="flex gap-3 mt-3 text-xs text-slate-400">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-400 inline-block" />Mastered ≥80%</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-400 inline-block" />Developing 60–79%</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-400 inline-block" />Weak &lt;60%</span>
            </div>
          </div>

          {/* Error type breakdown */}
          {heatmap.some(h => h.attempts > 0) && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
              <h3 className="font-semibold text-slate-700 mb-3 text-sm">Error Type Breakdown</h3>
              {['vowelConfusion', 'finalConsonantDrop', 'blendOmission', 'other'].map(errorType => {
                const total = heatmap.reduce((sum, h) => sum + (h.errors?.[errorType] || 0), 0);
                const label = {
                  vowelConfusion: '🔄 Vowel confusion',
                  finalConsonantDrop: '🔇 Final consonant drop',
                  blendOmission: '✂️ Blend omission',
                  other: '❓ Other errors',
                }[errorType];

                return (
                  <div key={errorType} className="flex items-center gap-3 mb-2">
                    <span className="text-sm text-slate-600 w-40">{label}</span>
                    <div className="flex-1">
                      <ProgressBar value={total} max={Math.max(10, total)} colorClass="bg-red-400" showPercent={false} />
                    </div>
                    <span className="text-sm font-bold text-slate-700 w-8 text-right">{total}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Per-phoneme detail */}
          {weakPhonemes.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
              <h3 className="font-semibold text-slate-700 mb-3 text-sm">⚠️ Phonemes Needing Attention</h3>
              <div className="space-y-2">
                {weakPhonemes.slice(0, 6).map(id => {
                  const ph = getPhoneme(id);
                  const entry = heatmap.find(h => h.phonemeId === id);
                  if (!ph || !entry) return null;
                  const acc = Math.round((entry.accuracy || 0) * 100);

                  return (
                    <div key={id} className="flex items-center gap-3 p-3 bg-red-50 border border-red-100 rounded-xl">
                      <div className="font-mono font-bold text-red-700 text-lg w-12 text-center">{ph.ipa}</div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-slate-700">"{ph.exampleWord}"</div>
                        {ph.spanishContrast?.commonError && (
                          <div className="text-xs text-slate-500">{ph.spanishContrast.commonError}</div>
                        )}
                        <ProgressBar value={acc} max={100} colorClass="bg-red-400" showPercent={false} />
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-red-600">{acc}%</div>
                        <div className="text-xs text-slate-400">{entry.attempts} tries</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Settings tab */}
      {activeTab === 'settings' && (
        <div className="space-y-4">
          {/* Level lock control */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            <h3 className="font-semibold text-slate-700 mb-3 text-sm">🔒 Level Access Control</h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setLockedLevel(null)}
                className={`py-3 rounded-xl border text-sm font-medium transition-all ${
                  lockedLevel === null
                    ? 'bg-blue-500 border-blue-600 text-white'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                All unlocked
              </button>
              {[1, 2, 3].map(l => (
                <button
                  key={l}
                  onClick={() => setLockedLevel(l)}
                  className={`py-3 rounded-xl border text-sm font-medium transition-all ${
                    lockedLevel === l
                      ? 'bg-amber-500 border-amber-600 text-white'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Lock at Level {l}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-3">
              Restrict student to the selected level and below.
              Teacher mode bypasses locks.
            </p>
          </div>

          {/* Focus phoneme selector */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            <h3 className="font-semibold text-slate-700 mb-1 text-sm">🎯 Phoneme Focus</h3>
            <p className="text-xs text-slate-400 mb-3">Select phonemes to emphasize (activities will prioritize these)</p>
            <div className="flex flex-wrap gap-2">
              {phonemes.slice(0, 20).map(ph => (
                <button
                  key={ph.id}
                  onClick={() => toggleFocusPhoneme(ph.id)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                    focusPhonemes.includes(ph.id)
                      ? 'bg-blue-500 border-blue-600 text-white'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-blue-50'
                  }`}
                >
                  {ph.ipa}
                </button>
              ))}
            </div>
            {focusPhonemes.length > 0 && (
              <div className="mt-3 flex items-center gap-2">
                <span className="text-xs text-slate-500">{focusPhonemes.length} selected</span>
                <button
                  onClick={() => setFocusPhonemes([])}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>

          {/* Reset progress */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            <h3 className="font-semibold text-slate-700 mb-3 text-sm">⚠️ Reset Progress</h3>
            {showResetConfirm ? (
              <div className="space-y-3">
                <p className="text-sm text-red-600 font-medium">
                  This will erase all student data. Are you sure?
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleReset}
                    className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-bold transition-colors"
                  >
                    Yes, reset all data
                  </button>
                  <button
                    onClick={() => setShowResetConfirm(false)}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={downloadProgress}
                  className="flex-1 py-2.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-xl text-sm font-medium hover:bg-blue-100 transition-colors"
                >
                  📥 Export First
                </button>
                <button
                  onClick={() => setShowResetConfirm(true)}
                  className="flex-1 py-2.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-medium hover:bg-red-100 transition-colors"
                >
                  🗑️ Reset Progress
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Scope/sequence tab */}
      {activeTab === 'sequence' && (
        <div className="space-y-3">
          {levels.map(level => (
            <div key={level.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">{level.icon}</span>
                <div>
                  <div className="font-bold text-slate-800">{level.name}: {level.subtitle}</div>
                  <div className="text-xs text-slate-500">{level.description}</div>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                  Phonemes in scope:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {level.phonemeIds.map(id => {
                    const ph = getPhoneme(id);
                    if (!ph) return null;
                    const entry = heatmap.find(h => h.phonemeId === id);
                    const status = entry?.status || 'new';
                    return (
                      <div
                        key={id}
                        className={`px-2.5 py-1 rounded-lg border text-xs font-bold ${
                          status === 'mastered' ? 'bg-emerald-100 border-emerald-300 text-emerald-800' :
                          status === 'developing' ? 'bg-amber-100 border-amber-300 text-amber-800' :
                          status === 'weak' ? 'bg-red-100 border-red-300 text-red-800' :
                          'bg-slate-100 border-slate-200 text-slate-600'
                        }`}
                      >
                        {ph.ipa} <span className="font-normal opacity-70">"{ph.graphemes[0]}"</span>
                      </div>
                    );
                  })}
                  {level.phonemeIds.length === 0 && (
                    <span className="text-xs text-slate-400 italic">Coming soon</span>
                  )}
                </div>
              </div>

              <div className="mt-3 space-y-1.5">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                  Activities:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(level.modules || []).map(m => (
                    <span key={m.id} className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600">
                      {m.icon} {m.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ value, label, color }) {
  return (
    <div className={`${color} border rounded-xl px-3 py-2.5 text-center`}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs font-medium">{label}</div>
    </div>
  );
}

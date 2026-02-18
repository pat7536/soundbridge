/**
 * Dashboard.jsx
 * ────────────────────────────────────────────────────────────────
 * Main student dashboard showing:
 * - Overall progress summary
 * - Level cards (unlocked / locked)
 * - Weak phoneme indicators
 * - Teacher mode shortcut
 * ────────────────────────────────────────────────────────────────
 */
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { getPhonemeHeatmap, getWeakPhonemes, getOverallScore, getLevelProgress } from '@/lib/progressTracker';
import { useEffect, useState } from 'react';
import ProgressBar from '@/components/ui/ProgressBar';

export default function Dashboard() {
  const { levels, phonemes, isLevelUnlocked, teacherMode } = useApp();
  const [overallScore, setOverallScore] = useState(0);
  const [weakPhonemes, setWeakPhonemes] = useState([]);
  const [heatmap, setHeatmap] = useState([]);

  useEffect(() => {
    setOverallScore(getOverallScore());
    setWeakPhonemes(getWeakPhonemes());
    setHeatmap(getPhonemeHeatmap());
  }, []);

  const getPhonemeById = (id) => phonemes.find(p => p.id === id);

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <div className="text-center py-4">
        <div className="text-4xl mb-2">🔤</div>
        <h1 className="text-2xl font-bold text-slate-800">SoundBridge</h1>
        <p className="text-slate-500 text-sm mt-1">
          Structured phonics for English learners
        </p>
      </div>

      {/* Overall progress card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-slate-700">Overall Mastery</h2>
          <span className="text-2xl font-bold text-blue-600">{overallScore}%</span>
        </div>
        <ProgressBar
          value={overallScore}
          max={100}
          colorClass={overallScore >= 80 ? 'bg-emerald-500' : overallScore >= 50 ? 'bg-blue-500' : 'bg-amber-500'}
          showPercent={false}
        />
        <p className="text-xs text-slate-400 mt-2">
          {overallScore === 0
            ? 'Start a level below to begin tracking progress!'
            : overallScore >= 80
            ? 'Excellent progress! Keep it up!'
            : overallScore >= 50
            ? 'Good progress — keep practicing!'
            : 'Building your phoneme foundation!'}
        </p>
      </div>

      {/* Weak phoneme warnings */}
      {weakPhonemes.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">⚠️</span>
            <h3 className="font-semibold text-amber-800 text-sm">Sounds to Practice More</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {weakPhonemes.slice(0, 8).map(id => {
              const ph = getPhonemeById(id);
              if (!ph) return null;
              return (
                <div
                  key={id}
                  className="bg-white border border-amber-200 rounded-lg px-3 py-1.5 flex items-center gap-1.5 text-sm"
                >
                  <span className="font-mono text-amber-700">{ph.ipa}</span>
                  <span className="text-slate-500 text-xs">as in "{ph.exampleWord}"</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Sound Compare shortcut */}
      <Link href="/sound-compare" className="block">
        <div className="bg-gradient-to-r from-orange-100 to-blue-100 border border-slate-200 rounded-2xl p-4 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="text-3xl">🇪🇸↔️🇺🇸</div>
          <div className="flex-1">
            <div className="font-bold text-slate-800">Sound Compare</div>
            <div className="text-sm text-slate-600">Spanish vs. English phoneme practice</div>
          </div>
          <div className="text-slate-400">→</div>
        </div>
      </Link>

      {/* Level cards */}
      <div>
        <h2 className="font-bold text-slate-700 mb-3 flex items-center gap-2">
          <span>📚</span> Levels
        </h2>
        <div className="space-y-3">
          {levels.map(level => {
            const unlocked = isLevelUnlocked(level.id);
            const prog = getLevelProgress(level.id);
            const completedModules = Object.values(prog.modules || {}).filter(m => m.completed).length;
            const totalModules = level.modules?.length || 0;

            return (
              <LevelCard
                key={level.id}
                level={level}
                unlocked={unlocked}
                completedModules={completedModules}
                totalModules={totalModules}
                teacherMode={teacherMode}
              />
            );
          })}
        </div>
      </div>

      {/* Phoneme heatmap (mini) */}
      {heatmap.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <h3 className="font-semibold text-slate-700 mb-3 text-sm">Phoneme Accuracy Map</h3>
          <div className="flex flex-wrap gap-1.5">
            {phonemes.map(ph => {
              const entry = heatmap.find(h => h.phonemeId === ph.id);
              const acc = entry?.accuracy;
              const color = acc === null ? 'bg-slate-100'
                : acc >= 0.8 ? 'bg-emerald-400'
                : acc >= 0.6 ? 'bg-amber-400'
                : 'bg-red-400';

              return (
                <div
                  key={ph.id}
                  className={`${color} rounded-md px-2 py-1 text-xs font-mono text-white font-bold`}
                  title={`${ph.ipa}: ${acc !== null ? Math.round(acc * 100) + '%' : 'not attempted'}`}
                >
                  {ph.graphemes[0]}
                </div>
              );
            })}
          </div>
          <div className="flex gap-3 mt-3 text-xs text-slate-400">
            <span><span className="inline-block w-3 h-3 rounded bg-emerald-400 mr-1" />Mastered</span>
            <span><span className="inline-block w-3 h-3 rounded bg-amber-400 mr-1" />Developing</span>
            <span><span className="inline-block w-3 h-3 rounded bg-red-400 mr-1" />Needs work</span>
            <span><span className="inline-block w-3 h-3 rounded bg-slate-100 mr-1 border" />Not tried</span>
          </div>
        </div>
      )}
    </div>
  );
}

function LevelCard({ level, unlocked, completedModules, totalModules, teacherMode }) {
  const pct = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;

  return (
    <div className={`relative rounded-2xl border-2 overflow-hidden transition-all ${
      unlocked
        ? 'border-slate-200 bg-white hover:shadow-md hover:border-blue-200'
        : 'border-slate-100 bg-slate-50 opacity-70'
    }`}>
      {/* Color accent bar */}
      <div className={`h-1.5 bg-gradient-to-r ${level.color}`} />

      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className={`text-3xl mt-0.5`}>{level.icon}</div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-0.5">
              <h3 className="font-bold text-slate-800">{level.name}</h3>
              {!unlocked && (
                <span className="text-xs bg-slate-200 text-slate-500 rounded-full px-2 py-0.5 font-medium">
                  🔒 Locked
                </span>
              )}
              {unlocked && completedModules === totalModules && totalModules > 0 && (
                <span className="text-xs bg-emerald-100 text-emerald-700 rounded-full px-2 py-0.5 font-medium">
                  ✅ Complete
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500 mb-1">{level.subtitle}</p>
            <p className="text-xs text-slate-400">{level.description}</p>

            {/* Module progress */}
            {unlocked && totalModules > 0 && (
              <div className="mt-3">
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>{completedModules}/{totalModules} activities</span>
                  <span>{pct}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full bg-gradient-to-r ${level.color} transition-all duration-500`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Arrow / action */}
          {unlocked ? (
            <Link
              href={`/level/${level.id}`}
              className="flex-shrink-0 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-bold transition-colors active:scale-95"
            >
              {completedModules > 0 ? 'Continue' : 'Start'}
            </Link>
          ) : (
            <div className="flex-shrink-0 text-2xl">🔒</div>
          )}
        </div>

        {/* Activity chips */}
        {unlocked && level.modules && (
          <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-slate-100">
            {level.modules.map(module => {
              // We'd check progress here
              return (
                <Link
                  key={module.id}
                  href={`/level/${level.id}/${module.id}`}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-colors"
                >
                  <span>{module.icon}</span>
                  <span>{module.name}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

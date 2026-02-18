/**
 * pages/level/[levelId].js — Level overview page
 * Shows all modules for a given level and allows student to choose one.
 */
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '@/components/Layout';
import { useApp } from '@/context/AppContext';
import { getLevelProgress } from '@/lib/progressTracker';
import { useEffect, useState } from 'react';

export default function LevelPage() {
  const router = useRouter();
  const { levelId } = router.query;
  const { levels, phonemes, isLevelUnlocked, getPhonemesForLevel, teacherMode } = useApp();

  const [levelProgress, setLevelProgress] = useState({ modules: {} });

  const levelNum = parseInt(levelId, 10);
  const level = levels.find(l => l.id === levelNum);

  useEffect(() => {
    if (levelNum) {
      setLevelProgress(getLevelProgress(levelNum));
    }
  }, [levelNum]);

  if (!level) {
    return (
      <Layout title="Level" showBack>
        <div className="text-center py-16 text-slate-400">Level not found.</div>
      </Layout>
    );
  }

  const unlocked = isLevelUnlocked(levelNum);

  if (!unlocked) {
    return (
      <Layout title={level.name} showBack>
        <div className="text-center py-16 space-y-4">
          <div className="text-6xl">🔒</div>
          <h2 className="text-xl font-bold text-slate-700">{level.name} is locked</h2>
          <p className="text-slate-500 text-sm max-w-xs mx-auto">
            Complete the previous level to unlock this one.
          </p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-600 transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      </Layout>
    );
  }

  const levelPhonemes = getPhonemesForLevel(levelNum);

  return (
    <Layout title={level.name} showBack>
      <div className="space-y-6">
        {/* Level header */}
        <div className={`bg-gradient-to-r ${level.color} rounded-2xl p-6 text-white`}>
          <div className="flex items-start gap-4">
            <div className="text-5xl">{level.icon}</div>
            <div>
              <h1 className="text-2xl font-bold">{level.name}</h1>
              <p className="text-white/80 font-medium">{level.subtitle}</p>
              <p className="text-white/70 text-sm mt-1">{level.description}</p>
            </div>
          </div>
        </div>

        {/* Phoneme inventory for this level */}
        {levelPhonemes.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            <h2 className="font-semibold text-slate-700 mb-3 text-sm">
              Sounds in this level ({levelPhonemes.length})
            </h2>
            <div className="flex flex-wrap gap-2">
              {levelPhonemes.map(ph => (
                <div
                  key={ph.id}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${ph.color || 'bg-slate-100 border-slate-200'}`}
                >
                  <span className="font-bold text-lg">{ph.graphemes[0]}</span>
                  <div>
                    <div className="font-mono text-xs">{ph.ipa}</div>
                    <div className="text-xs opacity-70">"{ph.exampleWord}"</div>
                  </div>
                  {ph.spanishContrast?.hasContrast && (
                    <span className="text-xs">🇪🇸↔️</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Activities */}
        <div>
          <h2 className="font-bold text-slate-700 mb-3">Activities</h2>
          <div className="space-y-3">
            {(level.modules || []).map((module, i) => {
              const modProg = levelProgress.modules?.[module.id];
              const completed = modProg?.completed;
              const stars = modProg?.stars || 0;

              return (
                <Link
                  key={module.id}
                  href={`/level/${levelId}/${module.id}`}
                  className={`block bg-white rounded-2xl border-2 p-4 hover:shadow-md transition-all active:scale-[0.99]
                    ${completed ? 'border-emerald-200' : 'border-slate-100 hover:border-blue-200'}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-xl ${module.color || 'bg-slate-100'} flex items-center justify-center text-2xl`}>
                      {module.icon}
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-slate-800 flex items-center gap-2">
                        {module.name}
                        {completed && (
                          <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
                            ✅ Done
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-500">{module.description}</p>
                      <p className="text-xs text-slate-400 mt-1">{module.instructions}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {/* Stars */}
                      <div className="flex gap-0.5">
                        {[1, 2, 3].map(s => (
                          <span key={s} className={s <= stars ? 'text-amber-400' : 'text-slate-200'}>
                            ★
                          </span>
                        ))}
                      </div>
                      <span className="text-slate-400 text-lg">→</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Spanish contrast callout */}
        {levelPhonemes.some(p => p.spanishContrast?.hasContrast) && (
          <Link href="/sound-compare" className="block">
            <div className="bg-gradient-to-r from-orange-50 to-blue-50 border border-slate-200 rounded-2xl p-4 flex items-center gap-3 hover:shadow-sm transition-shadow">
              <span className="text-3xl">🇪🇸↔️🇺🇸</span>
              <div>
                <div className="font-bold text-slate-700 text-sm">Spanish–English contrast available</div>
                <div className="text-xs text-slate-500">Some sounds in this level contrast with Spanish equivalents</div>
              </div>
              <span className="ml-auto text-slate-400">→</span>
            </div>
          </Link>
        )}
      </div>
    </Layout>
  );
}

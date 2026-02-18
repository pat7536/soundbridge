/**
 * pages/level/[levelId]/[moduleId].js — Activity page
 * Renders the appropriate activity component based on the module ID.
 */
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { useApp } from '@/context/AppContext';
import { completeModule } from '@/lib/progressTracker';
import SoundDrill from '@/components/activities/SoundDrill';
import TapTheSounds from '@/components/activities/TapTheSounds';
import BuildTheWord from '@/components/activities/BuildTheWord';
import MinimalPairs from '@/components/activities/MinimalPairs';
import BlendAndRead from '@/components/activities/BlendAndRead';
import { useState } from 'react';

// Map module IDs to activity components
const ACTIVITY_MAP = {
  'sound-drill':    SoundDrill,
  'tap-the-sounds': TapTheSounds,
  'build-the-word': BuildTheWord,
  'minimal-pairs':  MinimalPairs,
  'blend-and-read': BlendAndRead,
};

export default function ActivityPage() {
  const router = useRouter();
  const { levelId, moduleId } = router.query;
  const { levels, isLevelUnlocked } = useApp();

  const [completed, setCompleted] = useState(false);
  const [earnedStars, setEarnedStars] = useState(0);

  const levelNum = parseInt(levelId, 10);
  const level = levels.find(l => l.id === levelNum);
  const module = level?.modules?.find(m => m.id === moduleId);

  const ActivityComponent = ACTIVITY_MAP[moduleId];

  const handleComplete = (stars) => {
    const s = stars || 1;
    completeModule(levelNum, moduleId, s);
    setEarnedStars(s);
    setCompleted(true);
  };

  if (!level || !module) {
    return (
      <Layout title="Activity" showBack>
        <div className="text-center py-16 text-slate-400">Activity not found.</div>
      </Layout>
    );
  }

  if (!ActivityComponent) {
    return (
      <Layout title={module.name} showBack>
        <div className="text-center py-16 space-y-4">
          <div className="text-4xl">🚧</div>
          <p className="text-slate-500">This activity is coming soon!</p>
        </div>
      </Layout>
    );
  }

  if (completed) {
    return (
      <Layout title={module.name} showBack>
        <CompletionScreen
          stars={earnedStars}
          moduleName={module.name}
          levelId={levelNum}
          moduleId={moduleId}
          level={level}
          onContinue={() => router.push(`/level/${levelId}`)}
          onRetry={() => {
            setCompleted(false);
            setEarnedStars(0);
          }}
        />
      </Layout>
    );
  }

  return (
    <Layout title={module.name} showBack>
      <div className="max-w-lg mx-auto">
        {/* Activity header */}
        <div className="mb-4 flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl ${module.color || 'bg-slate-100'} flex items-center justify-center text-xl`}>
            {module.icon}
          </div>
          <div>
            <h1 className="font-bold text-slate-800">{module.name}</h1>
            <p className="text-xs text-slate-500">{level.name} — {level.subtitle}</p>
          </div>
        </div>

        {/* Activity */}
        <ActivityComponent
          levelId={levelNum}
          moduleId={moduleId}
          onComplete={handleComplete}
        />
      </div>
    </Layout>
  );
}

function CompletionScreen({ stars, moduleName, levelId, moduleId, level, onContinue, onRetry }) {
  const messages = {
    1: { emoji: '👏', text: 'Good effort! Keep practicing!', color: 'text-amber-600' },
    2: { emoji: '⭐⭐', text: 'Great work! Almost perfect!', color: 'text-blue-600' },
    3: { emoji: '🌟🌟🌟', text: 'Perfect! Outstanding work!', color: 'text-emerald-600' },
  }[stars] || { emoji: '✅', text: 'Activity complete!', color: 'text-slate-600' };

  // Find next module
  const modules = level.modules || [];
  const currentIdx = modules.findIndex(m => m.id === moduleId);
  const nextModule = modules[currentIdx + 1];

  return (
    <div className="flex flex-col items-center gap-6 py-8 text-center">
      {/* Celebration */}
      <div className="text-7xl animate-bounce">{messages.emoji}</div>
      <div>
        <h2 className="text-2xl font-bold text-slate-800 mb-1">{moduleName} Complete!</h2>
        <p className={`font-semibold ${messages.color}`}>{messages.text}</p>
      </div>

      {/* Stars */}
      <div className="flex gap-2 justify-center">
        {[1, 2, 3].map(s => (
          <span
            key={s}
            className={`text-5xl transition-all duration-300 ${s <= stars ? 'text-amber-400' : 'text-slate-200'}`}
          >
            ★
          </span>
        ))}
      </div>

      {/* Actions */}
      <div className="w-full max-w-xs space-y-3">
        {nextModule && (
          <a
            href={`/level/${levelId}/${nextModule.id}`}
            className="block w-full py-4 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-2xl text-lg transition-all active:scale-95 shadow-md"
          >
            {nextModule.icon} Next: {nextModule.name}
          </a>
        )}
        <button
          onClick={onContinue}
          className={`w-full py-3 ${nextModule ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-blue-500 text-white hover:bg-blue-600'} font-semibold rounded-xl transition-all active:scale-95`}
        >
          Back to Level
        </button>
        <button
          onClick={onRetry}
          className="w-full py-3 bg-white border-2 border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 transition-all active:scale-95"
        >
          🔄 Try Again
        </button>
      </div>
    </div>
  );
}

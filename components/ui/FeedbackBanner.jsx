/**
 * FeedbackBanner.jsx
 * Displays feedback after student responses.
 * Never just marks wrong — always explains what happened.
 */
import { useEffect } from 'react';
import { useApp } from '@/context/AppContext';

export default function FeedbackBanner() {
  const { feedback, clearFeedback } = useApp();

  useEffect(() => {
    if (feedback) {
      const t = setTimeout(clearFeedback, 3500);
      return () => clearTimeout(t);
    }
  }, [feedback, clearFeedback]);

  if (!feedback) return null;

  const config = {
    correct: {
      bg: 'bg-emerald-50 border-emerald-400',
      text: 'text-emerald-800',
      icon: '✅',
      label: 'Correct!',
    },
    incorrect: {
      bg: 'bg-red-50 border-red-300',
      text: 'text-red-800',
      icon: '🔄',
      label: 'Try again!',
    },
    info: {
      bg: 'bg-sky-50 border-sky-300',
      text: 'text-sky-800',
      icon: 'ℹ️',
      label: 'Listen:',
    },
    hint: {
      bg: 'bg-amber-50 border-amber-300',
      text: 'text-amber-800',
      icon: '💡',
      label: 'Hint:',
    },
  }[feedback.type] || {
    bg: 'bg-slate-50 border-slate-300',
    text: 'text-slate-800',
    icon: 'ℹ️',
    label: '',
  };

  return (
    <div
      className={`
        fixed bottom-24 left-1/2 -translate-x-1/2 z-50
        flex items-start gap-3 px-5 py-4 rounded-2xl border-2 shadow-lg
        max-w-sm w-[90%] animate-slide-up
        ${config.bg} ${config.text}
      `}
      role="status"
      aria-live="polite"
    >
      <span className="text-2xl flex-shrink-0 mt-0.5">{config.icon}</span>
      <div>
        <p className="font-semibold text-sm">{config.label}</p>
        {feedback.message && (
          <p className="text-sm mt-0.5 leading-snug">{feedback.message}</p>
        )}
        {feedback.tip && (
          <p className="text-xs mt-1 opacity-80 italic">{feedback.tip}</p>
        )}
      </div>
      <button
        onClick={clearFeedback}
        className="ml-auto flex-shrink-0 opacity-50 hover:opacity-100 text-lg"
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>
  );
}

/**
 * SoundDrill.jsx
 * ────────────────────────────────────────────────────────────────
 * Activity: Sound Drill
 * Student hears each phoneme in the level, practices repeating it,
 * and taps thumbs-up/down to self-assess. Teacher can hear and see
 * Spanish contrast info for each phoneme.
 * ────────────────────────────────────────────────────────────────
 */
import { useState, useCallback } from 'react';
import { playPhoneme } from '@/lib/audioEngine';
import { useApp } from '@/context/AppContext';
import AudioButton from '@/components/ui/AudioButton';
import ProgressBar from '@/components/ui/ProgressBar';

export default function SoundDrill({ levelId, onComplete }) {
  const { getPhonemesForLevel, getPhonemeById, teacherMode, recordTrial, showFeedback } = useApp();
  const phonemes = getPhonemesForLevel(levelId);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [sessionResults, setSessionResults] = useState([]);  // { phonemeId, selfRating }
  const [showContrast, setShowContrast] = useState(false);
  const [responded, setResponded] = useState(false);

  const current = phonemes[currentIndex];
  const isLast = currentIndex === phonemes.length - 1;
  const progress = ((currentIndex) / phonemes.length) * 100;

  const handlePlayPhoneme = useCallback(async () => {
    if (!current) return;
    await playPhoneme(current.id);
  }, [current]);

  const handlePlaySpanish = useCallback(async () => {
    if (!current?.spanishContrast) return;
    const spanishId = `spanish-${current.id.replace('short-', '')}`;
    await playPhoneme(spanishId).catch(() =>
      // Fallback: play with Spanish voice text
      playPhoneme(current.id)
    );
  }, [current]);

  const handleSelfRate = useCallback((rating) => {
    if (!current || responded) return;
    setResponded(true);

    const isCorrect = rating === 'got-it';
    recordTrial(current.id, isCorrect, 0, null);

    setSessionResults(prev => [...prev, { phonemeId: current.id, rating }]);

    if (rating !== 'got-it') {
      showFeedback({
        type: 'hint',
        message: `Listen again and try once more.`,
        tip: current.spanishContrast?.tip || '',
      });
    }
  }, [current, responded, recordTrial, showFeedback]);

  const handleNext = useCallback(() => {
    if (isLast) {
      const score = sessionResults.filter(r => r.rating === 'got-it').length;
      onComplete?.(Math.round((score / phonemes.length) * 3));
      return;
    }
    setCurrentIndex(i => i + 1);
    setResponded(false);
    setShowContrast(false);
  }, [isLast, sessionResults, phonemes.length, onComplete]);

  if (!current) return null;

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      {/* Progress */}
      <div className="w-full max-w-md">
        <ProgressBar
          value={currentIndex}
          max={phonemes.length}
          label={`Sound ${currentIndex + 1} of ${phonemes.length}`}
          colorClass="bg-sky-500"
        />
      </div>

      {/* Main phoneme display card */}
      <div className="bg-white rounded-3xl shadow-md border border-slate-100 p-8 w-full max-w-md text-center">
        {/* Grapheme display */}
        <div className="text-8xl font-bold text-slate-800 mb-2 leading-none">
          {current.graphemes[0]}
        </div>

        {/* IPA */}
        <div className="text-2xl font-mono text-slate-500 mb-1">{current.ipa}</div>

        {/* Name */}
        <div className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-6">
          {current.name}
        </div>

        {/* Example word */}
        <div className="text-sm text-slate-500 mb-6">
          as in <span className="font-bold text-slate-700 text-lg">&ldquo;{current.exampleWord}&rdquo;</span>
        </div>

        {/* Big play button */}
        <div className="flex justify-center mb-4">
          <AudioButton onPlay={handlePlayPhoneme} size="xl" label={`Hear ${current.ipa}`}>
            <span className="text-5xl">🔊</span>
          </AudioButton>
        </div>

        <p className="text-xs text-slate-400">Tap to hear the sound</p>
      </div>

      {/* Pronunciation tip */}
      {current.spanishContrast?.tip && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 w-full max-w-md">
          <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1">💡 Mouth tip</p>
          <p className="text-sm text-amber-800">{current.spanishContrast.tip}</p>
        </div>
      )}

      {/* Spanish contrast section (teacher mode or toggle) */}
      {current.spanishContrast?.hasContrast && (
        <div className="w-full max-w-md">
          <button
            onClick={() => setShowContrast(v => !v)}
            className="w-full flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 text-slate-600 text-sm font-medium hover:bg-slate-200 transition-colors"
          >
            <span>🇪🇸↔️🇺🇸</span>
            <span>{showContrast ? 'Hide' : 'Show'} Spanish comparison</span>
            <span className="ml-auto">{showContrast ? '▲' : '▼'}</span>
          </button>

          {showContrast && (
            <div className="mt-2 bg-sky-50 border border-sky-200 rounded-2xl p-4 space-y-3">
              <p className="text-xs font-semibold text-sky-700 uppercase tracking-wide">
                Spanish–English Contrast
              </p>
              <p className="text-sm text-sky-800">{current.spanishContrast.note}</p>
              {current.spanishContrast.commonError && (
                <p className="text-xs text-sky-600">
                  <strong>Common error:</strong> {current.spanishContrast.commonError}
                </p>
              )}
              {/* Play buttons comparison */}
              <div className="flex gap-3 justify-center pt-2">
                {current.spanishContrast.spanishSpeechText && (
                  <div className="flex flex-col items-center gap-1">
                    <AudioButton onPlay={handlePlaySpanish} size="sm" label="Play Spanish sound">
                      <span>🇪🇸</span>
                    </AudioButton>
                    <span className="text-xs text-slate-500">Spanish {current.spanishContrast.spanishEquivalent}</span>
                  </div>
                )}
                <div className="flex flex-col items-center gap-1">
                  <AudioButton onPlay={handlePlayPhoneme} size="sm" label="Play English sound">
                    <span>🇺🇸</span>
                  </AudioButton>
                  <span className="text-xs text-slate-500">English {current.ipa}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Self-assessment */}
      {!responded && (
        <div className="w-full max-w-md">
          <p className="text-center text-sm text-slate-500 mb-3">
            Listen and try to say the sound. How did you do?
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => handleSelfRate('got-it')}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-100 hover:bg-emerald-200 border-2 border-emerald-300 rounded-xl text-emerald-800 font-semibold transition-all active:scale-95"
            >
              <span className="text-xl">👍</span>
              <span>I got it!</span>
            </button>
            <button
              onClick={() => handleSelfRate('need-practice')}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-amber-50 hover:bg-amber-100 border-2 border-amber-200 rounded-xl text-amber-800 font-semibold transition-all active:scale-95"
            >
              <span className="text-xl">🔄</span>
              <span>Try again</span>
            </button>
          </div>
        </div>
      )}

      {/* Next button (shown after response) */}
      {responded && (
        <button
          onClick={handleNext}
          className="w-full max-w-md py-4 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-2xl text-lg transition-all active:scale-95 shadow-md"
        >
          {isLast ? '🎉 Finish Drill' : 'Next Sound →'}
        </button>
      )}

      {/* Session dots */}
      <div className="flex gap-2 flex-wrap justify-center">
        {phonemes.map((p, i) => {
          const result = sessionResults.find(r => r.phonemeId === p.id);
          return (
            <div
              key={p.id}
              className={`w-3 h-3 rounded-full transition-colors ${
                i < currentIndex
                  ? result?.rating === 'got-it' ? 'bg-emerald-400' : 'bg-amber-300'
                  : i === currentIndex
                  ? 'bg-blue-500 ring-2 ring-blue-200'
                  : 'bg-slate-200'
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}

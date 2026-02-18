/**
 * BlendAndRead.jsx
 * ────────────────────────────────────────────────────────────────
 * Activity: Blend and Read — Continuous Blending Slider
 * Student controls the blending speed with a slider.
 * Moving right = faster blending (more connected).
 * Moving left  = slower / more segmented.
 * Student blends the word then reads it aloud.
 * ────────────────────────────────────────────────────────────────
 */
import { useState, useCallback, useRef } from 'react';
import { blendPhonemes, playWord, sliderToGap, cancelBlending } from '@/lib/audioEngine';
import { useApp } from '@/context/AppContext';
import ProgressBar from '@/components/ui/ProgressBar';

export default function BlendAndRead({ levelId, onComplete }) {
  const { getWordsForLevel, getPhonemeById, blendSpeed: savedSpeed, setBlendSpeed, recordTrial, showFeedback } = useApp();

  const allWords = getWordsForLevel(levelId);
  const [words] = useState(() => shuffle(allWords).slice(0, Math.min(10, allWords.length)));

  const [currentIndex, setCurrentIndex] = useState(0);
  const [localSpeed, setLocalSpeed] = useState(savedSpeed);
  const [activePhoneme, setActivePhoneme] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasBlended, setHasBlended] = useState(false);
  const [selfRated, setSelfRated] = useState(null);
  const [scores, setScores] = useState([]);
  const startTimeRef = useRef(Date.now());

  const currentWord = words[currentIndex];
  const isLast = currentIndex === words.length - 1;

  const speedLabel = localSpeed < 25 ? 'Very Slow' : localSpeed < 50 ? 'Slow' : localSpeed < 75 ? 'Medium' : 'Fast';
  const speedEmoji = localSpeed < 25 ? '🐢' : localSpeed < 50 ? '🐌' : localSpeed < 75 ? '🚶' : '🏃';

  const handleSpeedChange = (e) => {
    const val = Number(e.target.value);
    setLocalSpeed(val);
    setBlendSpeed(val);
  };

  const handleBlend = useCallback(async () => {
    if (!currentWord || isPlaying) return;
    setIsPlaying(true);
    setActivePhoneme(null);

    await blendPhonemes(currentWord.phonemes, {
      gapMs: sliderToGap(localSpeed),
      onPhoneme: (i) => setActivePhoneme(i),
    });

    setActivePhoneme(null);

    // Play full word at the end
    await new Promise(r => setTimeout(r, 200));
    await playWord(currentWord.word);

    setIsPlaying(false);
    setHasBlended(true);
  }, [currentWord, isPlaying, localSpeed]);

  const handleStop = useCallback(() => {
    cancelBlending();
    setIsPlaying(false);
    setActivePhoneme(null);
  }, []);

  const handleSelfRate = useCallback((rating) => {
    if (!currentWord || selfRated) return;
    setSelfRated(rating);
    const correct = rating === 'read-it';
    const elapsed = Date.now() - startTimeRef.current;

    setScores(prev => [...prev, correct]);
    currentWord.phonemes.forEach(pid => recordTrial(pid, correct, elapsed));

    if (correct) {
      showFeedback({ type: 'correct', message: `Great reading! "${currentWord.word}" 📖` });
    } else {
      showFeedback({
        type: 'hint',
        message: 'Try slower — use the slider to reduce speed and hear each sound.',
      });
    }
  }, [currentWord, selfRated, recordTrial, showFeedback]);

  const handleNext = useCallback(() => {
    if (isLast) {
      const score = scores.filter(Boolean).length;
      const stars = score >= words.length * 0.8 ? 3 : score >= words.length * 0.5 ? 2 : 1;
      onComplete?.(stars);
      return;
    }
    setCurrentIndex(i => i + 1);
    setActivePhoneme(null);
    setIsPlaying(false);
    setHasBlended(false);
    setSelfRated(null);
    startTimeRef.current = Date.now();
  }, [isLast, scores, words.length, onComplete]);

  if (!currentWord) {
    return <div className="text-center py-12 text-slate-400">No words available.</div>;
  }

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      {/* Progress */}
      <div className="w-full max-w-md">
        <ProgressBar
          value={currentIndex}
          max={words.length}
          label={`Word ${currentIndex + 1} of ${words.length}`}
          colorClass="bg-green-500"
        />
      </div>

      {/* Speed slider */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 w-full max-w-md">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-slate-600">Blending Speed</span>
          <span className="text-sm font-bold text-slate-700">{speedEmoji} {speedLabel}</span>
        </div>

        {/* Slider */}
        <div className="relative">
          <div className="flex justify-between text-xs text-slate-400 mb-1">
            <span>🐢 Segmented</span>
            <span>Blended 🏃</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={localSpeed}
            onChange={handleSpeedChange}
            className="w-full h-3 rounded-full appearance-none cursor-pointer
              bg-gradient-to-r from-sky-200 via-blue-300 to-blue-500
              [&::-webkit-slider-thumb]:appearance-none
              [&::-webkit-slider-thumb]:w-7
              [&::-webkit-slider-thumb]:h-7
              [&::-webkit-slider-thumb]:rounded-full
              [&::-webkit-slider-thumb]:bg-blue-600
              [&::-webkit-slider-thumb]:shadow-md
              [&::-webkit-slider-thumb]:border-2
              [&::-webkit-slider-thumb]:border-white
              [&::-webkit-slider-thumb]:cursor-pointer
            "
            aria-label="Blending speed"
          />
          {/* Speed markers */}
          <div className="flex justify-between mt-1 px-1">
            {[0, 25, 50, 75, 100].map(v => (
              <div key={v} className={`w-0.5 h-2 rounded-full ${localSpeed >= v ? 'bg-blue-400' : 'bg-slate-200'}`} />
            ))}
          </div>
        </div>
      </div>

      {/* Word display with phoneme boxes */}
      <div className="bg-white rounded-3xl shadow-md border border-slate-100 p-8 w-full max-w-md">
        {/* Phoneme boxes (lit up during playback) */}
        <div className="flex justify-center gap-3 flex-wrap mb-6">
          {currentWord.phonemes.map((phonemeId, i) => {
            const phoneme = getPhonemeById(phonemeId);
            const isActive = activePhoneme === i;
            const grapheme = currentWord.graphemes[i] || '';

            return (
              <div
                key={i}
                className={`
                  w-20 h-20 rounded-2xl border-2 font-bold text-2xl
                  flex items-center justify-center
                  transition-all duration-150
                  ${isActive
                    ? 'bg-blue-500 border-blue-600 text-white scale-115 shadow-lg ring-4 ring-blue-200'
                    : `${phoneme?.color || 'bg-slate-100 border-slate-200'} text-slate-700`
                  }
                `}
              >
                {isActive && (
                  <span className="absolute animate-ping rounded-2xl bg-blue-300 opacity-30 inset-0" />
                )}
                <span className="relative z-10">{grapheme}</span>
              </div>
            );
          })}
        </div>

        {/* Hidden word (revealed after blending) */}
        <div className={`text-center transition-all duration-500 ${hasBlended ? 'opacity-100' : 'opacity-0'}`}>
          <div className="text-4xl font-bold text-slate-800">{currentWord.word}</div>
          <p className="text-xs text-slate-400 mt-1">Now try to read it!</p>
        </div>
      </div>

      {/* Blend button */}
      <button
        onClick={isPlaying ? handleStop : handleBlend}
        className={`
          w-full max-w-md py-5 rounded-2xl text-xl font-bold
          transition-all duration-200 active:scale-95 shadow-md
          ${isPlaying
            ? 'bg-red-100 border-2 border-red-300 text-red-700 hover:bg-red-200'
            : 'bg-green-500 hover:bg-green-600 text-white'
          }
        `}
      >
        {isPlaying ? '⏹ Stop' : hasBlended ? '🔄 Blend Again' : '▶ Blend It!'}
      </button>

      {/* Self-assessment (after first blend) */}
      {hasBlended && !selfRated && (
        <div className="w-full max-w-md space-y-3">
          <p className="text-center text-sm text-slate-500 font-medium">
            Can you read the word aloud?
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => handleSelfRate('read-it')}
              className="flex-1 py-3 bg-emerald-100 hover:bg-emerald-200 border-2 border-emerald-300 rounded-xl text-emerald-800 font-semibold text-sm transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <span className="text-xl">📖</span>
              <span>I read it!</span>
            </button>
            <button
              onClick={() => handleSelfRate('not-yet')}
              className="flex-1 py-3 bg-amber-50 hover:bg-amber-100 border-2 border-amber-200 rounded-xl text-amber-800 font-semibold text-sm transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <span className="text-xl">🔄</span>
              <span>Need slower</span>
            </button>
          </div>
          <p className="text-center text-xs text-slate-400">
            Tip: Move slider left to hear sounds more separately
          </p>
        </div>
      )}

      {/* Next button */}
      {selfRated && (
        <button
          onClick={handleNext}
          className="w-full max-w-md py-4 bg-green-500 hover:bg-green-600 text-white font-bold rounded-2xl text-lg transition-all active:scale-95 shadow-md"
        >
          {isLast ? '🎉 Finish Activity' : 'Next Word →'}
        </button>
      )}
    </div>
  );
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * TapTheSounds.jsx
 * ────────────────────────────────────────────────────────────────
 * Activity: Tap the Sounds
 * A word is shown as blank phoneme boxes. Student taps each box
 * to hear the isolated phoneme. Then taps a "Blend" button to
 * hear the full word blended.
 * ────────────────────────────────────────────────────────────────
 */
import { useState, useCallback, useRef } from 'react';
import { playPhoneme, playWord, blendPhonemes, sliderToGap, unlockSpeech } from '@/lib/audioEngine';
import { useApp } from '@/context/AppContext';
import ProgressBar from '@/components/ui/ProgressBar';
import AudioButton from '@/components/ui/AudioButton';

export default function TapTheSounds({ levelId, onComplete }) {
  const { getWordsForLevel, getPhonemeById, blendSpeed, recordTrial, showFeedback } = useApp();

  const allWords = getWordsForLevel(levelId);
  // Use a shuffled subset of 8 words
  const [words] = useState(() => shuffle(allWords).slice(0, Math.min(8, allWords.length)));

  const [currentIndex, setCurrentIndex] = useState(0);
  const [tappedBoxes, setTappedBoxes] = useState(new Set());  // which boxes have been tapped
  const [activeBox, setActiveBox] = useState(null);           // currently playing box index
  const [phase, setPhase] = useState('tap');                  // 'tap' | 'blend' | 'done'
  const [scores, setScores] = useState([]);
  const startTimeRef = useRef(Date.now());

  const currentWord = words[currentIndex];
  const isLast = currentIndex === words.length - 1;

  const handleBoxTap = useCallback(async (boxIndex, phonemeId) => {
    if (activeBox !== null) return;  // already playing
    setActiveBox(boxIndex);
    setTappedBoxes(prev => new Set([...prev, boxIndex]));
    await playPhoneme(phonemeId);
    setActiveBox(null);

    // Once all boxes tapped, enable blend phase
    const newTapped = new Set([...tappedBoxes, boxIndex]);
    if (newTapped.size === currentWord.phonemes.length) {
      setPhase('blend');
    }
  }, [activeBox, tappedBoxes, currentWord?.phonemes?.length]);

  const handleBlend = useCallback(async () => {
    if (!currentWord) return;
    unlockSpeech(); // iOS: must call speechSynthesis synchronously within user gesture
    setPhase('blending');

    // Play segmented then blended
    await blendPhonemes(currentWord.phonemes, {
      gapMs: sliderToGap(blendSpeed),
      onPhoneme: (i) => setActiveBox(i),
    });
    setActiveBox(null);

    // Short pause then full word
    await new Promise(r => setTimeout(r, 300));
    await playWord(currentWord.word);
    setPhase('done');

    const elapsed = Date.now() - startTimeRef.current;
    setScores(prev => [...prev, true]);
    currentWord.phonemes.forEach(pid => recordTrial(pid, true, elapsed));
    showFeedback({ type: 'correct', message: `${currentWord.word} — excellent blending! 🎉` });
  }, [currentWord, blendSpeed, recordTrial, showFeedback]);

  const handleNext = useCallback(() => {
    if (isLast) {
      const stars = scores.filter(Boolean).length >= words.length * 0.8 ? 3
        : scores.filter(Boolean).length >= words.length * 0.5 ? 2 : 1;
      onComplete?.(stars);
      return;
    }
    setCurrentIndex(i => i + 1);
    setTappedBoxes(new Set());
    setActiveBox(null);
    setPhase('tap');
    startTimeRef.current = Date.now();
  }, [isLast, scores, words.length, onComplete]);

  if (!currentWord) {
    return (
      <div className="text-center py-12 text-slate-400">
        <p className="text-lg">No words available for this level yet.</p>
      </div>
    );
  }

  const allTapped = tappedBoxes.size >= currentWord.phonemes.length;

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      {/* Progress */}
      <div className="w-full max-w-md">
        <ProgressBar
          value={currentIndex}
          max={words.length}
          label={`Word ${currentIndex + 1} of ${words.length}`}
          colorClass="bg-teal-500"
        />
      </div>

      {/* Instruction */}
      <div className="bg-teal-50 border border-teal-200 rounded-2xl px-5 py-3 text-center w-full max-w-md">
        <p className="text-sm text-teal-800 font-medium">
          {phase === 'tap'
            ? '👆 Tap each box to hear the sound'
            : phase === 'blend' || phase === 'blending'
            ? '🔄 Now tap BLEND to hear the word!'
            : '✅ Great! Tap next word to continue'}
        </p>
      </div>

      {/* Word display card */}
      <div className="bg-white rounded-3xl shadow-md border border-slate-100 p-8 w-full max-w-md">
        {/* Written word (shown faded) */}
        <div className="text-center text-3xl font-bold text-slate-200 mb-6 tracking-widest uppercase">
          {currentWord.word}
        </div>

        {/* Phoneme boxes */}
        <div className="flex justify-center gap-3 flex-wrap">
          {currentWord.phonemes.map((phonemeId, i) => {
            const phoneme = getPhonemeById(phonemeId);
            const isTapped = tappedBoxes.has(i);
            const isActive = activeBox === i;
            const grapheme = currentWord.graphemes[i] || '';

            return (
              <button
                key={i}
                onClick={() => handleBoxTap(i, phonemeId)}
                disabled={activeBox !== null}
                className={`
                  relative w-20 h-20 rounded-2xl border-3 font-bold text-xl
                  transition-all duration-200 active:scale-90 select-none
                  ${isActive
                    ? 'bg-blue-500 border-blue-600 text-white scale-110 shadow-lg ring-4 ring-blue-200'
                    : isTapped
                    ? `${phoneme?.color || 'bg-slate-100 border-slate-300'} border-2 shadow-sm`
                    : 'bg-white border-dashed border-3 border-slate-300 hover:border-blue-300 hover:bg-blue-50'
                  }
                `}
                aria-label={isTapped ? `Replay ${phoneme?.ipa}` : `Tap to hear sound ${i + 1}`}
              >
                {/* Pulsing ring when active */}
                {isActive && (
                  <span className="absolute inset-0 rounded-2xl animate-ping bg-blue-300 opacity-40" />
                )}

                <span className="relative z-10">
                  {isTapped ? grapheme : (
                    <span className="text-2xl text-slate-300">?</span>
                  )}
                </span>

                {/* Speaker icon overlay for tapped boxes */}
                {isTapped && !isActive && (
                  <span className="absolute -top-2 -right-2 text-xs bg-white border border-slate-200 rounded-full w-5 h-5 flex items-center justify-center shadow-sm">
                    🔈
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tap all hint */}
        {!allTapped && (
          <p className="text-center text-xs text-slate-400 mt-4">
            {currentWord.phonemes.length - tappedBoxes.size} sound{currentWord.phonemes.length - tappedBoxes.size !== 1 ? 's' : ''} left to tap
          </p>
        )}
      </div>

      {/* Blend button */}
      {(phase === 'blend' || phase === 'blending' || phase === 'done') && (
        <button
          onClick={phase === 'blend' ? handleBlend : undefined}
          disabled={phase === 'blending'}
          className={`
            w-full max-w-md py-5 rounded-2xl text-lg font-bold
            transition-all active:scale-95 shadow-md
            ${phase === 'blending'
              ? 'bg-blue-400 text-white cursor-not-allowed animate-pulse'
              : phase === 'done'
              ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-300 cursor-default'
              : 'bg-blue-500 hover:bg-blue-600 text-white'
            }
          `}
        >
          {phase === 'blending' ? '🔊 Blending...' : phase === 'done' ? `✅ "${currentWord.word}"` : '🔊 Blend It!'}
        </button>
      )}

      {/* Next button */}
      {phase === 'done' && (
        <button
          onClick={handleNext}
          className="w-full max-w-md py-4 bg-teal-500 hover:bg-teal-600 text-white font-bold rounded-2xl text-lg transition-all active:scale-95 shadow-md"
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

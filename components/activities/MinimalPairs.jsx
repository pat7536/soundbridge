/**
 * MinimalPairs.jsx
 * ────────────────────────────────────────────────────────────────
 * Activity: Minimal Pair Trainer
 * Student hears one of two minimal pair words and must select
 * which word they heard. Focuses on vowel and consonant contrasts
 * that are critical for Spanish speakers.
 * ────────────────────────────────────────────────────────────────
 */
import { useState, useCallback, useRef } from 'react';
import { playWord } from '@/lib/audioEngine';
import { useApp } from '@/context/AppContext';
import ProgressBar from '@/components/ui/ProgressBar';
import AudioButton from '@/components/ui/AudioButton';

export default function MinimalPairs({ levelId, onComplete }) {
  const { getMinimalPairsForLevel, getPhonemeById, recordTrial, showFeedback } = useApp();

  const allPairs = getMinimalPairsForLevel(levelId);
  const [pairs] = useState(() => {
    const p = shuffle(allPairs).slice(0, Math.min(8, allPairs.length));
    // If not enough pairs, repeat
    if (p.length === 0) return [];
    while (p.length < 4 && allPairs.length > 0) {
      p.push(...shuffle(allPairs).slice(0, 1));
    }
    return p;
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [targetWord, setTargetWord] = useState(null);  // which word was played
  const [selected, setSelected] = useState(null);       // what student chose
  const [phase, setPhase] = useState('listen');         // 'listen' | 'choose' | 'feedback' | 'next'
  const [scores, setScores] = useState([]);
  const [attempts, setAttempts] = useState(0);
  const startTimeRef = useRef(Date.now());

  const current = pairs[currentIndex];
  const isLast = currentIndex === pairs.length - 1;

  const handlePlay = useCallback(async () => {
    if (!current) return;
    // Randomly pick word1 or word2
    const word = Math.random() < 0.5 ? current.word1 : current.word2;
    setTargetWord(word);
    setPhase('playing');
    await playWord(word);
    setPhase('choose');
  }, [current]);

  const handleReplay = useCallback(async () => {
    if (!targetWord || phase === 'playing') return;
    setPhase('playing');
    await playWord(targetWord);
    setPhase('choose');
  }, [targetWord, phase]);

  const handleChoice = useCallback(async (chosenWord) => {
    if (phase !== 'choose' || !targetWord) return;
    setSelected(chosenWord);
    setPhase('feedback');

    const elapsed = Date.now() - startTimeRef.current;
    const correct = chosenWord === targetWord;
    setAttempts(a => a + 1);

    if (correct) {
      setScores(prev => [...prev, true]);
      recordTrial(current.contrastPhoneme1, true, elapsed);
      recordTrial(current.contrastPhoneme2, true, elapsed);
      showFeedback({ type: 'correct', message: `Yes! You heard "${targetWord}" correctly! 👂` });
    } else {
      setScores(prev => [...prev, false]);
      recordTrial(current.contrastPhoneme1, false, elapsed, 'vowelConfusion');
      recordTrial(current.contrastPhoneme2, false, elapsed, 'vowelConfusion');
      showFeedback({
        type: 'incorrect',
        message: `It was "${targetWord}". The difference is small — listen again!`,
        tip: current.spanishNote,
      });

      // Replay the target word for correction
      await new Promise(r => setTimeout(r, 1200));
      await playWord(targetWord);
    }

    setPhase('next');
  }, [phase, targetWord, current, recordTrial, showFeedback]);

  const handleNext = useCallback(() => {
    if (isLast) {
      const score = scores.filter(Boolean).length;
      const stars = score >= pairs.length * 0.8 ? 3 : score >= pairs.length * 0.5 ? 2 : 1;
      onComplete?.(stars);
      return;
    }
    setCurrentIndex(i => i + 1);
    setTargetWord(null);
    setSelected(null);
    setPhase('listen');
    setAttempts(0);
    startTimeRef.current = Date.now();
  }, [isLast, scores, pairs.length, onComplete]);

  if (pairs.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        <p className="text-lg font-medium mb-2">No minimal pairs yet for this level.</p>
        <p className="text-sm">Complete Level 1 first to unlock minimal pair practice.</p>
      </div>
    );
  }

  if (!current) return null;

  const phoneme1 = getPhonemeById(current.contrastPhoneme1);
  const phoneme2 = getPhonemeById(current.contrastPhoneme2);

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      {/* Progress */}
      <div className="w-full max-w-md">
        <ProgressBar
          value={currentIndex}
          max={pairs.length}
          label={`Pair ${currentIndex + 1} of ${pairs.length}`}
          colorClass="bg-purple-500"
        />
      </div>

      {/* Instruction */}
      <div className="bg-purple-50 border border-purple-200 rounded-2xl px-5 py-3 text-center w-full max-w-md">
        <p className="text-sm text-purple-800 font-medium">
          {phase === 'listen'
            ? '🎧 Tap the speaker to hear a word'
            : phase === 'playing'
            ? '🔊 Listen carefully...'
            : phase === 'choose'
            ? '👂 Which word did you hear? Tap it!'
            : phase === 'feedback'
            ? '📊 Checking your answer...'
            : '✅ Tap next for the next pair'}
        </p>
      </div>

      {/* Two word cards — shown after listening */}
      {(phase === 'choose' || phase === 'feedback' || phase === 'next') && (
        <div className="flex gap-4 w-full max-w-md">
          {[current.word1, current.word2].map(word => {
            const isCorrect = word === targetWord;
            const isChosen = word === selected;
            const showResult = phase === 'next' || phase === 'feedback';

            return (
              <button
                key={word}
                onClick={() => handleChoice(word)}
                disabled={phase !== 'choose'}
                className={`
                  flex-1 py-8 rounded-2xl border-3 font-bold text-3xl
                  transition-all duration-200 active:scale-95 select-none
                  ${showResult
                    ? isCorrect
                      ? 'bg-emerald-100 border-emerald-400 text-emerald-800'
                      : isChosen && !isCorrect
                      ? 'bg-red-100 border-red-400 text-red-700'
                      : 'bg-slate-50 border-slate-200 text-slate-400'
                    : isChosen
                    ? 'bg-blue-100 border-blue-400 text-blue-800 scale-105'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-blue-50 hover:border-blue-300 hover:scale-105 shadow-sm'
                  }
                `}
                aria-label={`Select word: ${word}`}
                aria-pressed={isChosen}
              >
                <span>{word}</span>
                {showResult && isCorrect && (
                  <div className="text-sm font-normal text-emerald-600 mt-2">✅ This one!</div>
                )}
                {showResult && isChosen && !isCorrect && (
                  <div className="text-sm font-normal text-red-500 mt-2">You chose this</div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Listen button */}
      {phase === 'listen' && (
        <div className="flex flex-col items-center gap-3">
          <AudioButton onPlay={handlePlay} size="xl" label="Hear the word">
            <span className="text-5xl">🎧</span>
          </AudioButton>
          <p className="text-sm text-slate-400">Tap to hear — then choose which word!</p>
        </div>
      )}

      {/* Replay button */}
      {(phase === 'choose' || phase === 'next') && (
        <AudioButton
          onPlay={handleReplay}
          size="md"
          label="Replay word"
          className="border-2 border-slate-200"
        >
          <span>🔄</span>
        </AudioButton>
      )}

      {/* Phoneme contrast info */}
      {phase === 'next' && (
        <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4 w-full max-w-md text-sm text-sky-800 space-y-2">
          <p className="font-semibold text-sky-700">What to listen for:</p>
          <div className="flex gap-4 justify-center text-center">
            <div>
              <div className="text-2xl font-bold">{current.word1}</div>
              <div className="text-xs font-mono mt-1">{phoneme1?.ipa}</div>
            </div>
            <div className="self-center text-slate-400 font-bold">vs</div>
            <div>
              <div className="text-2xl font-bold">{current.word2}</div>
              <div className="text-xs font-mono mt-1">{phoneme2?.ipa}</div>
            </div>
          </div>
          {current.spanishNote && (
            <p className="text-xs text-sky-600 mt-2 italic">{current.spanishNote}</p>
          )}
        </div>
      )}

      {/* Next button */}
      {phase === 'next' && (
        <button
          onClick={handleNext}
          className="w-full max-w-md py-4 bg-purple-500 hover:bg-purple-600 text-white font-bold rounded-2xl text-lg transition-all active:scale-95 shadow-md"
        >
          {isLast ? '🎉 Finish Activity' : 'Next Pair →'}
        </button>
      )}

      {/* Score dots */}
      {scores.length > 0 && (
        <div className="flex gap-2 justify-center">
          {scores.map((s, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full ${s ? 'bg-emerald-400' : 'bg-red-300'}`}
            />
          ))}
        </div>
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

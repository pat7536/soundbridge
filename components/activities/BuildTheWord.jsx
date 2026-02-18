/**
 * BuildTheWord.jsx
 * ────────────────────────────────────────────────────────────────
 * Activity: Build the Word
 * Student hears a segmented word, then drags/taps grapheme tiles
 * into the correct positions. Instant corrective feedback.
 * ────────────────────────────────────────────────────────────────
 */
import { useState, useCallback, useRef } from 'react';
import { playPhoneme, playWord, blendPhonemes, sliderToGap } from '@/lib/audioEngine';
import { useApp } from '@/context/AppContext';
import ProgressBar from '@/components/ui/ProgressBar';
import AudioButton from '@/components/ui/AudioButton';

export default function BuildTheWord({ levelId, onComplete }) {
  const { getWordsForLevel, getPhonemeById, blendSpeed, recordTrial, showFeedback } = useApp();

  const allWords = getWordsForLevel(levelId);
  const [words] = useState(() => shuffle(allWords).slice(0, Math.min(8, allWords.length)));

  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState('listen');     // 'listen' | 'build' | 'done'
  const [slots, setSlots] = useState([]);           // graphemes placed by student
  const [tiles, setTiles] = useState([]);           // available shuffled tiles
  const [errorSlot, setErrorSlot] = useState(null); // which slot is wrong
  const [scores, setScores] = useState([]);
  const [attempts, setAttempts] = useState(0);
  const startTimeRef = useRef(Date.now());

  const currentWord = words[currentIndex];
  const isLast = currentIndex === words.length - 1;

  // Initialize a new word
  const initWord = useCallback((word) => {
    // Create shuffled grapheme tiles with IDs
    const tileList = shuffle(
      word.graphemes.map((g, i) => ({ id: i, grapheme: g }))
    );
    setTiles(tileList);
    setSlots(new Array(word.graphemes.length).fill(null));
    setErrorSlot(null);
    setAttempts(0);
  }, []);

  // Set up first word on mount
  useState(() => {
    if (words.length > 0) initWord(words[0]);
  });

  const handleListen = useCallback(async () => {
    if (!currentWord) return;
    setPhase('building');
    await blendPhonemes(currentWord.phonemes, { gapMs: sliderToGap(blendSpeed) });
    setPhase('build');
    if (slots.every(s => s === null)) {
      initWord(currentWord);
    }
  }, [currentWord, blendSpeed, slots, initWord]);

  // Place a tile into a slot
  const placeTile = useCallback((tileId, slotIndex) => {
    if (slots[slotIndex] !== null) return; // slot occupied
    const tile = tiles.find(t => t.id === tileId);
    if (!tile) return;

    const newSlots = [...slots];
    newSlots[slotIndex] = tile;
    setSlots(newSlots);
    setTiles(prev => prev.filter(t => t.id !== tileId));

    // Check if all slots filled
    const filled = newSlots.filter(Boolean);
    if (filled.length === currentWord.graphemes.length) {
      checkAnswer(newSlots);
    }
  }, [slots, tiles, currentWord]);

  // Remove a tile from a slot (student changes answer)
  const removeTile = useCallback((slotIndex) => {
    const tile = slots[slotIndex];
    if (!tile) return;
    const newSlots = [...slots];
    newSlots[slotIndex] = null;
    setSlots(newSlots);
    setTiles(prev => [...prev, tile]);
    setErrorSlot(null);
  }, [slots]);

  const checkAnswer = useCallback(async (finalSlots) => {
    const studentAnswer = finalSlots.map(s => s?.grapheme).join('');
    const correct = studentAnswer === currentWord.word;
    const elapsed = Date.now() - startTimeRef.current;

    setAttempts(a => a + 1);

    if (correct) {
      setPhase('done');
      const stars = attempts === 0 ? 3 : attempts === 1 ? 2 : 1;
      setScores(prev => [...prev, { correct: true, stars }]);

      currentWord.phonemes.forEach(pid => recordTrial(pid, true, elapsed));
      showFeedback({ type: 'correct', message: `"${currentWord.word}" — you built it! 🏆` });

      await playWord(currentWord.word);
    } else {
      // Find the wrong slot
      const wrongIdx = finalSlots.findIndex((s, i) =>
        s?.grapheme !== currentWord.graphemes[i]
      );
      setErrorSlot(wrongIdx);

      const wrongPhonemeId = currentWord.phonemes[wrongIdx];
      if (wrongPhonemeId) {
        recordTrial(wrongPhonemeId, false, elapsed, 'other');
        showFeedback({
          type: 'incorrect',
          message: `Hmm, check the ${ordinal(wrongIdx + 1)} sound.`,
          tip: `Hear it again — ${getPhonemeById(wrongPhonemeId)?.ipa || ''}`,
        });
        await playPhoneme(wrongPhonemeId);
      }

      // Reset to let student try again
      setTimeout(() => {
        initWord(currentWord);
        setPhase('build');
      }, 2000);
    }
  }, [currentWord, attempts, recordTrial, showFeedback, getPhonemeById, initWord]);

  const handleNext = useCallback(() => {
    if (isLast) {
      const avgStars = scores.length > 0
        ? Math.round(scores.reduce((s, r) => s + r.stars, 0) / scores.length)
        : 1;
      onComplete?.(avgStars);
      return;
    }
    const nextWord = words[currentIndex + 1];
    setCurrentIndex(i => i + 1);
    setPhase('listen');
    initWord(nextWord);
    startTimeRef.current = Date.now();
  }, [isLast, scores, words, currentIndex, onComplete, initWord]);

  if (!currentWord || slots.length === 0) {
    return <div className="text-center py-12 text-slate-400">Loading...</div>;
  }

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      {/* Progress */}
      <div className="w-full max-w-md">
        <ProgressBar
          value={currentIndex}
          max={words.length}
          label={`Word ${currentIndex + 1} of ${words.length}`}
          colorClass="bg-amber-500"
        />
      </div>

      {/* Instruction */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-3 text-center w-full max-w-md">
        <p className="text-sm text-amber-800 font-medium">
          {phase === 'listen'
            ? '🎧 Tap the speaker to hear the word'
            : phase === 'building'
            ? '🔊 Listen carefully...'
            : phase === 'build'
            ? '🏗️ Tap the letters to build the word'
            : '✅ Word built! Tap next to continue'}
        </p>
      </div>

      {/* Listen button */}
      {(phase === 'listen' || phase === 'building') && (
        <div className="flex flex-col items-center gap-3">
          <AudioButton
            onPlay={handleListen}
            size="xl"
            label="Hear the word"
            disabled={phase === 'building'}
          >
            <span className="text-5xl">🎧</span>
          </AudioButton>
          {phase === 'building' && (
            <p className="text-sm text-slate-400 animate-pulse">Listening...</p>
          )}
        </div>
      )}

      {/* Replay button during build phase */}
      {(phase === 'build' || phase === 'done') && (
        <div className="flex justify-center">
          <AudioButton
            onPlay={() => blendPhonemes(currentWord.phonemes, { gapMs: sliderToGap(blendSpeed) })}
            size="md"
            label="Hear again"
          >
            <span className="text-xl">🔄</span>
          </AudioButton>
        </div>
      )}

      {/* Word slots */}
      <div className="bg-white rounded-3xl shadow-md border border-slate-100 p-8 w-full max-w-md">
        <p className="text-center text-sm text-slate-400 mb-4">Drop letters into the boxes</p>

        <div className="flex justify-center gap-3 flex-wrap mb-6">
          {slots.map((slot, i) => (
            <button
              key={i}
              onClick={() => slot && removeTile(i)}
              className={`
                w-20 h-20 rounded-2xl border-3 font-bold text-xl
                transition-all duration-200 active:scale-90 select-none
                ${errorSlot === i
                  ? 'bg-red-100 border-red-400 text-red-600 animate-shake'
                  : slot
                  ? 'bg-blue-100 border-blue-400 text-blue-800 hover:bg-blue-200 cursor-pointer'
                  : 'bg-slate-50 border-dashed border-slate-300 cursor-default'
                }
              `}
              aria-label={slot ? `${slot.grapheme} — tap to remove` : `Empty slot ${i + 1}`}
              disabled={phase !== 'build' || !slot}
            >
              {slot ? slot.grapheme : (
                <span className="text-2xl text-slate-300">_</span>
              )}
            </button>
          ))}
        </div>

        {/* Correct answer reveal */}
        {phase === 'done' && (
          <div className="text-center">
            <span className="text-4xl font-bold text-emerald-600">{currentWord.word}</span>
            <p className="text-xs text-slate-400 mt-1">✅ Correct!</p>
          </div>
        )}
      </div>

      {/* Grapheme tiles */}
      {phase === 'build' && tiles.length > 0 && (
        <div className="w-full max-w-md">
          <p className="text-center text-xs text-slate-400 mb-3">
            Tap a letter, then tap a box to place it
          </p>
          <TileSelector
            tiles={tiles}
            slots={slots}
            onPlace={placeTile}
          />
        </div>
      )}

      {/* Next button */}
      {phase === 'done' && (
        <button
          onClick={handleNext}
          className="w-full max-w-md py-4 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-2xl text-lg transition-all active:scale-95 shadow-md"
        >
          {isLast ? '🎉 Finish Activity' : 'Next Word →'}
        </button>
      )}
    </div>
  );
}

/**
 * Tile selector sub-component.
 * Since true drag-and-drop is complex on mobile, we use a tap-to-select
 * then tap-slot approach (simpler and more accessible).
 */
function TileSelector({ tiles, slots, onPlace }) {
  const [selected, setSelected] = useState(null);
  const emptySlots = slots.map((s, i) => s === null ? i : null).filter(i => i !== null);

  const handleTileClick = (tile) => {
    setSelected(tile.id === selected ? null : tile.id);
  };

  const handleSlotClick = (slotIndex) => {
    if (selected !== null) {
      onPlace(selected, slotIndex);
      setSelected(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Available tiles */}
      <div className="flex justify-center gap-3 flex-wrap">
        {tiles.map(tile => (
          <button
            key={tile.id}
            onClick={() => handleTileClick(tile)}
            className={`
              w-16 h-16 rounded-xl border-2 font-bold text-xl
              transition-all duration-150 active:scale-90 select-none
              ${selected === tile.id
                ? 'bg-blue-500 border-blue-600 text-white scale-110 shadow-lg ring-4 ring-blue-200'
                : 'bg-white border-slate-300 text-slate-700 hover:bg-blue-50 hover:border-blue-300 shadow-sm'
              }
            `}
            aria-label={`Letter ${tile.grapheme}`}
            aria-pressed={selected === tile.id}
          >
            {tile.grapheme}
          </button>
        ))}
      </div>

      {/* Slot targets (shown when a tile is selected) */}
      {selected !== null && emptySlots.length > 0 && (
        <div>
          <p className="text-center text-xs text-blue-600 font-medium mb-2">
            Now tap which position (slot):
          </p>
          <div className="flex justify-center gap-3 flex-wrap">
            {emptySlots.map(si => (
              <button
                key={si}
                onClick={() => handleSlotClick(si)}
                className="px-4 py-2 bg-blue-100 border-2 border-blue-400 rounded-xl text-blue-800 font-bold text-sm hover:bg-blue-200 active:scale-95 transition-all"
              >
                Slot {si + 1}
              </button>
            ))}
          </div>
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

function ordinal(n) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

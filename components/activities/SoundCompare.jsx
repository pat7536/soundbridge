/**
 * SoundCompare.jsx
 * ────────────────────────────────────────────────────────────────
 * Activity: Sound Compare (Spanish–English Contrast Module)
 * Plays Spanish and English phoneme variants side by side.
 * Student identifies "Same" or "Different" and learns the
 * phonological contrast that distinguishes them.
 * ────────────────────────────────────────────────────────────────
 */
import { useState, useCallback } from 'react';
import { playPhoneme, speak } from '@/lib/audioEngine';
import { useApp } from '@/context/AppContext';
import AudioButton from '@/components/ui/AudioButton';
import ProgressBar from '@/components/ui/ProgressBar';

// Contrast pairs to practice
const CONTRAST_PAIRS = [
  {
    id: 'i-contrast',
    englishPhonemeId: 'short-i',
    spanishText: 'i',
    spanishLabel: 'Spanish /i/',
    englishLabel: 'English /ɪ/ (short i)',
    areSame: false,
    explanation: 'Spanish /i/ is a pure tense vowel — it sounds like English "ee". English short /ɪ/ is relaxed and shorter.',
    exampleSame: 'Spanish: "sí" vs English: "sit"',
    tip: 'English /ɪ/ is like a lazy /ee/ — relax your tongue and jaw slightly.',
    contrast: 'high',
  },
  {
    id: 'a-contrast',
    englishPhonemeId: 'short-a',
    spanishText: 'a',
    spanishLabel: 'Spanish /a/',
    englishLabel: 'English /æ/ (short a)',
    areSame: false,
    explanation: 'Spanish /a/ is open and central. English /æ/ (as in "cat") is raised, fronted, and tenser.',
    exampleSame: 'Spanish: "casa" vs English: "cat"',
    tip: 'Spread your lips wide and raise your tongue slightly for English /æ/.',
    contrast: 'high',
  },
  {
    id: 'e-contrast',
    englishPhonemeId: 'short-e',
    spanishText: 'e',
    spanishLabel: 'Spanish /e/',
    englishLabel: 'English /ɛ/ (short e)',
    areSame: false,
    explanation: 'Spanish /e/ is a pure mid vowel. English short /ɛ/ is slightly lower and laxer.',
    exampleSame: 'Spanish: "pelo" vs English: "pet"',
    tip: 'Let your jaw drop a tiny bit more for English /ɛ/ than for Spanish /e/.',
    contrast: 'medium',
  },
  {
    id: 'u-contrast',
    englishPhonemeId: 'short-u',
    spanishText: 'u',
    spanishLabel: 'Spanish /u/',
    englishLabel: 'English /ʌ/ (short u)',
    areSame: false,
    explanation: 'Spanish /u/ is a pure back rounded vowel. English short /ʌ/ (as in "cup") is completely unrounded and central.',
    exampleSame: 'Spanish: "tú" vs English: "cup"',
    tip: 'English /ʌ/ has NO lip rounding. Keep your lips relaxed and flat.',
    contrast: 'high',
  },
  {
    id: 'bv-contrast',
    englishPhonemeId: 'v',
    spanishText: 'b',
    spanishLabel: 'Spanish /b/ (same as /v/)',
    englishLabel: 'English /v/',
    areSame: false,
    explanation: 'In Spanish, /b/ and /v/ are the same phoneme. English uses different mouth positions: /b/ = lips together, /v/ = teeth on lip.',
    exampleSame: '"van" vs "ban"',
    tip: 'For English /v/: upper teeth touch lower lip. Feel the vibration.',
    contrast: 'high',
  },
  {
    id: 'h-contrast',
    englishPhonemeId: 'h',
    spanishText: 'a',
    spanishLabel: 'Spanish silent h',
    englishLabel: 'English /h/',
    areSame: false,
    explanation: 'Spanish "h" is always silent. English /h/ is always pronounced — a breathy sound at the start of words.',
    exampleSame: '"hat" starts with /h/ in English, not silent like Spanish "hora"',
    tip: 'Breathe out with your mouth open, like fogging a mirror.',
    contrast: 'high',
  },
  {
    id: 'r-contrast',
    englishPhonemeId: 'r',
    spanishText: 'r',
    spanishLabel: 'Spanish /r/ (tap/trill)',
    englishLabel: 'English /r/ (retroflex)',
    areSame: false,
    explanation: 'Spanish /r/ is a tongue tap or trill. English /r/ is a retroflex approximant — tongue curves back and never touches the roof of the mouth.',
    exampleSame: '"ropa" vs "rope"',
    tip: 'For English /r/: curl your tongue tip back slightly — it must NOT touch anything.',
    contrast: 'high',
  },
];

export default function SoundCompare({ onComplete }) {
  const { recordTrial, showFeedback } = useApp();

  const [pairs] = useState(() => shuffle(CONTRAST_PAIRS));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState('intro');      // 'intro' | 'listen-sp' | 'listen-en' | 'choose' | 'feedback' | 'next'
  const [answer, setAnswer] = useState(null);
  const [scores, setScores] = useState([]);

  const current = pairs[currentIndex];
  const isLast = currentIndex === pairs.length - 1;

  const handlePlaySpanish = useCallback(async () => {
    setPhase('listen-sp');
    await speak(current.spanishText, { rate: 0.4, pitch: 1.0, lang: 'es-ES' });
    setPhase('choose');
  }, [current]);

  const handlePlayEnglish = useCallback(async () => {
    setPhase('listen-en');
    await playPhoneme(current.englishPhonemeId);
    setPhase('choose');
  }, [current]);

  const handleAnswer = useCallback((choice) => {
    if (phase !== 'choose') return;
    setAnswer(choice);
    setPhase('feedback');

    const correct = (choice === 'same') === current.areSame;
    setScores(prev => [...prev, correct]);

    if (correct) {
      showFeedback({
        type: 'correct',
        message: current.areSame ? 'Yes! They sound the same!' : 'Right! They are different sounds.',
      });
    } else {
      showFeedback({
        type: 'incorrect',
        message: current.areSame
          ? 'Actually they sound the same! Listen again.'
          : 'Actually they are different! Listen closely to the contrast.',
      });
    }
  }, [phase, current, showFeedback]);

  const handleNext = useCallback(() => {
    if (isLast) {
      const score = scores.filter(Boolean).length;
      const stars = score >= pairs.length * 0.8 ? 3 : score >= pairs.length * 0.5 ? 2 : 1;
      onComplete?.(stars);
      return;
    }
    setCurrentIndex(i => i + 1);
    setPhase('intro');
    setAnswer(null);
  }, [isLast, scores, pairs.length, onComplete]);

  if (!current) return null;

  const contrastLevel = { high: 'Very different', medium: 'Somewhat different', low: 'Very similar' }[current.contrast];
  const contrastColor = { high: 'text-red-600 bg-red-50 border-red-200', medium: 'text-amber-600 bg-amber-50 border-amber-200', low: 'text-green-600 bg-green-50 border-green-200' }[current.contrast];

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      {/* Progress */}
      <div className="w-full max-w-md">
        <ProgressBar
          value={currentIndex}
          max={pairs.length}
          label={`Contrast ${currentIndex + 1} of ${pairs.length}`}
          colorClass="bg-rose-500"
        />
      </div>

      {/* Header */}
      <div className="text-center w-full max-w-md">
        <h2 className="text-xl font-bold text-slate-800 mb-1">
          🇪🇸 → 🇺🇸 Sound Compare
        </h2>
        <p className="text-sm text-slate-500">
          Listen to both sounds. Are they the same or different?
        </p>
      </div>

      {/* Two-panel comparison card */}
      <div className="grid grid-cols-2 gap-3 w-full max-w-md">
        {/* Spanish side */}
        <div className={`bg-orange-50 border-2 border-orange-200 rounded-2xl p-4 text-center ${phase === 'listen-sp' ? 'ring-4 ring-orange-300 scale-105' : ''} transition-all`}>
          <div className="text-3xl mb-2">🇪🇸</div>
          <div className="text-xs font-bold text-orange-700 uppercase tracking-wide mb-2">Spanish</div>
          <div className="text-sm text-orange-800 font-medium mb-3">{current.spanishLabel}</div>
          <AudioButton
            onPlay={handlePlaySpanish}
            size="md"
            label="Play Spanish sound"
            className="mx-auto !bg-orange-100 !text-orange-700 hover:!bg-orange-200"
          >
            <span className="text-xl">🔊</span>
          </AudioButton>
          {phase === 'listen-sp' && (
            <p className="text-xs text-orange-500 mt-2 animate-pulse">Playing...</p>
          )}
        </div>

        {/* English side */}
        <div className={`bg-blue-50 border-2 border-blue-200 rounded-2xl p-4 text-center ${phase === 'listen-en' ? 'ring-4 ring-blue-300 scale-105' : ''} transition-all`}>
          <div className="text-3xl mb-2">🇺🇸</div>
          <div className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-2">English</div>
          <div className="text-sm text-blue-800 font-medium mb-3">{current.englishLabel}</div>
          <AudioButton
            onPlay={handlePlayEnglish}
            size="md"
            label="Play English sound"
            className="mx-auto !bg-blue-100 !text-blue-700 hover:!bg-blue-200"
          >
            <span className="text-xl">🔊</span>
          </AudioButton>
          {phase === 'listen-en' && (
            <p className="text-xs text-blue-500 mt-2 animate-pulse">Playing...</p>
          )}
        </div>
      </div>

      {/* Same/Different buttons */}
      {(phase === 'choose' || phase === 'intro' || phase === 'listen-sp' || phase === 'listen-en') && (
        <div className="w-full max-w-md">
          <p className="text-center text-sm text-slate-500 mb-3 font-medium">
            {phase === 'intro' ? 'Play both sounds first, then decide:' : 'Are they the same sound or different?'}
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => handleAnswer('same')}
              disabled={phase !== 'choose'}
              className={`
                flex-1 py-4 rounded-2xl border-2 font-bold text-lg transition-all active:scale-95
                ${phase !== 'choose'
                  ? 'border-slate-200 bg-slate-50 text-slate-300 cursor-not-allowed'
                  : 'border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                }
              `}
            >
              <div className="text-2xl mb-1">🟰</div>
              Same
            </button>
            <button
              onClick={() => handleAnswer('different')}
              disabled={phase !== 'choose'}
              className={`
                flex-1 py-4 rounded-2xl border-2 font-bold text-lg transition-all active:scale-95
                ${phase !== 'choose'
                  ? 'border-slate-200 bg-slate-50 text-slate-300 cursor-not-allowed'
                  : 'border-red-300 bg-red-50 text-red-800 hover:bg-red-100'
                }
              `}
            >
              <div className="text-2xl mb-1">⚡</div>
              Different
            </button>
          </div>
          {(phase === 'intro' || phase === 'listen-sp' || phase === 'listen-en') && (
            <p className="text-center text-xs text-slate-400 mt-2">
              Listen to both sounds above first
            </p>
          )}
        </div>
      )}

      {/* Feedback panel */}
      {(phase === 'feedback' || phase === 'next') && (
        <div className="w-full max-w-md space-y-4">
          {/* Result */}
          <div className={`rounded-2xl border p-4 ${contrastColor}`}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{current.areSame ? '🟰' : '⚡'}</span>
              <span className="font-bold text-sm uppercase tracking-wide">
                {current.areSame ? 'Same sound!' : 'Different sounds!'}
              </span>
              <span className={`ml-auto text-xs font-medium px-2 py-0.5 rounded-full border ${contrastColor}`}>
                {contrastLevel}
              </span>
            </div>
            <p className="text-sm leading-snug">{current.explanation}</p>
          </div>

          {/* Pronunciation tip */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <p className="text-xs font-bold text-amber-700 uppercase tracking-wide mb-1">💡 Production tip</p>
            <p className="text-sm text-amber-800">{current.tip}</p>
          </div>

          {/* Example */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-600 text-center">
            <span className="font-medium">Example:</span> {current.exampleSame}
          </div>

          {/* Next button */}
          <button
            onClick={() => {
              if (phase === 'feedback') setPhase('next');
              else handleNext();
            }}
            className="w-full py-4 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-2xl text-lg transition-all active:scale-95 shadow-md"
          >
            {phase === 'feedback' ? 'See Details' : isLast ? '🎉 Finish' : 'Next Contrast →'}
          </button>
        </div>
      )}

      {/* Score row */}
      {scores.length > 0 && (
        <div className="flex gap-2 justify-center">
          {scores.map((s, i) => (
            <div key={i} className={`w-3 h-3 rounded-full ${s ? 'bg-emerald-400' : 'bg-red-300'}`} />
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

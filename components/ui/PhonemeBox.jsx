/**
 * PhonemeBox.jsx
 * A large, tappable box representing a single phoneme in a word.
 * Used in Tap the Sounds and Build the Word activities.
 */
import AudioButton from './AudioButton';
import { playPhoneme } from '@/lib/audioEngine';
import { useApp } from '@/context/AppContext';

export default function PhonemeBox({
  phonemeId,
  grapheme,
  index,
  isRevealed = false,
  isHighlighted = false,
  isActive = false,
  isError = false,
  isEmpty = false,
  onTap,
  showGrapheme = false,
  size = 'lg',
}) {
  const { getPhonemeById } = useApp();
  const phoneme = getPhonemeById(phonemeId);

  const handleTap = async () => {
    if (onTap) {
      onTap(index, phonemeId);
    } else if (phonemeId && isRevealed) {
      await playPhoneme(phonemeId);
    }
  };

  const sizeClasses = {
    sm: 'w-12 h-12 text-sm',
    md: 'w-16 h-16 text-base',
    lg: 'w-20 h-20 text-xl',
    xl: 'w-24 h-24 text-2xl',
  }[size] || 'w-20 h-20 text-xl';

  const baseClasses = `
    relative flex flex-col items-center justify-center rounded-xl border-3
    font-bold select-none cursor-pointer
    transition-all duration-200 active:scale-95
    ${sizeClasses}
  `;

  // State-based styling
  let stateClasses = '';
  if (isEmpty) {
    stateClasses = 'border-dashed border-slate-300 bg-slate-50 text-slate-300';
  } else if (isError) {
    stateClasses = 'border-red-400 bg-red-50 text-red-600 animate-shake ring-2 ring-red-300';
  } else if (isActive) {
    stateClasses = 'border-blue-500 bg-blue-100 text-blue-700 ring-4 ring-blue-200 scale-105';
  } else if (isHighlighted) {
    stateClasses = 'border-amber-400 bg-amber-50 text-amber-800 ring-2 ring-amber-200';
  } else if (isRevealed && phoneme) {
    stateClasses = `${phoneme.color || 'border-slate-300 bg-white text-slate-700'} border-2 hover:scale-105 hover:shadow-md`;
  } else {
    stateClasses = 'border-slate-200 bg-slate-100 text-slate-500 hover:bg-slate-200';
  }

  return (
    <button
      onClick={handleTap}
      className={`${baseClasses} ${stateClasses}`}
      aria-label={phoneme ? `Phoneme ${phoneme.ipa}` : 'Empty phoneme box'}
    >
      {/* Grapheme display */}
      {showGrapheme && grapheme && (
        <span className="text-center leading-none">
          {grapheme}
        </span>
      )}

      {/* IPA display when not showing grapheme */}
      {!showGrapheme && isRevealed && phoneme && (
        <span className="text-center leading-none font-mono">
          {phoneme.ipa}
        </span>
      )}

      {/* Empty slot indicator */}
      {isEmpty && (
        <span className="text-3xl opacity-30">_</span>
      )}

      {/* Active audio indicator */}
      {isActive && (
        <span className="absolute -top-2 -right-2 text-xs bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center">
          🔊
        </span>
      )}
    </button>
  );
}

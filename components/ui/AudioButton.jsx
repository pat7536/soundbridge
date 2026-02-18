/**
 * AudioButton.jsx
 * A reusable button that plays audio when tapped/clicked.
 * Shows a pulsing animation while audio is playing.
 */
import { useState, useCallback } from 'react';

export default function AudioButton({
  onPlay,
  size = 'md',
  label = 'Play sound',
  className = '',
  disabled = false,
  children,
}) {
  const [playing, setPlaying] = useState(false);

  const handlePlay = useCallback(async () => {
    if (playing || disabled) return;
    setPlaying(true);
    try {
      await onPlay?.();
    } finally {
      setPlaying(false);
    }
  }, [playing, disabled, onPlay]);

  const sizeClasses = {
    sm: 'w-10 h-10 text-lg',
    md: 'w-14 h-14 text-2xl',
    lg: 'w-20 h-20 text-4xl',
    xl: 'w-28 h-28 text-5xl',
  }[size] || 'w-14 h-14 text-2xl';

  return (
    <button
      onClick={handlePlay}
      disabled={disabled}
      aria-label={label}
      className={`
        relative flex items-center justify-center rounded-full
        transition-all duration-150 select-none
        ${playing
          ? 'bg-blue-500 text-white shadow-lg shadow-blue-300 scale-110 ring-4 ring-blue-200'
          : 'bg-blue-100 text-blue-700 hover:bg-blue-200 hover:shadow-md active:scale-95'
        }
        ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
        ${sizeClasses}
        ${className}
      `}
    >
      {/* Pulsing ring when playing */}
      {playing && (
        <span className="absolute inset-0 rounded-full animate-ping bg-blue-300 opacity-50" />
      )}

      {children || (
        <span className="relative z-10">
          {playing ? '🔊' : '🔈'}
        </span>
      )}
    </button>
  );
}

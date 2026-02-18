/**
 * ProgressBar.jsx
 * Reusable progress bar component.
 */
export default function ProgressBar({ value, max, label, colorClass = 'bg-blue-500', showPercent = true }) {
  const pct = Math.min(100, Math.round((value / Math.max(max, 1)) * 100));

  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-slate-600 font-medium">{label}</span>
          {showPercent && (
            <span className="text-xs font-bold text-slate-700">{pct}%</span>
          )}
        </div>
      )}
      <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-200">
        <div
          className={`h-full rounded-full transition-all duration-500 ${colorClass}`}
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
}

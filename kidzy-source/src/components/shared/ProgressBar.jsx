export default function ProgressBar({ value, max, color = '#7C3AED', height = 'h-3', showLabel = true, className = '' }) {
  const percent = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;

  return (
    <div className={className}>
      {showLabel && (
        <div className="flex justify-between text-xs mb-1">
          <span className="text-gray-500">${value} / ${max}</span>
          <span className="font-semibold" style={{ color }}>{percent}%</span>
        </div>
      )}
      <div className={`${height} bg-gray-100 rounded-full overflow-hidden`}>
        <div
          className={`${height} rounded-full transition-all duration-700 ease-out relative overflow-hidden`}
          style={{ width: `${percent}%`, backgroundColor: color }}
        >
          {percent > 10 && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[shine_2s_infinite]" />
          )}
        </div>
      </div>
    </div>
  );
}

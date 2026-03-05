import { useMemo } from 'react';
import { Flame } from 'lucide-react';

/**
 * StreakCalendar — 5-week heatmap showing daily activity for a kid.
 * Green = earned K$ that day, gray = no activity, today highlighted.
 */
export default function StreakCalendar({ kidId, transactions, streak }) {
  const today = new Date();

  const { days, weekDays } = useMemo(() => {
    const result = [];
    // Build 35 days (5 weeks) ending today
    for (let i = 34; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayEarnings = transactions
        .filter(t => t.kidId === kidId && t.type === 'earn' && t.timestamp.startsWith(dateStr))
        .reduce((sum, t) => sum + t.amount, 0);
      result.push({
        date: dateStr,
        dayOfWeek: d.getDay(),
        dayNum: d.getDate(),
        earned: dayEarnings,
        isToday: i === 0,
      });
    }
    return { days: result, weekDays: ['S', 'M', 'T', 'W', 'T', 'F', 'S'] };
  }, [kidId, transactions, today.toISOString().split('T')[0]]);

  // Group into weeks (rows of 7)
  const weeks = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  const getColor = (day) => {
    if (day.earned === 0) return 'bg-gray-100';
    if (day.earned <= 3) return 'bg-green-200';
    if (day.earned <= 8) return 'bg-green-400';
    return 'bg-green-600';
  };

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display font-bold text-sm text-kidzy-dark">Activity Streak</h3>
        {streak > 0 && (
          <span className="flex items-center gap-1 text-orange-500 text-xs font-bold bg-orange-50 px-2 py-1 rounded-full">
            <Flame size={12} /> {streak} day{streak !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {weekDays.map((d, i) => (
          <div key={i} className="text-center text-[9px] text-gray-400 font-medium">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="space-y-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 gap-1">
            {week.map((day, di) => (
              <div
                key={di}
                className={`aspect-square rounded-md flex items-center justify-center text-[9px] font-semibold transition-all ${getColor(day)} ${
                  day.isToday ? 'ring-2 ring-kidzy-purple ring-offset-1' : ''
                } ${day.earned > 0 ? 'text-white' : 'text-gray-400'}`}
                title={`${day.date}: ${day.earned} K$`}
              >
                {day.dayNum}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-2 mt-2">
        <span className="text-[9px] text-gray-400">Less</span>
        <div className="w-3 h-3 rounded-sm bg-gray-100" />
        <div className="w-3 h-3 rounded-sm bg-green-200" />
        <div className="w-3 h-3 rounded-sm bg-green-400" />
        <div className="w-3 h-3 rounded-sm bg-green-600" />
        <span className="text-[9px] text-gray-400">More</span>
      </div>
    </div>
  );
}

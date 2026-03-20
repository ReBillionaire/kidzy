import { useMemo, useState, useRef } from 'react';
import { useKidzy, useKidzyDispatch } from '../../context/KidzyContext';
import { isDueToday, isCompletedToday } from '../../utils/helpers';
import DollarBadge from '../shared/DollarBadge';
import ConfettiEffect from '../shared/ConfettiEffect';
import { playCoinSound, vibrateEarn } from '../../utils/sounds';
import { CheckCircle2, Circle, Sparkles, Plus, ClipboardList, ChevronDown, ChevronUp, Clock } from 'lucide-react';

const MAX_VISIBLE = 5;

/**
 * TodayChores — Inline chore checklist that lives inside KidCard.
 * Shows today's due chores as tappable checkboxes. Tap = complete + award K$.
 * Collapses to MAX_VISIBLE items with a "Show all" toggle.
 */
export default function TodayChores({ kidId, onManageChores }) {
  const state = useKidzy();
  const dispatch = useKidzyDispatch();
  const [showConfetti, setShowConfetti] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const lastActionRef = useRef(0);

  const soundEnabled = state.settings?.soundEnabled !== false;
  const hapticEnabled = state.settings?.hapticEnabled !== false;
  const completions = state.choreCompletions || [];
  const pendingCompletions = state.pendingChoreCompletions || [];
  const chores = (state.chores || []).filter(c => c.kidId === kidId);
  const today = new Date().toISOString().split('T')[0];

  // Check if a chore is pending today
  const isPendingToday = (choreId) => {
    return pendingCompletions.some(p => p.choreId === choreId && p.date === today);
  };

  const todayChores = useMemo(() => chores.filter(isDueToday), [chores]);

  const stats = useMemo(() => {
    const total = todayChores.length;
    const done = todayChores.filter(c => isCompletedToday(c.id, completions)).length;
    return { total, done, percent: total > 0 ? Math.round((done / total) * 100) : 0 };
  }, [todayChores, completions]);

  const handleComplete = (chore) => {
    // Debounce check
    const now = Date.now();
    if (now - lastActionRef.current < 1000) return;
    lastActionRef.current = now;

    // Check if already completed or pending
    if (isCompletedToday(chore.id, completions) || isPendingToday(chore.id)) return;

    // Dispatch pending approval instead of immediate completion
    dispatch({
      type: 'COMPLETE_CHORE_PENDING',
      payload: { choreId: chore.id, kidId, date: today }
    });

    if (soundEnabled) playCoinSound();
    if (hapticEnabled) vibrateEarn();
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 2000);
  };

  // No chores assigned yet — show a subtle prompt
  if (todayChores.length === 0) {
    return (
      <div className="mt-3 bg-gray-50 rounded-xl p-3 border border-dashed border-gray-200">
        <button
          onClick={onManageChores}
          className="w-full flex items-center justify-center gap-2 text-sm text-kidzy-gray hover:text-kidzy-purple transition-colors"
        >
          <ClipboardList size={14} />
          <span className="font-medium">Add daily chores</span>
          <Plus size={14} />
        </button>
      </div>
    );
  }

  // Sort: incomplete first, then pending, then completed
  const sortedChores = useMemo(() => {
    return [...todayChores].sort((a, b) => {
      const aDone = isCompletedToday(a.id, completions) ? 2 : isPendingToday(a.id) ? 1 : 0;
      const bDone = isCompletedToday(b.id, completions) ? 2 : isPendingToday(b.id) ? 1 : 0;
      return aDone - bDone;
    });
  }, [todayChores, completions, pendingCompletions]);

  const visibleChores = expanded ? sortedChores : sortedChores.slice(0, MAX_VISIBLE);
  const hiddenCount = sortedChores.length - MAX_VISIBLE;

  return (
    <div className="mt-3">
      <ConfettiEffect active={showConfetti} />

      {/* Header with progress */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <ClipboardList size={14} className="text-kidzy-purple" />
          <span className="text-xs font-bold text-kidzy-dark">Today's Tasks</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-kidzy-gray font-medium">{stats.done}/{stats.total}</span>
          {stats.percent === 100 && stats.total > 0 && (
            <span className="text-xs animate-bounce-in">{'\u{1F389}'}</span>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="bg-gray-100 rounded-full h-1.5 mb-2 overflow-hidden">
        <div
          className="bg-gradient-to-r from-kidzy-purple to-kidzy-blue h-1.5 rounded-full transition-all duration-500"
          style={{ width: `${stats.percent}%` }}
        />
      </div>

      {/* Chore list — collapsed to MAX_VISIBLE */}
      <div className="space-y-1">
        {visibleChores.map(chore => {
          const done = isCompletedToday(chore.id, completions);
          const pending = isPendingToday(chore.id);
          return (
            <button
              key={chore.id}
              onClick={() => !done && !pending && handleComplete(chore)}
              disabled={done || pending}
              className={`w-full flex items-center gap-2 p-2 rounded-lg transition-all text-left ${
                done
                  ? 'bg-green-50/50'
                  : pending
                    ? 'bg-amber-50/50'
                    : 'hover:bg-purple-50/50 active:scale-[0.98]'
              }`}
            >
              <div className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 transition-all ${
                done ? 'bg-green-100 text-green-600' : pending ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-300'
              }`}>
                {done ? <CheckCircle2 size={16} /> : pending ? <Clock size={16} /> : <Circle size={16} />}
              </div>
              <span className="text-sm flex-shrink-0">{chore.icon}</span>
              <span className={`text-xs font-medium flex-1 min-w-0 truncate ${
                done ? 'text-green-700 line-through' : pending ? 'text-amber-700' : 'text-kidzy-dark'
              }`}>
                {chore.name}
              </span>
              <span className={`text-[10px] font-bold flex-shrink-0 ${
                done ? 'text-green-500' : pending ? 'text-amber-600' : 'text-kidzy-purple'
              }`}>
                {done ? '\u{2713}' : pending ? '\u{231B}' : `+${chore.dollarValue}`}
              </span>
            </button>
          );
        })}
      </div>

      {/* Show more/less toggle */}
      {hiddenCount > 0 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-1 w-full flex items-center justify-center gap-1 text-xs text-kidzy-purple hover:text-kidzy-purple-dark transition-colors py-1.5 font-semibold"
        >
          {expanded ? (
            <><ChevronUp size={14} /> Show less</>
          ) : (
            <><ChevronDown size={14} /> Show {hiddenCount} more task{hiddenCount !== 1 ? 's' : ''}</>
          )}
        </button>
      )}

      {/* Manage link — only show if list is short or expanded */}
      {(todayChores.length <= MAX_VISIBLE || expanded) && (
        <button
          onClick={onManageChores}
          className="mt-1 w-full text-center text-[10px] text-kidzy-gray hover:text-kidzy-purple transition-colors py-1"
        >
          Manage chores in Settings
        </button>
      )}
    </div>
  );
}

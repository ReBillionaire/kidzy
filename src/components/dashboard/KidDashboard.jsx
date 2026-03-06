import { useState, useMemo } from 'react';
import { useKidzy, useKidzyDispatch } from '../../context/KidzyContext';
import { getKidBalance, getKidEarningsToday, getKidEarningsThisWeek, getStreak, getAchievements } from '../../utils/helpers';
import { playCoinSound, vibrateEarn } from '../../utils/sounds';
import Avatar from '../shared/Avatar';
import DollarBadge from '../shared/DollarBadge';
import ProgressBar from '../shared/ProgressBar';
import ConfettiEffect from '../shared/ConfettiEffect';
import { LogOut, Flame, Trophy, Target, CheckCircle2, Circle, ClipboardList, Sparkles } from 'lucide-react';

function isDueToday(chore) {
  if (!chore.repeat || chore.repeat === 'none') return true;
  const day = new Date().getDay();
  if (chore.repeat === 'daily') return true;
  if (chore.repeat === 'weekdays') return day >= 1 && day <= 5;
  if (chore.repeat === 'weekly') {
    const created = new Date(chore.createdAt);
    const today = new Date();
    const diffDays = Math.floor((today - created) / 86400000);
    return diffDays % 7 === 0 || diffDays === 0;
  }
  return true;
}

function isCompletedToday(choreId, completions) {
  const today = new Date().toISOString().split('T')[0];
  return completions.some(c => c.choreId === choreId && c.date === today);
}

export default function KidDashboard() {
  const state = useKidzy();
  const dispatch = useKidzyDispatch();
  const kid = state.kids.find(k => k.id === state.kidMode);
  const [showConfetti, setShowConfetti] = useState(false);

  const soundEnabled = state.settings?.soundEnabled !== false;
  const hapticEnabled = state.settings?.hapticEnabled !== false;
  const completions = state.choreCompletions || [];

  if (!kid) {
    return (
      <div className="min-h-dvh bg-gradient-to-br from-kidzy-purple via-purple-600 to-kidzy-blue flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl p-6 text-center max-w-sm w-full">
          <div className="text-5xl mb-3">{'\u{1F914}'}</div>
          <h2 className="font-display font-bold text-xl mb-2">Oops!</h2>
          <p className="text-kidzy-gray text-sm mb-4">Something went wrong. Let's go back.</p>
          <button onClick={() => dispatch({ type: 'LOGOUT' })}
            className="bg-gradient-to-r from-kidzy-purple to-kidzy-blue text-white font-bold py-3 px-6 rounded-xl">
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const balance = getKidBalance(kid.id, state.transactions);
  const todayEarnings = getKidEarningsToday(kid.id, state.transactions);
  const weeklyEarnings = getKidEarningsThisWeek(kid.id, state.transactions);
  const streak = getStreak(kid.id, state.transactions);
  const { all: achievements, unlocked, total } = getAchievements(kid.id, state.transactions);

  // Wishes for this kid
  const wishes = state.wishListItems.filter(w => w.kidId === kid.id && w.status === 'active');

  // Today's chores for this kid
  const chores = (state.chores || []).filter(c => c.kidId === kid.id);
  const todayChores = chores.filter(isDueToday);
  const choresDone = todayChores.filter(c => isCompletedToday(c.id, completions)).length;
  const choresTotal = todayChores.length;
  const choresPercent = choresTotal > 0 ? Math.round((choresDone / choresTotal) * 100) : 0;

  const handleCompleteChore = (chore) => {
    if (isCompletedToday(chore.id, completions)) return;

    dispatch({
      type: 'COMPLETE_CHORE',
      payload: { choreId: chore.id, kidId: kid.id, date: new Date().toISOString().split('T')[0] }
    });

    dispatch({
      type: 'ADD_TRANSACTION',
      payload: {
        kidId: kid.id,
        parentId: 'self',
        type: 'earn',
        amount: chore.dollarValue,
        reason: `Chore: ${chore.name}`,
        category: 'Chore',
        choreId: chore.id,
      }
    });

    if (soundEnabled) playCoinSound();
    if (hapticEnabled) vibrateEarn();
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 2000);
  };

  return (
    <div className="min-h-dvh bg-kidzy-bg pb-8">
      <ConfettiEffect active={showConfetti} />

      {/* Header */}
      <div className="bg-gradient-to-r from-kidzy-purple to-kidzy-blue text-white p-4 pb-8 rounded-b-3xl shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Avatar src={kid.avatar} name={kid.name} size="sm" />
            <div>
              <p className="text-white/80 text-xs">Hey there</p>
              <p className="font-bold">{kid.name}</p>
            </div>
          </div>
          <button
            onClick={() => dispatch({ type: 'LOGOUT' })}
            className="p-2 bg-white/15 rounded-full hover:bg-white/25 transition-colors"
            aria-label="Exit"
          >
            <LogOut size={18} />
          </button>
        </div>

        {/* Balance */}
        <div className="text-center mb-4">
          <p className="text-white/70 text-xs">My K$ Balance</p>
          <div className="mt-1">
            <span className="text-5xl font-display font-bold">{balance}</span>
            <span className="text-white/70 text-lg ml-1">K$</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-3 text-center">
            <p className="text-2xl font-bold font-display">+{todayEarnings}</p>
            <p className="text-white/70 text-xs">K$ Today</p>
          </div>
          <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-3 text-center">
            <p className="text-2xl font-bold font-display">+{weeklyEarnings}</p>
            <p className="text-white/70 text-xs">This Week</p>
          </div>
          <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-3 text-center">
            <div className="flex items-center justify-center gap-1">
              <Flame size={16} />
              <span className="font-bold text-2xl font-display">{streak}</span>
            </div>
            <p className="text-white/70 text-xs">Day Streak</p>
          </div>
        </div>
      </div>

      {/* Today's Tasks — THE MAIN ACTION AREA for kids */}
      {todayChores.length > 0 && (
        <div className="px-4 mt-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display font-bold text-kidzy-dark flex items-center gap-2">
                <ClipboardList size={18} className="text-kidzy-purple" /> My Tasks Today
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-sm text-kidzy-gray font-medium">{choresDone}/{choresTotal}</span>
                {choresPercent === 100 && choresTotal > 0 && (
                  <span className="text-sm animate-bounce-in">{'\u{1F389}'}</span>
                )}
              </div>
            </div>

            {/* Progress bar */}
            <div className="bg-gray-100 rounded-full h-2 mb-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-kidzy-purple to-kidzy-blue h-2 rounded-full transition-all duration-500"
                style={{ width: `${choresPercent}%` }}
              />
            </div>

            {/* All done message */}
            {choresPercent === 100 && choresTotal > 0 && (
              <div className="text-center py-3 bg-green-50 rounded-xl mb-3">
                <p className="text-lg font-display font-bold text-green-700">{'\u{1F31F}'} All Done! Amazing job!</p>
                <p className="text-green-600 text-xs">You completed all your tasks for today</p>
              </div>
            )}

            {/* Chore list */}
            <div className="space-y-1.5">
              {todayChores.map(chore => {
                const done = isCompletedToday(chore.id, completions);
                return (
                  <button
                    key={chore.id}
                    onClick={() => !done && handleCompleteChore(chore)}
                    disabled={done}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${
                      done
                        ? 'bg-green-50/80'
                        : 'hover:bg-purple-50 active:scale-[0.98] bg-gray-50/50'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${
                      done ? 'bg-green-100 text-green-600' : 'bg-purple-100 text-purple-300'
                    }`}>
                      {done ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                    </div>
                    <span className="text-lg flex-shrink-0">{chore.icon}</span>
                    <span className={`text-sm font-semibold flex-1 min-w-0 truncate ${
                      done ? 'text-green-700 line-through' : 'text-kidzy-dark'
                    }`}>
                      {chore.name}
                    </span>
                    <span className={`text-xs font-bold flex-shrink-0 px-2 py-1 rounded-lg ${
                      done ? 'text-green-500 bg-green-100' : 'text-kidzy-purple bg-purple-100'
                    }`}>
                      {done ? '\u{2713} Done' : `+${chore.dollarValue} K$`}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* No chores assigned message */}
      {todayChores.length === 0 && (
        <div className="px-4 mt-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
            <div className="text-4xl mb-2">{'\u{1F31F}'}</div>
            <h3 className="font-display font-bold text-kidzy-dark mb-1">No tasks today!</h3>
            <p className="text-kidzy-gray text-sm">Ask a parent to add some chores for you to earn K$</p>
          </div>
        </div>
      )}

      {/* Wishes Progress */}
      {wishes.length > 0 && (
        <div className="px-4 mt-4">
          <h2 className="font-display font-bold text-kidzy-dark mb-3 flex items-center gap-2">
            <Target size={18} className="text-kidzy-pink" /> My Wishes
          </h2>
          <div className="space-y-2">
            {wishes.map(wish => {
              const canAfford = balance >= wish.targetDollars;
              return (
                <div key={wish.id} className={`bg-white rounded-xl p-3 border-2 ${canAfford ? 'border-green-300 shadow-green-100' : 'border-gray-100'} shadow-sm`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{wish.icon || '\u{1F381}'}</span>
                    <span className="font-bold text-sm flex-1 truncate">{wish.name}</span>
                    <DollarBadge amount={wish.targetDollars} size="sm" />
                  </div>
                  <ProgressBar value={Math.min(balance, wish.targetDollars)} max={wish.targetDollars} color={canAfford ? '#10B981' : '#EC4899'} />
                  {canAfford && (
                    <p className="text-green-600 text-xs font-bold mt-1 text-center">{'\u{2705}'} You can get this! Ask a parent to redeem it!</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Achievements */}
      <div className="px-4 mt-4">
        <h2 className="font-display font-bold text-kidzy-dark mb-3 flex items-center gap-2">
          <Trophy size={18} className="text-amber-500" /> My Badges ({unlocked}/{total})
        </h2>
        <div className="grid grid-cols-3 gap-2">
          {achievements.map(badge => (
            <div
              key={badge.id}
              className={`rounded-xl p-3 text-center transition-all ${
                badge.unlocked
                  ? 'bg-gradient-to-br from-amber-50 to-yellow-50 border-2 border-amber-200'
                  : 'bg-gray-50 border-2 border-gray-100 opacity-50'
              }`}
            >
              <div className="text-2xl mb-1">{badge.unlocked ? badge.icon : '\u{1F512}'}</div>
              <p className="text-xs font-bold truncate">{badge.name}</p>
              <p className="text-[10px] text-kidzy-gray truncate">{badge.desc}</p>
              {!badge.unlocked && (
                <div className="mt-1 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-amber-400 h-1.5 rounded-full transition-all" style={{ width: `${(badge.progress / badge.target) * 100}%` }} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Fun message */}
      <div className="px-4 mt-6 text-center">
        <p className="text-kidzy-gray text-sm">Keep earning K$ by being awesome! {'\u{1F4AA}\u{2728}'}</p>
      </div>
    </div>
  );
}

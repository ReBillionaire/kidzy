import { useKidzy, useKidzyDispatch } from '../../context/KidzyContext';
import { getKidBalance, getKidEarningsToday, getKidEarningsThisWeek, getStreak, getLongestStreak, getAchievements } from '../../utils/helpers';
import Avatar from '../shared/Avatar';
import DollarBadge from '../shared/DollarBadge';
import ProgressBar from '../shared/ProgressBar';
import { LogOut, Flame, Trophy, Star, Target } from 'lucide-react';

export default function KidDashboard() {
  const state = useKidzy();
  const dispatch = useKidzyDispatch();
  const kid = state.kids.find(k => k.id === state.kidMode);

  if (!kid) {
    return (
      <div className="min-h-dvh bg-gradient-to-br from-kidzy-purple via-purple-600 to-kidzy-blue flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl p-6 text-center max-w-sm w-full">
          <div className="text-5xl mb-3">{'\u{1F914}'}</div>
          <h2 className="font-display font-bold text-xl mb-2">Oops!</h2>
          <p className="text-kidzy-gray text-sm mb-4">Something went wrong. Let's go back.</p>
          <button onClick={() => dispatch({ type: 'LOGOUT' })}
            className="bg-gradient-to-r from-kidzy-purple to-kidzy-blue text-white font-bold py-3 px-6 rounded-xl">
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  const balance = getKidBalance(kid.id, state.transactions);
  const todayEarnings = getKidEarningsToday(kid.id, state.transactions);
  const weeklyEarnings = getKidEarningsThisWeek(kid.id, state.transactions);
  const streak = getStreak(kid.id, state.transactions);
  const longestStreak = getLongestStreak(kid.id, state.transactions);
  const { all: achievements, unlocked, total } = getAchievements(kid.id, state.transactions);

  // Wishes for this kid
  const wishes = state.wishListItems.filter(w => w.kidId === kid.id && w.status === 'active');

  return (
    <div className="min-h-dvh bg-kidzy-bg pb-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-kidzy-purple to-kidzy-blue text-white p-4 pb-8 rounded-b-3xl shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{'\u{2B50}'}</span>
            <span className="font-display font-bold text-lg">My Dashboard</span>
          </div>
          <button
            onClick={() => dispatch({ type: 'LOGOUT' })}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/15 rounded-full text-sm font-medium hover:bg-white/25 transition-colors"
          >
            <LogOut size={14} /> Exit
          </button>
        </div>

        <div className="text-center">
          <div className="relative inline-block">
            <Avatar src={kid.avatar} name={kid.name} size="xl" />
            {streak > 0 && (
              <span className="absolute -bottom-1 -right-1 bg-orange-500 text-white text-xs font-bold rounded-full w-8 h-8 flex items-center justify-center shadow-md">
                {'\u{1F525}'}{streak}
              </span>
            )}
          </div>
          <h1 className="text-3xl font-display font-bold mt-3">{kid.name}</h1>
          <div className="mt-2">
            <span className="text-5xl font-display font-bold">${balance}</span>
            <span className="text-white/70 text-lg ml-1">K$</span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3 px-4 -mt-4">
        <div className="bg-white rounded-2xl p-3 text-center shadow-md">
          <p className="text-green-600 font-bold text-lg">+${todayEarnings}</p>
          <p className="text-kidzy-gray text-xs">Today</p>
        </div>
        <div className="bg-white rounded-2xl p-3 text-center shadow-md">
          <p className="text-purple-600 font-bold text-lg">+${weeklyEarnings}</p>
          <p className="text-kidzy-gray text-xs">This Week</p>
        </div>
        <div className="bg-white rounded-2xl p-3 text-center shadow-md">
          <div className="flex items-center justify-center gap-1">
            <Flame size={16} className="text-orange-500" />
            <span className="text-orange-600 font-bold text-lg">{streak}</span>
          </div>
          <p className="text-kidzy-gray text-xs">Day Streak</p>
        </div>
      </div>

      {/* Streak info */}
      {longestStreak > 0 && (
        <div className="px-4 mt-4">
          <div className="bg-gradient-to-r from-orange-50 to-amber-50 border-2 border-orange-200 rounded-2xl p-3 flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-xl">{'\u{1F525}'}</div>
            <div className="flex-1">
              <p className="font-bold text-orange-800 text-sm">Best Streak: {longestStreak} days</p>
              <p className="text-orange-600 text-xs">{streak >= longestStreak && streak > 0 ? "You're at your best! Keep going!" : `${longestStreak - streak} more days to beat your record!`}</p>
            </div>
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
              const progress = Math.min(100, Math.round((balance / wish.targetDollars) * 100));
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

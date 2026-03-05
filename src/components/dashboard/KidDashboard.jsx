import { useKidzy, useKidzyDispatch } from '../../context/KidzyContext';
import { getKidBalance, getKidEarningsToday, getKidEarningsThisWeek, getStreak, getAchievements } from '../../utils/helpers';
import Avatar from '../shared/Avatar';
import DollarBadge from '../shared/DollarBadge';
import ProgressBar from '../shared/ProgressBar';
import { LogOut, Flame, Trophy, Target } from 'lucide-react';

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

  return (
    <div className="min-h-dvh bg-kidzy-bg pb-8">
      {/* Header — matches parent Dashboard gradient + glass style */}
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

        {/* Balance — centered, clean */}
        <div className="text-center mb-4">
          <p className="text-white/70 text-xs">My Savings</p>
          <div className="mt-1">
            <span className="text-5xl font-display font-bold">{balance}</span>
            <span className="text-white/70 text-lg ml-1">K$</span>
          </div>
        </div>

        {/* Stats — glass morphism matching parent dashboard */}
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

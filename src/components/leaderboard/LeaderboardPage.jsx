import { useKidzy } from '../../context/KidzyContext';
import { getWeeklyLeaderboard, getKidBalance } from '../../utils/helpers';
import Avatar from '../shared/Avatar';
import DollarBadge from '../shared/DollarBadge';
import { ArrowLeft, Trophy, Medal, Flame, TrendingUp, Crown } from 'lucide-react';

const RANK_STYLES = [
  { bg: 'from-yellow-400 to-amber-500', badge: '🥇', ring: 'ring-yellow-400' },
  { bg: 'from-gray-300 to-gray-400', badge: '🥈', ring: 'ring-gray-400' },
  { bg: 'from-amber-600 to-orange-700', badge: '🥉', ring: 'ring-amber-600' },
];

export default function LeaderboardPage({ onBack }) {
  const state = useKidzy();
  const leaderboard = getWeeklyLeaderboard(state.kids, state.transactions);

  if (state.kids.length === 0) {
    return (
      <div className="pb-24">
        <div className="bg-gradient-to-r from-amber-400 to-orange-500 text-white p-4 pb-8 rounded-b-3xl">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-2 bg-white/15 rounded-full"><ArrowLeft size={18} /></button>
            <h1 className="text-xl font-display font-bold">Leaderboard</h1>
          </div>
        </div>
        <div className="px-4 mt-8 text-center">
          <div className="text-5xl mb-3">🏆</div>
          <h3 className="font-display font-bold text-lg">No kids to compare yet!</h3>
          <p className="text-kidzy-gray text-sm">Add kids from the dashboard to see the leaderboard</p>
        </div>
      </div>
    );
  }

  const topKid = leaderboard[0];

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-400 to-orange-500 text-white p-4 pb-10 rounded-b-3xl">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={onBack} className="p-2 bg-white/15 rounded-full"><ArrowLeft size={18} /></button>
          <h1 className="text-xl font-display font-bold">Weekly Leaderboard</h1>
        </div>

        {/* Top Kid */}
        {topKid && state.kids.length > 1 && (
          <div className="text-center animate-bounce-in">
            <Crown size={32} className="mx-auto mb-2 text-yellow-200" />
            <div className="relative inline-block">
              <div className="ring-4 ring-yellow-300 rounded-full">
                <Avatar src={topKid.avatar} name={topKid.name} size="xl" />
              </div>
              <span className="absolute -bottom-1 -right-1 text-2xl">👑</span>
            </div>
            <h2 className="text-2xl font-display font-bold mt-2">{topKid.name}</h2>
            <p className="text-yellow-100">${topKid.weeklyNet} K$ this week</p>
          </div>
        )}
      </div>

      {/* Rankings */}
      <div className="px-4 -mt-4 space-y-3">
        {leaderboard.map((kid, index) => {
          const totalBalance = getKidBalance(kid.id, state.transactions);
          const rankStyle = RANK_STYLES[index] || null;

          return (
            <div
              key={kid.id}
              className={`bg-white rounded-2xl shadow-sm border-2 p-4 transition-all ${
                index === 0 && state.kids.length > 1 ? 'border-yellow-300 shadow-yellow-100' : 'border-gray-100'
              } ${index < 3 ? 'animate-bounce-in' : ''}`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-center gap-3">
                {/* Rank */}
                <div className="w-10 text-center">
                  {index < 3 ? (
                    <span className="text-2xl">{RANK_STYLES[index].badge}</span>
                  ) : (
                    <span className="text-xl font-bold text-kidzy-gray">#{index + 1}</span>
                  )}
                </div>

                <Avatar src={kid.avatar} name={kid.name} size="md" />

                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-kidzy-dark truncate">{kid.name}</h3>
                  <div className="flex items-center gap-2 text-xs text-kidzy-gray">
                    {kid.streak > 0 && (
                      <span className="flex items-center gap-0.5 text-orange-500">
                        <Flame size={12} className="animate-pulse-fire" />{kid.streak} day streak
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-bold text-kidzy-dark text-lg">+${kid.weeklyNet}</div>
                  <p className="text-xs text-kidzy-gray">Total: ${totalBalance}</p>
                </div>
              </div>

              {/* Breakdown bar */}
              <div className="mt-3 flex gap-2 items-center">
                <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden flex">
                  {kid.weeklyEarnings > 0 && (
                    <div
                      className="bg-green-400 h-2 rounded-full"
                      style={{ width: `${(kid.weeklyEarnings / (kid.weeklyEarnings + kid.weeklyDeductions || 1)) * 100}%` }}
                    />
                  )}
                  {kid.weeklyDeductions > 0 && (
                    <div
                      className="bg-red-400 h-2 rounded-full"
                      style={{ width: `${(kid.weeklyDeductions / (kid.weeklyEarnings + kid.weeklyDeductions || 1)) * 100}%` }}
                    />
                  )}
                </div>
                <div className="flex gap-2 text-xs">
                  <span className="text-green-600">+${kid.weeklyEarnings}</span>
                  <span className="text-red-500">-${kid.weeklyDeductions}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

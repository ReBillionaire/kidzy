import { useState } from 'react';
import Avatar from '../shared/Avatar';
import DollarBadge from '../shared/DollarBadge';
import { Plus, Minus, Gift, Flame, TrendingUp, ChevronRight, Trophy, Zap } from 'lucide-react';

export default function KidCard({ kid, balance, todayEarnings, weeklyEarnings, streak, longestStreak, dailyHigh, isNewHigh, onEarn, onDeduct, onViewRewards }) {
  const [pressed, setPressed] = useState(null);

  return (
    <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden border border-gray-100">
      {/* New Daily High Banner */}
      {isNewHigh && todayEarnings > 0 && (
        <div className="bg-gradient-to-r from-amber-400 to-orange-500 text-white px-4 py-2 text-center text-sm font-bold animate-bounce-in">
          <Trophy size={14} className="inline mr-1" /> New Daily Record! ${todayEarnings} K$ today!
        </div>
      )}

      {/* Kid Info */}
      <div className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <Avatar src={kid.avatar} name={kid.name} size="lg" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-display font-bold text-lg text-kidzy-dark truncate">{kid.name}</h3>
              {streak > 0 && (
                <span className="flex items-center gap-0.5 text-orange-500 text-sm font-bold">
                  <span className="animate-pulse-fire">🔥</span>{streak}
                </span>
              )}
            </div>
            {kid.age && <p className="text-kidzy-gray text-sm">Age {kid.age}</p>}
          </div>
          <div className="text-right">
            <DollarBadge amount={balance} size="lg" />
          </div>
        </div>

        {/* Today's stats */}
        <div className="grid grid-cols-2 gap-2 mb-2">
          <div className="bg-green-50 rounded-xl px-3 py-2 text-center">
            <p className="text-green-700 font-bold text-lg">+${todayEarnings}</p>
            <p className="text-green-600 text-xs">Today</p>
          </div>
          <div className="bg-purple-50 rounded-xl px-3 py-2 text-center">
            <p className="text-purple-700 font-bold text-lg">+${weeklyEarnings}</p>
            <p className="text-purple-600 text-xs">This Week</p>
          </div>
        </div>

        {/* Streak & Records Row */}
        <div className="flex gap-2 mb-3">
          {streak > 0 && (
            <div className="flex-1 bg-orange-50 rounded-lg px-2 py-1.5 flex items-center justify-center gap-1">
              <Flame size={12} className="text-orange-500" />
              <span className="text-xs font-semibold text-orange-700">{streak}d streak</span>
              {longestStreak > streak && (
                <span className="text-xs text-orange-400">(best: {longestStreak})</span>
              )}
            </div>
          )}
          {dailyHigh > 0 && (
            <div className="flex-1 bg-amber-50 rounded-lg px-2 py-1.5 flex items-center justify-center gap-1">
              <Zap size={12} className="text-amber-500" />
              <span className="text-xs font-semibold text-amber-700">Record: ${dailyHigh}/day</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={onEarn}
            onTouchStart={() => setPressed('earn')}
            onTouchEnd={() => setPressed(null)}
            className={`flex flex-col items-center gap-1 p-3 bg-gradient-to-br from-green-400 to-emerald-500 text-white rounded-xl font-semibold text-sm shadow-md hover:shadow-lg transition-all ${pressed === 'earn' ? 'scale-95' : 'hover:scale-105'}`}
          >
            <Plus size={20} />
            Earn
          </button>
          <button
            onClick={onDeduct}
            onTouchStart={() => setPressed('deduct')}
            onTouchEnd={() => setPressed(null)}
            className={`flex flex-col items-center gap-1 p-3 bg-gradient-to-br from-red-400 to-rose-500 text-white rounded-xl font-semibold text-sm shadow-md hover:shadow-lg transition-all ${pressed === 'deduct' ? 'scale-95' : 'hover:scale-105'}`}
          >
            <Minus size={20} />
            Deduct
          </button>
          <button
            onClick={onViewRewards}
            onTouchStart={() => setPressed('reward')}
            onTouchEnd={() => setPressed(null)}
            className={`flex flex-col items-center gap-1 p-3 bg-gradient-to-br from-purple-400 to-indigo-500 text-white rounded-xl font-semibold text-sm shadow-md hover:shadow-lg transition-all ${pressed === 'reward' ? 'scale-95' : 'hover:scale-105'}`}
          >
            <Gift size={20} />
            Rewards
          </button>
        </div>
      </div>
    </div>
  );
}

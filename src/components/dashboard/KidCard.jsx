import { useState } from 'react';
import Avatar from '../shared/Avatar';
import DollarBadge from '../shared/DollarBadge';
import StreakCalendar from './StreakCalendar';
import TodayChores from './TodayChores';
import { Plus, Minus, Gift, Flame, ChevronDown, ChevronUp } from 'lucide-react';

export default function KidCard({ kid, balance, todayEarnings, weeklyEarnings, streak, transactions, onEarn, onDeduct, onViewRewards, onManageChores }) {
  const [pressed, setPressed] = useState(null);
  const [showCalendar, setShowCalendar] = useState(false);

  return (
    <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden border border-gray-100">
      {/* Kid Info */}
      <div className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <Avatar src={kid.avatar} name={kid.name} size="lg" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-display font-bold text-lg text-kidzy-dark truncate">{kid.name}</h3>
              {streak > 0 && (
                <span className="flex items-center gap-0.5 text-orange-500 text-xs font-bold bg-orange-50 px-1.5 py-0.5 rounded-full">
                  <Flame size={12} />{streak}d
                </span>
              )}
            </div>
            {kid.age && <p className="text-kidzy-gray text-sm">Age {kid.age}</p>}
          </div>
          <div className="text-right">
            <DollarBadge amount={balance} size="lg" />
            <p className="text-kidzy-gray text-[10px] mt-0.5">savings</p>
          </div>
        </div>

        {/* Simple today/week stats */}
        <div className="flex gap-2 mb-3">
          <div className="flex-1 bg-green-50 rounded-xl px-3 py-2 text-center">
            <p className="text-green-700 font-bold text-sm">+{todayEarnings} K$</p>
            <p className="text-green-600 text-[10px]">Today</p>
          </div>
          <div className="flex-1 bg-purple-50 rounded-xl px-3 py-2 text-center">
            <p className="text-purple-700 font-bold text-sm">+{weeklyEarnings} K$</p>
            <p className="text-purple-600 text-[10px]">This Week</p>
          </div>
        </div>

        {/* Today's Chores — inline checklist */}
        <TodayChores kidId={kid.id} onManageChores={onManageChores} />

        {/* Action Buttons — clearer labels */}
        <div className="grid grid-cols-3 gap-2 mt-3">
          <button
            onClick={onEarn}
            onTouchStart={() => setPressed('earn')}
            onTouchEnd={() => setPressed(null)}
            className={`flex flex-col items-center gap-1 p-3 bg-gradient-to-br from-green-400 to-emerald-500 text-white rounded-xl font-semibold text-sm shadow-md hover:shadow-lg transition-all ${pressed === 'earn' ? 'scale-95' : 'hover:scale-105'}`}
          >
            <Plus size={20} />
            Award K$
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

        {/* Streak Calendar Toggle */}
        <button
          onClick={() => setShowCalendar(!showCalendar)}
          className="w-full mt-3 flex items-center justify-center gap-1 text-xs text-kidzy-gray hover:text-kidzy-purple transition-colors py-1"
        >
          {showCalendar ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          {showCalendar ? 'Hide' : 'Show'} Activity Calendar
        </button>

        {/* Streak Calendar */}
        {showCalendar && transactions && (
          <div className="mt-2">
            <StreakCalendar kidId={kid.id} transactions={transactions} streak={streak} />
          </div>
        )}
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useKidzy, useKidzyDispatch } from '../../context/KidzyContext';
import { getKidBalance, getKidEarningsToday, getStreak, getKidEarningsThisWeek } from '../../utils/helpers';
import KidCard from './KidCard';
import AddKidModal from './AddKidModal';
import QuickEarnModal from '../behaviors/QuickEarnModal';
import DeductModal from '../behaviors/DeductModal';
import { Plus, Trophy, TrendingUp, LogOut, Settings, Users, Target, ScrollText, Medal } from 'lucide-react';
import Avatar from '../shared/Avatar';

export default function Dashboard({ onNavigate }) {
  const state = useKidzy();
  const dispatch = useKidzyDispatch();
  const [showAddKid, setShowAddKid] = useState(false);
  const [showQuickEarn, setShowQuickEarn] = useState(null); // kidId
  const [showDeduct, setShowDeduct] = useState(null); // kidId
  const currentParent = state.parents.find(p => p.id === state.currentParentId);

  const totalFamilyDollars = state.kids.reduce((sum, kid) => sum + getKidBalance(kid.id, state.transactions), 0);
  const todayEarnings = state.kids.reduce((sum, kid) => sum + getKidEarningsToday(kid.id, state.transactions), 0);

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-kidzy-purple to-kidzy-blue text-white p-4 pb-8 rounded-b-3xl shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Avatar src={currentParent?.avatar} name={currentParent?.name || '?'} size="sm" />
            <div>
              <p className="text-white/80 text-xs">Welcome back</p>
              <p className="font-bold">{currentParent?.name}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => onNavigate('settings')} className="p-2 bg-white/15 rounded-full hover:bg-white/25 transition-colors">
              <Settings size={18} />
            </button>
            <button onClick={() => dispatch({ type: 'LOGOUT' })} className="p-2 bg-white/15 rounded-full hover:bg-white/25 transition-colors">
              <LogOut size={18} />
            </button>
          </div>
        </div>

        <div className="text-center mb-2">
          <h1 className="text-2xl font-display font-bold">{state.family.name}</h1>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-3 text-center">
            <p className="text-3xl font-bold font-display">${totalFamilyDollars}</p>
            <p className="text-white/80 text-xs">Family K$ Balance</p>
          </div>
          <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-3 text-center">
            <p className="text-3xl font-bold font-display">+${todayEarnings}</p>
            <p className="text-white/80 text-xs">Earned Today</p>
          </div>
        </div>
      </div>

      {/* Quick Nav */}
      <div className="flex gap-2 overflow-x-auto px-4 -mt-4 pb-2 no-scrollbar">
        {[
          { icon: <Medal size={16} />, label: 'Leaderboard', nav: 'leaderboard', color: 'from-amber-400 to-orange-500' },
          { icon: <Target size={16} />, label: 'Wish Lists', nav: 'rewards', color: 'from-pink-400 to-rose-500' },
          { icon: <ScrollText size={16} />, label: 'Activity', nav: 'activity', color: 'from-blue-400 to-indigo-500' },
          { icon: <Users size={16} />, label: 'Family', nav: 'settings', color: 'from-teal-400 to-cyan-500' },
        ].map((item, i) => (
          <button
            key={i}
            onClick={() => onNavigate(item.nav)}
            className={`flex items-center gap-2 bg-gradient-to-r ${item.color} text-white px-4 py-2.5 rounded-xl shadow-md text-sm font-semibold whitespace-nowrap hover:shadow-lg hover:scale-105 transition-all`}
          >
            {item.icon} {item.label}
          </button>
        ))}
      </div>

      {/* Kids */}
      <div className="px-4 mt-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-display font-bold text-kidzy-dark">Your Kids</h2>
          <button
            onClick={() => setShowAddKid(true)}
            className="flex items-center gap-1 text-sm font-semibold text-kidzy-purple hover:text-kidzy-purple-dark transition-colors"
          >
            <Plus size={16} /> Add Kid
          </button>
        </div>

        {state.kids.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl shadow-sm">
            <div className="text-5xl mb-3">👶</div>
            <h3 className="text-lg font-display font-bold text-kidzy-dark mb-1">No kids yet!</h3>
            <p className="text-kidzy-gray text-sm mb-4">Add your first child to start tracking</p>
            <button
              onClick={() => setShowAddKid(true)}
              className="bg-gradient-to-r from-kidzy-purple to-kidzy-blue text-white font-bold py-2.5 px-6 rounded-xl shadow-md hover:shadow-lg transition-all"
            >
              <Plus size={16} className="inline mr-1" /> Add Your First Kid
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {state.kids.map(kid => (
              <KidCard
                key={kid.id}
                kid={kid}
                balance={getKidBalance(kid.id, state.transactions)}
                todayEarnings={getKidEarningsToday(kid.id, state.transactions)}
                weeklyEarnings={getKidEarningsThisWeek(kid.id, state.transactions)}
                streak={getStreak(kid.id, state.transactions)}
                onEarn={() => setShowQuickEarn(kid.id)}
                onDeduct={() => setShowDeduct(kid.id)}
                onViewRewards={() => onNavigate('rewards', kid.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <AddKidModal isOpen={showAddKid} onClose={() => setShowAddKid(false)} />
      {showQuickEarn && (
        <QuickEarnModal kidId={showQuickEarn} isOpen={!!showQuickEarn} onClose={() => setShowQuickEarn(null)} />
      )}
      {showDeduct && (
        <DeductModal kidId={showDeduct} isOpen={!!showDeduct} onClose={() => setShowDeduct(null)} />
      )}
    </div>
  );
}

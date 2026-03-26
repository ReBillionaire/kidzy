import { useState, useMemo } from 'react';
import { useKidzy, useKidzyDispatch } from '../../context/KidzyContext';
import { useAuth } from '../../context/AuthContext';
import { getKidBalance, getKidEarningsToday, getStreak, getKidEarningsThisWeek } from '../../utils/helpers';
import KidCard from './KidCard';
import AddKidModal from './AddKidModal';
import DailyChallenges from './DailyChallenges';
import QuickEarnModal from '../behaviors/QuickEarnModal';
import DeductModal from '../behaviors/DeductModal';
import { Plus, LogOut, Settings, Users, Target, ScrollText, Medal, Star, Trophy, Flame } from 'lucide-react';
import Avatar from '../shared/Avatar';

export default function Dashboard({ onNavigate }) {
  const state = useKidzy();
  const dispatch = useKidzyDispatch();
  const { signOut } = useAuth();
  const [showAddKid, setShowAddKid] = useState(false);
  const [showQuickEarn, setShowQuickEarn] = useState(null);
  const [showDeduct, setShowDeduct] = useState(null);
  const currentParent = state.parents.find(p => p.id === state.currentParentId);
  const isKidMode = !!state.kidMode;
  const currentKid = isKidMode ? state.kids.find(k => k.id === state.kidMode) : null;

  const kidStats = useMemo(() => {
    return state.kids.map(kid => ({
      kid,
      balance: getKidBalance(kid.id, state.transactions),
      todayEarnings: getKidEarningsToday(kid.id, state.transactions),
      weeklyEarnings: getKidEarningsThisWeek(kid.id, state.transactions),
      streak: getStreak(kid.id, state.transactions),
    }));
  }, [state.kids, state.transactions]);

  const totalFamilyDollars = useMemo(() => kidStats.reduce((sum, s) => sum + s.balance, 0), [kidStats]);
  const todayEarnings = useMemo(() => kidStats.reduce((sum, s) => sum + s.todayEarnings, 0), [kidStats]);

  // Kid-specific stats
  const myStats = useMemo(() => {
    if (!currentKid) return null;
    return kidStats.find(s => s.kid.id === currentKid.id);
  }, [currentKid, kidStats]);

  const handleSwitchProfile = () => {
    dispatch({ type: 'LOGOUT' });
  };

  const handleLogout = async () => {
    dispatch({ type: 'LOGOUT' });
    await signOut();
  };

  // ── Kid Mode Dashboard ─────────────────────────────────────────────────────────
  if (isKidMode && currentKid) {
    return (
      <div className="pb-24">
        {/* Kid Header */}
        <div className="bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-500 text-white p-4 pb-8 rounded-b-3xl shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Avatar src={currentKid.avatar} name={currentKid.name} size="sm" />
              <div>
                <p className="text-white/80 text-xs">Hey there!</p>
                <p className="font-bold text-lg">{currentKid.name}</p>
              </div>
            </div>
            <button onClick={handleSwitchProfile} className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors" title="Switch Profile">
              <Users size={18} />
            </button>
          </div>

          <div className="text-center mb-2">
            <h1 className="text-2xl font-display font-bold">{state.family.name}</h1>
          </div>

          {/* Kid Stats */}
          <div className="grid grid-cols-3 gap-2 mt-4">
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-3 text-center">
              <p className="text-2xl font-bold font-display">${myStats?.balance || 0}</p>
              <p className="text-white/80 text-[10px]">My K$</p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-3 text-center">
              <p className="text-2xl font-bold font-display">+${myStats?.todayEarnings || 0}</p>
              <p className="text-white/80 text-[10px]">Today</p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-3 text-center flex flex-col items-center justify-center">
              <div className="flex items-center gap-1">
                <Flame size={16} className="text-yellow-200" />
                <p className="text-2xl font-bold font-display">{myStats?.streak || 0}</p>
              </div>
              <p className="text-white/80 text-[10px]">Streak</p>
            </div>
          </div>
        </div>

        {/* Quick Nav */}
        <div className="flex gap-2 overflow-x-auto px-4 -mt-4 pb-2 no-scrollbar">
          {[
            { icon: <Medal size={16} />, label: 'Leaderboard', nav: 'leaderboard', color: 'from-amber-400 to-orange-500' },
            { icon: <Target size={16} />, label: 'My Wish List', nav: 'rewards', color: 'from-pink-400 to-rose-500' },
            { icon: <ScrollText size={16} />, label: 'Activity', nav: 'activity', color: 'from-blue-400 to-indigo-500' },
          ].map((item, i) => (
            <button
              key={i}
              onClick={() => onNavigate(item.nav, currentKid.id)}
              className={`flex items-center gap-2 bg-gradient-to-r ${item.color} text-white px-4 py-2.5 rounded-xl shadow-md text-sm font-semibold whitespace-nowrap hover:shadow-lg hover:scale-105 transition-all`}
            >
              {item.icon} {item.label}
            </button>
          ))}
        </div>

        {/* Daily Challenges for this kid */}
        <div className="px-4 mt-4">
          <DailyChallenges kidId={currentKid.id} />
        </div>

        {/* Weekly Summary Card */}
        <div className="px-4 mt-4">
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <h2 className="text-lg font-display font-bold text-kidzy-dark mb-3 flex items-center gap-2">
              <Star size={18} className="text-yellow-500" /> My Progress
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-kidzy-purple">${myStats?.weeklyEarnings || 0}</p>
                <p className="text-xs text-kidzy-gray">This Week</p>
              </div>
              <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-xl p-3 text-center">
                <div className="flex items-center justify-center gap-1">
                  <Trophy size={18} className="text-amber-500" />
                  <p className="text-2xl font-bold text-amber-600">
                    #{kidStats.sort((a, b) => b.balance - a.balance).findIndex(s => s.kid.id === currentKid.id) + 1}
                  </p>
                </div>
                <p className="text-xs text-kidzy-gray">Rank</p>
              </div>
            </div>
          </div>
        </div>

        {/* Savings Goal Motivation */}
        <div className="px-4 mt-4">
          <div className="bg-gradient-to-r from-kidzy-purple/5 to-kidzy-blue/5 border-2 border-dashed border-kidzy-purple/20 rounded-2xl p-4 text-center">
            <p className="text-3xl mb-2">&#127919;</p>
            <p className="font-display font-bold text-kidzy-dark">Keep going, {currentKid.name}!</p>
            <p className="text-sm text-kidzy-gray mt-1">Complete tasks to earn more K$ and climb the leaderboard!</p>
            <button
              onClick={() => onNavigate('rewards', currentKid.id)}
              className="mt-3 bg-gradient-to-r from-kidzy-purple to-kidzy-blue text-white font-bold py-2 px-5 rounded-xl text-sm shadow-md hover:shadow-lg transition-all"
            >
              View My Wish List
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Parent Mode Dashboard ──────────────────────────────────────────────────────
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
            <button onClick={() => onNavigate('settings')} className="p-2 bg-white/15 rounded-full hover:bg-white/25 transition-colors" title="Settings">
              <Settings size={18} />
            </button>
            <button onClick={handleSwitchProfile} className="p-2 bg-white/15 rounded-full hover:bg-white/25 transition-colors" title="Switch Profile">
              <Users size={18} />
            </button>
            <button onClick={handleLogout} className="p-2 bg-white/15 rounded-full hover:bg-white/25 transition-colors" title="Sign Out">
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

      {/* Daily Challenges */}
      {state.kids.length > 0 && (
        <div className="px-4 mt-4">
          <DailyChallenges kidId={state.kids[0].id} />
        </div>
      )}

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
            <div className="text-5xl mb-3">&#128118;</div>
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
            {kidStats.map(({ kid, balance, todayEarnings: te, weeklyEarnings: we, streak }) => (
              <KidCard
                key={kid.id}
                kid={kid}
                balance={balance}
                todayEarnings={te}
                weeklyEarnings={we}
                streak={streak}
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

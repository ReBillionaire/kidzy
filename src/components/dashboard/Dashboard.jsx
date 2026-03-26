import { useState, useMemo } from 'react';
import { useKidzy, useKidzyDispatch } from '../../context/KidzyContext';
import { useAuth } from '../../context/AuthContext';
import { getKidBalance, getKidEarningsToday, getStreak, getKidEarningsThisWeek, getKidDeductionsThisWeek, getAchievements, getWishListProgress, getCompletedBehaviorsToday } from '../../utils/helpers';
import KidCard from './KidCard';
import AddKidModal from './AddKidModal';
import DailyChallenges from './DailyChallenges';
import QuickEarnModal from '../behaviors/QuickEarnModal';
import DeductModal from '../behaviors/DeductModal';
import { Plus, LogOut, Settings, Users, Target, ScrollText, Medal, Star, Trophy, Flame, Gift, TrendingUp } from 'lucide-react';
import Avatar from '../shared/Avatar';

export default function Dashboard({ onNavigate }) {
  const state = useKidzy();
  const dispatch = useKidzyDispatch();
  const { signOut } = useAuth();
  const [showAddKid, setShowAddKid] = useState(false);
  const [showQuickEarn, setShowQuickEarn] = useState(null);
  const [showDeduct, setShowDeduct] = useState(null);
  const parents = Array.isArray(state.parents) ? state.parents : [];
  const kids = Array.isArray(state.kids) ? state.kids : [];
  const currentParent = parents.find(p => p.id === state.currentParentId);
  const isKidMode = !!state.kidMode;
  const currentKid = isKidMode ? kids.find(k => k.id === state.kidMode) : null;

  const transactions = Array.isArray(state.transactions) ? state.transactions : [];

  const kidStats = useMemo(() => {
    return kids.map(kid => ({
      kid,
      balance: getKidBalance(kid.id, transactions),
      todayEarnings: getKidEarningsToday(kid.id, transactions),
      weeklyEarnings: getKidEarningsThisWeek(kid.id, transactions),
      streak: getStreak(kid.id, transactions),
    }));
  }, [kids, transactions]);

  const totalFamilyDollars = useMemo(() => kidStats.reduce((sum, s) => sum + s.balance, 0), [kidStats]);
  const todayEarnings = useMemo(() => kidStats.reduce((sum, s) => sum + s.todayEarnings, 0), [kidStats]);

  // Kid-mode computed data
  const myStats = useMemo(() => {
    if (!currentKid) return null;
    return kidStats.find(s => s.kid.id === currentKid.id);
  }, [currentKid, kidStats]);

  const myAchievements = useMemo(() => {
    if (!currentKid) return [];
    return getAchievements(currentKid.id, transactions);
  }, [currentKid, transactions]);

  const myWishList = useMemo(() => {
    if (!currentKid) return [];
    return (state.wishListItems || []).filter(w => w.kidId === currentKid.id && w.status === 'active');
  }, [currentKid, state.wishListItems]);

  const myCompletedToday = useMemo(() => {
    if (!currentKid) return [];
    return getCompletedBehaviorsToday(currentKid.id, transactions);
  }, [currentKid, transactions]);

  const handleSwitchProfile = () => {
    dispatch({ type: 'LOGOUT' });
  };

  const handleLogout = async () => {
    dispatch({ type: 'LOGOUT' });
    await signOut();
  };

  // Ã¢ÂÂÃ¢ÂÂ Kid Mode Dashboard Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂ
  if (isKidMode && currentKid) {
    const safeAchievements = Array.isArray(myAchievements) ? myAchievements : [];
    const unlockedBadges = safeAchievements.filter(a => a.progress >= a.target);
    const nextBadge = safeAchievements.find(a => a.progress < a.target);
    const balance = myStats?.balance || 0;

    return (
      <div className="pb-24">
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
          <div className="grid grid-cols-3 gap-2 mt-4">
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-3 text-center">
              <p className="text-2xl font-bold font-display">${balance}</p>
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

        <div className="flex gap-2 overflow-x-auto px-4 -mt-4 pb-2 no-scrollbar">
          {[
            { icon: <Medal size={16} />, label: 'Leaderboard', nav: 'leaderboard', color: 'from-amber-400 to-orange-500' },
            { icon: <Gift size={16} />, label: 'My Rewards', nav: 'rewards', color: 'from-pink-400 to-rose-500' },
            { icon: <ScrollText size={16} />, label: 'Activity', nav: 'activity', color: 'from-blue-400 to-indigo-500' },
          ].map((item, i) => (
            <button key={i} onClick={() => onNavigate(item.nav)}
              className={`flex items-center gap-2 bg-gradient-to-r ${item.color} text-white px-4 py-2.5 rounded-xl shadow-md text-sm font-semibold whitespace-nowrap hover:shadow-lg hover:scale-105 transition-all`}
            >{item.icon} {item.label}</button>))}
        </div>

        <div className="px-4 mt-4">
          <DailyChallenges kidId={currentKid.id} />
        </div>

        {/* Wish List Progress */}
        {myWishList.length > 0 && (
          <div className="px-4 mt-4">
            <div className="bg-white rounded-2xl shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-display font-bold text-kidzy-dark flex items-center gap-2">
                  <Gift size={18} className="text-pink-500" /> My Wish List
                </h2>
                <button onClick={() => onNavigate('rewards')} className="text-xs font-semibold text-kidzy-purple">View All</button>
              </div>
              <div className="space-y-3">
                {myWishList.slice(0, 3).map(wish => {
                  const progress = getWishListProgress(wish, balance);
                  return (
                    <div key={wish.id} className="flex items-center gap-3">
                      <span className="text-2xl">{wish.icon || '\u{1F381}'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-kidzy-dark truncate">{wish.name}</p>
                        <div className="w-full bg-gray-100 rounded-full h-2 mt-1">
                          <div
                            className={`h-2 rounded-full transition-all ${progress >= 100 ? 'bg-green-400' : 'bg-gradient-to-r from-kidzy-purple to-kidzy-blue'}`}
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-xs font-bold text-kidzy-gray whitespace-nowrap">${balance}/{wish.targetDollars}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <div className="px-4 mt-4">
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-display font-bold text-kidzy-dark flex items-center gap-2">
                <Trophy size={18} className="text-amber-500" /> My Badges
              </h2>
              <span className="text-xs font-bold text-kidzy-purple">{unlockedBadges.length}/{safeAchievements.length}</span>
            </div>
            {unlockedBadges.length > 0 ? (
              <div className="flex flex-wrap gap-2 mb-3">
                {unlockedBadges.map(badge => (
                  <div key={badge.id} className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5">
                    <span className="text-lg">{badge.icon}</span>
                    <span className="text-xs font-semibold text-amber-700">{badge.name}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-kidzy-gray mb-3">Complete tasks to earn your first badge!</p>
            )}
            {nextBadge && (
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-kidzy-gray mb-1">Next badge:</p>
                <div className="flex items-center gap-2">
                  <span className="text-xl opacity-40">{nextBadge.icon}</span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-kidzy-dark">{nextBadge.name}</p>
                    <p className="text-xs text-kidzy-gray">{nextBadge.desc}</p>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                      <div
                        className="h-1.5 rounded-full bg-gradient-to-r from-kidzy-purple to-kidzy-blue transition-all"
                        style={{ width: `${(nextBadge.progress / nextBadge.target) * 100}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-xs font-bold text-kidzy-gray">{nextBadge.progress}/{nextBadge.target}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="px-4 mt-4">
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <h2 className="text-lg font-display font-bold text-kidzy-dark mb-3 flex items-center gap-2">
              <TrendingUp size={18} className="text-green-500" /> This Week
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-green-600">+${myStats?.weeklyEarnings || 0}</p>
                <p className="text-xs text-kidzy-gray">Earned</p>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-kidzy-purple">{myCompletedToday.length}</p>
                <p className="text-xs text-kidzy-gray">Tasks Today</p>
              </div>
            </div>
          </div>
        </div>

        {myWishList.length === 0 && (
          <div className="px-4 mt-4">
            <div className="bg-gradient-to-r from-kidzy-purple/5 to-kidzy-blue/5 border-2 border-dashed border-kidzy-purple/20 rounded-2xl p-4 text-center">
              <p className="text-3xl mb-2">&#127873;</p>
              <p className="font-display font-bold text-kidzy-dark">Add a wish, {currentKid.name}!</p>
              <p className="text-sm text-kidzy-gray mt-1">Save up K$ for something awesome</p>
              <button
                onClick={() => onNavigate('rewards')}
                className="mt-3 bg-gradient-to-r from-kidzy-purple to-kidzy-blue text-white font-bold py-2 px-5 rounded-xl text-sm shadow-md hover:shadow-lg transition-all"
              >Add a Wish</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Ã¢ÂÂÃ¢ÂÂ Parent Mode Dashboard Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂ
  return (
    <div className="pb-24">
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

      <div className="flex gap-2 overflow-x-auto px-4 -mt-4 pb-2 no-scrollbar">
        {[
          { icon: <Medal size={16} />, label: 'Leaderboard', nav: 'leaderboard', color: 'from-amber-400 to-orange-500' },
          { icon: <Target size={16} />, label: 'Wish Lists', nav: 'rewards', color: 'from-pink-400 to-rose-500' },
          { icon: <ScrollText size={16} />, label: 'Activity', nav: 'activity', color: 'from-blue-400 to-indigo-500' },
          { icon: <Users size={16} />, label: 'Family', nav: 'settings', color: 'from-teal-400 to-cyan-500' },
        ].map((item, i) => (
          <button key={i} onClick={() => onNavigate(item.nav)}
            className={`flex items-center gap-2 bg-gradient-to-r ${item.color} text-white px-4 py-2.5 rounded-xl shadow-md text-sm font-semibold whitespace-nowrap hover:shadow-lg hover:scale-105 transition-all`}
          >{item.icon} {item.label}</button>))}
      </div>

      {kids.length > 0 && (
        <div className="px-4 mt-4">
          <DailyChallenges kidId={kids[0].id} />
        </div>
      )}

      <div className="px-4 mt-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-display font-bold text-kidzy-dark">Your Kids</h2>
          <button onClick={() => setShowAddKid(true)}
            className="flex items-center gap-1 text-sm font-semibold text-kidzy-purple hover:text-kidzy-purple-dark transition-colors"
          ><Plus size={16} /> Add Kid</button>
        </div>

        {kids.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl shadow-sm">
            <div className="text-5xl mb-3">&#128118;</div>
            <h3 className="text-lg font-display font-bold text-kidzy-dark mb-1">No kids yet!</h3>
            <p className="text-kidzy-gray text-sm mb-4">Add your first child to start tracking</p>
            <button onClick={() => setShowAddKid(true)}
              className="bg-gradient-to-r from-kidzy-purple to-kidzy-blue text-white font-bold py-2.5 px-6 rounded-xl shadow-md hover:shadow-lg transition-all"
            ><Plus size={16} className="inline mr-1" /> Add Your First Kid</button>
          </div>
        ) : (
          <div className="space-y-4">
            {kidStats.map(({ kid, balance, todayEarnings: te, weeklyEarnings: we, streak }) => (
              <KidCard key={kid.id} kid={kid} balance={balance} todayEarnings={te}
                weeklyEarnings={we} streak={streak}
                onEarn={() => setShowQuickEarn(kid.id)}
                onDeduct={() => setShowDeduct(kid.id)}
                onViewRewards={() => onNavigate('rewards', kid.id)} />
            ))}
          </div>
        )}
      </div>

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

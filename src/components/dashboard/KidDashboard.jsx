import { useState, useMemo, useEffect, useRef } from 'react';
import { useKidzy, useKidzyDispatch } from '../../context/KidzyContext';
import { getKidBalance, getKidEarningsToday, getKidEarningsThisWeek, getStreak, getAchievements, isDueToday, isCompletedToday } from '../../utils/helpers';
import { playCoinSound, playBonusSound, playAchievementSound, vibrateEarn } from '../../utils/sounds';
import Avatar from '../shared/Avatar';
import DollarBadge from '../shared/DollarBadge';
import ProgressBar from '../shared/ProgressBar';
import ConfettiEffect from '../shared/ConfettiEffect';
import { LogOut, Flame, Trophy, Target, CheckCircle2, Circle, ClipboardList, Sparkles, Star, Zap, Gift, ChevronUp, Crown, TrendingUp, Clock } from 'lucide-react';

// Calculate level and XP from balance
function getLevelInfo(balance) {
  // Level thresholds: 0-9 = L1, 10-24 = L2, 25-49 = L3, 50-99 = L4, 100-199 = L5, etc.
  const thresholds = [0, 10, 25, 50, 100, 200, 350, 500, 750, 1000, 1500, 2000, 3000, 5000, 10000];
  let level = 1;
  let xpInLevel = balance;
  let xpForNextLevel = thresholds[1];

  for (let i = 1; i < thresholds.length; i++) {
    if (balance >= thresholds[i]) {
      level = i + 1;
      xpInLevel = balance - thresholds[i];
      xpForNextLevel = (thresholds[i + 1] || thresholds[i] * 2) - thresholds[i];
    } else {
      xpInLevel = balance - (thresholds[i - 1] || 0);
      xpForNextLevel = thresholds[i] - (thresholds[i - 1] || 0);
      break;
    }
  }

  const xpPercent = Math.min(100, Math.round((xpInLevel / xpForNextLevel) * 100));

  const titles = ['Beginner', 'Explorer', 'Helper', 'Star', 'Champion', 'Hero', 'Legend', 'Master', 'Grand Master', 'Ultimate', 'Mythic', 'Cosmic', 'Galactic', 'Universal', 'GOAT'];
  const title = titles[Math.min(level - 1, titles.length - 1)];

  return { level, xpInLevel, xpForNextLevel, xpPercent, title };
}

// Fun time-based greeting
function getTimeGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

// Animated counter component
function AnimatedCounter({ value, className = '' }) {
  const [display, setDisplay] = useState(value);
  const prevRef = useRef(value);

  useEffect(() => {
    const prev = prevRef.current;
    if (prev === value) return;
    prevRef.current = value;

    const diff = value - prev;
    const steps = Math.min(Math.abs(diff), 20);
    const stepValue = diff / steps;
    let current = prev;
    let step = 0;

    const interval = setInterval(() => {
      step++;
      current += stepValue;
      setDisplay(Math.round(current));
      if (step >= steps) {
        clearInterval(interval);
        setDisplay(value);
      }
    }, 40);

    return () => clearInterval(interval);
  }, [value]);

  return <span className={className}>{display}</span>;
}

// Floating +K$ animation
function FloatingReward({ amount, onDone }) {
  useEffect(() => {
    const timer = setTimeout(onDone, 1500);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-50 animate-float-up pointer-events-none">
      <span className="text-lg font-display font-black text-kidzy-green drop-shadow-lg">
        +{amount} K$
      </span>
    </div>
  );
}

export default function KidDashboard() {
  const state = useKidzy();
  const dispatch = useKidzyDispatch();
  const kid = state.kids.find(k => k.id === state.kidMode);
  const [showConfetti, setShowConfetti] = useState(false);
  const [floatingRewards, setFloatingRewards] = useState([]);
  const [justCompleted, setJustCompleted] = useState(null);
  const [showBadgeDetail, setShowBadgeDetail] = useState(null);
  const lastActionRef = useRef(0);

  const soundEnabled = state.settings?.soundEnabled !== false;
  const hapticEnabled = state.settings?.hapticEnabled !== false;
  const completions = state.choreCompletions || [];
  const pendingCompletions = state.pendingChoreCompletions || [];

  if (!kid) {
    return (
      <div className="min-h-dvh bg-gradient-to-br from-indigo-900 via-purple-900 to-violet-900 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl p-6 text-center max-w-sm w-full animate-bounce-in">
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
  const levelInfo = getLevelInfo(balance);

  // Wishes for this kid
  const wishes = state.wishListItems.filter(w => w.kidId === kid.id && w.status === 'active');

  // Today's chores for this kid
  const chores = (state.chores || []).filter(c => c.kidId === kid.id);
  const todayChores = chores.filter(isDueToday);
  const today = new Date().toISOString().split('T')[0];

  // Check if a chore is pending today
  const isPendingToday = (choreId) => {
    return pendingCompletions.some(p => p.choreId === choreId && p.date === today);
  };

  const choresDone = todayChores.filter(c => isCompletedToday(c.id, completions)).length;
  const choresTotal = todayChores.length;
  const choresPercent = choresTotal > 0 ? Math.round((choresDone / choresTotal) * 100) : 0;

  const handleCompleteChore = (chore) => {
    // Debounce check
    const now = Date.now();
    if (now - lastActionRef.current < 1000) return;
    lastActionRef.current = now;

    // Check if already completed or pending
    if (isCompletedToday(chore.id, completions) || isPendingToday(chore.id)) return;

    // Dispatch pending approval instead of immediate completion
    dispatch({
      type: 'COMPLETE_CHORE_PENDING',
      payload: { choreId: chore.id, kidId: kid.id, date: today }
    });

    // Visual feedback
    setJustCompleted(chore.id);
    setTimeout(() => setJustCompleted(null), 1000);

    // Floating reward showing it's pending
    const id = Date.now();
    setFloatingRewards(prev => [...prev, { id, amount: chore.dollarValue }]);

    if (soundEnabled) playCoinSound();
    if (hapticEnabled) vibrateEarn();
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 2000);
  };

  const removeFloatingReward = (id) => {
    setFloatingRewards(prev => prev.filter(r => r.id !== id));
  };

  return (
    <div className="min-h-dvh bg-kidzy-bg pb-8 max-w-lg md:max-w-2xl lg:max-w-4xl mx-auto md:shadow-xl md:border-x md:border-gray-100">
      <ConfettiEffect active={showConfetti} />

      {/* ===== HERO HEADER — Gamified with Level System ===== */}
      <div className="bg-gradient-to-br from-indigo-900 via-purple-800 to-violet-900 text-white px-4 md:px-6 pt-4 pb-6 rounded-b-[2rem] shadow-xl relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl" />

        {/* Top row: avatar + name + logout */}
        <div className="flex items-center justify-between mb-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar src={kid.avatar} name={kid.name} size="md" />
              {/* Level badge */}
              <div className="absolute -bottom-1 -right-1 bg-yellow-400 text-yellow-900 text-[10px] font-black rounded-full w-5 h-5 flex items-center justify-center border-2 border-indigo-900">
                {levelInfo.level}
              </div>
            </div>
            <div>
              <p className="text-white/60 text-xs">{getTimeGreeting()}</p>
              <p className="font-display font-bold text-lg">{kid.name}</p>
            </div>
          </div>
          <button
            onClick={() => dispatch({ type: 'LOGOUT' })}
            className="p-2.5 bg-white/10 backdrop-blur-sm rounded-xl hover:bg-white/20 transition-colors"
            aria-label="Exit"
          >
            <LogOut size={16} />
          </button>
        </div>

        {/* Level progress bar */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 mb-4 relative z-10">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-lg flex items-center justify-center shadow-md">
                <Crown size={14} className="text-yellow-900" />
              </div>
              <div>
                <p className="text-white font-bold text-sm">Level {levelInfo.level}</p>
                <p className="text-white/50 text-[10px] font-medium">{levelInfo.title}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-white/70 text-[10px]">{levelInfo.xpInLevel} / {levelInfo.xpForNextLevel} K$</p>
            </div>
          </div>
          <div className="h-2.5 bg-black/20 rounded-full overflow-hidden">
            <div
              className="h-2.5 rounded-full bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-400 transition-all duration-700 relative overflow-hidden"
              style={{ width: `${levelInfo.xpPercent}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[shine_2s_infinite]" />
            </div>
          </div>
        </div>

        {/* Balance — BIG and proud */}
        <div className="text-center mb-4 relative z-10">
          <p className="text-white/50 text-xs font-medium uppercase tracking-wider">My K$ Balance</p>
          <div className="mt-1 flex items-center justify-center gap-2">
            <span className="text-5xl font-display font-black">
              <AnimatedCounter value={balance} />
            </span>
            <div className="flex flex-col items-start">
              <span className="text-white/40 text-sm font-bold">K$</span>
              {todayEarnings > 0 && (
                <span className="text-kidzy-green text-xs font-bold flex items-center gap-0.5">
                  <TrendingUp size={10} /> +{todayEarnings}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 relative z-10">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-2.5 text-center">
            <div className="flex items-center justify-center gap-1 text-yellow-300">
              <Zap size={14} />
              <span className="text-xl font-black font-display">+{todayEarnings}</span>
            </div>
            <p className="text-white/40 text-[10px] font-medium">Today</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-2.5 text-center">
            <div className="flex items-center justify-center gap-1 text-cyan-300">
              <Star size={14} />
              <span className="text-xl font-black font-display">+{weeklyEarnings}</span>
            </div>
            <p className="text-white/40 text-[10px] font-medium">This Week</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-2.5 text-center">
            <div className="flex items-center justify-center gap-1 text-orange-300">
              <Flame size={14} className={streak >= 3 ? 'animate-pulse-fire' : ''} />
              <span className="text-xl font-black font-display">{streak}</span>
            </div>
            <p className="text-white/40 text-[10px] font-medium">Streak</p>
          </div>
        </div>
      </div>

      {/* ===== TODAY'S MISSIONS (not "tasks") ===== */}
      {todayChores.length > 0 && (
        <div className="px-4 md:px-6 mt-5">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Mission header */}
            <div className="bg-gradient-to-r from-kidzy-purple/5 to-kidzy-blue/5 p-4 pb-3">
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-display font-bold text-kidzy-dark flex items-center gap-2">
                  <div className="w-7 h-7 bg-gradient-to-br from-kidzy-purple to-kidzy-blue rounded-lg flex items-center justify-center">
                    <Zap size={14} className="text-white" />
                  </div>
                  Today's Missions
                </h2>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-kidzy-purple">{choresDone}/{choresTotal}</span>
                  {choresPercent === 100 && choresTotal > 0 && (
                    <span className="text-sm animate-bounce-in">{'\u{1F389}'}</span>
                  )}
                </div>
              </div>

              {/* XP-style progress bar */}
              <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-3 rounded-full transition-all duration-700 relative overflow-hidden ${
                    choresPercent === 100
                      ? 'bg-gradient-to-r from-emerald-400 to-green-500'
                      : 'bg-gradient-to-r from-kidzy-purple to-kidzy-blue'
                  }`}
                  style={{ width: `${choresPercent}%` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[shine_2s_infinite]" />
                </div>
              </div>
            </div>

            {/* All done celebration */}
            {choresPercent === 100 && choresTotal > 0 && (
              <div className="mx-4 mt-2 mb-1 text-center py-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                <p className="text-lg font-display font-bold text-green-700">{'\u{1F31F}'} ALL MISSIONS COMPLETE!</p>
                <p className="text-green-600 text-xs">You're a true champion today!</p>
              </div>
            )}

            {/* Chore list */}
            <div className="p-3 space-y-1.5">
              {todayChores.map(chore => {
                const done = isCompletedToday(chore.id, completions);
                const pending = isPendingToday(chore.id);
                const isJustDone = justCompleted === chore.id;
                return (
                  <div key={chore.id} className="relative">
                    {isJustDone && floatingRewards.map(r => (
                      <FloatingReward key={r.id} amount={r.amount} onDone={() => removeFloatingReward(r.id)} />
                    ))}
                    <button
                      onClick={() => !done && !pending && handleCompleteChore(chore)}
                      disabled={done || pending}
                      className={`w-full flex items-center gap-3 p-3.5 rounded-xl transition-all text-left ${
                        isJustDone
                          ? 'bg-amber-100 scale-[1.02] shadow-md'
                          : done
                            ? 'bg-green-50/80'
                            : pending
                              ? 'bg-amber-50/80'
                              : 'hover:bg-purple-50 active:scale-[0.98] bg-gray-50/50'
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
                        done ? 'bg-green-200 text-green-600' : pending ? 'bg-amber-200 text-amber-600' : 'bg-purple-100 text-purple-300'
                      } ${isJustDone ? 'animate-bounce-in' : ''}`}>
                        {done ? <CheckCircle2 size={22} /> : pending ? <Clock size={22} /> : <Circle size={22} />}
                      </div>
                      <span className="text-xl flex-shrink-0">{chore.icon}</span>
                      <span className={`text-sm font-bold flex-1 min-w-0 truncate ${
                        done ? 'text-green-700 line-through' : pending ? 'text-amber-700' : 'text-kidzy-dark'
                      }`}>
                        {chore.name}
                      </span>
                      <span className={`text-xs font-black flex-shrink-0 px-3 py-1.5 rounded-xl transition-all ${
                        isJustDone
                          ? 'text-white bg-amber-500 shadow-lg shadow-amber-200 scale-110'
                          : done
                            ? 'text-green-600 bg-green-100'
                            : pending
                              ? 'text-amber-600 bg-amber-100'
                              : 'text-kidzy-purple bg-purple-100'
                      }`}>
                        {done ? '\u{2713} Done' : pending ? '\u{231B} Pending' : `+${chore.dollarValue} K$`}
                      </span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* No missions message */}
      {todayChores.length === 0 && (
        <div className="px-4 md:px-6 mt-5">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <span className="text-3xl">{'\u{1F3AE}'}</span>
            </div>
            <h3 className="font-display font-bold text-kidzy-dark mb-1">No missions today!</h3>
            <p className="text-kidzy-gray text-sm">Ask a parent to add some quests for you</p>
          </div>
        </div>
      )}

      {/* ===== WISH LIST / GOALS ===== */}
      {wishes.length > 0 && (
        <div className="px-4 md:px-6 mt-5">
          <h2 className="font-display font-bold text-kidzy-dark mb-3 flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-kidzy-pink to-rose-500 rounded-lg flex items-center justify-center">
              <Gift size={14} className="text-white" />
            </div>
            My Wish List
          </h2>
          <div className="space-y-2.5">
            {wishes.map(wish => {
              const canAfford = balance >= wish.targetDollars;
              const progressPercent = Math.min(100, Math.round((balance / wish.targetDollars) * 100));
              return (
                <div key={wish.id} className={`bg-white rounded-2xl p-4 border-2 transition-all ${
                  canAfford
                    ? 'border-green-300 shadow-lg shadow-green-100/50'
                    : 'border-gray-100 shadow-sm'
                }`}>
                  <div className="flex items-center gap-3 mb-2.5">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      canAfford ? 'bg-green-100' : 'bg-pink-100'
                    }`}>
                      <span className="text-xl">{wish.icon || '\u{1F381}'}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="font-bold text-sm text-kidzy-dark block truncate">{wish.name}</span>
                      <span className="text-xs text-kidzy-gray">{balance} / {wish.targetDollars} K$</span>
                    </div>
                    <span className={`text-xs font-black px-2.5 py-1 rounded-full ${
                      canAfford ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-kidzy-gray'
                    }`}>
                      {progressPercent}%
                    </span>
                  </div>
                  <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-2.5 rounded-full transition-all duration-700 relative overflow-hidden ${
                        canAfford
                          ? 'bg-gradient-to-r from-green-400 to-emerald-500'
                          : 'bg-gradient-to-r from-kidzy-pink to-rose-400'
                      }`}
                      style={{ width: `${progressPercent}%` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[shine_2s_infinite]" />
                    </div>
                  </div>
                  {canAfford && (
                    <div className="mt-2 text-center">
                      <p className="text-green-600 text-xs font-bold animate-bounce-in">
                        {'\u{1F389}'} You can get this! Ask a parent to redeem it!
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===== ACHIEVEMENTS / BADGES ===== */}
      <div className="px-4 md:px-6 mt-5">
        <h2 className="font-display font-bold text-kidzy-dark mb-3 flex items-center gap-2">
          <div className="w-7 h-7 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-lg flex items-center justify-center">
            <Trophy size={14} className="text-amber-900" />
          </div>
          My Badges
          <span className="text-xs font-bold text-kidzy-gray bg-gray-100 rounded-full px-2 py-0.5 ml-1">
            {unlocked}/{total}
          </span>
        </h2>

        {/* Unlocked badges — shown prominently */}
        {unlocked > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2 mb-2 -mx-1 px-1 scrollbar-hide">
            {achievements.filter(b => b.unlocked).map(badge => (
              <button
                key={badge.id}
                onClick={() => setShowBadgeDetail(showBadgeDetail === badge.id ? null : badge.id)}
                className="flex-shrink-0 bg-gradient-to-br from-amber-50 to-yellow-50 border-2 border-amber-200 rounded-2xl p-3 text-center w-24 hover:scale-105 transition-all"
              >
                <div className="text-3xl mb-1">{badge.icon}</div>
                <p className="text-[11px] font-bold text-amber-900 truncate">{badge.name}</p>
              </button>
            ))}
          </div>
        )}

        {/* Locked badges — progress grid */}
        <div className="grid grid-cols-3 gap-2">
          {achievements.filter(b => !b.unlocked).map(badge => (
            <div
              key={badge.id}
              className="bg-gray-50 border-2 border-gray-100 rounded-2xl p-3 text-center relative overflow-hidden"
            >
              <div className="text-2xl mb-1 grayscale opacity-40">{'\u{1F512}'}</div>
              <p className="text-[11px] font-bold text-gray-400 truncate">{badge.name}</p>
              <p className="text-[9px] text-gray-300 truncate">{badge.desc}</p>
              {/* Mini progress bar */}
              <div className="mt-1.5 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-1.5 bg-gradient-to-r from-amber-300 to-yellow-400 rounded-full transition-all"
                  style={{ width: `${(badge.progress / badge.target) * 100}%` }}
                />
              </div>
              <p className="text-[8px] text-gray-300 mt-0.5">{badge.progress}/{badge.target}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ===== MOTIVATIONAL FOOTER ===== */}
      <div className="px-4 md:px-6 mt-6 mb-4">
        <div className="bg-gradient-to-r from-kidzy-purple/5 to-kidzy-blue/5 rounded-2xl p-4 text-center border border-purple-100">
          <p className="text-kidzy-gray text-sm font-medium">
            {streak >= 7
              ? `${'\u{1F525}'} ${streak}-day streak! You're UNSTOPPABLE!`
              : streak >= 3
                ? `${'\u{26A1}'} ${streak} days in a row! Keep the momentum!`
                : choresPercent === 100
                  ? `${'\u{1F31F}'} All missions complete! You're amazing!`
                  : `${'\u{1F4AA}'} Keep earning K$ by being awesome! ${'\u{2728}'}`
            }
          </p>
        </div>
      </div>
    </div>
  );
}

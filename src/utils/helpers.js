// ── helpers.js ── Pure computation helpers (no side effects)

export function getKidBalance(kidId, transactions) {
  return transactions
    .filter(t => t.kidId === kidId)
    .reduce((sum, t) => {
      if (t.type === 'earn') return sum + t.amount;
      if (t.type === 'deduct') return sum - t.amount;
      if (t.type === 'redeem') return sum - t.amount;
      return sum;
    }, 0);
}

export function getKidEarningsToday(kidId, transactions) {
  const today = new Date().toISOString().split('T')[0];
  return transactions
    .filter(t => t.kidId === kidId && t.type === 'earn' && t.timestamp.startsWith(today))
    .reduce((sum, t) => sum + t.amount, 0);
}

export function getKidEarningsThisWeek(kidId, transactions) {
  const now = new Date();
  const day = now.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayOffset);
  monday.setHours(0, 0, 0, 0);
  return transactions
    .filter(t => t.kidId === kidId && t.type === 'earn' && new Date(t.timestamp) >= monday)
    .reduce((sum, t) => sum + t.amount, 0);
}

export function getKidDeductionsThisWeek(kidId, transactions) {
  const now = new Date();
  const day = now.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayOffset);
  monday.setHours(0, 0, 0, 0);
  return transactions
    .filter(t => t.kidId === kidId && t.type === 'deduct' && new Date(t.timestamp) >= monday)
    .reduce((sum, t) => sum + t.amount, 0);
}

export function getKidEarningsLastWeek(kidId, transactions) {
  const now = new Date();
  const day = now.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const thisMonday = new Date(now);
  thisMonday.setDate(now.getDate() + mondayOffset);
  thisMonday.setHours(0, 0, 0, 0);
  const lastMonday = new Date(thisMonday);
  lastMonday.setDate(lastMonday.getDate() - 7);
  return transactions
    .filter(t => t.kidId === kidId && t.type === 'earn' && new Date(t.timestamp) >= lastMonday && new Date(t.timestamp) < thisMonday)
    .reduce((sum, t) => sum + t.amount, 0);
}

export function getStreak(kidId, transactions) {
  const today = new Date();
  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const hasEarning = transactions.some(
      t => t.kidId === kidId && t.type === 'earn' && t.timestamp.startsWith(dateStr)
    );
    if (hasEarning) streak++;
    else if (i > 0) break;
    else if (i === 0 && !hasEarning) { continue; }
  }
  return streak;
}

export function getLongestStreak(kidId, transactions) {
  const earnDates = [...new Set(
    transactions.filter(t => t.kidId === kidId && t.type === 'earn').map(t => t.timestamp.split('T')[0])
  )].sort();
  if (earnDates.length === 0) return 0;
  let longest = 1, current = 1;
  for (let i = 1; i < earnDates.length; i++) {
    const prev = new Date(earnDates[i - 1]);
    const curr = new Date(earnDates[i]);
    const diffDays = Math.round((curr - prev) / 86400000);
    if (diffDays === 1) { current++; longest = Math.max(longest, current); }
    else { current = 1; }
  }
  return longest;
}

export function getDailyHigh(kidId, transactions) {
  const dailyTotals = {};
  transactions.filter(t => t.kidId === kidId && t.type === 'earn').forEach(t => {
    const date = t.timestamp.split('T')[0];
    dailyTotals[date] = (dailyTotals[date] || 0) + t.amount;
  });
  const values = Object.values(dailyTotals);
  return values.length > 0 ? Math.max(...values) : 0;
}

export function getCompletedBehaviorsToday(kidId, transactions) {
  const today = new Date().toISOString().split('T')[0];
  return transactions
    .filter(t => t.kidId === kidId && t.type === 'earn' && t.timestamp.startsWith(today))
    .map(t => t.behaviorId)
    .filter(Boolean);
}

export function getWeeklyLeaderboard(kids, transactions) {
  return kids.map(kid => ({
    ...kid,
    weeklyEarnings: getKidEarningsThisWeek(kid.id, transactions),
    weeklyDeductions: getKidDeductionsThisWeek(kid.id, transactions),
    weeklyNet: getKidEarningsThisWeek(kid.id, transactions) - getKidDeductionsThisWeek(kid.id, transactions),
    streak: getStreak(kid.id, transactions),
  })).sort((a, b) => b.weeklyNet - a.weeklyNet);
}

export function getMostImprovedLeaderboard(kids, transactions) {
  return kids.map(kid => {
    const thisWeek = getKidEarningsThisWeek(kid.id, transactions);
    const lastWeek = getKidEarningsLastWeek(kid.id, transactions);
    const improvement = lastWeek > 0 ? ((thisWeek - lastWeek) / lastWeek) * 100 : (thisWeek > 0 ? 100 : 0);
    return { ...kid, thisWeek, lastWeek, improvement: Math.round(improvement) };
  }).sort((a, b) => b.improvement - a.improvement);
}

export function getWishListProgress(wishItem, kidBalance) {
  if (!wishItem.targetDollars || wishItem.targetDollars === 0) return 100;
  return Math.min(100, Math.round((kidBalance / wishItem.targetDollars) * 100));
}

export function compressImage(file, maxWidth = 300, quality = 0.7) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ratio = maxWidth / img.width;
        canvas.width = maxWidth;
        canvas.height = img.height * ratio;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

export function rollMultiplier() {
  const roll = Math.random() * 100;
  if (roll < 5) return { multiplier: 3, label: 'TRIPLE BONUS!' };
  if (roll < 20) return { multiplier: 2, label: 'DOUBLE BONUS!' };
  return { multiplier: 1, label: '' };
}

// Achievement System - returns { all, unlocked, total } for LeaderboardPage badges tab
export function getAchievements(kidId, transactions, choreCompletions = [], chores = []) {
  const totalEarned = transactions.filter(t => t.kidId === kidId && t.type === 'earn').reduce((s, t) => s + t.amount, 0);
  const totalTx = transactions.filter(t => t.kidId === kidId && t.type === 'earn').length;
  const streak = getStreak(kidId, transactions);
  const longestStrk = getLongestStreak(kidId, transactions);
  const bestStreak = Math.max(streak, longestStrk);
  const categories = new Set(transactions.filter(t => t.kidId === kidId && t.type === 'earn' && t.category).map(t => t.category));
  const multiplierHits = transactions.filter(t => t.kidId === kidId && t.multiplier && t.multiplier > 1).length;
  const balance = getKidBalance(kidId, transactions);
  const redemptions = transactions.filter(t => t.kidId === kidId && t.type === 'redeem').length;

  // Chore-specific calculations
  const choreCompletionCount = choreCompletions.length;

  // Calculate perfect day: all chores for this kid completed today
  const today = new Date().toISOString().split('T')[0];
  const kidChores = chores.filter(c => c.kidId === kidId);
  const todayChores = kidChores.filter(isDueToday);
  const todayCompletions = choreCompletions.filter(cc => cc.date === today);
  const hasCompletedAllTodayChores = todayChores.length > 0 && todayChores.every(c => todayCompletions.some(cc => cc.choreId === c.id));

  // Social/giving: count bonus category earnings and "kind" related transactions
  const bonusEarnings = transactions.filter(t => t.kidId === kidId && t.type === 'earn' && t.category === 'cat_bonus').length;
  const kindTransactions = transactions.filter(t => t.kidId === kidId && t.type === 'earn' &&
    (t.reason?.toLowerCase().includes('kind') || t.reason?.toLowerCase().includes('help') || t.category === 'cat_bonus')).length;

  const defs = [
    // EARNING CATEGORY
    { id: 'first_earn', name: 'First Steps', icon: '\u{1F476}', desc: 'Earn your first K$', category: 'earning', progress: Math.min(totalTx, 1), target: 1 },
    { id: 'earn_50', name: 'Money Maker', icon: '\u{1F4B5}', desc: 'Earn 50 K$ total', category: 'earning', progress: Math.min(totalEarned, 50), target: 50 },
    { id: 'earn_200', name: 'Rich Kid', icon: '\u{1F4B0}', desc: 'Earn 200 K$ total', category: 'earning', progress: Math.min(totalEarned, 200), target: 200 },
    { id: 'earn_500', name: 'Millionaire', icon: '\u{1F451}', desc: 'Earn 500 K$ total', category: 'earning', progress: Math.min(totalEarned, 500), target: 500 },
    { id: 'earn_1000', name: 'Tycoon', icon: '\u{1F4A7}', desc: 'Earn 1000 K$ total', category: 'earning', progress: Math.min(totalEarned, 1000), target: 1000 },

    // STREAK CATEGORY
    { id: 'streak_3', name: 'On a Roll', icon: '\u{1F525}', desc: '3-day streak', category: 'streak', progress: Math.min(bestStreak, 3), target: 3 },
    { id: 'streak_7', name: 'Week Warrior', icon: '\u{26A1}', desc: '7-day streak', category: 'streak', progress: Math.min(bestStreak, 7), target: 7 },
    { id: 'streak_14', name: 'Two Week Titan', icon: '\u{1F4AA}', desc: '14-day streak', category: 'streak', progress: Math.min(bestStreak, 14), target: 14 },
    { id: 'streak_30', name: 'Unstoppable', icon: '\u{1F3C6}', desc: '30-day streak', category: 'streak', progress: Math.min(bestStreak, 30), target: 30 },
    { id: 'streak_60', name: 'Iron Will', icon: '\u{1F525}', desc: '60-day streak', category: 'streak', progress: Math.min(bestStreak, 60), target: 60 },

    // TASKS CATEGORY
    { id: 'tasks_10', name: 'Go Getter', icon: '\u{1F3AF}', desc: 'Complete 10 tasks', category: 'tasks', progress: Math.min(totalTx, 10), target: 10 },
    { id: 'tasks_50', name: 'Super Star', icon: '\u{2B50}', desc: 'Complete 50 tasks', category: 'tasks', progress: Math.min(totalTx, 50), target: 50 },
    { id: 'tasks_100', name: 'Legend', icon: '\u{1F31F}', desc: 'Complete 100 tasks', category: 'tasks', progress: Math.min(totalTx, 100), target: 100 },
    { id: 'tasks_200', name: 'Mega Star', icon: '\u{2AD90}', desc: 'Complete 200 tasks', category: 'tasks', progress: Math.min(totalTx, 200), target: 200 },

    // CHORES CATEGORY
    { id: 'chores_complete_5', name: 'Chore Hero', icon: '\u{1F9F9}', desc: 'Complete 5 chores', category: 'chores', progress: Math.min(choreCompletionCount, 5), target: 5 },
    { id: 'chores_complete_25', name: 'Chore Master', icon: '\u{1F3E0}', desc: 'Complete 25 chores', category: 'chores', progress: Math.min(choreCompletionCount, 25), target: 25 },
    { id: 'chores_complete_100', name: 'Chore Legend', icon: '\u{1F451}', desc: 'Complete 100 chores', category: 'chores', progress: Math.min(choreCompletionCount, 100), target: 100 },
    { id: 'perfect_day', name: 'Perfect Day', icon: '\u{2728}', desc: 'Complete ALL chores in a day', category: 'chores', progress: hasCompletedAllTodayChores ? 1 : 0, target: 1 },

    // SAVINGS CATEGORY
    { id: 'save_50', name: 'Penny Pincher', icon: '\u{1F437}', desc: 'Save 50 K$ balance', category: 'savings', progress: Math.min(Math.max(balance, 0), 50), target: 50 },
    { id: 'save_100', name: 'Savings Star', icon: '\u{1F4B0}', desc: 'Save 100 K$ balance', category: 'savings', progress: Math.min(Math.max(balance, 0), 100), target: 100 },
    { id: 'save_500', name: 'Investment Wizard', icon: '\u{1F9D9}', desc: 'Save 500 K$ balance', category: 'savings', progress: Math.min(Math.max(balance, 0), 500), target: 500 },

    // SOCIAL/GIVING CATEGORY
    { id: 'first_give', name: 'Kind Heart', icon: '\u{2764}', desc: 'Complete a kind act', category: 'social', progress: Math.min(kindTransactions, 1), target: 1 },
    { id: 'helper_5', name: 'Super Helper', icon: '\u{1F9B8}', desc: '5 bonus category earnings', category: 'social', progress: Math.min(bonusEarnings, 5), target: 5 },

    // CATEGORY VARIETY
    { id: 'cat_3', name: 'Explorer', icon: '\u{1F9ED}', desc: 'Earn in 3 categories', category: 'tasks', progress: Math.min(categories.size, 3), target: 3 },
    { id: 'cat_5', name: 'All-Rounder', icon: '\u{1F308}', desc: 'Earn in all 5 categories', category: 'tasks', progress: Math.min(categories.size, 5), target: 5 },

    // REWARDS/REDEMPTION CATEGORY
    { id: 'redeemer_5', name: 'Reward Hunter', icon: '\u{1F3AF}', desc: 'Redeem 5 wishes', category: 'tasks', progress: Math.min(redemptions, 5), target: 5 },
    { id: 'redeemer', name: 'First Reward', icon: '\u{1F381}', desc: 'Redeem your first wish', category: 'tasks', progress: Math.min(redemptions, 1), target: 1 },
  ];

  const all = defs.map(d => ({ ...d, unlocked: d.progress >= d.target }));
  const unlocked = all.filter(a => a.unlocked).length;
  return { all, unlocked, total: all.length };
}

export function getRandomEncouragement() {
  const messages = [
    "Amazing job! Keep it up! \u{1F389}",
    "You're a superstar! \u{2B50}",
    "Way to go, champ! \u{1F3C6}",
    "That's incredible! \u{1F680}",
    "You're crushing it! \u{1F4AA}",
    "So proud of you! \u{1F31F}",
    "Fantastic work! \u{1F38A}",
    "You're on fire! \u{1F525}",
    "Keep shining bright! \u{2728}",
    "Awesome sauce! \u{1F3AF}",
  ];
  return messages[Math.floor(Math.random() * messages.length)];
}

export function isDueToday(chore) {
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

export function isCompletedToday(choreId, completions) {
  const today = new Date().toISOString().split('T')[0];
  return completions.some(c => c.choreId === choreId && c.date === today);
}

// Get savings breakdown for a kid based on allocation percentages
export function getSavingsBreakdown(kidId, transactions, savingsAllocations) {
  const balance = getKidBalance(kidId, transactions);
  const allocation = savingsAllocations?.[kidId] || { save: 40, spend: 40, give: 20 };
  return {
    total: balance,
    save: Math.round(balance * (allocation.save / 100)),
    spend: Math.round(balance * (allocation.spend / 100)),
    give: Math.round(balance * (allocation.give / 100)),
    allocation,
  };
}

// Check if allowance is due today
export function isAllowanceDueToday(kidId, allowanceSettings, lastDistribution) {
  const settings = allowanceSettings?.[kidId];
  if (!settings || !settings.enabled || !settings.amount) return false;

  const dayMap = { sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6 };
  const today = new Date();
  const todayDay = today.getDay();

  if (todayDay !== dayMap[settings.day]) return false;

  // Check if already distributed today
  const lastDist = lastDistribution?.[kidId];
  if (lastDist) {
    const lastDate = new Date(lastDist).toISOString().split('T')[0];
    const todayDate = today.toISOString().split('T')[0];
    if (lastDate === todayDate) return false;
  }

  return true;
}

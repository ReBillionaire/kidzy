// Compute kid stats from transactions
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
    else if (i === 0 && !hasEarning) {
      continue;
    }
  }
  return streak;
}

// Check if a specific daily behavior was already completed today for a kid
export function isBehaviorCompletedToday(kidId, behaviorId, transactions) {
  const today = new Date().toISOString().split('T')[0];
  return transactions.some(
    t => t.kidId === kidId && t.behaviorId === behaviorId && t.type === 'earn' && t.timestamp.startsWith(today)
  );
}

export function getCompletedBehaviorsToday(kidId, transactions) {
  const today = new Date().toISOString().split('T')[0];
  return transactions
    .filter(t => t.kidId === kidId && t.type === 'earn' && t.timestamp.startsWith(today))
    .map(t => t.behaviorId)
    .filter(Boolean);
}

// Get the daily high — best single-day earnings ever for a kid
export function getDailyHighRecord(kidId, transactions) {
  const earns = transactions.filter(t => t.kidId === kidId && t.type === 'earn');
  if (earns.length === 0) return { amount: 0, date: null };

  const byDate = {};
  earns.forEach(t => {
    const date = t.timestamp.split('T')[0];
    byDate[date] = (byDate[date] || 0) + t.amount;
  });

  let bestDate = null;
  let bestAmount = 0;
  Object.entries(byDate).forEach(([date, amount]) => {
    if (amount > bestAmount) {
      bestAmount = amount;
      bestDate = date;
    }
  });

  return { amount: bestAmount, date: bestDate };
}

// Check if today's earnings is a new daily high
export function isTodayNewDailyHigh(kidId, transactions) {
  const todayEarnings = getKidEarningsToday(kidId, transactions);
  if (todayEarnings === 0) return false;

  const today = new Date().toISOString().split('T')[0];
  const earns = transactions.filter(t => t.kidId === kidId && t.type === 'earn');
  const byDate = {};
  earns.forEach(t => {
    const date = t.timestamp.split('T')[0];
    byDate[date] = (byDate[date] || 0) + t.amount;
  });

  // Check if today is strictly the highest
  for (const [date, amount] of Object.entries(byDate)) {
    if (date !== today && amount >= todayEarnings) return false;
  }
  return true;
}

// Get longest streak ever
export function getLongestStreak(kidId, transactions) {
  const earns = transactions.filter(t => t.kidId === kidId && t.type === 'earn');
  if (earns.length === 0) return 0;

  const dates = new Set(earns.map(t => t.timestamp.split('T')[0]));
  const sortedDates = [...dates].sort();

  let longest = 1;
  let current = 1;

  for (let i = 1; i < sortedDates.length; i++) {
    const prev = new Date(sortedDates[i - 1]);
    const curr = new Date(sortedDates[i]);
    const diffDays = Math.round((curr - prev) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      current++;
      longest = Math.max(longest, current);
    } else {
      current = 1;
    }
  }

  return longest;
}

export function getWeeklyLeaderboard(kids, transactions) {
  return kids
    .map(kid => ({
      ...kid,
      weeklyEarnings: getKidEarningsThisWeek(kid.id, transactions),
      weeklyDeductions: getKidDeductionsThisWeek(kid.id, transactions),
      weeklyNet: getKidEarningsThisWeek(kid.id, transactions) - getKidDeductionsThisWeek(kid.id, transactions),
      streak: getStreak(kid.id, transactions),
    }))
    .sort((a, b) => b.weeklyNet - a.weeklyNet);
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

// Variable Reward Multiplier — 80% 1x, 15% 2x, 5% 3x
export function rollMultiplier() {
  const roll = Math.random();
  if (roll < 0.05) return { multiplier: 3, label: 'TRIPLE BONUS!', emoji: '🌈', color: 'from-purple-500 to-pink-500' };
  if (roll < 0.20) return { multiplier: 2, label: 'DOUBLE BONUS!', emoji: '⚡', color: 'from-amber-400 to-orange-500' };
  return { multiplier: 1, label: null, emoji: null, color: null };
}

// Get last week's earnings for a kid (Monday to Sunday before current week)
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
    .filter(t => {
      if (t.kidId !== kidId || t.type !== 'earn') return false;
      const d = new Date(t.timestamp);
      return d >= lastMonday && d < thisMonday;
    })
    .reduce((sum, t) => sum + t.amount, 0);
}

// Most Improved leaderboard — week-over-week improvement
export function getMostImprovedLeaderboard(kids, transactions) {
  return kids
    .map(kid => {
      const thisWeek = getKidEarningsThisWeek(kid.id, transactions);
      const lastWeek = getKidEarningsLastWeek(kid.id, transactions);
      const improvement = lastWeek > 0 ? Math.round(((thisWeek - lastWeek) / lastWeek) * 100) : (thisWeek > 0 ? 100 : 0);
      return { ...kid, thisWeek, lastWeek, improvement };
    })
    .sort((a, b) => b.improvement - a.improvement);
}

// Achievements system
export function getAchievements(kidId, transactions) {
  const totalEarned = transactions
    .filter(t => t.kidId === kidId && t.type === 'earn')
    .reduce((sum, t) => sum + t.amount, 0);
  const streak = getStreak(kidId, transactions);
  const longestStreak = getLongestStreak(kidId, transactions);
  const totalTransactions = transactions.filter(t => t.kidId === kidId && t.type === 'earn').length;
  const multiplierHits = transactions.filter(t => t.kidId === kidId && t.multiplier && t.multiplier > 1).length;

  const all = [
    // Earning milestones
    { id: 'earn_10', name: 'First Steps', desc: 'Earned $10 K$', icon: '👣', unlocked: totalEarned >= 10, progress: Math.min(totalEarned, 10), target: 10 },
    { id: 'earn_50', name: 'Rising Star', desc: 'Earned $50 K$', icon: '⭐', unlocked: totalEarned >= 50, progress: Math.min(totalEarned, 50), target: 50 },
    { id: 'earn_100', name: 'Century Club', desc: 'Earned $100 K$', icon: '💯', unlocked: totalEarned >= 100, progress: Math.min(totalEarned, 100), target: 100 },
    { id: 'earn_500', name: 'K$ Mogul', desc: 'Earned $500 K$', icon: '💰', unlocked: totalEarned >= 500, progress: Math.min(totalEarned, 500), target: 500 },
    { id: 'earn_1000', name: 'Kidzy Legend', desc: 'Earned $1,000 K$', icon: '👑', unlocked: totalEarned >= 1000, progress: Math.min(totalEarned, 1000), target: 1000 },
    // Streak milestones
    { id: 'streak_3', name: 'Hat Trick', desc: '3-day streak', icon: '🔥', unlocked: longestStreak >= 3, progress: Math.min(longestStreak, 3), target: 3 },
    { id: 'streak_7', name: 'Week Warrior', desc: '7-day streak', icon: '⚔️', unlocked: longestStreak >= 7, progress: Math.min(longestStreak, 7), target: 7 },
    { id: 'streak_14', name: 'Fortnight Hero', desc: '14-day streak', icon: '🦸', unlocked: longestStreak >= 14, progress: Math.min(longestStreak, 14), target: 14 },
    { id: 'streak_30', name: 'Monthly Master', desc: '30-day streak', icon: '🏅', unlocked: longestStreak >= 30, progress: Math.min(longestStreak, 30), target: 30 },
    // Activity milestones
    { id: 'tasks_10', name: 'Getting Started', desc: 'Completed 10 tasks', icon: '📋', unlocked: totalTransactions >= 10, progress: Math.min(totalTransactions, 10), target: 10 },
    { id: 'tasks_50', name: 'Task Master', desc: 'Completed 50 tasks', icon: '🎯', unlocked: totalTransactions >= 50, progress: Math.min(totalTransactions, 50), target: 50 },
    { id: 'tasks_100', name: 'Habit Builder', desc: 'Completed 100 tasks', icon: '🏗️', unlocked: totalTransactions >= 100, progress: Math.min(totalTransactions, 100), target: 100 },
    // Bonus multiplier milestones
    { id: 'multi_1', name: 'Lucky Day', desc: 'Got your first bonus multiplier', icon: '🍀', unlocked: multiplierHits >= 1, progress: Math.min(multiplierHits, 1), target: 1 },
    { id: 'multi_5', name: 'Fortune Finder', desc: 'Got 5 bonus multipliers', icon: '🎰', unlocked: multiplierHits >= 5, progress: Math.min(multiplierHits, 5), target: 5 },
  ];

  return { all, unlocked: all.filter(a => a.unlocked).length, total: all.length };
}

export function getRandomEncouragement() {
  const messages = [
    "Amazing job! Keep it up! 🎉",
    "You're a superstar! ⭐",
    "Way to go, champ! 🏆",
    "That's incredible! 🚀",
    "You're crushing it! 💪",
    "So proud of you! 🌟",
    "Fantastic work! 🎊",
    "You're on fire! 🔥",
    "Keep shining bright! ✨",
    "Awesome sauce! 🎯",
  ];
  return messages[Math.floor(Math.random() * messages.length)];
}

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
    else if (i === 0 && !hasEarning) {
      continue;
    }
  }
  return streak;
}

export function getCompletedBehaviorsToday(kidId, transactions) {
  const today = new Date().toISOString().split('T')[0];
  return transactions
    .filter(t => t.kidId === kidId && t.type === 'earn' && t.timestamp.startsWith(today))
    .map(t => t.behaviorId)
    .filter(Boolean);
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

export function getMostImprovedLeaderboard(kids, transactions) {
  return kids
    .map(kid => {
      const thisWeek = getKidEarningsThisWeek(kid.id, transactions);
      const lastWeek = getKidEarningsLastWeek(kid.id, transactions);
      const improvement = lastWeek > 0 ? ((thisWeek - lastWeek) / lastWeek) * 100 : (thisWeek > 0 ? 100 : 0);
      return { ...kid, thisWeek, lastWeek, improvement: Math.round(improvement) };
    })
    .sort((a, b) => b.improvement - a.improvement);
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

// Variable reward multiplier (80% 1x, 15% 2x, 5% 3x)
export function rollMultiplier() {
  const roll = Math.random() * 100;
  if (roll < 5) return { multiplier: 3, label: 'TRIPLE BONUS!' };
  if (roll < 20) return { multiplier: 2, label: 'DOUBLE BONUS!' };
  return { multiplier: 1, label: '' };
}

// Achievement definitions
export function getAchievements(kidId, transactions) {
  const totalEarned = transactions.filter(t => t.kidId === kidId && t.type === 'earn').reduce((s, t) => s + t.amount, 0);
  const totalTx = transactions.filter(t => t.kidId === kidId && t.type === 'earn').length;
  const streak = getStreak(kidId, transactions);
  const categories = new Set(transactions.filter(t => t.kidId === kidId && t.type === 'earn' && t.category).map(t => t.category));
  const multiplierHits = transactions.filter(t => t.kidId === kidId && t.multiplier && t.multiplier > 1).length;

  return [
    { id: 'first_earn', name: 'First Steps', icon: '\u{1F476}', desc: 'Earn your first K$', progress: Math.min(totalTx, 1), target: 1, category: 'Earning' },
    { id: 'earn_50', name: 'Money Maker', icon: '\u{1F4B5}', desc: 'Earn 50 K$ total', progress: Math.min(totalEarned, 50), target: 50, category: 'Earning' },
    { id: 'earn_200', name: 'Rich Kid', icon: '\u{1F4B0}', desc: 'Earn 200 K$ total', progress: Math.min(totalEarned, 200), target: 200, category: 'Earning' },
    { id: 'earn_500', name: 'Millionaire', icon: '\u{1F451}', desc: 'Earn 500 K$ total', progress: Math.min(totalEarned, 500), target: 500, category: 'Earning' },
    { id: 'streak_3', name: 'On a Roll', icon: '\u{1F525}', desc: '3-day streak', progress: Math.min(streak, 3), target: 3, category: 'Streak' },
    { id: 'streak_7', name: 'Week Warrior', icon: '\u{26A1}', desc: '7-day streak', progress: Math.min(streak, 7), target: 7, category: 'Streak' },
    { id: 'streak_30', name: 'Unstoppable', icon: '\u{1F3C6}', desc: '30-day streak', progress: Math.min(streak, 30), target: 30, category: 'Streak' },
    { id: 'tasks_10', name: 'Go Getter', icon: '\u{1F3AF}', desc: 'Complete 10 tasks', progress: Math.min(totalTx, 10), target: 10, category: 'Activity' },
    { id: 'tasks_50', name: 'Super Star', icon: '\u{2B50}', desc: 'Complete 50 tasks', progress: Math.min(totalTx, 50), target: 50, category: 'Activity' },
    { id: 'tasks_100', name: 'Legend', icon: '\u{1F31F}', desc: 'Complete 100 tasks', progress: Math.min(totalTx, 100), target: 100, category: 'Activity' },
    { id: 'cat_3', name: 'Explorer', icon: '\u{1F9ED}', desc: 'Earn in 3 categories', progress: Math.min(categories.size, 3), target: 3, category: 'Activity' },
    { id: 'cat_5', name: 'All-Rounder', icon: '\u{1F308}', desc: 'Earn in all 5 categories', progress: Math.min(categories.size, 5), target: 5, category: 'Activity' },
    { id: 'multi_1', name: 'Lucky', icon: '\u{1F340}', desc: 'Get a bonus multiplier', progress: Math.min(multiplierHits, 1), target: 1, category: 'Multiplier' },
    { id: 'multi_5', name: 'Fortune Favors', icon: '\u{1F48E}', desc: 'Get 5 bonus multipliers', progress: Math.min(multiplierHits, 5), target: 5, category: 'Multiplier' },
  ];
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

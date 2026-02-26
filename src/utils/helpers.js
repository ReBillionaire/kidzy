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
    else if (i > 0) break; // allow today to not have earned yet
    else if (i === 0 && !hasEarning) {
      // check if yesterday had one
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

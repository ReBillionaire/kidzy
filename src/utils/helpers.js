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
    "Amazing job! Keep it up!",
    "You're a superstar!",
    "Way to go, champ!",
    "That's incredible!",
    "You're crushing it!",
    "So proud of you!",
    "Fantastic work!",
    "You're on fire!",
    "Keep shining bright!",
    "Awesome sauce!",
  ];
  return messages[Math.floor(Math.random() * messages.length)];
      }

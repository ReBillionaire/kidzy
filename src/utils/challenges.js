// Daily Challenge System
import { getToday } from './storage';
import { getCompletedBehaviorsToday, getKidEarningsToday, getStreak } from './helpers';

const CHALLENGE_TEMPLATES = [
  {
    id: 'early_bird',
    name: 'Early Bird',
    description: 'Complete 2 tasks before noon',
    icon: '\u{1F305}',
    check: (kidId, transactions) => {
      const today = getToday();
      const beforeNoon = transactions.filter(t =>
        t.kidId === kidId && t.type === 'earn' && t.timestamp.startsWith(today) &&
        new Date(t.timestamp).getHours() < 12
      );
      return { current: beforeNoon.length, target: 2 };
    },
    reward: 5,
  },
  {
    id: 'task_master',
    name: 'Task Master',
    description: 'Complete 5 behaviors today',
    icon: '\u{1F3AF}',
    check: (kidId, transactions) => {
      const completed = getCompletedBehaviorsToday(kidId, transactions);
      return { current: completed.length, target: 5 };
    },
    reward: 8,
  },
  {
    id: 'category_explorer',
    name: 'Explorer',
    description: 'Earn from 3 different categories',
    icon: '\u{1F9ED}',
    check: (kidId, transactions) => {
      const today = getToday();
      const categories = new Set(
        transactions
          .filter(t => t.kidId === kidId && t.type === 'earn' && t.timestamp.startsWith(today) && t.category)
          .map(t => t.category)
      );
      return { current: categories.size, target: 3 };
    },
    reward: 6,
  },
  {
    id: 'big_earner',
    name: 'Big Earner',
    description: 'Earn 15+ K$ today',
    icon: '\u{1F4B0}',
    check: (kidId, transactions) => {
      const earned = getKidEarningsToday(kidId, transactions);
      return { current: Math.min(earned, 15), target: 15 };
    },
    reward: 5,
  },
  {
    id: 'hygiene_hero',
    name: 'Hygiene Hero',
    description: 'Complete all hygiene tasks',
    icon: '\u{1F9FC}',
    check: (kidId, transactions) => {
      const today = getToday();
      const hygieneIds = ['bh_5', 'bh_6', 'bh_7', 'bh_8'];
      const completed = transactions
        .filter(t => t.kidId === kidId && t.type === 'earn' && t.timestamp.startsWith(today) && hygieneIds.includes(t.behaviorId));
      return { current: completed.length, target: 4 };
    },
    reward: 7,
  },
  {
    id: 'health_champion',
    name: 'Health Champ',
    description: 'Complete all health tasks',
    icon: '\u{1F4AA}',
    check: (kidId, transactions) => {
      const today = getToday();
      const healthIds = ['bh_1', 'bh_2', 'bh_3', 'bh_4'];
      const completed = transactions
        .filter(t => t.kidId === kidId && t.type === 'earn' && t.timestamp.startsWith(today) && healthIds.includes(t.behaviorId));
      return { current: completed.length, target: 4 };
    },
    reward: 7,
  },
  {
    id: 'streak_builder',
    name: 'Streak Builder',
    description: 'Keep your streak going!',
    icon: '\u{1F525}',
    check: (kidId, transactions) => {
      const todayEarnings = getKidEarningsToday(kidId, transactions);
      return { current: todayEarnings > 0 ? 1 : 0, target: 1 };
    },
    reward: 3,
  },
  {
    id: 'study_star',
    name: 'Study Star',
    description: 'Complete 2 learning tasks',
    icon: '\u{1F4DA}',
    check: (kidId, transactions) => {
      const today = getToday();
      const learningIds = ['bh_14', 'bh_15', 'bh_16', 'bh_17'];
      const completed = transactions
        .filter(t => t.kidId === kidId && t.type === 'earn' && t.timestamp.startsWith(today) && learningIds.includes(t.behaviorId));
      return { current: completed.length, target: 2 };
    },
    reward: 6,
  },
];

// Get 3 daily challenges (seeded by date for consistency)
export function getDailyChallenges(date = getToday()) {
  const seed = date.split('-').join('');
  const seedNum = parseInt(seed) % CHALLENGE_TEMPLATES.length;
  const challenges = [];
  const used = new Set();

  for (let i = 0; challenges.length < 3 && i < CHALLENGE_TEMPLATES.length; i++) {
    const idx = (seedNum + i * 3) % CHALLENGE_TEMPLATES.length;
    if (!used.has(idx)) {
      used.add(idx);
      challenges.push({ ...CHALLENGE_TEMPLATES[idx], date });
    }
  }
  return challenges;
}

// Check challenge progress for a kid
export function checkChallengeProgress(challenge, kidId, transactions) {
  const template = CHALLENGE_TEMPLATES.find(t => t.id === challenge.id);
  if (!template) return { current: 0, target: 1, completed: false };
  const progress = template.check(kidId, transactions);
  return { ...progress, completed: progress.current >= progress.target };
}

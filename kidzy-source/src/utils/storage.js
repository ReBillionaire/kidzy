// LocalStorage wrapper with JSON serialization
const STORAGE_KEY = 'kidzy_data';

const defaultData = () => ({
  family: null,
  parents: [],
  kids: [],
  behaviorCategories: getDefaultCategories(),
  transactions: [],
  wishListItems: [],
  dreamGoals: [],
  weeklySummaries: [],
  currentParentId: null,
  settings: {
    currency: '$',
    weekStartDay: 'monday',
    dailyCheckInReminder: true,
  }
});

export function getDefaultCategories() {
  return [
    {
      id: 'cat_health',
      name: 'Health',
      icon: '💪',
      color: '#10B981',
      items: [
        { id: 'bh_1', name: 'Ate fruits/vegetables', dollarValue: 2, frequency: 'daily' },
        { id: 'bh_2', name: 'Drank enough water', dollarValue: 1, frequency: 'daily' },
        { id: 'bh_3', name: 'Exercised / played outside', dollarValue: 3, frequency: 'daily' },
        { id: 'bh_4', name: 'Went to bed on time', dollarValue: 2, frequency: 'daily' },
      ]
    },
    {
      id: 'cat_hygiene',
      name: 'Hygiene',
      icon: '🧼',
      color: '#3B82F6',
      items: [
        { id: 'bh_5', name: 'Brushed teeth (morning)', dollarValue: 1, frequency: 'daily' },
        { id: 'bh_6', name: 'Brushed teeth (night)', dollarValue: 1, frequency: 'daily' },
        { id: 'bh_7', name: 'Took a bath/shower', dollarValue: 2, frequency: 'daily' },
        { id: 'bh_8', name: 'Kept room clean', dollarValue: 3, frequency: 'daily' },
      ]
    },
    {
      id: 'cat_discipline',
      name: 'Discipline',
      icon: '⭐',
      color: '#F59E0B',
      items: [
        { id: 'bh_9', name: 'No screen time tantrum', dollarValue: 3, frequency: 'daily' },
        { id: 'bh_10', name: 'Listened to parents', dollarValue: 2, frequency: 'daily' },
        { id: 'bh_11', name: 'Shared with siblings', dollarValue: 2, frequency: 'daily' },
        { id: 'bh_12', name: 'Said please & thank you', dollarValue: 1, frequency: 'daily' },
        { id: 'bh_13', name: 'Completed chores', dollarValue: 3, frequency: 'daily' },
      ]
    },
    {
      id: 'cat_learning',
      name: 'Learning',
      icon: '📚',
      color: '#7C3AED',
      items: [
        { id: 'bh_14', name: 'Read for 20 minutes', dollarValue: 3, frequency: 'daily' },
        { id: 'bh_15', name: 'Completed homework', dollarValue: 3, frequency: 'daily' },
        { id: 'bh_16', name: 'Practiced instrument/skill', dollarValue: 3, frequency: 'daily' },
        { id: 'bh_17', name: 'Learned something new', dollarValue: 2, frequency: 'daily' },
      ]
    },
    {
      id: 'cat_bonus',
      name: 'Bonus',
      icon: '🌟',
      color: '#EC4899',
      items: [
        { id: 'bh_18', name: 'Helped someone', dollarValue: 5, frequency: 'anytime' },
        { id: 'bh_19', name: 'Did something kind', dollarValue: 3, frequency: 'anytime' },
        { id: 'bh_20', name: 'Great report card', dollarValue: 20, frequency: 'milestone' },
      ]
    }
  ];
}

export function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultData();
    return { ...defaultData(), ...JSON.parse(raw) };
  } catch {
    return defaultData();
  }
}

export function saveData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save data:', e);
  }
}

export function generateId(prefix = 'id') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function getToday() {
  return new Date().toISOString().split('T')[0];
}

export function getWeekStart(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().split('T')[0];
}

export function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatTime(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export function getDaysBetween(date1, date2) {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return Math.floor((d2 - d1) / (1000 * 60 * 60 * 24));
}

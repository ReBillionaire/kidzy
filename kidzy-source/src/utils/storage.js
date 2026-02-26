// LocalStorage wrapper with JSON serialization
const STORAGE_KEY = 'kidzy_data';
const LOCKOUT_KEY = 'kidzy_lockout';

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
    soundEnabled: true,
    hapticEnabled: true,
  },
  challenges: [],
  onboardingComplete: false,
});

export function getDefaultCategories() {
  return [
    {
      id: 'cat_health',
      name: 'Health',
      icon: '\u{1F4AA}',
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
      icon: '\u{1F9FC}',
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
      icon: '\u{2B50}',
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
      icon: '\u{1F4DA}',
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
      icon: '\u{1F31F}',
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
    const json = JSON.stringify(data);
    // Check storage quota (~5MB limit)
    const sizeKB = new Blob([json]).size / 1024;
    if (sizeKB > 4500) {
      console.warn('Kidzy: Storage approaching limit (' + sizeKB.toFixed(0) + 'KB). Consider exporting data.');
    }
    localStorage.setItem(STORAGE_KEY, json);
  } catch (e) {
    console.error('Failed to save data:', e);
    if (e.name === 'QuotaExceededError') {
      alert('Storage is full! Please export your data from Settings to avoid data loss.');
    }
  }
}

// Secure ID generation using crypto API
export function generateId(prefix = 'id') {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  // Fallback for older browsers
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

// PIN hashing using Web Crypto API (SHA-256)
export async function hashPin(pin) {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin + '_kidzy_salt_v1');
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function verifyPin(pin, hashedPin) {
  // Support legacy plaintext PINs (auto-migrate on successful login)
  if (hashedPin.length < 10) {
    return pin === hashedPin;
  }
  const hash = await hashPin(pin);
  return hash === hashedPin;
}

// Rate limiting for login attempts
export function getLockoutState() {
  try {
    const raw = localStorage.getItem(LOCKOUT_KEY);
    if (!raw) return { attempts: 0, lockedUntil: null };
    return JSON.parse(raw);
  } catch {
    return { attempts: 0, lockedUntil: null };
  }
}

export function recordFailedAttempt() {
  const state = getLockoutState();
  state.attempts += 1;
  if (state.attempts >= 5) {
    // Exponential backoff: 30s, 60s, 120s, 240s...
    const lockSeconds = 30 * Math.pow(2, Math.min(state.attempts - 5, 5));
    state.lockedUntil = Date.now() + lockSeconds * 1000;
  }
  localStorage.setItem(LOCKOUT_KEY, JSON.stringify(state));
  return state;
}

export function resetLockout() {
  localStorage.removeItem(LOCKOUT_KEY);
}

export function isLockedOut() {
  const state = getLockoutState();
  if (state.lockedUntil && Date.now() < state.lockedUntil) {
    return Math.ceil((state.lockedUntil - Date.now()) / 1000);
  }
  return false;
}

// Data export/import
export function exportData() {
  const data = loadData();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `kidzy-backup-${getToday()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function importData(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        // Basic validation
        if (!data.family && !data.kids && !data.transactions) {
          reject(new Error('Invalid Kidzy backup file'));
          return;
        }
        const merged = { ...defaultData(), ...data };
        saveData(merged);
        resolve(merged);
      } catch (err) {
        reject(new Error('Failed to parse backup file'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

import { createContext, useContext, useReducer, useEffect, useRef, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { getDefaultCategories, generateId } from '../utils/storage';
import { subscribeFamilyUpdates, updateFamilyState } from '../utils/firestore';

const KidzyContext = createContext(null);
const KidzyDispatchContext = createContext(null);

// ── Validation Helpers ──────────────────────────────────────────────
function validateString(val, maxLen = 200) {
  return typeof val === 'string' && val.length <= maxLen;
}
function validateNumber(val, min = 0, max = 100000) {
  return typeof val === 'number' && !isNaN(val) && val >= min && val <= max;
}
function validateId(val) {
  return typeof val === 'string' && val.length > 0 && val.length < 100;
}

// ── Default State ───────────────────────────────────────────────────
function defaultState() {
  return {
    family: null,
    parents: [],
    kids: [],
    behaviorCategories: getDefaultCategories(),
    transactions: [],
    wishListItems: [],
    dreamGoals: [],
    challenges: [],
    settings: {
      currency: '$',
      weekStartDay: 'monday',
      dailyCheckInReminder: true,
      soundEnabled: true,
      hapticEnabled: true,
    },
    onboardingComplete: false,
    // Transient (not saved to Firestore)
    currentParentId: null,
    loggedOut: false,
    kidMode: null,
  };
}

// ── Reducer ─────────────────────────────────────────────────────────
function kidzyReducer(state, action) {
  try {
    switch (action.type) {
      // ── AUTH ──
      case 'SET_CURRENT_PARENT': {
        if (!validateId(action.payload)) return state;
        return { ...state, currentParentId: action.payload, loggedOut: false };
      }
      case 'LOGOUT': {
        return { ...state, currentParentId: null, kidMode: null, loggedOut: true };
      }
      case 'SET_KID_MODE': {
        if (action.payload && !validateId(action.payload)) return state;
        return { ...state, kidMode: action.payload || null, currentParentId: null };
      }

      // ── PARENTS ──
      case 'ADD_PARENT': {
        if (!validateString(action.payload?.name)) return state;
        const newParent = { id: generateId('parent'), ...action.payload, role: 'parent', createdAt: new Date().toISOString() };
        return { ...state, parents: [...state.parents, newParent] };
      }
      case 'UPDATE_PARENT': {
        if (!validateId(action.payload?.id)) return state;
        return { ...state, parents: state.parents.map(p => p.id === action.payload.id ? { ...p, ...action.payload } : p) };
      }
      case 'REMOVE_PARENT': {
        if (!validateId(action.payload)) return state;
        return { ...state, parents: state.parents.filter(p => p.id !== action.payload) };
      }

      // ── KIDS ──
      case 'ADD_KID': {
        if (!validateString(action.payload?.name)) return state;
        const newKid = { id: generateId('kid'), ...action.payload, createdAt: new Date().toISOString() };
        return { ...state, kids: [...state.kids, newKid] };
      }
      case 'UPDATE_KID': {
        if (!validateId(action.payload?.id)) return state;
        return { ...state, kids: state.kids.map(k => k.id === action.payload.id ? { ...k, ...action.payload } : k) };
      }
      case 'REMOVE_KID': {
        if (!validateId(action.payload)) return state;
        return {
          ...state,
          kids: state.kids.filter(k => k.id !== action.payload),
          transactions: state.transactions.filter(t => t.kidId !== action.payload),
          wishListItems: state.wishListItems.filter(w => w.kidId !== action.payload),
          dreamGoals: state.dreamGoals.filter(d => d.kidId !== action.payload),
        };
      }

      // ── BEHAVIORS ──
      case 'ADD_BEHAVIOR_CATEGORY': {
        return { ...state, behaviorCategories: [...state.behaviorCategories, { id: generateId('cat'), ...action.payload, items: [] }] };
      }
      case 'ADD_BEHAVIOR_ITEM': {
        return {
          ...state,
          behaviorCategories: state.behaviorCategories.map(cat =>
            cat.id === action.payload.categoryId
              ? { ...cat, items: [...cat.items, { id: generateId('bh'), ...action.payload.item }] }
              : cat
          ),
        };
      }
      case 'REMOVE_BEHAVIOR_ITEM': {
        return {
          ...state,
          behaviorCategories: state.behaviorCategories.map(cat => ({
            ...cat,
            items: cat.items.filter(item => item.id !== action.payload),
          })),
        };
      }
      case 'UPDATE_BEHAVIOR_CATEGORIES': {
        if (!Array.isArray(action.payload)) return state;
        return { ...state, behaviorCategories: action.payload };
      }

      // ── TRANSACTIONS ──
      case 'ADD_TRANSACTION': {
        if (!validateId(action.payload?.kidId) || !validateNumber(action.payload?.amount, 0)) return state;
        const tx = { id: generateId('tx'), ...action.payload, timestamp: new Date().toISOString() };
        return { ...state, transactions: [...state.transactions, tx] };
      }
      case 'REMOVE_TRANSACTION': {
        if (!validateId(action.payload)) return state;
        return { ...state, transactions: state.transactions.filter(t => t.id !== action.payload) };
      }

      // ── WISH LIST ──
      case 'ADD_WISH': {
        if (!validateString(action.payload?.name) || !validateId(action.payload?.kidId)) return state;
        return { ...state, wishListItems: [...state.wishListItems, { id: generateId('wish'), ...action.payload, status: 'active', createdAt: new Date().toISOString() }] };
      }
      case 'UPDATE_WISH': {
        return { ...state, wishListItems: state.wishListItems.map(w => w.id === action.payload.id ? { ...w, ...action.payload } : w) };
      }
      case 'REMOVE_WISH': {
        return { ...state, wishListItems: state.wishListItems.filter(w => w.id !== action.payload) };
      }
      case 'REDEEM_WISH': {
        return {
          ...state,
          wishListItems: state.wishListItems.map(w => w.id === action.payload.wishId ? { ...w, status: 'redeemed', redeemedAt: new Date().toISOString(), fulfilled: false } : w),
          transactions: [...state.transactions, {
            id: generateId('tx'),
            kidId: action.payload.kidId,
            parentId: state.currentParentId,
            type: 'redeem',
            amount: action.payload.amount,
            reason: `Redeemed: ${action.payload.wishName}`,
            timestamp: new Date().toISOString(),
          }],
        };
      }
      case 'FULFILL_WISH': {
        return {
          ...state,
          wishListItems: state.wishListItems.map(w => w.id === action.payload ? { ...w, fulfilled: true, fulfilledAt: new Date().toISOString() } : w),
        };
      }

      // ── DREAM GOALS ──
      case 'ADD_DREAM': {
        if (!validateString(action.payload?.name) || !validateId(action.payload?.kidId)) return state;
        return { ...state, dreamGoals: [...state.dreamGoals, { id: generateId('dream'), ...action.payload, status: 'active', createdAt: new Date().toISOString() }] };
      }
      case 'UPDATE_DREAM': {
        return { ...state, dreamGoals: state.dreamGoals.map(d => d.id === action.payload.id ? { ...d, ...action.payload } : d) };
      }
      case 'REMOVE_DREAM': {
        return { ...state, dreamGoals: state.dreamGoals.filter(d => d.id !== action.payload) };
      }

      // ── CHALLENGES ──
      case 'COMPLETE_CHALLENGE': {
        const challenges = state.challenges || [];
        return { ...state, challenges: [...challenges, { ...action.payload, completedAt: new Date().toISOString() }] };
      }

      // ── SETTINGS ──
      case 'UPDATE_SETTINGS': {
        return { ...state, settings: { ...state.settings, ...action.payload } };
      }
      case 'SET_ONBOARDING_COMPLETE': {
        return { ...state, onboardingComplete: true };
      }
      case 'UPDATE_FAMILY': {
        return { ...state, family: { ...state.family, ...action.payload } };
      }

      // ── DATA ──
      case 'LOAD_FAMILY_DATA': {
        // Load family data from Firestore, preserve transient state
        const { id, createdAt, inviteCode, ownerId, ...familyData } = action.payload;
        return {
          ...defaultState(),
          ...familyData,
          family: { id, name: familyData.name, inviteCode, ownerId, createdAt },
          currentParentId: state?.currentParentId || null,
          kidMode: state?.kidMode || null,
          loggedOut: state?.loggedOut || false,
        };
      }
      case 'RESET_ALL': {
        return defaultState();
      }
      case 'LOAD_DATA': {
        return action.payload;
      }

      default:
        return state;
    }
  } catch (error) {
    console.error('Reducer error:', error, 'Action:', action.type);
    return state;
  }
}

// ── Provider ────────────────────────────────────────────────────────
export function KidzyProvider({ children }) {
  const { user, currentFamilyId } = useAuth();
  const [state, dispatch] = useReducer(kidzyReducer, null, defaultState);
  const syncingRef = useRef(false);
  const unsubRef = useRef(null);
  const lastSyncedRef = useRef(null);

  // ── Subscribe to Firestore family updates ──
  useEffect(() => {
    // Clean up previous listener
    if (unsubRef.current) {
      unsubRef.current();
      unsubRef.current = null;
    }

    if (!user || !currentFamilyId) {
      dispatch({ type: 'RESET_ALL' });
      return;
    }

    const unsub = subscribeFamilyUpdates(currentFamilyId, (familyData) => {
      // Avoid re-applying our own writes
      if (syncingRef.current) return;
      dispatch({ type: 'LOAD_FAMILY_DATA', payload: familyData });
    });

    unsubRef.current = unsub;
    return () => {
      if (unsubRef.current) {
        unsubRef.current();
        unsubRef.current = null;
      }
    };
  }, [user, currentFamilyId]);

  // ── Sync state changes TO Firestore ──
  useEffect(() => {
    if (!currentFamilyId || !state?.family) return;

    // Debounce writes
    const timer = setTimeout(async () => {
      const stateJson = JSON.stringify({
        name: state.family.name,
        parents: state.parents,
        kids: state.kids,
        behaviorCategories: state.behaviorCategories,
        transactions: state.transactions,
        wishListItems: state.wishListItems,
        dreamGoals: state.dreamGoals,
        challenges: state.challenges,
        settings: state.settings,
        onboardingComplete: state.onboardingComplete,
      });

      // Skip if nothing changed
      if (stateJson === lastSyncedRef.current) return;
      lastSyncedRef.current = stateJson;

      syncingRef.current = true;
      try {
        await updateFamilyState(currentFamilyId, state);
      } catch (err) {
        console.error('[Kidzy] Failed to sync to Firestore:', err);
      }
      // Allow incoming updates after a brief delay
      setTimeout(() => { syncingRef.current = false; }, 500);
    }, 800);

    return () => clearTimeout(timer);
  }, [state, currentFamilyId]);

  // ── Auto-login: find parent matching current Firebase user ──
  useEffect(() => {
    if (!user || !state?.parents?.length || state.currentParentId || state.loggedOut || state.kidMode) return;

    const matchedParent = state.parents.find(p => p.uid === user.uid);
    if (matchedParent) {
      dispatch({ type: 'SET_CURRENT_PARENT', payload: matchedParent.id });
    }
  }, [user, state?.parents, state?.currentParentId, state?.loggedOut, state?.kidMode]);

  return (
    <KidzyContext.Provider value={state}>
      <KidzyDispatchContext.Provider value={dispatch}>
        {children}
      </KidzyDispatchContext.Provider>
    </KidzyContext.Provider>
  );
}

export function useKidzy() {
  return useContext(KidzyContext);
}

export function useKidzyDispatch() {
  const context = useContext(KidzyDispatchContext);
  if (!context) throw new Error('useKidzyDispatch must be used within KidzyProvider');
  return context;
}

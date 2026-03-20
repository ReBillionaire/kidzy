import { createContext, useContext, useReducer, useEffect } from 'react';
import { loadData, saveData, generateId } from '../utils/storage';

const KidzyContext = createContext(null);
const KidzyDispatchContext = createContext(null);

// Simple payload validation helpers
function validateString(val, maxLen = 200) {
  return typeof val === 'string' && val.length > 0 && val.length <= maxLen;
}
function validateNumber(val, min = 0, max = 100000) {
  return typeof val === 'number' && !isNaN(val) && val >= min && val <= max;
}
function validateId(val) {
  return typeof val === 'string' && val.length > 0 && val.length < 100;
}

export function kidzyReducer(state, action) {
  try {
    switch (action.type) {
      // AUTH
      case 'SETUP_FAMILY': {
        const { familyName, pin, parentName, avatar } = action.payload;
        if (!validateString(parentName)) return state;
        const name = familyName && validateString(familyName) ? familyName : `${parentName}'s Family`;
        return {
          ...state,
          family: { id: generateId('fam'), name: name, pin: pin || null, createdAt: new Date().toISOString() },
          parents: [{ id: generateId('parent'), name: parentName, avatar: avatar || null, role: 'admin', createdAt: new Date().toISOString() }],
          currentParentId: null,
        };
      }
      case 'SET_FAMILY_PIN': {
        // Allow null to remove PIN protection
        return { ...state, family: { ...state.family, pin: action.payload || null } };
      }
      case 'SET_CURRENT_PARENT': {
        if (!validateId(action.payload)) return state;
        return { ...state, currentParentId: action.payload, kidMode: null, loggedOut: false };
      }
      case 'LOGOUT': {
        return { ...state, currentParentId: null, kidMode: null, loggedOut: true };
      }
      case 'SET_KID_MODE': {
        if (action.payload && !validateId(action.payload)) return state;
        // Kid mode: set kidMode and clear parent, mark as not logged out so we don't auto-login
        return { ...state, kidMode: action.payload || null, currentParentId: null, loggedOut: true };
      }
      case 'MARK_BADGE_SEEN': {
        if (!validateId(action.payload?.kidId) || !validateString(action.payload?.badgeId)) return state;
        return {
          ...state,
          seenBadges: {
            ...(state.seenBadges || {}),
            [action.payload.kidId]: [...((state.seenBadges || {})[action.payload.kidId] || []), action.payload.badgeId],
          }
        };
      }
      // PARENTS
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
      // KIDS
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
      // BEHAVIORS
      case 'ADD_BEHAVIOR_CATEGORY': {
        if (!validateString(action.payload?.name)) return state;
        return { ...state, behaviorCategories: [...state.behaviorCategories, { id: generateId('cat'), ...action.payload, items: action.payload.items || [] }] };
      }
      case 'REMOVE_BEHAVIOR_CATEGORY': {
        if (!validateId(action.payload)) return state;
        return { ...state, behaviorCategories: state.behaviorCategories.filter(c => c.id !== action.payload) };
      }
      case 'UPDATE_BEHAVIOR_CATEGORY': {
        if (!validateId(action.payload?.id)) return state;
        return {
          ...state,
          behaviorCategories: state.behaviorCategories.map(cat =>
            cat.id === action.payload.id ? { ...cat, ...action.payload } : cat
          ),
        };
      }
      case 'ADD_BEHAVIOR_ITEM': {
        if (!validateId(action.payload?.categoryId)) return state;
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
      // TRANSACTIONS
      case 'ADD_TRANSACTION': {
        if (!validateId(action.payload?.kidId) || !validateNumber(action.payload?.amount, 0)) return state;
        const tx = { id: generateId('tx'), ...action.payload, timestamp: new Date().toISOString() };
        return { ...state, transactions: [...state.transactions, tx] };
      }
      case 'REMOVE_TRANSACTION': {
        if (!validateId(action.payload)) return state;
        return { ...state, transactions: state.transactions.filter(t => t.id !== action.payload) };
      }
      // WISH LIST
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
      // DREAM GOALS
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
      // CHORES
      case 'ADD_CHORE': {
        if (!validateString(action.payload?.name) || !validateId(action.payload?.kidId)) return state;
        return { ...state, chores: [...(state.chores || []), { id: generateId('chore'), ...action.payload, createdAt: new Date().toISOString() }] };
      }
      case 'REMOVE_CHORE': {
        if (!validateId(action.payload)) return state;
        return {
          ...state,
          chores: (state.chores || []).filter(c => c.id !== action.payload),
          choreCompletions: (state.choreCompletions || []).filter(c => c.choreId !== action.payload),
        };
      }
      case 'COMPLETE_CHORE': {
        if (!validateId(action.payload?.choreId)) return state;
        return {
          ...state,
          choreCompletions: [...(state.choreCompletions || []), {
            id: generateId('cc'),
            ...action.payload,
            completedAt: new Date().toISOString(),
          }],
        };
      }
      case 'COMPLETE_CHORE_PENDING': {
        if (!validateId(action.payload?.choreId)) return state;
        return {
          ...state,
          pendingChoreCompletions: [...(state.pendingChoreCompletions || []), {
            id: generateId('pcc'),
            ...action.payload,
            requestedAt: new Date().toISOString(),
          }],
        };
      }
      case 'APPROVE_CHORE_COMPLETION': {
        if (!validateId(action.payload?.pendingId)) return state;
        const pending = (state.pendingChoreCompletions || []).find(p => p.id === action.payload.pendingId);
        if (!pending) return state;
        return {
          ...state,
          pendingChoreCompletions: (state.pendingChoreCompletions || []).filter(p => p.id !== action.payload.pendingId),
          choreCompletions: [...(state.choreCompletions || []), {
            id: generateId('cc'),
            choreId: pending.choreId,
            kidId: pending.kidId,
            date: pending.date,
            completedAt: new Date().toISOString(),
          }],
        };
      }
      case 'REJECT_CHORE_COMPLETION': {
        if (!validateId(action.payload)) return state;
        return {
          ...state,
          pendingChoreCompletions: (state.pendingChoreCompletions || []).filter(p => p.id !== action.payload),
        };
      }
      // CHALLENGES
      case 'COMPLETE_CHALLENGE': {
        const challenges = state.challenges || [];
        return { ...state, challenges: [...challenges, { ...action.payload, completedAt: new Date().toISOString() }] };
      }
      // SAVINGS & ALLOWANCE
      case 'SET_SAVINGS_ALLOCATION': {
        // payload: { kidId, save: 40, spend: 40, give: 20 } (percentages)
        if (!validateId(action.payload?.kidId)) return state;
        const { kidId, save = 40, spend = 40, give = 20 } = action.payload;
        return {
          ...state,
          savingsAllocations: {
            ...(state.savingsAllocations || {}),
            [kidId]: { save, spend, give }
          }
        };
      }
      case 'SET_ALLOWANCE': {
        // payload: { kidId, amount: 10, day: 'monday', enabled: true }
        if (!validateId(action.payload?.kidId)) return state;
        return {
          ...state,
          allowanceSettings: {
            ...(state.allowanceSettings || {}),
            [action.payload.kidId]: {
              amount: action.payload.amount || 0,
              day: action.payload.day || 'monday',
              enabled: action.payload.enabled ?? true,
            }
          }
        };
      }
      case 'DISTRIBUTE_ALLOWANCE': {
        // payload: { kidId, amount }
        if (!validateId(action.payload?.kidId) || !validateNumber(action.payload?.amount, 1)) return state;
        return {
          ...state,
          transactions: [...state.transactions, {
            id: generateId('tx'),
            kidId: action.payload.kidId,
            type: 'earn',
            amount: action.payload.amount,
            reason: 'Weekly Allowance',
            category: 'allowance',
            timestamp: new Date().toISOString(),
          }],
          lastAllowanceDistribution: {
            ...(state.lastAllowanceDistribution || {}),
            [action.payload.kidId]: new Date().toISOString(),
          }
        };
      }
      // SETTINGS
      case 'UPDATE_SETTINGS': {
        return { ...state, settings: { ...state.settings, ...action.payload } };
      }
      case 'SET_ONBOARDING_COMPLETE': {
        return { ...state, onboardingComplete: true };
      }
      // RESET
      case 'RESET_ALL': {
        return loadData();
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

export function KidzyProvider({ children }) {
  const [state, dispatch] = useReducer(kidzyReducer, null, loadData);

  // Auto-save on every state change
  useEffect(() => {
    if (state) saveData(state);
  }, [state]);

  // Auto-login after initial family setup (not after explicit logout or kid mode)
  useEffect(() => {
    if (state?.family && state.parents.length > 0 && !state.currentParentId && !state.loggedOut && !state.kidMode) {
      dispatch({ type: 'SET_CURRENT_PARENT', payload: state.parents[0].id });
    }
  }, [state?.family, state?.parents, state?.currentParentId, state?.loggedOut, state?.kidMode]);

  return (
    <KidzyContext.Provider value={state}>
      <KidzyDispatchContext.Provider value={dispatch}>
        {children}
      </KidzyDispatchContext.Provider>
    </KidzyContext.Provider>
  );
}

export function useKidzy() {
  const context = useContext(KidzyContext);
  // context is null during initial load (valid) or if outside provider (createContext default is null)
  // We allow null as a valid state during initialization
  return context;
}

export function useKidzyDispatch() {
  const context = useContext(KidzyDispatchContext);
  if (!context) throw new Error('useKidzyDispatch must be used within KidzyProvider');
  return context;
}

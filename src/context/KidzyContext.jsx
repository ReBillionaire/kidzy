import { createContext, useContext, useReducer, useEffect } from 'react';
import { loadData, saveData, generateId } from '../utils/storage';

const KidzyContext = createContext(null);
const KidzyDispatchContext = createContext(null);

// Simple payload validation helpers
function validateString(val, maxLen = 200) {
  return typeof val === 'string' && val.length <= maxLen;
}
function validateNumber(val, min = 0, max = 100000) {
  return typeof val === 'number' && !isNaN(val) && val >= min && val <= max;
}
function validateId(val) {
  return typeof val === 'string' && val.length > 0 && val.length < 100;
}

function kidzyReducer(state, action) {
  try {
    switch (action.type) {
      // AUTH
      case 'SETUP_FAMILY': {
        const { familyName, pin, parentName, avatar } = action.payload;
        if (!validateString(familyName) || !validateString(parentName)) return state;
        return {
          ...state,
          family: { id: generateId('fam'), name: familyName, pin, createdAt: new Date().toISOString() },
          parents: [{ id: generateId('parent'), name: parentName, avatar: avatar || null, role: 'admin', createdAt: new Date().toISOString() }],
          currentParentId: null,
        };
      }
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
      // CHALLENGES
      case 'COMPLETE_CHALLENGE': {
        const challenges = state.challenges || [];
        return { ...state, challenges: [...challenges, { ...action.payload, completedAt: new Date().toISOString() }] };
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
    return state; // Return unchanged state on error instead of crashing
  }
}

export function KidzyProvider({ children }) {
  const [state, dispatch] = useReducer(kidzyReducer, null, loadData);

  // Auto-save on every state change
  useEffect(() => {
    if (state) saveData(state);
  }, [state]);

  // Auto-login after initial family setup (not after explicit logout)
  useEffect(() => {
    if (state?.family && state.parents.length > 0 && !state.currentParentId && !state.loggedOut) {
      dispatch({ type: 'SET_CURRENT_PARENT', payload: state.parents[0].id });
    }
  }, [state?.family, state?.parents, state?.currentParentId, state?.loggedOut]);

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
  if (!context && context !== null) throw new Error('useKidzy must be used within KidzyProvider');
  return context;
}

export function useKidzyDispatch() {
  const context = useContext(KidzyDispatchContext);
  if (!context) throw new Error('useKidzyDispatch must be used within KidzyProvider');
  return context;
}

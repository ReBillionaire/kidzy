import { describe, it, expect, vi, beforeEach } from 'vitest';
import { kidzyReducer } from '../KidzyContext';

// Mock the storage module
vi.mock('../../utils/storage', () => ({
  loadData: () => ({
    family: null,
    parents: [],
    kids: [],
    behaviorCategories: [],
    transactions: [],
    wishListItems: [],
    dreamGoals: [],
    chores: [],
    choreCompletions: [],
    pendingChoreCompletions: [],
    weeklySummaries: [],
    currentParentId: null,
    settings: { currency: 'K$', soundEnabled: true, hapticEnabled: true },
    challenges: [],
    onboardingComplete: false,
  }),
  saveData: () => {},
  generateId: (prefix = 'id') => `${prefix}_test_${Math.random().toString(36).substr(2, 5)}`,
}));

describe('kidzyReducer', () => {
  const initialState = {
    family: { id: 'fam_test', name: 'Test Family', pin: null, createdAt: new Date().toISOString() },
    parents: [{ id: 'parent_1', name: 'Test Parent', role: 'admin', createdAt: new Date().toISOString() }],
    kids: [{ id: 'kid_1', name: 'Emma', age: 7, createdAt: new Date().toISOString() }],
    behaviorCategories: [],
    transactions: [],
    wishListItems: [],
    dreamGoals: [],
    chores: [],
    choreCompletions: [],
    pendingChoreCompletions: [],
    weeklySummaries: [],
    currentParentId: 'parent_1',
    settings: { currency: 'K$', soundEnabled: true, hapticEnabled: true },
    challenges: [],
    onboardingComplete: false,
  };

  describe('SETUP_FAMILY', () => {
    it('should create family with parent', () => {
      const state = {
        family: null,
        parents: [],
        kids: [],
        currentParentId: null,
      };
      const action = {
        type: 'SETUP_FAMILY',
        payload: {
          parentName: 'John Doe',
          familyName: 'Doe Family',
          pin: '1234',
          avatar: null,
        },
      };
      const newState = kidzyReducer(state, action);
      expect(newState.family).toBeDefined();
      expect(newState.family.name).toBe('Doe Family');
      expect(newState.parents).toHaveLength(1);
      expect(newState.parents[0].name).toBe('John Doe');
    });

    it('should generate default family name if not provided', () => {
      const state = { family: null, parents: [], kids: [], currentParentId: null };
      const action = {
        type: 'SETUP_FAMILY',
        payload: { parentName: 'Jane', pin: null, avatar: null },
      };
      const newState = kidzyReducer(state, action);
      expect(newState.family.name).toBe("Jane's Family");
    });

    it('should reject invalid parent name', () => {
      const state = { family: null, parents: [], kids: [], currentParentId: null };
      const action = {
        type: 'SETUP_FAMILY',
        payload: { parentName: '', familyName: 'Test', pin: null },
      };
      const newState = kidzyReducer(state, action);
      expect(newState).toBe(state);
    });

    it('should set currentParentId to null after setup', () => {
      const state = { family: null, parents: [], kids: [], currentParentId: null };
      const action = {
        type: 'SETUP_FAMILY',
        payload: { parentName: 'Test', pin: null, avatar: null },
      };
      const newState = kidzyReducer(state, action);
      expect(newState.currentParentId).toBeNull();
    });
  });

  describe('ADD_KID', () => {
    it('should add a new kid to the family', () => {
      const action = {
        type: 'ADD_KID',
        payload: { name: 'Liam', age: 9 },
      };
      const newState = kidzyReducer(initialState, action);
      expect(newState.kids).toHaveLength(2);
      expect(newState.kids[1].name).toBe('Liam');
      expect(newState.kids[1].age).toBe(9);
    });

    it('should generate unique ID for new kid', () => {
      const action = {
        type: 'ADD_KID',
        payload: { name: 'Olivia', age: 6 },
      };
      const newState = kidzyReducer(initialState, action);
      const addedKid = newState.kids[newState.kids.length - 1];
      expect(addedKid.id).toBeDefined();
      expect(addedKid.id).not.toBe('kid_1');
    });

    it('should reject invalid name (empty)', () => {
      const action = {
        type: 'ADD_KID',
        payload: { name: '', age: 5 },
      };
      const newState = kidzyReducer(initialState, action);
      expect(newState).toBe(initialState);
    });

    it('should reject name that is too long (>200 chars)', () => {
      const longName = 'a'.repeat(201);
      const action = {
        type: 'ADD_KID',
        payload: { name: longName, age: 5 },
      };
      const newState = kidzyReducer(initialState, action);
      expect(newState).toBe(initialState);
    });

    it('should add createdAt timestamp', () => {
      const action = {
        type: 'ADD_KID',
        payload: { name: 'Sophie', age: 8 },
      };
      const newState = kidzyReducer(initialState, action);
      const addedKid = newState.kids[newState.kids.length - 1];
      expect(addedKid.createdAt).toBeDefined();
      expect(new Date(addedKid.createdAt).getTime()).toBeGreaterThan(0);
    });
  });

  describe('ADD_TRANSACTION', () => {
    it('should add earn transaction', () => {
      const action = {
        type: 'ADD_TRANSACTION',
        payload: {
          kidId: 'kid_1',
          type: 'earn',
          amount: 10,
          reason: 'Completed chore',
        },
      };
      const newState = kidzyReducer(initialState, action);
      expect(newState.transactions).toHaveLength(1);
      expect(newState.transactions[0].type).toBe('earn');
      expect(newState.transactions[0].amount).toBe(10);
    });

    it('should add deduct transaction', () => {
      const action = {
        type: 'ADD_TRANSACTION',
        payload: {
          kidId: 'kid_1',
          type: 'deduct',
          amount: 5,
          reason: 'Broke a rule',
        },
      };
      const newState = kidzyReducer(initialState, action);
      expect(newState.transactions).toHaveLength(1);
      expect(newState.transactions[0].type).toBe('deduct');
    });

    it('should add redeem transaction', () => {
      const action = {
        type: 'ADD_TRANSACTION',
        payload: {
          kidId: 'kid_1',
          type: 'redeem',
          amount: 20,
          reason: 'Redeemed wish',
        },
      };
      const newState = kidzyReducer(initialState, action);
      expect(newState.transactions).toHaveLength(1);
      expect(newState.transactions[0].type).toBe('redeem');
    });

    it('should reject transaction with invalid kidId', () => {
      const action = {
        type: 'ADD_TRANSACTION',
        payload: {
          kidId: '',
          type: 'earn',
          amount: 10,
        },
      };
      const newState = kidzyReducer(initialState, action);
      expect(newState).toBe(initialState);
    });

    it('should reject transaction with negative amount', () => {
      const action = {
        type: 'ADD_TRANSACTION',
        payload: {
          kidId: 'kid_1',
          type: 'earn',
          amount: -10,
        },
      };
      const newState = kidzyReducer(initialState, action);
      expect(newState).toBe(initialState);
    });

    it('should add timestamp to transaction', () => {
      const beforeTime = new Date().getTime();
      const action = {
        type: 'ADD_TRANSACTION',
        payload: {
          kidId: 'kid_1',
          type: 'earn',
          amount: 10,
        },
      };
      const newState = kidzyReducer(initialState, action);
      const transaction = newState.transactions[0];
      const txTime = new Date(transaction.timestamp).getTime();
      expect(txTime).toBeGreaterThanOrEqual(beforeTime);
    });
  });

  describe('REMOVE_KID', () => {
    it('should remove kid from the family', () => {
      const action = {
        type: 'REMOVE_KID',
        payload: 'kid_1',
      };
      const newState = kidzyReducer(initialState, action);
      expect(newState.kids).toHaveLength(0);
      expect(newState.kids.find(k => k.id === 'kid_1')).toBeUndefined();
    });

    it('should cascade remove transactions for removed kid', () => {
      const stateWithTx = {
        ...initialState,
        transactions: [
          { id: 'tx_1', kidId: 'kid_1', type: 'earn', amount: 10 },
          { id: 'tx_2', kidId: 'kid_2', type: 'earn', amount: 20 },
        ],
      };
      const action = {
        type: 'REMOVE_KID',
        payload: 'kid_1',
      };
      const newState = kidzyReducer(stateWithTx, action);
      expect(newState.transactions).toHaveLength(1);
      expect(newState.transactions[0].kidId).toBe('kid_2');
    });

    it('should cascade remove wishes for removed kid', () => {
      const stateWithWishes = {
        ...initialState,
        wishListItems: [
          { id: 'wish_1', kidId: 'kid_1', name: 'Bike' },
          { id: 'wish_2', kidId: 'kid_2', name: 'Game' },
        ],
      };
      const action = {
        type: 'REMOVE_KID',
        payload: 'kid_1',
      };
      const newState = kidzyReducer(stateWithWishes, action);
      expect(newState.wishListItems).toHaveLength(1);
      expect(newState.wishListItems[0].kidId).toBe('kid_2');
    });

    it('should cascade remove dreams for removed kid', () => {
      const stateWithDreams = {
        ...initialState,
        dreamGoals: [
          { id: 'dream_1', kidId: 'kid_1', name: 'Learn piano' },
          { id: 'dream_2', kidId: 'kid_2', name: 'Learn swimming' },
        ],
      };
      const action = {
        type: 'REMOVE_KID',
        payload: 'kid_1',
      };
      const newState = kidzyReducer(stateWithDreams, action);
      expect(newState.dreamGoals).toHaveLength(1);
      expect(newState.dreamGoals[0].kidId).toBe('kid_2');
    });

    it('should reject invalid kidId', () => {
      const action = {
        type: 'REMOVE_KID',
        payload: '',
      };
      const newState = kidzyReducer(initialState, action);
      expect(newState).toBe(initialState);
    });
  });

  describe('COMPLETE_CHORE', () => {
    it('should add chore completion record', () => {
      const action = {
        type: 'COMPLETE_CHORE',
        payload: {
          choreId: 'chore_1',
          kidId: 'kid_1',
          date: '2024-01-15',
        },
      };
      const newState = kidzyReducer(initialState, action);
      expect(newState.choreCompletions).toHaveLength(1);
      expect(newState.choreCompletions[0].choreId).toBe('chore_1');
    });

    it('should add completedAt timestamp', () => {
      const action = {
        type: 'COMPLETE_CHORE',
        payload: {
          choreId: 'chore_1',
          kidId: 'kid_1',
          date: '2024-01-15',
        },
      };
      const newState = kidzyReducer(initialState, action);
      const completion = newState.choreCompletions[0];
      expect(completion.completedAt).toBeDefined();
    });

    it('should reject invalid choreId', () => {
      const action = {
        type: 'COMPLETE_CHORE',
        payload: {
          choreId: '',
          kidId: 'kid_1',
          date: '2024-01-15',
        },
      };
      const newState = kidzyReducer(initialState, action);
      expect(newState).toBe(initialState);
    });

    it('should allow multiple completions', () => {
      let state = initialState;
      for (let i = 0; i < 3; i++) {
        const action = {
          type: 'COMPLETE_CHORE',
          payload: {
            choreId: `chore_${i}`,
            kidId: 'kid_1',
            date: '2024-01-15',
          },
        };
        state = kidzyReducer(state, action);
      }
      expect(state.choreCompletions).toHaveLength(3);
    });
  });

  describe('LOGOUT', () => {
    it('should clear currentParentId', () => {
      const action = { type: 'LOGOUT' };
      const newState = kidzyReducer(initialState, action);
      expect(newState.currentParentId).toBeNull();
    });

    it('should clear kidMode', () => {
      const stateWithKidMode = { ...initialState, kidMode: 'kid_1' };
      const action = { type: 'LOGOUT' };
      const newState = kidzyReducer(stateWithKidMode, action);
      expect(newState.kidMode).toBeNull();
    });

    it('should set loggedOut flag', () => {
      const action = { type: 'LOGOUT' };
      const newState = kidzyReducer(initialState, action);
      expect(newState.loggedOut).toBe(true);
    });

    it('should preserve other state', () => {
      const action = { type: 'LOGOUT' };
      const newState = kidzyReducer(initialState, action);
      expect(newState.family).toEqual(initialState.family);
      expect(newState.kids).toEqual(initialState.kids);
    });
  });

  describe('SET_KID_MODE', () => {
    it('should set kidMode with valid kidId', () => {
      const action = {
        type: 'SET_KID_MODE',
        payload: 'kid_1',
      };
      const newState = kidzyReducer(initialState, action);
      expect(newState.kidMode).toBe('kid_1');
    });

    it('should clear currentParentId when entering kid mode', () => {
      const action = {
        type: 'SET_KID_MODE',
        payload: 'kid_1',
      };
      const newState = kidzyReducer(initialState, action);
      expect(newState.currentParentId).toBeNull();
    });

    it('should set loggedOut flag in kid mode', () => {
      const action = {
        type: 'SET_KID_MODE',
        payload: 'kid_1',
      };
      const newState = kidzyReducer(initialState, action);
      expect(newState.loggedOut).toBe(true);
    });

    it('should clear kidMode when payload is null', () => {
      const stateInKidMode = { ...initialState, kidMode: 'kid_1' };
      const action = {
        type: 'SET_KID_MODE',
        payload: null,
      };
      const newState = kidzyReducer(stateInKidMode, action);
      expect(newState.kidMode).toBeNull();
    });

    it('should reject invalid kidId (too long)', () => {
      const longId = 'x'.repeat(100);
      const action = {
        type: 'SET_KID_MODE',
        payload: longId,
      };
      const newState = kidzyReducer(initialState, action);
      expect(newState).toBe(initialState);
    });
  });

  describe('SET_CURRENT_PARENT', () => {
    it('should set currentParentId', () => {
      const state = { ...initialState, currentParentId: null };
      const action = {
        type: 'SET_CURRENT_PARENT',
        payload: 'parent_1',
      };
      const newState = kidzyReducer(state, action);
      expect(newState.currentParentId).toBe('parent_1');
    });

    it('should clear kidMode when setting parent', () => {
      const stateInKidMode = { ...initialState, kidMode: 'kid_1' };
      const action = {
        type: 'SET_CURRENT_PARENT',
        payload: 'parent_1',
      };
      const newState = kidzyReducer(stateInKidMode, action);
      expect(newState.kidMode).toBeNull();
    });

    it('should clear loggedOut flag', () => {
      const state = { ...initialState, loggedOut: true, currentParentId: null };
      const action = {
        type: 'SET_CURRENT_PARENT',
        payload: 'parent_1',
      };
      const newState = kidzyReducer(state, action);
      expect(newState.loggedOut).toBe(false);
    });

    it('should reject invalid parentId', () => {
      const action = {
        type: 'SET_CURRENT_PARENT',
        payload: '',
      };
      const newState = kidzyReducer(initialState, action);
      expect(newState).toBe(initialState);
    });
  });

  describe('Validation', () => {
    it('should validate string length in ADD_KID', () => {
      const longName = 'a'.repeat(250);
      const action = {
        type: 'ADD_KID',
        payload: { name: longName, age: 5 },
      };
      const newState = kidzyReducer(initialState, action);
      expect(newState.kids.length).toBe(initialState.kids.length);
    });

    it('should handle invalid action type gracefully', () => {
      const action = { type: 'INVALID_ACTION' };
      const newState = kidzyReducer(initialState, action);
      expect(newState).toBe(initialState);
    });

    it('should handle errors gracefully without throwing', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      // Create an invalid state that causes an error
      const badState = null;
      const action = {
        type: 'ADD_KID',
        payload: { name: 'Test', age: 5 },
      };
      // This should not throw even with a bad state
      expect(() => {
        kidzyReducer(badState, action);
      }).not.toThrow();
      consoleSpy.mockRestore();
    });
  });

  describe('ADD_WISH', () => {
    it('should add a wish item', () => {
      const action = {
        type: 'ADD_WISH',
        payload: {
          kidId: 'kid_1',
          name: 'New Bike',
          targetDollars: 50,
        },
      };
      const newState = kidzyReducer(initialState, action);
      expect(newState.wishListItems).toHaveLength(1);
      expect(newState.wishListItems[0].name).toBe('New Bike');
    });

    it('should reject wish without name', () => {
      const action = {
        type: 'ADD_WISH',
        payload: {
          kidId: 'kid_1',
          name: '',
          targetDollars: 50,
        },
      };
      const newState = kidzyReducer(initialState, action);
      expect(newState).toBe(initialState);
    });

    it('should reject wish without kidId', () => {
      const action = {
        type: 'ADD_WISH',
        payload: {
          kidId: '',
          name: 'New Bike',
          targetDollars: 50,
        },
      };
      const newState = kidzyReducer(initialState, action);
      expect(newState).toBe(initialState);
    });
  });

  describe('ADD_DREAM', () => {
    it('should add a dream goal', () => {
      const action = {
        type: 'ADD_DREAM',
        payload: {
          kidId: 'kid_1',
          name: 'Learn piano',
          description: 'Want to play Mozart',
        },
      };
      const newState = kidzyReducer(initialState, action);
      expect(newState.dreamGoals).toHaveLength(1);
      expect(newState.dreamGoals[0].name).toBe('Learn piano');
    });

    it('should reject dream without name', () => {
      const action = {
        type: 'ADD_DREAM',
        payload: {
          kidId: 'kid_1',
          name: '',
        },
      };
      const newState = kidzyReducer(initialState, action);
      expect(newState).toBe(initialState);
    });

    it('should reject dream without kidId', () => {
      const action = {
        type: 'ADD_DREAM',
        payload: {
          kidId: '',
          name: 'Learn swimming',
        },
      };
      const newState = kidzyReducer(initialState, action);
      expect(newState).toBe(initialState);
    });
  });

  describe('ADD_CHORE', () => {
    it('should add a chore', () => {
      const action = {
        type: 'ADD_CHORE',
        payload: {
          kidId: 'kid_1',
          name: 'Clean room',
          reward: 10,
        },
      };
      const newState = kidzyReducer(initialState, action);
      expect(newState.chores).toHaveLength(1);
      expect(newState.chores[0].name).toBe('Clean room');
    });

    it('should reject chore without name', () => {
      const action = {
        type: 'ADD_CHORE',
        payload: {
          kidId: 'kid_1',
          name: '',
          reward: 10,
        },
      };
      const newState = kidzyReducer(initialState, action);
      expect(newState.chores.length).toBe(initialState.chores.length);
    });

    it('should reject chore without kidId', () => {
      const action = {
        type: 'ADD_CHORE',
        payload: {
          kidId: '',
          name: 'Wash dishes',
          reward: 5,
        },
      };
      const newState = kidzyReducer(initialState, action);
      expect(newState.chores.length).toBe(initialState.chores.length);
    });
  });
});

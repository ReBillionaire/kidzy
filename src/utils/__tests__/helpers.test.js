import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getKidBalance,
  getKidEarningsToday,
  getStreak,
  getAchievements,
  rollMultiplier,
} from '../helpers';

describe('Helper Functions', () => {
  describe('getKidBalance', () => {
    it('should calculate zero balance with no transactions', () => {
      const balance = getKidBalance('kid_1', []);
      expect(balance).toBe(0);
    });

    it('should sum earn transactions', () => {
      const transactions = [
        { kidId: 'kid_1', type: 'earn', amount: 10 },
        { kidId: 'kid_1', type: 'earn', amount: 20 },
      ];
      const balance = getKidBalance('kid_1', transactions);
      expect(balance).toBe(30);
    });

    it('should subtract deduct transactions', () => {
      const transactions = [
        { kidId: 'kid_1', type: 'earn', amount: 50 },
        { kidId: 'kid_1', type: 'deduct', amount: 15 },
      ];
      const balance = getKidBalance('kid_1', transactions);
      expect(balance).toBe(35);
    });

    it('should subtract redeem transactions', () => {
      const transactions = [
        { kidId: 'kid_1', type: 'earn', amount: 100 },
        { kidId: 'kid_1', type: 'redeem', amount: 30 },
      ];
      const balance = getKidBalance('kid_1', transactions);
      expect(balance).toBe(70);
    });

    it('should only calculate balance for specified kid', () => {
      const transactions = [
        { kidId: 'kid_1', type: 'earn', amount: 50 },
        { kidId: 'kid_2', type: 'earn', amount: 100 },
      ];
      const balance = getKidBalance('kid_1', transactions);
      expect(balance).toBe(50);
    });

    it('should handle mixed transaction types', () => {
      const transactions = [
        { kidId: 'kid_1', type: 'earn', amount: 100 },
        { kidId: 'kid_1', type: 'deduct', amount: 20 },
        { kidId: 'kid_1', type: 'earn', amount: 50 },
        { kidId: 'kid_1', type: 'redeem', amount: 30 },
      ];
      const balance = getKidBalance('kid_1', transactions);
      expect(balance).toBe(100);
    });
  });

  describe('getKidEarningsToday', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-01-15T12:00:00Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should return zero with no earnings', () => {
      const transactions = [];
      const earnings = getKidEarningsToday('kid_1', transactions);
      expect(earnings).toBe(0);
    });

    it('should filter by today\'s date', () => {
      const transactions = [
        { kidId: 'kid_1', type: 'earn', amount: 10, timestamp: '2024-01-15T08:00:00Z' },
        { kidId: 'kid_1', type: 'earn', amount: 20, timestamp: '2024-01-14T23:00:00Z' },
      ];
      const earnings = getKidEarningsToday('kid_1', transactions);
      expect(earnings).toBe(10);
    });

    it('should only sum earn transactions', () => {
      const transactions = [
        { kidId: 'kid_1', type: 'earn', amount: 15, timestamp: '2024-01-15T08:00:00Z' },
        { kidId: 'kid_1', type: 'deduct', amount: 5, timestamp: '2024-01-15T09:00:00Z' },
        { kidId: 'kid_1', type: 'redeem', amount: 3, timestamp: '2024-01-15T10:00:00Z' },
      ];
      const earnings = getKidEarningsToday('kid_1', transactions);
      expect(earnings).toBe(15);
    });

    it('should filter by kid ID', () => {
      const transactions = [
        { kidId: 'kid_1', type: 'earn', amount: 20, timestamp: '2024-01-15T08:00:00Z' },
        { kidId: 'kid_2', type: 'earn', amount: 30, timestamp: '2024-01-15T09:00:00Z' },
      ];
      const earnings = getKidEarningsToday('kid_1', transactions);
      expect(earnings).toBe(20);
    });
  });

  describe('getStreak', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should return 0 with no transactions', () => {
      vi.setSystemTime(new Date('2024-01-15T12:00:00Z'));
      const streak = getStreak('kid_1', []);
      expect(streak).toBe(0);
    });

    it('should count consecutive days including today', () => {
      vi.setSystemTime(new Date('2024-01-15T12:00:00Z'));
      const transactions = [
        { kidId: 'kid_1', type: 'earn', amount: 10, timestamp: '2024-01-15T08:00:00Z' },
        { kidId: 'kid_1', type: 'earn', amount: 10, timestamp: '2024-01-14T08:00:00Z' },
        { kidId: 'kid_1', type: 'earn', amount: 10, timestamp: '2024-01-13T08:00:00Z' },
      ];
      const streak = getStreak('kid_1', transactions);
      expect(streak).toBe(3);
    });

    it('should break streak on missing day', () => {
      vi.setSystemTime(new Date('2024-01-15T12:00:00Z'));
      const transactions = [
        { kidId: 'kid_1', type: 'earn', amount: 10, timestamp: '2024-01-15T08:00:00Z' },
        { kidId: 'kid_1', type: 'earn', amount: 10, timestamp: '2024-01-14T08:00:00Z' },
        // missing 2024-01-13
        { kidId: 'kid_1', type: 'earn', amount: 10, timestamp: '2024-01-12T08:00:00Z' },
      ];
      const streak = getStreak('kid_1', transactions);
      expect(streak).toBe(2);
    });

    it('should only count for specified kid', () => {
      vi.setSystemTime(new Date('2024-01-15T12:00:00Z'));
      const transactions = [
        { kidId: 'kid_1', type: 'earn', amount: 10, timestamp: '2024-01-15T08:00:00Z' },
        { kidId: 'kid_1', type: 'earn', amount: 10, timestamp: '2024-01-14T08:00:00Z' },
        { kidId: 'kid_2', type: 'earn', amount: 10, timestamp: '2024-01-13T08:00:00Z' },
      ];
      const streak = getStreak('kid_1', transactions);
      expect(streak).toBe(2);
    });

    it('should handle multiple transactions per day', () => {
      vi.setSystemTime(new Date('2024-01-15T12:00:00Z'));
      const transactions = [
        { kidId: 'kid_1', type: 'earn', amount: 10, timestamp: '2024-01-15T08:00:00Z' },
        { kidId: 'kid_1', type: 'earn', amount: 5, timestamp: '2024-01-15T12:00:00Z' },
        { kidId: 'kid_1', type: 'earn', amount: 10, timestamp: '2024-01-14T08:00:00Z' },
      ];
      const streak = getStreak('kid_1', transactions);
      expect(streak).toBe(2);
    });
  });

  describe('getAchievements', () => {
    it('should return achievement structure with no transactions', () => {
      const result = getAchievements('kid_1', []);
      expect(result).toHaveProperty('all');
      expect(result).toHaveProperty('unlocked');
      expect(result).toHaveProperty('total');
      expect(Array.isArray(result.all)).toBe(true);
      expect(result.all.length).toBe(result.total);
    });

    it('should unlock first_earn badge on first transaction', () => {
      const transactions = [
        { kidId: 'kid_1', type: 'earn', amount: 10, timestamp: '2024-01-15T08:00:00Z' },
      ];
      const result = getAchievements('kid_1', transactions);
      const firstEarn = result.all.find(a => a.id === 'first_earn');
      expect(firstEarn).toBeDefined();
      expect(firstEarn.unlocked).toBe(true);
    });

    it('should unlock earn_50 badge when balance reaches 50', () => {
      const transactions = [
        { kidId: 'kid_1', type: 'earn', amount: 30, timestamp: '2024-01-15T08:00:00Z' },
        { kidId: 'kid_1', type: 'earn', amount: 25, timestamp: '2024-01-14T08:00:00Z' },
      ];
      const result = getAchievements('kid_1', transactions);
      const earn50 = result.all.find(a => a.id === 'earn_50');
      expect(earn50).toBeDefined();
      expect(earn50.unlocked).toBe(true);
    });

    it('should not unlock badges without meeting targets', () => {
      const transactions = [
        { kidId: 'kid_1', type: 'earn', amount: 10, timestamp: '2024-01-15T08:00:00Z' },
      ];
      const result = getAchievements('kid_1', transactions);
      const earn200 = result.all.find(a => a.id === 'earn_200');
      expect(earn200).toBeDefined();
      expect(earn200.unlocked).toBe(false);
    });

    it('should count only earn transactions for earning badges', () => {
      const transactions = [
        { kidId: 'kid_1', type: 'earn', amount: 50, timestamp: '2024-01-15T08:00:00Z' },
        { kidId: 'kid_1', type: 'redeem', amount: 30, timestamp: '2024-01-14T08:00:00Z' },
      ];
      const result = getAchievements('kid_1', transactions);
      const earn50 = result.all.find(a => a.id === 'earn_50');
      expect(earn50.unlocked).toBe(true);
    });

    it('should count redemptions for redeemer badge', () => {
      const transactions = [
        { kidId: 'kid_1', type: 'redeem', amount: 10, timestamp: '2024-01-15T08:00:00Z' },
      ];
      const result = getAchievements('kid_1', transactions);
      const redeemer = result.all.find(a => a.id === 'redeemer');
      expect(redeemer).toBeDefined();
      expect(redeemer.unlocked).toBe(true);
    });

    it('should calculate unlocked count correctly', () => {
      const transactions = [
        { kidId: 'kid_1', type: 'earn', amount: 10, timestamp: '2024-01-15T08:00:00Z' },
        { kidId: 'kid_1', type: 'earn', amount: 10, timestamp: '2024-01-14T08:00:00Z' },
      ];
      const result = getAchievements('kid_1', transactions);
      const unlockedCount = result.all.filter(a => a.unlocked).length;
      expect(result.unlocked).toBe(unlockedCount);
    });
  });

  describe('rollMultiplier', () => {
    it('should return object with multiplier and label', () => {
      const result = rollMultiplier();
      expect(result).toHaveProperty('multiplier');
      expect(result).toHaveProperty('label');
      expect(typeof result.multiplier).toBe('number');
      expect(typeof result.label).toBe('string');
    });

    it('should return valid multiplier values (1, 2, or 3)', () => {
      const validMultipliers = [1, 2, 3];
      for (let i = 0; i < 100; i++) {
        const result = rollMultiplier();
        expect(validMultipliers).toContain(result.multiplier);
      }
    });

    it('should return TRIPLE BONUS for multiplier 3', () => {
      // Mock Math.random to return a value < 5 (should give 3x)
      const originalRandom = Math.random;
      Math.random = () => 0.03;
      const result = rollMultiplier();
      Math.random = originalRandom;
      expect(result.multiplier).toBe(3);
      expect(result.label).toBe('TRIPLE BONUS!');
    });

    it('should return DOUBLE BONUS for multiplier 2', () => {
      // Mock Math.random to return a value 5-19 (should give 2x)
      const originalRandom = Math.random;
      Math.random = () => 0.12;
      const result = rollMultiplier();
      Math.random = originalRandom;
      expect(result.multiplier).toBe(2);
      expect(result.label).toBe('DOUBLE BONUS!');
    });

    it('should return no label for multiplier 1', () => {
      // Mock Math.random to return a value >= 20 (should give 1x)
      const originalRandom = Math.random;
      Math.random = () => 0.5;
      const result = rollMultiplier();
      Math.random = originalRandom;
      expect(result.multiplier).toBe(1);
      expect(result.label).toBe('');
    });
  });
});

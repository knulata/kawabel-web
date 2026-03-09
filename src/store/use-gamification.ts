'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { playCorrect, playWrong, playXP, playCombo, playChestOpen, playLevelUp } from '@/lib/sounds';
import { hapticSuccess, hapticError, hapticMedium, hapticLight } from '@/lib/haptics';

// Duolingo-style XP thresholds per level
const LEVEL_THRESHOLDS = [
  0, 100, 250, 500, 850, 1300, 1900, 2600, 3500, 4600, 6000, 7800, 10000,
  13000, 17000, 22000, 28000, 35000, 43000, 52000, 62000,
];

export function getLevelFromXP(xp: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) return i + 1;
  }
  return 1;
}

export function getXPForNextLevel(xp: number): { current: number; needed: number } {
  const level = getLevelFromXP(xp);
  const currentThreshold = LEVEL_THRESHOLDS[level - 1] ?? 0;
  const nextThreshold = LEVEL_THRESHOLDS[level] ?? LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1] + 10000;
  return {
    current: xp - currentThreshold,
    needed: nextThreshold - currentThreshold,
  };
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function yesterdayStr(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

export type ChestReward =
  | { type: 'xp'; amount: number }
  | { type: 'gems'; amount: number }
  | { type: 'streak_freeze' }
  | { type: 'heart_refill' };

interface GamificationState {
  xp: number;
  streak: number;
  lastActiveDate: string;
  combo: number;
  maxCombo: number;
  gems: number;
  hearts: number;
  heartsLostAt: number | null; // timestamp when last heart was lost (for regen)
  chestsAvailable: number;
  chestsOpened: number;
  friendIds: number[];
  achievements: string[];
  dailyGoalXP: number;
  dailyXP: number;
  dailyXPDate: string;
  streakFreezes: number;

  // Actions
  addXP: (amount: number) => void;
  correctAnswer: () => void;
  wrongAnswer: () => void;
  breakCombo: () => void;
  openChest: () => ChestReward | null;
  checkStreak: () => void;
  addFriend: (id: number) => void;
  removeFriend: (id: number) => void;
  nudgeFriend: (id: number) => void;
  earnAchievement: (id: string) => void;
  regenHearts: () => void;
  refillHeartsWithGems: () => void;
}

const HEART_REGEN_MS = 30 * 60 * 1000; // 30 minutes

export const useGamification = create<GamificationState>()(
  persist(
    (set, get) => ({
      xp: 0,
      streak: 0,
      lastActiveDate: '',
      combo: 0,
      maxCombo: 0,
      gems: 0,
      hearts: 5,
      heartsLostAt: null,
      chestsAvailable: 0,
      chestsOpened: 0,
      friendIds: [],
      achievements: [],
      dailyGoalXP: 50,
      dailyXP: 0,
      dailyXPDate: todayStr(),
      streakFreezes: 0,

      addXP: (amount) => {
        const state = get();
        const today = todayStr();
        const prevLevel = getLevelFromXP(state.xp);
        const newXP = state.xp + amount;
        const newLevel = getLevelFromXP(newXP);
        const dailyXP = state.dailyXPDate === today ? state.dailyXP + amount : amount;

        playXP();
        hapticLight();

        if (newLevel > prevLevel) {
          setTimeout(() => playLevelUp(), 300);
        }

        // Award chest every 100 XP
        const prevHundreds = Math.floor(state.xp / 100);
        const newHundreds = Math.floor(newXP / 100);
        const newChests = newHundreds - prevHundreds;

        set({
          xp: newXP,
          dailyXP,
          dailyXPDate: today,
          chestsAvailable: state.chestsAvailable + newChests,
        });
      },

      correctAnswer: () => {
        const state = get();
        const newCombo = state.combo + 1;
        const maxCombo = Math.max(newCombo, state.maxCombo);

        playCorrect();
        hapticSuccess();

        if (newCombo > 1) {
          setTimeout(() => playCombo(newCombo), 200);
        }

        // Combo XP bonus
        const bonusXP = newCombo >= 10 ? 5 : newCombo >= 5 ? 3 : newCombo >= 3 ? 2 : 0;

        set({ combo: newCombo, maxCombo });

        // Add base XP + bonus
        get().addXP(10 + bonusXP);
      },

      wrongAnswer: () => {
        const state = get();
        playWrong();
        hapticError();
        set({
          combo: 0,
          hearts: Math.max(0, state.hearts - 1),
          heartsLostAt: state.hearts > 0 ? Date.now() : state.heartsLostAt,
        });
      },

      breakCombo: () => {
        set({ combo: 0 });
      },

      openChest: () => {
        const state = get();
        if (state.chestsAvailable <= 0) return null;

        playChestOpen();
        hapticMedium();

        // Random reward
        const roll = Math.random();
        let reward: ChestReward;
        if (roll < 0.4) {
          reward = { type: 'xp', amount: 20 + Math.floor(Math.random() * 30) };
        } else if (roll < 0.7) {
          reward = { type: 'gems', amount: 5 + Math.floor(Math.random() * 10) };
        } else if (roll < 0.85) {
          reward = { type: 'streak_freeze' };
        } else {
          reward = { type: 'heart_refill' };
        }

        const updates: Partial<GamificationState> = {
          chestsAvailable: state.chestsAvailable - 1,
          chestsOpened: state.chestsOpened + 1,
        };

        if (reward.type === 'xp') {
          updates.xp = state.xp + reward.amount;
        } else if (reward.type === 'gems') {
          updates.gems = state.gems + reward.amount;
        } else if (reward.type === 'streak_freeze') {
          updates.streakFreezes = state.streakFreezes + 1;
        } else if (reward.type === 'heart_refill') {
          updates.hearts = 5;
          updates.heartsLostAt = null;
        }

        set(updates as GamificationState);
        return reward;
      },

      checkStreak: () => {
        const state = get();
        const today = todayStr();
        const yesterday = yesterdayStr();

        if (state.lastActiveDate === today) return; // already checked today

        if (state.lastActiveDate === yesterday) {
          // Continue streak
          set({ streak: state.streak + 1, lastActiveDate: today });
        } else if (state.lastActiveDate && state.lastActiveDate !== today) {
          // Missed a day — check for streak freeze
          if (state.streakFreezes > 0) {
            set({
              streakFreezes: state.streakFreezes - 1,
              lastActiveDate: today,
            });
          } else {
            set({ streak: 1, lastActiveDate: today });
          }
        } else {
          // First ever session
          set({ streak: 1, lastActiveDate: today });
        }
      },

      addFriend: (id) => {
        const state = get();
        if (!state.friendIds.includes(id)) {
          set({ friendIds: [...state.friendIds, id] });
        }
      },

      removeFriend: (id) => {
        set({ friendIds: get().friendIds.filter((f) => f !== id) });
      },

      nudgeFriend: (_id) => {
        // Placeholder — would call API to send push notification
        hapticMedium();
      },

      earnAchievement: (id) => {
        const state = get();
        if (state.achievements.includes(id)) return;
        set({ achievements: [...state.achievements, id] });
      },

      regenHearts: () => {
        const state = get();
        if (state.hearts >= 5 || !state.heartsLostAt) return;
        const elapsed = Date.now() - state.heartsLostAt;
        const recovered = Math.floor(elapsed / HEART_REGEN_MS);
        if (recovered > 0) {
          const newHearts = Math.min(5, state.hearts + recovered);
          set({
            hearts: newHearts,
            heartsLostAt: newHearts >= 5 ? null : state.heartsLostAt + recovered * HEART_REGEN_MS,
          });
        }
      },

      refillHeartsWithGems: () => {
        const state = get();
        if (state.gems >= 20) {
          set({ hearts: 5, gems: state.gems - 20, heartsLostAt: null });
          hapticSuccess();
        }
      },
    }),
    { name: 'kawabel-gamification' },
  ),
);

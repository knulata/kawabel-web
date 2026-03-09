'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { FREE_LIMITS, TRIAL_DAYS } from '@/lib/constants';

type Plan = 'trial' | 'free' | 'premium';
type Feature = keyof typeof FREE_LIMITS;

interface DailyUsage {
  chats: number;
  photos: number;
  quizzes: number;
  dictations: number;
  date: string;
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function daysBetween(a: string, b: string): number {
  const msPerDay = 86_400_000;
  return Math.floor((new Date(b).getTime() - new Date(a).getTime()) / msPerDay);
}

interface SubscriptionState {
  plan: Plan;
  trialStartDate: string | null;
  premiumUntil: string | null;
  paymentPending: boolean;
  dailyUsage: DailyUsage;

  // Computed helpers
  trialDaysLeft: () => number;
  isPremium: () => boolean;
  canUse: (feature: Feature) => boolean;

  // Actions
  incrementUsage: (feature: Feature) => void;
  startTrial: () => void;
  setPremium: (until: string) => void;
  setPaymentPending: (pending: boolean) => void;
}

export const useSubscription = create<SubscriptionState>()(
  persist(
    (set, get) => ({
      plan: 'free',
      trialStartDate: null,
      premiumUntil: null,
      paymentPending: false,
      dailyUsage: { chats: 0, photos: 0, quizzes: 0, dictations: 0, date: todayStr() },

      trialDaysLeft: () => {
        const state = get();
        if (!state.trialStartDate) return 0;
        const elapsed = daysBetween(state.trialStartDate, todayStr());
        return Math.max(0, TRIAL_DAYS - elapsed);
      },

      isPremium: () => {
        const state = get();
        // Active trial
        if (state.plan === 'trial' && state.trialStartDate) {
          const elapsed = daysBetween(state.trialStartDate, todayStr());
          if (elapsed < TRIAL_DAYS) return true;
        }
        // Active premium
        if (state.plan === 'premium' && state.premiumUntil) {
          return todayStr() <= state.premiumUntil;
        }
        return false;
      },

      canUse: (feature: Feature) => {
        const state = get();
        // Premium users have unlimited access
        if (state.isPremium()) return true;

        // Free tier — check daily limits
        const usage = state.dailyUsage;
        // Reset if new day
        if (usage.date !== todayStr()) return true; // will be reset on increment
        return usage[feature] < FREE_LIMITS[feature];
      },

      incrementUsage: (feature: Feature) => {
        const state = get();
        const today = todayStr();
        const usage = state.dailyUsage.date === today
          ? { ...state.dailyUsage }
          : { chats: 0, photos: 0, quizzes: 0, dictations: 0, date: today };

        usage[feature] = usage[feature] + 1;
        set({ dailyUsage: usage });
      },

      startTrial: () => {
        set({
          plan: 'trial',
          trialStartDate: todayStr(),
        });
      },

      setPremium: (until: string) => {
        set({
          plan: 'premium',
          premiumUntil: until,
          paymentPending: false,
        });
      },

      setPaymentPending: (pending: boolean) => {
        set({ paymentPending: pending });
      },
    }),
    {
      name: 'kawabel-subscription',
      // Rehydrate: check if trial has expired
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        if (state.plan === 'trial' && state.trialStartDate) {
          const elapsed = daysBetween(state.trialStartDate, todayStr());
          if (elapsed >= TRIAL_DAYS) {
            state.plan = 'free';
          }
        }
        if (state.plan === 'premium' && state.premiumUntil) {
          if (todayStr() > state.premiumUntil) {
            state.plan = 'free';
          }
        }
      },
    },
  ),
);

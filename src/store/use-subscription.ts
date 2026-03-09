'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { FREE_LIMITS, PREMIUM_LIMITS, TRIAL_DAYS, VOUCHER_CODES } from '@/lib/constants';

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
  redeemedVouchers: string[];

  // Computed helpers
  trialDaysLeft: () => number;
  isPremium: () => boolean;
  canUse: (feature: Feature) => boolean;

  // Actions
  incrementUsage: (feature: Feature) => void;
  startTrial: () => void;
  setPremium: (until: string) => void;
  setPaymentPending: (pending: boolean) => void;
  redeemVoucher: (code: string) => { success: boolean; message: string };
}

export const useSubscription = create<SubscriptionState>()(
  persist(
    (set, get) => ({
      plan: 'free',
      trialStartDate: null,
      premiumUntil: null,
      paymentPending: false,
      dailyUsage: { chats: 0, photos: 0, quizzes: 0, dictations: 0, date: todayStr() },
      redeemedVouchers: [],

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
        const usage = state.dailyUsage;
        // Reset if new day
        if (usage.date !== todayStr()) return true; // will be reset on increment

        // Premium/trial — soft caps (fair use)
        if (state.isPremium()) {
          return usage[feature] < PREMIUM_LIMITS[feature];
        }

        // Free tier — tight daily limits
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

      redeemVoucher: (code: string) => {
        const state = get();
        const normalized = code.trim().toUpperCase();
        const voucher = VOUCHER_CODES[normalized];

        if (!voucher) {
          return { success: false, message: 'Kode voucher tidak valid' };
        }
        if (state.redeemedVouchers.includes(normalized)) {
          return { success: false, message: 'Voucher ini sudah pernah dipakai' };
        }

        // Calculate premium end date
        const start = state.premiumUntil && state.premiumUntil > todayStr()
          ? new Date(state.premiumUntil)
          : new Date();
        start.setMonth(start.getMonth() + voucher.months);
        const until = start.toISOString().slice(0, 10);

        set({
          plan: 'premium',
          premiumUntil: until,
          paymentPending: false,
          redeemedVouchers: [...state.redeemedVouchers, normalized],
        });

        return { success: true, message: `${voucher.label} berhasil diaktifkan! Premium sampai ${until}` };
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

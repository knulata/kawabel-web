'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useSubscription } from '@/store/use-subscription';
import { TRIAL_DAYS } from '@/lib/constants';
import { X, Crown, Clock } from 'lucide-react';

export function TrialBanner() {
  const { plan, trialDaysLeft, isPremium } = useSubscription();
  const [dismissed, setDismissed] = useState(false);
  const daysLeft = trialDaysLeft();
  const premium = isPremium();

  // Only show during active trial
  if (plan !== 'trial' || !premium || dismissed) return null;

  const progress = ((TRIAL_DAYS - daysLeft) / TRIAL_DAYS) * 100;
  const urgent = daysLeft <= 2;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className={`relative rounded-2xl p-3.5 mx-4 mt-2 ${
          urgent
            ? 'bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/50'
            : 'bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200/50'
        }`}
      >
        {/* Dismiss button */}
        <button
          onClick={() => setDismissed(true)}
          className="absolute top-2 right-2 p-1 rounded-full hover:bg-black/5 transition-colors text-muted-foreground"
        >
          <X size={14} />
        </button>

        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              urgent
                ? 'bg-amber-100'
                : 'bg-green-100'
            }`}
          >
            <Clock
              size={18}
              className={urgent ? 'text-amber-600' : 'text-green-600'}
            />
          </div>

          <div className="flex-1 min-w-0">
            <p className={`text-sm font-semibold ${urgent ? 'text-amber-800' : 'text-green-800'}`}>
              Masa percobaan: {daysLeft} hari tersisa
            </p>

            {/* Progress bar */}
            <div className="mt-1.5 h-1.5 rounded-full bg-black/5 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className={`h-full rounded-full ${
                  urgent
                    ? 'bg-gradient-to-r from-amber-400 to-orange-400'
                    : 'bg-gradient-to-r from-green-400 to-emerald-400'
                }`}
              />
            </div>

            <Link
              href="/pricing"
              className={`inline-flex items-center gap-1 text-xs font-medium mt-1.5 ${
                urgent
                  ? 'text-amber-700 hover:text-amber-900'
                  : 'text-green-700 hover:text-green-900'
              } transition-colors`}
            >
              <Crown size={12} />
              Berlangganan sekarang
            </Link>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useGamification } from '@/store/use-gamification';

export function DailyGoal() {
  const { dailyXP, dailyGoalXP } = useGamification();
  const pct = Math.min(dailyXP / dailyGoalXP, 1);
  const done = pct >= 1;
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - pct);

  return (
    <div className="flex items-center gap-3">
      <div className="relative w-20 h-20 flex-shrink-0">
        <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
          {/* Background ring */}
          <circle
            cx="40"
            cy="40"
            r={radius}
            fill="none"
            stroke="currentColor"
            className="text-muted"
            strokeWidth="6"
          />
          {/* Progress ring */}
          <motion.circle
            cx="40"
            cy="40"
            r={radius}
            fill="none"
            stroke="url(#goalGradient)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ type: 'spring', stiffness: 60, damping: 15 }}
          />
          <defs>
            <linearGradient id="goalGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#4CAF50" />
              <stop offset="100%" stopColor="#FFD700" />
            </linearGradient>
          </defs>
        </svg>

        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <AnimatePresence mode="wait">
            {done ? (
              <motion.div
                key="done"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="text-center"
              >
                <span className="text-lg">✅</span>
              </motion.div>
            ) : (
              <motion.div
                key="progress"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center"
              >
                <span className="text-sm font-bold text-foreground">{dailyXP}</span>
                <span className="text-[10px] text-muted-foreground block">
                  /{dailyGoalXP}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div>
        <p className="text-sm font-semibold text-foreground">Target Harian</p>
        <p className="text-xs text-muted-foreground">
          {done ? 'Selesai! Keren banget! 🎉' : `${dailyGoalXP - dailyXP} XP lagi`}
        </p>
      </div>

      {/* Celebration animation */}
      <AnimatePresence>
        {done && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="ml-auto"
          >
            <span className="px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold">
              Selesai! 🌟
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

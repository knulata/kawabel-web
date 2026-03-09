'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGamification } from '@/store/use-gamification';

const HEART_REGEN_MS = 30 * 60 * 1000;

export function HeartsDisplay() {
  const { hearts, heartsLostAt, gems, regenHearts, refillHeartsWithGems } = useGamification();
  const [timeLeft, setTimeLeft] = useState('');
  const [breakingIndex, setBreakingIndex] = useState<number | null>(null);

  // Timer for heart regen countdown
  useEffect(() => {
    if (hearts >= 5 || !heartsLostAt) {
      setTimeLeft('');
      return;
    }

    const tick = () => {
      regenHearts();
      const elapsed = Date.now() - heartsLostAt;
      const nextRegenAt = HEART_REGEN_MS - (elapsed % HEART_REGEN_MS);
      const mins = Math.floor(nextRegenAt / 60000);
      const secs = Math.floor((nextRegenAt % 60000) / 1000);
      setTimeLeft(`${mins}:${secs.toString().padStart(2, '0')}`);
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [hearts, heartsLostAt, regenHearts]);

  // Animate heart break when hearts decrease
  useEffect(() => {
    if (hearts < 5) {
      setBreakingIndex(hearts); // the heart that just broke
      const t = setTimeout(() => setBreakingIndex(null), 600);
      return () => clearTimeout(t);
    }
  }, [hearts]);

  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => {
          const filled = i < hearts;
          const breaking = i === breakingIndex;

          return (
            <AnimatePresence key={i} mode="wait">
              {breaking ? (
                <motion.span
                  key="breaking"
                  className="text-lg"
                  initial={{ scale: 1 }}
                  animate={{ scale: [1, 1.4, 0.8], opacity: [1, 1, 0.5], rotate: [0, -15, 15] }}
                  transition={{ duration: 0.5 }}
                >
                  💔
                </motion.span>
              ) : (
                <motion.span
                  key={filled ? 'filled' : 'empty'}
                  className="text-lg"
                  initial={false}
                  animate={{ scale: filled ? 1 : 0.85, opacity: filled ? 1 : 0.3 }}
                >
                  {filled ? '❤️' : '🤍'}
                </motion.span>
              )}
            </AnimatePresence>
          );
        })}
      </div>

      {/* Regen timer */}
      {hearts < 5 && timeLeft && (
        <span className="text-[10px] text-muted-foreground">
          ⏱ {timeLeft}
        </span>
      )}

      {/* Refill button */}
      {hearts < 5 && gems >= 20 && (
        <button
          onClick={refillHeartsWithGems}
          className="text-[10px] px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors"
        >
          Isi penuh 20💎
        </button>
      )}
    </div>
  );
}

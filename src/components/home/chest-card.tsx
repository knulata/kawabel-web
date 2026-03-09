'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGamification, type ChestReward } from '@/store/use-gamification';

const REWARD_LABELS: Record<string, (r: ChestReward) => string> = {
  xp: (r) => `+${(r as { amount: number }).amount} XP`,
  gems: (r) => `+${(r as { amount: number }).amount} 💎`,
  streak_freeze: () => '🛡️ Streak Freeze!',
  heart_refill: () => '❤️ Hati penuh!',
};

export function ChestCard() {
  const { chestsAvailable, openChest } = useGamification();
  const [reward, setReward] = useState<ChestReward | null>(null);
  const [opening, setOpening] = useState(false);

  const handleOpen = () => {
    if (chestsAvailable <= 0 || opening) return;
    setOpening(true);

    // Dramatic delay before reveal
    setTimeout(() => {
      const r = openChest();
      setReward(r);

      // Auto dismiss
      setTimeout(() => {
        setReward(null);
        setOpening(false);
      }, 2500);
    }, 800);
  };

  if (chestsAvailable <= 0 && !opening) return null;

  return (
    <div className="relative">
      <motion.button
        onClick={handleOpen}
        disabled={opening}
        className="w-full p-4 rounded-2xl bg-gradient-to-br from-amber-100 to-yellow-50 border border-amber-200 shadow-sm text-center"
        animate={
          !opening
            ? { rotate: [0, -2, 2, -2, 0], scale: [1, 1.02, 1] }
            : {}
        }
        transition={
          !opening
            ? { repeat: Infinity, duration: 2, repeatDelay: 1 }
            : {}
        }
        whileTap={{ scale: 0.95 }}
      >
        <AnimatePresence mode="wait">
          {!opening ? (
            <motion.div
              key="closed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <span className="text-4xl block mb-1">🎁</span>
              <p className="text-sm font-semibold text-amber-800">
                {chestsAvailable} Peti Harta Karun
              </p>
              <p className="text-xs text-amber-600">Ketuk untuk buka!</p>
            </motion.div>
          ) : !reward ? (
            <motion.div
              key="opening"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {/* Opening animation */}
              <motion.span
                className="text-5xl block"
                animate={{
                  y: [0, -10, 0],
                  rotateY: [0, 180, 360],
                  scale: [1, 1.3, 1],
                }}
                transition={{ duration: 0.8, ease: 'easeInOut' }}
              >
                ✨
              </motion.span>
              <p className="text-xs text-amber-600 mt-1">Membuka...</p>
            </motion.div>
          ) : (
            <motion.div
              key="reward"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
            >
              {/* Light beams */}
              <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
                {Array.from({ length: 8 }).map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute top-1/2 left-1/2 w-0.5 h-16 bg-gradient-to-t from-yellow-300/60 to-transparent origin-bottom"
                    style={{ rotate: `${i * 45}deg` }}
                    initial={{ scaleY: 0, opacity: 0 }}
                    animate={{ scaleY: 1, opacity: [0, 0.8, 0] }}
                    transition={{ duration: 1, delay: i * 0.05 }}
                  />
                ))}
              </div>

              {/* Sparkle particles */}
              {Array.from({ length: 10 }).map((_, i) => (
                <motion.span
                  key={i}
                  className="absolute text-xs pointer-events-none"
                  style={{
                    left: `${30 + Math.random() * 40}%`,
                    top: `${20 + Math.random() * 40}%`,
                  }}
                  initial={{ opacity: 1, scale: 1 }}
                  animate={{
                    opacity: 0,
                    scale: 0,
                    y: -20 - Math.random() * 30,
                    x: (Math.random() - 0.5) * 40,
                  }}
                  transition={{ duration: 1, delay: Math.random() * 0.3 }}
                >
                  ✨
                </motion.span>
              ))}

              <span className="text-3xl block mb-1">🎉</span>
              <p className="text-lg font-bold text-amber-800 relative z-10">
                {REWARD_LABELS[reward.type](reward)}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}

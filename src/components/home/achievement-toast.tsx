'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ACHIEVEMENT_MAP } from '@/lib/achievements';

interface AchievementToastProps {
  achievementId: string | null;
  onDismiss: () => void;
}

export function AchievementToast({ achievementId, onDismiss }: AchievementToastProps) {
  const achievement = achievementId ? ACHIEVEMENT_MAP[achievementId] : null;

  useEffect(() => {
    if (!achievementId) return;
    const t = setTimeout(onDismiss, 3000);
    return () => clearTimeout(t);
  }, [achievementId, onDismiss]);

  return (
    <AnimatePresence>
      {achievement && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onDismiss}
        >
          {/* Confetti particles */}
          {Array.from({ length: 30 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full"
              style={{
                backgroundColor: ['#FFD700', '#FF6B6B', '#4CAF50', '#2196F3', '#9C27B0', '#FF9800'][
                  i % 6
                ],
                left: `${Math.random() * 100}%`,
                top: '-5%',
              }}
              initial={{ opacity: 1, y: 0, rotate: 0 }}
              animate={{
                opacity: 0,
                y: window?.innerHeight ?? 600,
                x: (Math.random() - 0.5) * 200,
                rotate: Math.random() * 720,
              }}
              transition={{
                duration: 2 + Math.random(),
                delay: Math.random() * 0.5,
                ease: 'easeIn',
              }}
            />
          ))}

          {/* Achievement card */}
          <motion.div
            className="bg-white rounded-3xl p-8 shadow-2xl max-w-xs w-full mx-4 text-center relative overflow-hidden"
            initial={{ scale: 0.3, y: 50, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Shimmer background */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-100/50 to-transparent"
              animate={{ x: ['-100%', '200%'] }}
              transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
            />

            <div className="relative z-10">
              <motion.div
                className="text-5xl mb-3"
                initial={{ scale: 0, rotate: -30 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', delay: 0.2, stiffness: 200 }}
              >
                {achievement.icon}
              </motion.div>

              <motion.p
                className="text-xs uppercase tracking-wider text-amber-600 font-semibold mb-1"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                Pencapaian Baru!
              </motion.p>

              <motion.h3
                className="text-xl font-bold text-foreground mb-1"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                {achievement.name}
              </motion.h3>

              <motion.p
                className="text-sm text-muted-foreground mb-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                {achievement.description}
              </motion.p>

              <motion.div
                className="inline-block px-3 py-1 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-white text-sm font-bold"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 }}
              >
                +{achievement.xpReward} XP
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

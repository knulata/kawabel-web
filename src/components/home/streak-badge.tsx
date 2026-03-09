'use client';

import { motion } from 'framer-motion';
import { useGamification } from '@/store/use-gamification';

export function StreakBadge() {
  const { streak, streakFreezes, gems } = useGamification();
  const active = streak > 0;

  const buyFreeze = () => {
    if (gems >= 10) {
      useGamification.setState((s) => ({
        streakFreezes: s.streakFreezes + 1,
        gems: s.gems - 10,
      }));
    }
  };

  return (
    <div className="flex items-center gap-2">
      <motion.div
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold shadow-sm ${
          active
            ? 'bg-gradient-to-r from-orange-400 to-red-500 text-white'
            : 'bg-muted text-muted-foreground'
        }`}
        animate={active ? { scale: [1, 1.05, 1] } : {}}
        transition={active ? { repeat: Infinity, duration: 2, ease: 'easeInOut' } : {}}
      >
        <motion.span
          className="text-lg"
          animate={active ? { y: [0, -2, 0], rotate: [0, -5, 5, 0] } : {}}
          transition={active ? { repeat: Infinity, duration: 1.5 } : {}}
        >
          {active ? '🔥' : '❄️'}
        </motion.span>
        <span>{streak}</span>
      </motion.div>

      {/* Streak freeze indicator */}
      {streakFreezes > 0 && (
        <span className="text-xs text-blue-400" title="Streak freeze tersedia">
          🛡️{streakFreezes}
        </span>
      )}

      {/* Buy freeze button */}
      {streakFreezes === 0 && gems >= 10 && (
        <button
          onClick={buyFreeze}
          className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 transition-colors"
        >
          🛡️ 10💎
        </button>
      )}
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGamification } from '@/store/use-gamification';

const MILESTONES = [
  { min: 10, label: '10x!', color: 'from-red-500 to-orange-500' },
  { min: 5, label: '5x!', color: 'from-orange-400 to-yellow-400' },
  { min: 3, label: '3x!', color: 'from-yellow-400 to-amber-400' },
  { min: 2, label: '2x!', color: 'from-green-400 to-emerald-400' },
];

function getMilestone(combo: number) {
  return MILESTONES.find((m) => combo >= m.min) ?? null;
}

export function ComboCounter() {
  const { combo } = useGamification();
  const milestone = getMilestone(combo);
  const [shake, setShake] = useState(false);

  // Screen shake on high combos
  useEffect(() => {
    if (combo >= 5) {
      setShake(true);
      const t = setTimeout(() => setShake(false), 300);
      return () => clearTimeout(t);
    }
  }, [combo]);

  if (combo < 2) return null;

  return (
    <motion.div
      className="fixed top-4 right-4 z-40 pointer-events-none"
      animate={
        shake
          ? { x: [0, -3, 3, -2, 2, 0], y: [0, -2, 2, -1, 1, 0] }
          : {}
      }
      transition={{ duration: 0.3 }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={combo}
          initial={{ scale: 0.5, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: -10 }}
          transition={{ type: 'spring', stiffness: 300, damping: 15 }}
          className="relative"
        >
          {/* Fire effects for high combos */}
          {combo >= 5 && (
            <motion.div
              className="absolute -inset-3 rounded-full bg-gradient-to-t from-orange-500/30 to-transparent blur-md"
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
              transition={{ repeat: Infinity, duration: 0.8 }}
            />
          )}

          <div
            className={`relative px-4 py-2 rounded-2xl bg-gradient-to-r ${
              milestone?.color ?? 'from-gray-400 to-gray-500'
            } text-white shadow-lg`}
          >
            <div className="flex items-center gap-2">
              {/* Fire icon escalation */}
              <motion.span
                className="text-lg"
                animate={{ rotate: [0, -10, 10, 0], scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 0.6 }}
              >
                {combo >= 10 ? '🌋' : combo >= 5 ? '🔥' : '⚡'}
              </motion.span>

              <div className="text-center">
                <motion.span
                  className="text-xl font-black block leading-none"
                  initial={{ scale: 1.5 }}
                  animate={{ scale: 1 }}
                >
                  {milestone?.label ?? `${combo}x`}
                </motion.span>
                <span className="text-[10px] opacity-80">Kombo</span>
              </div>
            </div>

            {/* XP multiplier */}
            {combo >= 3 && (
              <motion.div
                className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-white text-[10px] font-bold shadow-sm"
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  color: combo >= 10 ? '#EF4444' : combo >= 5 ? '#F97316' : '#22C55E',
                }}
              >
                +{combo >= 10 ? 5 : combo >= 5 ? 3 : 2} XP bonus
              </motion.div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}

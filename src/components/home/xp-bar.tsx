'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGamification, getLevelFromXP, getXPForNextLevel } from '@/store/use-gamification';

export function XPBar() {
  const { xp } = useGamification();
  const level = getLevelFromXP(xp);
  const { current, needed } = getXPForNextLevel(xp);
  const pct = Math.min((current / needed) * 100, 100);
  const prevXP = useRef(xp);
  const [showBurst, setShowBurst] = useState(false);

  useEffect(() => {
    if (xp > prevXP.current) {
      setShowBurst(true);
      const t = setTimeout(() => setShowBurst(false), 800);
      prevXP.current = xp;
      return () => clearTimeout(t);
    }
    prevXP.current = xp;
  }, [xp]);

  return (
    <div className="flex items-center gap-3">
      {/* Level badge */}
      <motion.div
        key={level}
        initial={{ scale: 1.4, rotate: -10 }}
        animate={{ scale: 1, rotate: 0 }}
        className="relative flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center text-white font-bold text-sm shadow-md"
      >
        {level}
      </motion.div>

      {/* Progress bar */}
      <div className="flex-1 relative">
        <div className="h-4 bg-muted rounded-full overflow-hidden relative">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-green-400 via-emerald-400 to-yellow-400"
            initial={false}
            animate={{ width: `${pct}%` }}
            transition={{ type: 'spring', stiffness: 120, damping: 20 }}
          />

          {/* Particle burst on XP gain */}
          <AnimatePresence>
            {showBurst && (
              <>
                {Array.from({ length: 6 }).map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-1.5 h-1.5 rounded-full bg-yellow-300"
                    style={{ left: `${pct}%`, top: '50%' }}
                    initial={{ opacity: 1, scale: 1, x: 0, y: 0 }}
                    animate={{
                      opacity: 0,
                      scale: 0,
                      x: (Math.random() - 0.5) * 40,
                      y: (Math.random() - 0.5) * 30,
                    }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                  />
                ))}
              </>
            )}
          </AnimatePresence>
        </div>

        {/* XP text */}
        <div className="flex justify-between mt-0.5">
          <span className="text-[10px] text-muted-foreground font-medium">
            {current} / {needed} XP
          </span>
          <span className="text-[10px] text-muted-foreground">
            Level {level + 1}
          </span>
        </div>
      </div>
    </div>
  );
}

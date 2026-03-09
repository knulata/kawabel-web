'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useStudent } from '@/store/use-student';
import { useGamification } from '@/store/use-gamification';
import { FEATURES } from '@/lib/constants';
import { playTap } from '@/lib/sounds';
import { hapticLight } from '@/lib/haptics';
import { XPBar } from '@/components/home/xp-bar';
import { StreakBadge } from '@/components/home/streak-badge';
import { DailyGoal } from '@/components/home/daily-goal';
import { ChestCard } from '@/components/home/chest-card';
import { HeartsDisplay } from '@/components/home/hearts-display';
import { FriendsSection } from '@/components/home/friends-section';
import { AchievementToast } from '@/components/home/achievement-toast';
import { Separator } from '@/components/ui/separator';
import { ACHIEVEMENT_MAP } from '@/lib/achievements';

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring' as const, stiffness: 200 } },
};

export function HomePage() {
  const { student } = useStudent();
  const { achievements } = useGamification();
  const [showAchievement, setShowAchievement] = useState<string | null>(null);

  const greeting = getGreeting();

  const handleFeatureTap = () => {
    playTap();
    hapticLight();
  };

  // Check for new achievements to display
  const handleAchievementDismiss = useCallback(() => {
    setShowAchievement(null);
  }, []);

  return (
    <div className="px-4 py-6 space-y-5">
      {/* Achievement toast overlay */}
      <AchievementToast
        achievementId={showAchievement}
        onDismiss={handleAchievementDismiss}
      />

      {/* Greeting */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="text-2xl font-bold text-foreground">
          {greeting}, {student?.name?.split(' ')[0]}! 👋
        </h2>
        <p className="text-muted-foreground text-sm mt-0.5">
          Mau belajar apa hari ini?
        </p>
      </motion.div>

      {/* XP bar */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.05 }}
      >
        <XPBar />
      </motion.div>

      {/* Stats row: streak, hearts, daily goal */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex items-center gap-4 flex-wrap"
      >
        <StreakBadge />
        <div className="sm:hidden">
          <HeartsDisplay />
        </div>
      </motion.div>

      {/* Daily goal ring */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-card rounded-2xl p-4 border border-border/50 shadow-sm"
      >
        <DailyGoal />
      </motion.div>

      {/* Chest card (only visible when chests available) */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <ChestCard />
      </motion.div>

      {/* Feature grid */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
          Mulai Belajar
        </h3>
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 sm:grid-cols-3 gap-3"
        >
          {FEATURES.map((feature) => (
            <motion.div key={feature.id} variants={item}>
              <Link href={feature.href} onClick={handleFeatureTap}>
                <div className="card-hover bg-card rounded-2xl p-4 border border-border/50 shadow-sm h-full">
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center text-2xl mb-3 shadow-sm`}
                  >
                    {feature.icon}
                  </div>
                  <h3 className="font-semibold text-sm text-foreground">
                    {feature.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {feature.subtitle}
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>

      <Separator />

      {/* Achievements showcase */}
      {achievements.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
            Pencapaian ({achievements.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {achievements.map((id) => {
              const ach = ACHIEVEMENT_MAP[id];
              if (!ach) return null;
              return (
                <motion.div
                  key={id}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-sm cursor-default"
                  title={ach.description}
                >
                  <span>{ach.icon}</span>
                  <span className="text-xs font-medium text-amber-800">{ach.name}</span>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      <Separator />

      {/* Friends section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35 }}
      >
        <FriendsSection />
      </motion.div>

      {/* Bottom padding for mobile nav */}
      <div className="h-4" />
    </div>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 11) return 'Selamat pagi';
  if (hour < 15) return 'Selamat siang';
  if (hour < 18) return 'Selamat sore';
  return 'Selamat malam';
}

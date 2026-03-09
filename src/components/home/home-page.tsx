'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useStudent } from '@/store/use-student';
import { useGamification, getLevelFromXP } from '@/store/use-gamification';
import { FEATURES } from '@/lib/constants';
import { ACHIEVEMENTS, ACHIEVEMENT_MAP } from '@/lib/achievements';
import { playTap } from '@/lib/sounds';
import { hapticLight } from '@/lib/haptics';
import { Mascot, MASCOT_NAME } from '@/components/mascot';
import { XPBar } from '@/components/home/xp-bar';
import { StreakBadge } from '@/components/home/streak-badge';
import { DailyGoal } from '@/components/home/daily-goal';
import { ChestCard } from '@/components/home/chest-card';
import { HeartsDisplay } from '@/components/home/hearts-display';
import { FriendsSection } from '@/components/home/friends-section';
import { AchievementToast } from '@/components/home/achievement-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { TrialBanner } from '@/components/pricing/trial-banner';
import { Gem, Zap } from 'lucide-react';

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 260, damping: 20 } },
};

export function HomePage() {
  const { student } = useStudent();
  const { xp, gems, streak, dailyXP, dailyGoalXP, hearts, achievements, chestsAvailable, combo, maxCombo } =
    useGamification();
  const level = getLevelFromXP(xp);
  const [showAchievement, setShowAchievement] = useState<string | null>(null);

  const greeting = getGreeting();
  const dailyDone = dailyXP >= dailyGoalXP;

  const handleFeatureTap = () => {
    playTap();
    hapticLight();
  };

  const handleAchievementDismiss = useCallback(() => {
    setShowAchievement(null);
  }, []);

  return (
    <div className="px-4 py-5 pb-24 sm:pb-8 space-y-5 max-w-xl mx-auto">
      {/* Achievement toast overlay */}
      <AchievementToast
        achievementId={showAchievement}
        onDismiss={handleAchievementDismiss}
      />

      {/* Hero section — greeting + mascot */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative overflow-hidden rounded-3xl kawabel-gradient p-5 pb-6 text-white"
      >
        {/* Decorative circles */}
        <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white/5" />
        <div className="absolute -left-4 -bottom-8 w-20 h-20 rounded-full bg-white/5" />

        <div className="relative flex items-start justify-between">
          <div className="flex-1">
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-white/70 text-xs font-medium uppercase tracking-wider mb-1"
            >
              {greeting}
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="text-xl font-bold"
            >
              {student?.name?.split(' ')[0] || 'Halo'}! 👋
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-white/60 text-sm mt-1"
            >
              {dailyDone
                ? 'Target harian tercapai! 🎉'
                : `${dailyGoalXP - dailyXP} XP lagi untuk target harian`}
            </motion.p>
          </div>

          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.15, type: 'spring', stiffness: 200 }}
            className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg"
          >
            <Mascot size="lg" animate />
          </motion.div>
        </div>

        {/* Quick stats row */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-4 mt-4 pt-4 border-t border-white/15"
        >
          <div className="flex items-center gap-1.5">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-yellow-300 to-amber-500 flex items-center justify-center text-[10px] font-black text-white shadow-sm">
              {level}
            </div>
            <div>
              <p className="text-[10px] text-white/50 leading-none">Level</p>
              <p className="text-sm font-bold leading-tight">{xp} XP</p>
            </div>
          </div>

          <div className="w-px h-7 bg-white/15" />

          {streak > 0 && (
            <>
              <div className="flex items-center gap-1">
                <span className="text-sm">🔥</span>
                <div>
                  <p className="text-[10px] text-white/50 leading-none">Streak</p>
                  <p className="text-sm font-bold leading-tight">{streak} hari</p>
                </div>
              </div>
              <div className="w-px h-7 bg-white/15" />
            </>
          )}

          <div className="flex items-center gap-1">
            <Gem size={14} className="text-blue-200" />
            <div>
              <p className="text-[10px] text-white/50 leading-none">Gems</p>
              <p className="text-sm font-bold leading-tight">{gems}</p>
            </div>
          </div>

          <div className="ml-auto">
            <HeartsDisplay />
          </div>
        </motion.div>
      </motion.div>

      {/* Trial banner */}
      <TrialBanner />

      {/* XP progress bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <XPBar />
      </motion.div>

      {/* Daily goal + streak row */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-2 gap-3"
      >
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <DailyGoal />
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4 flex flex-col justify-center gap-3">
            <StreakBadge />
            {maxCombo >= 2 && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Zap size={12} className="text-amber-500" />
                Kombo terbaik: <span className="font-bold text-foreground">{maxCombo}x</span>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Treasure chest */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <ChestCard />
      </motion.div>

      {/* Feature grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Mulai Belajar
          </h3>
          <span className="text-xs text-muted-foreground">+5-15 XP per sesi</span>
        </div>
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 sm:grid-cols-3 gap-3"
        >
          {FEATURES.map((feature) => (
            <motion.div key={feature.id} variants={item}>
              <Link href={feature.href} onClick={handleFeatureTap}>
                <Card className="card-hover shadow-sm border-border/50 h-full">
                  <CardContent className="p-4">
                    <div
                      className={`w-11 h-11 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center text-xl mb-2.5 shadow-sm`}
                    >
                      {feature.icon}
                    </div>
                    <h3 className="font-semibold text-[13px] text-foreground leading-tight">
                      {feature.title}
                    </h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                      {feature.subtitle}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>

      <Separator />

      {/* Achievements section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Pencapaian
          </h3>
          <span className="text-xs text-muted-foreground">
            {achievements.length}/{ACHIEVEMENTS.length}
          </span>
        </div>

        {achievements.length === 0 ? (
          <Card className="shadow-sm">
            <CardContent className="p-4 text-center">
              <span className="text-3xl block mb-2">🏅</span>
              <p className="text-sm text-muted-foreground">
                Belum ada pencapaian. Mulai belajar untuk membuka pencapaian pertamamu!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-wrap gap-2">
            {achievements.map((id) => {
              const ach = ACHIEVEMENT_MAP[id];
              if (!ach) return null;
              return (
                <motion.div
                  key={id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-sm cursor-default shadow-sm"
                  title={ach.description}
                >
                  <span>{ach.icon}</span>
                  <span className="text-xs font-medium text-amber-800">{ach.name}</span>
                </motion.div>
              );
            })}
            {/* Locked achievements preview */}
            {ACHIEVEMENTS.filter((a) => !achievements.includes(a.id))
              .slice(0, 3)
              .map((ach) => (
                <div
                  key={ach.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/50 border border-border text-sm cursor-default opacity-40"
                  title={`??? — ${ach.description}`}
                >
                  <span>🔒</span>
                  <span className="text-xs font-medium text-muted-foreground">???</span>
                </div>
              ))}
          </div>
        )}
      </motion.div>

      <Separator />

      {/* Friends section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35 }}
      >
        <FriendsSection />
      </motion.div>
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

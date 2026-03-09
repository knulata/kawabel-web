'use client';

import { useState, useCallback } from 'react';
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
import { TrialBanner } from '@/components/pricing/trial-banner';
import { Card, CardContent } from '@/components/ui/card';
import { Gem, Zap, ArrowRight, Sparkles } from 'lucide-react';

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
  const { xp, gems, streak, dailyXP, dailyGoalXP, hearts, achievements, maxCombo } =
    useGamification();
  const level = getLevelFromXP(xp);
  const [showAchievement, setShowAchievement] = useState<string | null>(null);

  const greeting = getGreeting();
  const firstName = student?.name?.split(' ')[0] || null;
  const dailyDone = dailyXP >= dailyGoalXP;

  const handleFeatureTap = () => {
    playTap();
    hapticLight();
  };

  const handleAchievementDismiss = useCallback(() => {
    setShowAchievement(null);
  }, []);

  return (
    <div className="pb-24 sm:pb-8 max-w-xl mx-auto">
      {/* Achievement toast overlay */}
      <AchievementToast
        achievementId={showAchievement}
        onDismiss={handleAchievementDismiss}
      />

      {/* ── Hero Section ─────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative overflow-hidden kawabel-gradient px-5 pt-6 pb-8"
      >
        {/* Decorative shapes */}
        <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/5" />
        <div className="absolute -left-6 bottom-4 w-24 h-24 rounded-full bg-white/5" />
        <div className="absolute right-16 bottom-0 w-16 h-16 rounded-full bg-white/3" />

        <div className="relative">
          {/* Greeting row */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-white/60 text-xs font-medium uppercase tracking-widest"
              >
                {greeting}
              </motion.p>
              <motion.h2
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="text-2xl font-bold text-white mt-0.5"
              >
                {firstName ? `${firstName}!` : 'Selamat datang!'} 👋
              </motion.h2>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-white/50 text-sm mt-1"
              >
                {dailyDone
                  ? 'Target harian tercapai — kamu hebat!'
                  : `${dailyGoalXP - dailyXP} XP lagi untuk target hari ini`}
              </motion.p>
            </div>

            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.15, type: 'spring', stiffness: 200 }}
              className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg ml-4"
            >
              <Mascot size="lg" animate />
            </motion.div>
          </div>

          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-3 pt-4 border-t border-white/10"
          >
            <StatPill
              label="Level"
              value={String(level)}
              sub={`${xp} XP`}
              icon={
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-yellow-300 to-amber-500 flex items-center justify-center text-[10px] font-black text-white">
                  {level}
                </div>
              }
            />

            {streak > 0 && (
              <StatPill label="Streak" value={`${streak}`} sub="hari" icon={<span className="text-sm">🔥</span>} />
            )}

            <StatPill
              label="Gems"
              value={String(gems)}
              icon={<Gem size={14} className="text-blue-200" />}
            />

            <div className="ml-auto">
              <HeartsDisplay />
            </div>
          </motion.div>
        </div>
      </motion.div>

      <div className="px-4 space-y-5 -mt-3">
        {/* ── XP Progress Card ──────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card className="shadow-md border-0">
            <CardContent className="p-4">
              <XPBar />
            </CardContent>
          </Card>
        </motion.div>

        {/* Trial banner */}
        <TrialBanner />

        {/* ── Daily Goal + Streak Row ──────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 gap-3"
        >
          <Card className="shadow-sm border-border/40">
            <CardContent className="p-4">
              <DailyGoal />
            </CardContent>
          </Card>
          <Card className="shadow-sm border-border/40">
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

        {/* ── Treasure Chest ───────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <ChestCard />
        </motion.div>

        {/* ── Feature Grid ─────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-foreground">
              Mulai Belajar
            </h3>
            <span className="text-[11px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              +5-15 XP per sesi
            </span>
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
                  <Card className="card-hover shadow-sm border-border/40 h-full group">
                    <CardContent className="p-4">
                      <div
                        className={`w-11 h-11 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center text-xl mb-3 shadow-sm group-hover:scale-105 transition-transform`}
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

        {/* ── Achievements ─────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
              <Sparkles size={14} className="text-amber-500" />
              Pencapaian
            </h3>
            <span className="text-[11px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              {achievements.length}/{ACHIEVEMENTS.length}
            </span>
          </div>

          {achievements.length === 0 ? (
            <Card className="shadow-sm border-border/40">
              <CardContent className="p-5 text-center">
                <span className="text-3xl block mb-2">🏅</span>
                <p className="text-sm font-medium text-foreground mb-1">
                  Belum ada pencapaian
                </p>
                <p className="text-xs text-muted-foreground">
                  Mulai belajar untuk membuka pencapaian pertamamu!
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
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200/70 text-sm cursor-default shadow-sm"
                    title={ach.description}
                  >
                    <span>{ach.icon}</span>
                    <span className="text-xs font-medium text-amber-800">{ach.name}</span>
                  </motion.div>
                );
              })}
              {/* Locked previews */}
              {ACHIEVEMENTS.filter((a) => !achievements.includes(a.id))
                .slice(0, 3)
                .map((ach) => (
                  <div
                    key={ach.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/50 border border-border/50 text-sm cursor-default opacity-40"
                    title={`??? — ${ach.description}`}
                  >
                    <span>🔒</span>
                    <span className="text-xs font-medium text-muted-foreground">???</span>
                  </div>
                ))}
            </div>
          )}
        </motion.div>

        {/* ── Friends ──────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
        >
          <FriendsSection />
        </motion.div>

        {/* ── Bottom CTA for upgrade ───────────────────────── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <Link href="/pricing">
            <Card className="shadow-sm border-primary/20 bg-gradient-to-r from-green-50 to-emerald-50 card-hover">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Sparkles size={20} className="text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">Belajar tanpa batas</p>
                  <p className="text-xs text-muted-foreground">Upgrade ke Premium — gratis 7 hari</p>
                </div>
                <ArrowRight size={16} className="text-primary" />
              </CardContent>
            </Card>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}

/* ── Small stat pill used in hero ──────────────────────── */
function StatPill({
  label,
  value,
  sub,
  icon,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-1.5">
      {icon}
      <div>
        <p className="text-[10px] text-white/40 leading-none">{label}</p>
        <p className="text-sm font-bold text-white leading-tight">
          {value}
          {sub && <span className="text-[10px] font-normal text-white/50 ml-0.5">{sub}</span>}
        </p>
      </div>
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

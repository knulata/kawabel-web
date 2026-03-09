'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useStudent } from '@/store/use-student';
import { useGamification, getLevelFromXP, getXPForNextLevel } from '@/store/use-gamification';
import { ACHIEVEMENTS, ACHIEVEMENT_MAP } from '@/lib/achievements';
import { playTap } from '@/lib/sounds';
import { hapticLight } from '@/lib/haptics';
import { Mascot, MASCOT_NAME } from '@/components/mascot';
import { ChestCard } from '@/components/home/chest-card';
import { AchievementToast } from '@/components/home/achievement-toast';
import { TrialBanner } from '@/components/pricing/trial-banner';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, Sparkles } from 'lucide-react';

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 260, damping: 20 } },
};

const MAIN_FEATURES = [
  {
    id: 'chat',
    title: 'Tanya PR',
    desc: 'Ketik pertanyaan, langsung dijawab',
    emoji: '💬',
    href: '/chat',
    gradient: 'from-green-400 to-emerald-600',
  },
  {
    id: 'photo',
    title: 'Foto Soal',
    desc: 'Untuk mendapatkan penjelasan',
    emoji: '📸',
    href: '/chat?photo=1',
    gradient: 'from-sky-400 to-blue-600',
  },
  {
    id: 'dictation',
    title: 'Dikte Mandarin',
    desc: 'Foto daftar kata, dengarkan & tulis',
    emoji: '🀄',
    href: '/dictation',
    gradient: 'from-rose-400 to-red-600',
  },
  {
    id: 'test',
    title: 'Latihan Ujian',
    desc: 'Foto buku atau pilih topik, langsung kuis',
    emoji: '📝',
    href: '/test-prep',
    gradient: 'from-violet-400 to-purple-600',
  },
];

export function HomePage() {
  const { student } = useStudent();
  const { xp, streak, dailyXP, dailyGoalXP, achievements, chestsAvailable } =
    useGamification();
  const level = getLevelFromXP(xp);
  const { current, needed } = getXPForNextLevel(xp);
  const xpPct = Math.min((current / needed) * 100, 100);
  const dailyPct = Math.min((dailyXP / dailyGoalXP) * 100, 100);
  const [showAchievement, setShowAchievement] = useState<string | null>(null);

  const firstName = student?.name?.split(' ')[0] || null;
  const isNewUser = xp === 0;

  const handleFeatureTap = () => {
    playTap();
    hapticLight();
  };

  const handleAchievementDismiss = useCallback(() => {
    setShowAchievement(null);
  }, []);

  return (
    <div className="pb-6 sm:pb-8 max-w-xl mx-auto">
      <AchievementToast
        achievementId={showAchievement}
        onDismiss={handleAchievementDismiss}
      />

      {isNewUser ? (
        /* ══════ NEW USER ══════ */
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="kawabel-gradient px-5 pt-8 pb-10 text-center relative overflow-hidden"
          >
            <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/5" />
            <div className="absolute -left-8 bottom-0 w-28 h-28 rounded-full bg-white/5" />

            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
              className="relative inline-flex items-center justify-center w-20 h-20 bg-white rounded-3xl shadow-xl mb-4"
            >
              <Mascot size="xl" animate />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="text-3xl font-bold text-white"
              style={{ fontFamily: 'var(--font-nunito)' }}
            >
              {firstName ? `Halo ${firstName}!` : 'Kawan Belajar AI-mu'}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-white/70 text-sm mt-2 max-w-xs mx-auto leading-relaxed"
            >
              Tanya PR, foto soal, latihan ujian, dan dikte Mandarin — semua dibantu AI, kapan saja.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-5"
            >
              <Link href="/chat" onClick={handleFeatureTap}>
                <button className="px-6 py-3 bg-white text-primary font-bold rounded-xl shadow-lg text-base hover:bg-white/90 transition-colors">
                  Mulai Tanya Sekarang
                </button>
              </Link>
            </motion.div>
          </motion.div>

          <div className="px-4 space-y-5 mt-2">
            <TrialBanner />

            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="space-y-3"
            >
              <h3 className="text-base font-bold text-foreground">
                Apa yang bisa {MASCOT_NAME} bantu?
              </h3>

              {MAIN_FEATURES.map((feature) => (
                <motion.div key={feature.id} variants={item}>
                  <Link href={feature.href} onClick={handleFeatureTap}>
                    <Card className="card-hover shadow-sm border-border/40 group">
                      <CardContent className="p-4 flex items-center gap-4">
                        <div
                          className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center shrink-0 shadow-md group-hover:scale-110 transition-transform`}
                        >
                          <span className="text-2xl">{feature.emoji}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-base text-foreground">
                            {feature.title}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {feature.desc}
                          </p>
                        </div>
                        <ArrowRight size={16} className="text-muted-foreground/50 shrink-0 group-hover:text-primary transition-colors" />
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </motion.div>

            {/* How it works */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="shadow-sm border-border/40 overflow-hidden">
                <CardContent className="p-0">
                  <div className="bg-muted/30 px-4 py-3 border-b border-border/30">
                    <h3 className="text-base font-bold text-foreground">Cara pakai</h3>
                  </div>
                  <div className="p-4 space-y-3">
                    {[
                      { num: '1', text: 'Pilih fitur di atas atau langsung ketik pertanyaan' },
                      { num: '2', text: 'Kawabel jelaskan jawaban langkah demi langkah' },
                      { num: '3', text: 'Kumpulkan XP dan naik level sambil belajar!' },
                    ].map((step) => (
                      <div key={step.num} className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                          {step.num}
                        </div>
                        <p className="text-base text-foreground leading-snug">{step.text}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Upgrade CTA */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <Link href="/pricing">
                <Card className="shadow-sm border-primary/20 bg-gradient-to-r from-green-50 to-emerald-50 card-hover">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Sparkles size={20} className="text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-base font-semibold text-foreground">Belajar tanpa batas</p>
                      <p className="text-sm text-muted-foreground">Upgrade ke Premium — gratis 7 hari</p>
                    </div>
                    <ArrowRight size={16} className="text-primary" />
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          </div>
        </>
      ) : (
        /* ══════ RETURNING USER — Clean Duolingo-style ══════ */
        <div className="px-4 space-y-5 pt-4">
          {/* Greeting */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2 className="text-2xl font-bold text-foreground">
              Halo, {firstName || 'Kawan'}! 👋
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Mau belajar apa hari ini?
            </p>
          </motion.div>

          {/* Stats strip — compact, Duolingo-style */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="flex items-center gap-2"
          >
            {/* Streak */}
            <div className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold ${
              streak > 0
                ? 'bg-orange-50 border border-orange-200 text-orange-600'
                : 'bg-muted border border-border text-muted-foreground'
            }`}>
              <span>{streak > 0 ? '🔥' : '❄️'}</span>
              <span>{streak} hari</span>
            </div>

            {/* Daily progress */}
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-green-50 border border-green-200 text-sm font-bold text-green-600">
              <span>⚡</span>
              <span>{dailyXP}/{dailyGoalXP}</span>
              {dailyXP >= dailyGoalXP && <span className="text-xs">✅</span>}
            </div>

            {/* Level + XP */}
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-50 border border-purple-200 text-sm font-bold text-purple-600 ml-auto">
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center text-white text-[9px] font-black">
                {level}
              </div>
              <span>{xp} XP</span>
            </div>
          </motion.div>

          {/* XP progress bar — slim, under stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="-mt-2"
          >
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-green-400 via-emerald-400 to-yellow-400"
                initial={false}
                animate={{ width: `${xpPct}%` }}
                transition={{ type: 'spring', stiffness: 120, damping: 20 }}
              />
            </div>
            <div className="flex justify-between mt-0.5">
              <span className="text-[10px] text-muted-foreground">{current}/{needed} XP</span>
              <span className="text-[10px] text-muted-foreground">Level {level + 1}</span>
            </div>
          </motion.div>

          <TrialBanner />

          {/* Chest */}
          {chestsAvailable > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <ChestCard />
            </motion.div>
          )}

          {/* Feature cards — main content */}
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-3"
          >
            <h3 className="text-base font-bold text-foreground">Lanjut Belajar</h3>

            {MAIN_FEATURES.map((feature) => (
              <motion.div key={feature.id} variants={item}>
                <Link href={feature.href} onClick={handleFeatureTap}>
                  <Card className="card-hover shadow-sm border-border/40 group">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div
                        className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center shrink-0 shadow-md group-hover:scale-110 transition-transform`}
                      >
                        <span className="text-2xl">{feature.emoji}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-base text-foreground">
                          {feature.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {feature.desc}
                        </p>
                      </div>
                      <ArrowRight size={16} className="text-muted-foreground/50 shrink-0 group-hover:text-primary transition-colors" />
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </motion.div>

          {/* Achievements — compact */}
          {achievements.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-bold text-foreground flex items-center gap-1.5">
                  <Sparkles size={14} className="text-amber-500" />
                  Pencapaian
                </h3>
                <span className="text-[11px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  {achievements.length}/{ACHIEVEMENTS.length}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {achievements.map((id) => {
                  const ach = ACHIEVEMENT_MAP[id];
                  if (!ach) return null;
                  return (
                    <div
                      key={id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200/70 text-sm shadow-sm"
                      title={ach.description}
                    >
                      <span>{ach.icon}</span>
                      <span className="text-xs font-medium text-amber-800">{ach.name}</span>
                    </div>
                  );
                })}
                {ACHIEVEMENTS.filter((a) => !achievements.includes(a.id))
                  .slice(0, 2)
                  .map((ach) => (
                    <div
                      key={ach.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/50 border border-border/50 text-sm opacity-40"
                    >
                      <span>🔒</span>
                      <span className="text-xs font-medium text-muted-foreground">???</span>
                    </div>
                  ))}
              </div>
            </motion.div>
          )}

          {/* Upgrade CTA */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
          >
            <Link href="/pricing">
              <Card className="shadow-sm border-primary/20 bg-gradient-to-r from-green-50 to-emerald-50 card-hover">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Sparkles size={20} className="text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-base font-semibold text-foreground">Belajar tanpa batas</p>
                    <p className="text-sm text-muted-foreground">Upgrade Premium — gratis 7 hari</p>
                  </div>
                  <ArrowRight size={16} className="text-primary" />
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        </div>
      )}

      {/* Footer links */}
      <div className="text-center pt-6 pb-2 text-[10px] text-muted-foreground/50">
        <Link href="/privacy" className="hover:underline">Privasi</Link>
        <span className="mx-1.5">·</span>
        <Link href="/terms" className="hover:underline">Ketentuan</Link>
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

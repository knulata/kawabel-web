'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useStudent } from '@/store/use-student';
import { useGamification, getLevelFromXP } from '@/store/use-gamification';
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
import { Zap, ArrowRight, Sparkles, MessageCircle, Camera, PenLine, BookOpen } from 'lucide-react';

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 260, damping: 20 } },
};

/* ── Main features with clearer descriptions ──────────── */
const MAIN_FEATURES = [
  {
    id: 'chat',
    title: 'Tanya PR',
    desc: 'Ketik pertanyaan, langsung dijawab AI',
    icon: <MessageCircle size={22} />,
    href: '/chat',
    gradient: 'from-green-400 to-emerald-600',
  },
  {
    id: 'photo',
    title: 'Foto Soal',
    desc: 'Foto soal dari buku, AI bantu jawab',
    icon: <Camera size={22} />,
    href: '/chat?photo=1',
    gradient: 'from-blue-400 to-blue-600',
  },
  {
    id: 'dictation',
    title: 'Dikte Mandarin',
    desc: 'Foto daftar kata, dengarkan & tulis',
    icon: <PenLine size={22} />,
    href: '/dictation',
    gradient: 'from-red-400 to-rose-600',
  },
  {
    id: 'test',
    title: 'Latihan Ujian',
    desc: 'Kuis pilihan ganda semua mapel',
    icon: <BookOpen size={22} />,
    href: '/test-prep',
    gradient: 'from-purple-400 to-purple-600',
  },
];

export function HomePage() {
  const { student } = useStudent();
  const { xp, gems, streak, dailyXP, dailyGoalXP, achievements, maxCombo } =
    useGamification();
  const level = getLevelFromXP(xp);
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
    <div className="pb-24 sm:pb-8 max-w-xl mx-auto">
      <AchievementToast
        achievementId={showAchievement}
        onDismiss={handleAchievementDismiss}
      />

      {/* ══════════════════════════════════════════════════════
          NEW USER: Clear value prop + features up front
          ══════════════════════════════════════════════════════ */}
      {isNewUser ? (
        <>
          {/* Hero — what is Kawabel? */}
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
              className="text-2xl font-bold text-white"
              style={{ fontFamily: 'var(--font-nunito)' }}
            >
              {firstName ? `Halo ${firstName}!` : 'Teman Belajar AI-mu'}
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
                <button className="px-6 py-3 bg-white text-primary font-bold rounded-xl shadow-lg text-sm hover:bg-white/90 transition-colors">
                  Mulai Tanya Sekarang
                </button>
              </Link>
            </motion.div>
          </motion.div>

          <div className="px-4 space-y-5 -mt-4">
            {/* Trial banner */}
            <TrialBanner />

            {/* Feature cards — big and clear */}
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="space-y-3"
            >
              <h3 className="text-sm font-bold text-foreground pt-1">
                Apa yang bisa {MASCOT_NAME} bantu?
              </h3>

              {MAIN_FEATURES.map((feature) => (
                <motion.div key={feature.id} variants={item}>
                  <Link href={feature.href} onClick={handleFeatureTap}>
                    <Card className="card-hover shadow-sm border-border/40 group">
                      <CardContent className="p-4 flex items-center gap-4">
                        <div
                          className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center text-white shrink-0 shadow-sm group-hover:scale-105 transition-transform`}
                        >
                          {feature.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm text-foreground">
                            {feature.title}
                          </h3>
                          <p className="text-xs text-muted-foreground mt-0.5">
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

            {/* How it works — quick 3-step */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="shadow-sm border-border/40 overflow-hidden">
                <CardContent className="p-0">
                  <div className="bg-muted/30 px-4 py-3 border-b border-border/30">
                    <h3 className="text-sm font-bold text-foreground">Cara pakai</h3>
                  </div>
                  <div className="p-4 space-y-3">
                    {[
                      { num: '1', text: 'Pilih fitur di atas atau langsung ketik pertanyaan' },
                      { num: '2', text: 'Kawai jelaskan jawaban langkah demi langkah' },
                      { num: '3', text: 'Kumpulkan XP dan naik level sambil belajar!' },
                    ].map((step) => (
                      <div key={step.num} className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                          {step.num}
                        </div>
                        <p className="text-sm text-foreground leading-snug">{step.text}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Bottom CTA */}
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
                      <p className="text-sm font-semibold text-foreground">Belajar tanpa batas</p>
                      <p className="text-xs text-muted-foreground">Upgrade ke Premium — gratis 7 hari</p>
                    </div>
                    <ArrowRight size={16} className="text-primary" />
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          </div>
        </>
      ) : (
        /* ══════════════════════════════════════════════════════
           RETURNING USER: Stats dashboard + features
           ══════════════════════════════════════════════════════ */
        <>
          {/* Compact hero */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="kawabel-gradient px-5 pt-5 pb-6 relative overflow-hidden"
          >
            <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/5" />

            <div className="relative flex items-center justify-between mb-3">
              <div>
                <p className="text-white/50 text-xs font-medium uppercase tracking-widest">
                  {getGreeting()}
                </p>
                <h2 className="text-xl font-bold text-white mt-0.5">
                  {firstName || 'Halo'}! 👋
                </h2>
              </div>
              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-lg">
                <Mascot size="lg" animate />
              </div>
            </div>

            {/* Compact stats */}
            <div className="flex items-center gap-3 pt-3 border-t border-white/10">
              <StatChip icon={
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-yellow-300 to-amber-500 flex items-center justify-center text-[9px] font-black text-white">
                  {level}
                </div>
              } value={`${xp} XP`} />

              {streak > 0 && (
                <StatChip icon={<span className="text-xs">🔥</span>} value={`${streak} hari`} />
              )}

              <div className="ml-auto">
                <HeartsDisplay />
              </div>
            </div>
          </motion.div>

          <div className="px-4 space-y-4 -mt-3">
            {/* XP bar card */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="shadow-md border-0">
                <CardContent className="p-4">
                  <XPBar />
                </CardContent>
              </Card>
            </motion.div>

            <TrialBanner />

            {/* Daily goal + streak */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
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

            {/* Chest */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <ChestCard />
            </motion.div>

            {/* Quick actions — horizontal scroll */}
            <div>
              <h3 className="text-sm font-bold text-foreground mb-3">Lanjut Belajar</h3>
              <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
                {MAIN_FEATURES.map((feature) => (
                  <Link
                    key={feature.id}
                    href={feature.href}
                    onClick={handleFeatureTap}
                    className="shrink-0"
                  >
                    <Card className="card-hover shadow-sm border-border/40 w-32">
                      <CardContent className="p-3 text-center">
                        <div
                          className={`w-10 h-10 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center text-white mx-auto mb-2 shadow-sm`}
                        >
                          {feature.icon}
                        </div>
                        <p className="text-xs font-semibold text-foreground leading-tight">
                          {feature.title}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>

            {/* Achievements */}
            {achievements.length > 0 && (
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

            {/* Friends */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35 }}
            >
              <FriendsSection />
            </motion.div>

            {/* Upgrade CTA */}
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
                      <p className="text-xs text-muted-foreground">Upgrade Premium — gratis 7 hari</p>
                    </div>
                    <ArrowRight size={16} className="text-primary" />
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          </div>
        </>
      )}
    </div>
  );
}

function StatChip({ icon, value }: { icon: React.ReactNode; value: string }) {
  return (
    <div className="flex items-center gap-1.5 bg-white/10 rounded-full px-2.5 py-1">
      {icon}
      <span className="text-xs font-semibold text-white">{value}</span>
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

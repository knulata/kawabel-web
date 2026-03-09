'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useStudent } from '@/store/use-student';
import { FEATURES } from '@/lib/constants';

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

  const greeting = getGreeting();

  return (
    <div className="px-4 py-6">
      {/* Greeting */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h2 className="text-2xl font-bold text-foreground">
          {greeting}, {student?.name?.split(' ')[0]}! 👋
        </h2>
        <p className="text-muted-foreground mt-1">
          Mau belajar apa hari ini?
        </p>
      </motion.div>

      {/* Stats bar */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="mb-6 p-4 rounded-2xl kawabel-gradient text-white"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🦉</span>
            <div>
              <p className="font-semibold text-sm opacity-90">Level {student?.level}</p>
              <p className="text-2xl font-bold">{student?.stars} ⭐</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs opacity-70">Kelas</p>
            <p className="font-semibold">{student?.grade || '-'}</p>
          </div>
        </div>
      </motion.div>

      {/* Feature grid */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 sm:grid-cols-3 gap-3"
      >
        {FEATURES.map((feature) => (
          <motion.div key={feature.id} variants={item}>
            <Link href={feature.href}>
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
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 11) return 'Selamat pagi';
  if (hour < 15) return 'Selamat siang';
  if (hour < 18) return 'Selamat sore';
  return 'Selamat malam';
}

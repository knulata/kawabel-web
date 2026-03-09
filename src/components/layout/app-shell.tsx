'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useStudent } from '@/store/use-student';
import { useGamification, getLevelFromXP } from '@/store/use-gamification';
import { playTap } from '@/lib/sounds';
import { hapticLight } from '@/lib/haptics';
import {
  MessageCircle,
  PenLine,
  BookOpen,
  BarChart3,
  Trophy,
  Home,
  LogOut,
  Gem,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { HeartsDisplay } from '@/components/home/hearts-display';

const NAV_ITEMS = [
  { href: '/', icon: Home, label: 'Beranda' },
  { href: '/chat', icon: MessageCircle, label: 'Tanya' },
  { href: '/dictation', icon: PenLine, label: 'Dikte' },
  { href: '/test-prep', icon: BookOpen, label: 'Ujian' },
  { href: '/leaderboard', icon: Trophy, label: 'Juara' },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { student, logout } = useStudent();
  const { xp, gems, streak, checkStreak, regenHearts } = useGamification();
  const level = getLevelFromXP(xp);

  // Check streak & regen hearts on mount
  useEffect(() => {
    checkStreak();
    regenHearts();
  }, [checkStreak, regenHearts]);

  const handleNavTap = () => {
    playTap();
    hapticLight();
  };

  return (
    <div className="min-h-dvh flex flex-col bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-40 glass border-b border-border/50">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2" onClick={handleNavTap}>
            <span className="text-2xl">🦉</span>
            <span
              className="text-xl font-black kawabel-gradient-text tracking-wide hidden sm:inline"
              style={{ fontFamily: 'var(--font-nunito)' }}
            >
              kawabel
            </span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            {student && (
              <>
                {/* Streak */}
                {streak > 0 && (
                  <motion.div
                    className="flex items-center gap-0.5 text-sm"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                  >
                    <span>🔥</span>
                    <span className="font-bold text-orange-500">{streak}</span>
                  </motion.div>
                )}

                {/* Gems */}
                <div className="flex items-center gap-0.5 text-sm">
                  <Gem size={14} className="text-blue-500" />
                  <span className="font-semibold text-blue-600">{gems}</span>
                </div>

                {/* Hearts */}
                <div className="hidden sm:block">
                  <HeartsDisplay />
                </div>

                {/* Level badge */}
                <div className="hidden sm:flex items-center gap-1.5 text-sm">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center text-white text-[10px] font-bold">
                    {level}
                  </div>
                  <span className="font-semibold">{xp} XP</span>
                </div>

                <Avatar className="h-8 w-8">
                  <AvatarImage src={student.avatar_url} alt={student.name} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {student.name?.charAt(0)?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <button
                  onClick={logout}
                  className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
                  title="Keluar"
                >
                  <LogOut size={18} />
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-5xl mx-auto w-full">{children}</main>

      {/* Bottom navigation (mobile) */}
      <nav className="sticky bottom-0 z-40 glass border-t border-border/50 sm:hidden">
        <div className="flex justify-around py-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center gap-0.5 py-1.5 px-2 relative"
                onClick={handleNavTap}
              >
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute -top-0.5 w-6 h-0.5 rounded-full bg-primary"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
                <item.icon
                  size={20}
                  className={isActive ? 'text-primary' : 'text-muted-foreground'}
                />
                <span
                  className={`text-[10px] ${
                    isActive
                      ? 'text-primary font-semibold'
                      : 'text-muted-foreground'
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useStudent } from '@/store/use-student';
import { useGamification, getLevelFromXP } from '@/store/use-gamification';
import { playTap } from '@/lib/sounds';
import { hapticLight } from '@/lib/haptics';
import {
  MessageCircle,
  PenLine,
  BookOpen,
  Trophy,
  Home,
  LogOut,
  Gem,
  LogIn,
  X,
  Save,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { HeartsDisplay } from '@/components/home/hearts-display';
import { Mascot } from '@/components/mascot';
import { SignInButton } from '@/components/auth/sign-in-button';

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
  const [showSignInHint, setShowSignInHint] = useState(false);

  // Check streak & regen hearts on mount
  useEffect(() => {
    checkStreak();
    regenHearts();
  }, [checkStreak, regenHearts]);

  // Show sign-in hint after 30 seconds for guests
  useEffect(() => {
    if (student) return;
    const timer = setTimeout(() => setShowSignInHint(true), 30_000);
    return () => clearTimeout(timer);
  }, [student]);

  const handleNavTap = () => {
    playTap();
    hapticLight();
  };

  return (
    <div className="min-h-dvh flex flex-col bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-40 glass border-b border-border/50">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5" onClick={handleNavTap}>
            <Mascot size="lg" />
            <span
              className="text-2xl font-black kawabel-gradient-text tracking-wide"
              style={{ fontFamily: 'var(--font-nunito)' }}
            >
              kawabel
            </span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
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
            {xp > 0 && (
              <div className="hidden sm:flex items-center gap-1.5 text-sm">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center text-white text-[10px] font-bold">
                  {level}
                </div>
                <span className="font-semibold">{xp} XP</span>
              </div>
            )}

            {student ? (
              <>
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
            ) : (
              <SignInButton />
            )}
          </div>
        </div>
      </header>

      {/* Sign-in hint banner for guests */}
      <AnimatePresence>
        {!student && showSignInHint && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-blue-50 border-b border-blue-100 px-4 py-2.5"
          >
            <div className="max-w-3xl mx-auto flex items-center gap-3">
              <Save size={16} className="text-blue-500 shrink-0" />
              <p className="text-xs text-blue-700 flex-1">
                <span className="font-semibold">Masuk dengan Google</span> untuk menyimpan progress, XP, dan pencapaianmu di semua perangkat.
              </p>
              <button
                onClick={() => setShowSignInHint(false)}
                className="p-1 rounded hover:bg-blue-100 text-blue-400"
              >
                <X size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <main className="flex-1 max-w-5xl mx-auto w-full pb-20 sm:pb-0">{children}</main>

      {/* Bottom navigation (mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 glass border-t border-border/50 sm:hidden">
        <div className="flex justify-around py-1 pb-[max(0.25rem,env(safe-area-inset-bottom))]">
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

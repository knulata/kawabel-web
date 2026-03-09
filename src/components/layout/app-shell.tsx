'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useStudent } from '@/store/use-student';
import {
  MessageCircle,
  PenLine,
  BookOpen,
  BarChart3,
  Trophy,
  Home,
  LogOut,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const NAV_ITEMS = [
  { href: '/', icon: Home, label: 'Beranda' },
  { href: '/chat', icon: MessageCircle, label: 'Tanya' },
  { href: '/dictation', icon: PenLine, label: 'Dikte' },
  { href: '/test-prep', icon: BookOpen, label: 'Ujian' },
  { href: '/progress', icon: BarChart3, label: 'Progres' },
  { href: '/leaderboard', icon: Trophy, label: 'Juara' },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { student, logout } = useStudent();

  return (
    <div className="min-h-dvh flex flex-col bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-40 glass border-b border-border/50">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">🦉</span>
            <span
              className="text-xl font-black kawabel-gradient-text tracking-wide"
              style={{ fontFamily: 'var(--font-nunito)' }}
            >
              kawabel
            </span>
          </Link>

          <div className="flex items-center gap-3">
            {student && (
              <>
                <div className="hidden sm:flex items-center gap-1.5 text-sm">
                  <span className="text-amber-500">⭐</span>
                  <span className="font-semibold">{student.stars}</span>
                  <span className="text-muted-foreground">
                    &middot; Lvl {student.level}
                  </span>
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
          {NAV_ITEMS.slice(0, 5).map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center gap-0.5 py-1.5 px-2 relative"
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

'use client';

import { AppShell } from '@/components/layout/app-shell';

export function AuthGate({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}

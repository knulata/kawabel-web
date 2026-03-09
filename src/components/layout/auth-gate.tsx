'use client';

import { useStudent } from '@/store/use-student';
import { LoginScreen } from '@/components/auth/login-screen';
import { AppShell } from '@/components/layout/app-shell';

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { student } = useStudent();

  if (!student) {
    return <LoginScreen />;
  }

  return <AppShell>{children}</AppShell>;
}

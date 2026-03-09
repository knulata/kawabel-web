'use client';

import { AuthGate } from '@/components/layout/auth-gate';
import { ProgressPage } from '@/components/progress/progress-page';

export default function Page() {
  return (
    <AuthGate>
      <ProgressPage />
    </AuthGate>
  );
}

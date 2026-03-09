'use client';

import { AuthGate } from '@/components/layout/auth-gate';
import { DictationPage } from '@/components/dictation/dictation-page';

export default function Page() {
  return (
    <AuthGate>
      <DictationPage />
    </AuthGate>
  );
}

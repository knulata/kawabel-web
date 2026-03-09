'use client';

import { AuthGate } from '@/components/layout/auth-gate';
import { TestPrepPage } from '@/components/test-prep/test-prep-page';

export default function Page() {
  return (
    <AuthGate>
      <TestPrepPage />
    </AuthGate>
  );
}

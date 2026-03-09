'use client';

import { AuthGate } from '@/components/layout/auth-gate';
import { PricingPage } from '@/components/pricing/pricing-page';

export default function Page() {
  return (
    <AuthGate>
      <PricingPage />
    </AuthGate>
  );
}

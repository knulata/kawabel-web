'use client';

import { AuthGate } from '@/components/layout/auth-gate';
import { LeaderboardPage } from '@/components/leaderboard/leaderboard-page';

export default function Page() {
  return (
    <AuthGate>
      <LeaderboardPage />
    </AuthGate>
  );
}

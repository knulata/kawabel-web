'use client';

import { AuthGate } from '@/components/layout/auth-gate';
import { ChatPage } from '@/components/chat/chat-page';

export default function Page() {
  return (
    <AuthGate>
      <ChatPage />
    </AuthGate>
  );
}

// API client for Kawabel backend

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function fetcher<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

// Auth
export async function loginWithGoogle(idToken: string) {
  return fetcher<{ student: import('@/types').Student }>('/api/auth/google', {
    method: 'POST',
    body: JSON.stringify({ id_token: idToken }),
  });
}

// Chat
export async function sendChat(messages: import('@/types').ChatMessage[], studentId: number) {
  return fetcher<{ reply: string }>('/api/chat', {
    method: 'POST',
    body: JSON.stringify({ messages, student_id: studentId }),
  });
}

// Usage
export async function getUsage(studentId: number) {
  return fetcher<import('@/types').UsageInfo>(`/api/usage/${studentId}`);
}

// Progress
export async function getProgress(studentId: number) {
  return fetcher<{ progress: import('@/types').ProgressEntry[] }>(`/api/students/${studentId}/progress`);
}

export async function saveProgress(data: {
  student_id: number;
  subject: string;
  topic: string;
  score: number;
  total: number;
  type: string;
}) {
  return fetcher<{ id: number }>('/api/progress', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// Leaderboard
export async function getLeaderboard(period: 'week' | 'month' | 'all' = 'all') {
  return fetcher<{ leaderboard: import('@/types').LeaderboardEntry[] }>(`/api/leaderboard?period=${period}`);
}

// Questions
export async function getQuestions() {
  return fetcher<Record<string, import('@/types').TestQuestion[]>>('/api/questions');
}

// Monthly report
export async function getMonthlyReport(studentId: number) {
  return fetcher<import('@/types').MonthlyReport>(`/api/reports/${studentId}/monthly`);
}

// Health check
export async function healthCheck() {
  return fetcher<{ status: string }>('/api/health');
}

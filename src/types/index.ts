// Kawabel type definitions

export interface Student {
  id: number;
  name: string;
  grade: string;
  stars: number;
  level: number;
  email?: string;
  avatar_url?: string;
  pin?: string;
  parent_code?: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  image?: string; // base64 data URI
  timestamp?: number;
}

export interface ProgressEntry {
  id: number;
  student_id: number;
  subject: string;
  topic: string;
  score: number;
  total: number;
  type: 'homework' | 'test' | 'dictation';
  created_at: string;
}

export interface LeaderboardEntry {
  id: number;
  name: string;
  stars: number;
  level: number;
  avatar_url?: string;
  rank?: number;
}

export interface TestQuestion {
  question: string;
  options: string[];
  correct: number;
  explanation?: string;
}

export interface UsageInfo {
  text_count: number;
  image_count: number;
  text_limit: number;
  image_limit: number;
}

export interface MonthlyReport {
  month: string;
  total_sessions: number;
  total_messages: number;
  subjects: Record<string, { sessions: number; messages: number }>;
  progress: ProgressEntry[];
}

// Kawabel design tokens & constants

export const COLORS = {
  green: '#4CAF50',
  greenDark: '#388E3C',
  greenLight: '#81C784',
  orange: '#FF9800',
  blue: '#2196F3',
  red: '#E53935',
  purple: '#9C27B0',
  surface: '#F5F9F5',
  surfaceWarm: '#FAFAF5',
} as const;

export const FEATURES = [
  {
    id: 'chat',
    title: 'Tanya Kawabel',
    subtitle: 'Bantuan PR & pelajaran',
    icon: '💬',
    href: '/chat',
    gradient: 'from-green-400 to-emerald-600',
  },
  {
    id: 'photo',
    title: 'Foto PR',
    subtitle: 'Foto soal, Kawabel bantu',
    icon: '📷',
    href: '/chat?photo=1',
    gradient: 'from-blue-400 to-blue-600',
  },
  {
    id: 'dictation',
    title: '听写 Dikte',
    subtitle: 'Latihan tulis Mandarin',
    icon: '✍️',
    href: '/dictation',
    gradient: 'from-red-400 to-rose-600',
  },
  {
    id: 'test',
    title: 'Latihan Ujian',
    subtitle: 'Soal-soal latihan',
    icon: '📝',
    href: '/test-prep',
    gradient: 'from-purple-400 to-purple-600',
  },
  {
    id: 'progress',
    title: 'Progress Belajar',
    subtitle: 'Lihat perkembangan',
    icon: '📊',
    href: '/progress',
    gradient: 'from-amber-400 to-orange-500',
  },
  {
    id: 'leaderboard',
    title: 'Papan Juara',
    subtitle: 'Siapa paling rajin?',
    icon: '🏆',
    href: '/leaderboard',
    gradient: 'from-yellow-400 to-amber-500',
  },
] as const;

export const SUBJECTS = [
  'Matematika',
  'IPA',
  'Bahasa Indonesia',
  'Bahasa Inggris',
  'Bahasa Mandarin',
  'IPS',
  'PKN',
] as const;

export const GRADES = [
  'SD Kelas 1', 'SD Kelas 2', 'SD Kelas 3',
  'SD Kelas 4', 'SD Kelas 5', 'SD Kelas 6',
  'SMP Kelas 7', 'SMP Kelas 8', 'SMP Kelas 9',
  'SMA Kelas 10', 'SMA Kelas 11', 'SMA Kelas 12',
] as const;

export const FREE_LIMITS = {
  chats: 5,
  photos: 2,
  quizzes: 2,
  dictations: 3,
} as const;

export const PREMIUM_LIMITS = {
  chats: 100,
  photos: 30,
  quizzes: 20,
  dictations: 30,
} as const;

export const SUBSCRIPTION_PRICE = 199_000;
export const FIRST_MONTH_PRICE = 99_000;
export const TRIAL_DAYS = 7;
export const BCA_ACCOUNT = '3722808999';
export const BCA_NAME = 'Indonesia Technologies V';
export const WHATSAPP_ADMIN = '628131102445';

// Free 1-month voucher codes for parents
export const VOUCHER_CODES: Record<string, { months: number; label: string }> = {
  'KAWABEL-GRATIS-01': { months: 1, label: '1 bulan gratis' },
  'KAWABEL-GRATIS-02': { months: 1, label: '1 bulan gratis' },
  'KAWABEL-GRATIS-03': { months: 1, label: '1 bulan gratis' },
  'KAWABEL-GRATIS-04': { months: 1, label: '1 bulan gratis' },
  'KAWABEL-GRATIS-05': { months: 1, label: '1 bulan gratis' },
  'KAWABEL-GRATIS-06': { months: 1, label: '1 bulan gratis' },
  'KAWABEL-GRATIS-07': { months: 1, label: '1 bulan gratis' },
  'KAWABEL-GRATIS-08': { months: 1, label: '1 bulan gratis' },
  'KAWABEL-GRATIS-09': { months: 1, label: '1 bulan gratis' },
  'KAWABEL-GRATIS-10': { months: 1, label: '1 bulan gratis' },
  'KAWABEL-COBA-01': { months: 1, label: '1 bulan gratis' },
  'KAWABEL-COBA-02': { months: 1, label: '1 bulan gratis' },
  'KAWABEL-COBA-03': { months: 1, label: '1 bulan gratis' },
  'KAWABEL-COBA-04': { months: 1, label: '1 bulan gratis' },
  'KAWABEL-COBA-05': { months: 1, label: '1 bulan gratis' },
  'KAWABEL-PARENT-01': { months: 1, label: '1 bulan gratis' },
  'KAWABEL-PARENT-02': { months: 1, label: '1 bulan gratis' },
  'KAWABEL-PARENT-03': { months: 1, label: '1 bulan gratis' },
  'KAWABEL-PARENT-04': { months: 1, label: '1 bulan gratis' },
  'KAWABEL-PARENT-05': { months: 1, label: '1 bulan gratis' },
};

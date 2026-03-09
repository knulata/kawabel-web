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
    title: 'Tanya Kawi',
    subtitle: 'Bantuan PR & pelajaran',
    icon: '💬',
    href: '/chat',
    gradient: 'from-green-400 to-emerald-600',
  },
  {
    id: 'photo',
    title: 'Foto PR',
    subtitle: 'Foto soal, Kawi bantu',
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
    title: 'Progres Belajar',
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

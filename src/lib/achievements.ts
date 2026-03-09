// Kawabel Achievement definitions

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  xpReward: number;
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'FIRST_LESSON',
    name: 'Langkah Pertama',
    description: 'Selesaikan pelajaran pertama',
    icon: '🎓',
    xpReward: 20,
  },
  {
    id: 'STREAK_3',
    name: 'Api Menyala',
    description: 'Raih streak 3 hari berturut-turut',
    icon: '🔥',
    xpReward: 30,
  },
  {
    id: 'STREAK_7',
    name: 'Semangat Membara',
    description: 'Raih streak 7 hari berturut-turut',
    icon: '🔥',
    xpReward: 50,
  },
  {
    id: 'STREAK_30',
    name: 'Pejuang Belajar',
    description: 'Raih streak 30 hari berturut-turut',
    icon: '🏅',
    xpReward: 200,
  },
  {
    id: 'XP_100',
    name: 'Seratus Pertama',
    description: 'Kumpulkan 100 XP',
    icon: '💯',
    xpReward: 10,
  },
  {
    id: 'XP_1000',
    name: 'Seribu Bintang',
    description: 'Kumpulkan 1000 XP',
    icon: '⭐',
    xpReward: 50,
  },
  {
    id: 'COMBO_5',
    name: 'Kombo Keren',
    description: 'Raih kombo 5 jawaban benar berturut',
    icon: '⚡',
    xpReward: 15,
  },
  {
    id: 'COMBO_10',
    name: 'Tak Terbendung',
    description: 'Raih kombo 10 jawaban benar berturut',
    icon: '💥',
    xpReward: 30,
  },
  {
    id: 'PERFECT_QUIZ',
    name: 'Sempurna!',
    description: 'Dapatkan nilai 100% di kuis',
    icon: '🏆',
    xpReward: 40,
  },
  {
    id: 'CHEST_OPENER',
    name: 'Pemburu Harta',
    description: 'Buka 10 peti harta karun',
    icon: '🧰',
    xpReward: 25,
  },
  {
    id: 'SOCIAL_BUTTERFLY',
    name: 'Kupu-kupu Sosial',
    description: 'Tambahkan 5 teman',
    icon: '🦋',
    xpReward: 20,
  },
  {
    id: 'EARLY_BIRD',
    name: 'Si Rajin Pagi',
    description: 'Belajar sebelum jam 7 pagi',
    icon: '🌅',
    xpReward: 15,
  },
  {
    id: 'NIGHT_OWL',
    name: 'Burung Hantu',
    description: 'Belajar setelah jam 10 malam',
    icon: '🦉',
    xpReward: 15,
  },
  {
    id: 'MANDARIN_MASTER',
    name: 'Master Mandarin',
    description: '50 kata dikte Mandarin benar',
    icon: '🐉',
    xpReward: 50,
  },
];

export const ACHIEVEMENT_MAP = Object.fromEntries(
  ACHIEVEMENTS.map((a) => [a.id, a]),
) as Record<string, Achievement>;

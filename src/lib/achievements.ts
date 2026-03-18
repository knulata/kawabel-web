// Kawabel Achievement definitions

export interface Achievement {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
  icon: string;
  xpReward: number;
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'FIRST_LESSON',
    name: 'Langkah Pertama',
    nameEn: 'First Step',
    description: 'Selesaikan pelajaran pertama',
    descriptionEn: 'Complete your first lesson',
    icon: '🎓',
    xpReward: 20,
  },
  {
    id: 'STREAK_3',
    name: 'Api Menyala',
    nameEn: 'On Fire',
    description: 'Raih streak 3 hari berturut-turut',
    descriptionEn: 'Reach a 3-day streak',
    icon: '🔥',
    xpReward: 30,
  },
  {
    id: 'STREAK_7',
    name: 'Semangat Membara',
    nameEn: 'Blazing Spirit',
    description: 'Raih streak 7 hari berturut-turut',
    descriptionEn: 'Reach a 7-day streak',
    icon: '🔥',
    xpReward: 50,
  },
  {
    id: 'STREAK_30',
    name: 'Pejuang Belajar',
    nameEn: 'Study Warrior',
    description: 'Raih streak 30 hari berturut-turut',
    descriptionEn: 'Reach a 30-day streak',
    icon: '🏅',
    xpReward: 200,
  },
  {
    id: 'XP_100',
    name: 'Seratus Pertama',
    nameEn: 'First Hundred',
    description: 'Kumpulkan 100 XP',
    descriptionEn: 'Collect 100 XP',
    icon: '💯',
    xpReward: 10,
  },
  {
    id: 'XP_1000',
    name: 'Seribu Bintang',
    nameEn: 'Thousand Stars',
    description: 'Kumpulkan 1000 XP',
    descriptionEn: 'Collect 1000 XP',
    icon: '⭐',
    xpReward: 50,
  },
  {
    id: 'COMBO_5',
    name: 'Kombo Keren',
    nameEn: 'Cool Combo',
    description: 'Raih kombo 5 jawaban benar berturut',
    descriptionEn: 'Get a 5-answer correct streak',
    icon: '⚡',
    xpReward: 15,
  },
  {
    id: 'COMBO_10',
    name: 'Tak Terbendung',
    nameEn: 'Unstoppable',
    description: 'Raih kombo 10 jawaban benar berturut',
    descriptionEn: 'Get a 10-answer correct streak',
    icon: '💥',
    xpReward: 30,
  },
  {
    id: 'PERFECT_QUIZ',
    name: 'Sempurna!',
    nameEn: 'Perfect!',
    description: 'Dapatkan nilai 100% di kuis',
    descriptionEn: 'Score 100% on a quiz',
    icon: '🏆',
    xpReward: 40,
  },
  {
    id: 'CHEST_OPENER',
    name: 'Pemburu Harta',
    nameEn: 'Treasure Hunter',
    description: 'Buka 10 peti harta karun',
    descriptionEn: 'Open 10 treasure chests',
    icon: '🧰',
    xpReward: 25,
  },
  {
    id: 'SOCIAL_BUTTERFLY',
    name: 'Kupu-kupu Sosial',
    nameEn: 'Social Butterfly',
    description: 'Tambahkan 5 teman',
    descriptionEn: 'Add 5 friends',
    icon: '🦋',
    xpReward: 20,
  },
  {
    id: 'EARLY_BIRD',
    name: 'Si Rajin Pagi',
    nameEn: 'Early Bird',
    description: 'Belajar sebelum jam 7 pagi',
    descriptionEn: 'Study before 7 AM',
    icon: '🌅',
    xpReward: 15,
  },
  {
    id: 'NIGHT_OWL',
    name: 'Burung Hantu',
    nameEn: 'Night Owl',
    description: 'Belajar setelah jam 10 malam',
    descriptionEn: 'Study after 10 PM',
    icon: '🌙',
    xpReward: 15,
  },
  {
    id: 'MANDARIN_MASTER',
    name: 'Master Dikte',
    nameEn: 'Dictation Master',
    description: '50 kata dikte benar',
    descriptionEn: '50 correct dictation words',
    icon: '🐉',
    xpReward: 50,
  },
];

export const ACHIEVEMENT_MAP = Object.fromEntries(
  ACHIEVEMENTS.map((a) => [a.id, a]),
) as Record<string, Achievement>;

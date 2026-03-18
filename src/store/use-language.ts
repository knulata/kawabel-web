'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Lang = 'id' | 'en';

interface LanguageState {
  lang: Lang;
  setLang: (lang: Lang) => void;
}

export const useLanguage = create<LanguageState>()(
  persist(
    (set) => ({
      lang: 'id',
      setLang: (lang) => set({ lang }),
    }),
    { name: 'kawabel-lang' }
  )
);

// Translation strings
const translations = {
  id: {
    // Home
    greeting: 'Halo',
    whatToStudy: 'Mau belajar apa hari ini?',
    continueStudying: 'Lanjut Belajar',
    learnUnlimited: 'Belajar tanpa batas',
    upgradePremium: 'Upgrade Premium — gratis 7 hari',
    shareToParent: 'Bagikan ke Orang Tua',
    parentCanSee: 'Orang tua bisa lihat progress belajarmu di',
    sendCodeToParent: 'Kirim kode ini ke orang tua agar bisa melihat progressmu',
    signInForOnline: 'Masuk dengan Google agar orang tua bisa pantau online dari HP mereka',
    copy: 'Salin',
    copied: 'Tersalin!',
    achievements: 'Pencapaian',
    days: 'hari',

    // Features
    askHomework: 'Tanya PR',
    askHomeworkDesc: 'Ketik pertanyaan, langsung dijawab',
    photoQuestion: 'Foto Soal',
    photoQuestionDesc: 'Untuk mendapatkan penjelasan',
    dictation: 'Dikte',
    dictationDesc: 'Foto daftar kata, dengarkan & tulis',
    examPractice: 'Latihan Ujian',
    examPracticeDesc: 'Foto buku atau pilih topik, langsung buat kuis',

    // Nav
    home: 'Beranda',
    ask: 'Tanya',
    dict: 'Dikte',
    exam: 'Ujian',
    champion: 'Juara',

    // New user
    yourAIFriend: 'Kawan Belajar AI-mu',
    heroSubtitle: 'Tanya PR, foto soal, latihan ujian, dan dikte — semua dibantu AI, kapan saja.',
    startAskNow: 'Mulai Tanya Sekarang',
    whatCanHelp: 'Apa yang bisa Kawabel bantu?',
    howToUse: 'Cara pakai',
    step1: 'Pilih fitur di atas atau langsung ketik pertanyaan',
    step2: 'Kawabel jelaskan jawaban langkah demi langkah',
    step3: 'Kumpulkan XP dan naik level sambil belajar!',

    // Onboarding
    whatsYourName: 'Halo! Siapa namamu?',
    imKawabel: 'Aku Kawabel, kawan belajarmu!',
    typeName: 'Ketik namamu...',
    next: 'Lanjut',
    whatGrade: 'Kelas berapa,',
    soKawabelCanHelp: 'Biar Kawabel bisa bantu sesuai pelajaranmu',
    back: 'Kembali',
    startLearning: 'Mulai Belajar!',

    // Footer
    parent: 'Orang Tua',
    privacy: 'Privasi',
    terms: 'Ketentuan',
  },
  en: {
    // Home
    greeting: 'Hello',
    whatToStudy: 'What do you want to study today?',
    continueStudying: 'Continue Studying',
    learnUnlimited: 'Learn without limits',
    upgradePremium: 'Upgrade to Premium — free 7-day trial',
    shareToParent: 'Share with Parents',
    parentCanSee: 'Parents can see your progress at',
    sendCodeToParent: 'Send this code to your parents so they can view your progress',
    signInForOnline: 'Sign in with Google so parents can track online from their phone',
    copy: 'Copy',
    copied: 'Copied!',
    achievements: 'Achievements',
    days: 'days',

    // Features
    askHomework: 'Ask Homework',
    askHomeworkDesc: 'Type a question, get answers instantly',
    photoQuestion: 'Photo Question',
    photoQuestionDesc: 'Take a photo for explanations',
    dictation: 'Dictation',
    dictationDesc: 'Photo word list, listen & write',
    examPractice: 'Exam Practice',
    examPracticeDesc: 'Photo textbook or pick a topic, instant quiz',

    // Nav
    home: 'Home',
    ask: 'Ask',
    dict: 'Dictation',
    exam: 'Exam',
    champion: 'Rank',

    // New user
    yourAIFriend: 'Your AI Study Buddy',
    heroSubtitle: 'Ask homework, photo questions, exam practice, and dictation — all powered by AI, anytime.',
    startAskNow: 'Start Asking Now',
    whatCanHelp: 'What can Kawabel help with?',
    howToUse: 'How it works',
    step1: 'Pick a feature above or just type your question',
    step2: 'Kawabel explains the answer step by step',
    step3: 'Collect XP and level up while studying!',

    // Onboarding
    whatsYourName: 'Hi! What\'s your name?',
    imKawabel: 'I\'m Kawabel, your study buddy!',
    typeName: 'Type your name...',
    next: 'Next',
    whatGrade: 'What grade,',
    soKawabelCanHelp: 'So Kawabel can help with your subjects',
    back: 'Back',
    startLearning: 'Start Learning!',

    // Footer
    parent: 'Parents',
    privacy: 'Privacy',
    terms: 'Terms',
  },
} as const;

export type TranslationKey = keyof typeof translations.id;

export function useT() {
  const { lang } = useLanguage();
  return (key: TranslationKey) => translations[lang][key] || translations.id[key];
}

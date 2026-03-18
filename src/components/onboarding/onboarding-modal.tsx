'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useStudent } from '@/store/use-student';
import { useT } from '@/store/use-language';
import { Mascot } from '@/components/mascot';

const GRADES = [
  { value: 'SD-1', label: 'SD Kelas 1', labelEn: 'Grade 1' },
  { value: 'SD-2', label: 'SD Kelas 2', labelEn: 'Grade 2' },
  { value: 'SD-3', label: 'SD Kelas 3', labelEn: 'Grade 3' },
  { value: 'SD-4', label: 'SD Kelas 4', labelEn: 'Grade 4' },
  { value: 'SD-5', label: 'SD Kelas 5', labelEn: 'Grade 5' },
  { value: 'SD-6', label: 'SD Kelas 6', labelEn: 'Grade 6' },
  { value: 'SMP-7', label: 'SMP Kelas 7', labelEn: 'Grade 7' },
  { value: 'SMP-8', label: 'SMP Kelas 8', labelEn: 'Grade 8' },
  { value: 'SMP-9', label: 'SMP Kelas 9', labelEn: 'Grade 9' },
  { value: 'SMA-10', label: 'SMA Kelas 10', labelEn: 'Grade 10' },
  { value: 'SMA-11', label: 'SMA Kelas 11', labelEn: 'Grade 11' },
  { value: 'SMA-12', label: 'SMA Kelas 12', labelEn: 'Grade 12' },
];

export function OnboardingModal() {
  const { setStudent } = useStudent();
  const t = useT();
  const [name, setName] = useState('');
  const [grade, setGrade] = useState('');
  const [step, setStep] = useState<'name' | 'grade'>('name');

  function handleNameNext() {
    if (name.trim().length < 2) return;
    setStep('grade');
  }

  function generateLocalCode(studentName: string) {
    const codeName = studentName.replace(/[^A-Za-z]/g, '').slice(0, 4).toUpperCase();
    const codeNum = Math.floor(1000 + Math.random() * 9000);
    return `${codeName}-${codeNum}`;
  }

  function handleFinish() {
    if (!grade) return;
    const trimmedName = name.trim();
    setStudent({
      id: 0,
      name: trimmedName,
      grade,
      stars: 0,
      level: 1,
      parent_code: generateLocalCode(trimmedName),
    });
  }

  const isEN = t('next') === 'Next';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl"
      >
        {step === 'name' ? (
          <>
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center">
                <Mascot size="xl" animate />
              </div>
            </div>

            <h2
              className="text-2xl font-black text-center text-foreground mb-1"
              style={{ fontFamily: 'var(--font-nunito)' }}
            >
              {t('whatsYourName')}
            </h2>
            <p className="text-sm text-muted-foreground text-center mb-5">
              {t('imKawabel')}
            </p>

            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleNameNext()}
              placeholder={t('typeName')}
              autoFocus
              className="w-full px-4 py-3 rounded-xl border border-border bg-muted/30 text-base font-medium text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
              maxLength={30}
            />

            <button
              onClick={handleNameNext}
              disabled={name.trim().length < 2}
              className="w-full mt-4 py-3 rounded-xl bg-primary text-white font-bold text-base disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
            >
              {t('next')}
            </button>
          </>
        ) : (
          <>
            <h2
              className="text-2xl font-black text-center text-foreground mb-1"
              style={{ fontFamily: 'var(--font-nunito)' }}
            >
              {t('whatGrade')} {name.trim().split(' ')[0]}?
            </h2>
            <p className="text-sm text-muted-foreground text-center mb-4">
              {t('soKawabelCanHelp')}
            </p>

            <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
              {GRADES.map((g) => (
                <button
                  key={g.value}
                  onClick={() => setGrade(g.value)}
                  className={`px-3 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                    grade === g.value
                      ? 'bg-primary text-white border-primary shadow-md'
                      : 'bg-white border-border hover:border-primary/50 text-foreground'
                  }`}
                >
                  {isEN ? g.labelEn : g.label}
                </button>
              ))}
            </div>

            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setStep('name')}
                className="flex-1 py-3 rounded-xl border border-border text-foreground font-medium hover:bg-muted/50 transition-colors"
              >
                {t('back')}
              </button>
              <button
                onClick={handleFinish}
                disabled={!grade}
                className="flex-1 py-3 rounded-xl bg-primary text-white font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
              >
                {t('startLearning')}
              </button>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}

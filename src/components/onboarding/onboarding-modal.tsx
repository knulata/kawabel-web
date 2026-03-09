'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useStudent } from '@/store/use-student';
import { Mascot } from '@/components/mascot';

const GRADES = [
  { value: 'SD-1', label: 'SD Kelas 1' },
  { value: 'SD-2', label: 'SD Kelas 2' },
  { value: 'SD-3', label: 'SD Kelas 3' },
  { value: 'SD-4', label: 'SD Kelas 4' },
  { value: 'SD-5', label: 'SD Kelas 5' },
  { value: 'SD-6', label: 'SD Kelas 6' },
  { value: 'SMP-7', label: 'SMP Kelas 7' },
  { value: 'SMP-8', label: 'SMP Kelas 8' },
  { value: 'SMP-9', label: 'SMP Kelas 9' },
  { value: 'SMA-10', label: 'SMA Kelas 10' },
  { value: 'SMA-11', label: 'SMA Kelas 11' },
  { value: 'SMA-12', label: 'SMA Kelas 12' },
];

export function OnboardingModal() {
  const { setStudent } = useStudent();
  const [name, setName] = useState('');
  const [grade, setGrade] = useState('');
  const [step, setStep] = useState<'name' | 'grade'>('name');

  function handleNameNext() {
    if (name.trim().length < 2) return;
    setStep('grade');
  }

  function handleFinish() {
    if (!grade) return;
    setStudent({
      id: 0,
      name: name.trim(),
      grade,
      stars: 0,
      level: 1,
    });
  }

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
              Halo! Siapa namamu?
            </h2>
            <p className="text-sm text-muted-foreground text-center mb-5">
              Aku Kawabel, kawan belajarmu!
            </p>

            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleNameNext()}
              placeholder="Ketik namamu..."
              autoFocus
              className="w-full px-4 py-3 rounded-xl border border-border bg-muted/30 text-base font-medium text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
              maxLength={30}
            />

            <button
              onClick={handleNameNext}
              disabled={name.trim().length < 2}
              className="w-full mt-4 py-3 rounded-xl bg-primary text-white font-bold text-base disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
            >
              Lanjut
            </button>
          </>
        ) : (
          <>
            <h2
              className="text-2xl font-black text-center text-foreground mb-1"
              style={{ fontFamily: 'var(--font-nunito)' }}
            >
              Kelas berapa, {name.trim().split(' ')[0]}?
            </h2>
            <p className="text-sm text-muted-foreground text-center mb-4">
              Biar Kawabel bisa bantu sesuai pelajaranmu
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
                  {g.label}
                </button>
              ))}
            </div>

            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setStep('name')}
                className="flex-1 py-3 rounded-xl border border-border text-foreground font-medium hover:bg-muted/50 transition-colors"
              >
                Kembali
              </button>
              <button
                onClick={handleFinish}
                disabled={!grade}
                className="flex-1 py-3 rounded-xl bg-primary text-white font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
              >
                Mulai Belajar!
              </button>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}

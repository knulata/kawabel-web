'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStudent } from '@/store/use-student';
import { useGamification } from '@/store/use-gamification';
import { useSubscription } from '@/store/use-subscription';
import { sendChat, saveProgress } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SUBJECTS } from '@/lib/constants';
import { playTap } from '@/lib/sounds';
import { hapticLight } from '@/lib/haptics';
import { ComboCounter } from '@/components/home/combo-counter';
import { UpgradePrompt } from '@/components/pricing/upgrade-prompt';
import { BookOpen, Loader2, Check, X, ArrowRight, RotateCcw } from 'lucide-react';
import type { TestQuestion } from '@/types';

type Phase = 'select' | 'loading' | 'quiz' | 'results';

export function TestPrepPage() {
  const { student } = useStudent();
  const { correctAnswer, wrongAnswer, breakCombo, combo, hearts, earnAchievement, addXP } =
    useGamification();
  const { canUse, incrementUsage } = useSubscription();
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [phase, setPhase] = useState<Phase>('select');
  const [subject, setSubject] = useState('');
  const [questions, setQuestions] = useState<TestQuestion[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [showExplanation, setShowExplanation] = useState(false);

  const generateQuiz = useCallback(
    async (subj: string) => {
      if (!student) return;
      if (!canUse('quizzes')) {
        setShowUpgrade(true);
        return;
      }
      incrementUsage('quizzes');
      setSubject(subj);
      setPhase('loading');
      setCurrentQ(0);
      setAnswers([]);
      breakCombo();

      try {
        const result = await sendChat(
          [
            {
              role: 'user' as const,
              content: `Generate 5 multiple choice questions for subject "${subj}" suitable for a ${student.grade || 'SD'} Indonesian student.
Reply ONLY with JSON array: [{"question":"...","options":["A","B","C","D"],"correct":0,"explanation":"..."}]`,
            },
          ],
          student.id
        );
        const parsed = JSON.parse(
          result.reply.replace(/```json?\n?/g, '').replace(/```/g, '').trim()
        );
        setQuestions(Array.isArray(parsed) ? parsed : []);
        setPhase('quiz');
      } catch {
        setPhase('select');
      }
    },
    [student, breakCombo, canUse, incrementUsage]
  );

  const handleAnswer = (idx: number) => {
    if (selected !== null) return;
    setSelected(idx);
    setShowExplanation(true);
    setAnswers((prev) => [...prev, idx]);

    const isCorrectAnswer = idx === questions[currentQ]?.correct;
    if (isCorrectAnswer) {
      correctAnswer(); // plays sound, haptic, adds XP, updates combo
    } else {
      wrongAnswer(); // plays sound, haptic, loses heart
    }
  };

  const nextQuestion = async () => {
    if (currentQ < questions.length - 1) {
      setCurrentQ((q) => q + 1);
      setSelected(null);
      setShowExplanation(false);
    } else {
      // Quiz complete
      const totalCorrectCount = [...answers, selected].reduce(
        (acc: number, ans, i) => acc + (ans === questions[i]?.correct ? 1 : 0),
        0,
      );

      // Check for perfect quiz achievement
      if (totalCorrectCount === questions.length) {
        earnAchievement('PERFECT_QUIZ');
        addXP(20); // bonus XP for perfect score
      }

      // First lesson achievement
      earnAchievement('FIRST_LESSON');

      if (student) {
        try {
          await saveProgress({
            student_id: student.id,
            subject,
            topic: 'Latihan Ujian',
            score: totalCorrectCount,
            total: questions.length,
            type: 'test',
          });
        } catch {
          // silent
        }
      }
      setPhase('results');
    }
  };

  const totalCorrect = answers.reduce(
    (acc: number, ans, i) => acc + (ans === questions[i]?.correct ? 1 : 0),
    0,
  );

  return (
    <div className="px-4 py-6 max-w-lg mx-auto">
      {/* Combo counter overlay */}
      {phase === 'quiz' && <ComboCounter />}

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h2 className="text-xl font-bold">📝 Latihan Ujian</h2>
        <p className="text-sm text-muted-foreground">
          Pilih mata pelajaran untuk mulai latihan
        </p>
      </motion.div>

      {/* No hearts warning */}
      {hearts === 0 && phase !== 'results' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700"
        >
          💔 Hati habis! Tunggu regenerasi atau isi ulang dengan gems.
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        {phase === 'select' && (
          <motion.div
            key="select"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-2 gap-3"
          >
            {SUBJECTS.map((subj) => (
              <Card
                key={subj}
                className="card-hover cursor-pointer"
                onClick={() => {
                  playTap();
                  hapticLight();
                  generateQuiz(subj);
                }}
              >
                <CardContent className="p-4 flex items-center gap-3">
                  <BookOpen size={20} className="text-primary shrink-0" />
                  <span className="text-sm font-medium">{subj}</span>
                </CardContent>
              </Card>
            ))}
          </motion.div>
        )}

        {phase === 'loading' && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center py-16 gap-3"
          >
            <Loader2 className="animate-spin text-primary" size={32} />
            <p className="text-sm text-muted-foreground">
              Menyiapkan soal {subject}...
            </p>
          </motion.div>
        )}

        {phase === 'quiz' && questions[currentQ] && (
          <motion.div
            key={`q-${currentQ}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            {/* Progress */}
            <div className="flex items-center justify-between mb-4">
              <Badge variant="secondary">
                Soal {currentQ + 1}/{questions.length}
              </Badge>
              <span className="text-sm text-muted-foreground">{subject}</span>
            </div>

            <div className="w-full bg-muted rounded-full h-1.5 mb-6">
              <motion.div
                className="bg-primary rounded-full h-1.5"
                initial={false}
                animate={{
                  width: `${((currentQ + 1) / questions.length) * 100}%`,
                }}
                transition={{ type: 'spring', stiffness: 100 }}
              />
            </div>

            {/* Question */}
            <Card className="mb-4">
              <CardContent className="p-5">
                <p className="font-medium text-base leading-relaxed">
                  {questions[currentQ].question}
                </p>
              </CardContent>
            </Card>

            {/* Options */}
            <div className="space-y-2 mb-4">
              {questions[currentQ].options.map((opt, i) => {
                const isSelected = selected === i;
                const isCorrectAnswer = i === questions[currentQ].correct;
                let variant = 'outline' as 'outline' | 'default' | 'destructive';
                let extraClass = '';

                if (selected !== null) {
                  if (isCorrectAnswer) {
                    variant = 'default';
                    extraClass = 'bg-green-600 hover:bg-green-600 border-green-600';
                  } else if (isSelected && !isCorrectAnswer) {
                    variant = 'destructive';
                  }
                }

                return (
                  <motion.div
                    key={i}
                    initial={false}
                    animate={
                      selected !== null && isCorrectAnswer
                        ? { scale: [1, 1.03, 1] }
                        : {}
                    }
                    transition={{ duration: 0.3 }}
                  >
                    <Button
                      variant={variant}
                      className={`w-full justify-start h-auto py-3 px-4 text-left text-sm ${extraClass}`}
                      onClick={() => handleAnswer(i)}
                      disabled={selected !== null || hearts === 0}
                    >
                      <span className="font-semibold mr-2">
                        {String.fromCharCode(65 + i)}.
                      </span>
                      {opt}
                      {selected !== null && isCorrectAnswer && (
                        <Check size={16} className="ml-auto" />
                      )}
                      {isSelected && !isCorrectAnswer && (
                        <X size={16} className="ml-auto" />
                      )}
                    </Button>
                  </motion.div>
                );
              })}
            </div>

            {/* Explanation */}
            <AnimatePresence>
              {showExplanation && questions[currentQ].explanation && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mb-4"
                >
                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="p-4">
                      <p className="text-sm text-blue-800">
                        <span className="font-semibold">Penjelasan: </span>
                        {questions[currentQ].explanation}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* XP earned indicator */}
            {selected !== null && selected === questions[currentQ].correct && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-3"
              >
                <span className="text-sm font-semibold text-primary">
                  +{10 + (combo >= 10 ? 5 : combo >= 5 ? 3 : combo >= 3 ? 2 : 0)} XP
                  {combo >= 2 && ` (${combo}x kombo!)`}
                </span>
              </motion.div>
            )}

            {selected !== null && (
              <Button onClick={nextQuestion} className="w-full rounded-xl h-12">
                {currentQ < questions.length - 1 ? (
                  <>
                    <ArrowRight size={18} className="mr-2" />
                    Soal Berikutnya
                  </>
                ) : (
                  <>
                    <Check size={18} className="mr-2" />
                    Lihat Hasil
                  </>
                )}
              </Button>
            )}
          </motion.div>
        )}

        {phase === 'results' && (
          <motion.div
            key="results"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-8"
          >
            <motion.div
              className="text-6xl mb-4"
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200 }}
            >
              {totalCorrect === questions.length
                ? '🏆'
                : totalCorrect >= 4
                  ? '🎉'
                  : totalCorrect >= 2
                    ? '👍'
                    : '💪'}
            </motion.div>
            <h3 className="text-2xl font-bold mb-1">
              {totalCorrect}/{questions.length} Benar
            </h3>

            {totalCorrect === questions.length && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-primary font-semibold mb-1"
              >
                Sempurna! +20 XP bonus 🌟
              </motion.p>
            )}

            <p className="text-sm text-muted-foreground mb-8">
              {totalCorrect === questions.length
                ? 'Luar biasa! Kamu sempurna!'
                : totalCorrect >= 4
                  ? 'Keren banget!'
                  : totalCorrect >= 2
                    ? 'Bagus, terus berlatih!'
                    : 'Jangan menyerah, coba lagi!'}
            </p>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 rounded-xl h-12"
                onClick={() => {
                  playTap();
                  setPhase('select');
                }}
              >
                <RotateCcw size={16} className="mr-2" />
                Ganti Mapel
              </Button>
              <Button
                className="flex-1 rounded-xl h-12"
                onClick={() => {
                  playTap();
                  generateQuiz(subject);
                }}
              >
                Coba Lagi
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upgrade prompt */}
      <UpgradePrompt
        open={showUpgrade}
        feature="quizzes"
        onDismiss={() => setShowUpgrade(false)}
      />
    </div>
  );
}

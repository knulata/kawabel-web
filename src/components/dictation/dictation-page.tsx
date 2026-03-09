'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStudent } from '@/store/use-student';
import { useGamification } from '@/store/use-gamification';
import { sendChat, saveProgress } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ComboCounter } from '@/components/home/combo-counter';
import { Volume2, RotateCcw, Check, ArrowRight, Loader2 } from 'lucide-react';

interface DictationWord {
  chinese: string;
  pinyin: string;
  meaning: string;
}

export function DictationPage() {
  const { student } = useStudent();
  const { correctAnswer, wrongAnswer, combo, hearts, earnAchievement } = useGamification();
  const [currentWord, setCurrentWord] = useState<DictationWord | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [isGenerating, setIsGenerating] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const lastPosRef = useRef({ x: 0, y: 0 });

  const generateWord = useCallback(async () => {
    if (!student) return;
    setIsGenerating(true);
    setShowResult(false);
    setUserAnswer('');
    clearCanvas();

    try {
      const result = await sendChat(
        [
          {
            role: 'user' as const,
            content: `Generate a single Chinese vocabulary word suitable for a ${student.grade || 'SD'} student.
Reply ONLY with JSON: {"chinese":"字","pinyin":"zì","meaning":"character"}`,
          },
        ],
        student.id
      );
      const parsed = JSON.parse(
        result.reply.replace(/```json?\n?/g, '').replace(/```/g, '').trim()
      );
      setCurrentWord(parsed);
    } catch {
      setCurrentWord({ chinese: '你好', pinyin: 'nǐ hǎo', meaning: 'hello' });
    } finally {
      setIsGenerating(false);
    }
  }, [student]);

  useEffect(() => {
    generateWord();
  }, [generateWord]);

  // Canvas drawing
  const getCanvasPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height),
    };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    isDrawingRef.current = true;
    lastPosRef.current = getCanvasPos(e);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawingRef.current) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const pos = getCanvasPos(e);
    ctx.beginPath();
    ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    lastPosRef.current = pos;
  };

  const stopDraw = () => {
    isDrawingRef.current = false;
  };

  const clearCanvas = () => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx || !canvasRef.current) return;
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  };

  const checkAnswer = async () => {
    if (!currentWord || !student) return;
    const answer = userAnswer.trim();
    const correct = answer === currentWord.chinese;
    setIsCorrect(correct);
    setShowResult(true);

    const newScore = {
      correct: score.correct + (correct ? 1 : 0),
      total: score.total + 1,
    };
    setScore(newScore);

    // Gamification
    if (correct) {
      correctAnswer(); // sound, haptic, XP, combo
    } else {
      wrongAnswer(); // sound, haptic, lose heart
    }

    // Mandarin master achievement
    if (newScore.correct >= 50) {
      earnAchievement('MANDARIN_MASTER');
    }

    try {
      await saveProgress({
        student_id: student.id,
        subject: 'Bahasa Mandarin',
        topic: '听写 Dictation',
        score: correct ? 1 : 0,
        total: 1,
        type: 'dictation',
      });
    } catch {
      // silent fail
    }
  };

  const speak = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = 0.8;
    speechSynthesis.speak(utterance);
  };

  return (
    <div className="px-4 py-6 max-w-lg mx-auto">
      {/* Combo counter */}
      <ComboCounter />

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h2 className="text-xl font-bold">✍️ 听写 Dikte</h2>
        <p className="text-sm text-muted-foreground">
          Dengarkan & tulis karakter Mandarin
        </p>
      </motion.div>

      {/* Score & hearts warning */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-semibold text-primary">
            {score.correct}/{score.total}
          </span>
          <span className="text-muted-foreground">benar</span>
          {combo >= 2 && (
            <span className="text-xs text-orange-500 font-bold">
              🔥 {combo}x kombo
            </span>
          )}
        </div>
      </div>

      {hearts === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700"
        >
          💔 Hati habis! Tunggu regenerasi atau isi ulang dengan gems.
        </motion.div>
      )}

      {/* Word card */}
      <Card className="mb-4">
        <CardContent className="p-6 text-center">
          {isGenerating ? (
            <div className="flex items-center justify-center gap-2 py-8">
              <Loader2 className="animate-spin text-primary" size={24} />
              <span className="text-sm text-muted-foreground">
                Menyiapkan kata...
              </span>
            </div>
          ) : currentWord ? (
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                {currentWord.meaning}
              </p>
              <Button
                variant="outline"
                size="lg"
                onClick={() => speak(currentWord.chinese)}
                className="gap-2"
              >
                <Volume2 size={20} />
                Dengarkan
              </Button>

              <AnimatePresence>
                {showResult && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4"
                  >
                    <p className="text-4xl font-bold mb-1">
                      {currentWord.chinese}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {currentWord.pinyin}
                    </p>
                    <motion.div
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      className={`mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold ${
                        isCorrect
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {isCorrect ? (
                        <>
                          <Check size={14} /> Benar! +{10 + (combo >= 10 ? 5 : combo >= 5 ? 3 : combo >= 3 ? 2 : 0)} XP
                        </>
                      ) : (
                        'Belum tepat 💔'
                      )}
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Writing area */}
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium">Tulis jawabanmu:</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearCanvas}
              className="text-xs"
            >
              <RotateCcw size={14} className="mr-1" />
              Hapus
            </Button>
          </div>

          <canvas
            ref={canvasRef}
            width={400}
            height={200}
            className="w-full border-2 border-dashed border-border rounded-xl bg-white cursor-crosshair touch-none"
            onMouseDown={startDraw}
            onMouseMove={draw}
            onMouseUp={stopDraw}
            onMouseLeave={stopDraw}
            onTouchStart={startDraw}
            onTouchMove={draw}
            onTouchEnd={stopDraw}
          />

          <div className="mt-3 flex gap-2">
            <input
              type="text"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              placeholder="Ketik karakter di sini..."
              className="flex-1 px-3 py-2 rounded-xl bg-muted/50 border-0 text-lg text-center focus:outline-none focus:ring-2 focus:ring-primary"
              lang="zh"
              disabled={hearts === 0}
            />
          </div>
        </CardContent>
      </Card>

      {/* Action buttons */}
      <div className="flex gap-3">
        {!showResult ? (
          <Button
            onClick={checkAnswer}
            disabled={!userAnswer.trim() || !currentWord || hearts === 0}
            className="flex-1 rounded-xl h-12"
          >
            <Check size={18} className="mr-2" />
            Periksa
          </Button>
        ) : (
          <Button
            onClick={generateWord}
            className="flex-1 rounded-xl h-12"
          >
            <ArrowRight size={18} className="mr-2" />
            Kata Berikutnya
          </Button>
        )}
      </div>
    </div>
  );
}

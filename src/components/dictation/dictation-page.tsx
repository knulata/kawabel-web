'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStudent } from '@/store/use-student';
import { useGamification } from '@/store/use-gamification';
import { useSubscription } from '@/store/use-subscription';
import { sendChat, saveProgress } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PermissionGuide, usePermission } from '@/components/chat/permission-guide';
import { UpgradePrompt } from '@/components/pricing/upgrade-prompt';
import { Mascot, MASCOT_NAME } from '@/components/mascot';
import { playTap, playCorrect, playWrong } from '@/lib/sounds';
import { hapticLight, hapticSuccess, hapticError } from '@/lib/haptics';
import {
  Camera,
  Volume2,
  ChevronRight,
  ChevronLeft,
  Check,
  X,
  Loader2,
  RotateCcw,
  ImageIcon,
  HelpCircle,
} from 'lucide-react';

interface DictationWord {
  chinese: string;
  pinyin: string;
  meaning: string;
}

interface CheckResult {
  word: string;
  expected: string;
  correct: boolean;
  feedback: string;
}

type Phase = 'upload' | 'extracting' | 'dictation' | 'photo-answer' | 'checking' | 'results';

export function DictationPage() {
  const { student } = useStudent();
  const { addXP, earnAchievement, combo } = useGamification();
  const { canUse, incrementUsage } = useSubscription();
  const cameraPerm = usePermission('camera');

  const [phase, setPhase] = useState<Phase>('upload');
  const [words, setWords] = useState<DictationWord[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [spokenIndices, setSpokenIndices] = useState<Set<number>>(new Set());
  const [results, setResults] = useState<CheckResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showPermGuide, setShowPermGuide] = useState(false);
  const [wordListImage, setWordListImage] = useState<string | null>(null);
  const [answerImage, setAnswerImage] = useState<string | null>(null);

  const wordFileRef = useRef<HTMLInputElement>(null);
  const answerFileRef = useRef<HTMLInputElement>(null);

  // ── Phase 1: Upload word list photo ──────────────────────────────

  const handleCameraClick = async (inputRef: React.RefObject<HTMLInputElement | null>) => {
    if (cameraPerm.status === 'denied') {
      setShowPermGuide(true);
      return;
    }
    if (cameraPerm.status === 'prompt') {
      const granted = await cameraPerm.request();
      if (!granted) {
        setShowPermGuide(true);
        return;
      }
    }
    inputRef.current?.click();
  };

  const handleWordListSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!canUse('dictations')) {
      setShowUpgrade(true);
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setWordListImage(reader.result as string);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const extractWords = useCallback(async () => {
    if (!wordListImage) return;

    incrementUsage('dictations');
    setPhase('extracting');
    setError(null);

    try {
      const result = await sendChat(
        [
          {
            role: 'user' as const,
            content: [
              {
                type: 'text' as const,
                text: `Look at this image of Chinese vocabulary words. Extract ALL the Chinese characters/words you see.
Reply ONLY with a JSON array: [{"chinese":"字","pinyin":"zì","meaning":"character/word"}]
Include pinyin with tone marks and Indonesian meaning for each word. Extract every word visible.`,
              },
              { type: 'image_url' as const, image_url: { url: wordListImage } },
            ],
          },
        ] as never[],
        student?.id ?? 0,
        'full', // vision model for image OCR
      );

      const parsed = JSON.parse(
        result.reply.replace(/```json?\n?/g, '').replace(/```/g, '').trim(),
      );

      if (!Array.isArray(parsed) || parsed.length === 0) {
        throw new Error('Tidak ada kata yang terdeteksi');
      }

      setWords(parsed);
      setCurrentIdx(0);
      setSpokenIndices(new Set());
      setPhase('dictation');
    } catch {
      setError('Gagal membaca kata dari foto. Pastikan foto jelas dan berisi kata-kata Mandarin.');
      setPhase('upload');
    }
  }, [student, wordListImage, incrementUsage]);

  // Auto-extract when image is selected
  useEffect(() => {
    if (wordListImage && phase === 'upload') {
      extractWords();
    }
  }, [wordListImage, phase, extractWords]);

  // ── Phase 2: Dictation ───────────────────────────────────────────

  const speak = (text: string) => {
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = 0.7;
    speechSynthesis.speak(utterance);
    playTap();
    hapticLight();
    setSpokenIndices((prev) => new Set(prev).add(currentIdx));
  };

  const speakCurrent = () => {
    if (words[currentIdx]) {
      speak(words[currentIdx].chinese);
    }
  };

  const goNext = () => {
    if (currentIdx < words.length - 1) {
      setCurrentIdx((i) => i + 1);
    }
  };

  const goPrev = () => {
    if (currentIdx > 0) {
      setCurrentIdx((i) => i - 1);
    }
  };

  const finishDictation = () => {
    setPhase('photo-answer');
  };

  // ── Phase 3: Check answers ──────────────────────────────────────

  const handleAnswerSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setAnswerImage(reader.result as string);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const checkAnswers = useCallback(async () => {
    if (!answerImage) return;

    setPhase('checking');
    setError(null);

    const wordList = words.map((w, i) => `${i + 1}. ${w.chinese} (${w.pinyin})`).join('\n');

    try {
      const result = await sendChat(
        [
          {
            role: 'user' as const,
            content: [
              {
                type: 'text' as const,
                text: `I gave a Chinese dictation test. Here are the expected words:
${wordList}

Now look at the student's handwritten answers in this photo. Compare each answer to the expected word.
Reply ONLY with JSON array: [{"word":"written_char","expected":"正确","correct":true/false,"feedback":"short feedback in Indonesian"}]
Be lenient with minor stroke imperfections but check character accuracy. Match answers in order (1st written = 1st expected, etc).`,
              },
              { type: 'image_url' as const, image_url: { url: answerImage } },
            ],
          },
        ] as never[],
        student?.id ?? 0,
        'full', // vision model for handwriting OCR
      );

      const parsed = JSON.parse(
        result.reply.replace(/```json?\n?/g, '').replace(/```/g, '').trim(),
      );

      if (!Array.isArray(parsed)) throw new Error('Invalid response');

      setResults(parsed);

      // Gamification
      const correctCount = parsed.filter((r: CheckResult) => r.correct).length;
      const xp = correctCount * 10;
      if (xp > 0) addXP(xp);
      if (correctCount === words.length && words.length >= 5) {
        earnAchievement('MANDARIN_MASTER');
      }
      earnAchievement('FIRST_LESSON');

      // Save progress
      if (student) {
        try {
          await saveProgress({
            student_id: student.id,
            subject: 'Bahasa Mandarin',
            topic: '听写 Dictation',
            score: correctCount,
            total: words.length,
            type: 'dictation',
          });
        } catch {
          // silent
        }
      }

      setPhase('results');
    } catch {
      setError('Gagal memeriksa jawaban. Pastikan foto tulisan jelas.');
      setPhase('photo-answer');
    }
  }, [student, answerImage, words, addXP, earnAchievement]);

  useEffect(() => {
    if (answerImage && phase === 'photo-answer') {
      checkAnswers();
    }
  }, [answerImage, phase, checkAnswers]);

  // ── Reset ───────────────────────────────────────────────────────

  const startOver = () => {
    setPhase('upload');
    setWords([]);
    setCurrentIdx(0);
    setSpokenIndices(new Set());
    setResults([]);
    setError(null);
    setWordListImage(null);
    setAnswerImage(null);
  };

  const correctCount = results.filter((r) => r.correct).length;

  // ── Render ──────────────────────────────────────────────────────

  return (
    <div className="px-4 py-6 max-w-lg mx-auto pb-28 sm:pb-8">
      {/* Hidden file inputs */}
      <input
        ref={wordFileRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleWordListSelect}
        className="hidden"
      />
      <input
        ref={answerFileRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleAnswerSelect}
        className="hidden"
      />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h2 className="text-2xl font-bold">✍️ 听写 Dikte Mandarin</h2>
        <p className="text-base text-muted-foreground">
          Foto → Dengarkan → Tulis → Periksa
        </p>
      </motion.div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-6">
        {[
          { label: 'Foto Kata', num: 1 },
          { label: 'Dikte', num: 2 },
          { label: 'Periksa', num: 3 },
        ].map((step) => {
          const phaseNum =
            phase === 'upload' || phase === 'extracting'
              ? 1
              : phase === 'dictation'
                ? 2
                : 3;
          const isActive = step.num === phaseNum;
          const isDone = step.num < phaseNum;
          return (
            <div key={step.num} className="flex items-center gap-2 flex-1">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                  isDone
                    ? 'bg-primary text-primary-foreground'
                    : isActive
                      ? 'bg-primary text-primary-foreground ring-2 ring-primary/30'
                      : 'bg-muted text-muted-foreground'
                }`}
              >
                {isDone ? <Check size={14} /> : step.num}
              </div>
              <span
                className={`text-xs font-medium truncate ${
                  isActive ? 'text-foreground' : 'text-muted-foreground'
                }`}
              >
                {step.label}
              </span>
              {step.num < 3 && (
                <div className={`flex-1 h-0.5 rounded ${isDone ? 'bg-primary' : 'bg-muted'}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Error display */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 flex items-start gap-2"
          >
            <X size={16} className="shrink-0 mt-0.5" />
            <div>
              <p>{error}</p>
              <button
                onClick={() => setError(null)}
                className="text-red-500 underline text-xs mt-1"
              >
                Tutup
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Permission guide */}
      <AnimatePresence>
        {showPermGuide && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="mb-4"
          >
            <PermissionGuide type="camera" onDismiss={() => setShowPermGuide(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {/* ────── PHASE 1: Upload word list ────── */}
        {phase === 'upload' && (
          <motion.div
            key="upload"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Card className="overflow-hidden">
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <Mascot size="lg" className="mx-auto mb-3" />
                  <h3 className="font-bold text-lg">Langkah 1: Foto Daftar Kata</h3>
                  <p className="text-base text-muted-foreground mt-1">
                    Foto halaman buku yang berisi kata-kata Mandarin yang ingin didiktekan
                  </p>
                </div>

                {/* Instructions card */}
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-5">
                  <div className="flex items-center gap-2 text-blue-700 font-semibold text-base mb-2">
                    <HelpCircle size={16} />
                    Cara pakai:
                  </div>
                  <ol className="space-y-2 text-base text-blue-800">
                    <li className="flex gap-2">
                      <span className="font-bold text-blue-600">1.</span>
                      <span>Buka buku pelajaran Mandarin di halaman daftar kata (听写词语)</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-bold text-blue-600">2.</span>
                      <span>Foto daftar kata tersebut — pastikan semua karakter terlihat jelas</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-bold text-blue-600">3.</span>
                      <span>{MASCOT_NAME} akan membacakan kata satu per satu, kamu tulis di kertas</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-bold text-blue-600">4.</span>
                      <span>Setelah selesai, foto hasil tulisanmu untuk diperiksa</span>
                    </li>
                  </ol>
                </div>

                {/* Preview of selected image */}
                {wordListImage && (
                  <div className="mb-4 relative">
                    <img
                      src={wordListImage}
                      alt="Daftar kata"
                      className="w-full rounded-xl border border-border max-h-48 object-cover"
                    />
                    <button
                      onClick={() => setWordListImage(null)}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}

                <Button
                  onClick={() => handleCameraClick(wordFileRef)}
                  className="w-full h-14 rounded-xl text-base font-bold gap-3 kawabel-gradient text-white"
                >
                  <Camera size={22} />
                  Foto Daftar Kata
                </Button>

                <p className="text-center text-xs text-muted-foreground mt-3">
                  Bisa juga pilih foto dari galeri
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ────── EXTRACTING ────── */}
        {phase === 'extracting' && (
          <motion.div
            key="extracting"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center py-16 gap-4"
          >
            <Mascot size="xl" animate />
            <Loader2 className="animate-spin text-primary" size={28} />
            <div className="text-center">
              <p className="font-semibold text-base">Membaca kata dari foto...</p>
              <p className="text-xs text-muted-foreground mt-1">
                {MASCOT_NAME} sedang mengenali karakter Mandarin
              </p>
            </div>
          </motion.div>
        )}

        {/* ────── PHASE 2: Dictation ────── */}
        {phase === 'dictation' && (
          <motion.div
            key="dictation"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Word count & progress */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-base font-medium">
                Kata {currentIdx + 1} dari {words.length}
              </span>
              <span className="text-xs text-muted-foreground">
                {spokenIndices.size}/{words.length} didengarkan
              </span>
            </div>

            <div className="w-full bg-muted rounded-full h-1.5 mb-5">
              <motion.div
                className="bg-primary rounded-full h-1.5"
                initial={false}
                animate={{ width: `${((currentIdx + 1) / words.length) * 100}%` }}
                transition={{ type: 'spring' as const, stiffness: 100 }}
              />
            </div>

            {/* Instruction card */}
            <Card className="mb-4 border-amber-200 bg-amber-50/50">
              <CardContent className="p-4 flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                  <Volume2 size={16} className="text-amber-600" />
                </div>
                <div>
                  <p className="text-base font-semibold text-amber-800">
                    Siapkan kertas & pensil!
                  </p>
                  <p className="text-xs text-amber-700 mt-0.5">
                    Tekan tombol untuk mendengar kata, lalu tulis jawabanmu di kertas.
                    Setiap kata bisa didengar berkali-kali.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Current word card */}
            <Card className="mb-4">
              <CardContent className="p-8 text-center">
                <p className="text-base text-muted-foreground mb-1">
                  Arti: <span className="font-medium text-foreground">{words[currentIdx]?.meaning}</span>
                </p>

                <Button
                  size="lg"
                  onClick={speakCurrent}
                  className="mt-4 h-16 px-10 rounded-2xl text-lg font-bold gap-3 kawabel-gradient text-white shadow-lg"
                >
                  <Volume2 size={24} />
                  Dengarkan
                </Button>

                {spokenIndices.has(currentIdx) && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-xs text-green-600 mt-3 font-medium"
                  >
                    Sudah diputar — tulis di kertas, lalu lanjut!
                  </motion.p>
                )}
              </CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={goPrev}
                disabled={currentIdx === 0}
                className="rounded-xl h-12"
              >
                <ChevronLeft size={18} />
              </Button>

              <Button
                variant="outline"
                onClick={speakCurrent}
                className="flex-1 rounded-xl h-12 gap-2"
              >
                <RotateCcw size={16} />
                Ulang
              </Button>

              {currentIdx < words.length - 1 ? (
                <Button
                  onClick={goNext}
                  className="flex-1 rounded-xl h-12 gap-2"
                >
                  Lanjut
                  <ChevronRight size={18} />
                </Button>
              ) : (
                <Button
                  onClick={finishDictation}
                  className="flex-1 rounded-xl h-12 gap-2 bg-green-600 hover:bg-green-700"
                >
                  <Check size={18} />
                  Selesai Dikte
                </Button>
              )}
            </div>

            {/* Quick word list overview */}
            <div className="mt-5">
              <p className="text-xs font-medium text-muted-foreground mb-2">Daftar kata:</p>
              <div className="flex flex-wrap gap-1.5">
                {words.map((w, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentIdx(i)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                      i === currentIdx
                        ? 'bg-primary text-primary-foreground'
                        : spokenIndices.has(i)
                          ? 'bg-green-100 text-green-700 border border-green-200'
                          : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {i + 1}. {w.meaning}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* ────── PHASE 3: Photo answer ────── */}
        {phase === 'photo-answer' && (
          <motion.div
            key="photo-answer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="text-center mb-5">
                  <Mascot size="lg" className="mx-auto mb-3" />
                  <h3 className="font-bold text-lg">Langkah 3: Foto Jawabanmu</h3>
                  <p className="text-base text-muted-foreground mt-1">
                    Foto kertas yang berisi tulisan Mandarin-mu. Pastikan tulisan terlihat jelas!
                  </p>
                </div>

                {/* Tips */}
                <div className="bg-green-50 border border-green-100 rounded-xl p-4 mb-5">
                  <p className="text-xs font-semibold text-green-700 mb-1.5">Tips foto yang bagus:</p>
                  <ul className="space-y-1 text-xs text-green-800">
                    <li>• Letakkan kertas di permukaan datar dengan cahaya terang</li>
                    <li>• Pastikan semua tulisan masuk dalam frame</li>
                    <li>• Tulis dengan urutan yang sama seperti dikte</li>
                    <li>• Hindari bayangan di atas tulisan</li>
                  </ul>
                </div>

                {/* Preview */}
                {answerImage && (
                  <div className="mb-4 relative">
                    <img
                      src={answerImage}
                      alt="Jawaban"
                      className="w-full rounded-xl border border-border max-h-48 object-cover"
                    />
                    <button
                      onClick={() => setAnswerImage(null)}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}

                <Button
                  onClick={() => handleCameraClick(answerFileRef)}
                  className="w-full h-14 rounded-xl text-base font-bold gap-3 kawabel-gradient text-white"
                >
                  <Camera size={22} />
                  Foto Jawaban
                </Button>

                <button
                  onClick={() => setPhase('dictation')}
                  className="w-full text-center text-sm text-muted-foreground hover:text-foreground mt-3 transition-colors"
                >
                  ← Kembali ke dikte
                </button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ────── CHECKING ────── */}
        {phase === 'checking' && (
          <motion.div
            key="checking"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center py-16 gap-4"
          >
            <Mascot size="xl" animate />
            <Loader2 className="animate-spin text-primary" size={28} />
            <div className="text-center">
              <p className="font-semibold text-base">Memeriksa jawaban...</p>
              <p className="text-xs text-muted-foreground mt-1">
                {MASCOT_NAME} sedang membandingkan tulisanmu
              </p>
            </div>
          </motion.div>
        )}

        {/* ────── RESULTS ────── */}
        {phase === 'results' && (
          <motion.div
            key="results"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Score header */}
            <Card className="mb-4 overflow-hidden">
              <div className={`p-6 text-center ${
                correctCount === words.length
                  ? 'bg-gradient-to-br from-green-50 to-emerald-50'
                  : correctCount >= words.length * 0.7
                    ? 'bg-gradient-to-br from-blue-50 to-sky-50'
                    : 'bg-gradient-to-br from-amber-50 to-orange-50'
              }`}>
                <motion.div
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring' as const, stiffness: 200 }}
                  className="text-5xl mb-3"
                >
                  {correctCount === words.length
                    ? '🏆'
                    : correctCount >= words.length * 0.7
                      ? '🎉'
                      : correctCount >= words.length * 0.4
                        ? '👍'
                        : '💪'}
                </motion.div>
                <h3 className="text-2xl font-bold">
                  {correctCount}/{words.length} Benar
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {correctCount === words.length
                    ? 'Sempurna! Kamu hebat!'
                    : correctCount >= words.length * 0.7
                      ? 'Bagus sekali! Terus berlatih!'
                      : 'Jangan menyerah, coba lagi!'}
                </p>
                {correctCount > 0 && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-primary font-semibold text-sm mt-2"
                  >
                    +{correctCount * 10} XP
                  </motion.p>
                )}
              </div>
            </Card>

            {/* Detailed results */}
            <div className="space-y-2 mb-6">
              {results.map((r, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className={`border ${r.correct ? 'border-green-200' : 'border-red-200'}`}>
                    <CardContent className="p-3 flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                          r.correct ? 'bg-green-100' : 'bg-red-100'
                        }`}
                      >
                        {r.correct ? (
                          <Check size={16} className="text-green-600" />
                        ) : (
                          <X size={16} className="text-red-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {r.word && !r.correct && (
                            <span className="text-base line-through text-red-400">{r.word}</span>
                          )}
                          <span className="text-base font-bold">{r.expected}</span>
                          {words[i] && (
                            <span className="text-xs text-muted-foreground">
                              ({words[i].pinyin})
                            </span>
                          )}
                        </div>
                        {r.feedback && (
                          <p className="text-xs text-muted-foreground mt-0.5">{r.feedback}</p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => speak(r.expected)}
                        className="shrink-0"
                      >
                        <Volume2 size={14} />
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={startOver}
                className="flex-1 rounded-xl h-12 gap-2"
              >
                <RotateCcw size={16} />
                Mulai Baru
              </Button>
              <Button
                onClick={() => {
                  setPhase('dictation');
                  setCurrentIdx(0);
                  setSpokenIndices(new Set());
                  setAnswerImage(null);
                  setResults([]);
                }}
                className="flex-1 rounded-xl h-12 gap-2"
              >
                <RotateCcw size={16} />
                Ulangi Kata Sama
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upgrade prompt */}
      <UpgradePrompt
        open={showUpgrade}
        feature="dictations"
        onDismiss={() => setShowUpgrade(false)}
      />
    </div>
  );
}

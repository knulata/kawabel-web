'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Mascot } from '@/components/mascot';
import { Card, CardContent } from '@/components/ui/card';
import { Search, BookOpen, Award, ArrowLeft, TrendingUp } from 'lucide-react';

interface StudentInfo {
  id: number;
  name: string;
  grade: string;
  stars: number;
  level: number;
  avatar_url?: string;
}

interface ProgressItem {
  id: number;
  subject: string;
  topic: string;
  score: number;
  total: number;
  type: string;
  created_at: string;
}

export default function ParentPage() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [student, setStudent] = useState<StudentInfo | null>(null);
  const [progress, setProgress] = useState<ProgressItem[]>([]);

  async function handleLookup() {
    const trimmed = code.trim().toUpperCase();
    if (trimmed.length < 4) {
      setError('Masukkan kode yang valid');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/parent?code=${encodeURIComponent(trimmed)}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Kode tidak ditemukan');
        return;
      }
      setStudent(data.student);
      setProgress(data.progress);
    } catch {
      setError('Gagal memuat data, coba lagi');
    } finally {
      setLoading(false);
    }
  }

  // Group progress by subject
  const bySubject: Record<string, ProgressItem[]> = {};
  for (const p of progress) {
    if (!bySubject[p.subject]) bySubject[p.subject] = [];
    bySubject[p.subject].push(p);
  }

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-40 glass border-b border-border/50">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/" className="p-1.5 rounded-lg hover:bg-muted">
            <ArrowLeft size={20} />
          </Link>
          <div className="flex items-center gap-2">
            <Mascot size="lg" />
            <span
              className="text-xl font-black kawabel-gradient-text"
              style={{ fontFamily: 'var(--font-nunito)' }}
            >
              kawabel
            </span>
          </div>
          <span className="text-sm text-muted-foreground ml-1">Orang Tua</span>
        </div>
      </header>

      <div className="max-w-xl mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          {!student ? (
            <motion.div
              key="lookup"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-5"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Search size={28} className="text-blue-500" />
                </div>
                <h1
                  className="text-2xl font-black text-foreground"
                  style={{ fontFamily: 'var(--font-nunito)' }}
                >
                  Lihat Progress Anak
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Masukkan kode dari anak Anda untuk melihat progress belajarnya
                </p>
              </div>

              <div>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value.toUpperCase());
                    setError(null);
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
                  placeholder="Masukkan kode (contoh: BUDI-1234)"
                  className="w-full px-4 py-3 rounded-xl border border-border bg-muted/30 text-center text-lg font-mono font-bold tracking-wider placeholder:text-muted-foreground/40 placeholder:tracking-normal placeholder:font-normal placeholder:text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                  maxLength={12}
                  autoFocus
                />

                {error && (
                  <p className="text-sm text-red-500 text-center mt-2">{error}</p>
                )}

                <button
                  onClick={handleLookup}
                  disabled={loading || code.trim().length < 4}
                  className="w-full mt-3 py-3 rounded-xl bg-primary text-white font-bold disabled:opacity-40 hover:bg-primary/90 transition-colors"
                >
                  {loading ? 'Mencari...' : 'Lihat Progress'}
                </button>
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                <p className="text-xs text-blue-700">
                  <span className="font-semibold">Bagaimana cara mendapatkan kode?</span>
                  <br />
                  Anak Anda bisa menemukan kode ini di halaman utama Kawabel setelah masuk dengan Google. Kode berupa kombinasi nama + angka unik.
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="progress"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-5"
            >
              {/* Student card */}
              <Card className="border-primary/20 bg-gradient-to-br from-green-50 to-emerald-50">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
                    {student.avatar_url ? (
                      <img src={student.avatar_url} alt="" className="w-14 h-14 rounded-2xl object-cover" />
                    ) : (
                      student.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-bold text-foreground">{student.name}</h2>
                    <p className="text-sm text-muted-foreground">{student.grade}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">Level</div>
                    <div className="text-2xl font-black text-primary">{student.level}</div>
                  </div>
                </CardContent>
              </Card>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                <Card>
                  <CardContent className="p-3 text-center">
                    <Award size={20} className="text-amber-500 mx-auto mb-1" />
                    <div className="text-lg font-bold">{student.stars}</div>
                    <div className="text-[10px] text-muted-foreground">Bintang</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3 text-center">
                    <BookOpen size={20} className="text-blue-500 mx-auto mb-1" />
                    <div className="text-lg font-bold">{progress.length}</div>
                    <div className="text-[10px] text-muted-foreground">Sesi Belajar</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3 text-center">
                    <TrendingUp size={20} className="text-green-500 mx-auto mb-1" />
                    <div className="text-lg font-bold">
                      {progress.length > 0
                        ? Math.round(
                            progress.reduce((sum, p) => sum + (p.score / p.total) * 100, 0) /
                              progress.length,
                          )
                        : 0}
                      %
                    </div>
                    <div className="text-[10px] text-muted-foreground">Rata-rata</div>
                  </CardContent>
                </Card>
              </div>

              {/* Progress by subject */}
              {Object.keys(bySubject).length > 0 ? (
                <div className="space-y-3">
                  <h3 className="text-base font-bold">Riwayat Belajar</h3>
                  {Object.entries(bySubject).map(([subject, items]) => (
                    <Card key={subject}>
                      <CardContent className="p-4">
                        <h4 className="font-semibold text-sm mb-2">{subject}</h4>
                        <div className="space-y-2">
                          {items.slice(0, 5).map((item) => (
                            <div key={item.id} className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">
                                {item.topic || item.type}
                              </span>
                              <span className={`font-semibold ${
                                item.score / item.total >= 0.7 ? 'text-green-600' : 'text-orange-500'
                              }`}>
                                {item.score}/{item.total}
                              </span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-6 text-center">
                    <p className="text-sm text-muted-foreground">
                      Belum ada riwayat belajar. Anak Anda baru mulai menggunakan Kawabel.
                    </p>
                  </CardContent>
                </Card>
              )}

              <button
                onClick={() => {
                  setStudent(null);
                  setProgress([]);
                  setCode('');
                }}
                className="w-full py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted/50 transition-colors"
              >
                Cari Anak Lain
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

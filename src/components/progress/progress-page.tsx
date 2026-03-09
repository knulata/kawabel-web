'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useStudent } from '@/store/use-student';
import { getProgress } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart3, BookOpen, PenLine, GraduationCap } from 'lucide-react';
import type { ProgressEntry } from '@/types';

export function ProgressPage() {
  const { student } = useStudent();
  const [entries, setEntries] = useState<ProgressEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!student) return;
    getProgress(student.id)
      .then((data) => setEntries(data.progress || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [student]);

  const stats = {
    homework: entries.filter((e) => e.type === 'homework'),
    test: entries.filter((e) => e.type === 'test'),
    dictation: entries.filter((e) => e.type === 'dictation'),
  };

  const avgScore = (items: ProgressEntry[]) => {
    if (!items.length) return 0;
    const total = items.reduce((a, e) => a + (e.score / e.total) * 100, 0);
    return Math.round(total / items.length);
  };

  return (
    <div className="px-4 py-6 max-w-lg mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h2 className="text-xl font-bold">📊 Progres Belajar</h2>
        <p className="text-sm text-muted-foreground">
          Perkembangan belajar {student?.name?.split(' ')[0]}
        </p>
      </motion.div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              {
                label: 'PR',
                icon: BookOpen,
                count: stats.homework.length,
                avg: avgScore(stats.homework),
                color: 'text-blue-500',
              },
              {
                label: 'Ujian',
                icon: GraduationCap,
                count: stats.test.length,
                avg: avgScore(stats.test),
                color: 'text-purple-500',
              },
              {
                label: 'Dikte',
                icon: PenLine,
                count: stats.dictation.length,
                avg: avgScore(stats.dictation),
                color: 'text-red-500',
              },
            ].map((item) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card>
                  <CardContent className="p-4 text-center">
                    <item.icon size={24} className={`mx-auto mb-2 ${item.color}`} />
                    <p className="text-2xl font-bold">{item.avg}%</p>
                    <p className="text-xs text-muted-foreground">
                      {item.count}x {item.label}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Recent activity */}
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <BarChart3 size={16} className="text-primary" />
            Aktivitas Terakhir
          </h3>

          {entries.length === 0 ? (
            <div className="text-center py-12">
              <span className="text-4xl mb-3 block">📚</span>
              <p className="text-muted-foreground">
                Belum ada aktivitas. Mulai belajar!
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {entries.slice(0, 20).map((entry, i) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card>
                    <CardContent className="p-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{entry.subject}</p>
                        <p className="text-xs text-muted-foreground">
                          {entry.topic} &middot;{' '}
                          {new Date(entry.created_at).toLocaleDateString('id-ID')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            entry.score / entry.total >= 0.7
                              ? 'default'
                              : 'secondary'
                          }
                          className={
                            entry.score / entry.total >= 0.7
                              ? 'bg-green-600'
                              : ''
                          }
                        >
                          {entry.score}/{entry.total}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

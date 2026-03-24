'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useStudent } from '@/store/use-student';
import { getLeaderboard } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Medal, Award } from 'lucide-react';
import { useT } from '@/store/use-language';
import type { LeaderboardEntry } from '@/types';

const MEDALS = ['🥇', '🥈', '🥉'];

export function LeaderboardPage() {
  const { student } = useStudent();
  const t = useT();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'week' | 'month' | 'all'>('week');

  useEffect(() => {
    setLoading(true);
    getLeaderboard(period)
      .then((data) => setEntries(data.leaderboard || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [period]);

  return (
    <div className="px-4 py-6 max-w-lg mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Trophy size={24} className="text-amber-500" />
          {t('lbTitle')}
        </h2>
        <p className="text-base text-muted-foreground">
          {t('lbSubtitle')}
        </p>
      </motion.div>

      {/* Period tabs */}
      <Tabs
        value={period}
        onValueChange={(v) => setPeriod(v as typeof period)}
        className="mb-6"
      >
        <TabsList className="w-full">
          <TabsTrigger value="week" className="flex-1">
            {t('lbWeek')}
          </TabsTrigger>
          <TabsTrigger value="month" className="flex-1">
            {t('lbMonth')}
          </TabsTrigger>
          <TabsTrigger value="all" className="flex-1">
            {t('lbAll')}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-16">
          <span className="text-5xl mb-3 block">🏆</span>
          <p className="text-muted-foreground">{t('lbNoData')}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map((entry, i) => {
            const isMe = entry.id === student?.id;
            return (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card
                  className={`transition-colors ${
                    isMe ? 'border-primary bg-primary/5' : ''
                  }`}
                >
                  <CardContent className="p-3 flex items-center gap-3">
                    {/* Rank */}
                    <div className="w-8 text-center shrink-0">
                      {i < 3 ? (
                        <span className="text-xl">{MEDALS[i]}</span>
                      ) : (
                        <span className="text-sm font-bold text-muted-foreground">
                          {i + 1}
                        </span>
                      )}
                    </div>

                    {/* Avatar */}
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={entry.avatar_url}
                        alt={entry.name}
                      />
                      <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                        {entry.name?.charAt(0)?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    {/* Name */}
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-base font-medium truncate ${
                          isMe ? 'text-primary' : ''
                        }`}
                      >
                        {entry.name}
                        {isMe && (
                          <span className="text-xs text-muted-foreground ml-1">
                            ({t('lbYou')})
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Level {entry.level}
                      </p>
                    </div>

                    {/* Stars */}
                    <div className="text-right shrink-0">
                      <span className="text-base font-bold">{entry.stars}</span>
                      <span className="text-xs ml-0.5">⭐</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

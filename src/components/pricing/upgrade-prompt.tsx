'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Mascot } from '@/components/mascot';
import { FREE_LIMITS } from '@/lib/constants';
import { Crown, X } from 'lucide-react';

type Feature = keyof typeof FREE_LIMITS;

const FEATURE_LABELS: Record<Feature, string> = {
  chats: 'chat',
  photos: 'foto PR',
  quizzes: 'kuis',
  dictations: 'dikte',
};

interface UpgradePromptProps {
  open: boolean;
  feature: Feature;
  onDismiss: () => void;
}

export function UpgradePrompt({ open, feature, onDismiss }: UpgradePromptProps) {
  const router = useRouter();
  const limit = FREE_LIMITS[feature];
  const label = FEATURE_LABELS[feature];

  const handleUpgrade = useCallback(() => {
    onDismiss();
    router.push('/pricing');
  }, [onDismiss, router]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/30 backdrop-blur-xs"
            onClick={onDismiss}
          />

          {/* Prompt */}
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 z-50 p-4"
          >
            <div className="max-w-md mx-auto bg-background rounded-3xl shadow-2xl ring-1 ring-foreground/10 overflow-hidden">
              {/* Close button */}
              <button
                onClick={onDismiss}
                className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-muted transition-colors text-muted-foreground z-10"
              >
                <X size={18} />
              </button>

              <div className="p-6 text-center space-y-4">
                {/* Mascot */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.1 }}
                >
                  <Mascot size="lg" animate />
                </motion.div>

                {/* Header */}
                <div>
                  <motion.h3
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="text-lg font-bold text-foreground"
                  >
                    Batas harian tercapai!
                  </motion.h3>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-sm text-muted-foreground mt-1"
                  >
                    {limit}/{limit} {label} hari ini sudah digunakan
                  </motion.p>
                </div>

                {/* Usage bar */}
                <motion.div
                  initial={{ opacity: 0, scaleX: 0 }}
                  animate={{ opacity: 1, scaleX: 1 }}
                  transition={{ delay: 0.25 }}
                  className="w-full"
                >
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-red-400 w-full" />
                  </div>
                  <p className="text-xs text-red-500 font-medium mt-1">
                    {limit}/{limit} terpakai
                  </p>
                </motion.div>

                {/* CTA */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="space-y-2"
                >
                  <Button
                    onClick={handleUpgrade}
                    className="w-full h-12 text-base font-bold rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-md gap-2"
                  >
                    <Crown size={18} />
                    Upgrade ke Premium
                  </Button>

                  <button
                    onClick={onDismiss}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Atau tunggu besok
                  </button>
                </motion.div>

                {/* Trial hint */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.35 }}
                  className="text-xs text-muted-foreground"
                >
                  Gratis 7 hari pertama!
                </motion.p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

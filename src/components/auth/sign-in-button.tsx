'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStudent } from '@/store/use-student';
import { loginWithGoogle } from '@/lib/api';
import { LogIn, X, Save, BarChart3, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: Record<string, unknown>) => void;
          renderButton: (el: HTMLElement, config: Record<string, unknown>) => void;
          prompt: () => void;
        };
      };
    };
  }
}

export function SignInButton() {
  const { setStudent } = useStudent();
  const [showPopover, setShowPopover] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const btnContainerRef = useRef<HTMLDivElement>(null);
  const scriptLoadedRef = useRef(false);

  useEffect(() => {
    if (!showPopover || scriptLoadedRef.current) return;

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      scriptLoadedRef.current = true;
      renderGoogleButton();
    };
    document.head.appendChild(script);

    return () => {
      // Don't remove script — it may be needed if popover reopens
    };
  }, [showPopover]);

  useEffect(() => {
    if (showPopover && scriptLoadedRef.current) {
      // Re-render button when popover opens (DOM element is fresh)
      setTimeout(renderGoogleButton, 50);
    }
  }, [showPopover]);

  function renderGoogleButton() {
    if (!window.google) return;
    window.google.accounts.id.initialize({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      callback: handleGoogleResponse,
    });
    const el = document.getElementById('header-google-btn');
    if (el) {
      el.innerHTML = '';
      window.google.accounts.id.renderButton(el, {
        theme: 'outline',
        size: 'large',
        width: 280,
        text: 'signin_with',
        shape: 'pill',
        logo_alignment: 'left',
      });
    }
  }

  async function handleGoogleResponse(response: { credential: string }) {
    setIsSigningIn(true);
    setError(null);
    try {
      const result = await loginWithGoogle(response.credential);
      setStudent(result.student);
      setShowPopover(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login gagal, coba lagi.');
    } finally {
      setIsSigningIn(false);
    }
  }

  return (
    <div className="relative" ref={btnContainerRef}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowPopover(!showPopover)}
        className="gap-1.5 rounded-full text-xs font-semibold"
      >
        <LogIn size={14} />
        <span className="hidden sm:inline">Masuk</span>
      </Button>

      <AnimatePresence>
        {showPopover && (
          <>
            {/* Backdrop for mobile */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/20 sm:hidden"
              onClick={() => setShowPopover(false)}
            />

            <motion.div
              initial={{ opacity: 0, y: -5, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -5, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-2 z-50 w-80 bg-background rounded-2xl shadow-xl border border-border p-5"
            >
              <button
                onClick={() => setShowPopover(false)}
                className="absolute top-3 right-3 p-1 rounded-lg hover:bg-muted text-muted-foreground"
              >
                <X size={14} />
              </button>

              <h3 className="font-bold text-sm mb-3">Masuk untuk menyimpan progres</h3>

              <div className="space-y-2 mb-4">
                {[
                  { icon: <Save size={14} />, text: 'Simpan XP, streak & pencapaian' },
                  { icon: <BarChart3 size={14} />, text: 'Lihat progres belajar lengkap' },
                  { icon: <Trophy size={14} />, text: 'Tampil di papan juara' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="text-primary">{item.icon}</span>
                    {item.text}
                  </div>
                ))}
              </div>

              {error && (
                <div className="mb-3 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-xs text-red-600">
                  {error}
                </div>
              )}

              {isSigningIn ? (
                <div className="flex items-center justify-center gap-2 py-3 text-sm text-muted-foreground">
                  <div className="w-4 h-4 border-2 border-muted-foreground/30 border-t-primary rounded-full animate-spin" />
                  Masuk...
                </div>
              ) : (
                <div id="header-google-btn" className="flex justify-center" />
              )}

              <p className="text-[10px] text-muted-foreground text-center mt-3">
                Tanpa masuk, kamu tetap bisa belajar — tapi progres hanya tersimpan di perangkat ini.
              </p>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

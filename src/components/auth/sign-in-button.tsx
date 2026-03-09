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
      // Merge guest name/grade into the signed-in student if they were set during onboarding
      const current = useStudent.getState().student;
      const merged = { ...result.student };
      if (current?.name && !result.student.name) {
        merged.name = current.name;
      }
      if (current?.grade && current.grade !== 'SD') {
        merged.grade = current.grade;
      }
      setStudent(merged);
      setShowPopover(false);
    } catch (err) {
      // Don't wipe guest student on auth error
      setError(err instanceof Error ? err.message : 'Login gagal, coba lagi.');
    } finally {
      setIsSigningIn(false);
    }
  }

  return (
    <div className="relative" ref={btnContainerRef}>
      <button
        onClick={() => setShowPopover(!showPopover)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-white hover:bg-gray-50 transition-colors shadow-sm text-xs font-medium text-foreground"
      >
        <svg width="16" height="16" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        <span className="hidden sm:inline">Masuk</span>
      </button>

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

              <h3 className="font-bold text-sm mb-3">Masuk untuk menyimpan progress</h3>

              <div className="space-y-2 mb-4">
                {[
                  { icon: <Save size={14} />, text: 'Simpan XP, streak & pencapaian' },
                  { icon: <BarChart3 size={14} />, text: 'Lihat progress belajar lengkap' },
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
                Tanpa masuk, kamu tetap bisa belajar — tapi progress hanya tersimpan di perangkat ini.
              </p>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

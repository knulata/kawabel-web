'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useStudent } from '@/store/use-student';
import { loginWithGoogle } from '@/lib/api';
import { Mascot, MASCOT_NAME } from '@/components/mascot';

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

export function LoginScreen() {
  const { setStudent, setLoading } = useStudent();
  const [error, setError] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);

  useEffect(() => {
    // Load Google Identity Services script
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      window.google?.accounts.id.initialize({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        callback: handleGoogleResponse,
      });
      const btnEl = document.getElementById('google-signin-btn');
      if (btnEl) {
        window.google?.accounts.id.renderButton(btnEl, {
          theme: 'outline',
          size: 'large',
          width: 320,
          text: 'signin_with',
          shape: 'pill',
          logo_alignment: 'left',
        });
      }
    };
    document.head.appendChild(script);
    return () => { script.remove(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleGoogleResponse(response: { credential: string }) {
    setIsSigningIn(true);
    setError(null);
    try {
      const result = await loginWithGoogle(response.credential);
      setStudent(result.student);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login gagal, coba lagi.');
    } finally {
      setIsSigningIn(false);
    }
  }

  return (
    <div className="min-h-dvh kawabel-gradient flex items-center justify-center relative overflow-hidden">
      {/* Floating circles background */}
      <FloatingCircles />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 flex flex-col items-center px-6"
      >
        {/* Owl mascot */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
          className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg"
        >
          <Mascot size="xl" />
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-5 text-4xl font-black text-white tracking-wider"
          style={{ fontFamily: 'var(--font-nunito)' }}
        >
          kawabel
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-1 text-white/70 text-sm tracking-wide"
        >
          kawan belajar
        </motion.p>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-2 text-white/60 text-sm"
        >
          Masuk untuk mulai belajar dengan Kawai
        </motion.p>

        {/* Error message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-6 px-4 py-2.5 rounded-xl bg-red-500/20 border border-yellow-300/30"
          >
            <p className="text-yellow-300 text-sm font-semibold text-center">{error}</p>
          </motion.div>
        )}

        {/* Google Sign-In button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-10"
        >
          {isSigningIn ? (
            <div className="flex items-center gap-3 text-white">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span className="text-sm">Masuk...</span>
            </div>
          ) : (
            <div id="google-signin-btn" />
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}

function FloatingCircles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-white/5"
          style={{
            width: 40 + Math.random() * 60,
            height: 40 + Math.random() * 60,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -20, 0],
            x: [0, 10, 0],
          }}
          transition={{
            duration: 6 + Math.random() * 4,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: Math.random() * 3,
          }}
        />
      ))}
    </div>
  );
}

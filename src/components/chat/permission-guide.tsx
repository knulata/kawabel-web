'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Mic, X, ExternalLink, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

type PermissionType = 'camera' | 'microphone';

interface PermissionGuideProps {
  type: PermissionType;
  onDismiss: () => void;
}

function getBrowser(): 'chrome' | 'safari' | 'firefox' | 'edge' | 'other' {
  if (typeof navigator === 'undefined') return 'other';
  const ua = navigator.userAgent;
  if (ua.includes('Edg/')) return 'edge';
  if (ua.includes('Chrome') && !ua.includes('Edg')) return 'chrome';
  if (ua.includes('Safari') && !ua.includes('Chrome')) return 'safari';
  if (ua.includes('Firefox')) return 'firefox';
  return 'other';
}

function getOS(): 'ios' | 'android' | 'mac' | 'windows' | 'other' {
  if (typeof navigator === 'undefined') return 'other';
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return 'ios';
  if (/Android/.test(ua)) return 'android';
  if (/Mac/.test(ua)) return 'mac';
  if (/Win/.test(ua)) return 'windows';
  return 'other';
}

const ICON_MAP = {
  camera: Camera,
  microphone: Mic,
};

const LABEL_MAP = {
  camera: { id: 'Kamera', en: 'Camera' },
  microphone: { id: 'Mikrofon', en: 'Microphone' },
};

function getSteps(type: PermissionType): { title: string; steps: string[] } {
  const browser = getBrowser();
  const os = getOS();
  const label = LABEL_MAP[type].id;
  const labelEn = LABEL_MAP[type].en;

  // iOS Safari
  if (os === 'ios' && browser === 'safari') {
    return {
      title: `Izinkan ${label} di Safari (iOS)`,
      steps: [
        `Buka Pengaturan (⚙️) di iPhone/iPad`,
        `Scroll ke bawah, ketuk "Safari"`,
        `Ketuk "${labelEn}"`,
        `Pilih "Izinkan" atau "Allow"`,
        `Kembali ke Kawabel dan refresh halaman`,
      ],
    };
  }

  // iOS Chrome
  if (os === 'ios' && browser === 'chrome') {
    return {
      title: `Izinkan ${label} di Chrome (iOS)`,
      steps: [
        `Buka Pengaturan (⚙️) di iPhone/iPad`,
        `Scroll ke bawah, ketuk "Chrome"`,
        `Nyalakan "${labelEn}"`,
        `Kembali ke Kawabel dan refresh halaman`,
      ],
    };
  }

  // Android Chrome
  if (os === 'android') {
    return {
      title: `Izinkan ${label} di Chrome (Android)`,
      steps: [
        `Ketuk ikon 🔒 atau ⓘ di sebelah kiri address bar`,
        `Ketuk "Izin situs" atau "Site settings"`,
        `Cari "${labelEn}" dan ubah ke "Izinkan" / "Allow"`,
        `Refresh halaman`,
      ],
    };
  }

  // Desktop Chrome
  if (browser === 'chrome') {
    return {
      title: `Izinkan ${label} di Chrome`,
      steps: [
        `Klik ikon 🔒 di sebelah kiri address bar (dekat URL)`,
        `Cari "${labelEn}" di daftar izin`,
        `Ubah dari "Blokir" ke "Izinkan"`,
        `Refresh halaman (Ctrl+R / Cmd+R)`,
      ],
    };
  }

  // Desktop Safari (macOS)
  if (browser === 'safari') {
    return {
      title: `Izinkan ${label} di Safari (Mac)`,
      steps: [
        `Klik menu Safari > Settings (atau Preferences)`,
        `Buka tab "Websites"`,
        `Pilih "${labelEn}" di sidebar kiri`,
        `Cari "kawabel.com" dan ubah ke "Allow"`,
        `Refresh halaman`,
      ],
    };
  }

  // Firefox
  if (browser === 'firefox') {
    return {
      title: `Izinkan ${label} di Firefox`,
      steps: [
        `Klik ikon 🔒 di sebelah kiri address bar`,
        `Klik "Connection secure" lalu "More Information"`,
        `Buka tab "Permissions"`,
        `Cari "${labelEn}" dan centang "Allow"`,
        `Refresh halaman`,
      ],
    };
  }

  // Edge
  if (browser === 'edge') {
    return {
      title: `Izinkan ${label} di Edge`,
      steps: [
        `Klik ikon 🔒 di sebelah kiri address bar`,
        `Klik "Permissions for this site"`,
        `Cari "${labelEn}" dan ubah ke "Allow"`,
        `Refresh halaman`,
      ],
    };
  }

  // Generic fallback
  return {
    title: `Izinkan ${label} di browser`,
    steps: [
      `Klik ikon gembok 🔒 di address bar`,
      `Cari pengaturan "${labelEn}"`,
      `Ubah ke "Izinkan" atau "Allow"`,
      `Refresh halaman`,
    ],
  };
}

export function PermissionGuide({ type, onDismiss }: PermissionGuideProps) {
  const Icon = ICON_MAP[type];
  const { title, steps } = getSteps(type);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="bg-card border border-amber-200 rounded-2xl p-5 shadow-lg max-w-sm mx-auto"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
            <Icon size={20} className="text-amber-600" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">{title}</h3>
            <p className="text-xs text-muted-foreground">
              Kawabel butuh izin ini untuk berfungsi
            </p>
          </div>
        </div>
        <button
          onClick={onDismiss}
          className="p-1 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
        >
          <X size={16} />
        </button>
      </div>

      <ol className="space-y-2.5 mb-4">
        {steps.map((step, i) => (
          <motion.li
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex gap-2.5 text-sm"
          >
            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center mt-0.5">
              {i + 1}
            </span>
            <span className="text-foreground leading-snug">{step}</span>
          </motion.li>
        ))}
      </ol>

      {/* Visual hint for lock icon */}
      <div className="bg-muted/50 rounded-xl p-3 mb-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Shield size={14} />
          <span>
            Cari ikon <span className="font-mono bg-muted px-1 rounded">🔒</span> di sebelah kiri URL browser
          </span>
        </div>
        <div className="mt-2 flex items-center gap-1.5 bg-white rounded-lg px-3 py-1.5 border border-border text-xs">
          <span className="text-green-600">🔒</span>
          <span className="text-muted-foreground">kawabel.com</span>
          <span className="ml-auto text-[10px] text-muted-foreground">← ketuk di sini</span>
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={onDismiss}
        >
          Nanti saja
        </Button>
        <Button
          size="sm"
          className="flex-1"
          onClick={() => window.location.reload()}
        >
          Refresh
        </Button>
      </div>
    </motion.div>
  );
}

/**
 * Hook to check and request a browser permission.
 * Returns: 'granted' | 'denied' | 'prompt' | 'unsupported'
 */
export function usePermission(type: PermissionType) {
  const [status, setStatus] = useState<'granted' | 'denied' | 'prompt' | 'unsupported'>('prompt');

  useEffect(() => {
    async function check() {
      // Check via Permissions API first
      if (navigator.permissions) {
        try {
          const name = type === 'camera' ? 'camera' : 'microphone';
          const result = await navigator.permissions.query({ name: name as PermissionName });
          setStatus(result.state === 'granted' ? 'granted' : result.state === 'denied' ? 'denied' : 'prompt');
          result.onchange = () => {
            setStatus(result.state === 'granted' ? 'granted' : result.state === 'denied' ? 'denied' : 'prompt');
          };
          return;
        } catch {
          // Permissions API not supported for this type, fall through
        }
      }
      setStatus('prompt');
    }
    check();
  }, [type]);

  const request = async (): Promise<boolean> => {
    try {
      const constraints = type === 'camera' ? { video: true } : { audio: true };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      // Stop tracks immediately — we just needed permission
      stream.getTracks().forEach((t) => t.stop());
      setStatus('granted');
      return true;
    } catch {
      setStatus('denied');
      return false;
    }
  };

  return { status, request };
}

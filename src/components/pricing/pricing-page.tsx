'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Mascot } from '@/components/mascot';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSubscription } from '@/store/use-subscription';
import { SUBSCRIPTION_PRICE, FIRST_MONTH_PRICE } from '@/lib/constants';
import { PaymentSheet } from '@/components/pricing/payment-sheet';
import {
  Check,
  X,
  MessageCircle,
  Camera,
  Brain,
  PenLine,
  Heart,
  Megaphone,
  BarChart3,
  GraduationCap,
  ChevronDown,
  Crown,
  Sparkles,
  Handshake,
  Zap,
} from 'lucide-react';

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 260, damping: 20 } },
};

interface FeatureRow {
  icon: React.ReactNode;
  label: string;
  free: string;
  premium: string;
  freeCheck: boolean;
  premiumCheck: boolean;
}

const COMPARISON: FeatureRow[] = [
  { icon: <MessageCircle size={16} />, label: 'Chat AI', free: '5/hari', premium: 'Unlimited', freeCheck: true, premiumCheck: true },
  { icon: <Camera size={16} />, label: 'Foto PR', free: '2/hari', premium: 'Unlimited', freeCheck: true, premiumCheck: true },
  { icon: <Brain size={16} />, label: 'Kuis Latihan', free: '2/hari', premium: 'Unlimited', freeCheck: true, premiumCheck: true },
  { icon: <PenLine size={16} />, label: 'Dikte Mandarin', free: '3/hari', premium: 'Unlimited', freeCheck: true, premiumCheck: true },
  { icon: <Heart size={16} />, label: 'Hati (nyawa)', free: '5 hati', premium: 'Unlimited', freeCheck: true, premiumCheck: true },
  { icon: <Megaphone size={16} />, label: 'Tanpa iklan', free: '', premium: '', freeCheck: false, premiumCheck: true },
  { icon: <BarChart3 size={16} />, label: 'Laporan WhatsApp', free: '', premium: '', freeCheck: false, premiumCheck: true },
  { icon: <GraduationCap size={16} />, label: 'Kurikulum lengkap', free: '', premium: '', freeCheck: false, premiumCheck: true },
];

const FAQ_ITEMS = [
  {
    q: 'Apakah ada masa percobaan gratis?',
    a: 'Ya! Semua pengguna baru mendapat 7 hari akses penuh gratis. Tidak perlu kartu kredit.',
  },
  {
    q: 'Bagaimana cara bayar?',
    a: 'Pembayaran melalui transfer bank BCA. Setelah transfer, upload bukti pembayaran dan tim kami akan verifikasi dalam 1x24 jam.',
  },
  {
    q: 'Kenapa bulan pertama lebih murah?',
    a: 'Kami ingin kamu merasakan manfaat Kawabel dulu. Bulan pertama hanya Rp 99.000 supaya kamu bisa coba tanpa risiko. Setelah itu Rp 199.000/bulan.',
  },
  {
    q: 'Apa yang terjadi setelah masa percobaan?',
    a: 'Kamu tetap bisa menggunakan Kawabel dengan batasan harian (5 chat, 2 foto PR, 2 kuis, 3 dikte per hari). Upgrade kapan saja untuk akses unlimited.',
  },
  {
    q: 'Bisa berhenti berlangganan?',
    a: 'Tentu! Langganan tidak diperpanjang otomatis. Setelah masa aktif berakhir, kamu kembali ke paket gratis.',
  },
  {
    q: 'Saya punya bimbel, bisa kerja sama?',
    a: 'Bisa! Kami punya program khusus untuk bimbel dan sekolah dengan harga spesial per siswa. Kunjungi halaman Partner kami untuk info lebih lanjut.',
  },
  {
    q: 'Apa itu Laporan WhatsApp?',
    a: 'Orang tua akan menerima laporan mingguan di WhatsApp tentang progres belajar anak, termasuk mata pelajaran yang dipelajari dan pencapaian.',
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);

  return (
    <motion.div
      className="border-b border-border/50 last:border-0"
      initial={false}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-4 text-left gap-3"
      >
        <span className="text-sm font-medium text-foreground">{q}</span>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="shrink-0"
        >
          <ChevronDown size={16} className="text-muted-foreground" />
        </motion.div>
      </button>
      <motion.div
        initial={false}
        animate={{ height: open ? 'auto' : 0, opacity: open ? 1 : 0 }}
        transition={{ duration: 0.2 }}
        className="overflow-hidden"
      >
        <p className="text-sm text-muted-foreground pb-4">{a}</p>
      </motion.div>
    </motion.div>
  );
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('id-ID').format(price);
}

export function PricingPage() {
  const [showPayment, setShowPayment] = useState(false);
  const { isPremium, plan, trialDaysLeft } = useSubscription();
  const premium = isPremium();
  const daysLeft = trialDaysLeft();

  return (
    <div className="px-4 py-5 pb-24 sm:pb-8 space-y-6 max-w-xl mx-auto">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center pt-2"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
          className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-3xl shadow-lg mb-4"
        >
          <Mascot size="xl" animate />
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="text-2xl font-bold text-foreground"
          style={{ fontFamily: 'var(--font-nunito)' }}
        >
          Belajar Tanpa Batas
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-sm text-muted-foreground mt-1"
        >
          Lebih murah dari 1x makan siang!
        </motion.p>
      </motion.div>

      {/* Plan Cards */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid gap-4"
      >
        {/* Free plan */}
        <motion.div variants={item}>
          <Card className="shadow-sm border-border/50">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles size={18} className="text-muted-foreground" />
                <h3 className="font-bold text-base">Gratis</h3>
              </div>
              <p className="text-2xl font-black text-foreground mb-1">
                Rp 0
                <span className="text-sm font-normal text-muted-foreground">/bulan</span>
              </p>
              <p className="text-xs text-muted-foreground mb-4">Akses dasar dengan batasan harian</p>

              <div className="space-y-2">
                {COMPARISON.map((row, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    {row.freeCheck ? (
                      <Check size={14} className="text-green-500 shrink-0" />
                    ) : (
                      <X size={14} className="text-muted-foreground/40 shrink-0" />
                    )}
                    <span className={row.freeCheck ? 'text-foreground' : 'text-muted-foreground/50'}>
                      {row.label}
                      {row.free && <span className="text-muted-foreground ml-1">({row.free})</span>}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Premium plan */}
        <motion.div variants={item}>
          <Card className="shadow-lg border-2 border-primary/30 relative overflow-visible">
            {/* Badge */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.3 }}
                className="px-3 py-1 rounded-full bg-red-500 text-white text-xs font-bold shadow-md flex items-center gap-1"
              >
                <Zap size={12} />
                Bulan pertama cuma Rp 99rb!
              </motion.div>
            </div>

            <CardContent className="p-5 pt-6">
              <div className="flex items-center gap-2 mb-1">
                <Crown size={18} className="text-amber-500" />
                <h3 className="font-bold text-base">Premium</h3>
                {premium && (
                  <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">
                    Aktif
                  </span>
                )}
              </div>

              {/* Price with promo */}
              <div className="mb-1">
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-black text-foreground">
                    Rp {formatPrice(FIRST_MONTH_PRICE)}
                  </p>
                  <span className="text-sm text-muted-foreground line-through">
                    Rp {formatPrice(SUBSCRIPTION_PRICE)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  bulan pertama, lalu Rp {formatPrice(SUBSCRIPTION_PRICE)}/bulan
                </p>
              </div>

              <p className="text-xs text-muted-foreground mb-4">Akses penuh tanpa batas</p>

              <div className="space-y-2">
                {COMPARISON.map((row, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <Check size={14} className="text-green-500 shrink-0" />
                    <span className="text-foreground">
                      {row.label}
                      {row.premium && <span className="text-primary font-medium ml-1">({row.premium})</span>}
                    </span>
                  </div>
                ))}
              </div>

              {/* CTA Button */}
              <motion.div className="mt-5">
                {premium ? (
                  <div className="text-center">
                    <p className="text-sm text-green-600 font-medium">
                      {plan === 'trial'
                        ? `Masa percobaan: ${daysLeft} hari tersisa`
                        : 'Langganan aktif'}
                    </p>
                  </div>
                ) : (
                  <>
                    <Button
                      onClick={() => setShowPayment(true)}
                      className="w-full h-12 text-base font-bold rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-md"
                    >
                      <Crown size={18} className="mr-2" />
                      Mulai Rp {formatPrice(FIRST_MONTH_PRICE)}/bulan
                    </Button>
                    <p className="text-center text-xs text-muted-foreground mt-2">
                      + gratis 7 hari pertama!
                    </p>
                  </>
                )}
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Social proof */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-4 border border-green-100"
      >
        <p className="text-sm text-green-800 font-medium text-center">
          Lebih hemat dari les privat (Rp 200rb/pertemuan). Kawabel siap bantu 24/7 kapan saja.
        </p>
      </motion.div>

      {/* Partner CTA */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        <Link href="/partner">
          <Card className="shadow-sm border-blue-200/50 bg-gradient-to-r from-blue-50 to-indigo-50 card-hover">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                <Handshake size={20} className="text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-blue-900">Punya bimbel atau sekolah?</p>
                <p className="text-xs text-blue-700">Daftar sebagai Partner — harga spesial per siswa</p>
              </div>
              <ChevronDown size={16} className="text-blue-400 -rotate-90 shrink-0" />
            </CardContent>
          </Card>
        </Link>
      </motion.div>

      {/* FAQ */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Pertanyaan Umum
        </h3>
        <Card className="shadow-sm">
          <CardContent className="px-4 py-1">
            {FAQ_ITEMS.map((faq, i) => (
              <FAQItem key={i} q={faq.q} a={faq.a} />
            ))}
          </CardContent>
        </Card>
      </motion.div>

      {/* Payment Sheet */}
      <PaymentSheet open={showPayment} onOpenChange={setShowPayment} />
    </div>
  );
}

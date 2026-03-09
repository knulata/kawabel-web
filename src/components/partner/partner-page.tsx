'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Mascot, MASCOT_NAME } from '@/components/mascot';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { WHATSAPP_ADMIN } from '@/lib/constants';
import {
  GraduationCap,
  Users,
  BarChart3,
  Clock,
  Wallet,
  Shield,
  MessageCircle,
  ChevronDown,
  ArrowLeft,
  Check,
  School,
  BookOpen,
  Headphones,
} from 'lucide-react';
import { useState } from 'react';

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 260, damping: 20 } },
};

const BENEFITS = [
  {
    icon: <Users size={22} />,
    title: 'Harga Spesial per Siswa',
    desc: 'Mulai dari Rp 59.000/siswa/bulan untuk paket 30+ siswa. Semakin banyak siswa, semakin hemat.',
    gradient: 'from-blue-400 to-blue-600',
  },
  {
    icon: <Clock size={22} />,
    title: 'Bantuan PR 24/7',
    desc: 'Siswa bisa belajar kapan saja di rumah. Kawabel siap bantu mengerjakan PR dan memahami pelajaran.',
    gradient: 'from-green-400 to-emerald-600',
  },
  {
    icon: <BarChart3 size={22} />,
    title: 'Dashboard & Laporan',
    desc: 'Pantau progress setiap siswa. Lihat mata pelajaran yang dikuasai dan yang perlu ditingkatkan.',
    gradient: 'from-purple-400 to-purple-600',
  },
  {
    icon: <GraduationCap size={22} />,
    title: 'Sesuai Kurikulum',
    desc: 'Konten yang disesuaikan dengan Kurikulum Merdeka dan buku-buku teks yang dipakai di bimbel Anda.',
    gradient: 'from-amber-400 to-orange-500',
  },
  {
    icon: <Wallet size={22} />,
    title: 'Tambah Pendapatan',
    desc: 'Tawarkan Kawabel sebagai layanan tambahan. Siswa belajar lebih efektif, orang tua lebih puas.',
    gradient: 'from-red-400 to-rose-600',
  },
  {
    icon: <Shield size={22} />,
    title: 'Aman untuk Anak',
    desc: 'Tidak ada iklan, tidak ada konten dewasa. AI yang dirancang khusus untuk pelajar Indonesia.',
    gradient: 'from-teal-400 to-teal-600',
  },
];

const PRICING_TIERS = [
  { students: '1-10 siswa', price: 'Rp 99.000', per: '/siswa/bulan' },
  { students: '11-30 siswa', price: 'Rp 79.000', per: '/siswa/bulan', popular: true },
  { students: '31-100 siswa', price: 'Rp 59.000', per: '/siswa/bulan' },
  { students: '100+ siswa', price: 'Hubungi kami', per: '' },
];

const FAQ_ITEMS = [
  {
    q: 'Siapa yang bisa jadi Partner?',
    a: 'Bimbel (bimbingan belajar), kursus, les privat, sekolah, atau lembaga pendidikan lainnya. Baik yang sudah punya banyak siswa maupun yang baru mulai.',
  },
  {
    q: 'Bagaimana cara kerjanya?',
    a: 'Anda mendaftar sebagai Partner, kami buatkan akun untuk setiap siswa Anda. Siswa bisa akses Kawabel dari HP atau laptop masing-masing. Anda bisa memantau progress semua siswa dari dashboard.',
  },
  {
    q: 'Apakah ada kontrak atau ikatan?',
    a: 'Tidak ada kontrak jangka panjang. Pembayaran bulanan, bisa berhenti kapan saja. Kami yakin Anda akan tetap menggunakan Kawabel karena manfaatnya.',
  },
  {
    q: 'Bisa di-branding dengan nama bimbel saya?',
    a: 'Ya! Untuk paket 50+ siswa, kami bisa menampilkan logo bimbel Anda di dalam aplikasi (white-label ringan).',
  },
  {
    q: 'Bagaimana dengan pembayaran?',
    a: 'Transfer bank bulanan. Kami kirim tagihan di awal bulan dan Anda transfer sesuai jumlah siswa aktif.',
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);

  return (
    <motion.div className="border-b border-border/50 last:border-0" initial={false}>
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

function buildWhatsAppURL() {
  const message = encodeURIComponent(
    'Halo, saya tertarik menjadi Partner Kawabel untuk bimbel/sekolah saya. Mohon info lebih lanjut.',
  );
  return `https://wa.me/${WHATSAPP_ADMIN}?text=${message}`;
}

export function PartnerPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Sticky header */}
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={18} />
            <span className="text-sm font-medium">Kembali</span>
          </Link>
          <div className="flex items-center gap-2">
            <Mascot size="xs" />
            <span className="text-sm font-bold" style={{ fontFamily: 'var(--font-nunito)' }}>
              kawabel
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-10">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
            className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-3xl shadow-lg mb-5"
          >
            <Mascot size="xl" animate />
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold mb-4"
          >
            <School size={12} />
            Program Partner Kawabel
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-3xl font-bold text-foreground leading-tight"
            style={{ fontFamily: 'var(--font-nunito)' }}
          >
            Bawa AI Tutor ke
            <br />
            <span className="kawabel-gradient bg-clip-text text-transparent">
              Bimbel & Sekolah Anda
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
            className="text-base text-muted-foreground mt-3 max-w-md mx-auto"
          >
            Berikan siswa Anda teman belajar AI 24/7 yang membantu PR, latihan ujian, dan dikte Mandarin — langsung dari HP mereka.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-6"
          >
            <a href={buildWhatsAppURL()} target="_blank" rel="noopener noreferrer">
              <Button className="h-13 px-8 text-base font-bold rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg gap-2">
                <MessageCircle size={20} />
                Hubungi via WhatsApp
              </Button>
            </a>
          </motion.div>
        </motion.div>

        {/* How it works */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
        >
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 text-center">
            Bagaimana cara kerjanya?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { num: 1, icon: <MessageCircle size={20} />, title: 'Hubungi Kami', desc: 'Chat via WhatsApp untuk diskusi kebutuhan bimbel Anda' },
              { num: 2, icon: <BookOpen size={20} />, title: 'Setup Akun', desc: 'Kami buatkan akun Kawabel untuk setiap siswa Anda' },
              { num: 3, icon: <Headphones size={20} />, title: 'Siswa Belajar', desc: 'Siswa langsung bisa belajar dari HP, Anda pantau dari dashboard' },
            ].map((step) => (
              <Card key={step.num} className="shadow-sm">
                <CardContent className="p-5 text-center">
                  <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-3 text-sm font-bold">
                    {step.num}
                  </div>
                  <h3 className="font-semibold text-sm mb-1">{step.title}</h3>
                  <p className="text-xs text-muted-foreground">{step.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* Benefits grid */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 text-center">
            Keuntungan menjadi Partner
          </h2>
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 sm:grid-cols-2 gap-3"
          >
            {BENEFITS.map((benefit) => (
              <motion.div key={benefit.title} variants={item}>
                <Card className="shadow-sm h-full">
                  <CardContent className="p-4 flex gap-3">
                    <div
                      className={`w-11 h-11 rounded-xl bg-gradient-to-br ${benefit.gradient} flex items-center justify-center text-white shrink-0 shadow-sm`}
                    >
                      {benefit.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">{benefit.title}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{benefit.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Pricing tiers */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 text-center">
            Harga Partner
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {PRICING_TIERS.map((tier) => (
              <Card
                key={tier.students}
                className={`shadow-sm ${tier.popular ? 'border-2 border-primary/30 relative' : ''}`}
              >
                {tier.popular && (
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                    <span className="px-2 py-0.5 rounded-full bg-primary text-white text-[10px] font-bold">
                      Populer
                    </span>
                  </div>
                )}
                <CardContent className="p-4 text-center">
                  <p className="text-xs text-muted-foreground mb-2">{tier.students}</p>
                  <p className="text-lg font-black text-foreground">{tier.price}</p>
                  <p className="text-xs text-muted-foreground">{tier.per}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <p className="text-xs text-muted-foreground text-center mt-3">
            Semua harga belum termasuk PPN. Diskon tambahan untuk kontrak tahunan.
          </p>
        </motion.div>

        {/* Use cases */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100"
        >
          <h3 className="font-bold text-base text-green-900 mb-3">Cocok untuk:</h3>
          <div className="space-y-2.5">
            {[
              'Bimbingan belajar (bimbel) — tambahkan AI tutor sebagai layanan ekstra',
              'Kursus Bahasa Mandarin — fitur dikte 听写 otomatis dari buku',
              'Les privat — siswa bisa belajar mandiri di antara jadwal les',
              'Sekolah swasta — lengkapi kurikulum dengan bantuan AI',
              'Home schooling community — alat bantu belajar untuk anak',
            ].map((useCase, i) => (
              <div key={i} className="flex items-start gap-2">
                <Check size={16} className="text-green-600 shrink-0 mt-0.5" />
                <p className="text-sm text-green-800">{useCase}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* FAQ */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Pertanyaan Umum
          </h2>
          <Card className="shadow-sm">
            <CardContent className="px-4 py-1">
              {FAQ_ITEMS.map((faq, i) => (
                <FAQItem key={i} q={faq.q} a={faq.a} />
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center pb-8"
        >
          <Mascot size="lg" className="mx-auto mb-3" />
          <h3 className="text-lg font-bold">Siap bermitra dengan {MASCOT_NAME}?</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-5">
            Hubungi kami sekarang — konsultasi gratis, tanpa kewajiban.
          </p>
          <a href={buildWhatsAppURL()} target="_blank" rel="noopener noreferrer">
            <Button className="h-13 px-8 text-base font-bold rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg gap-2">
              <MessageCircle size={20} />
              Chat WhatsApp Sekarang
            </Button>
          </a>
        </motion.div>
      </div>
    </div>
  );
}

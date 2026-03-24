'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Mascot } from '@/components/mascot';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSubscription } from '@/store/use-subscription';
import { SUBSCRIPTION_PRICE } from '@/lib/constants';
import { PaymentSheet } from '@/components/pricing/payment-sheet';
import { useT } from '@/store/use-language';
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
  Ticket,
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
  labelKey: string;
  free: string;
  premium: string;
  freeCheck: boolean;
  premiumCheck: boolean;
}

const COMPARISON: FeatureRow[] = [
  { icon: <MessageCircle size={16} />, labelKey: 'featureChat', free: '5/day', premium: 'unlimited', freeCheck: true, premiumCheck: true },
  { icon: <Camera size={16} />, labelKey: 'featurePhoto', free: '2/day', premium: 'unlimited', freeCheck: true, premiumCheck: true },
  { icon: <Brain size={16} />, labelKey: 'featureQuiz', free: '2/day', premium: 'unlimited', freeCheck: true, premiumCheck: true },
  { icon: <PenLine size={16} />, labelKey: 'featureDictation', free: '3/day', premium: 'unlimited', freeCheck: true, premiumCheck: true },
  { icon: <Heart size={16} />, labelKey: 'featureHearts', free: '5', premium: 'unlimited', freeCheck: true, premiumCheck: true },
  { icon: <Megaphone size={16} />, labelKey: 'featureNoAds', free: '', premium: '', freeCheck: false, premiumCheck: true },
  { icon: <BarChart3 size={16} />, labelKey: 'featureWhatsApp', free: '', premium: '', freeCheck: false, premiumCheck: true },
  { icon: <GraduationCap size={16} />, labelKey: 'featureCurriculum', free: '', premium: '', freeCheck: false, premiumCheck: true },
];

const FREE_LIMITS_DISPLAY: Record<string, { id: string; en: string }> = {
  '5/day': { id: '5/hari', en: '5/day' },
  '2/day': { id: '2/hari', en: '2/day' },
  '3/day': { id: '3/hari', en: '3/day' },
  '5': { id: '5 hati', en: '5 hearts' },
};

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

function VoucherRedeem() {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState('');
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const { redeemVoucher } = useSubscription();
  const t = useT();

  const handleRedeem = () => {
    if (!code.trim()) return;
    setLoading(true);
    // Small delay for UX
    setTimeout(() => {
      const res = redeemVoucher(code);
      setResult(res);
      setLoading(false);
      if (res.success) setCode('');
    }, 500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.32 }}
    >
      <Card className="shadow-sm border-amber-200/50 bg-gradient-to-r from-amber-50 to-yellow-50">
        <CardContent className="p-4">
          <button
            onClick={() => { setOpen(!open); setResult(null); }}
            className="w-full flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
              <Ticket size={20} className="text-amber-600" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold text-amber-900">{t('priceVoucher')}</p>
              <p className="text-xs text-amber-700">{t('priceVoucherDesc')}</p>
            </div>
            <motion.div
              animate={{ rotate: open ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="shrink-0"
            >
              <ChevronDown size={16} className="text-amber-400" />
            </motion.div>
          </button>

          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="pt-4 space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={code}
                      onChange={(e) => { setCode(e.target.value.toUpperCase()); setResult(null); }}
                      placeholder="KAWABEL-XXXX-XX"
                      className="flex-1 h-11 px-3 rounded-xl border border-amber-200 bg-white text-sm font-mono uppercase placeholder:text-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                    <Button
                      onClick={handleRedeem}
                      disabled={!code.trim() || loading}
                      className="h-11 px-5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold"
                    >
                      {loading ? '...' : t('priceVoucherUse')}
                    </Button>
                  </div>

                  {result && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex items-start gap-2 text-sm p-3 rounded-xl ${
                        result.success
                          ? 'bg-green-50 text-green-700 border border-green-200'
                          : 'bg-red-50 text-red-700 border border-red-200'
                      }`}
                    >
                      {result.success ? <Check size={16} className="shrink-0 mt-0.5" /> : <X size={16} className="shrink-0 mt-0.5" />}
                      <span>{result.message}</span>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function PricingPage() {
  const [showPayment, setShowPayment] = useState(false);
  const { isPremium, plan, trialDaysLeft } = useSubscription();
  const premium = isPremium();
  const daysLeft = trialDaysLeft();
  const t = useT();
  const isEn = t('greeting') === 'Hello';

  const faqItems = Array.from({ length: 7 }, (_, i) => ({
    q: t(`priceFaqQ${i + 1}` as never),
    a: t(`priceFaqA${i + 1}` as never),
  }));

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
          {t('priceTitle')}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-sm text-muted-foreground mt-1"
        >
          {t('priceSubtitle')}
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
                <h3 className="font-bold text-base">{t('priceFree')}</h3>
              </div>
              <p className="text-2xl font-black text-foreground mb-1">
                Rp 0
                <span className="text-sm font-normal text-muted-foreground">/{t('priceMonth')}</span>
              </p>
              <p className="text-xs text-muted-foreground mb-4">{t('priceFreeDesc')}</p>

              <div className="space-y-2">
                {COMPARISON.map((row, i) => {
                  const freeDisplay = row.free
                    ? (FREE_LIMITS_DISPLAY[row.free]
                        ? (isEn ? FREE_LIMITS_DISPLAY[row.free].en : FREE_LIMITS_DISPLAY[row.free].id)
                        : row.free)
                    : '';
                  return (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      {row.freeCheck ? (
                        <Check size={14} className="text-green-500 shrink-0" />
                      ) : (
                        <X size={14} className="text-muted-foreground/40 shrink-0" />
                      )}
                      <span className={row.freeCheck ? 'text-foreground' : 'text-muted-foreground/50'}>
                        {t(row.labelKey as never)}
                        {freeDisplay && <span className="text-muted-foreground ml-1">({freeDisplay})</span>}
                      </span>
                    </div>
                  );
                })}
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
                {t('pricePerStudent')} / {t('priceMonth')}
              </motion.div>
            </div>

            <CardContent className="p-5 pt-6">
              <div className="flex items-center gap-2 mb-1">
                <Crown size={18} className="text-amber-500" />
                <h3 className="font-bold text-base">{t('pricePremium')}</h3>
                {premium && (
                  <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">
                    {t('priceActive')}
                  </span>
                )}
              </div>

              {/* Price */}
              <div className="mb-1">
                <p className="text-2xl font-black text-foreground">
                  Rp {formatPrice(SUBSCRIPTION_PRICE)}
                  <span className="text-sm font-normal text-muted-foreground">/{t('priceMonth')} {t('pricePerStudent')}</span>
                </p>
              </div>

              <p className="text-xs text-muted-foreground mb-4">{t('priceFullAccess')}</p>

              <div className="space-y-2">
                {COMPARISON.map((row, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <Check size={14} className="text-green-500 shrink-0" />
                    <span className="text-foreground">
                      {t(row.labelKey as never)}
                      {row.premium && <span className="text-primary font-medium ml-1">({t('unlimited')})</span>}
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
                        ? `${daysLeft} ${t('priceTrialDays')}`
                        : t('priceActiveSub')}
                    </p>
                  </div>
                ) : (
                  <>
                    <Button
                      onClick={() => setShowPayment(true)}
                      className="w-full h-12 text-base font-bold rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-md"
                    >
                      <Crown size={18} className="mr-2" />
                      {t('priceSubscribe')} Rp {formatPrice(SUBSCRIPTION_PRICE)}/{t('priceMonth')}
                    </Button>
                    <p className="text-center text-xs text-muted-foreground mt-2">
                      {t('priceFreeTrial')}
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
          {t('priceSocial')}
        </p>
      </motion.div>

      {/* Voucher Redemption */}
      <VoucherRedeem />

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
                <p className="text-sm font-semibold text-blue-900">{t('pricePartner')}</p>
                <p className="text-xs text-blue-700">{t('pricePartnerDesc')}</p>
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
          {t('priceFAQ')}
        </h3>
        <Card className="shadow-sm">
          <CardContent className="px-4 py-1">
            {faqItems.map((faq, i) => (
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

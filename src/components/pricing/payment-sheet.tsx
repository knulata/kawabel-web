'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Mascot } from '@/components/mascot';
import { useSubscription } from '@/store/use-subscription';
import { SUBSCRIPTION_PRICE, BCA_ACCOUNT, BCA_NAME } from '@/lib/constants';
import {
  Copy,
  Check,
  Upload,
  Clock,
  Building2,
  CreditCard,
  User,
  Banknote,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';

function formatPrice(price: number): string {
  return new Intl.NumberFormat('id-ID').format(price);
}

type Step = 'details' | 'upload' | 'confirmation';

interface PaymentSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PaymentSheet({ open, onOpenChange }: PaymentSheetProps) {
  const [step, setStep] = useState<Step>('details');
  const [copied, setCopied] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { startTrial, setPaymentPending, plan } = useSubscription();

  const handleCopyAccount = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(BCA_ACCOUNT);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select text
      const el = document.createElement('textarea');
      el.value = BCA_ACCOUNT;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, []);

  const handleUpload = useCallback(() => {
    // Simulate upload — in production this would upload to a storage service
    setUploading(true);
    setTimeout(() => {
      setUploading(false);
      setPaymentPending(true);
      // Start trial immediately upon payment submission
      if (plan === 'free') {
        startTrial();
      }
      setStep('confirmation');
    }, 1500);
  }, [plan, setPaymentPending, startTrial]);

  const handleClose = useCallback(() => {
    onOpenChange(false);
    // Reset step after animation
    setTimeout(() => setStep('details'), 300);
  }, [onOpenChange]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[85dvh] overflow-y-auto">
        <SheetHeader className="pb-2">
          <SheetTitle className="text-center">
            {step === 'details' && 'Detail Pembayaran'}
            {step === 'upload' && 'Upload Bukti Transfer'}
            {step === 'confirmation' && 'Terima Kasih!'}
          </SheetTitle>
          <SheetDescription className="text-center">
            {step === 'details' && 'Transfer ke rekening berikut'}
            {step === 'upload' && 'Kirim screenshot bukti transfer'}
            {step === 'confirmation' && 'Pembayaran sedang diverifikasi'}
          </SheetDescription>
        </SheetHeader>

        <div className="px-4 pb-6">
          <AnimatePresence mode="wait">
            {/* Step 1: Bank Details */}
            {step === 'details' && (
              <motion.div
                key="details"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                {/* Step indicator */}
                <div className="flex items-center justify-center gap-2 py-2">
                  <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">1</div>
                  <div className="w-8 h-0.5 bg-muted" />
                  <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-xs font-bold">2</div>
                  <div className="w-8 h-0.5 bg-muted" />
                  <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-xs font-bold">3</div>
                </div>

                {/* Bank details card */}
                <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100/50 p-4 space-y-3 border border-blue-200/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
                      <Building2 size={20} className="text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Bank</p>
                      <p className="font-bold text-foreground">BCA</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center">
                      <CreditCard size={20} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">No. Rekening</p>
                      <p className="font-bold text-foreground font-mono text-lg tracking-wider">
                        {BCA_ACCOUNT}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyAccount}
                      className="shrink-0 gap-1"
                    >
                      {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                      {copied ? 'Tersalin' : 'Salin'}
                    </Button>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-400 flex items-center justify-center">
                      <User size={20} className="text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Atas Nama</p>
                      <p className="font-bold text-foreground">{BCA_NAME}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-300 flex items-center justify-center">
                      <Banknote size={20} className="text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Jumlah Transfer</p>
                      <p className="font-bold text-foreground text-lg">
                        Rp {formatPrice(SUBSCRIPTION_PRICE)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        per bulan per siswa
                      </p>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={() => setStep('upload')}
                  className="w-full h-11 rounded-xl font-bold gap-2"
                >
                  Sudah Transfer
                  <ArrowRight size={16} />
                </Button>
              </motion.div>
            )}

            {/* Step 2: Upload proof */}
            {step === 'upload' && (
              <motion.div
                key="upload"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                {/* Step indicator */}
                <div className="flex items-center justify-center gap-2 py-2">
                  <div className="w-8 h-8 rounded-full bg-primary/30 text-primary flex items-center justify-center text-xs font-bold">
                    <Check size={14} />
                  </div>
                  <div className="w-8 h-0.5 bg-primary/30" />
                  <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">2</div>
                  <div className="w-8 h-0.5 bg-muted" />
                  <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-xs font-bold">3</div>
                </div>

                {/* Upload area */}
                <label
                  className="flex flex-col items-center justify-center gap-3 p-8 rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 cursor-pointer hover:border-primary/50 transition-colors"
                >
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <Upload size={24} className="text-primary" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-foreground">
                      Tap untuk upload bukti transfer
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Screenshot atau foto bukti transfer
                    </p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleUpload}
                  />
                </label>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setStep('details')}
                    className="flex-1 h-11 rounded-xl"
                  >
                    Kembali
                  </Button>
                  <Button
                    onClick={handleUpload}
                    disabled={uploading}
                    className="flex-1 h-11 rounded-xl font-bold gap-2"
                  >
                    {uploading ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                        >
                          <Clock size={16} />
                        </motion.div>
                        Mengirim...
                      </>
                    ) : (
                      <>
                        Kirim Bukti
                        <ArrowRight size={16} />
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Confirmation */}
            {step === 'confirmation' && (
              <motion.div
                key="confirmation"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-4 py-4"
              >
                {/* Step indicator */}
                <div className="flex items-center justify-center gap-2 py-2">
                  <div className="w-8 h-8 rounded-full bg-primary/30 text-primary flex items-center justify-center text-xs font-bold">
                    <Check size={14} />
                  </div>
                  <div className="w-8 h-0.5 bg-primary/30" />
                  <div className="w-8 h-8 rounded-full bg-primary/30 text-primary flex items-center justify-center text-xs font-bold">
                    <Check size={14} />
                  </div>
                  <div className="w-8 h-0.5 bg-primary/30" />
                  <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">
                    <Check size={14} />
                  </div>
                </div>

                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.2 }}
                  className="inline-flex items-center justify-center w-20 h-20 bg-green-50 rounded-full"
                >
                  <CheckCircle2 size={40} className="text-green-500" />
                </motion.div>

                <div>
                  <h3 className="text-lg font-bold text-foreground">
                    Pembayaran Sedang Diverifikasi
                  </h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    Tim kami akan memverifikasi pembayaran dalam 1x24 jam.
                    Sementara itu, kamu bisa menikmati akses penuh gratis selama 7 hari!
                  </p>
                </div>

                <div className="flex items-center justify-center gap-2 pt-2">
                  <Mascot size="sm" animate />
                  <p className="text-sm font-medium text-primary">Selamat belajar!</p>
                </div>

                <Button
                  onClick={handleClose}
                  className="w-full h-11 rounded-xl font-bold"
                >
                  Mulai Belajar
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </SheetContent>
    </Sheet>
  );
}

'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChat } from '@/store/use-chat';
import { useStudent } from '@/store/use-student';
import { useGamification } from '@/store/use-gamification';
import { playTap } from '@/lib/sounds';
import { hapticLight } from '@/lib/haptics';
import { Camera, Mic, Send, ArrowDown, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ChatBubble } from '@/components/chat/chat-bubble';
import { PermissionGuide, usePermission } from '@/components/chat/permission-guide';
import { Mascot, MASCOT_NAME } from '@/components/mascot';
import { useSubscription } from '@/store/use-subscription';
import { UpgradePrompt } from '@/components/pricing/upgrade-prompt';

export function ChatPage() {
  const { student } = useStudent();
  const { messages, isLoading, error, sendMessage, clearMessages } = useChat();
  const { addXP, earnAchievement } = useGamification();
  const { canUse, incrementUsage } = useSubscription();
  const [showUpgrade, setShowUpgrade] = useState<'chats' | 'photos' | null>(null);
  const [input, setInput] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [showPermGuide, setShowPermGuide] = useState<'camera' | 'microphone' | null>(null);
  const [isListening, setIsListening] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const cameraPerm = usePermission('camera');
  const micPerm = usePermission('microphone');

  const scrollToBottom = useCallback(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    setShowScrollBtn(scrollHeight - scrollTop - clientHeight > 100);
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text && !imagePreview) return;
    // Check usage limits
    if (!canUse('chats')) {
      setShowUpgrade('chats');
      return;
    }

    setInput('');
    const img = imagePreview;
    setImagePreview(null);

    playTap();
    hapticLight();
    incrementUsage('chats');
    await sendMessage(text || 'Tolong bantu soal ini', student?.id ?? 0, img || undefined);
    addXP(5); // XP for asking questions
    earnAchievement('FIRST_LESSON');

    // Time-based achievements
    const hour = new Date().getHours();
    if (hour < 7) earnAchievement('EARLY_BIRD');
    if (hour >= 22) earnAchievement('NIGHT_OWL');

    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCameraClick = async () => {
    if (cameraPerm.status === 'denied') {
      setShowPermGuide('camera');
      return;
    }
    if (cameraPerm.status === 'prompt') {
      const granted = await cameraPerm.request();
      if (!granted) {
        setShowPermGuide('camera');
        return;
      }
    }
    // Check photo usage limits
    if (!canUse('photos')) {
      setShowUpgrade('photos');
      return;
    }
    fileInputRef.current?.click();
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    incrementUsage('photos');
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleVoiceClick = async () => {
    // Already listening — stop
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    // Check browser support
    const SpeechRecognition = (window as unknown as Record<string, unknown>).SpeechRecognition ||
      (window as unknown as Record<string, unknown>).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setShowPermGuide('microphone');
      return;
    }

    // Check permission
    if (micPerm.status === 'denied') {
      setShowPermGuide('microphone');
      return;
    }
    if (micPerm.status === 'prompt') {
      const granted = await micPerm.request();
      if (!granted) {
        setShowPermGuide('microphone');
        return;
      }
    }

    const recognition = new (SpeechRecognition as new () => SpeechRecognition)();
    recognition.lang = 'id-ID';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      setInput((prev) => (prev ? prev + ' ' + transcript : transcript));
      setIsListening(false);
    };

    recognition.onerror = () => {
      setIsListening(false);
      if (micPerm.status !== 'granted') {
        setShowPermGuide('microphone');
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
    hapticLight();
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-7.5rem)] sm:h-[calc(100dvh-3.5rem)]">
      {/* Chat header — only show clear button when there are messages */}
      {messages.length > 0 && (
        <div className="px-4 py-2 border-b border-border/50 flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={clearMessages}
            className="text-muted-foreground"
          >
            <Trash2 size={16} className="mr-1" />
            Hapus
          </Button>
        </div>
      )}

      {/* Messages */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-3 scrollbar-hide"
      >
        {messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center h-full text-center"
          >
            <Mascot size="2xl" className="mb-4" />
            <h3 className="text-xl font-semibold text-foreground">
              Ada PR atau soal yang susah?
            </h3>
            <p className="text-base text-muted-foreground mt-1 max-w-xs">
              Ketik pertanyaan atau foto soalmu — aku bantu jelaskan langkah demi langkah!
            </p>
            <div className="flex flex-wrap gap-2 mt-6 justify-center">
              {['Bantu PR Matematika', 'Jelaskan fotosintesis', 'Latihan soal'].map(
                (suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => {
                      setInput(suggestion);
                      textareaRef.current?.focus();
                    }}
                    className="px-3 py-1.5 rounded-full border border-border text-sm text-muted-foreground hover:bg-muted transition-colors"
                  >
                    {suggestion}
                  </button>
                )
              )}
            </div>
          </motion.div>
        )}

        <AnimatePresence mode="popLayout">
          {messages.map((msg, i) => (
            <ChatBubble key={i} message={msg} />
          ))}
        </AnimatePresence>

        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 text-sm text-muted-foreground"
          >
            <Mascot size="sm" />
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" />
              <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce [animation-delay:0.15s]" />
              <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce [animation-delay:0.3s]" />
            </div>
          </motion.div>
        )}

        {error && (
          <div className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
            {error}
          </div>
        )}
      </div>

      {/* Scroll to bottom FAB */}
      <AnimatePresence>
        {showScrollBtn && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={scrollToBottom}
            className="absolute bottom-24 right-4 w-9 h-9 rounded-full bg-card shadow-lg border border-border flex items-center justify-center z-20"
          >
            <ArrowDown size={16} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Image preview */}
      <AnimatePresence>
        {imagePreview && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 pt-2"
          >
            <div className="relative inline-block">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-20 h-20 object-cover rounded-xl border border-border"
              />
              <button
                onClick={() => setImagePreview(null)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive text-white text-xs flex items-center justify-center"
              >
                &times;
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Permission guide */}
      <AnimatePresence>
        {showPermGuide && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="px-4 py-2"
          >
            <PermissionGuide
              type={showPermGuide}
              onDismiss={() => setShowPermGuide(null)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input bar */}
      <div className="px-4 py-3 border-t border-border/50 glass">
        <div className="flex items-end gap-2 max-w-3xl mx-auto">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleImageSelect}
            className="hidden"
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCameraClick}
            className="shrink-0 text-muted-foreground"
          >
            <Camera size={20} />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleVoiceClick}
            className={`shrink-0 ${isListening ? 'text-red-500 animate-pulse' : 'text-muted-foreground'}`}
          >
            <Mic size={20} />
          </Button>

          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isListening ? 'Mendengarkan...' : 'Ketik pertanyaanmu...'}
            className="min-h-[40px] max-h-32 resize-none rounded-2xl bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary"
            rows={1}
          />

          <Button
            size="icon"
            onClick={handleSend}
            disabled={isLoading || (!input.trim() && !imagePreview)}
            className="shrink-0 rounded-full bg-primary hover:bg-primary/90"
          >
            <Send size={18} />
          </Button>
        </div>
      </div>
      {/* Upgrade prompt */}
      <UpgradePrompt
        open={showUpgrade !== null}
        feature={showUpgrade || 'chats'}
        onDismiss={() => setShowUpgrade(null)}
      />
    </div>
  );
}

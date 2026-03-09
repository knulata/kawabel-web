'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChat } from '@/store/use-chat';
import { useStudent } from '@/store/use-student';
import { Camera, Send, ArrowDown, Trash2, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ChatBubble } from '@/components/chat/chat-bubble';

export function ChatPage() {
  const { student } = useStudent();
  const { messages, isLoading, error, sendMessage, clearMessages } = useChat();
  const [input, setInput] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
    if (!student) return;

    setInput('');
    const img = imagePreview;
    setImagePreview(null);

    await sendMessage(text || 'Tolong bantu soal ini', student.id, img || undefined);
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-7.5rem)] sm:h-[calc(100dvh-3.5rem)]">
      {/* Chat header */}
      <div className="px-4 py-3 border-b border-border/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">🦉</span>
          <div>
            <h2 className="font-semibold text-sm">Kawi</h2>
            <p className="text-xs text-muted-foreground">Teman belajarmu</p>
          </div>
        </div>
        {messages.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearMessages}
            className="text-muted-foreground"
          >
            <Trash2 size={16} className="mr-1" />
            Hapus
          </Button>
        )}
      </div>

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
            <span className="text-6xl mb-4">🦉</span>
            <h3 className="text-lg font-semibold text-foreground">
              Halo! Aku Kawi
            </h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs">
              Tanya aku soal PR, pelajaran, atau foto soalmu. Aku akan bantu kamu memahami jawabannya!
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
                    className="px-3 py-1.5 rounded-full border border-border text-xs text-muted-foreground hover:bg-muted transition-colors"
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
            <span className="text-lg">🦉</span>
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
            onClick={() => fileInputRef.current?.click()}
            className="shrink-0 text-muted-foreground"
          >
            <Camera size={20} />
          </Button>

          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tanya Kawi..."
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
    </div>
  );
}

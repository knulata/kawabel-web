'use client';

import { create } from 'zustand';
import type { ChatMessage } from '@/types';
import { sendChat } from '@/lib/api';

interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  addMessage: (msg: ChatMessage) => void;
  sendMessage: (text: string, studentId: number, image?: string) => Promise<void>;
  clearMessages: () => void;
}

export const useChat = create<ChatState>((set, get) => ({
  messages: [],
  isLoading: false,
  error: null,

  addMessage: (msg) =>
    set((state) => ({ messages: [...state.messages, msg] })),

  sendMessage: async (text, studentId, image) => {
    const userMsg: ChatMessage = {
      role: 'user',
      content: text,
      image,
      timestamp: Date.now(),
    };

    set((state) => ({
      messages: [...state.messages, userMsg],
      isLoading: true,
      error: null,
    }));

    try {
      // Build messages array for API (include history for context)
      const history = get().messages.map((m) => {
        if (m.image) {
          return {
            role: m.role,
            content: [
              { type: 'text' as const, text: m.content },
              { type: 'image_url' as const, image_url: { url: m.image } },
            ],
          };
        }
        return { role: m.role, content: m.content };
      });

      const result = await sendChat(history as ChatMessage[], studentId);

      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: result.reply,
        timestamp: Date.now(),
      };

      set((state) => ({
        messages: [...state.messages, assistantMsg],
        isLoading: false,
      }));
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Gagal mengirim pesan',
      });
    }
  },

  clearMessages: () => set({ messages: [], error: null }),
}));

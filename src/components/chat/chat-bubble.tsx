'use client';

import { motion } from 'framer-motion';
import type { ChatMessage } from '@/types';
import { Mascot, MASCOT_NAME } from '@/components/mascot';

interface ChatBubbleProps {
  message: ChatMessage;
}

export function ChatBubble({ message }: ChatBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, x: isUser ? 20 : -20 }}
      animate={{ opacity: 1, y: 0, x: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-4 py-2.5 ${
          isUser
            ? 'bg-primary text-primary-foreground rounded-br-md'
            : 'bg-muted text-foreground rounded-bl-md'
        }`}
      >
        {!isUser && (
          <div className="flex items-center gap-1.5 mb-1">
            <Mascot size="xs" />
            <span className="text-sm font-semibold text-primary">{MASCOT_NAME}</span>
          </div>
        )}

        {message.image && (
          <img
            src={message.image}
            alt="Attached"
            className="rounded-lg mb-2 max-w-full max-h-48 object-contain"
          />
        )}

        <div className="text-base leading-relaxed whitespace-pre-wrap">
          <FormattedText text={message.content} isUser={isUser} />
        </div>
      </div>
    </motion.div>
  );
}

function FormattedText({ text, isUser }: { text: string; isUser: boolean }) {
  // Simple markdown-like formatting
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={i} className="font-semibold">
              {part.slice(2, -2)}
            </strong>
          );
        }
        if (part.startsWith('*') && part.endsWith('*')) {
          return <em key={i}>{part.slice(1, -1)}</em>;
        }
        if (part.startsWith('`') && part.endsWith('`')) {
          return (
            <code
              key={i}
              className={`px-1 py-0.5 rounded text-xs font-mono ${
                isUser ? 'bg-white/20' : 'bg-primary/10'
              }`}
            >
              {part.slice(1, -1)}
            </code>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle } from 'lucide-react';
import { PORTFOLIO_CONTEXT } from './portfolioContext';

/* ─────────────────────────────────────────────
   Rate-limit constants
   ───────────────────────────────────────────── */
const MAX_MESSAGES_PER_SESSION = 20;   // max total user messages per page load
const MAX_REQUESTS_PER_MINUTE = 4;    // Client-side burst cap for the chat UI
const COOLDOWN_SECONDS = 15;   // cooldown window when rate-limit is hit
const MAX_INPUT_LENGTH = 400;  // chars; blocks huge prompt injections

/* ─────────────────────────────────────────────
   Types
   ───────────────────────────────────────────── */
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

/* ─────────────────────────────────────────────
   Client-side rate limiter
   Tracks timestamps of recent requests in memory.
   ───────────────────────────────────────────── */
class RateLimiter {
  private timestamps: number[] = [];

  /** Returns true if the request is allowed, false if rate-limited. */
  check(): boolean {
    const now = Date.now();
    const windowMs = 60_000; // 1 minute
    this.timestamps = this.timestamps.filter((t) => now - t < windowMs);
    if (this.timestamps.length >= MAX_REQUESTS_PER_MINUTE) return false;
    this.timestamps.push(now);
    return true;
  }

  /** Seconds until the oldest request falls outside the 1-min window. */
  secondsUntilReset(): number {
    if (!this.timestamps.length) return 0;
    const oldest = this.timestamps[0];
    return Math.ceil((oldest + 60_000 - Date.now()) / 1000);
  }
}

/* ─────────────────────────────────────────────
   Animated typing indicator
   ───────────────────────────────────────────── */
const TypingIndicator = () => (
  <div className="flex items-center gap-1 px-4 py-3">
    {[0, 1, 2].map((i) => (
      <motion.span
        key={i}
        className="w-[6px] h-[6px] rounded-full bg-on-surface-variant/50"
        animate={{ y: [0, -5, 0], opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
      />
    ))}
  </div>
);

/* ─────────────────────────────────────────────
   Lightweight Markdown renderer (no extra deps)
   Handles: **bold**, *italic*, - bullets, blank lines
   ───────────────────────────────────────────── */
function renderMarkdown(text: string): React.ReactNode[] {
  const lines = text.split('\n');
  const nodes: React.ReactNode[] = [];
  let key = 0;

  const parseInline = (raw: string): React.ReactNode[] => {
    const parts: React.ReactNode[] = [];
    // Match **bold** or *italic*
    const regex = /(\*\*(.+?)\*\*|\*(.+?)\*)/g;
    let last = 0;
    let m: RegExpExecArray | null;
    while ((m = regex.exec(raw)) !== null) {
      if (m.index > last) parts.push(raw.slice(last, m.index));
      if (m[2]) parts.push(<strong key={key++} className="font-semibold">{m[2]}</strong>);
      else if (m[3]) parts.push(<em key={key++} className="italic">{m[3]}</em>);
      last = m.index + m[0].length;
    }
    if (last < raw.length) parts.push(raw.slice(last));
    return parts;
  };

  let inList = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Horizontal rule
    if (/^---+$/.test(line.trim())) {
      if (inList) { inList = false; }
      nodes.push(<hr key={key++} className="my-2 border-outline-variant/20" />);
      continue;
    }

    // Bullet point
    if (/^[-*]\s/.test(line)) {
      inList = true;
      nodes.push(
        <li key={key++} className="ml-4 list-disc text-sm leading-relaxed">
          {parseInline(line.replace(/^[-*]\s/, ''))}
        </li>
      );
      continue;
    }

    // End list context on blank lines or non-list lines
    if (inList && line.trim() !== '') inList = false;

    // Empty line → spacer
    if (line.trim() === '') {
      nodes.push(<div key={key++} className="h-1.5" />);
      continue;
    }

    // Normal paragraph line
    nodes.push(
      <p key={key++} className="text-sm leading-relaxed">
        {parseInline(line)}
      </p>
    );
  }

  return nodes;
}

/* ─────────────────────────────────────────────
   Single chat bubble
   ───────────────────────────────────────────── */
const ChatBubble = ({ message }: { message: ChatMessage }) => {
  const isUser = message.role === 'user';
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`max-w-[88%] px-4 py-3 text-sm leading-relaxed break-words ${isUser
          ? 'bg-primary-container text-on-primary-container rounded-2xl rounded-br-md whitespace-pre-wrap'
          : 'bg-surface-container-high text-on-surface rounded-2xl rounded-bl-md'
          }`}
      >
        {isUser ? message.content : renderMarkdown(message.content)}
      </div>
    </motion.div>
  );
};


/* ─────────────────────────────────────────────
   Quick-action suggestion chips
   ───────────────────────────────────────────── */
const SUGGESTIONS = ['Who is Noel?', 'Tech stack?', 'Work experience?', 'Projects?'];

/* ─────────────────────────────────────────────
   Main Chatbot component
   ───────────────────────────────────────────── */
const rateLimiter = new RateLimiter(); // singleton — lives for the page session

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [cooldown, setCooldown] = useState(0);         // seconds remaining
  const [sessionCount, setSessionCount] = useState(0);        // messages sent this session

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isSendingRef = useRef(false);                       // debounce guard
  const cooldownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const chatSessionRef = useRef<any>(null);

  /* ── Auto-scroll ── */
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, isTyping, scrollToBottom]);

  /* ── Focus input when opened ── */
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 350);
      setHasUnread(false);
    }
  }, [isOpen]);

  /* ── Cooldown countdown ticker ── */
  const startCooldown = useCallback((seconds: number) => {
    setCooldown(seconds);
    if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
    cooldownTimerRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(cooldownTimerRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => () => {
    if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
  }, []);

  const generateId = () => `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

  const addAssistantMessage = (content: string) => {
    setMessages((prev) => [
      ...prev,
      { id: generateId(), role: 'assistant', content, timestamp: new Date() },
    ]);
  };

  /* ── Core send function ── */
  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim().slice(0, MAX_INPUT_LENGTH);
    if (!trimmed || isTyping || isSendingRef.current) return;

    /* — Session message cap — */
    if (sessionCount >= MAX_MESSAGES_PER_SESSION) {
      addAssistantMessage(`Session limit reached. Please refresh. 😊`);
      return;
    }

    /* — Per-minute rate limit — */
    if (!rateLimiter.check()) {
      const wait = rateLimiter.secondsUntilReset();
      startCooldown(wait);
      addAssistantMessage(`⏳ Too fast! Wait ${wait}s.`);
      return;
    }

    isSendingRef.current = true;

    const userMsg: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: trimmed,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setSessionCount((n) => n + 1);
    setIsTyping(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          history: messages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || response.statusText);
      }

      const data = await response.json();
      const responseText = data.response || "Sorry, I couldn't understand that.";

      const assistantMsgId = generateId();
      setMessages((prev) => [
        ...prev,
        { id: assistantMsgId, role: 'assistant', content: responseText, timestamp: new Date() },
      ]);
      setIsTyping(false);
    } catch (err: unknown) {
      let errContent: string;
      const errMsg = err instanceof Error ? err.message : '';

      if (err instanceof Error && err.message === 'API_KEY_MISSING') {
        errContent =
          '⚠️ The Groq API key is not configured. Set GROQ_API_KEY in the server environment.';
      } else if (err instanceof Error && (err.message.includes('429') || err.message === 'RATE_LIMIT')) {
        const wait = COOLDOWN_SECONDS;
        startCooldown(wait);
        errContent = `⏳ The AI service is rate-limited. Please wait ${wait} seconds and try again.`;
      } else if (errMsg.includes('503') || errMsg.includes('overloaded') || errMsg.includes('high demand')) {
        errContent = '⚠️ All AI models are currently overloaded. Please try again in a moment.';
      } else {
        errContent = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      }

      addAssistantMessage(errContent);
    } finally {
      setIsTyping(false);
      isSendingRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTyping, isOpen, sessionCount, startCooldown]);

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); sendMessage(inputValue); };
  const handleSuggestion = (s: string) => sendMessage(s);

  const isInputDisabled = isTyping || cooldown > 0 || sessionCount >= MAX_MESSAGES_PER_SESSION;
  const showSuggestions = messages.length === 0;
  const remaining = MAX_MESSAGES_PER_SESSION - sessionCount;

  return (
    <>
      {/* ───── Chat window ───── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="chatbot-window"
            initial={{ opacity: 0, y: 24, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 360, damping: 28 }}
            className="fixed bottom-24 right-5 md:right-8 z-[9999] w-[calc(100vw-40px)] max-w-[400px] h-[min(580px,calc(100vh-140px))] flex flex-col rounded-2xl border border-outline-variant/20 bg-surface shadow-2xl shadow-black/10 overflow-hidden"
            id="chatbot-window"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant/15 bg-surface-container-low/60 backdrop-blur-xl">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-9 h-9 rounded-full bg-primary-container overflow-hidden flex items-center justify-center">
                    <img src="/assets/light-mode.jpg" alt="Noel" className="w-full h-full object-cover" />
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-surface-container-low" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-on-surface leading-tight">Noel Josh Casin</h3>

                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Session usage pill */}
                {sessionCount > 0 && (
                  <span className="text-[10px] font-semibold text-on-surface-variant/50 tabular-nums">
                    {remaining} left
                  </span>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-all duration-200"
                  aria-label="Close chat"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              </div>
            </div>

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 scroll-smooth chatbot-messages">
              {/* Welcome message */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="flex justify-start"
              >
                <div className="max-w-[82%] px-4 py-2.5 text-sm leading-relaxed bg-surface-container-high text-on-surface rounded-2xl rounded-bl-md">
                  Hello! 👋 I'm Noel Josh Casin's assistant. Ask me anything about my skills, projects, or experience!
                </div>
              </motion.div>

              {/* Suggestion chips */}
              {showSuggestions && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex flex-wrap gap-2 pt-1"
                >
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => handleSuggestion(s)}
                      className="px-3 py-1.5 text-xs font-semibold rounded-full border border-outline-variant/30 text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface hover:border-outline transition-all duration-200"
                    >
                      {s}
                    </button>
                  ))}
                </motion.div>
              )}

              {/* Chat messages */}
              {messages.map((msg) => <ChatBubble key={msg.id} message={msg} />)}

              {/* Typing indicator */}
              {isTyping && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                  <div className="bg-surface-container-high rounded-2xl rounded-bl-md">
                    <TypingIndicator />
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            <form onSubmit={handleSubmit} className="px-4 py-3 border-t border-outline-variant/15 bg-surface-container-low/40 backdrop-blur-xl">
              {/* Cooldown banner */}
              <AnimatePresence>
                {cooldown > 0 && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="text-[11px] text-on-surface-variant/60 text-center pb-2 tabular-nums"
                  >
                    ⏳ Please wait {cooldown}s before sending another message
                  </motion.p>
                )}
              </AnimatePresence>

              <div className="flex items-center gap-2 bg-surface-container rounded-xl border border-outline-variant/20 px-3 py-1.5 focus-within:border-outline focus-within:shadow-sm transition-all duration-200">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value.slice(0, MAX_INPUT_LENGTH))}
                  placeholder={
                    cooldown > 0
                      ? `Wait ${cooldown}s…`
                      : sessionCount >= MAX_MESSAGES_PER_SESSION
                        ? 'Session limit reached'
                        : 'Ask about Noel Josh Casin…'
                  }
                  disabled={isInputDisabled}
                  className="flex-1 bg-transparent text-sm text-on-surface placeholder:text-on-surface-variant/50 outline-none py-1.5 disabled:opacity-40"
                  id="chatbot-input"
                  maxLength={MAX_INPUT_LENGTH}
                  autoComplete="off"
                />
                <button
                  type="submit"
                  disabled={!inputValue.trim() || isInputDisabled}
                  className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary-container text-on-primary-container hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 shrink-0"
                  aria-label="Send message"
                >
                  <span className="material-symbols-outlined text-base">arrow_upward</span>
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ───── Floating action button ───── */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-5 md:right-8 z-[9999] w-14 h-14 rounded-full flex items-center justify-center shadow-lg shadow-black/15 transition-colors duration-300"
        style={{ background: isOpen ? 'var(--sys-surface-container-high)' : 'var(--sys-primary-container)' }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
        id="chatbot-fab"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.span
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="material-symbols-outlined text-2xl"
              style={{ color: 'var(--sys-on-surface)' }}
            >keyboard_arrow_down</motion.span>
          ) : (
            <motion.span
              key="chat"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-center justify-center text-on-primary-container"
            >
              <MessageCircle className="w-6 h-6" />
            </motion.span>
          )}
        </AnimatePresence>

        {/* Unread badge */}
        <AnimatePresence>
          {hasUnread && !isOpen && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 border-2 border-surface flex items-center justify-center"
            >
              <span className="text-[9px] font-bold text-white">!</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pulse ring on first load */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{ border: '2px solid var(--sys-primary-container)' }}
          animate={{ scale: [1, 1.5, 1.5], opacity: [0.5, 0, 0] }}
          transition={{ duration: 2, repeat: 2, repeatDelay: 1 }}
        />
      </motion.button>
    </>
  );
}

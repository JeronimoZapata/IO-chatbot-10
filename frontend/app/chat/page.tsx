"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import styles from "./page.module.css";

// ── Types ─────────────────────────────────────────────────

type ChatRole = "user" | "assistant";

type ChatMessage = {
  role: ChatRole;
  content: string;
};

type Conversation = {
  id: string;
  title: string;
  messages: ChatMessage[];
  updatedAt: number;
};

type ChatRequest = {
  messages: Array<{
    role: "system" | "user" | "assistant";
    content: string;
  }>;
};

type ChatResponse = {
  reply: string;
};

// ── Constants ─────────────────────────────────────────────

const STORAGE_KEY = "io_chat_history";
const MAX_CONVERSATIONS = 20;
const TITLE_MAX_LENGTH = 42;

// ── Helpers ───────────────────────────────────────────────

function generateId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function makeTitle(firstUserMessage: string): string {
  const trimmed = firstUserMessage.trim();
  return trimmed.length > TITLE_MAX_LENGTH
    ? `${trimmed.slice(0, TITLE_MAX_LENGTH - 1)}…`
    : trimmed;
}

function loadConversations(): Conversation[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed as Conversation[];
  } catch {
    return [];
  }
}

function saveConversations(convs: Conversation[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(convs));
  } catch {
    // localStorage unavailable — silently ignore
  }
}

function upsertConversation(
  convs: Conversation[],
  updated: Conversation
): Conversation[] {
  const exists = convs.some((c) => c.id === updated.id);
  let next = exists
    ? convs.map((c) => (c.id === updated.id ? updated : c))
    : [updated, ...convs];

  // Sort by most recent first
  next = next.sort((a, b) => b.updatedAt - a.updatedAt);

  // Cap at max
  if (next.length > MAX_CONVERSATIONS) {
    next = next.slice(0, MAX_CONVERSATIONS);
  }
  return next;
}

function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "ahora";
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "ayer";
  return `hace ${days} días`;
}

// ── Component ─────────────────────────────────────────────

export default function ChatPage() {
  const apiUrl = useMemo(
    () => process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001",
    []
  );

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Load history from localStorage on mount
  useEffect(() => {
    const stored = loadConversations();
    setConversations(stored);
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isLoading]);

  const persistConversation = useCallback(
    (id: string, msgs: ChatMessage[]) => {
      setConversations((prev) => {
        const existing = prev.find((c) => c.id === id);
        const title =
          existing?.title ??
          makeTitle(msgs.find((m) => m.role === "user")?.content ?? "Conversación");
        const updated: Conversation = {
          id,
          title,
          messages: msgs,
          updatedAt: Date.now(),
        };
        const next = upsertConversation(prev, updated);
        saveConversations(next);
        return next;
      });
    },
    []
  );

  const sendMessage = async () => {
    const content = input.trim();
    if (!content || isLoading) return;

    setError(null);
    const nextMessages: ChatMessage[] = [
      ...messages,
      { role: "user", content },
    ];
    setMessages(nextMessages);
    setInput("");
    setIsLoading(true);

    // Determine or create the active conversation id
    let currentId = activeId;
    if (!currentId) {
      currentId = generateId();
      setActiveId(currentId);
    }

    try {
      const response = await fetch(`${apiUrl}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages } satisfies ChatRequest),
      });

      if (!response.ok) {
        throw new Error("No se pudo enviar el mensaje.");
      }

      const data = (await response.json()) as ChatResponse;
      if (!data?.reply) {
        throw new Error("Respuesta inválida del servidor.");
      }

      const finalMessages: ChatMessage[] = [
        ...nextMessages,
        { role: "assistant", content: data.reply },
      ];
      setMessages(finalMessages);
      persistConversation(currentId, finalMessages);
    } catch (caught) {
      const message =
        caught instanceof Error ? caught.message : "Ocurrió un error inesperado.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendMessage();
    }
  };

  const startNewConversation = () => {
    setActiveId(null);
    setMessages([]);
    setInput("");
    setError(null);
  };

  const loadConversation = (conv: Conversation) => {
    setActiveId(conv.id);
    setMessages(conv.messages);
    setInput("");
    setError(null);
  };

  return (
    <main className={styles.page}>
      <div className={styles.grid}>
        {/* ── Sidebar ── */}
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <span className={styles.sidebarTitle}>Conversaciones</span>
            <button
              className={styles.newChatButton}
              type="button"
              onClick={startNewConversation}
            >
              + Nueva
            </button>
          </div>

          <div className={styles.sidebarList}>
            {conversations.length === 0 ? (
              <p className={styles.sidebarEmpty}>
                Aún no hay conversaciones guardadas.
              </p>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv.id}
                  type="button"
                  className={`${styles.conversationItem} ${
                    conv.id === activeId ? styles.active : ""
                  }`}
                  onClick={() => loadConversation(conv)}
                >
                  <span className={styles.conversationTitle}>{conv.title}</span>
                  <span className={styles.conversationTime}>
                    {relativeTime(conv.updatedAt)}
                  </span>
                </button>
              ))
            )}
          </div>
        </aside>

        {/* ── Chat column ── */}
        <section className={styles.chatColumn}>
          <div className={styles.chatCard}>
            <header className={styles.header}>
              <h1>Chatbot agéntico </h1>
              <p>Consultas sobre modelos de inventario en tiempo real.</p>
            </header>

            <div className={styles.chatWindow} ref={scrollRef}>
              {messages.length === 0 ? (
                <div className={styles.emptyState}>
                  <p>Iniciá la conversación con el agente.</p>
                </div>
              ) : (
                <div className={styles.messageList}>
                  {messages.map((message, index) => (
                    <div
                      key={`${message.role}-${index}`}
                      className={`${styles.message} ${
                        message.role === "user"
                          ? styles.userMessage
                          : styles.assistantMessage
                      }`}
                    >
                      <div className={styles.messageContent}>
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm, remarkMath]}
                          rehypePlugins={[rehypeKatex]}
                        >
                          {message.content}
                        </ReactMarkdown>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {isLoading && (
                <div className={`${styles.message} ${styles.assistantMessage}`}>
                  <div className={styles.messageContent}>
                    <p>Pensando…</p>
                  </div>
                </div>
              )}
            </div>

            <div className={styles.inputRow}>
              <textarea
                className={styles.input}
                rows={2}
                placeholder="Escribe tu mensaje…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
              />
              <button
                className={styles.sendButton}
                type="button"
                onClick={() => void sendMessage()}
                disabled={isLoading || input.trim().length === 0}
              >
                Enviar
              </button>
            </div>

            {error && <p className={styles.error}>{error}</p>}
          </div>
        </section>
      </div>
    </main>
  );
}

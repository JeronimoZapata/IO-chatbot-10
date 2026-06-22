"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import styles from "./page.module.css";
import ThemeToggle from "../components/ThemeToggle";

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

type InventoryChartData = {
  mean: number;
  standardDeviation: number;
  reorderPoint: number;
};

// ── Constants ─────────────────────────────────────────────

const STORAGE_KEY = "io_chat_history";
const MAX_CONVERSATIONS = 20;
const TITLE_MAX_LENGTH = 42;

// Sugerencias del estado inicial: una por cada modelo soportado. Los prompts
// están redactados en lenguaje natural para que el agente arranque su propio
// flujo de clasificación (model-context.md §4.2–4.3), no para saltarlo.
const SUGGESTIONS = [
  {
    label: "Revisión continua (Q, R)",
    prompt:
      "Quiero resolver un problema de inventario de revisión continua (modelo Q, R).",
  },
  {
    label: "Un solo período (Newsvendor)",
    prompt:
      "Tengo un producto de vida útil corta y necesito decidir cuánto pedir una sola vez.",
  },
  {
    label: "Revisión por períodos (T, S)",
    prompt:
      "Reviso mi inventario en intervalos fijos y quiero resolver un modelo de revisión por períodos (T, S).",
  },
] as const;

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

  next = next.sort((a, b) => b.updatedAt - a.updatedAt);

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

function parseDecimal(value: string | undefined): number | null {
  if (!value) return null;
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function findNumberAfterLabel(content: string, labelPattern: string): number | null {
  const match = content.match(
    new RegExp(`${labelPattern}[^\\n\\d-]*(-?\\d+(?:[,.]\\d+)?)`, "i")
  );
  return parseDecimal(match?.[1]);
}

function findLastNumberOnLine(content: string, linePattern: RegExp): number | null {
  const line = content
    .split(/\r?\n/)
    .find((candidate) => linePattern.test(candidate));

  if (!line) return null;

  const matches = [...line.matchAll(/-?\d+(?:[,.]\d+)?/g)];
  return parseDecimal(matches.at(-1)?.[0]);
}

function parseInventoryChartData(content: string): InventoryChartData | null {
  const compact = content.replace(/\*\*/g, "").replace(/`/g, "");
  const formulaMatch = compact.match(
    /R\s*=\s*(?:μ|mu)\s*\+\s*z\s*[·*x×]\s*(?:σ|sigma)\s*=\s*(-?\d+(?:[,.]\d+)?)\s*\+\s*(-?\d+(?:[,.]\d+)?)\s*[·*x×]\s*(-?\d+(?:[,.]\d+)?)/i
  );

  const mean =
    findNumberAfterLabel(compact, "(?:μ|mu|media|demanda esperada)") ??
    parseDecimal(formulaMatch?.[1]);
  const standardDeviation =
    findNumberAfterLabel(compact, "(?:σ|sigma|desviaci[oó]n est[aá]ndar)") ??
    parseDecimal(formulaMatch?.[3]);
  const reorderPoint =
    findLastNumberOnLine(compact, /(?:\bR\b|punto de reorden)/i) ??
    findNumberAfterLabel(compact, "(?:punto de reorden|\\bR\\b)");

  if (
    mean === null ||
    standardDeviation === null ||
    reorderPoint === null ||
    standardDeviation <= 0
  ) {
    return null;
  }

  return { mean, standardDeviation, reorderPoint };
}

function InventoryNormalChart({ data }: { data: InventoryChartData }) {
  const width = 560;
  const height = 220;
  const padding = { top: 22, right: 28, bottom: 42, left: 42 };
  const xMin = Math.min(
    data.mean - 4 * data.standardDeviation,
    data.reorderPoint - data.standardDeviation
  );
  const xMax = Math.max(
    data.mean + 4 * data.standardDeviation,
    data.reorderPoint + data.standardDeviation
  );
  const domain = xMax - xMin;
  const peak = 1 / (data.standardDeviation * Math.sqrt(2 * Math.PI));

  const xToSvg = (x: number) =>
    padding.left +
    ((x - xMin) / domain) * (width - padding.left - padding.right);
  const yToSvg = (y: number) =>
    padding.top + (1 - y / peak) * (height - padding.top - padding.bottom);
  const density = (x: number) =>
    (1 / (data.standardDeviation * Math.sqrt(2 * Math.PI))) *
    Math.exp(-0.5 * ((x - data.mean) / data.standardDeviation) ** 2);

  const points = Array.from({ length: 96 }, (_, index) => {
    const x = xMin + (domain * index) / 95;
    return { x, y: density(x) };
  });
  const curvePath = points
    .map(
      (point, index) =>
        `${index === 0 ? "M" : "L"} ${xToSvg(point.x)} ${yToSvg(point.y)}`
    )
    .join(" ");
  const shadedPoints = points.filter((point) => point.x >= data.reorderPoint);
  const baselineY = height - padding.bottom;
  const shadedPath =
    shadedPoints.length > 1
      ? [
          `M ${xToSvg(shadedPoints[0].x)} ${baselineY}`,
          ...shadedPoints.map(
            (point) => `L ${xToSvg(point.x)} ${yToSvg(point.y)}`
          ),
          `L ${xToSvg(shadedPoints[shadedPoints.length - 1].x)} ${baselineY}`,
          "Z",
        ].join(" ")
      : "";
  const meanX = xToSvg(data.mean);
  const reorderX = xToSvg(data.reorderPoint);

  return (
    <figure className={styles.normalChart}>
      <figcaption>Campana de demanda durante el lead time</figcaption>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Distribución normal con punto de reorden marcado"
      >
        <line
          className={styles.chartAxis}
          x1={padding.left}
          y1={baselineY}
          x2={width - padding.right}
          y2={baselineY}
        />
        {shadedPath && <path className={styles.chartShade} d={shadedPath} />}
        <path className={styles.chartCurve} d={curvePath} />
        <line
          className={styles.chartMean}
          x1={meanX}
          y1={padding.top}
          x2={meanX}
          y2={baselineY}
        />
        <line
          className={styles.chartReorder}
          x1={reorderX}
          y1={padding.top}
          x2={reorderX}
          y2={baselineY}
        />
        <text
          className={styles.chartLabel}
          x={meanX}
          y={height - 16}
          textAnchor="middle"
        >
          μ = {data.mean.toFixed(2)}
        </text>
        <text
          className={styles.chartLabelStrong}
          x={reorderX}
          y={padding.top + 12}
          textAnchor={reorderX > width - 120 ? "end" : "start"}
        >
          R = {data.reorderPoint.toFixed(2)}
        </text>
      </svg>
      <p>
        La zona sombreada representa la probabilidad de que la demanda supere el
        punto de reorden.
      </p>
    </figure>
  );
}

export default function ChatPage() {
  const apiUrl = useMemo(
    () =>
      process.env.NEXT_PUBLIC_API_URL ??
      (process.env.NODE_ENV === "production"
        ? "/_/backend"
        : "http://localhost:3001"),
    []
  );

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setConversations(loadConversations());
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isLoading]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [input]);

  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const q = searchQuery.toLowerCase();
    return conversations.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.messages.some((m) => m.content.toLowerCase().includes(q))
    );
  }, [conversations, searchQuery]);

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

  const deleteConversation = useCallback(
    (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      setConversations((prev) => {
        const next = prev.filter((c) => c.id !== id);
        saveConversations(next);
        return next;
      });
      if (activeId === id) {
        setActiveId(null);
        setMessages([]);
        setError(null);
      }
    },
    [activeId]
  );

  const exportPDF = useCallback(() => {
    window.print();
  }, []);

  const sendMessage = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || isLoading) return;

    setError(null);
    const nextMessages: ChatMessage[] = [
      ...messages,
      { role: "user", content },
    ];
    setMessages(nextMessages);
    setInput("");
    setIsLoading(true);

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

  const handleSuggestion = (text: string) => {
    void sendMessage(text);
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

  const activeConversation = conversations.find((c) => c.id === activeId);

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

          <div className={styles.searchWrapper}>
            <input
              className={styles.searchInput}
              type="text"
              placeholder="Buscar…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className={styles.sidebarList}>
            {filteredConversations.length === 0 ? (
              <p className={styles.sidebarEmpty}>
                {searchQuery ? "Sin resultados." : "Aún no hay conversaciones guardadas."}
              </p>
            ) : (
              filteredConversations.map((conv) => (
                <div
                  key={conv.id}
                  className={`${styles.conversationItem} ${
                    conv.id === activeId ? styles.active : ""
                  }`}
                >
                  <button
                    type="button"
                    className={styles.conversationBody}
                    onClick={() => loadConversation(conv)}
                  >
                    <span className={styles.conversationTitle}>{conv.title}</span>
                    <span className={styles.conversationTime}>
                      {relativeTime(conv.updatedAt)}
                    </span>
                  </button>
                  <button
                    type="button"
                    className={styles.deleteButton}
                    onClick={(e) => deleteConversation(conv.id, e)}
                    title="Eliminar conversación"
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>
        </aside>

        {/* ── Chat column ── */}
        <section className={styles.chatColumn}>
          <div className={styles.chatCard}>
            <header className={styles.header}>
              <div className={styles.headerTop}>
                <div>
                  <h1>Chatbot agéntico</h1>
                  <p>Consultas sobre modelos de inventario en tiempo real.</p>
                </div>
                <div className={styles.headerActions}>
                  {messages.length > 0 && (
                    <button
                      type="button"
                      className={styles.exportButton}
                      onClick={exportPDF}
                    >
                      Exportar PDF
                    </button>
                  )}
                  <ThemeToggle />
                </div>
              </div>
            </header>

            {/* Print-only title */}
            {activeConversation && (
              <div className={styles.printTitle}>
                <strong>{activeConversation.title}</strong>
              </div>
            )}

            <div className={styles.chatWindow} ref={scrollRef}>
              {messages.length === 0 ? (
                <div className={styles.emptyState}>
                  <p className={styles.welcomeTitle}>
                    Soy un asistente especializado en modelos de inventario
                    probabilísticos. Puedo ayudarte a plantear, resolver e
                    interpretar estos modelos:
                  </p>
                  <div className={styles.suggestions}>
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s.label}
                        type="button"
                        className={styles.suggestionChip}
                        onClick={() => handleSuggestion(s.prompt)}
                        disabled={isLoading}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                  <p className={styles.welcomeHint}>
                    Elegí un punto de partida o escribí tu consulta.
                  </p>
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
                        {message.role === "assistant" &&
                          (() => {
                            const chartData = parseInventoryChartData(message.content);
                            return chartData ? (
                              <InventoryNormalChart data={chartData} />
                            ) : null;
                          })()}
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
                ref={textareaRef}
                className={styles.input}
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

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import styles from "./page.module.css";

type ChatRole = "user" | "assistant";

type ChatMessage = {
  role: ChatRole;
  content: string;
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

export default function ChatPage() {
  const apiUrl = useMemo(
    () => process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001",
    []
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!scrollRef.current) {
      return;
    }
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isLoading]);

  const sendMessage = async () => {
    const content = input.trim();
    if (!content || isLoading) {
      return;
    }

    setError(null);
    const nextMessages: ChatMessage[] = [
      ...messages,
      { role: "user", content },
    ];

    setMessages(nextMessages);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch(`${apiUrl}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages: nextMessages } satisfies ChatRequest),
      });

      if (!response.ok) {
        throw new Error("No se pudo enviar el mensaje.");
      }

      const data = (await response.json()) as ChatResponse;
      if (!data?.reply) {
        throw new Error("Respuesta invalida del servidor.");
      }

      setMessages([...nextMessages, { role: "assistant", content: data.reply }]);
    } catch (caught) {
      const message =
        caught instanceof Error
          ? caught.message
          : "Ocurrio un error inesperado.";
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

  return (
    <main className={styles.page}>
      <div className={styles.grid}>
        <section className={styles.sidebar}>
          <div className={styles.sidebarPlaceholder}>
            <p>Panel lateral</p>
            <p>Disponible en la siguiente etapa.</p>
          </div>
        </section>
        <section className={styles.chatColumn}>
          <div className={styles.chatCard}>
            <header className={styles.header}>
              <h1>Chat con el agente</h1>
              <p>Consultas sobre modelos de inventario en tiempo real.</p>
            </header>

            <div className={styles.chatWindow} ref={scrollRef}>
              {messages.length === 0 ? (
                <div className={styles.emptyState}>
                  <p>Inicia la conversacion con el agente.</p>
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
              {isLoading ? (
                <div className={`${styles.message} ${styles.assistantMessage}`}>
                  <div className={styles.messageContent}>
                    <p>Pensando...</p>
                  </div>
                </div>
              ) : null}
            </div>

            <div className={styles.inputRow}>
              <textarea
                className={styles.input}
                rows={2}
                placeholder="Escribe tu mensaje..."
                value={input}
                onChange={(event) => setInput(event.target.value)}
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
            {error ? <p className={styles.error}>{error}</p> : null}
          </div>
        </section>
      </div>
    </main>
  );
}

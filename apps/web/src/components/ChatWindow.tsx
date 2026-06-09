import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import CitationList from "./CitationList";
import MarkdownMessage from "./MarkdownMessage";
import { Citation } from "../lib/api";
import { useLang } from "../lib/i18n";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
  stopped?: boolean;
};

type Props = {
  messages: ChatMessage[];
  loading: boolean;
  onAsk: (question: string) => Promise<void>;
  onStop: () => void;
};

const WELCOME_KEYS = [
  "welcome.0",
  "welcome.1",
  "welcome.2",
  "welcome.3",
  "welcome.4",
  "welcome.5",
  "welcome.6",
  "welcome.7",
];

const SUGGESTION_KEYS = [
  "suggest.0",
  "suggest.1",
  "suggest.2",
  "suggest.3",
  "suggest.4",
  "suggest.5",
];

export default function ChatWindow({ messages, loading, onAsk, onStop }: Props) {
  const { t } = useLang();
  const [question, setQuestion] = useState("");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [welcomeKey] = useState(
    () => WELCOME_KEYS[Math.floor(Math.random() * WELCOME_KEYS.length)],
  );
  const messagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = messagesRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (!loading) {
      setElapsedSeconds(0);
      return;
    }

    setElapsedSeconds(0);
    const timer = window.setInterval(() => {
      setElapsedSeconds((current) => current + 1);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [loading]);

  useEffect(() => {
    if (!copiedId) return;
    const timer = window.setTimeout(() => setCopiedId(null), 1800);
    return () => window.clearTimeout(timer);
  }, [copiedId]);

  async function copyMessage(message: ChatMessage) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(message.content);
      } else {
        const ta = document.createElement("textarea");
        ta.value = message.content;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopiedId(message.id);
    } catch {
      // 复制失败时不提示成功
    }
  }

  async function sendQuestion() {
    const text = question.trim();
    if (!text || loading) return;
    setQuestion("");
    await onAsk(text);
  }

  async function sendSuggestion(text: string) {
    if (loading) return;
    await onAsk(text);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    await sendQuestion();
  }

  function handleQuestionKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) return;
    event.preventDefault();
    void sendQuestion();
  }

  return (
    <section className="chat-layout">
      <div className="messages" ref={messagesRef}>
        {messages.length ? null : (
          <div className="message-row assistant">
            <article className="message assistant welcome">
              <div className="message-body">{t(welcomeKey)}</div>
            </article>
            <div className="suggestion-chips">
              <span className="suggestion-label">{t("ask.suggest.label")}</span>
              {SUGGESTION_KEYS.map((key) => {
                const text = t(key);
                return (
                  <button
                    type="button"
                    key={key}
                    className="suggestion-chip"
                    onClick={() => void sendSuggestion(text)}
                    disabled={loading}
                  >
                    {text}
                  </button>
                );
              })}
            </div>
          </div>
        )}
        {messages.map((message) => {
          const showCopy = message.role === "assistant" && !message.stopped && message.content.trim().length > 0;
          const justCopied = copiedId === message.id;
          return (
            <div className={`message-row ${message.role}`} key={message.id}>
              <article className={`message ${message.role}${message.stopped ? " stopped" : ""}`}>
                <div className="message-body">
                  {message.stopped ? (
                    <span className="stopped-indicator">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <rect x="6" y="5" width="4" height="14" rx="1.2" />
                        <rect x="14" y="5" width="4" height="14" rx="1.2" />
                      </svg>
                      <span>{t("ask.paused")}</span>
                    </span>
                  ) : message.role === "assistant" ? (
                    <MarkdownMessage content={message.content} />
                  ) : (
                    message.content
                  )}
                </div>
                {message.citations ? <CitationList citations={message.citations} /> : null}
              </article>
              {showCopy ? (
                <div className="message-toolbar">
                  <button
                    type="button"
                    className={`copy-button${justCopied ? " copied" : ""}`}
                    onClick={() => copyMessage(message)}
                    aria-label={justCopied ? t("ask.copied") : t("ask.copyAria")}
                    title={justCopied ? t("ask.copied") : t("ask.copyAria")}
                  >
                    {justCopied ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                    )}
                    <span className="copy-button-label">{justCopied ? t("ask.copied") : t("ask.copy")}</span>
                  </button>
                </div>
              ) : null}
            </div>
          );
        })}
        {loading ? (
          <div className="pending-row">
            <article className="message assistant pending" aria-live="polite">
              <div className="message-body loading-answer">
                <span className="answer-spinner" aria-hidden="true" />
                <span>{t("ask.preparing")}</span>
                <span className="elapsed-time">{elapsedSeconds}s</span>
              </div>
            </article>
            <button
              type="button"
              className="stop-button"
              onClick={onStop}
              aria-label={t("ask.stop")}
              title={t("ask.stop")}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <rect x="6" y="5" width="4" height="14" rx="1.2" />
                <rect x="14" y="5" width="4" height="14" rx="1.2" />
              </svg>
            </button>
          </div>
        ) : null}
      </div>
      <form className="ask-form" onSubmit={submit}>
        <textarea
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          onKeyDown={handleQuestionKeyDown}
          placeholder={t("ask.placeholder")}
          rows={2}
        />
        <button className="primary send-button" disabled={loading || !question.trim()} aria-label={t("ask.send")} title={t("ask.send")}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </form>
    </section>
  );
}

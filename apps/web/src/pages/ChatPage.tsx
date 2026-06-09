import { useEffect, useState } from "react";
import ChatWindow, { ChatMessage } from "../components/ChatWindow";
import { api } from "../lib/api";
import { useLang } from "../lib/i18n";

type Props = {
  token: string;
};

const MESSAGES_KEY = "mkbqa_chat_messages";

function id() {
  return crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random());
}

function loadStoredMessages(): ChatMessage[] {
  try {
    const raw = localStorage.getItem(MESSAGES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (m): m is ChatMessage =>
        typeof m === "object" && m !== null && (m.role === "user" || m.role === "assistant") && typeof m.id === "string",
    );
  } catch {
    return [];
  }
}

export default function ChatPage({ token }: Props) {
  const { t } = useLang();
  const [messages, setMessages] = useState<ChatMessage[]>(loadStoredMessages);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));
    } catch {
      // 存储失败(比如超出配额)不影响当前会话
    }
  }, [messages]);

  function clearMessages() {
    if (abortController) {
      abortController.abort();
    }
    setMessages([]);
    setError("");
    setClearConfirmOpen(false);
  }

  async function ask(question: string) {
    const userMessage: ChatMessage = { id: id(), role: "user", content: question };
    setMessages((current) => [...current, userMessage]);
    setLoading(true);
    setError("");

    const controller = new AbortController();
    setAbortController(controller);

    try {
      const response = await api.query(token, question, 5, controller.signal);
      setMessages((current) => [
        ...current,
        { id: id(), role: "assistant", content: response.answer, citations: response.citations },
      ]);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        setMessages((current) => [
          ...current,
          { id: id(), role: "assistant", content: "", stopped: true },
        ]);
        return;
      }
      setError(err instanceof Error ? err.message : t("ask.queryFailed"));
    } finally {
      setLoading(false);
      setAbortController(null);
    }
  }

  function stopAnswer() {
    if (abortController) {
      abortController.abort();
    }
  }

  return (
    <main className="workspace single">
      <section className="content-panel">
        <div className="panel-header">
          <div>
            <h2>{t("ask.title")}</h2>
            <p>{t("ask.subtitle")}</p>
          </div>
          <button
            type="button"
            className="ghost chat-clear-button"
            onClick={() => setClearConfirmOpen(true)}
            disabled={messages.length === 0}
            aria-label={t("ask.clear")}
            title={t("ask.clear")}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              <path d="M10 11v6" />
              <path d="M14 11v6" />
              <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
            </svg>
            <span>{t("ask.clear")}</span>
          </button>
        </div>
        {error ? <div className="error-banner">{error}</div> : null}
        <ChatWindow messages={messages} loading={loading} onAsk={ask} onStop={stopAnswer} />
      </section>
      {clearConfirmOpen ? (
        <div className="modal-backdrop" role="presentation">
          <section className="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="clear-confirm-title">
            <div>
              <h2 id="clear-confirm-title">{t("ask.clearConfirmTitle")}</h2>
              <p>{t("ask.clearConfirmBody")}</p>
            </div>
            <div className="dialog-actions">
              <button type="button" onClick={() => setClearConfirmOpen(false)}>
                {t("common.cancel")}
              </button>
              <button type="button" className="danger primary-danger" onClick={clearMessages}>
                {t("ask.clearConfirm")}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}


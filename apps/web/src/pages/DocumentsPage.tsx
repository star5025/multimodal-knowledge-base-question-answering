import { useEffect, useMemo, useState } from "react";
import DocumentTable from "../components/DocumentTable";
import UploadPanel from "../components/UploadPanel";
import { api, KnowledgeDocument } from "../lib/api";
import { useLang } from "../lib/i18n";

type Props = {
  token: string;
};

export default function DocumentsPage({ token }: Props) {
  const { t, lang } = useLang();
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [showTypeBreakdown, setShowTypeBreakdown] = useState(false);

  async function refresh() {
    setError("");
    const items = await api.listDocuments(token);
    setDocuments(items);
  }

  useEffect(() => {
    refresh()
      .catch((err) => setError(err instanceof Error ? err.message : t("docs.loadFailed")))
      .finally(() => setLoading(false));
  }, [token]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return documents;
    return documents.filter((document) => document.filename.toLowerCase().includes(needle));
  }, [documents, query]);

  const stats = useMemo(() => {
    const total = documents.length;
    const sizeBytes = documents.reduce((sum, doc) => sum + doc.size_bytes, 0);
    const indexed = documents.filter((doc) => doc.status === "indexed").length;
    const failed = documents.filter((doc) => doc.status === "failed").length;
    const indexedPct = total === 0 ? 0 : Math.round((indexed / total) * 100);
    const lastUploaded = documents.reduce<string | null>((acc, doc) => {
      if (!acc) return doc.created_at;
      return new Date(doc.created_at) > new Date(acc) ? doc.created_at : acc;
    }, null);
    const byType = documents.reduce<Record<string, number>>((acc, doc) => {
      const key = (doc.file_type || "other").toLowerCase();
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});
    const typeEntries = Object.entries(byType).sort((a, b) => b[1] - a[1]);
    return { total, sizeBytes, indexed, failed, indexedPct, lastUploaded, typeEntries };
  }, [documents]);

  async function handleDelete(id: string) {
    setBusyId(id);
    setError("");
    try {
      await api.deleteDocument(token, id);
      setDocuments((current) => current.filter((document) => document.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("docs.deleteFailed"));
    } finally {
      setBusyId("");
    }
  }

  async function handleReprocess(id: string) {
    setBusyId(id);
    setError("");
    try {
      const updated = await api.reprocessDocument(token, id);
      setDocuments((current) => current.map((document) => (document.id === id ? updated : document)));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("docs.reprocessFailed"));
    } finally {
      setBusyId("");
    }
  }

  return (
    <main className="workspace">
      <UploadPanel
        token={token}
        onUploaded={(document) => setDocuments((current) => [document, ...current.filter((item) => item.id !== document.id)])}
      />
      <section className="content-panel">
        <div className="panel-header">
          <div>
            <h2>{t("docs.title")}</h2>
            <p>{t("docs.subtitleCount", { count: documents.length })}</p>
          </div>
          <input
            className="search-input"
            placeholder={t("docs.searchPlaceholder")}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        {!loading ? (
          <div className="stats-row">
            <button
              type="button"
              className={`stat-card stat-total stat-clickable${showTypeBreakdown ? " expanded" : ""}`}
              onClick={() => setShowTypeBreakdown((v) => !v)}
              aria-expanded={showTypeBreakdown}
              disabled={stats.total === 0}
            >
              <span className="stat-icon" aria-hidden="true">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
              </span>
              <div className="stat-text">
                <div className="stat-label">{t("stats.documents")}</div>
                <div className="stat-value">{stats.total}</div>
              </div>
              <span className="stat-chevron" aria-hidden="true">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </span>
            </button>
            <article className="stat-card stat-size">
              <span className="stat-icon" aria-hidden="true">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                  <line x1="12" y1="22.08" x2="12" y2="12" />
                </svg>
              </span>
              <div className="stat-text">
                <div className="stat-label">{t("stats.totalSize")}</div>
                <div className="stat-value">{formatBytes(stats.sizeBytes)}</div>
              </div>
            </article>
            <article className="stat-card stat-indexed">
              <span className="stat-icon" aria-hidden="true">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </span>
              <div className="stat-text">
                <div className="stat-label">{t("stats.indexed")}</div>
                <div className="stat-value">
                  {stats.indexed}/{stats.total}
                  <span className="stat-sub">{stats.indexedPct}%</span>
                </div>
              </div>
            </article>
            <article className="stat-card stat-updated">
              <span className="stat-icon" aria-hidden="true">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </span>
              <div className="stat-text">
                <div className="stat-label">{t("stats.lastUpload")}</div>
                <div className="stat-value stat-value-sm">
                  {stats.lastUploaded ? formatRelativeTime(stats.lastUploaded, t, lang) : "—"}
                </div>
              </div>
            </article>
          </div>
        ) : null}
        {!loading && showTypeBreakdown && stats.typeEntries.length ? (
          <div className="stat-breakdown" role="region" aria-label={t("stats.documents")}>
            {stats.typeEntries.map(([type, count]) => (
              <div key={type} className="stat-breakdown-item">
                <span className="stat-breakdown-type">{type.toUpperCase()}</span>
                <span className="stat-breakdown-count">{count}</span>
              </div>
            ))}
          </div>
        ) : null}
        {error ? <div className="error-banner">{error}</div> : null}
        {loading ? <div className="status-line">{t("docs.loading")}</div> : null}
        {!loading ? (
          <DocumentTable documents={filtered} onDelete={handleDelete} onReprocess={handleReprocess} busyId={busyId} />
        ) : null}
      </section>
    </main>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

function parseServerDate(iso: string): Date {
  // 后端返回的 ISO 时间没有时区后缀(实际是 UTC),JS 默认会按本地时间解释
  // 这里若没有 Z / ±hh:mm 后缀,补一个 Z 让其按 UTC 解析
  const hasTz = /Z$|[+-]\d{2}:?\d{2}$/.test(iso);
  return new Date(hasTz ? iso : iso + "Z");
}

function formatRelativeTime(iso: string, t: (k: string, v?: Record<string, string | number>) => string, lang: string): string {
  const date = parseServerDate(iso);
  const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diffSec < 60) return t("time.justNow");
  if (diffSec < 3600) return t("time.minutesAgo", { n: Math.floor(diffSec / 60) });
  if (diffSec < 86400) return t("time.hoursAgo", { n: Math.floor(diffSec / 3600) });
  if (diffSec < 86400 * 7) return t("time.daysAgo", { n: Math.floor(diffSec / 86400) });
  return date.toLocaleDateString(lang === "zh" ? "zh-CN" : undefined);
}


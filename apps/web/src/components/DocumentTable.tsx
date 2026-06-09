import { useState } from "react";
import { KnowledgeDocument } from "../lib/api";
import { useLang } from "../lib/i18n";

type Props = {
  documents: KnowledgeDocument[];
  onDelete: (id: string) => void;
  onReprocess: (id: string) => void;
  busyId: string;
};

function formatSize(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function parseServerDate(iso: string): Date {
  const hasTz = /Z$|[+-]\d{2}:?\d{2}$/.test(iso);
  return new Date(hasTz ? iso : iso + "Z");
}

function getFileTypeIcon(type: string): { icon: JSX.Element; color: string } {
  const lower = type.toLowerCase();
  if (lower === "pdf") {
    return {
      color: "#ef4444",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" opacity="0.3" />
          <polyline points="14 2 14 8 20 8" fill="currentColor" />
          <path d="M8 13h2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2H8" stroke="white" strokeWidth="1.5" fill="none" />
        </svg>
      ),
    };
  }
  if (lower === "docx" || lower === "doc") {
    return {
      color: "#3b82f6",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" fill="currentColor" />
          <path d="M8 13l2 4 2-4 2 4 2-4" stroke="white" strokeWidth="1.2" fill="none" strokeLinecap="round" />
        </svg>
      ),
    };
  }
  if (lower === "txt" || lower === "md") {
    return {
      color: "#6b7280",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" fill="currentColor" />
          <line x1="8" y1="13" x2="16" y2="13" stroke="white" strokeWidth="1.5" />
          <line x1="8" y1="17" x2="14" y2="17" stroke="white" strokeWidth="1.5" />
        </svg>
      ),
    };
  }
  if (/^(png|jpg|jpeg|gif|webp|svg)$/.test(lower)) {
    return {
      color: "#a855f7",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" fill="white" />
          <path d="M21 15l-5-5L5 21" stroke="white" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        </svg>
      ),
    };
  }
  return {
    color: "#64748b",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" fill="currentColor" />
      </svg>
    ),
  };
}

export default function DocumentTable({ documents, onDelete, onReprocess, busyId }: Props) {
  const { t, lang } = useLang();
  const [deleteTarget, setDeleteTarget] = useState<KnowledgeDocument | null>(null);

  if (!documents.length) {
    return <div className="empty-state">{t("docs.noMatches")}</div>;
  }

  return (
    <>
      <div className="document-list">
        {documents.map((document) => {
          const { icon, color } = getFileTypeIcon(document.file_type);
          return (
            <article className="document-card" key={document.id} style={{ "--type-color": color } as React.CSSProperties}>
              <div className="document-card-main">
                <div className="document-card-title">
                  <span className="document-type-icon" aria-hidden="true">
                    {icon}
                  </span>
                  <div className="document-card-name">
                    <div className="filename">{document.filename}</div>
                    {document.error_message ? <div className="row-error">{document.error_message}</div> : null}
                  </div>
                </div>
                <span className={`badge ${document.status}`}>{t(`status.${document.status}`)}</span>
              </div>
              <dl className="document-meta">
              <div>
                <dt>{t("doc.type")}</dt>
                <dd>{document.file_type}</dd>
              </div>
              <div>
                <dt>{t("doc.size")}</dt>
                <dd>{formatSize(document.size_bytes)}</dd>
              </div>
              <div>
                <dt>{t("doc.updated")}</dt>
                <dd>{parseServerDate(document.updated_at).toLocaleString(lang === "zh" ? "zh-CN" : undefined)}</dd>
              </div>
            </dl>
            <div className="row-actions">
              <button disabled={busyId === document.id} onClick={() => onReprocess(document.id)}>
                {t("docs.reprocess")}
              </button>
              <button
                className="danger icon-button"
                disabled={busyId === document.id}
                onClick={() => setDeleteTarget(document)}
                aria-label={t("docs.delete")}
                title={t("docs.delete")}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                  <path d="M10 11v6" />
                  <path d="M14 11v6" />
                  <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
                </svg>
              </button>
            </div>
          </article>
          );
        })}
      </div>
      {deleteTarget ? (
        <div className="modal-backdrop" role="presentation">
          <section className="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="delete-confirm-title">
            <div>
              <h2 id="delete-confirm-title">{t("docs.confirmDeleteTitle")}</h2>
              <p
                dangerouslySetInnerHTML={{
                  __html: t("docs.confirmDeleteBody", { name: `<strong>${escapeHtml(deleteTarget.filename)}</strong>` }),
                }}
              />
            </div>
            <div className="dialog-actions">
              <button type="button" onClick={() => setDeleteTarget(null)}>
                {t("common.cancel")}
              </button>
              <button
                type="button"
                className="danger primary-danger"
                onClick={() => {
                  onDelete(deleteTarget.id);
                  setDeleteTarget(null);
                }}
              >
                {t("docs.delete")}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}

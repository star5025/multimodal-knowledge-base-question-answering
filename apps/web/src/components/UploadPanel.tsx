import { ChangeEvent, useRef, useState } from "react";
import { api, KnowledgeDocument } from "../lib/api";
import { useLang } from "../lib/i18n";

type Props = {
  token: string;
  onUploaded: (document: KnowledgeDocument) => void;
};

const ACCEPT = ".txt,.pdf,.png,.jpg,.jpeg";
const ALLOWED_EXTENSIONS = ["txt", "pdf", "png", "jpg", "jpeg"];

function formatSize(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

function isAllowedFile(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase();
  return Boolean(extension && ALLOWED_EXTENSIONS.includes(extension));
}

export default function UploadPanel({ token, onUploaded }: Props) {
  const { t } = useLang();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function upload(file: File) {
    if (!isAllowedFile(file)) {
      setError(t("upload.unsupported"));
      return;
    }
    setBusy(true);
    setError("");
    try {
      const document = await api.uploadDocument(token, file);
      onUploaded(document);
      setSelectedFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("upload.failed"));
    } finally {
      setBusy(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!isAllowedFile(file)) {
      setSelectedFile(null);
      setError(t("upload.unsupported"));
      if (inputRef.current) {
        inputRef.current.value = "";
      }
      return;
    }
    setSelectedFile(file);
    setError("");
  }

  function cancelSelection() {
    setSelectedFile(null);
    setError("");
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  return (
    <section className="tool-panel">
      <div>
        <h2>{t("upload.title")}</h2>
        <p>{t("upload.subtitle")}</p>
      </div>
      <div className="upload-center">
        {!selectedFile ? (
          <label className="file-picker-card">
            <span>{t("upload.choose")}</span>
            <small>{t("upload.formats")}</small>
            <input ref={inputRef} type="file" accept={ACCEPT} onChange={handleChange} disabled={busy} />
          </label>
        ) : null}
        {selectedFile ? (
          <div className="selected-file-card">
            <div>
              <strong>{selectedFile.name}</strong>
              <span>{formatSize(selectedFile.size)}</span>
            </div>
            <div className="upload-actions">
              <button type="button" onClick={cancelSelection} disabled={busy}>
                {t("common.cancel")}
              </button>
              <button type="button" className="primary" onClick={() => void upload(selectedFile)} disabled={busy}>
                {t("upload.confirm")}
              </button>
            </div>
          </div>
        ) : null}
        {error ? <div className="error-banner">{error}</div> : null}
        {busy ? (
          <div className="upload-progress" role="status" aria-live="polite">
            <div className="upload-progress-spinner" aria-hidden="true">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
            </div>
            <div className="upload-progress-text">
              <strong>{t("upload.busyTitle")}</strong>
              <span>{t("upload.busySubtitle")}</span>
              <div className="upload-progress-bar" aria-hidden="true">
                <span />
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

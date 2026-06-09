import { useEffect, useState } from "react";
import { useLang } from "../lib/i18n";

type Props = {
  onClose: () => void;
};

export default function HelpModal({ onClose }: Props) {
  const { t } = useLang();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(true), 50);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        handleClose();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleClose() {
    setVisible(false);
    window.setTimeout(() => onClose(), 220);
  }

  const steps = [
    {
      key: "step1",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
      ),
    },
    {
      key: "step2",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
    },
    {
      key: "step3",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      ),
    },
    {
      key: "step4",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="9" y1="13" x2="15" y2="13" />
          <line x1="9" y1="17" x2="13" y2="17" />
        </svg>
      ),
    },
  ];

  const tips = [
    {
      key: "tip.theme",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      ),
    },
    {
      key: "tip.lang",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
      ),
    },
    {
      key: "tip.copy",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      ),
    },
    {
      key: "tip.privacy",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      ),
    },
  ];

  return (
    <div
      className={`help-backdrop${visible ? " visible" : ""}`}
      role="presentation"
      onClick={handleClose}
    >
      <section
        className={`help-dialog${visible ? " visible" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="help-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="help-header">
          <div>
            <h2 id="help-modal-title">{t("help.title")}</h2>
            <p>{t("help.subtitle")}</p>
          </div>
          <button
            type="button"
            className="help-close-icon"
            onClick={handleClose}
            aria-label={t("help.close")}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="6" y1="6" x2="18" y2="18" />
              <line x1="18" y1="6" x2="6" y2="18" />
            </svg>
          </button>
        </header>
        <div className="help-body">
          <h3 className="help-section-title">{t("help.section.start")}</h3>
          <ol className="help-step-list">
            {steps.map((step) => (
              <li key={step.key} className="help-step">
                <span className="help-step-icon" aria-hidden="true">{step.icon}</span>
                <div className="help-step-text">
                  <strong>{t(`help.${step.key}.title`)}</strong>
                  <p>{t(`help.${step.key}.body`)}</p>
                </div>
              </li>
            ))}
          </ol>
          <h3 className="help-section-title">{t("help.section.tips")}</h3>
          <ul className="help-tip-list">
            {tips.map((tip) => (
              <li key={tip.key} className="help-tip">
                <span className="help-tip-icon" aria-hidden="true">{tip.icon}</span>
                <div className="help-tip-text">
                  <strong>{t(`help.${tip.key}.title`)}</strong>
                  <p>{t(`help.${tip.key}.body`)}</p>
                </div>
              </li>
            ))}
          </ul>
          <p className="help-reopen-hint">{t("help.reopenHint")}</p>
        </div>
        <footer className="help-footer">
          <button type="button" className="primary" onClick={handleClose}>
            {t("help.close")}
          </button>
        </footer>
      </section>
    </div>
  );
}

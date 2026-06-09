import { useEffect, useState } from "react";
import { useLang } from "../lib/i18n";

type GreetingType = "morning" | "afternoon" | "evening" | "night";

const STORAGE_KEY = "mkbqa_last_greeting_date";

function getTimePeriod(): GreetingType {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 21) return "evening";
  return "night";
}

function shouldShowGreeting(): boolean {
  const lastShown = localStorage.getItem(STORAGE_KEY);
  if (!lastShown) return true;

  const lastDate = new Date(lastShown);
  const today = new Date();

  return (
    lastDate.getFullYear() !== today.getFullYear() ||
    lastDate.getMonth() !== today.getMonth() ||
    lastDate.getDate() !== today.getDate()
  );
}

function markGreetingShown() {
  localStorage.setItem(STORAGE_KEY, new Date().toISOString());
}

export { shouldShowGreeting };

type Props = {
  onClose: () => void;
};

export default function GreetingModal({ onClose }: Props) {
  const { t } = useLang();
  const [visible, setVisible] = useState(false);
  const period = getTimePeriod();
  const title = t(`greet.${period}.title`);
  const message = t(`greet.${period}.message`);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  function handleClose() {
    setVisible(false);
    setTimeout(() => {
      markGreetingShown();
      onClose();
    }, 200);
  }

  return (
    <div className={`greeting-backdrop ${visible ? "visible" : ""}`} role="presentation" onClick={handleClose}>
      <section
        className={`greeting-dialog ${visible ? "visible" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="greeting-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="greeting-content">
          <h2 id="greeting-title">{title}</h2>
          <p>{message}</p>
        </div>
        <div className="dialog-actions">
          <button type="button" className="primary" onClick={handleClose}>
            {t("greet.cta")}
          </button>
        </div>
      </section>
    </div>
  );
}

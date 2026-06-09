import { FormEvent, useEffect, useRef, useState } from "react";
import { api, User } from "../lib/api";
import TechBackground from "../components/TechBackground";
import Logo from "../components/Logo";
import { useLang } from "../lib/i18n";

const REMEMBERED_EMAIL_KEY = "mkbqa_remembered_email";
const DARK_MODE_KEY = "mkbqa_dark_mode";
const THEME_TOGGLE_COOLDOWN_MS = 500;

function pickInitialDarkMode(): boolean {
  const stored = localStorage.getItem(DARK_MODE_KEY);
  if (stored === "true") return true;
  if (stored === "false") return false;
  const hour = new Date().getHours();
  return hour < 6 || hour >= 18;
}

type Props = {
  onLogin: (token: string, user?: User, rememberMe?: boolean) => void;
};

function asciiOnly(value: string) {
  return value.replace(/[^\x20-\x7E]/g, "");
}

function browserHasNativePasswordReveal(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  return /Edg\/|Edge\/|Trident\/|MSIE /.test(ua);
}

export default function LoginPage({ onLogin }: Props) {
  const { t, lang, toggleLang, locked: langLocked } = useLang();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState(() => {
    // 从 localStorage 读取上次记住的邮箱
    return localStorage.getItem(REMEMBERED_EMAIL_KEY) ?? "";
  });
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [darkMode, setDarkMode] = useState(pickInitialDarkMode);
  const [hasNativeReveal] = useState(browserHasNativePasswordReveal);
  const [themeToggleLocked, setThemeToggleLocked] = useState(false);
  const themeCooldownTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (themeCooldownTimer.current) {
        window.clearTimeout(themeCooldownTimer.current);
      }
    };
  }, []);

  function toggleTheme() {
    if (themeToggleLocked) return;
    document.documentElement.classList.add("theme-transitioning");
    setDarkMode((current) => !current);
    setThemeToggleLocked(true);
    themeCooldownTimer.current = window.setTimeout(() => {
      setThemeToggleLocked(false);
      document.documentElement.classList.remove("theme-transitioning");
      themeCooldownTimer.current = null;
    }, THEME_TOGGLE_COOLDOWN_MS);
  }

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark-mode");
      localStorage.setItem(DARK_MODE_KEY, "true");
    } else {
      document.documentElement.classList.remove("dark-mode");
      localStorage.setItem(DARK_MODE_KEY, "false");
    }
  }, [darkMode]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      let user: User | undefined;
      if (mode === "register") {
        user = await api.register(email, password);
      }
      const token = await api.login(email, password);
      
      // 如果勾选了 Remember Me，保存邮箱到 localStorage
      if (rememberMe) {
        localStorage.setItem(REMEMBERED_EMAIL_KEY, email);
      } else {
        localStorage.removeItem(REMEMBERED_EMAIL_KEY);
      }
      
      onLogin(token.access_token, user, rememberMe);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("login.failed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="login-layout">
      <TechBackground />
      <div className="login-page-toggles">
        <button
          className="ghost theme-toggle login-page-theme-toggle"
          onClick={toggleTheme}
          disabled={themeToggleLocked}
          aria-label={darkMode ? t("toggle.theme.toLight") : t("toggle.theme.toDark")}
        >
          {darkMode ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>
        <button
          className="ghost lang-toggle login-page-lang-toggle"
          onClick={toggleLang}
          disabled={langLocked}
          aria-label={lang === "en" ? t("toggle.lang.toZh") : t("toggle.lang.toEn")}
          title={lang === "en" ? t("toggle.lang.toZh") : t("toggle.lang.toEn")}
        >
          <span className="lang-toggle-label">{lang === "en" ? "中" : "EN"}</span>
        </button>
      </div>
      <section className="login-panel">
        <div className="login-header">
          <Logo size={48} className="login-logo" />
          <h1>{t("brand.title")}</h1>
        </div>
        <p>{t("login.subtitle")}</p>
        <form onSubmit={submit}>
          <label>
            {t("login.email")}
            <input
              type="email"
              value={email}
              inputMode="email"
              autoComplete="email"
              onChange={(event) => setEmail(asciiOnly(event.target.value))}
              required
            />
          </label>
          <label className="password-label">
            {t("login.password")}
            <div className="password-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                minLength={8}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                onChange={(event) => setPassword(asciiOnly(event.target.value))}
                required
              />
              {!hasNativeReveal && (
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? t("login.hidePassword") : t("login.showPassword")}
              >
                {showPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
              )}
            </div>
          </label>
          {mode === "login" ? (
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(event) => setRememberMe(event.target.checked)}
              />
              <span>{t("login.rememberMe")}</span>
            </label>
          ) : null}
          {error ? <div className="error-banner">{error}</div> : null}
          <button className="primary" disabled={busy}>
            {busy ? t("login.working") : mode === "login" ? t("login.logIn") : t("login.createAccount")}
          </button>
        </form>
        <button className="link-button" onClick={() => setMode(mode === "login" ? "register" : "login")}>
          {mode === "login" ? t("login.toRegister") : t("login.toLogin")}
        </button>
      </section>
    </main>
  );
}

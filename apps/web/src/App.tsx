import { useEffect, useRef, useState } from "react";
import { api, User } from "./lib/api";
import LoginPage from "./pages/LoginPage";
import DocumentsPage from "./pages/DocumentsPage";
import ChatPage from "./pages/ChatPage";
import GreetingModal, { shouldShowGreeting } from "./components/GreetingModal";
import HelpModal from "./components/HelpModal";
import Logo from "./components/Logo";
import { useLang } from "./lib/i18n";

type View = "documents" | "chat";

const TOKEN_KEY = "mkbqa_token";
const REMEMBER_ME_KEY = "mkbqa_remember_me";
const DARK_MODE_KEY = "mkbqa_dark_mode";
const VIEW_KEY = "mkbqa_view";
const HELP_SEEN_KEY = "mkbqa_help_seen_v2";
const THEME_TOGGLE_COOLDOWN_MS = 500;

function pickInitialDarkMode(): boolean {
  const stored = localStorage.getItem(DARK_MODE_KEY);
  if (stored === "true") return true;
  if (stored === "false") return false;
  const hour = new Date().getHours();
  return hour < 6 || hour >= 18;
}

function pickInitialView(): View {
  const stored = localStorage.getItem(VIEW_KEY);
  return stored === "chat" ? "chat" : "documents";
}

export default function App() {
  const { t, lang, toggleLang, locked: langLocked } = useLang();
  const [token, setToken] = useState(() => {
    const savedToken = localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
    return savedToken ?? "";
  });
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<View>(pickInitialView);
  const [booting, setBooting] = useState(Boolean(token));
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [showGreeting, setShowGreeting] = useState(false);
  const [greetingPending, setGreetingPending] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [darkMode, setDarkMode] = useState(pickInitialDarkMode);
  const [themeToggleLocked, setThemeToggleLocked] = useState(false);
  const themeCooldownTimer = useRef<number | null>(null);

  useEffect(() => {
    localStorage.setItem(VIEW_KEY, view);
  }, [view]);

  useEffect(() => {
    if (!token) return;
    if (localStorage.getItem(HELP_SEEN_KEY) === "true") return;
    // 触发 help 由 api.me().then() 和 closeGreeting() 集中处理,
    // 这里不再额外弹出,避免与 greeting 抢顺序。
  }, [token]);

  function closeGreeting() {
    setShowGreeting(false);
    setGreetingPending(false);
    if (token && localStorage.getItem(HELP_SEEN_KEY) !== "true") {
      setShowHelp(true);
    }
  }

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

  useEffect(() => {
    if (!token) {
      setBooting(false);
      return;
    }
    setGreetingPending(true);
    api
      .me(token)
      .then((userData) => {
        setUser(userData);
        const wantHelp = localStorage.getItem(HELP_SEEN_KEY) !== "true";
        if (shouldShowGreeting()) {
          setShowGreeting(true);
        } else {
          setGreetingPending(false);
          if (wantHelp) setShowHelp(true);
        }
      })
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        sessionStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(REMEMBER_ME_KEY);
        setToken("");
      })
      .finally(() => setBooting(false));
  }, [token]);

  function handleLogin(nextToken: string, nextUser?: User, rememberMe?: boolean) {
    if (rememberMe) {
      localStorage.setItem(TOKEN_KEY, nextToken);
      localStorage.setItem(REMEMBER_ME_KEY, "true");
    } else {
      sessionStorage.setItem(TOKEN_KEY, nextToken);
      localStorage.removeItem(REMEMBER_ME_KEY);
    }
    setToken(nextToken);
    if (nextUser) {
      setUser(nextUser);
    }
  }

  function handleLogout() {
    setLogoutConfirmOpen(true);
  }

  function confirmLogout() {
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REMEMBER_ME_KEY);
    localStorage.removeItem("mkbqa_chat_messages");
    setToken("");
    setUser(null);
    setView("documents");
    setLogoutConfirmOpen(false);
  }

  function closeHelp() {
    localStorage.setItem(HELP_SEEN_KEY, "true");
    setShowHelp(false);
  }

  if (booting) {
    return <main className="app-shell center">{t("app.loading")}</main>;
  }

  if (!token) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <button
          type="button"
          className="brand-panel brand-panel-button"
          onClick={() => setShowHelp(true)}
          aria-label={t("help.openTitle")}
          title={t("help.openTitle")}
        >
          <Logo size={36} className="topbar-logo" />
          <div className="brand-text">
            <h1>{t("brand.title")}</h1>
            <p>{user?.email ?? t("brand.localWorkspace")}</p>
          </div>
        </button>
        <nav className="tabs" aria-label="Primary">
          <button
            className="ghost theme-toggle"
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
            className="ghost lang-toggle"
            onClick={toggleLang}
            disabled={langLocked}
            aria-label={lang === "en" ? t("toggle.lang.toZh") : t("toggle.lang.toEn")}
            title={lang === "en" ? t("toggle.lang.toZh") : t("toggle.lang.toEn")}
          >
            <span className="lang-toggle-label">{lang === "en" ? "中" : "EN"}</span>
          </button>
          <button className={view === "documents" ? "active" : ""} onClick={() => setView("documents")}>
            {t("nav.documents")}
          </button>
          <button className={view === "chat" ? "active" : ""} onClick={() => setView("chat")}>
            {t("nav.ask")}
          </button>
          <button className="ghost" onClick={handleLogout}>
            {t("nav.logout")}
          </button>
        </nav>
      </header>
      <div className={`view-pane${view === "documents" ? " active" : ""}`} aria-hidden={view !== "documents"}>
        <DocumentsPage token={token} />
      </div>
      <div className={`view-pane${view === "chat" ? " active" : ""}`} aria-hidden={view !== "chat"}>
        <ChatPage token={token} />
      </div>
      {showGreeting ? <GreetingModal onClose={closeGreeting} /> : null}
      {showHelp ? <HelpModal onClose={closeHelp} /> : null}
      {logoutConfirmOpen ? (
        <div className="modal-backdrop" role="presentation">
          <section className="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="logout-confirm-title">
            <div>
              <h2 id="logout-confirm-title">{t("logout.confirmTitle")}</h2>
              <p>{t("logout.confirmBody")}</p>
            </div>
            <div className="dialog-actions">
              <button type="button" onClick={() => setLogoutConfirmOpen(false)}>
                {t("common.cancel")}
              </button>
              <button type="button" className="primary" onClick={confirmLogout}>
                {t("nav.logout")}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}

import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

export type Lang = "en" | "zh";

const LANG_KEY = "mkbqa_lang";

type Dict = Record<string, string>;

const en: Dict = {
  // Brand
  "brand.title": "Knowledge Base QA",
  "brand.localWorkspace": "Local workspace",

  // Theme & language toggles
  "toggle.theme.toLight": "Switch to light mode",
  "toggle.theme.toDark": "Switch to dark mode",
  "toggle.lang.toZh": "Switch to Chinese",
  "toggle.lang.toEn": "Switch to English",

  // App shell / nav
  "app.loading": "Loading workspace...",
  "nav.documents": "Documents",
  "nav.ask": "Ask",
  "nav.logout": "Log out",
  "logout.confirmTitle": "Confirm log out",
  "logout.confirmBody": "You will return to the sign-in page.",
  "common.cancel": "Cancel",

  // Login
  "login.subtitle": "Sign in to manage local documents and ask questions with citations.",
  "login.email": "Email",
  "login.password": "Password",
  "login.rememberMe": "Remember me",
  "login.working": "Working...",
  "login.logIn": "Log in",
  "login.createAccount": "Create account",
  "login.toRegister": "Create a new account",
  "login.toLogin": "Use an existing account",
  "login.failed": "Authentication failed",
  "login.showPassword": "Show password",
  "login.hidePassword": "Hide password",

  // Documents page
  "docs.title": "Documents",
  "docs.subtitleCount": "{count} files in this local knowledge base",
  "docs.searchPlaceholder": "Search by file name",
  "docs.loading": "Loading documents...",
  "docs.loadFailed": "Could not load documents",
  "docs.noMatches": "No documents match the current filter.",
  "docs.deleteFailed": "Delete failed",
  "docs.reprocessFailed": "Reprocess failed",
  "docs.confirmDeleteTitle": "Confirm delete",
  "docs.confirmDeleteBody": "Delete {name} from this knowledge base?",
  "docs.delete": "Delete",
  "docs.reprocess": "Reprocess",

  // Stats cards
  "stats.documents": "Documents",
  "stats.totalSize": "Total size",
  "stats.indexed": "Indexed",
  "stats.lastUpload": "Last upload",

  // Time
  "time.justNow": "Just now",
  "time.minutesAgo": "{n}m ago",
  "time.hoursAgo": "{n}h ago",
  "time.daysAgo": "{n}d ago",

  // Document meta
  "doc.type": "Type",
  "doc.size": "Size",
  "doc.updated": "Updated",

  // Status badges
  "status.uploaded": "uploaded",
  "status.processing": "processing",
  "status.indexed": "indexed",
  "status.failed": "failed",

  // Upload panel
  "upload.title": "Upload document",
  "upload.subtitle": "PDF, text, and image files are processed locally by the API.",
  "upload.choose": "Choose a file",
  "upload.formats": "TXT, PDF, PNG, JPG, JPEG",
  "upload.confirm": "Confirm upload",
  "upload.busyTitle": "Uploading and indexing...",
  "upload.busySubtitle": "Extracting text · embedding chunks · building index",
  "upload.unsupported": "Supported formats: TXT, PDF, PNG, JPG.",
  "upload.failed": "Upload failed",

  // Ask / chat
  "ask.title": "Ask",
  "ask.subtitle": "Answers include the local chunks used as evidence.",
  "ask.placeholder": "Ask about your uploaded documents",
  "ask.send": "Send message",
  "ask.preparing": "AI is preparing an answer",
  "ask.stop": "Stop generating",
  "ask.paused": "Answer paused",
  "ask.copy": "Copy",
  "ask.copyAria": "Copy answer",
  "ask.copied": "Answer copied",
  "ask.suggest.label": "Try asking",
  "ask.welcome.indexedRequired": "Ask a question after at least one document is indexed.",
  "ask.queryFailed": "Question failed",
  "ask.clear": "Clear chat",
  "ask.clearConfirmTitle": "Clear all messages?",
  "ask.clearConfirmBody": "All messages in this chat will be removed from this device. This cannot be undone.",
  "ask.clearConfirm": "Clear",

  // Welcome messages
  "welcome.0": "Hi! Drop a question and I'll dig through your documents for the answer.",
  "welcome.1": "Hello there. Upload a file if you haven't, then ask me anything about it.",
  "welcome.2": "Welcome back. What would you like to know from your knowledge base today?",
  "welcome.3": "Ready when you are. Ask anything about your indexed documents.",
  "welcome.4": "Hey! Every answer I give comes with citations so you can verify it.",
  "welcome.5": "Let's get started. Type a question below and I'll search your documents.",
  "welcome.6": "Curious about something in your files? Ask away.",
  "welcome.7": "I'm here to help you make sense of your uploaded materials. Fire away.",

  // Suggested questions
  "suggest.0": "Summarize the key points of my documents.",
  "suggest.1": "What are the main topics covered?",
  "suggest.2": "Find a quote that supports the main idea.",
  "suggest.3": "Are there any contradictions between the documents?",
  "suggest.4": "Give me a short overview of each file.",
  "suggest.5": "What questions can these documents answer?",

  // Citations
  "cite.none": "No citations returned.",
  "cite.pageScore": "Page {page} · Score {score}",
  "cite.pageNA": "N/A",

  // Greeting modal
  "greet.morning.title": "☀️ Good Morning!",
  "greet.morning.message": "Start your day with knowledge. What would you like to explore today?",
  "greet.afternoon.title": "🌤️ Good Afternoon!",
  "greet.afternoon.message": "Hope your day is going well. Ready to dive into your documents?",
  "greet.evening.title": "🌆 Good Evening!",
  "greet.evening.message": "Time to wrap up or continue learning. How can I help you?",
  "greet.night.title": "🌙 Good Night!",
  "greet.night.message": "Working late? Make sure to take breaks. What's on your mind?",
  "greet.cta": "Let's Go!",

  // Help / user manual
  "help.openTitle": "Open user guide",
  "help.title": "Quick Start Guide",
  "help.subtitle": "Get answers from your local documents in four short steps.",
  "help.section.start": "Getting started",
  "help.step1.title": "1. Upload a document",
  "help.step1.body": "Open the Documents page and choose a TXT, PDF, or image file. The local API extracts text and stores it under data/.",
  "help.step2.title": "2. Wait for indexing",
  "help.step2.body": "Once a file shows the indexed badge, its text has been chunked, embedded, and is ready to search. Most files finish in seconds.",
  "help.step3.title": "3. Ask in plain language",
  "help.step3.body": "Switch to the Ask page, type a question, and press Enter. Hit the suggestion chips for quick starters or stop generation any time with the pause button.",
  "help.step4.title": "4. Verify with citations",
  "help.step4.body": "Each answer comes with the chunks it relied on. Click a citation to expand the original text and see the source document and page.",
  "help.section.tips": "Good to know",
  "help.tip.theme.title": "Theme",
  "help.tip.theme.body": "Use the sun/moon button in the top-right to switch between light and dark mode. The app picks a default based on the time of day on first visit.",
  "help.tip.lang.title": "Language",
  "help.tip.lang.body": "Toggle between English and Chinese with the EN/中 button next to the theme switch. Your choice is remembered across sessions.",
  "help.tip.copy.title": "Copy and reuse",
  "help.tip.copy.body": "Hover any AI answer to reveal a Copy button. Citations and answer text are also selectable so you can quote them directly.",
  "help.tip.privacy.title": "Stays local",
  "help.tip.privacy.body": "Documents, embeddings, and indexes live on your machine. Only the question text and retrieved chunks are sent to the LLM endpoint configured in .env.",
  "help.close": "Got it",
  "help.reopenHint": "Click the logo any time to reopen this guide.",
};

const zh: Dict = {
  "brand.title": "知识库问答",
  "brand.localWorkspace": "本地工作区",

  "toggle.theme.toLight": "切换到浅色模式",
  "toggle.theme.toDark": "切换到深色模式",
  "toggle.lang.toZh": "切换到中文",
  "toggle.lang.toEn": "切换到英文",

  "app.loading": "正在加载工作区...",
  "nav.documents": "文档",
  "nav.ask": "提问",
  "nav.logout": "退出登录",
  "logout.confirmTitle": "确认退出",
  "logout.confirmBody": "退出后将返回登录页。",
  "common.cancel": "取消",

  "login.subtitle": "登录后即可管理本地文档,并基于引用得到答案。",
  "login.email": "邮箱",
  "login.password": "密码",
  "login.rememberMe": "记住我",
  "login.working": "处理中...",
  "login.logIn": "登录",
  "login.createAccount": "注册账号",
  "login.toRegister": "创建新账号",
  "login.toLogin": "使用已有账号登录",
  "login.failed": "认证失败",
  "login.showPassword": "显示密码",
  "login.hidePassword": "隐藏密码",

  "docs.title": "文档",
  "docs.subtitleCount": "本地知识库中共 {count} 个文件",
  "docs.searchPlaceholder": "按文件名搜索",
  "docs.loading": "正在加载文档...",
  "docs.loadFailed": "无法加载文档",
  "docs.noMatches": "没有匹配当前筛选条件的文档。",
  "docs.deleteFailed": "删除失败",
  "docs.reprocessFailed": "重新处理失败",
  "docs.confirmDeleteTitle": "确认删除",
  "docs.confirmDeleteBody": "确定要从知识库中删除 {name} 吗?",
  "docs.delete": "删除",
  "docs.reprocess": "重新处理",

  "stats.documents": "文档数",
  "stats.totalSize": "总大小",
  "stats.indexed": "已索引",
  "stats.lastUpload": "最近上传",

  "time.justNow": "刚刚",
  "time.minutesAgo": "{n} 分钟前",
  "time.hoursAgo": "{n} 小时前",
  "time.daysAgo": "{n} 天前",

  "doc.type": "类型",
  "doc.size": "大小",
  "doc.updated": "更新时间",

  "status.uploaded": "已上传",
  "status.processing": "处理中",
  "status.indexed": "已索引",
  "status.failed": "失败",

  "upload.title": "上传文档",
  "upload.subtitle": "PDF、文本和图片文件都将由本地 API 处理。",
  "upload.choose": "选择文件",
  "upload.formats": "TXT、PDF、PNG、JPG、JPEG",
  "upload.confirm": "确认上传",
  "upload.busyTitle": "正在上传并建立索引...",
  "upload.busySubtitle": "提取文本 · 生成向量 · 建立索引",
  "upload.unsupported": "支持格式:TXT、PDF、PNG、JPG。",
  "upload.failed": "上传失败",

  "ask.title": "提问",
  "ask.subtitle": "回答会附带作为依据的本地文本片段。",
  "ask.placeholder": "针对你上传的文档提问",
  "ask.send": "发送消息",
  "ask.preparing": "AI 正在生成回答",
  "ask.stop": "停止生成",
  "ask.paused": "回答已被暂停",
  "ask.copy": "复制",
  "ask.copyAria": "复制回答",
  "ask.copied": "已复制回答",
  "ask.suggest.label": "试试问",
  "ask.welcome.indexedRequired": "至少索引一个文档后再开始提问。",
  "ask.queryFailed": "提问失败",
  "ask.clear": "清空聊天",
  "ask.clearConfirmTitle": "确认清空所有消息?",
  "ask.clearConfirmBody": "本机上的全部聊天记录将被删除,此操作无法撤销。",
  "ask.clearConfirm": "清空",

  "welcome.0": "你好!写下一个问题,我去你的文档里翻翻找答案。",
  "welcome.1": "嗨,如果还没上传文档,先上传一份,然后就可以问任何相关问题。",
  "welcome.2": "欢迎回来。今天想从你的知识库里了解些什么?",
  "welcome.3": "随时待命。想问关于已索引文档的什么都行。",
  "welcome.4": "嘿!我每条回答都会附上引用,方便你溯源核实。",
  "welcome.5": "开始吧。在下方输入问题,我会去搜索你的文档。",
  "welcome.6": "对你的文件好奇?直接问就行。",
  "welcome.7": "我来帮你梳理上传的资料,有问题尽管说。",

  "suggest.0": "总结一下我文档中的要点。",
  "suggest.1": "主要涉及哪些主题?",
  "suggest.2": "找一段支持核心观点的引用。",
  "suggest.3": "这些文档之间是否存在矛盾?",
  "suggest.4": "给每个文件一个简短概述。",
  "suggest.5": "这些文档可以回答哪些问题?",

  "cite.none": "未返回引用。",
  "cite.pageScore": "第 {page} 页 · 相关度 {score}",
  "cite.pageNA": "未知",

  "greet.morning.title": "☀️ 早上好!",
  "greet.morning.message": "用知识开启新的一天,今天想探索点什么?",
  "greet.afternoon.title": "🌤️ 下午好!",
  "greet.afternoon.message": "希望你今天过得顺利,准备深入文档了吗?",
  "greet.evening.title": "🌆 晚上好!",
  "greet.evening.message": "时间不早了,今天还要继续学习吗?",
  "greet.night.title": "🌙 晚安!",
  "greet.night.message": "还在熬夜?记得休息一下。在想些什么呢?",
  "greet.cta": "出发!",

  "help.openTitle": "打开使用说明",
  "help.title": "快速上手指南",
  "help.subtitle": "四步即可基于本地文档得到带引用的回答。",
  "help.section.start": "开始使用",
  "help.step1.title": "1. 上传一份文档",
  "help.step1.body": "在 Documents(文档)页选择 TXT、PDF 或图片文件。本地 API 会自动提取文字并保存到 data/ 目录下。",
  "help.step2.title": "2. 等待索引完成",
  "help.step2.body": "文件状态变为 indexed(已索引)后,文本已经分块、嵌入,可以被检索。大多数文件几秒内即可完成。",
  "help.step3.title": "3. 用自然语言提问",
  "help.step3.body": "切到 Ask(提问)页输入问题并回车。可以点示例胶囊快速开始;生成中可以随时点暂停按钮中断回答。",
  "help.step4.title": "4. 通过引用验证",
  "help.step4.body": "每条回答都会附带它所依据的文本片段。点击引用即可展开原文,看到来源文件名和页码。",
  "help.section.tips": "贴士",
  "help.tip.theme.title": "主题切换",
  "help.tip.theme.body": "右上角的太阳/月亮按钮可以切换浅色/深色模式。首次访问会按当前时间自动选择。",
  "help.tip.lang.title": "语言切换",
  "help.tip.lang.body": "主题按钮右边的 EN / 中 按钮在中英文之间切换,选择会跨会话保留。",
  "help.tip.copy.title": "复制与引用",
  "help.tip.copy.body": "鼠标悬停在 AI 回答上会出现复制按钮。回答正文和引用片段都可以选中,方便直接引用。",
  "help.tip.privacy.title": "数据本地保存",
  "help.tip.privacy.body": "文档、嵌入和索引都保存在你本机。只有问题文本和检索到的片段会发送给 .env 中配置的大模型接口。",
  "help.close": "知道了",
  "help.reopenHint": "随时点击左上角图标重新打开本说明书。",
};

const dictionaries: Record<Lang, Dict> = { en, zh };

function detectInitialLang(): Lang {
  if (typeof window === "undefined") return "en";
  const stored = localStorage.getItem(LANG_KEY);
  if (stored === "en" || stored === "zh") return stored;
  const navLang = (navigator.language || "").toLowerCase();
  if (navLang.startsWith("zh")) return "zh";
  return "en";
}

type LangContextValue = {
  lang: Lang;
  setLang: (next: Lang) => void;
  toggleLang: () => void;
  locked: boolean;
  t: (key: string, vars?: Record<string, string | number>) => string;
};

const LangContext = createContext<LangContextValue | null>(null);

const LANG_TOGGLE_COOLDOWN_MS = 600;
const LANG_TRANSITION_CLASS = "lang-transitioning";

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(detectInitialLang);
  const [locked, setLocked] = useState(false);
  const cooldownTimer = useRef<number | null>(null);

  useEffect(() => {
    document.documentElement.setAttribute("lang", lang === "zh" ? "zh-CN" : "en");
    localStorage.setItem(LANG_KEY, lang);
  }, [lang]);

  useEffect(() => {
    return () => {
      if (cooldownTimer.current) {
        window.clearTimeout(cooldownTimer.current);
        cooldownTimer.current = null;
      }
    };
  }, []);

  const setLang = useCallback((next: Lang) => {
    setLangState((current) => {
      if (current === next) return current;
      return next;
    });
  }, []);

  const toggleLang = useCallback(() => {
    if (locked) return;
    setLocked(true);
    if (typeof document !== "undefined") {
      document.documentElement.classList.add(LANG_TRANSITION_CLASS);
    }
    setLangState((current) => (current === "en" ? "zh" : "en"));
    cooldownTimer.current = window.setTimeout(() => {
      if (typeof document !== "undefined") {
        document.documentElement.classList.remove(LANG_TRANSITION_CLASS);
      }
      setLocked(false);
      cooldownTimer.current = null;
    }, LANG_TOGGLE_COOLDOWN_MS);
  }, [locked]);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      const dict = dictionaries[lang];
      let value = dict[key] ?? dictionaries.en[key] ?? key;
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          value = value.split(`{${k}}`).join(String(v));
        }
      }
      return value;
    },
    [lang],
  );

  const value = useMemo<LangContextValue>(
    () => ({ lang, setLang, toggleLang, locked, t }),
    [lang, setLang, toggleLang, locked, t],
  );

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang(): LangContextValue {
  const ctx = useContext(LangContext);
  if (!ctx) {
    throw new Error("useLang must be used inside LanguageProvider");
  }
  return ctx;
}

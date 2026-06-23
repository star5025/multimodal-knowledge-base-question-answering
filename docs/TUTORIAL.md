# 多模态个人知识库问答系统 - 核心技术实现教程

> 本教程聚焦项目的核心技术亮点，面向具备计算机专业基础的开发者。

## 目录

1. [项目架构概览](#1-项目架构概览)
2. [核心技术一：多模态文档处理](#2-核心技术一多模态文档处理)
3. [核心技术二：RAG 检索增强生成](#3-核心技术二rag-检索增强生成)
4. [核心技术三：前后端通信机制](#4-核心技术三前后端通信机制)
5. [核心技术四：用户认证与安全](#5-核心技术四用户认证与安全)
6. [核心技术五：前端状态管理](#6-核心技术五前端状态管理)

---

## 1. 项目架构概览

### 1.1 技术栈

**后端：**
- FastAPI（异步 Web 框架）
- SQLModel（ORM，基于 SQLAlchemy + Pydantic）
- BM25（信息检索算法）
- DeepSeek API（大语言模型）
- 腾讯云 OCR API（图像文字识别）

**前端：**
- React 18 + TypeScript
- Vite（构建工具）
- Context API（状态管理）

### 1.2 数据流

```
用户上传文件 → 文件类型识别 → 内容提取（PDF/TXT/OCR）
→ 文本分块 → 本地存储 → BM25 索引

用户提问 → BM25 检索 top-k 文档块 → 构建 Prompt
→ 调用 LLM → 解析引用 → 返回答案 + 来源
```

---

## 2. 核心技术一：多模态文档处理

### 2.1 技术挑战

不同格式文件需要不同的处理策略：
- **TXT**：直接读取
- **PDF**：使用 PyPDF2 提取文本
- **图片（PNG/JPG/JPEG）**：调用 OCR API 识别文字

### 2.2 实现方案

**文件处理服务（document_processor.py）**

```python
class DocumentProcessor:
    def process_file(self, file_path: str, mime_type: str) -> str:
        """根据文件类型调用对应的处理方法"""
        if mime_type == "text/plain":
            return self._process_text(file_path)
        elif mime_type == "application/pdf":
            return self._process_pdf(file_path)
        elif mime_type in ["image/png", "image/jpeg"]:
            return self._process_image(file_path)
        else:
            raise ValueError(f"Unsupported file type: {mime_type}")
    
    def _process_pdf(self, file_path: str) -> str:
        """使用 PyPDF2 提取 PDF 文本"""
        text = ""
        with open(file_path, "rb") as f:
            reader = PyPDF2.PdfReader(f)
            for page in reader.pages:
                text += page.extract_text()
        return text
    
    def _process_image(self, file_path: str) -> str:
        """调用 OCR 服务识别图片文字"""
        return ocr_service.recognize(file_path)
```

**OCR 服务（ocr_service.py）**

```python
from tencentcloud.ocr.v20181119 import ocr_client, models
import base64

class OCRService:
    def __init__(self, secret_id: str, secret_key: str, region: str):
        cred = credential.Credential(secret_id, secret_key)
        self.client = ocr_client.OcrClient(cred, region)
    
    def recognize(self, image_path: str) -> str:
        """调用腾讯云通用 OCR 识别图片文字"""
        with open(image_path, "rb") as f:
            image_base64 = base64.b64encode(f.read()).decode()
        
        req = models.GeneralBasicOCRRequest()
        req.ImageBase64 = image_base64
        
        resp = self.client.GeneralBasicOCR(req)
        
        # 拼接识别结果
        text = "\n".join([item.DetectedText for item in resp.TextDetections])
        return text
```

### 2.3 文本分块策略

**技术要点：**
- 长文本需要切分成适合检索的小块
- 每块包含足够的上下文信息
- 避免在句子中间切断

**实现（chunking_service.py）：**

```python
class ChunkingService:
    def chunk_text(self, text: str, chunk_size: int = 500, overlap: int = 50) -> list[str]:
        """
        固定长度分块，带重叠窗口
        
        Args:
            text: 原始文本
            chunk_size: 每块字符数
            overlap: 块之间重叠字符数
        """
        chunks = []
        start = 0
        text_length = len(text)
        
        while start < text_length:
            end = start + chunk_size
            chunk = text[start:end]
            chunks.append(chunk.strip())
            start += chunk_size - overlap  # 滑动窗口
        
        return chunks
```

**为什么需要 overlap？**
- 避免关键信息被切断在两块之间
- 提高检索召回率

---

## 3. 核心技术二：RAG 检索增强生成

### 3.1 RAG 原理

传统 LLM 问答的问题：
- 知识截止日期固定
- 容易产生幻觉（编造信息）
- 无法回答私有领域问题

RAG 的解决方案：
1. 从用户的知识库检索相关文档
2. 将检索结果作为上下文提供给 LLM
3. LLM 基于上下文生成回答

### 3.2 BM25 检索实现

**核心代码（vector_service.py）：**

```python
from rank_bm25 import BM25Okapi
import jieba

class VectorService:
    def __init__(self):
        self.bm25 = None
        self.chunks = []
    
    def build_index(self, chunks: list[str]):
        """构建 BM25 索引"""
        # 使用 jieba 分词
        tokenized_chunks = [list(jieba.cut(chunk)) for chunk in chunks]
        self.bm25 = BM25Okapi(tokenized_chunks)
        self.chunks = chunks
    
    def search(self, query: str, top_k: int = 3) -> list[str]:
        """检索最相关的 top-k 个文档块"""
        tokenized_query = list(jieba.cut(query))
        scores = self.bm25.get_scores(tokenized_query)
        
        # 获取 top-k 索引
        top_indices = sorted(range(len(scores)), key=lambda i: scores[i], reverse=True)[:top_k]
        
        return [self.chunks[i] for i in top_indices]
```

**BM25 算法简述：**
- 基于词频（TF）和逆文档频率（IDF）
- 引入文档长度归一化，避免偏向长文档
- 参数 `k1` 控制词频饱和度，`b` 控制长度归一化程度

### 3.3 Prompt 工程

**核心思想：** 将检索结果嵌入到 Prompt 中，引导 LLM 基于事实回答。

**实现（llm_service.py）：**

```python
class LLMService:
    def generate_answer(self, query: str, context_chunks: list[str]) -> str:
        """基于检索上下文生成答案"""
        
        # 构建上下文
        context = "\n\n".join([
            f"[文档片段 {i+1}]\n{chunk}" 
            for i, chunk in enumerate(context_chunks)
        ])
        
        # Prompt 模板
        prompt = f"""你是一个知识库问答助手。请根据以下文档内容回答用户问题。

文档内容：
{context}

用户问题：{query}

回答要求：
1. 只基于提供的文档内容回答
2. 如果文档中没有相关信息，明确说明
3. 引用来源时使用格式：[文档片段 X]

答案："""
        
        # 调用 DeepSeek API
        response = self._call_deepseek_api(prompt)
        return response
```

**关键技术点：**
- 明确指示 LLM 不要编造信息
- 要求标注引用来源
- 使用结构化的上下文格式

### 3.4 引用解析

**实现（rag_service.py）：**

```python
def parse_citations(self, answer: str, chunks: list[str]) -> list[dict]:
    """从回答中提取引用并关联原文"""
    import re
    
    # 匹配 [文档片段 X] 格式
    pattern = r'\[文档片段 (\d+)\]'
    matches = re.findall(pattern, answer)
    
    citations = []
    for match in matches:
        idx = int(match) - 1
        if 0 <= idx < len(chunks):
            citations.append({
                "chunk_id": idx,
                "text": chunks[idx]
            })
    
    return citations
```

---

## 4. 核心技术三：前后端通信机制

### 4.1 RESTful API 设计

**接口规范：**

| 功能 | 方法 | 路径 | 说明 |
|------|------|------|------|
| 注册 | POST | `/api/auth/register` | 创建用户 |
| 登录 | POST | `/api/auth/login` | 返回 JWT Token |
| 上传文档 | POST | `/api/documents/upload` | 需要认证 |
| 查询文档 | GET | `/api/documents/` | 返回用户文档列表 |
| 删除文档 | DELETE | `/api/documents/{id}` | 需要认证 |
| 问答 | POST | `/api/qa/ask` | 需要认证 |

### 4.2 前端 API 客户端

**实现（lib/api.ts）：**

```typescript
const API_BASE = "http://127.0.0.1:8000";

class ApiClient {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
    localStorage.setItem("token", token);
  }

  async request(endpoint: string, options: RequestInit = {}) {
    const headers = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    // 添加认证 Header
    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return response.json();
  }

  // 上传文件
  async uploadDocument(file: File) {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${API_BASE}/api/documents/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
      body: formData,
    });

    return response.json();
  }
}
```

**技术要点：**
- 封装统一的请求方法
- 自动附加认证 Token
- 文件上传使用 FormData
- 错误处理统一化

### 4.3 CORS 跨域配置

**问题：** 前端（localhost:5173）和后端（localhost:8000）不同源，浏览器会阻止请求。

**解决方案（main.py）：**

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5173"],  # 允许的前端地址
    allow_credentials=True,                    # 允许携带 Cookie
    allow_methods=["*"],                       # 允许所有 HTTP 方法
    allow_headers=["*"],                       # 允许所有 Header
)
```

---

## 5. 核心技术四：用户认证与安全

### 5.1 密码安全

**技术方案：** 使用 bcrypt 哈希算法存储密码。

**实现（core/security.py）：**

```python
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    """密码哈希"""
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """验证密码"""
    return pwd_context.verify(plain_password, hashed_password)
```

**为什么用 bcrypt？**
- 自动加盐（防彩虹表攻击）
- 计算成本可调（防暴力破解）
- 业界标准方案

### 5.2 JWT 认证

**JWT 结构：**
```
Header.Payload.Signature
```

**生成 Token（core/security.py）：**

```python
from jose import jwt
from datetime import datetime, timedelta

SECRET_KEY = "your-secret-key"
ALGORITHM = "HS256"

def create_access_token(user_id: int) -> str:
    """生成 JWT Token"""
    expire = datetime.utcnow() + timedelta(minutes=1440)  # 24小时
    
    payload = {
        "sub": str(user_id),  # Subject：用户ID
        "exp": expire         # Expiration：过期时间
    }
    
    token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
    return token

def verify_token(token: str) -> int:
    """验证 Token 并返回用户ID"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = int(payload.get("sub"))
        return user_id
    except:
        raise HTTPException(status_code=401, detail="Invalid token")
```

### 5.3 依赖注入认证

**FastAPI 依赖注入：**

```python
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    session: Session = Depends(get_session)
) -> User:
    """从 Token 获取当前用户"""
    token = credentials.credentials
    user_id = verify_token(token)
    
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return user
```

**使用方式：**

```python
@router.post("/upload")
async def upload_document(
    file: UploadFile,
    current_user: User = Depends(get_current_user)  # 自动认证
):
    # current_user 是已认证的用户对象
    pass
```

---

## 6. 核心技术五：前端状态管理

### 6.1 Context API

**技术选择：** 使用 React Context API 而非 Redux，适合中小规模状态管理。

**认证状态管理（App.tsx）：**

```typescript
import React, { createContext, useState, useContext } from "react";

interface AuthContextType {
  token: string | null;
  user: User | null;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("token")
  );
  const [user, setUser] = useState<User | null>(null);

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem("token", newToken);
    api.setToken(newToken);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// 自定义 Hook
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
```

**使用示例：**

```typescript
function LoginPage() {
  const { login } = useAuth();

  const handleLogin = async (username: string, password: string) => {
    const response = await api.login(username, password);
    login(response.access_token, response.user);
  };

  return <form onSubmit={handleLogin}>...</form>;
}
```

### 6.2 国际化（i18n）

**实现（lib/i18n.tsx）：**

```typescript
import React, { createContext, useState, useContext } from "react";

type Language = "en" | "zh";

const translations = {
  en: {
    login: "Login",
    register: "Register",
    upload: "Upload Document",
    ask: "Ask a Question",
  },
  zh: {
    login: "登录",
    register: "注册",
    upload: "上传文档",
    ask: "提出问题",
  },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>("zh");

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
}
```

**使用：**

```typescript
function Header() {
  const { t, language, setLanguage } = useLanguage();

  return (
    <header>
      <h1>{t("appTitle")}</h1>
      <button onClick={() => setLanguage(language === "en" ? "zh" : "en")}>
        {language === "en" ? "中文" : "English"}
      </button>
    </header>
  );
}
```

---

## 总结

本项目的核心技术亮点包括：

1. **多模态处理**：统一处理 TXT、PDF、图片，通过 OCR 实现图片文字识别
2. **RAG 架构**：结合 BM25 检索和 LLM 生成，提供可追溯的答案
3. **文本分块**：固定长度 + 重叠窗口策略，平衡检索粒度和上下文完整性
4. **安全认证**：bcrypt 密码哈希 + JWT Token，保证用户数据安全
5. **前端状态管理**：Context API 实现轻量级全局状态管理
6. **国际化支持**：中英文切换，提升用户体验

**技术架构优势：**
- 本地优先，保护隐私
- 前后端分离，便于扩展
- 模块化设计，职责清晰
- 异步处理，性能优秀

**可优化方向：**
- 引入向量数据库（如 Milvus）替代 BM25
- 使用 Embedding 模型提升语义检索能力
- 添加文档更新/版本管理功能
- 实现多轮对话上下文记忆


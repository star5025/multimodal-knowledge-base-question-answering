# PoC Feature Audit

Verification date: 2026-06-06

| 功能名称 | 已完成 | 未完成 |
| --- | --- | --- |
| 用户注册、登录、当前用户接口和受保护 API | ✅ |  |
| 用户数据隔离：其他用户不能查看或删除本人文档 | ✅ |  |
| TXT/PDF/PNG/JPG/JPEG 上传入口和格式校验 | ✅ |  |
| 文档管理列表：文件名、类型、大小、状态、更新时间、删除、重处理、文件名搜索 | ✅ |  |
| TXT 文本解析、编码兼容和基础清洗 | ✅ |  |
| PDF 文本解析和页码保留 | ✅ |  |
| 图片 OCR：使用腾讯云 GeneralBasicOCR 识别 PNG/JPG/JPEG，并把识别文本写入 extracted txt 后进入 RAG | ✅ |  |
| 文本切块，并保留 document/page/chunk 元数据 | ✅ |  |
| 本地 chunk 持久化和索引 manifest 生成 | ✅ |  |
| BM25 本地关键词排序检索：比简单词重合更稳定，不需要本地大模型或 FAISS | ✅ |  |
| SentenceTransformers/FAISS 语义向量检索：代码有可选路径，但当前依赖未安装，实际运行走 BM25 本地排序 |  | ✅ |
| 本地检索 + RAG 问答流程 | ✅ |  |
| DeepSeek LLM 生成回答 | ✅ |  |
| 回答返回结构化 citation，包括文档名、页码、chunk、预览和 score | ✅ |  |
| 前端 citation 展开预览 | ✅ |  |
| 基础 Web UI：登录/注册、上传页、文档管理页、聊天问答页、结果展示区 | ✅ |  |
| 常见错误处理：不支持格式、空文档、OCR 缺失、LLM 失败 fallback | ✅ |  |
| 原始文件、数据库、提取内容和索引保存在本地目录 | ✅ |  |
| 只把检索到的片段发送给外部 LLM，而不是上传整份文件 | ✅ |  |
| 匿名化查询 |  | ✅ |
| 加密本地存储 |  | ✅ |
| 可切换 LLM 服务商 |  | ✅ |
| 多轮追问时携带历史对话上下文 |  | ✅ |
| Markdown/DOCX/PPTX/CSV/HTML 等扩展格式 |  | ✅ |
| 标签分类和收藏功能（proposal 分工中提到，但不属于 core features） |  | ✅ |
| 评分要求中的 10-15 页用户手册 PDF：已有 README 和运行环境说明，但未见独立用户手册 PDF |  | ✅ |

## Actual Verification Performed

- 后端健康检查通过，DeepSeek 配置为启用状态。
- 前端 Vite 页面可访问，注册了独立演示账号。
- 上传 `codex_poc_sample.txt` 后，文档状态为 `indexed`。
- 通过聊天页真实提问一次，返回 DeepSeek 生成回答，并显示 `codex_poc_sample.txt` citation。
- 展开 citation 后可看到本地检索片段预览。
- 生成并上传 `codex_poc_pdf.pdf` 后，文档状态为 `indexed`，确认 PDF 解析链路可用。
- 已加入腾讯云 GeneralBasicOCR 单元测试，使用 mock 响应验证图片文字可进入文档解析流程。
- 文档处理成功后会保存完整提取文本到 `data/extracted/{document_id}.txt`。
- 后端新增/现有测试共 10 项通过。
- 前端生产构建通过。

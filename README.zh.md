# 多模态个人知识库问答系统

**中文** | [English](./README.md)

## 📚 快速导航

- **[核心技术教程](./TUTORIAL.md)** - 深入讲解 RAG、OCR、BM25 算法及系统架构
- **项目结构：**
  - [`apps/api/`](./apps/api/) - FastAPI 后端，包含文档处理、RAG 检索、LLM 集成
  - [`apps/web/`](./apps/web/) - React + TypeScript 前端，包含文档管理和聊天界面
  - [`docs/`](./docs/) - API 接口文档、架构设计、项目报告
  - [`scripts/`](./scripts/) - 自动化测试与验证脚本
  - [`tools/`](./tools/) - 开发辅助工具脚本

## 重要配置说明

在运行此项目前，请基于 `.env.example` 创建本地 `.env` 文件，并配置所需的 API 密钥。

```powershell
copy .env.example .env
```

然后编辑 `.env` 并填入：

```text
DEEPSEEK_API_KEY=your_deepseek_api_key
TENCENTCLOUD_SECRET_ID=your_tencentcloud_secret_id
TENCENTCLOUD_SECRET_KEY=your_tencentcloud_secret_key
TENCENTCLOUD_REGION=
```

DeepSeek API 密钥用于大语言模型生成回答。腾讯云 SecretId 和 SecretKey 用于通过 GeneralBasicOCR 对图片进行文字识别。


## 项目概述

本项目是一个本地优先的多模态个人知识库问答系统。用户可以上传 TXT、PDF、PNG、JPG 和 JPEG 文件。后端从文档中提取文本，使用腾讯云 OCR 处理图片，将提取的文本存储在本地，构建可检索的文档分块，通过 BM25/RAG 检索相关段落，并通过外部大语言模型生成带引用的回答。

系统包含：

```text
apps/api     FastAPI 后端
apps/web     React + Vite 前端
docs         项目文档
scripts      测试与验证脚本
tools        工具脚本
```

## 运行方式

打开两个 PowerShell 终端。

### 1. 启动后端

在项目根目录下：

```powershell
cd apps\api
uv sync --extra dev
uv run uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

后端健康检查：

```text
http://127.0.0.1:8000/health
```

API 文档：

```text
http://127.0.0.1:8000/docs
```

### 2. 启动前端

在项目根目录下：

```powershell
cd apps\web
npm install
npm run dev
```

打开 Web 应用：

```text
http://127.0.0.1:5173/
```

## 基本使用

1. 注册或登录。
2. 上传 TXT、PDF、PNG、JPG 或 JPEG 文件。
3. 等待文档状态变为 `indexed`。
4. 在聊天页面提出问题。
5. 查看生成的回答及其来源引用。

## 验证

在项目根目录下运行完整的本地验证脚本：

```powershell
.\scripts\test-all.ps1
```

该脚本会运行后端测试以及前端生产构建。

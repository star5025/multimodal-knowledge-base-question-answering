const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";

export type User = {
  id: string;
  email: string;
};

export type DocumentStatus = "uploaded" | "processing" | "indexed" | "failed";

export type KnowledgeDocument = {
  id: string;
  filename: string;
  content_type: string | null;
  file_type: string;
  size_bytes: number;
  status: DocumentStatus;
  error_message: string | null;
  created_at: string;
  updated_at: string;
};

export type Citation = {
  document_id: string;
  document_name: string;
  page: number | null;
  chunk_id: string;
  text_preview: string;
  score: number;
};

export type QueryResponse = {
  answer: string;
  citations: Citation[];
};

async function request<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const headers = new Headers(options.headers);
  if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const data = await response.json();
      message = data.detail || data.error || message;
    } catch {
      message = response.statusText || message;
    }
    throw new Error(message);
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return response.json() as Promise<T>;
}

export const api = {
  register(email: string, password: string) {
    return request<User>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },
  login(email: string, password: string) {
    return request<{ access_token: string; token_type: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },
  me(token: string) {
    return request<User>("/auth/me", {}, token);
  },
  listDocuments(token: string) {
    return request<KnowledgeDocument[]>("/documents", {}, token);
  },
  uploadDocument(token: string, file: File) {
    const form = new FormData();
    form.append("file", file);
    return request<KnowledgeDocument>(
      "/documents/upload",
      {
        method: "POST",
        body: form,
      },
      token
    );
  },
  deleteDocument(token: string, id: string) {
    return request<void>(`/documents/${id}`, { method: "DELETE" }, token);
  },
  reprocessDocument(token: string, id: string) {
    return request<KnowledgeDocument>(`/documents/${id}/reprocess`, { method: "POST" }, token);
  },
  query(token: string, question: string, topK = 5, signal?: AbortSignal) {
    return request<QueryResponse>(
      "/qa/query",
      {
        method: "POST",
        body: JSON.stringify({ question, top_k: topK }),
        signal,
      },
      token
    );
  },
};

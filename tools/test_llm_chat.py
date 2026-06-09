r"""Simple DeepSeek console chat tester.

Run from the repository root:
    python tools/test_llm_chat.py

Or with the backend uv environment:
    cd apps/api
    uv run python ..\..\tools\test_llm_chat.py
"""

from __future__ import annotations

import json
import socket
import sys
import urllib.error
import urllib.request
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]
ENV_PATH = REPO_ROOT / ".env"
DEEPSEEK_URL = "https://api.deepseek.com/chat/completions"
REQUEST_TIMEOUT_SECONDS = 120
MAX_HISTORY_MESSAGES = 20


def load_env(path: Path) -> dict[str, str]:
    values: dict[str, str] = {}
    if not path.exists():
        return values

    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        values[key.strip()] = value.strip().strip('"').strip("'")
    return values


def ask_deepseek(api_key: str, model: str, messages: list[dict[str, str]]) -> str:
    payload = {
        "model": model,
        "messages": messages,
        "temperature": 0.2,
        "stream": False,
    }
    request = urllib.request.Request(
        DEEPSEEK_URL,
        data=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )

    with urllib.request.urlopen(request, timeout=REQUEST_TIMEOUT_SECONDS) as response:
        body = response.read().decode("utf-8")
    data = json.loads(body)
    return data["choices"][0]["message"]["content"].strip()


def main() -> int:
    env = load_env(ENV_PATH)
    api_key = env.get("DEEPSEEK_API_KEY", "")
    model = env.get("DEEPSEEK_MODEL", "deepseek-v4-pro")

    if not api_key:
        print(f"没有找到 DEEPSEEK_API_KEY，请先在 {ENV_PATH} 里填写密钥。")
        return 1

    print("DeepSeek 控制台问答测试")
    print(f"模型: {model}")
    print("输入问题后回车发送；输入 exit / quit / q 退出。")

    messages: list[dict[str, str]] = [
        {"role": "system", "content": "You are a helpful assistant. Answer directly and clearly."}
    ]

    while True:
        try:
            question = input("\n你: ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\n已退出。")
            return 0

        if not question:
            continue
        if question.lower() in {"exit", "quit", "q"}:
            print("已退出。")
            return 0

        messages.append({"role": "user", "content": question})
        try:
            answer = ask_deepseek(api_key, model, messages)
        except (TimeoutError, socket.timeout):
            print("DeepSeek 在 2 分钟内没有回复。你可以继续提问，或稍后再试。")
            continue
        except urllib.error.HTTPError as exc:
            detail = exc.read().decode("utf-8", errors="replace")
            print(f"DeepSeek 请求失败，HTTP {exc.code}: {detail}")
            continue
        except urllib.error.URLError as exc:
            print(f"无法连接 DeepSeek: {exc.reason}")
            continue
        except Exception as exc:
            print(f"调用失败: {type(exc).__name__}: {exc}")
            continue

        print(f"\nDeepSeek: {answer}")
        messages.append({"role": "assistant", "content": answer})
        if len(messages) > MAX_HISTORY_MESSAGES + 1:
            messages = [messages[0], *messages[-MAX_HISTORY_MESSAGES:]]


if __name__ == "__main__":
    raise SystemExit(main())

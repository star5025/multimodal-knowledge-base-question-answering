from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


REPO_ROOT = Path(__file__).resolve().parents[4]
ENV_FILES = (REPO_ROOT / ".env", Path(__file__).resolve().parents[2] / ".env")


class Settings(BaseSettings):
    api_host: str = "127.0.0.1"
    api_port: int = 8000
    secret_key: str = Field(default="change-this-development-secret")
    access_token_expire_minutes: int = 1440
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    deepseek_api_key: str = ""
    deepseek_model: str = "deepseek-v4-pro"

    tencentcloud_secret_id: str = "123"
    tencentcloud_secret_key: str = "234"
    tencentcloud_region: str = ""

    embedding_model: str = "sentence-transformers/all-MiniLM-L6-v2"
    chunk_size: int = 900
    chunk_overlap: int = 150
    database_url: str | None = None

    model_config = SettingsConfigDict(env_file=ENV_FILES, env_file_encoding="utf-8", extra="ignore")

    @property
    def repo_root(self) -> Path:
        return REPO_ROOT

    @property
    def data_dir(self) -> Path:
        return self.repo_root / "data"

    @property
    def uploads_dir(self) -> Path:
        return self.data_dir / "uploads"

    @property
    def extracted_dir(self) -> Path:
        return self.data_dir / "extracted"

    @property
    def indexes_dir(self) -> Path:
        return self.data_dir / "indexes"

    @property
    def sqlite_url(self) -> str:
        if self.database_url:
            return self.database_url
        return f"sqlite:///{self.data_dir / 'app.db'}"

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    settings = Settings()
    for path in (settings.data_dir, settings.uploads_dir, settings.extracted_dir, settings.indexes_dir):
        path.mkdir(parents=True, exist_ok=True)
    return settings

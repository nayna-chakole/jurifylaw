from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = Field(alias="DATABASE_URL")
    jwt_secret: str = Field(alias="JWT_SECRET")
    jwt_algorithm: str = Field(default="HS256", alias="JWT_ALGORITHM")
    jwt_expire_minutes: int = Field(default=60, alias="JWT_EXPIRE_MINUTES")
    ai_service_url: str = Field(alias="AI_SERVICE_URL")
    rag_service_url: str = Field(alias="RAG_SERVICE_URL")
    upload_dir: str = Field(default="uploads", alias="UPLOAD_DIR")
    redis_url: str = Field(alias="REDIS_URL")
    llm_api_key: str = Field(alias="LLM_API_KEY")
    max_upload_size_mb: int = Field(default=10, alias="MAX_UPLOAD_SIZE_MB")
    cors_origins: list[str] = Field(default_factory=list, alias="CORS_ORIGINS")
    use_mock_ai_service: bool = Field(default=True, alias="USE_MOCK_AI_SERVICE")
    use_mock_rag_service: bool = Field(default=True, alias="USE_MOCK_RAG_SERVICE")
    request_timeout_seconds: int = Field(default=30, alias="REQUEST_TIMEOUT_SECONDS")
    azure_embedding_endpoint: str = Field(default="https://small-embeddings-12.services.ai.azure.com", alias="AZURE_EMBEDDING_ENDPOINT")
    azure_embedding_key: str = Field(default="", alias="AZURE_EMBEDDING_KEY")
    azure_embedding_deployment: str = Field(default="text-embedding-ada-002", alias="AZURE_EMBEDDING_DEPLOYMENT")
    azure_embedding_api_version: str = Field(default="2024-02-01", alias="AZURE_EMBEDDING_API_VERSION")
    groq_api_key: str = Field(default="", alias="GROQ_API_KEY")
    groq_model: str = Field(default="openai/gpt-oss-120b", alias="GROQ_MODEL")
    groq_base_url: str = Field(default="https://api.groq.com/openai/v1", alias="GROQ_BASE_URL")

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()

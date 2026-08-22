import os
import shutil
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

os.environ.setdefault("DATABASE_URL", "sqlite:///./test.db")
os.environ.setdefault("JWT_SECRET", "test-secret-key")
os.environ.setdefault("JWT_ALGORITHM", "HS256")
os.environ.setdefault("JWT_EXPIRE_MINUTES", "60")
os.environ.setdefault("AI_SERVICE_URL", "http://mock-ai")
os.environ.setdefault("RAG_SERVICE_URL", "http://mock-rag")
os.environ.setdefault("UPLOAD_DIR", "test_uploads")
os.environ.setdefault("REDIS_URL", "redis://localhost:6379/0")
os.environ.setdefault("LLM_API_KEY", "test-llm-key")
os.environ.setdefault("MAX_UPLOAD_SIZE_MB", "5")
os.environ.setdefault("CORS_ORIGINS", '["http://localhost:3000"]')
os.environ.setdefault("USE_MOCK_AI_SERVICE", "true")
os.environ.setdefault("USE_MOCK_RAG_SERVICE", "true")

from app.api.deps import get_db
from app.core.database import Base
from app.main import app


TEST_DB_URL = "sqlite:///./test.db"
engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, expire_on_commit=False)


@pytest.fixture(autouse=True)
def reset_db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)
    engine.dispose()
    db_file = Path("test.db")
    if db_file.exists():
        db_file.unlink()
    upload_dir = Path("test_uploads")
    if upload_dir.exists():
        shutil.rmtree(upload_dir)


@pytest.fixture
def client():
    app.state.limiter.enabled = False

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
    app.state.limiter.enabled = True


def auth_headers(client: TestClient, email: str = "user@example.com", password: str = "password123") -> dict[str, str]:
    client.post(
        "/api/auth/register",
        json={"email": email, "password": password, "full_name": "Test User"},
    )
    response = client.post("/api/auth/login", json={"email": email, "password": password})
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def authorized_client(client: TestClient):
    return client, auth_headers(client)


@pytest.fixture
def sample_pdf_bytes() -> bytes:
    return b"%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF"

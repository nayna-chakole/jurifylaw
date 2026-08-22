"""Azure AI Foundry Embedding Service for JurifyLaw.

Provides vector embedding generation using Azure AI Foundry / Azure OpenAI endpoints.
"""

from typing import Any
import httpx
from app.core.config import get_settings


class AzureEmbeddingService:
    def __init__(self) -> None:
        self.settings = get_settings()

    def get_embeddings(self, texts: list[str]) -> list[list[float]]:
        """Generate embedding vectors for a list of input strings."""
        if not texts:
            return []

        clean_endpoint = self.settings.azure_embedding_endpoint.rstrip("/")
        url = (
            f"{clean_endpoint}/openai/deployments/"
            f"{self.settings.azure_embedding_deployment}/embeddings"
            f"?api-version={self.settings.azure_embedding_api_version}"
        )
        headers = {
            "Content-Type": "application/json",
            "api-key": self.settings.azure_embedding_key,
        }
        payload = {"input": texts}

        with httpx.Client(timeout=self.settings.request_timeout_seconds) as client:
            response = client.post(url, headers=headers, json=payload)
            response.raise_for_status()
            data = response.json()

        # Sort embeddings by index to preserve input order
        ordered_data = sorted(data.get("data", []), key=lambda x: x.get("index", 0))
        return [item["embedding"] for item in ordered_data]

    def get_embedding(self, text: str) -> list[float]:
        """Generate an embedding vector for a single text input."""
        results = self.get_embeddings([text])
        return results[0] if results else []


_embedding_service = None


def get_embedding_service() -> AzureEmbeddingService:
    global _embedding_service
    if _embedding_service is None:
        _embedding_service = AzureEmbeddingService()
    return _embedding_service

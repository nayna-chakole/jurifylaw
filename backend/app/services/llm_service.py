"""LLM Service using Groq for Legal Contract Analysis and RAG Generation."""

import json
from typing import Any
import httpx
from app.core.config import get_settings


class GroqLLMService:
    def __init__(self) -> None:
        self.settings = get_settings()

    def _call_groq(self, messages: list[dict[str, str]], temperature: float = 0.1) -> str:
        url = f"{self.settings.groq_base_url.rstrip('/')}/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.settings.groq_api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": self.settings.groq_model,
            "messages": messages,
            "temperature": temperature,
        }
        with httpx.Client(timeout=self.settings.request_timeout_seconds) as client:
            response = client.post(url, headers=headers, json=payload)
            response.raise_for_status()
            data = response.json()
            return data["choices"][0]["message"]["content"].strip()

    def analyze_contract_text(self, text: str) -> dict[str, Any]:
        """Analyze a legal contract and return structured summary, risks, and clauses."""
        system_prompt = (
            "You are an expert legal contract analyzer. Analyze the provided contract text and "
            "return ONLY a valid JSON object (no markdown quotes, no explanations outside JSON) with the following structure:\n"
            "{\n"
            '  "model_version": "groq-legal-analyzer-v1",\n'
            '  "summary": "High-level summary of the contract",\n'
            '  "risk_summary": {"high": int, "medium": int, "low": int},\n'
            '  "clauses": [\n'
            "    {\n"
            '      "clause_number": "1",\n'
            '      "text": "Exact body of clause",\n'
            '      "risk_results": [{"risk_level": "HIGH"|"MEDIUM"|"LOW", "confidence": 0.9, "model_version": "groq-legal-analyzer-v1"}],\n'
            '      "entities": [{"entity_type": "DATE"|"PARTY"|"MONEY"|"JURISDICTION", "entity_text": "...", "start_position": 0, "end_position": 10}],\n'
            '      "obligations": [{"description": "...", "obligated_party": "...", "due_date": "YYYY-MM-DD"}]\n'
            "    }\n"
            "  ]\n"
            "}"
        )
        user_prompt = f"Analyze this contract text:\n\n{text[:20000]}"
        content = self._call_groq(
            [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.1,
        )

        if content.startswith("```"):
            lines = content.splitlines()
            content = "\n".join([l for l in lines if not l.strip().startswith("```")])

        try:
            return json.loads(content)
        except Exception:
            return {
                "model_version": "groq-legal-analyzer-v1",
                "summary": content,
                "risk_summary": {"high": 0, "medium": 1, "low": 0},
                "clauses": [],
            }

    def generate_rag_answer(
        self, query: str, retrieved_clauses: list[dict[str, str]], history: list[dict[str, str]] | None = None
    ) -> str:
        """Generate a grounded legal answer based on retrieved context clauses."""
        context_str = "\n\n".join([f"[{c.get('title', 'Clause')}]: {c.get('snippet', '')}" for c in retrieved_clauses])
        system_prompt = (
            "You are a professional legal AI assistant. Answer the user's question using ONLY the provided "
            "contract context clauses. Be accurate, cite relevant clauses, and if information is not present, clearly state so.\n\n"
            f"RELEVANT CONTRACT CONTEXT:\n{context_str or 'No specific clauses found.'}"
        )
        messages = [{"role": "system", "content": system_prompt}]
        if history:
            for msg in history[-4:]:
                messages.append({"role": msg.get("role", "user"), "content": msg.get("content", "")})
        messages.append({"role": "user", "content": query})

        return self._call_groq(messages, temperature=0.2)


_llm_service = None


def get_llm_service() -> GroqLLMService:
    global _llm_service
    if _llm_service is None:
        _llm_service = GroqLLMService()
    return _llm_service

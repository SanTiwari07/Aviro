import os
import json
from typing import Dict, Any
from google import genai
from google.genai import types


def _get_client() -> genai.Client:
    api_key = os.getenv("GEMINI_API_KEY", "")
    return genai.Client(api_key=api_key)


def _get_model() -> str:
    return os.getenv("GEMINI_MODEL", "gemini-2.5-flash")


def investigate_case(evidence: Dict[str, Any]) -> Dict[str, Any]:
    """
    Calls Gemini to investigate an ambiguous reconciliation case.
    Returns a structured JSON recommendation.
    """
    fallback = {
        "classification": "AI_FAILURE",
        "summary": "Gemini request failed.",
        "supporting_evidence": [],
        "contradicting_evidence": [],
        "recommended_decision": "REVIEW",
        "recommended_action": "Manual review required.",
        "confidence": 0.0
    }

    prompt = f"""
    You are Arivo, an AI Finance Controller.
    Review the following financial evidence and provide a structured JSON response.

    Evidence:
    {json.dumps(evidence, indent=2)}

    You must return a JSON object exactly matching this schema:
    {{
      "classification": "string",
      "summary": "string",
      "supporting_evidence": ["string"],
      "contradicting_evidence": ["string"],
      "recommended_decision": "MATCHED|REVIEW|EXCEPTION",
      "recommended_action": "string",
      "confidence": 0.0
    }}
    """

    try:
        client = _get_client()
        response = client.models.generate_content(
            model=_get_model(),
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json"
            )
        )

        result = json.loads(response.text)

        # Schema validation
        valid_decisions = {"MATCHED", "REVIEW", "EXCEPTION"}
        if "recommended_decision" not in result or result["recommended_decision"] not in valid_decisions:
            print(f"[Gemini] Invalid recommended_decision in response: {result}")
            return fallback

        return result
    except Exception as e:
        print(f"[Gemini] investigate_case error: {e}")
        return fallback


def ask_arivo(question: str, context: str) -> str:
    """
    Ask Arivo a question grounded in provided policy context.
    """
    prompt = f"""
    You are Arivo, a finance copilot. Answer the user's question grounded strictly on the provided context.
    Do not invent financial facts or record IDs.

    Context:
    {context}

    Question: {question}
    """

    try:
        client = _get_client()
        response = client.models.generate_content(
            model=_get_model(),
            contents=prompt
        )
        return response.text
    except Exception as e:
        return f"I encountered an error analyzing your request: {str(e)}"

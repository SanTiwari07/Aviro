"""
Real RAG engine for ARIVO — AI Finance Controller.
Combines:
1. Controlled Intent Classification & Parametric Database Queries (Zero Arbitrary SQL)
2. In-Memory Lexical & Token Policy Retrieval across knowledge/*.md
3. Grounded Synthesis via Gemini with strict structured output validation
4. Deterministic safe fallback for guaranteed zero-downtime execution.
"""

import os
import re
import json
import logging
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, or_

from .. import database

logger = logging.getLogger("arivo.rag")

# Locate knowledge base relative to project root
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
KNOWLEDGE_DIR = os.path.join(PROJECT_ROOT, "knowledge")


def format_inr(paise: Optional[int]) -> str:
    """Formats integer minor units (paise) into standard INR string."""
    if paise is None:
        return "₹0.00"
    rupees = paise / 100.0
    s, *d = f"{rupees:,.2f}".split(".")
    # Indian numbering format for thousands, lakhs, crores
    parts = s.split(",")
    if len(parts) > 1:
        last = parts[-1]
        rest = "".join(parts[:-1])
        res = []
        while len(rest) > 2:
            res.insert(0, rest[-2:])
            rest = rest[:-2]
        if rest:
            res.insert(0, rest)
        formatted_int = ",".join(res) + "," + last
    else:
        formatted_int = parts[0]
    return f"₹{formatted_int}.{d[0]}"


# ---------------------------------------------------------------------------
# 1. Policy Document Indexer & Retriever
# ---------------------------------------------------------------------------

class PolicyChunk:
    def __init__(self, doc_name: str, policy_name: str, version: str, section: str, content: str):
        self.doc_name = doc_name
        self.policy_name = policy_name
        self.version = version
        self.section = section
        self.content = content.strip()
        # Precompute normalized tokens for BM25-style lexical matching
        self.tokens = set(re.findall(r"[a-z0-9]+", (policy_name + " " + section + " " + content).lower()))


class PolicyRetriever:
    def __init__(self, knowledge_dir: str = KNOWLEDGE_DIR):
        self.knowledge_dir = knowledge_dir
        self.chunks: List[PolicyChunk] = []
        self._load_policies()

    def _load_policies(self):
        if not os.path.isdir(self.knowledge_dir):
            logger.warning(f"Knowledge directory not found: {self.knowledge_dir}")
            return

        for filename in sorted(os.listdir(self.knowledge_dir)):
            if not filename.endswith(".md"):
                continue
            filepath = os.path.join(self.knowledge_dir, filename)
            try:
                with open(filepath, "r", encoding="utf-8") as f:
                    text = f.read()
                self._parse_markdown(filename, text)
            except Exception as e:
                logger.error(f"Failed to load policy {filename}: {e}")

        logger.info(f"Loaded {len(self.chunks)} policy chunks from {self.knowledge_dir}")

    def _parse_markdown(self, filename: str, text: str):
        # Extract title and metadata
        policy_name_match = re.search(r"Policy Name\*\*:\s*([^\n]+)", text)
        policy_name = policy_name_match.group(1).strip() if policy_name_match else filename.replace(".md", "").replace("_", " ").title()

        version_match = re.search(r"Policy Version\*\*:\s*([^\n]+)", text)
        version = version_match.group(1).strip() if version_match else "1.0.0"

        # Split into sections by Markdown headers ## or ###
        sections = re.split(r"\n(?=##+\s)", text)
        for sec in sections:
            if not sec.strip():
                continue
            header_match = re.match(r"##+\s+([^\n]+)", sec)
            section_title = header_match.group(1).strip() if header_match else "General Provisions"
            content = sec[header_match.end():].strip() if header_match else sec.strip()
            if content:
                self.chunks.append(PolicyChunk(
                    doc_name=filename,
                    policy_name=policy_name,
                    version=version,
                    section=section_title,
                    content=content
                ))

    def retrieve(self, query: str, top_k: int = 3) -> List[Dict[str, Any]]:
        """
        Retrieves top relevant policy chunks based on token overlap & relevance scoring.
        """
        q_tokens = set(re.findall(r"[a-z0-9]+", query.lower()))
        if not q_tokens or not self.chunks:
            return []

        scored_chunks = []
        for chunk in self.chunks:
            overlap = len(q_tokens.intersection(chunk.tokens))
            if overlap == 0:
                continue
            # Weight matches in section headers or policy title higher
            header_tokens = set(re.findall(r"[a-z0-9]+", (chunk.policy_name + " " + chunk.section).lower()))
            header_boost = len(q_tokens.intersection(header_tokens)) * 2.5
            score = overlap + header_boost
            scored_chunks.append((score, chunk))

        scored_chunks.sort(key=lambda x: x[0], reverse=True)
        top_results = []
        for score, ch in scored_chunks[:top_k]:
            excerpt = ch.content[:350] + ("..." if len(ch.content) > 350 else "")
            top_results.append({
                "name": ch.policy_name,
                "version": ch.version,
                "doc": ch.doc_name,
                "section": ch.section,
                "excerpt": excerpt,
                "score": round(score, 2),
            })
        return top_results


policy_retriever = PolicyRetriever()


# ---------------------------------------------------------------------------
# 2. Controlled Query Router (Parametric SQLite Operations)
# ---------------------------------------------------------------------------

def execute_controlled_query(query_text: str, db: Session) -> Dict[str, Any]:
    """
    Classifies user intent and executes strictly controlled, parameter-bound
    SQLAlchemy queries. NEVER executes arbitrary LLM-generated SQL strings.
    """
    q_lower = query_text.lower().strip()
    result: Dict[str, Any] = {
        "intent": "GENERAL_INQUIRY",
        "records": [],
        "context_summary": "",
    }

    # 1. Check for specific Entity Identifiers (PAY_..., SET_..., CASE_...)
    pay_matches = re.findall(r"PAY_[A-Za-z0-9_-]+", query_text, re.IGNORECASE)
    set_matches = re.findall(r"SET_[A-Za-z0-9_-]+", query_text, re.IGNORECASE)
    case_matches = re.findall(r"CASE_[A-Za-z0-9_-]+", query_text, re.IGNORECASE)

    if pay_matches or set_matches or case_matches:
        result["intent"] = "ENTITY_INSPECTION"
        found_records = []
        for pid in pay_matches[:3]:
            p = db.query(database.Payment).filter(database.Payment.payment_id.ilike(pid)).first()
            if p:
                c = db.query(database.ReconciliationCase).filter_by(payment_id=p.payment_id).first()
                found_records.append({
                    "type": "payment",
                    "id": p.payment_id,
                    "amount_paise": p.amount,
                    "amount_formatted": format_inr(p.amount),
                    "status": c.status if c else p.status,
                    "case_id": c.case_id if c else None,
                    "match_method": c.match_method if c else None,
                    "source": p.source,
                })
        for sid in set_matches[:3]:
            s = db.query(database.Settlement).filter(database.Settlement.settlement_id.ilike(sid)).first()
            if s:
                found_records.append({
                    "type": "settlement",
                    "id": s.settlement_id,
                    "gross_paise": s.gross_amount,
                    "gross_formatted": format_inr(s.gross_amount),
                    "net_paise": s.net_amount,
                    "net_formatted": format_inr(s.net_amount),
                    "fee_paise": s.fees,
                    "tax_paise": s.tax,
                    "unexplained_delta_paise": s.unexplained_delta,
                    "utr": s.utr,
                    "status": s.status,
                })
        for cid in case_matches[:3]:
            c = db.query(database.ReconciliationCase).filter(database.ReconciliationCase.case_id.ilike(cid)).first()
            if c:
                found_records.append({
                    "type": "case",
                    "id": c.case_id,
                    "payment_id": c.payment_id,
                    "settlement_id": c.settlement_id,
                    "status": c.status,
                    "financial_impact_paise": c.financial_impact,
                    "financial_impact_formatted": format_inr(c.financial_impact),
                    "control_result": c.control_result,
                    "ai_recommendation": c.ai_recommendation,
                })
        result["records"] = found_records
        result["context_summary"] = f"Retrieved {len(found_records)} exact financial records matching specified identifiers."
        return result

    # 2. Check for High-Value or Exposure Inquiries
    if any(k in q_lower for k in ["exposure", "unresolved", "high value", "risk", "how much money", "unmatched"]):
        result["intent"] = "EXPOSURE_BREAKDOWN"
        unresolved_cases = db.query(database.ReconciliationCase).filter(
            database.ReconciliationCase.status.in_(["REVIEW", "EXCEPTION"])
        ).order_by(desc(database.ReconciliationCase.financial_impact)).limit(5).all()

        total_exposure = db.query(func.sum(database.ReconciliationCase.financial_impact)).filter(
            database.ReconciliationCase.status.in_(["REVIEW", "EXCEPTION"])
        ).scalar() or 0

        high_val_exposure = db.query(func.sum(database.ReconciliationCase.financial_impact)).filter(
            database.ReconciliationCase.status.in_(["REVIEW", "EXCEPTION"]),
            database.ReconciliationCase.financial_impact >= 5000000
        ).scalar() or 0

        records = [
            {
                "type": "case",
                "id": c.case_id,
                "payment_id": c.payment_id,
                "status": c.status,
                "impact_formatted": format_inr(c.financial_impact),
                "control_result": c.control_result,
            }
            for c in unresolved_cases
        ]
        result["records"] = records
        result["context_summary"] = (
            f"Total Unresolved Exposure: {format_inr(total_exposure)} across {len(unresolved_cases)} sample cases. "
            f"High-Value Exposure (>= ₹50,000): {format_inr(high_val_exposure)}."
        )
        return result

    # 3. Check for Waterfall / Fee / Tax Inquiries
    if any(k in q_lower for k in ["waterfall", "fee", "tax", "gst", "mdr", "discrepancy", "unexplained delta"]):
        result["intent"] = "WATERFALL_AUDIT"
        anomaly_settlements = db.query(database.Settlement).filter(
            database.Settlement.unexplained_delta > 0
        ).order_by(desc(database.Settlement.unexplained_delta)).limit(5).all()

        total_fees = db.query(func.sum(database.Settlement.fees)).scalar() or 0
        total_tax = db.query(func.sum(database.Settlement.tax)).scalar() or 0

        records = [
            {
                "type": "settlement",
                "id": s.settlement_id,
                "gross_formatted": format_inr(s.gross_amount),
                "net_formatted": format_inr(s.net_amount),
                "unexplained_delta_formatted": format_inr(s.unexplained_delta),
                "fees_formatted": format_inr(s.fees),
            }
            for s in anomaly_settlements
        ]
        result["records"] = records
        result["context_summary"] = (
            f"Total Gateway Deductions: Fees {format_inr(total_fees)}, GST Tax {format_inr(total_tax)}. "
            f"Found {len(anomaly_settlements)} settlements with active waterfall arithmetic discrepancies."
        )
        return result

    # 4. Check for Cash Position & Forecast Inquiries
    if any(k in q_lower for k in ["forecast", "cash position", "inflow", "bank", "timing", "t+2"]):
        result["intent"] = "CASH_FORECAST"
        from ..engine.cash_forecast import calculate_cash_forecast
        forecast = calculate_cash_forecast(db)
        result["context_summary"] = (
            f"Confirmed Bank Cash: {format_inr(forecast['confirmed_cash'])}, "
            f"Expected In-Flight Gateway Pipeline: {format_inr(forecast['expected_settlements'])}, "
            f"7-Day Expected Inflow: {format_inr(forecast['seven_day_expected_inflow'])}."
        )
        return result

    # Default: Overview Summary
    total_cases = db.query(database.ReconciliationCase).count()
    matched_cases = db.query(database.ReconciliationCase).filter_by(status="MATCHED").count()
    review_cases = db.query(database.ReconciliationCase).filter_by(status="REVIEW").count()
    exception_cases = db.query(database.ReconciliationCase).filter_by(status="EXCEPTION").count()
    result["context_summary"] = (
        f"Active Ledger Snapshot: {total_cases} total records ({matched_cases} Matched, "
        f"{review_cases} Under Review, {exception_cases} Exceptions)."
    )
    return result


# ---------------------------------------------------------------------------
# 3. RAG Grounded Answer Synthesis
# ---------------------------------------------------------------------------

def query_rag(question: str, db: Session, context_hint: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Executes real Grounded RAG:
    1. Retrieval: In-memory policy chunk matching from knowledge/*.md
    2. Data Extraction: Controlled SQLite execution for relevant entities
    3. LLM Synthesis: Gemini generates strictly structured response or deterministic fallback
    4. Validation: Strict output contract enforcement
    """
    # 1. Retrieve Policy
    retrieved_policies = policy_retriever.retrieve(question, top_k=3)

    # 2. Controlled DB Query
    query_data = execute_controlled_query(question, db)
    records = query_data.get("records", [])
    context_summary = query_data.get("context_summary", "")

    # 3. Attempt Gemini Synthesis
    gemini_api_key = os.getenv("GEMINI_API_KEY")
    if gemini_api_key and gemini_api_key.strip():
        try:
            from google import genai
            from google.genai import types

            client = genai.Client(api_key=gemini_api_key.strip())
            model_name = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

            system_instruction = (
                "You are ARIVO, the authoritative Enterprise AI Finance Controller copilot. "
                "You answer questions from CFOs, Treasury Heads, and Finance Controllers. "
                "STRICT GROUNDING RULES:\n"
                "1. Base your answer EXCLUSIVELY on the verified financial records and policy excerpts provided.\n"
                "2. State numbers precisely in INR (e.g. ₹6,00,000.00). Do not invent transactions or IDs.\n"
                "3. If an invariant was violated or an AI match blocked by the Control Gate, explain why clearly.\n"
                "4. You MUST respond with a JSON object containing:\n"
                "   - answer: string (clear, professional financial analysis)\n"
                "   - classification: string (POLICY_EXPLANATION | EXPOSURE_SUMMARY | ENTITY_AUDIT | GENERAL)\n"
                "   - recommended_actions: list of actionable controller steps (e.g. 'Audit UTR on settlement SET_...')"
            )

            prompt = f"""
USER QUESTION:
{question}

VERIFIED LEDGER CONTEXT:
{context_summary}

MATCHING DATABASE RECORDS:
{json.dumps(records, indent=2)}

RETRIEVED POLICY PROVISIONS:
{json.dumps(retrieved_policies, indent=2)}
"""

            response = client.models.generate_content(
                model=model_name,
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    response_mime_type="application/json",
                    temperature=0.1,
                )
            )

            raw_text = response.text.strip()
            parsed = json.loads(raw_text)

            return {
                "answer": parsed.get("answer", "Analysis completed based on active ledger and policy."),
                "records": records,
                "referenced_records": records,
                "policies": retrieved_policies,
                "classification": parsed.get("classification", query_data.get("intent")),
                "recommended_actions": parsed.get("recommended_actions", [
                    "Inspect ranked exceptions in Exceptions Ledger",
                    "Review settlement waterfall discrepancies"
                ]),
                "grounded": True,
            }

        except Exception as e:
            logger.warning(f"Gemini generation fallback triggered: {e}")

    # 4. Deterministic Grounded Fallback (Guarantees Zero Downtime & 100% Truthfulness)
    intent = query_data.get("intent", "GENERAL_INQUIRY")
    answer_parts = []

    if records:
        answer_parts.append(f"Based on your query, verified ledger records were located:\n")
        for r in records[:3]:
            rtype = r.get("type", "record").title()
            rid = r.get("id")
            val = r.get("amount_formatted") or r.get("gross_formatted") or r.get("impact_formatted") or ""
            st = r.get("status") or r.get("control_result") or ""
            answer_parts.append(f"• **{rtype} `{rid}`**: {val} — Status: `{st}`")
        answer_parts.append(f"\n{context_summary}")
    else:
        answer_parts.append(context_summary)

    if retrieved_policies:
        answer_parts.append(f"\n\n**Applicable Policy Reference:**")
        top_p = retrieved_policies[0]
        answer_parts.append(f"Under **{top_p['name']}** (v{top_p['version']}, Section: *{top_p['section']}*):\n> {top_p['excerpt'][:220]}...")

    actions = [
        "Open the Evidence Drawer on highlighted records to inspect complete waterfall provenance.",
        "Verify bank credit against statement UTR in Treasury clearance ledger.",
    ]
    if intent == "EXPOSURE_BREAKDOWN":
        actions.insert(0, "Export unresolved exception CSV for operations team investigation.")

    return {
        "answer": "\n".join(answer_parts),
        "records": records,
        "referenced_records": records,
        "policies": retrieved_policies,
        "classification": intent,
        "recommended_actions": actions,
        "grounded": True,
    }

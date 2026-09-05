"""
Tests for RAG Engine, Policy Knowledge Base, and Human Controller Resolution.
"""

from fastapi.testclient import TestClient
from backend.main import app
from backend.ai.rag import policy_retriever
from backend import database

client = TestClient(app)


def test_policy_knowledge_base_indexing():
    """Verify all 6 policy documents are discovered and parsed into chunks."""
    assert len(policy_retriever.chunks) > 0
    docs = {ch.doc_name for ch in policy_retriever.chunks}
    assert "reconciliation_policy.md" in docs
    assert "settlement_policy.md" in docs
    assert "refund_policy.md" in docs
    assert "chargeback_policy.md" in docs
    assert "fee_policy.md" in docs
    assert "arivo_control_policy.md" in docs


def test_policy_retrieval_relevance():
    """Verify policy retriever surfaces correct policy sections for finance queries."""
    results = policy_retriever.retrieve("What is our rule on high value transactions?", top_k=2)
    assert len(results) > 0
    # Should retrieve either reconciliation or control policy
    doc_names = [r["doc"] for r in results]
    assert any("reconciliation_policy" in d or "arivo_control_policy" in d for d in doc_names)


def test_api_policies_endpoint():
    """Test GET /api/policies returns indexed policy metadata."""
    res = client.get("/api/policies")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert data["total_policies"] >= 6
    assert data["total_chunks"] >= 6
    doc_names = [p["doc_name"] for p in data["policies"]]
    assert "reconciliation_policy.md" in doc_names


def test_api_ask_rag_response_contract():
    """Verify POST /api/ask returns the structured RAG response contract."""
    payload = {"question": "How much unresolved exposure do we have?"}
    res = client.post("/api/ask", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "answer" in data
    assert isinstance(data["answer"], str)
    assert len(data["answer"]) > 0
    assert "records" in data
    assert isinstance(data["records"], list)
    assert "policies" in data
    assert isinstance(data["policies"], list)
    assert "classification" in data
    assert "recommended_actions" in data
    assert isinstance(data["recommended_actions"], list)


def test_case_resolution_workflow():
    """Test controller resolution actions: APPROVED, REJECTED, ESCALATED."""
    # Ensure there is at least one case
    db = next(database.get_db())
    case = db.query(database.ReconciliationCase).first()
    if not case:
        case = database.ReconciliationCase(
            case_id="CASE_TEST_RESOLVE_001",
            run_id="RUN_TEST",
            payment_id="PAY_TEST_001",
            status="REVIEW",
            financial_impact=100000,
            amount_delta=0,
            source="synthetic",
            created_at="2026-01-01T00:00:00Z"
        )
        db.add(case)
        db.commit()

    cid = case.case_id

    # 1. ESCALATE
    res_esc = client.post(f"/api/reconciliation/{cid}/resolve", json={
        "action": "ESCALATED",
        "notes": "Escalated to Treasury Lead for UTR verification",
        "user": "Controller A",
    })
    assert res_esc.status_code == 200
    d_esc = res_esc.json()
    assert d_esc["new_status"] == "REVIEW"
    assert d_esc["resolution_action"] == "ESCALATED"
    assert d_esc["resolved_by"] == "Controller A"

    # 2. APPROVE
    res_app = client.post(f"/api/reconciliation/{cid}/resolve", json={
        "action": "APPROVED",
        "notes": "Verified manual bank credit advice",
        "user": "CFO Lead",
    })
    assert res_app.status_code == 200
    d_app = res_app.json()
    assert d_app["new_status"] == "MATCHED"
    assert d_app["resolution_action"] == "APPROVED"

    # 3. REJECT
    res_rej = client.post(f"/api/reconciliation/{cid}/resolve", json={
        "action": "REJECTED",
        "notes": "Confirmed fraudulent chargeback debit",
        "user": "Risk Controller",
    })
    assert res_rej.status_code == 200
    d_rej = res_rej.json()
    assert d_rej["new_status"] == "EXCEPTION"
    assert d_rej["resolution_action"] == "REJECTED"

    # Verify detail reflects fields
    res_detail = client.get(f"/api/reconciliation/{cid}")
    assert res_detail.status_code == 200
    c_info = res_detail.json()["case"]
    assert c_info["status"] == "EXCEPTION"
    assert c_info["resolution_action"] == "REJECTED"
    assert c_info["resolved_by"] == "Risk Controller"

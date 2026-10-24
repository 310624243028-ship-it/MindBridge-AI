from app.database.connection import get_db, get_db_status
from app.database.exasol_client import RealExasolClient
from app.database.mock_exasol import ExplicitMockExasolAdapter

def test_exasol_real_client_structure():
    """Verifies that RealExasolClient initializes with official pyexasol configuration."""
    client = RealExasolClient()
    assert client.adapter_name == "REAL_EXASOL_PYEXASOL"
    assert "localhost" in client.host or "8563" in client.host
    assert client.schema == "MINDBRIDGE"

def test_explicit_mock_adapter_labeling():
    """
    CRITICAL SAFEGUARD TEST:
    Ensures that when running without live Exasol, the adapter is EXPLICITLY labelled
    and not silently swapped with generic SQLite or Postgres.
    """
    mock = ExplicitMockExasolAdapter()
    assert mock.IS_EXPLICIT_MOCK_ADAPTER is True
    assert mock.adapter_name == "EXPLICIT_MOCK_EXASOL_ADAPTER"
    health = mock.check_health()
    assert health["is_mock"] is True
    assert "EXPLICIT MOCK EXASOL MODE" in health["clinical_warning"]

def test_database_status_endpoint(client):
    """Verifies that the /api/system/db-status endpoint provides accurate diagnostics."""
    response = client.get("/api/system/db-status")
    assert response.status_code == 200
    data = response.json()
    assert "adapter_name" in data
    assert "host" in data
    assert "active_participants_count" in data
    assert data["active_participants_count"] >= 1

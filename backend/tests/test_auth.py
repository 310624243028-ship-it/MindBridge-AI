def test_demo_switcher(client):
    """Verifies that demo switcher returns valid JWT for clinician and participant."""
    # Clinician switch
    res_clin = client.post("/api/auth/demo-switch/clinician")
    assert res_clin.status_code == 200
    clin_data = res_clin.json()
    assert clin_data["role"] == "clinician"
    assert "access_token" in clin_data

    # Participant switch
    res_part = client.post("/api/auth/demo-switch/participant")
    assert res_part.status_code == 200
    part_data = res_part.json()
    assert part_data["role"] == "participant"
    assert part_data["participant_id"] is not None

def test_login_json(client):
    """Verifies password verification and JSON login."""
    payload = {
        "email": "clinician@mindbridge.ai",
        "password": "MindBridge2026!"
    }
    response = client.post("/api/auth/login-json", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["role"] == "clinician"

def test_user_registration(client):
    """Verifies new user registration."""
    payload = {
        "email": "new_researcher_test@mindbridge.ai",
        "password": "SecurePassword123!",
        "role": "researcher",
        "full_name": "Dr. Research Tester"
    }
    response = client.post("/api/auth/register", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == payload["email"]
    assert data["role"] == "researcher"

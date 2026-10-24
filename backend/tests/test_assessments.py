def test_start_and_complete_assessment_session(client):
    """Verifies complete assessment session flow."""
    # Obtain auth token
    auth_res = client.post("/api/auth/demo-switch/participant")
    token = auth_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    p_id = auth_res.json()["participant_id"]

    # 1. Start Session
    start_payload = {
        "participant_id": p_id,
        "device_metadata": {"browser": "pytest-client", "screen": "1080p"},
        "consent_confirmed": True
    }
    session_res = client.post("/api/assessments/start", json=start_payload, headers=headers)
    assert session_res.status_code == 200
    s_data = session_res.json()
    assert s_data["status"] == "in_progress"
    session_id = s_data["session_id"]

    # 2. Submit Task Result (Word Recall)
    task_payload = {
        "session_id": session_id,
        "participant_id": p_id,
        "task_type": "word_recall_immediate",
        "task_name": "Immediate Word Recall",
        "total_trials": 10,
        "correct_trials": 8,
        "error_count": 2,
        "omission_count": 1,
        "commission_count": 1,
        "mean_reaction_time_ms": 1150.0,
        "median_reaction_time_ms": 1120.0,
        "raw_score": 8.0,
        "trials_detail": [
            {"trial_index": 1, "stimulus": "River", "response": "River", "is_correct": True, "reaction_time_ms": 900.0},
            {"trial_index": 2, "stimulus": "Candle", "response": "Candle", "is_correct": True, "reaction_time_ms": 1100.0}
        ]
    }
    task_res = client.post("/api/assessments/tasks/submit", json=task_payload, headers=headers)
    assert task_res.status_code == 200
    t_data = task_res.json()
    assert t_data["standardized_z_score"] is not None
    assert t_data["percentile_rank"] is not None

    # 3. Complete Session
    complete_payload = {"total_duration_ms": 450000}
    comp_res = client.post(f"/api/assessments/session/{session_id}/complete", json=complete_payload, headers=headers)
    assert comp_res.status_code == 200
    assert comp_res.json()["status"] == "success"

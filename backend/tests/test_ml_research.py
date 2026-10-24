def test_ml_evaluation_metrics(client):
    """Verifies that ML research pipeline outputs all mandatory evaluation metrics."""
    response = client.get("/api/ml/evaluation")
    assert response.status_code == 200
    data = response.json()
    
    # Must report standard evaluation metrics
    assert "roc_auc" in data
    assert "sensitivity" in data
    assert "specificity" in data
    assert "brier_score" in data
    assert "calibration_curve" in data
    assert "subgroup_fairness" in data
    assert data["is_synthetic_benchmark"] is True  # Synthetic watermark

def test_ml_prediction_disclaimer(client):
    """Verifies that any ML prediction carries mandatory non-diagnostic clinical disclaimer."""
    auth_res = client.post("/api/auth/demo-switch/clinician")
    token = auth_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    payload = {
        "age_group": "65-74",
        "education_years": 16,
        "immediate_recall_z": -0.8,
        "delayed_recall_z": -1.2,
        "digit_span_z": -0.1,
        "stroop_interference_ms": 145.0,
        "trail_making_seconds": 65.0,
        "prior_decline_slope": -0.2
    }
    response = client.post("/api/ml/predict", json=payload, headers=headers)
    assert response.status_code == 200
    data = response.json()
    
    assert data["is_diagnostic"] is False
    assert "NOT diagnose Alzheimer's" in data["disclaimer"]
    assert "investigational_risk_score" in data
    assert len(data["confidence_interval"]) == 2

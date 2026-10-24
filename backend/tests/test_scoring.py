from app.services.scoring import calculate_normative_score

def test_normative_scoring_memory():
    """Tests normative score calculation for memory tasks."""
    # Score matching mean should give Z ~ 0.0
    z, pct, status = calculate_normative_score(
        task_type="word_recall_immediate",
        raw_score=7.5,
        age_group="60-69",
        education_years=14
    )
    assert abs(z) < 0.2
    assert 40.0 <= pct <= 60.0
    assert status == "Within Normal Limits"

def test_normative_scoring_trail_making_inverted():
    """Tests inverted scoring for speed tasks where lower time is better."""
    # Very fast completion (35s vs mean 58s) should result in POSITIVE Z-score
    z_fast, pct_fast, _ = calculate_normative_score(
        task_type="trail_making_b",
        raw_score=35.0,
        age_group="60-69",
        education_years=14
    )
    assert z_fast > 1.0
    assert pct_fast > 80.0

    # Very slow completion (100s) should result in NEGATIVE Z-score
    z_slow, pct_slow, status_slow = calculate_normative_score(
        task_type="trail_making_b",
        raw_score=100.0,
        age_group="60-69",
        education_years=14
    )
    assert z_slow < -1.5
    assert pct_slow < 10.0
    assert "Variance" in status_slow or "Borderline" in status_slow or "Discrepancy" in status_slow

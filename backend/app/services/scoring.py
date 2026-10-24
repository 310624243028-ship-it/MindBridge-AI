import math
from typing import Dict, Tuple

# Normative parameters derived from standard neuropsychological literature
# Format: {task_type: {"mean": float, "sd": float, "higher_is_better": bool}}
NORMATIVE_BASELINES = {
    "word_recall_immediate": {"mean": 7.5, "sd": 1.5, "higher_is_better": True},
    "word_recall_delayed": {"mean": 6.8, "sd": 1.7, "higher_is_better": True},
    "digit_span": {"mean": 6.5, "sd": 1.3, "higher_is_better": True},
    "stroop_interference": {"mean": 120.0, "sd": 50.0, "higher_is_better": False},  # RT cost in ms
    "trail_making_b": {"mean": 58.0, "sd": 16.0, "higher_is_better": False},        # Completion seconds
    "semantic_fluency": {"mean": 18.0, "sd": 4.5, "higher_is_better": True}         # Word count
}

# Age adjustment factors (older cohorts have slightly different normative expectations)
AGE_ADJUSTMENTS = {
    "50-59": {"mean_offset": 0.3, "sd_mult": 0.95},
    "60-69": {"mean_offset": 0.0, "sd_mult": 1.00},
    "70-79": {"mean_offset": -0.5, "sd_mult": 1.10},
    "80+":   {"mean_offset": -1.0, "sd_mult": 1.25}
}

# Education adjustment (years of formal education)
EDUCATION_ADJUSTMENTS = {
    "low": {"threshold": 12, "offset": -0.3},
    "medium": {"threshold": 16, "offset": 0.0},
    "high": {"threshold": 99, "offset": 0.3}
}

def standard_normal_cdf(z: float) -> float:
    """Computes standard normal cumulative distribution function (CDF) for percentile rank."""
    return 0.5 * (1.0 + math.erf(z / math.sqrt(2.0)))

def calculate_normative_score(
    task_type: str,
    raw_score: float,
    age_group: str = "60-69",
    education_years: int = 14
) -> Tuple[float, float, str]:
    """
    Calculates standardized Z-score, percentile rank, and clinical status.
    Adjusted for age bracket and education attainment.
    Returns: (z_score, percentile_rank, status_label)
    """
    baseline = NORMATIVE_BASELINES.get(task_type, {"mean": 10.0, "sd": 2.0, "higher_is_better": True})
    age_adj = AGE_ADJUSTMENTS.get(age_group, {"mean_offset": 0.0, "sd_mult": 1.0})
    
    edu_offset = 0.0
    if education_years < 12:
        edu_offset = -0.3
    elif education_years > 16:
        edu_offset = 0.3

    adjusted_mean = baseline["mean"] + age_adj["mean_offset"] + edu_offset
    adjusted_sd = max(baseline["sd"] * age_adj["sd_mult"], 0.1)

    if baseline["higher_is_better"]:
        z = (raw_score - adjusted_mean) / adjusted_sd
    else:
        # Inverted: lower time/interference is better performance
        z = (adjusted_mean - raw_score) / adjusted_sd

    # Clamp z-score between -4.0 and +4.0
    z = max(-4.0, min(4.0, z))
    percentile = round(standard_normal_cdf(z) * 100.0, 1)
    z_score = round(z, 2)

    # Classify status according to standard psychometric tiers
    if z >= -1.0:
        status = "Within Normal Limits"
    elif z >= -1.5:
        status = "Mild Variance"
    elif z >= -2.0:
        status = "Borderline / Low Average"
    else:
        status = "Elevated Research Discrepancy"

    return z_score, percentile, status

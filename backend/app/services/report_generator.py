import datetime
import uuid
from typing import Any, Dict, List, Optional
from app.core.config import settings

def generate_clinician_screening_report(
    participant: Dict[str, Any],
    sessions: List[Dict[str, Any]],
    tasks: List[Dict[str, Any]],
    clinician_name: str = "Dr. Attending Neurologist"
) -> Dict[str, Any]:
    """
    Compiles an exportable clinical screening report summarizing longitudinal
    cognitive performance across memory, attention, executive function, and speed.
    """
    report_id = f"rpt-{uuid.uuid4().hex[:10]}"
    now = datetime.datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")

    # Aggregate by domain
    # Domain definitions
    domains = {
        "Episodic Memory": ["word_recall_immediate", "word_recall_delayed"],
        "Working Memory & Attention": ["digit_span"],
        "Executive Function": ["stroop_interference"],
        "Processing Speed & Switching": ["trail_making_b"],
        "Verbal Fluency": ["semantic_fluency"]
    }

    domain_summary = []
    for domain_name, task_keys in domains.items():
        relevant_tasks = [t for t in tasks if t.get("task_type") in task_keys]
        if relevant_tasks:
            # Average z-scores and raw scores
            z_vals = [t["standardized_z_score"] for t in relevant_tasks if t.get("standardized_z_score") is not None]
            avg_z = sum(z_vals) / len(z_vals) if z_vals else 0.0
            pct_vals = [t["percentile_rank"] for t in relevant_tasks if t.get("percentile_rank") is not None]
            avg_pct = sum(pct_vals) / len(pct_vals) if pct_vals else 50.0
            
            raw_vals = [t["raw_score"] for t in relevant_tasks if t.get("raw_score") is not None]
            avg_raw = sum(raw_vals) / len(raw_vals) if raw_vals else 0.0

            if avg_z >= -1.0:
                stat = "Within Normal Range"
            elif avg_z >= -1.5:
                stat = "Mild Psychometric Variance"
            elif avg_z >= -2.0:
                stat = "Low Average / Borderline"
            else:
                stat = "Requires Multidisciplinary Evaluation"

            domain_summary.append({
                "domain": domain_name,
                "raw_score": round(avg_raw, 1),
                "z_score": round(avg_z, 2),
                "percentile": round(avg_pct, 1),
                "status": stat
            })

    # Sort sessions by start date
    sorted_sessions = sorted(sessions, key=lambda s: s.get("started_at", ""))
    baseline_date = sorted_sessions[0]["started_at"][:10] if sorted_sessions else "N/A"
    latest_date = sorted_sessions[-1]["started_at"][:10] if sorted_sessions else "N/A"

    # Longitudinal trajectory tracking
    trajectory = []
    for sess in sorted_sessions:
        s_id = sess["session_id"]
        sess_tasks = [t for t in tasks if t["session_id"] == s_id]
        if sess_tasks:
            mem_tasks = [t for t in sess_tasks if "word_recall" in t.get("task_type", "")]
            mem_z = sum(t["standardized_z_score"] for t in mem_tasks) / len(mem_tasks) if mem_tasks else 0.0
            overall_z = sum(t["standardized_z_score"] for t in sess_tasks) / len(sess_tasks)

            trajectory.append({
                "session_id": s_id,
                "date": sess.get("started_at", "")[:10],
                "overall_composite_z": round(overall_z, 2),
                "memory_z": round(mem_z, 2),
                "tasks_count": len(sess_tasks)
            })

    # Longitudinal research risk indicator
    risk_flag = "Stable Trajectory"
    if len(trajectory) >= 2:
        first_z = trajectory[0]["overall_composite_z"]
        last_z = trajectory[-1]["overall_composite_z"]
        diff = last_z - first_z
        if diff < -0.5:
            risk_flag = "Longitudinal Decline Detected (Research Indicator)"
        elif diff < -0.25:
            risk_flag = "Mild Downward Variance"

    return {
        "report_id": report_id,
        "generated_at": now,
        "participant_id": participant.get("participant_id"),
        "pseudonym_code": participant.get("pseudonym_code", "UNKNOWN"),
        "age_group": participant.get("age_group", "Unknown"),
        "education_years": participant.get("education_years", 12),
        "clinician_name": clinician_name,
        "total_sessions_tracked": len(sessions),
        "baseline_date": baseline_date,
        "latest_session_date": latest_date,
        "domain_summary": domain_summary,
        "longitudinal_trajectory": trajectory,
        "research_risk_flag": risk_flag,
        "clinical_notes": (
            f"Participant {participant.get('pseudonym_code')} completed {len(sessions)} standardized screening sessions. "
            f"Composite longitudinal trajectory indicator is '{risk_flag}'. Normative score comparisons are adjusted for "
            f"age bracket {participant.get('age_group')} and {participant.get('education_years')} years of formal education."
        ),
        "clinical_safeguard_disclaimer": settings.CLINICAL_DISCLAIMER
    }

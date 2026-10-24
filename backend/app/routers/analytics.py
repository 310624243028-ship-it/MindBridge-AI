import json
from typing import Any, Dict, List
from fastapi import APIRouter, Depends, HTTPException
import plotly.graph_objects as go
from app.core.security import get_current_user
from app.database.connection import get_db

router = APIRouter(prefix="/analytics", tags=["Analytics & Visualizations"])

@router.get("/longitudinal/{participant_id}")
def get_longitudinal_trajectory_chart(participant_id: str, current_user: dict = Depends(get_current_user)):
    """
    Returns Plotly JSON specification for interactive longitudinal trajectory tracking.
    Compares Memory, Attention, Executive Function, and Speed over time.
    """
    db = get_db()
    sessions = db.fetch_all("SELECT * FROM MINDBRIDGE.ASSESSMENT_SESSIONS WHERE participant_id = :id ORDER BY started_at ASC", {"id": participant_id})
    tasks = db.fetch_all("SELECT * FROM MINDBRIDGE.TASK_RESULTS WHERE participant_id = :id ORDER BY created_at ASC", {"id": participant_id})

    if not sessions:
        # Return empty figure
        fig = go.Figure()
        fig.update_layout(title="No assessment sessions recorded yet.")
        return json.loads(fig.to_json())

    dates = [s.get("started_at", "")[:10] for s in sessions]
    
    # Track domain z-scores by session
    memory_z = []
    exec_z = []
    attn_z = []
    speed_z = []

    for s in sessions:
        s_id = s["session_id"]
        s_tasks = [t for t in tasks if t.get("session_id") == s_id]
        
        # Episodic Memory (Word Recall)
        mem = [t.get("standardized_z_score", 0.0) for t in s_tasks if "word_recall" in t.get("task_type", "")]
        memory_z.append(round(sum(mem)/len(mem), 2) if mem else None)

        # Executive Function (Stroop)
        ex = [t.get("standardized_z_score", 0.0) for t in s_tasks if "stroop" in t.get("task_type", "")]
        exec_z.append(round(sum(ex)/len(ex), 2) if ex else None)

        # Working Memory / Attention (Digit Span)
        att = [t.get("standardized_z_score", 0.0) for t in s_tasks if "digit_span" in t.get("task_type", "")]
        attn_z.append(round(sum(att)/len(att), 2) if att else None)

        # Processing Speed (Trail Making)
        sp = [t.get("standardized_z_score", 0.0) for t in s_tasks if "trail_making" in t.get("task_type", "")]
        speed_z.append(round(sum(sp)/len(sp), 2) if sp else None)

    fig = go.Figure()

    # Add reference band for Normal Range (-1.0 to +1.0)
    fig.add_hrect(
        y0=-1.0, y1=1.0,
        fillcolor="rgba(16, 185, 129, 0.08)",
        line_width=0,
        annotation_text="Normative Average Range (±1 SD)",
        annotation_position="top left"
    )
    # Add mild variance threshold line
    fig.add_hline(y=-1.5, line_dash="dash", line_color="orange", annotation_text="Borderline Threshold (-1.5 SD)")

    fig.add_trace(go.Scatter(
        x=dates, y=memory_z,
        mode="lines+markers",
        name="Episodic Memory",
        line=dict(color="#3b82f6", width=3),
        marker=dict(size=8)
    ))
    fig.add_trace(go.Scatter(
        x=dates, y=exec_z,
        mode="lines+markers",
        name="Executive Function",
        line=dict(color="#8b5cf6", width=2, dash="dot"),
        marker=dict(size=7)
    ))
    fig.add_trace(go.Scatter(
        x=dates, y=attn_z,
        mode="lines+markers",
        name="Attention & Working Memory",
        line=dict(color="#06b6d4", width=2),
        marker=dict(size=7)
    ))
    fig.add_trace(go.Scatter(
        x=dates, y=speed_z,
        mode="lines+markers",
        name="Processing Speed",
        line=dict(color="#ec4899", width=2),
        marker=dict(size=7)
    ))

    fig.update_layout(
        title="Longitudinal Standardized Z-Score Trajectory",
        xaxis_title="Assessment Date",
        yaxis_title="Standardized Z-Score (SD from Normative Mean)",
        yaxis=dict(range=[-3.0, 2.5]),
        template="plotly_white",
        legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1),
        margin=dict(l=40, r=40, t=60, b=40)
    )

    return json.loads(fig.to_json())

@router.get("/radar/{participant_id}")
def get_cognitive_radar_chart(participant_id: str, current_user: dict = Depends(get_current_user)):
    """
    Returns Plotly JSON for a spider/radar chart displaying current cognitive domain profile.
    """
    db = get_db()
    tasks = db.fetch_all("SELECT * FROM MINDBRIDGE.TASK_RESULTS WHERE participant_id = :id ORDER BY created_at DESC", {"id": participant_id})

    categories = ["Episodic Memory", "Working Memory", "Executive Function", "Processing Speed", "Verbal Fluency"]
    
    # Calculate latest z-scores per category
    cat_mapping = {
        "Episodic Memory": ["word_recall_immediate", "word_recall_delayed"],
        "Working Memory": ["digit_span"],
        "Executive Function": ["stroop_interference"],
        "Processing Speed": ["trail_making_b"],
        "Verbal Fluency": ["semantic_fluency"]
    }

    z_scores = []
    for cat in categories:
        keys = cat_mapping[cat]
        relevant = [t.get("standardized_z_score", 0.0) for t in tasks if t.get("task_type") in keys]
        val = sum(relevant)/len(relevant) if relevant else 0.0
        z_scores.append(round(val, 2))

    # Close loop for radar
    r_vals = z_scores + [z_scores[0]]
    theta_vals = categories + [categories[0]]

    fig = go.Figure()

    fig.add_trace(go.Scatterpolar(
        r=r_vals,
        theta=theta_vals,
        fill='toself',
        fillcolor='rgba(59, 130, 246, 0.25)',
        line=dict(color='#2563eb', width=2),
        name="Participant Profile"
    ))

    # Normative baseline circle (Z = 0)
    fig.add_trace(go.Scatterpolar(
        r=[0.0] * len(r_vals),
        theta=theta_vals,
        mode="lines",
        line=dict(color="#10b981", width=1.5, dash="dash"),
        name="Normative Population Average (Z=0)"
    ))

    fig.update_layout(
        polar=dict(
            radialaxis=dict(
                visible=True,
                range=[-2.5, 2.0]
            )
        ),
        title="Cognitive Domain Multifactorial Profile",
        template="plotly_white",
        margin=dict(l=40, r=40, t=50, b=40)
    )

    return json.loads(fig.to_json())

@router.get("/reaction-time/{participant_id}")
def get_reaction_time_distribution(participant_id: str, current_user: dict = Depends(get_current_user)):
    """
    Returns Plotly bar/box chart for reaction times across cognitive tasks.
    """
    db = get_db()
    tasks = db.fetch_all("SELECT * FROM MINDBRIDGE.TASK_RESULTS WHERE participant_id = :id", {"id": participant_id})

    task_names = [t.get("task_name", "Task") for t in tasks]
    mean_rts = [t.get("mean_reaction_time_ms", 0.0) for t in tasks]

    fig = go.Figure(data=[
        go.Bar(
            x=task_names,
            y=mean_rts,
            marker_color="#6366f1",
            text=[f"{round(rt, 0)} ms" for rt in mean_rts],
            textposition="auto"
        )
    ])

    fig.update_layout(
        title="Mean Reaction Time by Cognitive Task",
        xaxis_title="Task",
        yaxis_title="Mean Reaction Time (ms)",
        template="plotly_white",
        margin=dict(l=40, r=40, t=50, b=40)
    )

    return json.loads(fig.to_json())

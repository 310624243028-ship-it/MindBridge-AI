from typing import List
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import HTMLResponse
from app.core.audit import log_audit_event
from app.core.security import get_current_user, require_role
from app.database.connection import get_db
from app.services.report_generator import generate_clinician_screening_report

router = APIRouter(prefix="/clinician", tags=["Clinician Portal"])

@router.get("/roster")
def get_clinician_roster(current_user: dict = Depends(require_role(["clinician", "researcher", "admin"]))):
    """Returns participant roster with longitudinal test indicators and risk markers."""
    db = get_db()
    participants = db.fetch_all("SELECT * FROM MINDBRIDGE.PARTICIPANTS ORDER BY created_at DESC")
    sessions = db.fetch_all("SELECT * FROM MINDBRIDGE.ASSESSMENT_SESSIONS")
    tasks = db.fetch_all("SELECT * FROM MINDBRIDGE.TASK_RESULTS")

    roster = []
    for p in participants:
        p_id = p["participant_id"]
        p_sessions = [s for s in sessions if s.get("participant_id") == p_id]
        p_tasks = [t for t in tasks if t.get("participant_id") == p_id]

        # Determine composite status
        avg_z = 0.0
        if p_tasks:
            z_vals = [t["standardized_z_score"] for t in p_tasks if t.get("standardized_z_score") is not None]
            avg_z = sum(z_vals) / len(z_vals) if z_vals else 0.0

        if avg_z >= -1.0:
            flag = "Stable"
            flag_color = "green"
        elif avg_z >= -1.5:
            flag = "Mild Psychometric Variance"
            flag_color = "yellow"
        else:
            flag = "Elevated Research Discrepancy"
            flag_color = "red"

        latest_session = max([s.get("started_at", "") for s in p_sessions], default="None")

        roster.append({
            "participant_id": p_id,
            "pseudonym_code": p.get("pseudonym_code"),
            "age_group": p.get("age_group"),
            "education_years": p.get("education_years"),
            "consent_version": p.get("consent_version"),
            "total_sessions": len(p_sessions),
            "latest_session": latest_session[:10] if latest_session != "None" else "N/A",
            "composite_z": round(avg_z, 2),
            "research_flag": flag,
            "flag_color": flag_color
        })

    log_audit_event(
        action="VIEW_CLINICIAN_ROSTER",
        resource_type="ROSTER",
        user_id=current_user.get("user_id")
    )

    return roster

@router.get("/report/{participant_id}")
def get_participant_report(participant_id: str, current_user: dict = Depends(require_role(["clinician", "researcher", "admin"]))):
    """Generates structured clinical screening report for a participant."""
    db = get_db()
    p = db.fetch_one("SELECT * FROM MINDBRIDGE.PARTICIPANTS WHERE participant_id = :id", {"id": participant_id})
    if not p:
        raise HTTPException(status_code=404, detail="Participant not found.")

    sessions = db.fetch_all("SELECT * FROM MINDBRIDGE.ASSESSMENT_SESSIONS WHERE participant_id = :id", {"id": participant_id})
    tasks = db.fetch_all("SELECT * FROM MINDBRIDGE.TASK_RESULTS WHERE participant_id = :id", {"id": participant_id})

    clinician_name = current_user.get("full_name") or "Authorized Clinician"
    report = generate_clinician_screening_report(p, sessions, tasks, clinician_name)

    log_audit_event(
        action="GENERATE_CLINICAL_REPORT",
        resource_type="REPORT",
        resource_id=report["report_id"],
        user_id=current_user.get("user_id"),
        details={"participant_id": participant_id}
    )

    return report

@router.get("/report/{participant_id}/export-html", response_class=HTMLResponse)
def export_printable_report_html(participant_id: str, current_user: dict = Depends(require_role(["clinician", "researcher", "admin"]))):
    """Renders a print-ready, professional HTML screening report."""
    db = get_db()
    p = db.fetch_one("SELECT * FROM MINDBRIDGE.PARTICIPANTS WHERE participant_id = :id", {"id": participant_id})
    if not p:
        raise HTTPException(status_code=404, detail="Participant not found.")

    sessions = db.fetch_all("SELECT * FROM MINDBRIDGE.ASSESSMENT_SESSIONS WHERE participant_id = :id", {"id": participant_id})
    tasks = db.fetch_all("SELECT * FROM MINDBRIDGE.TASK_RESULTS WHERE participant_id = :id", {"id": participant_id})

    clinician_name = current_user.get("full_name") or "Authorized Clinician"
    rep = generate_clinician_screening_report(p, sessions, tasks, clinician_name)

    domain_rows_html = "".join([
        f"""
        <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 12px 16px; font-weight: 600;">{d['domain']}</td>
            <td style="padding: 12px 16px; text-align: center;">{d['raw_score']}</td>
            <td style="padding: 12px 16px; text-align: center; font-weight: 700; color: {'#dc2626' if d['z_score'] < -1.5 else '#2563eb'};">{d['z_score']}</td>
            <td style="padding: 12px 16px; text-align: center;">{d['percentile']}th</td>
            <td style="padding: 12px 16px;">
                <span style="display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; background: {'#fee2e2; color: #991b1b;' if d['z_score'] < -1.5 else '#dbeafe; color: #1e40af;'};">
                    {d['status']}
                </span>
            </td>
        </tr>
        """ for d in rep["domain_summary"]
    ])

    html_content = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>MindBridge Screening Report — {rep['pseudonym_code']}</title>
        <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1e293b; background: #fff; margin: 0; padding: 40px; }}
            .container {{ max-width: 850px; margin: 0 auto; border: 1px solid #cbd5e1; border-radius: 8px; padding: 36px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }}
            .header {{ display: flex; justify-content: space-between; border-bottom: 2px solid #0f172a; padding-bottom: 20px; }}
            .brand {{ font-size: 24px; font-weight: 800; color: #0284c7; letter-spacing: -0.5px; }}
            .disclaimer-box {{ background: #fffbeb; border: 1px solid #fef3c7; border-left: 4px solid #f59e0b; padding: 14px 18px; border-radius: 6px; margin: 24px 0; font-size: 13px; color: #92400e; }}
            .meta-grid {{ display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin: 20px 0; padding: 16px; background: #f8fafc; border-radius: 6px; }}
            .meta-item {{ font-size: 12px; color: #64748b; }}
            .meta-val {{ font-size: 15px; font-weight: 700; color: #0f172a; margin-top: 4px; }}
            table {{ width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 14px; }}
            th {{ background: #f1f5f9; padding: 12px 16px; text-align: left; font-size: 12px; color: #475569; text-transform: uppercase; }}
            .print-btn {{ background: #0284c7; color: white; padding: 10px 20px; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; }}
            @media print {{ .no-print {{ display: none; }} body {{ padding: 0; }} .container {{ border: none; box-shadow: none; }} }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="no-print" style="margin-bottom: 20px; text-align: right;">
                <button class="print-btn" onclick="window.print()">🖨️ Print / Save to PDF</button>
            </div>

            <div class="header">
                <div>
                    <div class="brand">MindBridge AI</div>
                    <div style="font-size: 13px; color: #64748b; margin-top: 4px;">Longitudinal Cognitive Screening & Research Platform</div>
                </div>
                <div style="text-align: right;">
                    <div style="font-size: 12px; color: #64748b;">Report ID: {rep['report_id']}</div>
                    <div style="font-size: 12px; color: #64748b;">Generated: {rep['generated_at']}</div>
                </div>
            </div>

            <div class="disclaimer-box">
                <strong>CLINICAL SAFEGUARD & REGULATORY NOTICE:</strong><br>
                {rep['clinical_safeguard_disclaimer']}
            </div>

            <div class="meta-grid">
                <div class="meta-item">Participant Pseudonym<div class="meta-val">{rep['pseudonym_code']}</div></div>
                <div class="meta-item">Age Bracket / Education<div class="meta-val">{rep['age_group']} ({rep['education_years']} yrs)</div></div>
                <div class="meta-item">Sessions Tracked<div class="meta-val">{rep['total_sessions_tracked']} Sessions</div></div>
                <div class="meta-item">Attending Clinician<div class="meta-val">{rep['clinician_name']}</div></div>
            </div>

            <h3 style="margin-top: 32px; margin-bottom: 8px;">Cognitive Domain Normative Synthesis</h3>
            <p style="font-size: 13px; color: #64748b; margin-top: 0;">Scores standardized against normative cohorts adjusted for participant age and education.</p>

            <table>
                <thead>
                    <tr>
                        <th>Domain</th>
                        <th style="text-align: center;">Raw Score</th>
                        <th style="text-align: center;">Z-Score</th>
                        <th style="text-align: center;">Percentile</th>
                        <th>Psychometric Tier</th>
                    </tr>
                </thead>
                <tbody>
                    {domain_rows_html}
                </tbody>
            </table>

            <h3 style="margin-top: 32px; margin-bottom: 8px;">Longitudinal Research Risk Assessment</h3>
            <div style="padding: 16px; background: #f8fafc; border-radius: 6px; border-left: 4px solid #3b82f6;">
                <div style="font-weight: 700; color: #1e40af; margin-bottom: 6px;">
                    Longitudinal Trajectory Status: {rep['research_risk_flag']}
                </div>
                <div style="font-size: 13px; color: #334155;">
                    {rep['clinical_notes']}
                </div>
            </div>

            <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; text-align: center;">
                MindBridge AI Cognitive Health Platform &bull; Exasol Personal High-Performance Analytics &bull; Research & Investigational Use Only
            </div>
        </div>
    </body>
    </html>
    """
    return HTMLResponse(content=html_content, status_code=200)

# MindBridge AI — Cognitive Screening & Longitudinal Monitoring Platform

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI%200.115-009688?logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/Frontend-React%2019%20%2B%20TypeScript-61DAFB?logo=react)](https://react.dev)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind%20CSS%20v4-38B2AC?logo=tailwind-css)](https://tailwindcss.com)
[![Exasol](https://img.shields.io/badge/Database-Exasol%20Personal%20(pyexasol)-002D62?logo=exasol)](https://www.exasol.com/)
[![Plotly](https://img.shields.io/badge/Visualizations-Plotly-3F4F75?logo=plotly)](https://plotly.com/)
[![Tests](https://img.shields.io/badge/Tests-11%20Passed%20(pytest)-brightgreen)](backend/tests/)

> **REGULATORY & CLINICAL BOUNDARY**:
> MindBridge AI is an **investigational cognitive screening and research instrument**. It does **NOT** provide a medical diagnosis of Alzheimer's disease, Mild Cognitive Impairment (MCI), or dementia. All predictive model scores represent normative research indicators intended to assist certified healthcare professionals in longitudinal monitoring.

---

## 1. System Architecture Overview

```
                        ┌─────────────────────────────────────────────────────────┐
                        │      Client Application (React + TypeScript + Tailwind) │
                        │  - Accessible Landing Page & Informed Consent Workflow   │
                        │  - Interactive Battery (Memory, Attention, Stroop, Trail)│
                        │  - Longitudinal Trends & Radar Profiles (Plotly)        │
                        │  - Clinician Roster & Exportable Screening Reports      │
                        │  - Machine Learning Research & Fairness Audit Panel     │
                        └───────────────────────────┬─────────────────────────────┘
                                                    │ REST / JSON (JWT / RBAC)
                                                    ▼
                        ┌─────────────────────────────────────────────────────────┐
                        │              FastAPI Backend Application                │
                        │  - Normative Scoring Engine (Demographic Adjustments)   │
                        │  - Research ML Pipeline (Calibrated RF, Fairness Audit) │
                        │  - HIPAA / GDPR Immutable Audit Logger                  │
                        │  - Interactive Plotly Figure Generators                 │
                        └───────────────────────────┬─────────────────────────────┘
                                                    │ pyexasol / Mock Switch
                                                    ▼
                       ┌────────────────────────────┴─────────────────────────────┐
                       │                                                          │
                       ▼                                                          ▼
        ┌─────────────────────────────┐                    ┌─────────────────────────────┐
        │   Real Exasol Personal DB   │                    │ Explicit Mock Exasol Adapter│
        │   - Official pyexasol client│                    │ [EXPLICIT_MOCK_EXASOL_ADAPTER│
        │   - DDL: MINDBRIDGE schema  │                    │ - Explicit fallback mode    │
        │   - High-performance in-mem │                    │ - Labelled synthetic dev data│
        │   - Host: localhost:8563    │                    │ - In-memory SQL simulation  │
        └─────────────────────────────┘                    └─────────────────────────────┘
```

---

## 2. Interactive Cognitive Assessment Battery

MindBridge AI incorporates 5 computerized, open-access cognitive paradigms designed for millisecond reaction timing and longitudinal tracking:

1. **Word Recall Test (Episodic Verbal Memory)**: 10 standardized words presented sequentially, followed by a brief arithmetic distractor buffer (phonological loop suppression) and free delayed recall.
2. **Adaptive Digit Span (Working Memory & Attention)**: Forward visual sequence reproduction with adaptive length scaling from 3 to 7 digits.
3. **Stroop Color-Word Interference (Executive Function & Inhibitory Control)**: Millisecond-precision measurement of prepotent response suppression ($RT_{incongruent} - RT_{congruent}$).
4. **Trail Making Test - Variant B (Processing Speed & Task Switching)**: Interactive canvas requiring alternating connections ($1 \rightarrow A \rightarrow 2 \rightarrow B \rightarrow 3 \rightarrow C...$) with live stopwatch timing.
5. **Semantic Category Fluency (Language & Lexical Retrieval)**: 60-second speeded category generation with live lexical verification and repetition suppression.

---

## 3. Quick Start & Local Setup

### Prerequisites
- Python 3.10+
- Node.js v18+ & npm
- (Optional) Docker Desktop for local Exasol Personal instance

### Step 1: Start Backend API
```bash
# Optional: create virtual environment
python -m venv venv
venv\Scripts\activate   # On Windows (or source venv/bin/activate on Linux/Mac)

# Install dependencies
pip install -r backend/requirements.txt

# Launch FastAPI Server
python run_backend.py
```
Backend API will start on: `http://127.0.0.1:8000`  
Interactive Swagger API Documentation: `http://127.0.0.1:8000/api/docs`

### Step 2: Start Frontend Application
```bash
cd frontend
npm install
npm run dev
```
Open your browser to: `http://127.0.0.1:5173/`

---

## 4. Exasol Personal Setup Instructions

To connect the application to a running Exasol Personal instance:

1. **Launch Exasol Personal via Docker**:
   ```bash
   docker run --name exasol-mindbridge \
     -p 8563:8563 \
     -p 25826:25826 \
     --detach \
     --privileged \
     exasol/docker-db:latest
   ```

2. **Configure Environment Variables** (in `.env` or system environment):
   ```env
   EXASOL_HOST=localhost
   EXASOL_PORT=8563
   EXASOL_USER=sys
   EXASOL_PASSWORD=exasol
   EXASOL_SCHEMA=MINDBRIDGE
   USE_MOCK_EXASOL=false
   ```

3. **Initialize Schema**:
   ```bash
   python -m app.database.init_db
   ```

> **Fallback Mode**: If Docker or Exasol is not running, the application **never** silently replaces it with SQLite. Instead, it activates the clearly labeled `EXPLICIT_MOCK_EXASOL_ADAPTER`, displays a visible amber status badge in the UI, and marks all development data as synthetic benchmark data.

See [`docs/EXASOL_SETUP.md`](docs/EXASOL_SETUP.md) for full database configuration and cluster tuning details.

---

## 5. Running Automated Test Suites

### Backend Unit & Integration Tests (pytest)
```bash
python -m pytest backend/tests -v
```
All 11 tests cover:
- Real Exasol client structure and pyexasol configuration
- Explicit mock adapter labeling and fallback verification
- JWT authentication, password hashing, and role-based permissions
- Assessment session lifecycle and normative scoring algorithms
- Reaction time inverted scoring (Stroop and Trail Making)
- Research ML pipeline evaluation (ROC-AUC, Sensitivity, Specificity, Brier score, Subgroup Fairness)
- Mandatory clinical safeguard disclaimers on all predictions

### Frontend Production Build
```bash
cd frontend
npm run build
```

---

## 6. Clinical Safeguards & Regulatory Boundaries

Detailed documentation on ethics, data minimization, and instrument licensing is provided in [`docs/CLINICAL_SAFEGUARDS.md`](docs/CLINICAL_SAFEGUARDS.md):
- **Investigational Disclaimer**: Clarifies non-diagnostic boundary under FDA 21 CFR Part 860 / EU MDR.
- **Instrument Segregation**: Explains open experimental tasks vs. licensed clinical instruments (MoCA, MMSE).
- **Subgroup Fairness**: Evaluates demographic parity across age groups ($50-64$, $65-74$, $75+$).
- **Synthetic Data Policy**: Synthetic cohorts are strictly marked as development benchmarks and never cited as clinical evidence.

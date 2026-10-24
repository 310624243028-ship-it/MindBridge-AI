# Exasol Personal Database Setup Guide for MindBridge AI

This document provides complete instructions for running a local Exasol Personal Edition instance for the **MindBridge AI** platform.

---

## 1. Quick Start: Exasol Docker Container

Exasol provides official standalone single-node Docker images suitable for development and testing.

### Prerequisites
- Docker Desktop (or Docker Engine on Linux)
- Minimum 4GB RAM allocated to Docker (Exasol in-memory engine recommendation: 4GB–8GB)
- 10GB free disk space

### Start Exasol Container Command
```bash
docker run --name exasol-mindbridge \
  -p 8563:8563 \
  -p 25826:25826 \
  --detach \
  --privileged \
  exasol/docker-db:latest
```

> **Note on Port 8563**: 
> Exasol client connections (including `pyexasol` WebSocket protocol) communicate on TCP port **8563**.

### Verify Container Health
```bash
# Check container status
docker ps -f name=exasol-mindbridge

# Check startup logs (Wait until you see "Database is ready")
docker logs -f exasol-mindbridge
```

---

## 2. Environment Variables Configuration

Create a `.env` file in the `backend/` directory or export these variables in your shell:

```env
# Exasol Connection
EXASOL_HOST=localhost
EXASOL_PORT=8563
EXASOL_USER=sys
EXASOL_PASSWORD=exasol
EXASOL_SCHEMA=MINDBRIDGE
EXASOL_USE_ENCRYPTION=false
EXASOL_CONNECTION_TIMEOUT=5

# Explicit Mock Mode Switch (set to true to force explicit mock adapter)
USE_MOCK_EXASOL=false

# Security
SECRET_KEY=replace-with-a-secure-random-secret-key-in-production
ACCESS_TOKEN_EXPIRE_MINUTES=1440
```

---

## 3. Initializing the MindBridge Schema

Once the Exasol container is running:

```bash
cd backend
python -m app.database.init_db
```

This script connects via `pyexasol` and runs `app/database/schema.sql`, creating:
1. `PARTICIPANTS` (Pseudonymous participant IDs, demographics, consent hashes)
2. `USERS` (Role-based access credentials: participant, clinician, researcher, admin)
3. `ASSESSMENT_SESSIONS` (Session states, device metadata, duration)
4. `TASK_RESULTS` (Trial scores, reaction times, omission/commission errors, Z-scores)
5. `MODEL_EVALUATION_RECORDS` (Research model performance audits, ROC-AUC, subgroup metrics)
6. `AUDIT_LOGS` (Immutable HIPAA/GDPR compliance logs)

---

## 4. Testing Connectivity

Run the automated database test suite:

```bash
pytest tests/test_database.py -v
```

You can also inspect the database health live via the API:
```http
GET http://localhost:8000/api/system/db-status
```
Response:
```json
{
  "is_mock": false,
  "adapter_name": "REAL_EXASOL_PYEXASOL",
  "host": "localhost",
  "port": 8563,
  "schema": "MINDBRIDGE",
  "health": {
    "status": "healthy",
    "ping": 1,
    "server_time": "2026-10-24 18:30:00"
  }
}
```

---

## 5. Explicit Mock Adapter Behavior (When Docker is Inactive)

If Docker is not running or Exasol is unreachable during development:
- The system **NEVER** silently falls back to SQLite or generic in-memory databases.
- The system activates `ExplicitMockExasolAdapter`, which:
  1. Displays clear warnings in terminal logs.
  2. Flags all data as `is_synthetic_benchmark: true` and `is_mock: true`.
  3. Displays an explicit badge in the web application header: `⚠️ [DEV] Running on Explicit Mock Exasol Adapter`.
  4. Preserves development state and provides seeded test participants for seamless feature verification.

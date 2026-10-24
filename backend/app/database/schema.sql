-- MindBridge AI: Exasol Database Schema
-- Schema: MINDBRIDGE
-- Target DBMS: Exasol Personal / Cloud / Enterprise Edition

CREATE SCHEMA IF NOT EXISTS MINDBRIDGE;
OPEN SCHEMA MINDBRIDGE;

-- 1. Pseudonymous Participants Table
CREATE TABLE IF NOT EXISTS PARTICIPANTS (
    participant_id VARCHAR(64) PRIMARY KEY,
    pseudonym_code VARCHAR(32) NOT NULL UNIQUE,
    age_group VARCHAR(20) NOT NULL,
    education_years INT NOT NULL,
    baseline_notes VARCHAR(2000),
    consent_version VARCHAR(20) NOT NULL,
    consent_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    consent_signature_hash VARCHAR(128),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. User Accounts Table (Role-based access control)
CREATE TABLE IF NOT EXISTS USERS (
    user_id VARCHAR(64) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    hashed_password VARCHAR(255) NOT NULL,
    role VARCHAR(32) NOT NULL,
    full_name VARCHAR(255),
    participant_id VARCHAR(64) REFERENCES PARTICIPANTS(participant_id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Cognitive Assessment Sessions Table
CREATE TABLE IF NOT EXISTS ASSESSMENT_SESSIONS (
    session_id VARCHAR(64) PRIMARY KEY,
    participant_id VARCHAR(64) NOT NULL REFERENCES PARTICIPANTS(participant_id),
    status VARCHAR(32) NOT NULL,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    total_duration_ms INT,
    device_metadata VARCHAR(2000),
    consent_confirmed BOOLEAN DEFAULT TRUE
);

-- 4. Granular Task Results Table
CREATE TABLE IF NOT EXISTS TASK_RESULTS (
    result_id VARCHAR(64) PRIMARY KEY,
    session_id VARCHAR(64) NOT NULL REFERENCES ASSESSMENT_SESSIONS(session_id),
    participant_id VARCHAR(64) NOT NULL REFERENCES PARTICIPANTS(participant_id),
    task_type VARCHAR(64) NOT NULL,
    task_name VARCHAR(128) NOT NULL,
    total_trials INT NOT NULL,
    correct_trials INT NOT NULL,
    error_count INT NOT NULL,
    omission_count INT DEFAULT 0,
    commission_count INT DEFAULT 0,
    mean_reaction_time_ms DOUBLE PRECISION,
    median_reaction_time_ms DOUBLE PRECISION,
    raw_score DOUBLE PRECISION NOT NULL,
    standardized_z_score DOUBLE PRECISION,
    percentile_rank DOUBLE PRECISION,
    metrics_json VARCHAR(4000),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Machine Learning Model Evaluation & Fairness Audit Table
CREATE TABLE IF NOT EXISTS MODEL_EVALUATION_RECORDS (
    evaluation_id VARCHAR(64) PRIMARY KEY,
    model_name VARCHAR(128) NOT NULL,
    model_version VARCHAR(32) NOT NULL,
    evaluation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    dataset_description VARCHAR(500),
    sample_size INT NOT NULL,
    roc_auc DOUBLE PRECISION,
    sensitivity DOUBLE PRECISION,
    specificity DOUBLE PRECISION,
    precision_score DOUBLE PRECISION,
    recall_score DOUBLE PRECISION,
    f1_score DOUBLE PRECISION,
    brier_score DOUBLE PRECISION,
    is_synthetic_benchmark BOOLEAN DEFAULT TRUE,
    fairness_metrics_json VARCHAR(4000),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Clinical & Security Audit Log Table
CREATE TABLE IF NOT EXISTS AUDIT_LOGS (
    log_id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64),
    action VARCHAR(128) NOT NULL,
    resource_type VARCHAR(64) NOT NULL,
    resource_id VARCHAR(64),
    ip_address VARCHAR(45),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    details_json VARCHAR(4000)
);

COMMENT ON TABLE PARTICIPANTS IS 'Pseudonymous participant demographic and consent baseline';
COMMENT ON TABLE ASSESSMENT_SESSIONS IS 'Longitudinal assessment session lifecycle records';
COMMENT ON TABLE TASK_RESULTS IS 'Trial-by-trial and summary cognitive performance metrics';
COMMENT ON TABLE MODEL_EVALUATION_RECORDS IS 'Fairness, calibration and performance audits for research ML models';
COMMENT ON TABLE AUDIT_LOGS IS 'Audit trail for participant data access and clinical exports';

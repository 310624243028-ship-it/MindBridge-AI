export type Role = 'participant' | 'clinician' | 'researcher' | 'admin';

export interface User {
  user_id: string;
  email: string;
  role: Role;
  full_name?: string;
  participant_id?: string;
  is_active: boolean;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  role: Role;
  user_id: string;
  email: string;
  full_name?: string;
  participant_id?: string;
}

export interface Participant {
  participant_id: string;
  pseudonym_code: string;
  age_group: string;
  education_years: number;
  baseline_notes?: string;
  consent_version: string;
  consent_timestamp: string;
  created_at: string;
}

export interface Session {
  session_id: string;
  participant_id: string;
  status: string;
  started_at: string;
  completed_at?: string;
  total_duration_ms?: number;
  device_metadata?: string;
  consent_confirmed: boolean;
}

export interface TaskResult {
  result_id: string;
  session_id: string;
  participant_id: string;
  task_type: string;
  task_name: string;
  total_trials: number;
  correct_trials: number;
  error_count: number;
  omission_count: number;
  commission_count: number;
  mean_reaction_time_ms: number;
  median_reaction_time_ms: number;
  raw_score: number;
  standardized_z_score: number;
  percentile_rank: number;
  metrics_json?: string;
  created_at: string;
}

export interface DomainScore {
  domain: string;
  raw_score: number;
  z_score: number;
  percentile: number;
  status: string;
}

export interface ClinicianReport {
  report_id: string;
  generated_at: string;
  participant_id: string;
  pseudonym_code: string;
  age_group: string;
  education_years: number;
  clinician_name: string;
  total_sessions_tracked: number;
  baseline_date: string;
  latest_session_date: string;
  domain_summary: DomainScore[];
  longitudinal_trajectory: Array<{
    session_id: string;
    date: string;
    overall_composite_z: number;
    memory_z: number;
    tasks_count: number;
  }>;
  research_risk_flag: string;
  clinical_notes: string;
  clinical_safeguard_disclaimer: string;
}

export interface MLEvaluationRecord {
  evaluation_id: string;
  model_name: string;
  model_version: string;
  evaluation_date: string;
  dataset_description: string;
  sample_size: number;
  roc_auc: number;
  sensitivity: number;
  specificity: number;
  precision_score: number;
  recall_score: number;
  f1_score: number;
  brier_score: number;
  is_synthetic_benchmark: boolean;
  calibration_curve: Array<{ pred: number; actual: number }>;
  roc_curve: Array<{ fpr: number; tpr: number }>;
  subgroup_fairness: Array<{
    subgroup: string;
    sample_size: number;
    roc_auc: number;
    sensitivity: number;
  }>;
  fairness_summary: string;
}

export interface DatabaseStatus {
  is_mock: boolean;
  adapter_name: string;
  host: string;
  port: number;
  schema_name: string;
  error_message?: string;
  health: {
    status: string;
    adapter?: string;
    ping?: number;
    server_time?: string;
    clinical_warning?: string;
  };
  active_participants_count: number;
  total_sessions_count: number;
  total_task_results_count: number;
}

import { AuthResponse, ClinicianReport, DatabaseStatus, MLEvaluationRecord, Participant, Role, Session, TaskResult, User } from '../types';

const API_BASE = 'http://127.0.0.1:8000/api';

class ApiService {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('mindbridge_token');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('mindbridge_token', token);
    } else {
      localStorage.removeItem('mindbridge_token');
    }
  }

  getToken(): string | null {
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({ detail: 'Network response was not ok' }));
      throw new Error(errData.detail || `Request failed with status ${response.status}`);
    }

    return response.json();
  }

  // Auth
  async demoSwitch(role: Role): Promise<AuthResponse> {
    const data = await this.request<AuthResponse>(`/auth/demo-switch/${role}`, { method: 'POST' });
    this.setToken(data.access_token);
    return data;
  }

  async getCurrentUser(): Promise<User> {
    return this.request<User>('/auth/me');
  }

  // Participants & Consent
  async registerParticipant(payload: {
    age_group: string;
    education_years: number;
    baseline_notes?: string;
    consent: {
      signature_name: string;
      consent_version: string;
    };
  }): Promise<Participant> {
    return this.request<Participant>('/participants/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getParticipants(): Promise<Participant[]> {
    return this.request<Participant[]>('/participants/');
  }

  async getParticipant(participantId: string): Promise<Participant> {
    return this.request<Participant>(`/participants/${participantId}`);
  }

  // Assessments
  async startSession(participantId: string): Promise<Session> {
    return this.request<Session>('/assessments/start', {
      method: 'POST',
      body: JSON.stringify({
        participant_id: participantId,
        device_metadata: { userAgent: navigator.userAgent, screen: `${window.innerWidth}x${window.innerHeight}` },
        consent_confirmed: true,
      }),
    });
  }

  async submitTaskResult(payload: {
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
    trials_detail?: any[];
    extra_metrics?: any;
  }): Promise<TaskResult> {
    return this.request<TaskResult>('/assessments/tasks/submit', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async completeSession(sessionId: string, durationMs: number): Promise<{ status: string }> {
    return this.request<{ status: string }>(`/assessments/session/${sessionId}/complete`, {
      method: 'POST',
      body: JSON.stringify({ total_duration_ms: durationMs }),
    });
  }

  async getParticipantSessions(participantId: string): Promise<{ sessions: Session[]; tasks: TaskResult[] }> {
    return this.request<{ sessions: Session[]; tasks: TaskResult[] }>(`/assessments/participant/${participantId}`);
  }

  // Analytics & Plotly
  async getLongitudinalChart(participantId: string): Promise<any> {
    return this.request<any>(`/analytics/longitudinal/${participantId}`);
  }

  async getRadarChart(participantId: string): Promise<any> {
    return this.request<any>(`/analytics/radar/${participantId}`);
  }

  async getReactionTimeChart(participantId: string): Promise<any> {
    return this.request<any>(`/analytics/reaction-time/${participantId}`);
  }

  // Clinician
  async getClinicianRoster(): Promise<any[]> {
    return this.request<any[]>('/clinician/roster');
  }

  async getClinicianReport(participantId: string): Promise<ClinicianReport> {
    return this.request<ClinicianReport>(`/clinician/report/${participantId}`);
  }

  getPrintableReportUrl(participantId: string): string {
    return `${API_BASE}/clinician/report/${participantId}/export-html`;
  }

  // ML Research
  async getMLEvaluation(): Promise<MLEvaluationRecord> {
    return this.request<MLEvaluationRecord>('/ml/evaluation');
  }

  async predictInvestigationalRisk(payload: {
    age_group: string;
    education_years: number;
    immediate_recall_z: number;
    delayed_recall_z: number;
    digit_span_z: number;
    stroop_interference_ms: number;
    trail_making_seconds: number;
    prior_decline_slope?: number;
  }): Promise<any> {
    return this.request<any>('/ml/predict', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getRocPlot(): Promise<any> {
    return this.request<any>('/ml/roc-plot');
  }

  async getCalibrationPlot(): Promise<any> {
    return this.request<any>('/ml/calibration-plot');
  }

  // System
  async getDatabaseStatus(): Promise<DatabaseStatus> {
    return this.request<DatabaseStatus>('/system/db-status');
  }

  async getAuditLogs(): Promise<any[]> {
    return this.request<any[]>('/system/audit-logs');
  }
}

export const api = new ApiService();

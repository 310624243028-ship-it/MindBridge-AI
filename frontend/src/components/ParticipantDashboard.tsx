import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Brain, 
  Calendar, 
  Clock, 
  TrendingUp, 
  CheckCircle2, 
  AlertTriangle,
  PlayCircle,
  RefreshCw
} from 'lucide-react';
import { api } from '../services/api';
import { Participant, Session, TaskResult } from '../types';
import { PlotlyChart } from './PlotlyChart';

interface ParticipantDashboardProps {
  participant: Participant | null;
  onStartNewSession: () => void;
}

export const ParticipantDashboard: React.FC<ParticipantDashboardProps> = ({
  participant,
  onStartNewSession,
}) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [tasks, setTasks] = useState<TaskResult[]>([]);
  const [longitudinalPlot, setLongitudinalPlot] = useState<any>(null);
  const [radarPlot, setRadarPlot] = useState<any>(null);
  const [rtPlot, setRtPlot] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const participantId = participant?.participant_id || 'p-1001-synth';

  const loadData = async () => {
    setLoading(true);
    try {
      const [sessData, longPlot, radPlot, reactionPlot] = await Promise.all([
        api.getParticipantSessions(participantId),
        api.getLongitudinalChart(participantId),
        api.getRadarChart(participantId),
        api.getReactionTimeChart(participantId),
      ]);

      setSessions(sessData.sessions || []);
      setTasks(sessData.tasks || []);
      setLongitudinalPlot(longPlot);
      setRadarPlot(radPlot);
      setRtPlot(reactionPlot);
    } catch (err) {
      console.error('Failed to load participant dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [participantId]);

  // Compute composite score
  const avgZ = tasks.length
    ? tasks.reduce((acc, t) => acc + (t.standardized_z_score || 0), 0) / tasks.length
    : 0;

  return (
    <div className="space-y-8 py-6">
      
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-sky-100 px-2 py-0.5 text-xs font-bold text-sky-800 dark:bg-sky-950 dark:text-sky-300">
              Pseudonym ID: {participant?.pseudonym_code || 'MB-P-7281'}
            </span>
            <span className="text-xs text-slate-400">
              Bracket: {participant?.age_group || '65-74'} &bull; {participant?.education_years || 16} Yrs Edu
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1">
            Longitudinal Cognitive Health Trajectory
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Normative tracking across episodic memory, executive inhibition, and working memory.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            title="Refresh analytics from Exasol"
            className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={onStartNewSession}
            className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-sky-700 transition-smooth"
          >
            <PlayCircle className="w-4 h-4" />
            Start Assessment Battery
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Composite Z-Score
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className={`text-3xl font-extrabold ${avgZ >= -1.0 ? 'text-emerald-600' : 'text-amber-600'}`}>
              {avgZ.toFixed(2)}
            </span>
            <span className="text-xs text-slate-400">SD</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {avgZ >= -1.0 ? 'Within Normal Cohort Limits' : 'Mild Longitudinal Variance'}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Sessions Completed
          </div>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-white mt-2">
            {sessions.length}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Standardized administrations
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Tasks Administered
          </div>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-white mt-2">
            {tasks.length}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Trial-by-trial logs in Exasol
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Informed Consent
          </div>
          <div className="flex items-center gap-1.5 text-base font-bold text-emerald-600 dark:text-emerald-400 mt-2">
            <CheckCircle2 className="w-5 h-5" /> Verified & Active
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Protocol: v1.2-irb-approved
          </p>
        </div>

      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Longitudinal Trajectory (2 Cols) */}
        <div className="lg:col-span-2 space-y-2">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            Interactive Longitudinal Standardized Trajectory
          </h3>
          {longitudinalPlot && (
            <PlotlyChart figure={longitudinalPlot} height={360} />
          )}
        </div>

        {/* Cognitive Radar (1 Col) */}
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            Multifactorial Domain Profile
          </h3>
          {radarPlot && (
            <PlotlyChart figure={radarPlot} height={360} />
          )}
        </div>

      </div>

      {/* Reaction Time Distribution */}
      {rtPlot && (
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            Task Latency Profile (Mean Reaction Time)
          </h3>
          <PlotlyChart figure={rtPlot} height={280} />
        </div>
      )}

      {/* Session History Table */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">
          Standardized Session Record History
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50">
              <tr>
                <th className="p-3 font-semibold text-slate-600 dark:text-slate-300">Session ID</th>
                <th className="p-3 font-semibold text-slate-600 dark:text-slate-300">Date & Time</th>
                <th className="p-3 font-semibold text-slate-600 dark:text-slate-300">Status</th>
                <th className="p-3 font-semibold text-slate-600 dark:text-slate-300">Duration</th>
                <th className="p-3 font-semibold text-slate-600 dark:text-slate-300">Device</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {sessions.map((sess) => (
                <tr key={sess.session_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="p-3 font-mono font-medium text-slate-800 dark:text-slate-200">
                    {sess.session_id}
                  </td>
                  <td className="p-3 text-slate-600 dark:text-slate-300">
                    {sess.started_at.replace('T', ' ').slice(0, 16)}
                  </td>
                  <td className="p-3">
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
                      <CheckCircle2 className="w-3 h-3" /> {sess.status}
                    </span>
                  </td>
                  <td className="p-3 text-slate-600 dark:text-slate-300">
                    {sess.total_duration_ms ? `${Math.round(sess.total_duration_ms / 1000)}s` : 'Completed'}
                  </td>
                  <td className="p-3 text-slate-400">
                    Web Client (Desktop/Tablet)
                  </td>
                </tr>
              ))}
              {sessions.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-slate-400">
                    No sessions recorded yet. Click 'Start Assessment Battery' above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

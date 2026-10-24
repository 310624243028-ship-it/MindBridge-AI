import React, { useState } from 'react';
import { 
  Brain, 
  Hash, 
  Palette, 
  Compass, 
  MessageSquare, 
  CheckCircle2, 
  ArrowRight, 
  PlayCircle 
} from 'lucide-react';
import { api } from '../services/api';
import { Participant, Session, TaskResult } from '../types';
import { WordRecallTask } from './tasks/WordRecallTask';
import { DigitSpanTask } from './tasks/DigitSpanTask';
import { StroopTask } from './tasks/StroopTask';
import { TrailMakingTask } from './tasks/TrailMakingTask';
import { SemanticFluencyTask } from './tasks/SemanticFluencyTask';

interface AssessmentBatteryRunnerProps {
  participant: Participant | null;
  onRequestConsent: () => void;
  onFinishBattery: () => void;
}

export const AssessmentBatteryRunner: React.FC<AssessmentBatteryRunnerProps> = ({
  participant,
  onRequestConsent,
  onFinishBattery,
}) => {
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [activeTaskKey, setActiveTaskKey] = useState<string | null>(null);
  const [completedTasks, setCompletedTasks] = useState<TaskResult[]>([]);
  const [sessionStartTime, setSessionStartTime] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  const tasksList = [
    { key: 'word_recall', name: 'Word Recall Test', domain: 'Episodic Verbal Memory', icon: Brain, component: WordRecallTask },
    { key: 'digit_span', name: 'Digit Span Test', domain: 'Attention & Working Memory', icon: Hash, component: DigitSpanTask },
    { key: 'stroop', name: 'Stroop Color-Word Test', domain: 'Inhibitory Control & Executive', icon: Palette, component: StroopTask },
    { key: 'trail_making', name: 'Trail Making Test (B)', domain: 'Processing Speed & Switching', icon: Compass, component: TrailMakingTask },
    { key: 'fluency', name: 'Semantic Category Fluency', domain: 'Language & Lexical Retrieval', icon: MessageSquare, component: SemanticFluencyTask },
  ];

  // Start battery session
  const handleStartBattery = async () => {
    if (!participant) {
      onRequestConsent();
      return;
    }

    setLoading(true);
    try {
      const sess = await api.startSession(participant.participant_id);
      setCurrentSession(sess);
      setSessionStartTime(performance.now());
      setActiveTaskKey(tasksList[0].key);
      setCompletedTasks([]);
    } catch (err) {
      console.error('Failed to start session:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTaskComplete = async (metrics: any) => {
    if (!currentSession || !participant) return;

    try {
      const result = await api.submitTaskResult({
        session_id: currentSession.session_id,
        participant_id: participant.participant_id,
        ...metrics,
      });

      const nextCompleted = [...completedTasks, result];
      setCompletedTasks(nextCompleted);

      // Determine next task or finish
      const currentIndex = tasksList.findIndex((t) => t.key === activeTaskKey);
      if (currentIndex >= 0 && currentIndex + 1 < tasksList.length) {
        setActiveTaskKey(tasksList[currentIndex + 1].key);
      } else {
        // Battery complete!
        const durationMs = Math.round(performance.now() - sessionStartTime);
        await api.completeSession(currentSession.session_id, durationMs);
        setActiveTaskKey('battery_complete');
      }
    } catch (err) {
      console.error('Failed to submit task result:', err);
    }
  };

  // If a task is active, render the specific task component
  if (activeTaskKey && activeTaskKey !== 'battery_complete') {
    const taskConfig = tasksList.find((t) => t.key === activeTaskKey);
    if (taskConfig) {
      const TaskComponent = taskConfig.component;
      const currentIndex = tasksList.findIndex((t) => t.key === activeTaskKey);

      return (
        <div className="space-y-6 py-6">
          {/* Progress Indicator */}
          <div className="max-w-3xl mx-auto flex items-center justify-between text-xs text-slate-500">
            <span>
              Battery Progress: <strong>Task {currentIndex + 1} of {tasksList.length}</strong> ({taskConfig.name})
            </span>
            <span>Participant: {participant?.pseudonym_code || 'MB-P-7281'}</span>
          </div>

          <div className="max-w-3xl mx-auto h-2 bg-slate-200 rounded-full overflow-hidden dark:bg-slate-800">
            <div
              className="h-full bg-sky-600 transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / tasksList.length) * 100}%` }}
            />
          </div>

          <TaskComponent
            onComplete={handleTaskComplete}
            onCancel={() => setActiveTaskKey(null)}
          />
        </div>
      );
    }
  }

  // Battery complete celebratory screen
  if (activeTaskKey === 'battery_complete') {
    return (
      <div className="max-w-2xl mx-auto my-12 rounded-3xl border border-slate-200 bg-white p-8 sm:p-10 text-center shadow-lg dark:border-slate-800 dark:bg-slate-900 space-y-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 mx-auto dark:bg-emerald-950 dark:text-emerald-300">
          <CheckCircle2 className="h-10 w-10" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Cognitive Battery Completed!
          </h2>
          <p className="text-sm text-slate-500">
            All 5 standardized tasks have been recorded and persisted in Exasol.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-left">
          {completedTasks.map((t, i) => (
            <div key={i} className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/60 text-xs">
              <span className="text-[10px] text-slate-400 block">{t.task_name}</span>
              <div className="font-bold text-slate-800 dark:text-white mt-0.5">
                Score: {t.raw_score}
              </div>
              <span className={`text-[10px] font-semibold ${t.standardized_z_score >= -1.0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                Z: {t.standardized_z_score?.toFixed(2)} ({t.percentile_rank}th %ile)
              </span>
            </div>
          ))}
        </div>

        <button
          onClick={onFinishBattery}
          className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-6 py-3 font-bold text-white shadow-md hover:bg-sky-700 transition-smooth"
        >
          View Longitudinal Dashboard & Charts
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // Welcome / Battery Overview Screen
  return (
    <div className="space-y-8 py-6">
      <div className="max-w-3xl mx-auto rounded-3xl border border-slate-200 bg-white p-6 sm:p-10 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-6">
        <div>
          <span className="inline-block rounded-md bg-sky-100 px-2.5 py-0.5 text-xs font-bold text-sky-800 dark:bg-sky-950 dark:text-sky-300 mb-2">
            Standardized Protocol MB-2026
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Standardized Cognitive Screening Battery
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
            This battery consists of 5 interactive tasks evaluating memory, working memory, inhibitory control, task switching, and verbal fluency. Each task takes 1 to 2 minutes.
          </p>
        </div>

        {/* Task Cards List */}
        <div className="space-y-3">
          {tasksList.map((t, idx) => {
            const Icon = t.icon;
            return (
              <div
                key={t.key}
                className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-slate-100/70 dark:border-slate-800 dark:bg-slate-800/40 transition-smooth"
              >
                <div className="flex items-center gap-3.5">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                    {idx + 1}
                  </span>
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">{t.name}</h4>
                    <span className="text-xs text-slate-500 dark:text-slate-400">{t.domain}</span>
                  </div>
                </div>

                <span className="text-xs text-slate-400">~1.5 min</span>
              </div>
            );
          })}
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-xs text-slate-500">
            {participant ? (
              <span>Participant: <strong>{participant.pseudonym_code}</strong> ({participant.age_group})</span>
            ) : (
              <span className="text-amber-600">Informed consent registration required before starting.</span>
            )}
          </div>

          <button
            onClick={handleStartBattery}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 px-6 py-3 font-bold text-white shadow-md hover:from-sky-700 hover:to-indigo-700 transition-smooth disabled:opacity-50"
          >
            <PlayCircle className="w-5 h-5" />
            {participant ? 'Begin Cognitive Battery' : 'Complete Consent & Begin'}
          </button>
        </div>
      </div>
    </div>
  );
};

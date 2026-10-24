import React from 'react';
import { 
  Brain, 
  Activity, 
  UserCheck, 
  FlaskConical, 
  ShieldCheck, 
  Database, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  Lock, 
  Sliders,
  FileText
} from 'lucide-react';

interface LandingProps {
  onStartScreening: () => void;
  onOpenClinician: () => void;
  onOpenResearch: () => void;
  onOpenDbDiagnostics: () => void;
}

export const AccessibleLanding: React.FC<LandingProps> = ({
  onStartScreening,
  onOpenClinician,
  onOpenResearch,
  onOpenDbDiagnostics,
}) => {
  return (
    <div className="space-y-16 py-8">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-sky-950 to-indigo-950 px-6 py-16 sm:px-12 sm:py-20 text-white shadow-xl">
        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-sky-500/20 border border-sky-400/30 px-3.5 py-1 text-xs font-semibold text-sky-200">
            <ShieldCheck className="w-4 h-4 text-sky-400" />
            IRB-Approved Research Platform &bull; Exasol Personal In-Memory Engine
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
            AI-Assisted Cognitive Screening & <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-300">
              Longitudinal Monitoring
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl">
            MindBridge AI enables accessible, millisecond-precision computerized cognitive screening focused on episodic memory, executive inhibition, attention span, and processing speed for Alzheimer's disease research.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              onClick={onStartScreening}
              className="inline-flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 px-6 py-3.5 text-base font-bold text-white shadow-lg hover:from-sky-600 hover:to-sky-700 transition-smooth group"
            >
              Start Participant Screening
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-smooth" />
            </button>

            <button
              onClick={onOpenClinician}
              className="inline-flex items-center gap-2 rounded-xl bg-white/10 border border-white/20 px-5 py-3.5 text-base font-semibold text-white hover:bg-white/20 transition-smooth backdrop-blur-xs"
            >
              <UserCheck className="w-5 h-5 text-sky-300" />
              Clinician Portal & Reports
            </button>

            <button
              onClick={onOpenResearch}
              className="inline-flex items-center gap-2 rounded-xl bg-white/10 border border-white/20 px-5 py-3.5 text-base font-semibold text-white hover:bg-white/20 transition-smooth backdrop-blur-xs"
            >
              <FlaskConical className="w-5 h-5 text-indigo-300" />
              ML Research Lab
            </button>
          </div>

          <div className="flex items-center gap-6 pt-4 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Pseudonymous by Default
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Plotly Longitudinal Trajectories
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Exasol SQL Persistence
            </span>
          </div>
        </div>

        {/* Decorative background brain mesh glow */}
        <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
      </section>

      {/* 5 Core Cognitive Domains Grid */}
      <section className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Comprehensive Cognitive Testing Battery
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            5 standardized experimental paradigms targeting the primary neurocognitive domains sensitive to early mild cognitive variance.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 transition-smooth hover:shadow-md">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300 mb-4">
              <Brain className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
              Verbal Episodic Memory (Word Recall)
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
              10-item standardized word list assessing short-term encoding, phonological suppression via mental math buffer, and free delayed recall.
            </p>
            <span className="inline-block rounded-md bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              Target: Hippocampal & Medial Temporal Networks
            </span>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 transition-smooth hover:shadow-md">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 mb-4">
              <Clock className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
              Working Memory & Attention (Digit Span)
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
              Adaptive sequence length (3 to 7 digits) testing immediate auditory-visual recall and working memory buffer capacity.
            </p>
            <span className="inline-block rounded-md bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              Target: Dorsolateral Prefrontal Cortex (DLPFC)
            </span>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 transition-smooth hover:shadow-md">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 mb-4">
              <Sliders className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
              Inhibitory Control (Stroop Interference)
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
              Measures prepotent response suppression by timing congruent vs incongruent color-ink naming down to the millisecond.
            </p>
            <span className="inline-block rounded-md bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              Target: Anterior Cingulate Cortex (ACC)
            </span>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 transition-smooth hover:shadow-md">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300 mb-4">
              <Activity className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
              Task Switching (Trail Making B Variant)
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
              Interactive node connecting alternating numbers and letters (1-A-2-B) testing visual scanning and cognitive flexibility.
            </p>
            <span className="inline-block rounded-md bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              Target: Frontoparietal Executive Network
            </span>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 transition-smooth hover:shadow-md">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300 mb-4">
              <FileText className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
              Semantic Category Fluency (Language)
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
              Speeded 60-second animal category retrieval measuring semantic clustering, lexical switching, and retrieval rate.
            </p>
            <span className="inline-block rounded-md bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              Target: Left Temporal Cortex & Executive Access
            </span>
          </div>

          <div className="rounded-2xl border border-sky-200 bg-sky-50/50 p-6 shadow-xs dark:border-sky-900 dark:bg-sky-950/30 transition-smooth hover:shadow-md flex flex-col justify-between">
            <div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-600 text-white mb-4">
                <Database className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                Exasol In-Memory Analytics
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                Columnar analytical engine powering instant longitudinal trajectory aggregation, demographic age/education adjustments, and HIPAA audit trails.
              </p>
            </div>
            <button
              onClick={onOpenDbDiagnostics}
              className="text-xs font-bold text-sky-700 dark:text-sky-300 hover:underline text-left"
            >
              Inspect Exasol Database Status &rarr;
            </button>
          </div>

        </div>
      </section>

      {/* Clinical Safeguards & Instrument Licensing Breakdown */}
      <section className="rounded-3xl border border-slate-200 bg-white p-8 sm:p-10 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-6">
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900 dark:bg-amber-950 dark:text-amber-200">
            <Lock className="w-3.5 h-3.5" /> Clinical Integrity & Licensing Standards
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Ethical AI & Instrument Segregation
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            MindBridge AI strictly separates open experimental research tasks from proprietary validated clinical instruments.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-6 dark:border-emerald-950 dark:bg-emerald-950/20">
            <h3 className="text-sm font-bold text-emerald-900 dark:text-emerald-200 mb-2">
              Included: Computerized Experimental Paradigms
            </h3>
            <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-2">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Stroop Test (1935):</strong> Public domain psychometric paradigm for millisecond reaction times.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Verbal Free Recall:</strong> Open cognitive psychology list-learning paradigm.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Adaptive Digit Span:</strong> Open working memory test protocol.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Trail Making B Variant:</strong> Open research task-switching canvas.</span>
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-800/40">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">
              External Validated Instruments (Licensing Documentation)
            </h3>
            <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-2">
              <li className="flex items-start gap-2">
                <span className="font-bold text-slate-400 shrink-0">&bull;</span>
                <span><strong>MoCA (Montreal Cognitive Assessment):</strong> Proprietary instrument owned by MoCA Test Inc. (Z. Nasreddine). Requires formal clinician certification and training.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-slate-400 shrink-0">&bull;</span>
                <span><strong>MMSE (Mini-Mental State Examination):</strong> Copyrighted by Psychological Assessment Resources (PAR).</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-slate-400 shrink-0">&bull;</span>
                <span><strong>ADAS-Cog:</strong> Clinical trial battery requiring standardized training and licensed protocols.</span>
              </li>
            </ul>
          </div>

        </div>
      </section>

    </div>
  );
};

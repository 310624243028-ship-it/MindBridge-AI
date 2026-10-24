import React, { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp, ShieldCheck, FileText } from 'lucide-react';

export const ClinicalSafeguardBanner: React.FC = () => {
  const [expanded, setExpanded] = useState(false);

  return (
    <aside aria-label="Clinical Safeguard Notice" className="border-b border-amber-200 bg-amber-50/90 text-amber-900 transition-smooth dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200">
      <div className="max-w-7xl mx-auto px-4 py-2.5 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-3 text-xs sm:text-sm">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-200 text-amber-800 dark:bg-amber-800 dark:text-amber-100 font-bold">
              !
            </span>
            <span className="font-semibold text-amber-950 dark:text-amber-100">
              Regulatory Disclosure:
            </span>
            <span className="hidden md:inline">
              MindBridge AI is an investigational screening & research instrument. It does <strong>NOT</strong> provide a medical diagnosis of Alzheimer's disease or dementia.
            </span>
            <span className="md:hidden">
              Investigational research instrument — Not a clinical diagnosis.
            </span>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setExpanded(!expanded)}
              className="inline-flex items-center gap-1 font-medium text-amber-800 hover:text-amber-950 dark:text-amber-300 dark:hover:text-amber-100 hover:underline"
            >
              <span>{expanded ? 'Hide Details' : 'Safeguard Details'}</span>
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {expanded && (
          <div className="mt-3 pt-3 border-t border-amber-200/80 dark:border-amber-900/60 text-xs sm:text-sm leading-relaxed space-y-2 pb-1">
            <p>
              • <strong>Investigational Scope:</strong> All task scores, percentiles, and machine learning outputs are standardized psychometric research benchmarks to support longitudinal data collection and clinician workflows.
            </p>
            <p>
              • <strong>Clinical Diagnosis Requirements:</strong> Formal clinical diagnosis of neurodegenerative disease requires certified neurological exams, laboratory biomarkers (e.g., CSF or plasma p-tau217, amyloid beta ratios), neuroimaging (MRI/PET), and accredited comprehensive neuropsychological batteries.
            </p>
            <p>
              • <strong>Licensing & Integrity:</strong> Experimental tasks (e.g. Stroop, Digit Span, Trail Making Variant B) are open computer implementations. Validated proprietary batteries (e.g., MoCA, MMSE) are strictly segregated and require accredited clinician licensing.
            </p>
          </div>
        )}
      </div>
    </aside>
  );
};

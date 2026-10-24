import React, { useState } from 'react';
import { ShieldCheck, FileText, CheckCircle2, X } from 'lucide-react';
import { api } from '../services/api';
import { Participant } from '../types';

interface InformedConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConsentComplete: (participant: Participant) => void;
}

export const InformedConsentModal: React.FC<InformedConsentModalProps> = ({
  isOpen,
  onClose,
  onConsentComplete,
}) => {
  const [ageGroup, setAgeGroup] = useState('65-74');
  const [educationYears, setEducationYears] = useState(16);
  const [baselineNotes, setBaselineNotes] = useState('');
  const [signatureName, setSignatureName] = useState('');
  const [understandsNotDiagnostic, setUnderstandsNotDiagnostic] = useState(false);
  const [agreedToPseudonym, setAgreedToPseudonym] = useState(false);
  const [agreedToResearch, setAgreedToResearch] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signatureName.trim()) {
      setError('Please provide your digital signature name.');
      return;
    }
    if (!understandsNotDiagnostic || !agreedToPseudonym || !agreedToResearch) {
      setError('Please verify and acknowledge all required consent declarations.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const participant = await api.registerParticipant({
        age_group: ageGroup,
        education_years: Number(educationYears),
        baseline_notes: baselineNotes.trim() || undefined,
        consent: {
          signature_name: signatureName.trim(),
          consent_version: 'v1.2-irb-approved',
        },
      });

      onConsentComplete(participant);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to complete consent registration.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white p-6 sm:p-8 shadow-2xl dark:bg-slate-900 dark:border dark:border-slate-800 my-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close consent modal"
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Participant Informed Consent & Registration
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Protocol MB-2026-IRB &bull; Pseudonymous Longitudinal Cognitive Health Research
            </p>
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          {/* Demographic inputs for normative adjustment */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Age Bracket (For Normative Comparison)
              </label>
              <select
                value={ageGroup}
                onChange={(e) => setAgeGroup(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-sm text-slate-800 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="50-59">50 – 59 Years</option>
                <option value="60-69">60 – 69 Years</option>
                <option value="65-74">65 – 74 Years (Typical Baseline)</option>
                <option value="75+">75 Years and Older</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Completed Formal Education (Years)
              </label>
              <input
                type="number"
                min="0"
                max="30"
                value={educationYears}
                onChange={(e) => setEducationYears(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-sm text-slate-800 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
              <span className="text-[10px] text-slate-400">e.g. 12 = High School, 16 = Bachelor's degree</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Baseline Cognitive Observations / Memory Complaints (Optional)
            </label>
            <textarea
              rows={2}
              value={baselineNotes}
              onChange={(e) => setBaselineNotes(e.target.value)}
              placeholder="e.g. Subjective difficulty remembering names or keys; family history of memory decline..."
              className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-sm text-slate-800 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          {/* Mandatory Declarations */}
          <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50/70 p-4 dark:border-amber-900/60 dark:bg-amber-950/30">
            <div className="flex justify-between items-center">
              <div className="text-xs font-bold uppercase tracking-wide text-amber-900 dark:text-amber-200">
                Mandatory Informed Consent Declarations
              </div>
              <button
                type="button"
                onClick={() => {
                  setUnderstandsNotDiagnostic(true);
                  setAgreedToPseudonym(true);
                  setAgreedToResearch(true);
                }}
                className="text-[11px] font-bold text-sky-700 dark:text-sky-300 hover:underline"
              >
                Accept All 3 Declarations
              </button>
            </div>

            <div className="flex items-start gap-2.5">
              <input
                id="consent-check-1"
                type="checkbox"
                checked={understandsNotDiagnostic}
                onChange={(e) => setUnderstandsNotDiagnostic(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
              />
              <label htmlFor="consent-check-1" className="cursor-pointer text-xs text-slate-700 dark:text-slate-200">
                <strong>Non-Diagnostic Understanding:</strong> I acknowledge that MindBridge AI is an investigational screening and research tool, and does <strong>NOT</strong> provide a clinical diagnosis of Alzheimer's disease or dementia.
              </label>
            </div>

            <div className="flex items-start gap-2.5">
              <input
                id="consent-check-2"
                type="checkbox"
                checked={agreedToPseudonym}
                onChange={(e) => setAgreedToPseudonym(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
              />
              <label htmlFor="consent-check-2" className="cursor-pointer text-xs text-slate-700 dark:text-slate-200">
                <strong>Pseudonymization:</strong> I understand that my test results will be stored under a random pseudonymous identifier (e.g. MB-P-XXXX) decoupled from my legal identity in an Exasol high-performance database.
              </label>
            </div>

            <div className="flex items-start gap-2.5">
              <input
                id="consent-check-3"
                type="checkbox"
                checked={agreedToResearch}
                onChange={(e) => setAgreedToResearch(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
              />
              <label htmlFor="consent-check-3" className="cursor-pointer text-xs text-slate-700 dark:text-slate-200">
                <strong>Longitudinal Tracking:</strong> I consent to repeated cognitive assessments over time to establish personal baseline trajectories.
              </label>
            </div>
          </div>

          {/* Digital Signature */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Digital Signature (Type Full Legal Name or Participant Initials)
            </label>
            <input
              type="text"
              required
              value={signatureName}
              onChange={(e) => setSignatureName(e.target.value)}
              placeholder="e.g. J. Doe"
              className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-sm font-semibold text-slate-800 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
            <span className="text-[10px] text-slate-400">
              A cryptographic SHA-256 hash of this signature will be permanently recorded in the Exasol audit log.
            </span>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-6 py-2 text-sm font-bold text-white shadow-md hover:bg-sky-700 disabled:opacity-50 transition-smooth"
            >
              {loading ? 'Recording Consent...' : 'Sign & Complete Registration'}
              <CheckCircle2 className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

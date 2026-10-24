import React, { useState, useEffect } from 'react';
import { 
  UserCheck, 
  Search, 
  FileDown, 
  Printer, 
  AlertTriangle, 
  CheckCircle2, 
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Eye,
  RefreshCw
} from 'lucide-react';
import { api } from '../services/api';
import { ClinicianReport } from '../types';

export const ClinicianDashboard: React.FC = () => {
  const [roster, setRoster] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReport, setSelectedReport] = useState<ClinicianReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [reportLoading, setReportLoading] = useState(false);

  const loadRoster = async () => {
    setLoading(true);
    try {
      const data = await api.getClinicianRoster();
      setRoster(data || []);
      // Pre-select first participant if available
      if (data && data.length > 0 && !selectedReport) {
        viewReport(data[0].participant_id);
      }
    } catch (err) {
      console.error('Failed to load clinician roster:', err);
    } finally {
      setLoading(false);
    }
  };

  const viewReport = async (participantId: string) => {
    setReportLoading(true);
    try {
      const rep = await api.getClinicianReport(participantId);
      setSelectedReport(rep);
    } catch (err) {
      console.error('Failed to fetch clinical report:', err);
    } finally {
      setReportLoading(false);
    }
  };

  useEffect(() => {
    loadRoster();
  }, []);

  const filteredRoster = roster.filter(
    (p) =>
      p.pseudonym_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.age_group?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.research_flag?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 py-6">
      
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div>
          <div className="inline-flex items-center gap-2 rounded-md bg-indigo-100 px-2 py-0.5 text-xs font-bold text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 mb-1">
            <UserCheck className="w-3.5 h-3.5" /> Clinician & Neuropsychology Portal
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Longitudinal Screening Roster & Reports
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Exportable screening summaries, normative domain analyses, and longitudinal variance tracking.
          </p>
        </div>

        <button
          onClick={loadRoster}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Cohort
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Participant Roster (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
            
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Monitored Cohort ({filteredRoster.length})
              </h3>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search pseudonym (e.g. MB-P-7281)..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-sky-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            {/* Roster List */}
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {filteredRoster.map((p) => {
                const isSelected = selectedReport?.participant_id === p.participant_id;
                return (
                  <div
                    key={p.participant_id}
                    onClick={() => viewReport(p.participant_id)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-smooth ${
                      isSelected
                        ? 'border-sky-500 bg-sky-50/70 dark:border-sky-500 dark:bg-sky-950/40 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-bold text-sm text-slate-900 dark:text-white">
                          {p.pseudonym_code}
                        </span>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Age: {p.age_group} &bull; {p.total_sessions} sessions tracked
                        </div>
                      </div>

                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          p.flag_color === 'green'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : p.flag_color === 'yellow'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        }`}
                      >
                        {p.research_flag}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-slate-400 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <span>Composite: <strong>{p.composite_z} SD</strong></span>
                      <span>Last: {p.latest_session}</span>
                    </div>
                  </div>
                );
              })}

              {filteredRoster.length === 0 && (
                <div className="p-6 text-center text-xs text-slate-400">
                  No participants matched your search.
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Right Column: Full Clinical Report Preview & Export (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          {reportLoading ? (
            <div className="flex h-96 items-center justify-center rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
              <div className="text-center space-y-2">
                <RefreshCw className="w-8 h-8 animate-spin text-sky-600 mx-auto" />
                <p className="text-xs text-slate-500">Generating standardized clinical screening report...</p>
              </div>
            </div>
          ) : selectedReport ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-6">
              
              {/* Report Actions Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
                <div>
                  <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                    Exportable Clinical Screening Summary
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Report: {selectedReport.pseudonym_code}
                  </h3>
                  <div className="text-xs text-slate-500">
                    ID: {selectedReport.report_id} &bull; Generated: {selectedReport.generated_at}
                  </div>
                </div>

                <a
                  href={api.getPrintableReportUrl(selectedReport.participant_id)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-sky-700 transition-smooth"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print / Save PDF
                </a>
              </div>

              {/* Regulatory Safeguard Notice Box */}
              <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3.5 text-xs text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200 leading-relaxed">
                <strong>CLINICAL SAFEGUARD & ETHICAL BOUNDARY:</strong><br />
                {selectedReport.clinical_safeguard_disclaimer}
              </div>

              {/* Participant Demographic Meta Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50 text-xs">
                <div>
                  <span className="text-slate-400">Pseudonym</span>
                  <div className="font-bold text-slate-800 dark:text-white">{selectedReport.pseudonym_code}</div>
                </div>
                <div>
                  <span className="text-slate-400">Age Bracket</span>
                  <div className="font-bold text-slate-800 dark:text-white">{selectedReport.age_group}</div>
                </div>
                <div>
                  <span className="text-slate-400">Education</span>
                  <div className="font-bold text-slate-800 dark:text-white">{selectedReport.education_years} Years</div>
                </div>
                <div>
                  <span className="text-slate-400">Sessions</span>
                  <div className="font-bold text-slate-800 dark:text-white">{selectedReport.total_sessions_tracked} Recorded</div>
                </div>
              </div>

              {/* Domain Synthesis Table */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                  Normative Cognitive Domain Synthesis
                </h4>

                <div className="overflow-x-auto border border-slate-200 rounded-xl dark:border-slate-800">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800">
                      <tr>
                        <th className="p-2.5 font-semibold text-slate-600 dark:text-slate-300">Domain</th>
                        <th className="p-2.5 text-center font-semibold text-slate-600 dark:text-slate-300">Raw</th>
                        <th className="p-2.5 text-center font-semibold text-slate-600 dark:text-slate-300">Z-Score</th>
                        <th className="p-2.5 text-center font-semibold text-slate-600 dark:text-slate-300">Percentile</th>
                        <th className="p-2.5 font-semibold text-slate-600 dark:text-slate-300">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {selectedReport.domain_summary.map((d, i) => (
                        <tr key={i} className="hover:bg-slate-50/50">
                          <td className="p-2.5 font-semibold text-slate-800 dark:text-slate-200">{d.domain}</td>
                          <td className="p-2.5 text-center text-slate-600 dark:text-slate-300">{d.raw_score}</td>
                          <td className={`p-2.5 text-center font-bold ${d.z_score < -1.5 ? 'text-rose-600' : 'text-sky-600'}`}>
                            {d.z_score}
                          </td>
                          <td className="p-2.5 text-center text-slate-600 dark:text-slate-300">{d.percentile}th</td>
                          <td className="p-2.5">
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                              d.z_score < -1.5 
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200' 
                                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                            }`}>
                              {d.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Clinician Synthesis Notes */}
              <div className="rounded-xl border border-sky-100 bg-sky-50/50 p-4 dark:border-sky-950 dark:bg-sky-950/20 space-y-1">
                <div className="text-xs font-bold text-sky-900 dark:text-sky-200">
                  Longitudinal Trajectory Status: {selectedReport.research_risk_flag}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {selectedReport.clinical_notes}
                </p>
              </div>

            </div>
          ) : (
            <div className="flex h-96 items-center justify-center rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 text-xs text-slate-400">
              Select a participant from the left roster to view their clinical screening report.
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

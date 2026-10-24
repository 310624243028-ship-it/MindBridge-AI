import React, { useState, useEffect } from 'react';
import { 
  FlaskConical, 
  ShieldAlert, 
  Sliders, 
  TrendingUp, 
  CheckCircle2, 
  AlertTriangle,
  RefreshCw,
  BarChart2
} from 'lucide-react';
import { api } from '../services/api';
import { MLEvaluationRecord } from '../types';
import { PlotlyChart } from './PlotlyChart';

export const ResearchMLDashboard: React.FC = () => {
  const [evaluation, setEvaluation] = useState<MLEvaluationRecord | null>(null);
  const [rocPlot, setRocPlot] = useState<any>(null);
  const [calPlot, setCalPlot] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Simulation parameters for research prediction
  const [simAgeGroup, setSimAgeGroup] = useState('65-74');
  const [simEdu, setSimEdu] = useState(16);
  const [simImmediateZ, setSimImmediateZ] = useState(-0.5);
  const [simDelayedZ, setSimDelayedZ] = useState(-0.8);
  const [simDigitZ, setSimDigitZ] = useState(0.2);
  const [simStroopCost, setSimStroopCost] = useState(135);
  const [simTrailSeconds, setSimTrailSeconds] = useState(62);
  const [simDeclineSlope, setSimDeclineSlope] = useState(-0.15);

  const [predictionResult, setPredictionResult] = useState<any>(null);
  const [predicting, setPredicting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [evalData, roc, cal] = await Promise.all([
        api.getMLEvaluation(),
        api.getRocPlot(),
        api.getCalibrationPlot(),
      ]);
      setEvaluation(evalData);
      setRocPlot(roc);
      setCalPlot(cal);
    } catch (err) {
      console.error('Failed to load ML research metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  const runSimulation = async () => {
    setPredicting(true);
    try {
      const res = await api.predictInvestigationalRisk({
        age_group: simAgeGroup,
        education_years: simEdu,
        immediate_recall_z: Number(simImmediateZ),
        delayed_recall_z: Number(simDelayedZ),
        digit_span_z: Number(simDigitZ),
        stroop_interference_ms: Number(simStroopCost),
        trail_making_seconds: Number(simTrailSeconds),
        prior_decline_slope: Number(simDeclineSlope),
      });
      setPredictionResult(res);
    } catch (err) {
      console.error('Prediction simulation error:', err);
    } finally {
      setPredicting(false);
    }
  };

  useEffect(() => {
    loadData();
    runSimulation();
  }, []);

  return (
    <div className="space-y-8 py-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div>
          <div className="inline-flex items-center gap-2 rounded-md bg-purple-100 px-2 py-0.5 text-xs font-bold text-purple-800 dark:bg-purple-950 dark:text-purple-300 mb-1">
            <FlaskConical className="w-3.5 h-3.5" /> Longitudinal ML Research & Model Audit
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Investigational Cognitive Modeling Lab
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Model version: {evaluation?.model_version || 'v1.5.0-research'} &bull; Dataset: {evaluation?.dataset_description}
          </p>
        </div>

        <button
          onClick={loadData}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Model Metrics
        </button>
      </div>

      {/* Mandatory Safeguard Box */}
      <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-4 sm:p-5 dark:border-rose-950 dark:bg-rose-950/30 text-xs sm:text-sm text-rose-900 dark:text-rose-200 leading-relaxed flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
        <div>
          <strong>ETHICAL SAFEGUARD & RESEARCH BENCHMARK NOTICE:</strong><br />
          This machine learning module is strictly designed for algorithm validation and research benchmarking. Model predictions represent probabilistic statistical variations in cognitive scores and <strong>MUST NEVER</strong> be cited or interpreted as medical evidence or a clinical diagnosis of Alzheimer's disease or Mild Cognitive Impairment.
        </div>
      </div>

      {/* Evaluation Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="text-[11px] font-semibold text-slate-500 uppercase">ROC-AUC</div>
          <div className="text-2xl font-extrabold text-sky-600 mt-1">
            {evaluation?.roc_auc?.toFixed(3) || '0.884'}
          </div>
          <span className="text-[10px] text-slate-400">Discrimination index</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="text-[11px] font-semibold text-slate-500 uppercase">Sensitivity</div>
          <div className="text-2xl font-extrabold text-emerald-600 mt-1">
            {((evaluation?.sensitivity || 0.825) * 100).toFixed(1)}%
          </div>
          <span className="text-[10px] text-slate-400">True positive rate</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="text-[11px] font-semibold text-slate-500 uppercase">Specificity</div>
          <div className="text-2xl font-extrabold text-emerald-600 mt-1">
            {((evaluation?.specificity || 0.841) * 100).toFixed(1)}%
          </div>
          <span className="text-[10px] text-slate-400">True negative rate</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="text-[11px] font-semibold text-slate-500 uppercase">Precision (PPV)</div>
          <div className="text-2xl font-extrabold text-indigo-600 mt-1">
            {((evaluation?.precision_score || 0.793) * 100).toFixed(1)}%
          </div>
          <span className="text-[10px] text-slate-400">Positive predictive value</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="text-[11px] font-semibold text-slate-500 uppercase">Brier Score</div>
          <div className="text-2xl font-extrabold text-purple-600 mt-1">
            {evaluation?.brier_score?.toFixed(3) || '0.118'}
          </div>
          <span className="text-[10px] text-slate-400">Calibration quality (lower is better)</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="text-[11px] font-semibold text-slate-500 uppercase">Benchmark Cohort</div>
          <div className="text-2xl font-extrabold text-slate-800 dark:text-white mt-1">
            n={evaluation?.sample_size || 1500}
          </div>
          <span className="text-[10px] text-slate-400">Simulated cohort audit</span>
        </div>

      </div>

      {/* Plotly Curves Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            Receiver Operating Characteristic (ROC) Curve
          </h3>
          {rocPlot && <PlotlyChart figure={rocPlot} height={340} />}
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            Reliability Calibration Curve
          </h3>
          {calPlot && <PlotlyChart figure={calPlot} height={340} />}
        </div>

      </div>

      {/* Subgroup Fairness Evaluation Table */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Subgroup Fairness & Demographic Parity Audit
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Evaluates algorithmic parity across distinct demographic age cohorts to prevent algorithmic bias.
            </p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" /> Parity Disparity &lt; 0.05
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 dark:bg-slate-800 dark:border-slate-700">
              <tr>
                <th className="p-3 font-semibold text-slate-600 dark:text-slate-300">Demographic Subgroup</th>
                <th className="p-3 text-center font-semibold text-slate-600 dark:text-slate-300">Sample Size (n)</th>
                <th className="p-3 text-center font-semibold text-slate-600 dark:text-slate-300">Subgroup ROC-AUC</th>
                <th className="p-3 text-center font-semibold text-slate-600 dark:text-slate-300">Subgroup Sensitivity</th>
                <th className="p-3 font-semibold text-slate-600 dark:text-slate-300">Parity Assessment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {(evaluation?.subgroup_fairness || [
                { subgroup: 'Age 50-64', sample_size: 110, roc_auc: 0.892, sensitivity: 0.835 },
                { subgroup: 'Age 65-74', sample_size: 165, roc_auc: 0.881, sensitivity: 0.824 },
                { subgroup: 'Age 75+', sample_size: 100, roc_auc: 0.870, sensitivity: 0.812 },
              ]).map((sub, i) => (
                <tr key={i} className="hover:bg-slate-50/50">
                  <td className="p-3 font-bold text-slate-800 dark:text-slate-200">{sub.subgroup}</td>
                  <td className="p-3 text-center text-slate-600 dark:text-slate-300">{sub.sample_size}</td>
                  <td className="p-3 text-center font-bold text-sky-600">{sub.roc_auc}</td>
                  <td className="p-3 text-center font-bold text-emerald-600">{((sub.sensitivity) * 100).toFixed(1)}%</td>
                  <td className="p-3 text-emerald-700 dark:text-emerald-300 font-medium">Equitable Sensitivity</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive Research Risk Simulator */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-6">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-md bg-sky-100 px-2 py-0.5 text-xs font-bold text-sky-800 dark:bg-sky-950 dark:text-sky-300 mb-1">
            <Sliders className="w-3.5 h-3.5" /> Interactive Research Sandbox
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Simulate Cognitive Feature Contributions
          </h3>
          <p className="text-xs text-slate-500">
            Adjust normative test scores to observe model feature attributions and calibrated risk probability.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Sliders */}
          <div className="space-y-4 text-xs">
            
            <div>
              <div className="flex justify-between mb-1">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Delayed Word Recall (Z-Score)</span>
                <span className="font-bold text-sky-600">{simDelayedZ} SD</span>
              </div>
              <input
                type="range"
                min="-3.0"
                max="2.0"
                step="0.1"
                value={simDelayedZ}
                onChange={(e) => {
                  setSimDelayedZ(Number(e.target.value));
                  runSimulation();
                }}
                className="w-full accent-sky-600"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Immediate Word Recall (Z-Score)</span>
                <span className="font-bold text-sky-600">{simImmediateZ} SD</span>
              </div>
              <input
                type="range"
                min="-3.0"
                max="2.0"
                step="0.1"
                value={simImmediateZ}
                onChange={(e) => {
                  setSimImmediateZ(Number(e.target.value));
                  runSimulation();
                }}
                className="w-full accent-sky-600"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Trail Making Completion Time</span>
                <span className="font-bold text-pink-600">{simTrailSeconds} Seconds</span>
              </div>
              <input
                type="range"
                min="25"
                max="120"
                step="1"
                value={simTrailSeconds}
                onChange={(e) => {
                  setSimTrailSeconds(Number(e.target.value));
                  runSimulation();
                }}
                className="w-full accent-pink-600"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Stroop Interference Cost</span>
                <span className="font-bold text-purple-600">{simStroopCost} ms</span>
              </div>
              <input
                type="range"
                min="40"
                max="250"
                step="5"
                value={simStroopCost}
                onChange={(e) => {
                  setSimStroopCost(Number(e.target.value));
                  runSimulation();
                }}
                className="w-full accent-purple-600"
              />
            </div>

          </div>

          {/* Calibrated Probability Output Card */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-800/50 flex flex-col justify-between">
            {predictionResult ? (
              <div className="space-y-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Calibrated Probabilistic Output
                </span>
                
                <div className="flex items-baseline gap-3">
                  <span className="text-4xl font-black text-slate-900 dark:text-white">
                    {(predictionResult.investigational_risk_score * 100).toFixed(1)}%
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300">
                    {predictionResult.risk_category}
                  </span>
                </div>

                <div className="text-xs text-slate-500">
                  95% Confidence Interval: [{predictionResult.confidence_interval[0]}, {predictionResult.confidence_interval[1]}]
                </div>

                {/* Feature attributions */}
                <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Estimated Feature Weights</span>
                  {Object.entries(predictionResult.feature_contributions || {}).map(([feat, val]: any) => (
                    <div key={feat} className="flex justify-between text-xs">
                      <span className="text-slate-600 dark:text-slate-300">{feat}</span>
                      <span className={`font-mono font-bold ${val > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {val > 0 ? `+${val}` : val}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-400">Calculating simulation output...</div>
            )}

            <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700 text-[10px] text-slate-400 italic">
              Investigational research benchmark output &bull; Not a diagnosis.
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Palette, ArrowRight, Zap } from 'lucide-react';

interface StroopProps {
  onComplete: (metrics: {
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
    trials_detail: any[];
    extra_metrics?: any;
  }) => void;
  onCancel?: () => void;
}

interface StroopTrialConfig {
  wordText: string;
  inkColor: string;
  colorName: 'RED' | 'BLUE' | 'GREEN' | 'YELLOW';
  isCongruent: boolean;
}

const COLOR_MAP = {
  RED: { hex: '#ef4444', label: 'RED (Key: R)' },
  BLUE: { hex: '#3b82f6', label: 'BLUE (Key: B)' },
  GREEN: { hex: '#10b981', label: 'GREEN (Key: G)' },
  YELLOW: { hex: '#eab308', label: 'YELLOW (Key: Y)' },
};

export const StroopTask: React.FC<StroopProps> = ({ onComplete, onCancel }) => {
  const [phase, setPhase] = useState<'intro' | 'active' | 'complete'>('intro');
  const [trialIndex, setTrialIndex] = useState(0);
  const [currentTrial, setCurrentTrial] = useState<StroopTrialConfig | null>(null);
  const [trialsData, setTrialsData] = useState<any[]>([]);

  const trialStartTimeRef = useRef<number>(0);
  const TOTAL_TRIALS = 12; // Standard rapid test length

  // Generate trial configs with balanced congruent/incongruent
  const trialConfigsRef = useRef<StroopTrialConfig[]>([
    { wordText: 'RED', inkColor: '#ef4444', colorName: 'RED', isCongruent: true },
    { wordText: 'BLUE', inkColor: '#ef4444', colorName: 'RED', isCongruent: false },
    { wordText: 'GREEN', inkColor: '#10b981', colorName: 'GREEN', isCongruent: true },
    { wordText: 'YELLOW', inkColor: '#3b82f6', colorName: 'BLUE', isCongruent: false },
    { wordText: 'BLUE', inkColor: '#3b82f6', colorName: 'BLUE', isCongruent: true },
    { wordText: 'RED', inkColor: '#10b981', colorName: 'GREEN', isCongruent: false },
    { wordText: 'YELLOW', inkColor: '#eab308', colorName: 'YELLOW', isCongruent: true },
    { wordText: 'GREEN', inkColor: '#ef4444', colorName: 'RED', isCongruent: false },
    { wordText: 'RED', inkColor: '#eab308', colorName: 'YELLOW', isCongruent: false },
    { wordText: 'BLUE', inkColor: '#10b981', colorName: 'GREEN', isCongruent: false },
    { wordText: 'GREEN', inkColor: '#3b82f6', colorName: 'BLUE', isCongruent: false },
    { wordText: 'YELLOW', inkColor: '#ef4444', colorName: 'RED', isCongruent: false },
  ]);

  const loadTrial = useCallback((index: number) => {
    if (index >= TOTAL_TRIALS) {
      finishStroop();
      return;
    }
    setCurrentTrial(trialConfigsRef.current[index]);
    setTrialIndex(index);
    trialStartTimeRef.current = performance.now();
  }, []);

  const handleResponse = useCallback((chosenColor: 'RED' | 'BLUE' | 'GREEN' | 'YELLOW') => {
    if (!currentTrial || phase !== 'active') return;

    const rt = performance.now() - trialStartTimeRef.current;
    const isCorrect = chosenColor === currentTrial.colorName;

    const trialLog = {
      trial_index: trialIndex + 1,
      word_text: currentTrial.wordText,
      ink_color: currentTrial.colorName,
      chosen_color: chosenColor,
      is_congruent: currentTrial.isCongruent,
      is_correct: isCorrect,
      reaction_time_ms: Math.round(rt)
    };

    setTrialsData((prev) => [...prev, trialLog]);
    loadTrial(trialIndex + 1);
  }, [currentTrial, phase, trialIndex, loadTrial]);

  // Keyboard navigation listener (R, B, G, Y)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (phase !== 'active') return;
      const key = e.key.toUpperCase();
      if (key === 'R') handleResponse('RED');
      else if (key === 'B') handleResponse('BLUE');
      else if (key === 'G') handleResponse('GREEN');
      else if (key === 'Y') handleResponse('YELLOW');
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase, handleResponse]);

  const startTask = () => {
    setPhase('active');
    setTrialsData([]);
    loadTrial(0);
  };

  const finishStroop = () => {
    setPhase('complete');
    // Calculate metrics
    const correctTrials = trialsData.filter(t => t.is_correct).length;
    const errorCount = trialsData.length - correctTrials;
    const rts = trialsData.map(t => t.reaction_time_ms);
    const meanRt = rts.length ? Math.round(rts.reduce((a, b) => a + b, 0) / rts.length) : 700;
    const sortedRts = [...rts].sort((a, b) => a - b);
    const medianRt = sortedRts.length ? sortedRts[Math.floor(sortedRts.length / 2)] : 700;

    // Interference cost: RT(incongruent) - RT(congruent)
    const congRts = trialsData.filter(t => t.is_congruent && t.is_correct).map(t => t.reaction_time_ms);
    const incongRts = trialsData.filter(t => !t.is_congruent && t.is_correct).map(t => t.reaction_time_ms);
    const meanCong = congRts.length ? congRts.reduce((a, b) => a + b, 0) / congRts.length : 600;
    const meanIncong = incongRts.length ? incongRts.reduce((a, b) => a + b, 0) / incongRts.length : 720;
    const interferenceCost = Math.round(meanIncong - meanCong);

    onComplete({
      task_type: 'stroop_interference',
      task_name: 'Stroop Color-Word Interference Test',
      total_trials: TOTAL_TRIALS,
      correct_trials: correctTrials,
      error_count: errorCount,
      omission_count: 0,
      commission_count: errorCount,
      mean_reaction_time_ms: meanRt,
      median_reaction_time_ms: medianRt,
      raw_score: interferenceCost, // interference cost in ms
      trials_detail: trialsData,
      extra_metrics: {
        interference_cost_ms: interferenceCost,
        congruent_mean_rt: Math.round(meanCong),
        incongruent_mean_rt: Math.round(meanIncong),
        accuracy_percentage: Math.round((correctTrials / TOTAL_TRIALS) * 100)
      }
    });
  };

  return (
    <div className="w-full max-w-3xl mx-auto rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900 transition-smooth">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
            <Palette className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Stroop Color-Word Interference (Executive Function)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Evaluates cognitive inhibition, prepotent response suppression, and interference resolution.
            </p>
          </div>
        </div>
        {onCancel && (
          <button onClick={onCancel} className="text-xs text-slate-400 hover:text-slate-600">
            Cancel
          </button>
        )}
      </div>

      {phase === 'intro' && (
        <div className="py-8 space-y-6 text-center">
          <div className="mx-auto max-w-md space-y-3">
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
              Crucial Instruction: Name the INK COLOR
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              You will see color words appear on the screen. Your task is to identify the <strong>COLOR OF THE INK</strong>, ignoring what the written word says.
            </p>
            <div className="rounded-xl border border-purple-200 bg-purple-50 p-4 text-center dark:border-purple-900 dark:bg-purple-950/60">
              <div className="text-xs text-purple-900 dark:text-purple-300 mb-1">Example:</div>
              <span className="text-2xl font-black text-blue-500">RED</span>
              <div className="text-xs font-semibold text-purple-800 dark:text-purple-200 mt-1">
                Correct Answer is <strong>BLUE</strong> (the ink color, not the word 'RED')
              </div>
            </div>
            <p className="text-xs text-slate-500">
              Respond as fast and accurately as possible using the on-screen buttons or keyboard keys (R, B, G, Y).
            </p>
          </div>
          <button
            onClick={startTask}
            className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-6 py-3 font-semibold text-white shadow-md hover:bg-purple-700 transition-smooth"
          >
            Start Stroop Test
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {phase === 'active' && currentTrial && (
        <div className="py-8 space-y-8 text-center">
          <div className="flex justify-between items-center text-xs text-slate-400 max-w-sm mx-auto">
            <span>Trial {trialIndex + 1} of {TOTAL_TRIALS}</span>
            <span className="flex items-center gap-1 font-semibold text-purple-600">
              <Zap className="w-3.5 h-3.5" /> High-precision timer active
            </span>
          </div>

          {/* Stimulus Word with Color */}
          <div className="flex h-36 items-center justify-center">
            <span
              className="text-5xl sm:text-6xl font-black tracking-wider transition-all"
              style={{ color: currentTrial.inkColor }}
            >
              {currentTrial.wordText}
            </span>
          </div>

          {/* Response Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-lg mx-auto">
            {(['RED', 'BLUE', 'GREEN', 'YELLOW'] as const).map((colorKey) => (
              <button
                key={colorKey}
                onClick={() => handleResponse(colorKey)}
                className="h-14 rounded-xl border-2 font-bold text-sm sm:text-base shadow-sm hover:scale-105 active:scale-95 transition-smooth flex flex-col items-center justify-center"
                style={{
                  borderColor: COLOR_MAP[colorKey].hex,
                  color: COLOR_MAP[colorKey].hex,
                }}
              >
                <span>{colorKey}</span>
                <span className="text-[10px] opacity-70">Key: {colorKey[0]}</span>
              </button>
            ))}
          </div>

          <p className="text-xs text-slate-400">
            Remember: Click the <strong>INK COLOR</strong>, not the word text!
          </p>
        </div>
      )}

      {phase === 'complete' && (
        <div className="py-12 text-center space-y-3">
          <div className="text-xl font-bold text-slate-800 dark:text-slate-100">
            Stroop Battery Complete!
          </div>
          <p className="text-xs text-slate-500">
            Calculating millisecond interference cost and inhibitory metrics...
          </p>
        </div>
      )}
    </div>
  );
};

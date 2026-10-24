import React, { useState, useEffect, useRef } from 'react';
import { Hash, ArrowRight, RotateCcw, CheckCircle2, XCircle } from 'lucide-react';

interface DigitSpanProps {
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
  }) => void;
  onCancel?: () => void;
}

export const DigitSpanTask: React.FC<DigitSpanProps> = ({ onComplete, onCancel }) => {
  const [phase, setPhase] = useState<'intro' | 'presenting' | 'recall' | 'feedback'>('intro');
  const [currentSpanLength, setCurrentSpanLength] = useState(3);
  const [currentSequence, setCurrentSequence] = useState<number[]>([]);
  const [displayDigit, setDisplayDigit] = useState<number | null>(null);
  const [displayIndex, setDisplayIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [trials, setTrials] = useState<any[]>([]);
  const [isLastTrialCorrect, setIsLastTrialCorrect] = useState<boolean | null>(null);

  const trialStartTimeRef = useRef<number>(0);

  // Generate random sequence of non-repeating consecutive digits
  const generateSequence = (length: number): number[] => {
    const digits: number[] = [];
    while (digits.length < length) {
      const d = Math.floor(Math.random() * 9) + 1;
      if (digits.length === 0 || digits[digits.length - 1] !== d) {
        digits.push(d);
      }
    }
    return digits;
  };

  const startSpanTrial = (span: number) => {
    const seq = generateSequence(span);
    setCurrentSequence(seq);
    setDisplayIndex(0);
    setUserInput('');
    setPhase('presenting');
  };

  // Presentation ticker
  useEffect(() => {
    if (phase === 'presenting') {
      if (displayIndex < currentSequence.length) {
        setDisplayDigit(currentSequence[displayIndex]);
        const timer = setTimeout(() => {
          setDisplayDigit(null); // brief inter-digit blank
          setTimeout(() => {
            setDisplayIndex((prev) => prev + 1);
          }, 300);
        }, 900);
        return () => clearTimeout(timer);
      } else {
        // Finished sequence presentation
        setDisplayDigit(null);
        setPhase('recall');
        trialStartTimeRef.current = performance.now();
      }
    }
  }, [phase, displayIndex, currentSequence]);

  const handleDigitClick = (num: number) => {
    if (phase !== 'recall') return;
    setUserInput((prev) => prev + num.toString());
  };

  const handleBackspace = () => {
    setUserInput((prev) => prev.slice(0, -1));
  };

  const handleSubmitSequence = () => {
    const rt = performance.now() - trialStartTimeRef.current;
    const target = currentSequence.join('');
    const isCorrect = userInput === target;

    const trialRecord = {
      trial_index: trials.length + 1,
      span_length: currentSpanLength,
      target_sequence: target,
      response: userInput,
      is_correct: isCorrect,
      reaction_time_ms: Math.round(rt)
    };

    const newTrials = [...trials, trialRecord];
    setTrials(newTrials);
    setIsLastTrialCorrect(isCorrect);
    setPhase('feedback');

    // Adaptive step: if correct and span < 7, increase span; if 2 failures or span >= 7, finish
    setTimeout(() => {
      if (isCorrect && currentSpanLength < 7) {
        const nextSpan = currentSpanLength + 1;
        setCurrentSpanLength(nextSpan);
        startSpanTrial(nextSpan);
      } else if (newTrials.length >= 5 || (!isCorrect && trials.filter(t => !t.is_correct).length >= 1)) {
        // Complete task
        finishTask(newTrials);
      } else {
        // Try same span length once more
        startSpanTrial(currentSpanLength);
      }
    }, 1200);
  };

  const finishTask = (allTrials: any[]) => {
    const correctCount = allTrials.filter(t => t.is_correct).length;
    const errorCount = allTrials.length - correctCount;
    const maxSpan = Math.max(...allTrials.filter(t => t.is_correct).map(t => t.span_length), 2);
    const rts = allTrials.map(t => t.reaction_time_ms);
    const meanRt = rts.length ? Math.round(rts.reduce((a, b) => a + b, 0) / rts.length) : 1000;

    onComplete({
      task_type: 'digit_span',
      task_name: 'Adaptive Digit Span (Working Memory)',
      total_trials: allTrials.length,
      correct_trials: correctCount,
      error_count: errorCount,
      omission_count: 0,
      commission_count: errorCount,
      mean_reaction_time_ms: meanRt,
      median_reaction_time_ms: meanRt,
      raw_score: maxSpan,
      trials_detail: allTrials
    });
  };

  return (
    <div className="w-full max-w-3xl mx-auto rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900 transition-smooth">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
            <Hash className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Digit Span Test (Attention & Working Memory)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Measures attentional capacity, sequential storage, and working memory manipulation.
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
              Digit Span Instructions
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              You will see a series of numbers flash on the screen, one at a time. Watch them carefully.
              When they finish, enter the numbers in the <strong>exact same order</strong> using the number pad.
            </p>
            <div className="rounded-lg bg-indigo-50 p-3 text-xs text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 text-left">
              <strong>Adaptive Test:</strong> As you succeed, the sequence length will increase from 3 digits up to 7 digits.
            </div>
          </div>
          <button
            onClick={() => startSpanTrial(3)}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white shadow-md hover:bg-indigo-700 transition-smooth"
          >
            Start Digit Span Trial
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {phase === 'presenting' && (
        <div className="py-16 text-center space-y-4">
          <div className="text-xs font-semibold uppercase tracking-widest text-slate-400">
            Current Span: {currentSpanLength} Digits
          </div>
          <div className="flex h-36 items-center justify-center">
            <span className="text-6xl sm:text-7xl font-extrabold text-indigo-600 dark:text-indigo-300">
              {displayDigit !== null ? displayDigit : ''}
            </span>
          </div>
          <p className="text-xs text-slate-400">Keep your eyes on the screen...</p>
        </div>
      )}

      {phase === 'recall' && (
        <div className="py-6 space-y-6 max-w-sm mx-auto">
          <div className="text-center space-y-1">
            <div className="text-xs font-medium text-slate-400">Recall Phase</div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Enter the sequence in order
            </h3>
          </div>

          {/* Input Display Box */}
          <div className="flex h-14 items-center justify-center rounded-xl border-2 border-indigo-200 bg-slate-50 text-2xl font-black tracking-widest text-slate-800 dark:border-indigo-900 dark:bg-slate-800 dark:text-white">
            {userInput || <span className="text-sm font-normal text-slate-400 tracking-normal">Tap numbers below</span>}
          </div>

          {/* Onscreen Keypad */}
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handleDigitClick(num)}
                className="h-12 rounded-xl border border-slate-200 bg-white text-lg font-bold text-slate-800 shadow-xs hover:bg-indigo-50 hover:border-indigo-400 active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:text-white transition-smooth"
              >
                {num}
              </button>
            ))}
            <button
              type="button"
              onClick={handleBackspace}
              className="h-12 rounded-xl border border-slate-200 bg-slate-100 text-xs font-semibold text-slate-600 hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => handleDigitClick(0)}
              className="h-12 rounded-xl border border-slate-200 bg-white text-lg font-bold text-slate-800 shadow-xs hover:bg-indigo-50 hover:border-indigo-400 active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              0
            </button>
            <button
              type="button"
              disabled={userInput.length === 0}
              onClick={handleSubmitSequence}
              className="h-12 rounded-xl bg-indigo-600 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 transition-smooth"
            >
              Submit
            </button>
          </div>
        </div>
      )}

      {phase === 'feedback' && (
        <div className="py-16 text-center space-y-3">
          {isLastTrialCorrect ? (
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-1.5 text-sm font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200 animate-bounce">
              <CheckCircle2 className="w-5 h-5" /> Correct Sequence!
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 rounded-full bg-rose-100 px-4 py-1.5 text-sm font-bold text-rose-800 dark:bg-rose-950 dark:text-rose-200">
              <XCircle className="w-5 h-5" /> Incorrect sequence
            </div>
          )}
          <p className="text-xs text-slate-400">Loading next sequence...</p>
        </div>
      )}
    </div>
  );
};

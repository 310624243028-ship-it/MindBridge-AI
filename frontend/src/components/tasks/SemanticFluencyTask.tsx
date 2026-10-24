import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, ArrowRight, Clock, CheckCircle2 } from 'lucide-react';

interface SemanticFluencyProps {
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

export const SemanticFluencyTask: React.FC<SemanticFluencyProps> = ({ onComplete, onCancel }) => {
  const [phase, setPhase] = useState<'intro' | 'active' | 'completed'>('intro');
  const [timeLeft, setTimeLeft] = useState(60);
  const [currentInput, setCurrentInput] = useState('');
  const [tokens, setTokens] = useState<string[]>([]);
  const [tokenLogs, setTokenLogs] = useState<any[]>([]);

  const lastTokenTimeRef = useRef<number>(0);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (phase === 'active') {
      lastTokenTimeRef.current = performance.now();
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            finishTask();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timerRef.current);
    }
  }, [phase]);

  const handleAddToken = (e: React.FormEvent) => {
    e.preventDefault();
    const word = currentInput.trim().toUpperCase();
    if (!word) return;

    const now = performance.now();
    const latency = Math.round(now - lastTokenTimeRef.current);
    lastTokenTimeRef.current = now;

    const isDuplicate = tokens.includes(word);
    setTokens((prev) => [...prev, word]);
    setTokenLogs((prev) => [
      ...prev,
      {
        word,
        latency_ms: latency,
        is_duplicate: isDuplicate,
      }
    ]);
    setCurrentInput('');
  };

  const finishTask = () => {
    setPhase('completed');
    const validCount = Array.from(new Set(tokens)).length;
    const duplicates = tokens.length - validCount;
    const latencies = tokenLogs.map((l) => l.latency_ms);
    const meanRt = latencies.length ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) : 2500;

    setTimeout(() => {
      onComplete({
        task_type: 'semantic_fluency',
        task_name: 'Timed Semantic Category Fluency (Animals)',
        total_trials: tokens.length || 1,
        correct_trials: validCount,
        error_count: duplicates,
        omission_count: 0,
        commission_count: duplicates,
        mean_reaction_time_ms: meanRt,
        median_reaction_time_ms: meanRt,
        raw_score: validCount,
        trials_detail: tokenLogs
      });
    }, 1200);
  };

  return (
    <div className="w-full max-w-3xl mx-auto rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900 transition-smooth">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300">
            <MessageSquare className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Semantic Category Fluency (Language & Semantic Access)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Evaluates lexical search velocity, semantic clustering, and executive retrieval efficiency.
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
              Category: ANIMALS
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              In this test, you have <strong>60 seconds</strong> to name as many different <strong>ANIMALS</strong> as you can think of (e.g. dog, horse, elephant, falcon).
            </p>
            <div className="rounded-lg bg-teal-50 p-3 text-xs text-teal-800 dark:bg-teal-950/60 dark:text-teal-300 text-left">
              <strong>Tip:</strong> Type each animal and press Enter or the Add button. Try to avoid repeating the same animal twice.
            </div>
          </div>
          <button
            onClick={() => {
              setTokens([]);
              setTokenLogs([]);
              setTimeLeft(60);
              setPhase('active');
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-6 py-3 font-semibold text-white shadow-md hover:bg-teal-700 transition-smooth"
          >
            Start 60s Fluency Test
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {phase === 'active' && (
        <div className="py-6 space-y-6 max-w-md mx-auto">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-teal-700 dark:text-teal-300 uppercase tracking-wide">
              Category: ANIMALS
            </span>
            <span className="flex items-center gap-1 font-mono text-base font-bold text-slate-800 dark:text-white">
              <Clock className="w-4 h-4 text-teal-600 animate-spin" /> {timeLeft}s remaining
            </span>
          </div>

          <form onSubmit={handleAddToken} className="flex gap-2">
            <input
              type="text"
              autoFocus
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              placeholder="Type an animal (e.g. TIGER)..."
              className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-slate-800 font-medium placeholder-slate-400 focus:border-teal-500 focus:outline-hidden focus:ring-2 focus:ring-teal-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
            <button
              type="submit"
              className="rounded-xl bg-teal-600 px-5 py-2.5 font-semibold text-white hover:bg-teal-700 shadow-sm transition-smooth"
            >
              Add
            </button>
          </form>

          {/* Words pill cloud */}
          <div className="min-h-[100px] max-h-48 overflow-y-auto rounded-xl border border-dashed border-slate-200 p-3 dark:border-slate-800">
            <div className="text-xs text-slate-400 mb-2">Animals named ({tokens.length}):</div>
            <div className="flex flex-wrap gap-1.5">
              {tokens.map((token, i) => (
                <span
                  key={i}
                  className="rounded-md bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-800 dark:bg-teal-950 dark:text-teal-300"
                >
                  {token}
                </span>
              ))}
              {tokens.length === 0 && (
                <span className="text-xs text-slate-400 italic">No animals entered yet. Type fast!</span>
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => {
                clearInterval(timerRef.current);
                finishTask();
              }}
              className="text-xs text-slate-500 hover:text-slate-800 underline"
            >
              I am done early
            </button>
          </div>
        </div>
      )}

      {phase === 'completed' && (
        <div className="py-12 text-center space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-5 py-2 text-base font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
            <CheckCircle2 className="w-5 h-5" /> Fluency Test Complete!
          </div>
          <p className="text-xs text-slate-500">
            Processed {tokens.length} tokens. Calculating semantic retrieval rate...
          </p>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import { Compass, ArrowRight, CheckCircle2, RotateCcw, AlertCircle } from 'lucide-react';

interface TrailMakingProps {
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

interface TrailNode {
  id: string;
  label: string;
  x: number; // percentage (0 to 100)
  y: number; // percentage (0 to 100)
}

const TRAIL_TARGET_SEQUENCE = ['1', 'A', '2', 'B', '3', 'C', '4', 'D', '5', 'E'];

const NODES_COORDINATES: TrailNode[] = [
  { id: '1', label: '1', x: 20, y: 35 },
  { id: 'A', label: 'A', x: 45, y: 20 },
  { id: '2', label: '2', x: 75, y: 30 },
  { id: 'B', label: 'B', x: 80, y: 65 },
  { id: '3', label: '3', x: 55, y: 80 },
  { id: 'C', label: 'C', x: 30, y: 65 },
  { id: '4', label: '4', x: 15, y: 80 },
  { id: 'D', label: 'D', x: 40, y: 45 },
  { id: '5', label: '5', x: 65, y: 50 },
  { id: 'E', label: 'E', x: 85, y: 15 },
];

export const TrailMakingTask: React.FC<TrailMakingProps> = ({ onComplete, onCancel }) => {
  const [phase, setPhase] = useState<'intro' | 'active' | 'completed'>('intro');
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [visitedNodes, setVisitedNodes] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [errorsCount, setErrorsCount] = useState(0);

  const startTimeRef = useRef<number>(0);
  const timerIntervalRef = useRef<any>(null);

  // Live stopwatch
  useEffect(() => {
    if (phase === 'active') {
      startTimeRef.current = performance.now();
      timerIntervalRef.current = setInterval(() => {
        setElapsedSeconds(Math.floor((performance.now() - startTimeRef.current) / 1000));
      }, 200);
      return () => clearInterval(timerIntervalRef.current);
    }
  }, [phase]);

  const handleNodeClick = (node: TrailNode) => {
    if (phase !== 'active') return;

    const expectedLabel = TRAIL_TARGET_SEQUENCE[currentStepIndex];

    if (node.label === expectedLabel) {
      setErrorMessage(null);
      const nextVisited = [...visitedNodes, node.id];
      setVisitedNodes(nextVisited);

      if (currentStepIndex + 1 >= TRAIL_TARGET_SEQUENCE.length) {
        // Completed trail!
        clearInterval(timerIntervalRef.current);
        const totalDurationMs = performance.now() - startTimeRef.current;
        const totalSeconds = Math.round(totalDurationMs / 1000);
        setPhase('completed');

        setTimeout(() => {
          onComplete({
            task_type: 'trail_making_b',
            task_name: 'Trail Making Test (Variant B - Task Switching)',
            total_trials: TRAIL_TARGET_SEQUENCE.length,
            correct_trials: TRAIL_TARGET_SEQUENCE.length,
            error_count: errorsCount,
            omission_count: 0,
            commission_count: errorsCount,
            mean_reaction_time_ms: Math.round(totalDurationMs / TRAIL_TARGET_SEQUENCE.length),
            median_reaction_time_ms: Math.round(totalDurationMs / TRAIL_TARGET_SEQUENCE.length),
            raw_score: totalSeconds, // raw score is seconds to complete (inverted)
            trials_detail: nextVisited.map((v, i) => ({ step: i + 1, node: v }))
          });
        }, 1000);
      } else {
        setCurrentStepIndex(currentStepIndex + 1);
      }
    } else {
      // Incorrect node clicked
      setErrorsCount((prev) => prev + 1);
      setErrorMessage(`Incorrect node. Next target is ${expectedLabel}.`);
      setTimeout(() => setErrorMessage(null), 1800);
    }
  };

  const startTask = () => {
    setVisitedNodes([]);
    setCurrentStepIndex(0);
    setErrorsCount(0);
    setElapsedSeconds(0);
    setErrorMessage(null);
    setPhase('active');
  };

  return (
    <div className="w-full max-w-3xl mx-auto rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900 transition-smooth">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300">
            <Compass className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Trail Making Test (Task Switching & Processing Speed)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Assesses mental flexibility, executive set-shifting, and visual-motor scanning speed.
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
              Instructions: Alternating Numbers & Letters
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Connect the circles in alternating order between numbers and letters:
            </p>
            <div className="rounded-xl border border-pink-200 bg-pink-50 p-3 text-sm font-bold text-pink-900 dark:border-pink-900 dark:bg-pink-950/60 dark:text-pink-200">
              1 &rarr; A &rarr; 2 &rarr; B &rarr; 3 &rarr; C &rarr; 4 &rarr; D &rarr; 5 &rarr; E
            </div>
            <p className="text-xs text-slate-500">
              Work as quickly and accurately as possible without skipping. The timer starts when you click Start.
            </p>
          </div>
          <button
            onClick={startTask}
            className="inline-flex items-center gap-2 rounded-xl bg-pink-600 px-6 py-3 font-semibold text-white shadow-md hover:bg-pink-700 transition-smooth"
          >
            Start Trail Making Test
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {phase === 'active' && (
        <div className="py-4 space-y-4">
          <div className="flex justify-between items-center text-xs">
            <div className="flex items-center gap-3">
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                Next Target: <strong className="text-sm text-pink-600 dark:text-pink-400 font-extrabold">{TRAIL_TARGET_SEQUENCE[currentStepIndex]}</strong>
              </span>
              <span className="text-slate-400">|</span>
              <span className="text-slate-500">Errors: {errorsCount}</span>
            </div>
            <div className="font-mono text-sm font-bold text-slate-800 dark:text-slate-100">
              ⏱️ {elapsedSeconds}s
            </div>
          </div>

          {errorMessage && (
            <div className="flex items-center gap-2 rounded-lg bg-rose-50 p-2 text-xs font-semibold text-rose-700 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-900">
              <AlertCircle className="w-4 h-4" /> {errorMessage}
            </div>
          )}

          {/* Interactive Node Grid Canvas */}
          <div className="relative h-80 sm:h-96 w-full rounded-xl border-2 border-slate-200 bg-slate-50 overflow-hidden dark:border-slate-800 dark:bg-slate-950">
            {/* SVG Connecting lines for visited nodes */}
            <svg className="absolute inset-0 h-full w-full pointer-events-none">
              {visitedNodes.map((nodeId, idx) => {
                if (idx === 0) return null;
                const prevNode = NODES_COORDINATES.find((n) => n.id === visitedNodes[idx - 1]);
                const currNode = NODES_COORDINATES.find((n) => n.id === nodeId);
                if (!prevNode || !currNode) return null;
                return (
                  <line
                    key={idx}
                    x1={`${prevNode.x}%`}
                    y1={`${prevNode.y}%`}
                    x2={`${currNode.x}%`}
                    y2={`${currNode.y}%`}
                    stroke="#ec4899"
                    strokeWidth="3"
                    strokeDasharray="4 2"
                  />
                );
              })}
            </svg>

            {/* Clickable circular nodes */}
            {NODES_COORDINATES.map((node) => {
              const isVisited = visitedNodes.includes(node.id);
              const isNext = TRAIL_TARGET_SEQUENCE[currentStepIndex] === node.label;
              return (
                <button
                  key={node.id}
                  onClick={() => handleNodeClick(node)}
                  style={{
                    left: `${node.x}%`,
                    top: `${node.y}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                  className={`absolute flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-full font-bold text-base sm:text-lg shadow-sm transition-smooth ${
                    isVisited
                      ? 'bg-emerald-500 text-white ring-4 ring-emerald-200 dark:ring-emerald-900'
                      : isNext
                      ? 'bg-pink-600 text-white ring-4 ring-pink-200 dark:ring-pink-900 animate-pulse'
                      : 'border-2 border-slate-400 bg-white text-slate-800 hover:scale-110 hover:border-pink-500 dark:bg-slate-800 dark:text-white dark:border-slate-600'
                  }`}
                >
                  {node.label}
                </button>
              );
            })}
          </div>

          <p className="text-center text-xs text-slate-400">
            Click nodes in alternating order: 1 &rarr; A &rarr; 2 &rarr; B...
          </p>
        </div>
      )}

      {phase === 'completed' && (
        <div className="py-12 text-center space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-5 py-2 text-base font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
            <CheckCircle2 className="w-6 h-6" /> Trail Completed in {elapsedSeconds} Seconds!
          </div>
          <p className="text-xs text-slate-500">
            Finalizing task switching metrics and calculating normative velocity...
          </p>
        </div>
      )}
    </div>
  );
};

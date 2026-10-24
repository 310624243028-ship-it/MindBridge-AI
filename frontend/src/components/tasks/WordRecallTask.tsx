import React, { useState, useEffect, useRef } from 'react';
import { Brain, ArrowRight, CheckCircle2, RotateCcw, Clock, Sparkles } from 'lucide-react';

interface WordRecallProps {
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

const WORD_LIST = [
  'RIVER',
  'CANDLE',
  'MOUNTAIN',
  'BLANKET',
  'FOREST',
  'HARBOR',
  'GARDEN',
  'VALLEY',
  'MIRROR',
  'ORCHARD'
];

export const WordRecallTask: React.FC<WordRecallProps> = ({ onComplete, onCancel }) => {
  const [phase, setPhase] = useState<'intro' | 'presentation' | 'distractor' | 'recall' | 'summary'>('intro');
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [inputWord, setInputWord] = useState('');
  const [recalledWords, setRecalledWords] = useState<string[]>([]);
  const [recallTrials, setRecallTrials] = useState<any[]>([]);
  const [distractorAnswer, setDistractorAnswer] = useState('');
  const [distractorStep, setDistractorStep] = useState(0);

  const recallStartTimeRef = useRef<number>(0);
  const wordStartTimeRef = useRef<number>(0);

  // Word presentation timer
  useEffect(() => {
    if (phase === 'presentation') {
      if (currentWordIndex < WORD_LIST.length) {
        wordStartTimeRef.current = performance.now();
        const timer = setTimeout(() => {
          setCurrentWordIndex((prev) => prev + 1);
        }, 1800);
        return () => clearTimeout(timer);
      } else {
        // Presentation finished, proceed to distractor
        setPhase('distractor');
      }
    }
  }, [phase, currentWordIndex]);

  // Start recall phase
  const startRecallPhase = () => {
    setPhase('recall');
    recallStartTimeRef.current = performance.now();
  };

  const handleWordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanWord = inputWord.trim().toUpperCase();
    if (!cleanWord) return;

    const rt = performance.now() - recallStartTimeRef.current;
    recallStartTimeRef.current = performance.now(); // reset for next word

    const isCorrect = WORD_LIST.includes(cleanWord) && !recalledWords.includes(cleanWord);
    
    setRecalledWords((prev) => [...prev, cleanWord]);
    setRecallTrials((prev) => [
      ...prev,
      {
        trial_index: prev.length + 1,
        response: cleanWord,
        is_correct: isCorrect,
        reaction_time_ms: Math.round(rt),
        is_intrusion: !WORD_LIST.includes(cleanWord),
        is_repetition: recalledWords.includes(cleanWord),
      }
    ]);

    setInputWord('');
  };

  const finishRecall = () => {
    const correctCount = recalledWords.filter((w) => WORD_LIST.includes(w)).length;
    const errors = recalledWords.filter((w) => !WORD_LIST.includes(w)).length;
    const omissions = WORD_LIST.length - correctCount;

    const rts = recallTrials.map((t) => t.reaction_time_ms);
    const meanRt = rts.length ? Math.round(rts.reduce((a, b) => a + b, 0) / rts.length) : 1500;
    const sortedRts = [...rts].sort((a, b) => a - b);
    const medianRt = sortedRts.length ? sortedRts[Math.floor(sortedRts.length / 2)] : 1500;

    onComplete({
      task_type: 'word_recall_immediate',
      task_name: 'Standardized Verbal Episodic Recall',
      total_trials: WORD_LIST.length,
      correct_trials: correctCount,
      error_count: errors,
      omission_count: omissions,
      commission_count: errors,
      mean_reaction_time_ms: meanRt,
      median_reaction_time_ms: medianRt,
      raw_score: correctCount,
      trials_detail: recallTrials
    });
  };

  return (
    <div className="w-full max-w-3xl mx-auto rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900 transition-smooth">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300">
            <Brain className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Word Recall Test (Episodic Verbal Memory)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Assesses short-term encoding, phonological loop maintenance, and delayed retrieval.
            </p>
          </div>
        </div>
        {onCancel && (
          <button
            onClick={onCancel}
            className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            Cancel
          </button>
        )}
      </div>

      {/* Phase 1: Introduction */}
      {phase === 'intro' && (
        <div className="py-8 space-y-6 text-center">
          <div className="mx-auto max-w-md space-y-3">
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
              Ready to begin word recall?
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              You will be shown <strong>10 words</strong> one at a time on the screen. Read each word carefully. After a brief counting exercise, you will type as many of the words as you can remember.
            </p>
            <div className="rounded-lg bg-sky-50 p-3 text-xs text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 text-left">
              <strong>Instructions:</strong> Order does not matter. Take as much time as you need. No note-taking allowed.
            </div>
          </div>
          <button
            onClick={() => {
              setCurrentWordIndex(0);
              setPhase('presentation');
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-6 py-3 font-semibold text-white shadow-md hover:bg-sky-700 transition-smooth"
          >
            Start Word Presentation
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Phase 2: Word Presentation */}
      {phase === 'presentation' && (
        <div className="py-16 text-center space-y-6">
          <div className="text-xs font-semibold uppercase tracking-widest text-slate-400">
            Word {currentWordIndex + 1} of {WORD_LIST.length}
          </div>
          <div className="flex h-32 items-center justify-center">
            <span className="text-4xl sm:text-5xl font-black tracking-wide text-sky-900 dark:text-sky-200 animate-pulse">
              {WORD_LIST[currentWordIndex]}
            </span>
          </div>
          <div className="w-48 mx-auto h-2 bg-slate-100 rounded-full overflow-hidden dark:bg-slate-800">
            <div
              className="h-full bg-sky-500 transition-all duration-300"
              style={{ width: `${((currentWordIndex + 1) / WORD_LIST.length) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Phase 3: Distractor Arithmetic */}
      {phase === 'distractor' && (
        <div className="py-8 space-y-6 text-center">
          <div className="mx-auto max-w-md space-y-3">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
              <Clock className="w-3.5 h-3.5" /> Short Delay Buffer (Phonological Suppression)
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
              Quick Mental Math: What is 17 + 8?
            </h3>
            <p className="text-xs text-slate-500">
              This standard research step clears immediate echoic memory before recall testing.
            </p>
            <div className="flex justify-center gap-3 pt-2">
              {['23', '25', '27'].map((option) => (
                <button
                  key={option}
                  onClick={() => startRecallPhase()}
                  className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold hover:border-sky-500 hover:bg-sky-50 dark:border-slate-700 dark:hover:bg-slate-800"
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Phase 4: Free Recall */}
      {phase === 'recall' && (
        <div className="py-6 space-y-6">
          <div className="text-center space-y-1">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              Type the words you remember
            </h3>
            <p className="text-xs text-slate-500">
              Enter one word at a time and press Enter or click 'Add Word'. Order does not matter.
            </p>
          </div>

          <form onSubmit={handleWordSubmit} className="flex gap-2 max-w-md mx-auto">
            <input
              type="text"
              autoFocus
              value={inputWord}
              onChange={(e) => setInputWord(e.target.value)}
              placeholder="e.g. RIVER"
              className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-slate-800 font-medium placeholder-slate-400 focus:border-sky-500 focus:outline-hidden focus:ring-2 focus:ring-sky-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
            <button
              type="submit"
              className="rounded-xl bg-sky-600 px-5 py-2.5 font-semibold text-white hover:bg-sky-700 shadow-sm transition-smooth"
            >
              Add Word
            </button>
          </form>

          {/* Recalled list pills */}
          <div className="max-w-md mx-auto min-h-[60px] rounded-xl border border-dashed border-slate-200 p-3 dark:border-slate-800">
            <div className="text-xs text-slate-400 mb-2">Recalled Words ({recalledWords.length} entered):</div>
            <div className="flex flex-wrap gap-1.5">
              {recalledWords.map((word, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                >
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                  {word}
                </span>
              ))}
              {recalledWords.length === 0 && (
                <span className="text-xs text-slate-400 italic">No words entered yet.</span>
              )}
            </div>
          </div>

          <div className="flex justify-between items-center max-w-md mx-auto pt-4 border-t border-slate-100 dark:border-slate-800">
            <span className="text-xs text-slate-500">
              Finished with all words you recall?
            </span>
            <button
              onClick={finishRecall}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition-smooth"
            >
              Finish Task & Calculate Score
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

import { SparklesIcon } from "../Icons";

const DEFAULT_QUESTIONS = [
  "Recommend a smartphone under ₹50,000",
  "Find a laptop for programming",
  "Compare two products",
  "Show me products with the best ratings",
];

/**
 * SuggestedQuestions
 * Displays quick-prompt chips styled using the existing ShopSphere design language.
 */
export default function SuggestedQuestions({ onSelectQuestion, disabled = false }) {
  return (
    <div className="w-full">
      <div className="mb-2.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
        <SparklesIcon className="h-3.5 w-3.5 text-indigo-500" />
        <span>Suggested Questions</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {DEFAULT_QUESTIONS.map((q, idx) => (
          <button
            key={idx}
            type="button"
            disabled={disabled}
            onClick={() => onSelectQuestion(q)}
            className="group inline-flex items-center gap-2 rounded-xl border border-slate-200/90 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-300 hover:bg-indigo-50/50 hover:text-indigo-700 active:scale-95 disabled:pointer-events-none disabled:opacity-50"
          >
            <span>{q}</span>
            <span className="text-slate-300 transition-colors group-hover:text-indigo-400">
              →
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

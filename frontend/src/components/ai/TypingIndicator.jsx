import { SparklesIcon } from "../Icons";

/**
 * TypingIndicator
 * Displays an animated loading state when the AI assistant is formulating a response.
 */
export default function TypingIndicator({ provider = "ShopSphere AI" }) {
  return (
    <div className="flex w-full items-start gap-3">
      {/* Assistant Avatar */}
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-sm shadow-indigo-500/20">
        <SparklesIcon className="h-4 w-4" />
      </div>

      {/* Typing Bubble */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-900">{provider}</span>
          <span className="text-[10px] text-slate-400">Searching catalog & thinking...</span>
        </div>

        <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm border border-slate-200/80 bg-white px-4 py-3 shadow-xs">
          <span className="h-2 w-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: "0ms" }} />
          <span className="h-2 w-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: "150ms" }} />
          <span className="h-2 w-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    </div>
  );
}

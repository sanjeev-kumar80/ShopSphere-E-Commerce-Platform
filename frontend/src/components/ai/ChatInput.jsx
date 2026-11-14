import { useState, useRef, useEffect } from "react";

/**
 * ChatInput
 * Handles user query drafting, keyboard shortcuts (Enter to send),
 * and submission state matching ShopSphere input conventions.
 */
export default function ChatInput({ onSendMessage, disabled = false, placeholder = "Ask ShopSphere AI anything about products, prices, or specs..." }) {
  const [input, setInput] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    if (!disabled && inputRef.current) {
      inputRef.current.focus();
    }
  }, [disabled]);

  const handleSubmit = (e) => {
    e?.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || disabled) return;

    onSendMessage(trimmed);
    setInput("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="relative flex items-center gap-2 rounded-2xl border border-slate-200/90 bg-white p-2 shadow-xs transition-all focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/10"
    >
      <input
        ref={inputRef}
        type="text"
        value={input}
        disabled={disabled}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        maxLength={2000}
        placeholder={placeholder}
        className="flex-1 bg-transparent px-3 py-1.5 text-xs sm:text-sm text-slate-800 placeholder-slate-400 outline-none disabled:bg-transparent disabled:text-slate-400"
      />

      <button
        type="submit"
        disabled={!input.trim() || disabled}
        aria-label="Send message"
        className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-4 text-xs font-bold text-white shadow-sm shadow-indigo-600/20 transition-all hover:bg-indigo-700 active:scale-95 disabled:pointer-events-none disabled:opacity-40"
      >
        <span>Send</span>
        <span className="text-sm">↑</span>
      </button>
    </form>
  );
}

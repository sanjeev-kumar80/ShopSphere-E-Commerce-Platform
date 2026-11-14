import { useRef, useEffect } from "react";
import ChatMessage from "./ChatMessage";
import TypingIndicator from "./TypingIndicator";
import ChatInput from "./ChatInput";
import SuggestedQuestions from "./SuggestedQuestions";
import { SparklesIcon, TrashIcon } from "../Icons";

/**
 * ChatWindow
 * Core conversational interface containing message history, autoscroll management,
 * typing indicator, and responsive input zone.
 */
export default function ChatWindow({
  messages = [],
  loading = false,
  activeProvider = "ShopSphere AI",
  user = null,
  onSendMessage,
  onClearChat,
  onSelectSuggestedQuestion,
}) {
  const messagesEndRef = useRef(null);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const hasMessages = messages.length > 0;

  return (
    <div className="flex flex-col h-[650px] sm:h-[700px] w-full rounded-3xl border border-slate-200/90 bg-white shadow-sm overflow-hidden">
      {/* Chat Header */}
      <div className="flex items-center justify-between border-b border-slate-100 bg-white px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-xs shadow-indigo-500/20">
            <SparklesIcon className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900">
                ShopSphere Assistant
              </h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Online
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Powered by {activeProvider} • Grounded in Store Catalog
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {hasMessages && (
            <button
              type="button"
              onClick={onClearChat}
              disabled={loading}
              title="Clear current conversation"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-red-600 active:scale-95 disabled:opacity-50"
            >
              <TrashIcon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Clear Chat</span>
            </button>
          )}
        </div>
      </div>

      {/* Message Feed Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/50">
        {!hasMessages ? (
          /* Empty / Welcoming Initial State */
          <div className="flex flex-col items-center justify-center h-full text-center max-w-lg mx-auto py-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 mb-4 shadow-inner">
              <SparklesIcon className="h-8 w-8" />
            </div>

            <h3 className="text-lg font-extrabold text-slate-900">
              Welcome to ShopSphere AI
            </h3>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-500 leading-relaxed">
              I can help you find products, compare specs, check stock, and discover items matching your budget.
            </p>

            <div className="mt-6 w-full text-left">
              <SuggestedQuestions
                onSelectQuestion={onSelectSuggestedQuestion}
                disabled={loading}
              />
            </div>
          </div>
        ) : (
          /* Message List */
          <>
            {messages.map((msg, index) => (
              <ChatMessage key={index} message={msg} user={user} />
            ))}

            {loading && <TypingIndicator provider={activeProvider} />}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Bottom Suggested Questions (when conversation has started) */}
      {hasMessages && (
        <div className="border-t border-slate-100 bg-white px-5 py-2.5 overflow-x-auto">
          <SuggestedQuestions
            onSelectQuestion={onSelectSuggestedQuestion}
            disabled={loading}
          />
        </div>
      )}

      {/* Input Zone */}
      <div className="border-t border-slate-100 bg-white p-3 sm:p-4">
        <ChatInput onSendMessage={onSendMessage} disabled={loading} />
        <p className="mt-2 text-center text-[10px] text-slate-400">
          ShopSphere AI verifies live pricing and stock directly from our store catalog.
        </p>
      </div>
    </div>
  );
}

import { SparklesIcon, UserIcon } from "../Icons";
import ProductRecommendationCard from "./ProductRecommendationCard";

/**
 * Helper to render basic markdown elements (bold, bullet points, line breaks)
 * without pulling in heavy external dependencies.
 */
function FormattedText({ content }) {
  if (!content) return null;

  const lines = content.split("\n");

  return (
    <div className="space-y-1.5 text-xs sm:text-sm leading-relaxed">
      {lines.map((line, idx) => {
        const trimmed = line.trim();

        // Empty line -> spacing
        if (!trimmed) {
          return <div key={idx} className="h-1" />;
        }

        // Bullet point
        if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
          const bulletText = trimmed.slice(2);
          return (
            <div key={idx} className="flex items-start gap-2 pl-1">
              <span className="text-indigo-500 font-bold">•</span>
              <span>{renderInlineMarkdown(bulletText)}</span>
            </div>
          );
        }

        return <p key={idx}>{renderInlineMarkdown(line)}</p>;
      })}
    </div>
  );
}

function renderInlineMarkdown(text) {
  // Bold formatting: **text**
  const parts = text.split(/(\*\*.*?\*\*)/g);

  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-bold text-slate-900">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

/**
 * ChatMessage
 * Renders individual user and assistant message bubbles with support for
 * recommended product cards and provider metadata.
 */
export default function ChatMessage({ message, user }) {
  const isUser = message.role === "user";
  const isError = message.isError;
  const products = message.products || [];

  if (isUser) {
    return (
      <div className="flex w-full justify-end items-end gap-2.5">
        <div className="max-w-[85%] sm:max-w-[75%] rounded-2xl rounded-br-xs bg-indigo-600 px-4 py-3 text-white shadow-sm shadow-indigo-600/20">
          <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
            {message.content}
          </p>
          <div className="mt-1 flex justify-end">
            <span className="text-[10px] text-indigo-200">
              {message.timestamp || "Just now"}
            </span>
          </div>
        </div>

        {/* User Avatar */}
        <div className="hidden sm:flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-slate-200 text-slate-700">
          <UserIcon className="h-4 w-4" />
        </div>
      </div>
    );
  }

  // Assistant Message
  return (
    <div className="flex w-full items-start gap-3">
      {/* Assistant Avatar */}
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-sm shadow-indigo-500/20">
        <SparklesIcon className="h-4 w-4" />
      </div>

      <div className="flex max-w-[92%] sm:max-w-[85%] flex-col gap-2">
        {/* Header Metadata */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-900">
            ShopSphere AI
          </span>
          {message.provider && (
            <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
              {message.provider} {message.model ? `• ${message.model}` : ""}
            </span>
          )}
          {message.fallbackOccurred && (
            <span className="rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 border border-amber-200/50">
              Fallback Active
            </span>
          )}
        </div>

        {/* Bubble */}
        <div
          className={`rounded-2xl rounded-tl-xs border px-4 py-3 shadow-xs ${
            isError
              ? "border-rose-200 bg-rose-50 text-rose-800"
              : "border-slate-200/80 bg-white text-slate-800"
          }`}
        >
          {isError ? (
            <div className="flex items-start gap-2">
              <span className="text-sm">⚠️</span>
              <p className="text-xs sm:text-sm font-medium">{message.content}</p>
            </div>
          ) : (
            <FormattedText content={message.content} />
          )}

          <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-1.5 text-[10px] text-slate-400">
            <span>{message.timestamp || "Just now"}</span>
            {!isError && (
              <span className="font-medium text-indigo-600/80">Grounded in ShopSphere Catalog</span>
            )}
          </div>
        </div>

        {/* Embedded MongoDB Product Recommendations */}
        {products.length > 0 && (
          <div className="mt-2 flex flex-col gap-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 text-[10px]">
                ✓
              </span>
              <span>Recommended Products ({products.length})</span>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-2 pt-1 scrollbar-thin scrollbar-thumb-slate-200">
              {products.map((prod) => (
                <ProductRecommendationCard key={prod._id} product={prod} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

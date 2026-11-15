import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useStore } from "../context/StoreContext";
import { aiService } from "../services/aiService";
import ChatWindow from "../components/ai/ChatWindow";
import { SparklesIcon, ShieldCheckIcon, TruckIcon } from "../components/Icons";

export default function AIShoppingAssistant() {
  const { user } = useAuth();
  const { showToast } = useStore();

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeProvider, setActiveProvider] = useState("Ollama");
  const [gatewayStatus, setGatewayStatus] = useState(null);

  // Load gateway status on mount to know active models & providers
  useEffect(() => {
    let cancelled = false;

    const fetchStatus = async () => {
      const status = await aiService.getStatus();
      if (!cancelled && status) {
        setGatewayStatus(status);
        if (status.primaryProvider) {
          setActiveProvider(status.primaryProvider.toUpperCase());
        }
      }
    };

    fetchStatus();

    return () => {
      cancelled = true;
    };
  }, []);

  // Handle sending a user message
  const handleSendMessage = async (userText) => {
    if (!userText || loading) return;

    const timestamp = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    const userMessage = {
      role: "user",
      content: userText,
      timestamp,
    };

    // Update conversation state immediately
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setLoading(true);

    try {
      // Build history payload (roles: user or assistant)
      const historyPayload = messages
        .filter(
          (m) =>
            !m.isError && (m.role === "user" || m.role === "assistant")
        )
        .slice(-20)
        .map((m) => ({
          role: m.role,
          content: m.content,
        }));

      const res = await aiService.sendMessage(userText, historyPayload);

      const assistantMessage = {
        role: "assistant",
        content: res.reply,
        provider: res.provider ? res.provider.toUpperCase() : undefined,
        model: res.model,
        fallbackOccurred: res.fallbackOccurred,
        products: res.products || [],
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      if (res.fallbackOccurred) {
        showToast(`Response routed via fallback provider (${res.provider})`, "info");
      }
    } catch (error) {
      const errorMessage = {
        role: "assistant",
        content: error.message || "Failed to communicate with AI Assistant. Please try again.",
        isError: true,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      setMessages((prev) => [...prev, errorMessage]);
      showToast("AI service temporary error. Please retry.", "error");
    } finally {
      setLoading(false);
    }
  };

  // Handle clearing the conversation
  const handleClearChat = () => {
    setMessages([]);
    showToast("Conversation cleared", "info");
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-2 text-xs text-slate-500">
        <Link to="/" className="hover:text-indigo-600 transition">Home</Link>
        <span>/</span>
        <span className="font-semibold text-slate-800">AI Shopping Assistant</span>
      </nav>

      {/* Page Title & Feature Badges */}
      <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700 mb-2">
            <SparklesIcon className="w-3.5 h-3.5 text-indigo-600" />
            <span>Intelligent Store Assistant</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            ShopSphere AI Assistant
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 max-w-2xl">
            Ask questions, discover products, compare technical specifications, and receive live recommendations grounded in our actual store catalog.
          </p>
        </div>

        {/* Live Service Guarantee Badges */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-white border border-slate-200/90 px-3 py-1.5 rounded-xl shadow-2xs">
            <ShieldCheckIcon className="w-4 h-4 text-emerald-600" />
            <span className="font-medium">Verified Catalog Pricing</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-white border border-slate-200/90 px-3 py-1.5 rounded-xl shadow-2xs">
            <TruckIcon className="w-4 h-4 text-indigo-600" />
            <span className="font-medium">Live Stock Check</span>
          </div>
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Left Informational Sidebar - Desktop */}
        <div className="hidden lg:flex lg:col-span-1 flex-col gap-4">
          {/* Assistant Info Card */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700 text-xs font-bold">
                i
              </span>
              <span>How It Works</span>
            </h3>
            <ul className="space-y-2.5 text-xs text-slate-600 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-indigo-600 font-bold">•</span>
                <span>Searches live MongoDB inventory for in-stock products.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-600 font-bold">•</span>
                <span>Filters only active variants to quote exact prices.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-600 font-bold">•</span>
                <span>Strict anti-hallucination guardrails: no fake discounts or items.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-600 font-bold">•</span>
                <span>Multi-provider fallback (Ollama, Gemini, Groq) ensures 99.9% uptime.</span>
              </li>
            </ul>
          </div>

          {/* Quick Links Card */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-2">Explore ShopSphere</h3>
            <div className="flex flex-col gap-1.5 text-xs font-semibold text-slate-600">
              <Link to="/shop" className="hover:text-indigo-600 py-1 transition flex items-center justify-between">
                <span>Browse Entire Catalog</span>
                <span>→</span>
              </Link>
              <Link to="/shop?sort=newest" className="hover:text-indigo-600 py-1 transition flex items-center justify-between">
                <span>New Arrivals</span>
                <span>→</span>
              </Link>
              <Link to="/orders" className="hover:text-indigo-600 py-1 transition flex items-center justify-between">
                <span>Track Existing Order</span>
                <span>→</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Center / Primary Chat Interface */}
        <div className="lg:col-span-3 w-full">
          <ChatWindow
            messages={messages}
            loading={loading}
            activeProvider={activeProvider}
            gatewayStatus={gatewayStatus}
            user={user}
            onSendMessage={handleSendMessage}
            onClearChat={handleClearChat}
            onSelectSuggestedQuestion={handleSendMessage}
          />
        </div>
      </div>
    </div>
  );
}

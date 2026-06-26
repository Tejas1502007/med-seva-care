import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Send, Activity } from "lucide-react";
import ReactMarkdown from "react-markdown";

export const Route = createFileRoute("/_patient/aara")({
  head: () => ({ meta: [{ title: "AARA — Your AI Health Companion" }] }),
  component: AaraPage,
});

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const STORAGE_KEY = "medseva-aara-messages";
const QUICK_REPLIES = ["Log vitals", "Missed medication", "I feel unwell", "Medication reminders"];

const WELCOME: Message = {
  id: "welcome",
  role: "assistant",
  content: "Namaste 🙏 I'm AARA, your health companion. I'm here to help you manage your health, answer questions about your medicines, and provide support. How can I help you today?",
};

function AaraPage() {
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length) {
          setMessages(parsed);
        }
      }
    } catch (e) {
      console.error("Failed to load messages from localStorage:", e);
    }
    setHydrated(true);
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (hydrated) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
      } catch (e) {
        console.error("Failed to save messages to localStorage:", e);
      }
    }
  }, [messages, hydrated]);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  // Focus input when not loading
  useEffect(() => {
    if (!isLoading) {
      inputRef.current?.focus();
    }
  }, [isLoading]);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    // Add user message
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: trimmed,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      // Call API
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            ...messages.map((m) => ({ role: m.role, content: m.content })),
            { role: "user", content: trimmed },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = (await response.json()) as { role: string; content: string };

      // Add assistant message
      const assistantMsg: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: data.content || "I apologize, I couldn't generate a response. Please try again.",
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (error) {
      console.error("Chat error:", error);
      const errorMsg: Message = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: `Sorry, I encountered an error: ${String(error)}. Please try again.`,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!hydrated) {
    return <div className="flex h-screen" style={{ background: "#F7F8FA" }} />;
  }

  return (
    <div className="flex h-screen">
      {/* Left sidebar */}
      <aside className="hidden lg:flex flex-col w-[280px] bg-white border-r p-5 gap-4" style={{ borderColor: "#E8ECF0" }}>
        <div className="flex flex-col items-center text-center mt-4">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #E8F5F1 0%, #F0FDF9 100%)" }}
          >
            <Activity size={32} color="#0D7A5F" />
          </div>
          <div className="text-lg font-semibold mt-3" style={{ color: "#1A2332" }}>
            AARA
          </div>
          <div className="text-[13px] inline-flex items-center gap-1" style={{ color: "#15803D" }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#15803D" }} /> Online
          </div>
        </div>

        <div className="card-base p-4">
          <div className="label-caps mb-1">AI Companion</div>
          <div className="text-sm font-semibold" style={{ color: "#1A2332" }}>
            Always here to help
          </div>
        </div>

        <div className="card-base p-4">
          <div className="label-caps mb-2">Features</div>
          <div className="text-sm space-y-1" style={{ color: "#6B7280" }}>
            <div>✓ Medicine advice</div>
            <div>✓ Lifestyle tips</div>
            <div>✓ Health support</div>
            <div>✓ Diet guidance</div>
          </div>
        </div>

        <p className="text-[12px] text-center mt-auto" style={{ color: "#6B7280" }}>
          All conversations are encrypted and secure.
        </p>
      </aside>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col" style={{ background: "#F7F8FA" }}>
        <header className="flex items-center justify-between bg-white border-b px-6 h-14" style={{ borderColor: "#E8ECF0" }}>
          <div className="text-base font-semibold" style={{ color: "#1A2332" }}>
            Chat with AARA
          </div>
          <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-1 rounded-full border" style={{ borderColor: "#0D7A5F", color: "#0D7A5F" }}>
            Encrypted
          </span>
        </header>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div className="flex justify-center">
            <span className="text-[11px] font-semibold uppercase tracking-wider px-3 py-1 rounded-full" style={{ background: "#EEF0F3", color: "#6B7280" }}>
              Conversation
            </span>
          </div>

          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className="max-w-[75%] px-4 py-3 rounded-xl text-sm"
                style={
                  msg.role === "user"
                    ? { background: "#0D7A5F", color: "#FFFFFF", borderTopRightRadius: 4 }
                    : { background: "#FFFFFF", color: "#374151", border: "1px solid #E8ECF0", borderTopLeftRadius: 4 }
                }
              >
                {msg.role === "user" ? (
                  msg.content
                ) : (
                  <div className="prose prose-sm max-w-none [&_p]:my-1 [&_p]:leading-relaxed [&_strong]:font-semibold [&_em]:italic">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="px-4 py-3 rounded-xl bg-white border text-sm" style={{ borderColor: "#E8ECF0" }}>
                <span className="inline-flex gap-1">
                  <Dot />
                  <Dot delay={0.15} />
                  <Dot delay={0.3} />
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Quick replies */}
        <div className="px-6 py-2 flex gap-2 overflow-x-auto">
          {QUICK_REPLIES.map((q) => (
            <button
              key={q}
              onClick={() => sendMessage(q)}
              disabled={isLoading}
              className="shrink-0 px-4 py-1.5 rounded-full border bg-white text-xs font-medium whitespace-nowrap hover:border-[#0D7A5F] disabled:opacity-50"
              style={{ borderColor: "#D1D5DB", color: "#374151" }}
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input area */}
        <div className="bg-white border-t p-4 flex items-center gap-3" style={{ borderColor: "#E8ECF0" }}>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !isLoading) {
                sendMessage(input);
              }
            }}
            placeholder="Ask AARA anything about your health..."
            className="flex-1 h-12 px-4 rounded-xl border outline-none text-sm disabled:opacity-50"
            style={{ borderColor: "#D1D5DB" }}
            disabled={isLoading}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isLoading}
            className="w-12 h-12 rounded-xl flex items-center justify-center text-white disabled:opacity-50"
            style={{ background: "#0D7A5F" }}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

function Dot({ delay = 0 }: { delay?: number }) {
  return (
    <span
      className="inline-block w-1.5 h-1.5 rounded-full animate-bounce"
      style={{ background: "#0D7A5F", animationDelay: `${delay}s` }}
    />
  );
}

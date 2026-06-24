import { createFileRoute } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useEffect, useRef, useState } from "react";
import { Send, Mic, Activity } from "lucide-react";
import ReactMarkdown from "react-markdown";

export const Route = createFileRoute("/_patient/aara")({
  head: () => ({ meta: [{ title: "AARA — Your AI Health Companion" }] }),
  component: AaraPage,
});

const STORAGE_KEY = "medseva-aara-messages";
const QUICK_REPLIES = ["Log vitals", "Missed medication", "I feel unwell", "View Lab Results"];

const WELCOME = {
  id: "welcome",
  role: "assistant" as const,
  parts: [
    {
      type: "text" as const,
      text: "Namaste, Rajesh ji 🙏 I'm AARA, your health companion. I see your blood sugar reading today was 142 mg/dL — slightly elevated. How are you feeling? Have you taken your evening Metformin?",
    },
  ],
};

function AaraPage() {
  const [input, setInput] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [initialMessages, setInitialMessages] = useState<typeof WELCOME[]>([WELCOME]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length) setInitialMessages(parsed);
      }
    } catch {}
    setHydrated(true);
  }, []);

  if (!hydrated) return <ChatShell />;
  return <ChatInner input={input} setInput={setInput} initialMessages={initialMessages} />;
}

function ChatShell() {
  return <div className="flex h-screen" style={{ background: "#F7F8FA" }} />;
}

function ChatInner({
  input,
  setInput,
  initialMessages,
}: {
  input: string;
  setInput: (v: string) => void;
  initialMessages: typeof WELCOME[];
}) {

  const { messages, sendMessage, status } = useChat({
    id: "aara-main",
    messages: initialMessages,
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(messages)); } catch {}
    }
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  useEffect(() => { inputRef.current?.focus(); }, [status]);

  const submit = (text: string) => {
    const t = text.trim();
    if (!t || status === "submitted" || status === "streaming") return;
    sendMessage({ text: t });
    setInput("");
  };

  return (
    <div className="flex h-screen">
      {/* Left side panel */}
      <aside className="hidden lg:flex flex-col w-[280px] bg-white border-r p-5 gap-4" style={{ borderColor: "#E8ECF0" }}>
        <div className="flex flex-col items-center text-center mt-4">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #E8F5F1 0%, #F0FDF9 100%)" }}
          >
            <Activity size={32} color="#0D7A5F" />
          </div>
          <div className="text-lg font-semibold mt-3" style={{ color: "#1A2332" }}>AARA</div>
          <div className="text-[13px] inline-flex items-center gap-1" style={{ color: "#15803D" }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#15803D" }} /> Online
          </div>
        </div>

        <div className="card-base p-4">
          <div className="label-caps mb-1">Last Activity</div>
          <div className="text-sm font-semibold" style={{ color: "#1A2332" }}>Meds logged 1 hour ago</div>
        </div>

        <div className="card-base p-4">
          <div className="label-caps mb-2">Health Summary</div>
          <div className="text-sm font-medium mb-2" style={{ color: "#1A2332" }}>Vitals stable</div>
          <div className="h-1 rounded-full" style={{ background: "#EEF0F3" }}>
            <div className="h-1 rounded-full" style={{ width: "80%", background: "#0D7A5F" }} />
          </div>
        </div>

        <p className="text-[12px] text-center mt-auto" style={{ color: "#6B7280" }}>
          AARA is trained on your health history for personalized care.
        </p>
      </aside>

      {/* Right chat panel */}
      <div className="flex-1 flex flex-col" style={{ background: "#F7F8FA" }}>
        <header className="flex items-center justify-between bg-white border-b px-6 h-14" style={{ borderColor: "#E8ECF0" }}>
          <div className="text-base font-semibold" style={{ color: "#1A2332" }}>Conversation</div>
          <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-1 rounded-full border" style={{ borderColor: "#0D7A5F", color: "#0D7A5F" }}>
            Encrypted
          </span>
        </header>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div className="flex justify-center">
            <span className="text-[11px] font-semibold uppercase tracking-wider px-3 py-1 rounded-full" style={{ background: "#EEF0F3", color: "#6B7280" }}>
              Today
            </span>
          </div>

          {messages.map((m: typeof messages[number]) => {
            const text = m.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
            const isUser = m.role === "user";
            return (
              <div key={m.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                <div
                  className="max-w-[75%] px-4 py-3 rounded-xl text-sm"
                  style={
                    isUser
                      ? { background: "#0D7A5F", color: "#FFFFFF", borderTopRightRadius: 4 }
                      : { background: "#FFFFFF", color: "#374151", border: "1px solid #E8ECF0", borderTopLeftRadius: 4 }
                  }
                >
                  {isUser ? (
                    text
                  ) : (
                    <div className="prose prose-sm max-w-none [&_p]:my-1 [&_p]:leading-relaxed">
                      <ReactMarkdown>{text}</ReactMarkdown>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {(status === "submitted" || status === "streaming") && messages[messages.length - 1]?.role === "user" && (
            <div className="flex justify-start">
              <div className="px-4 py-3 rounded-xl bg-white border text-sm" style={{ borderColor: "#E8ECF0" }}>
                <span className="inline-flex gap-1">
                  <Dot /><Dot delay={0.15} /><Dot delay={0.3} />
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
              onClick={() => submit(q)}
              className="shrink-0 px-4 py-1.5 rounded-full border bg-white text-xs font-medium whitespace-nowrap hover:border-[#0D7A5F]"
              style={{ borderColor: "#D1D5DB", color: "#374151" }}
            >
              {q}
            </button>
          ))}
        </div>

        <div className="bg-white border-t p-4 flex items-center gap-3" style={{ borderColor: "#E8ECF0" }}>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") submit(input); }}
            placeholder="Ask AARA anything about your health..."
            className="flex-1 h-12 px-4 rounded-xl border outline-none text-sm"
            style={{ borderColor: "#D1D5DB" }}
          />
          <button className="w-12 h-12 rounded-xl border flex items-center justify-center" style={{ borderColor: "#0D7A5F", color: "#0D7A5F" }}>
            <Mic size={18} />
          </button>
          <button
            onClick={() => submit(input)}
            disabled={!input.trim() || status === "submitted" || status === "streaming"}
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

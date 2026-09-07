"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { initials } from "@/lib/vitta/format";
import { cn } from "@/lib/utils";
import { CURRENT_USER } from "@/lib/vitta/types";

interface ChatMsg {
  role: "user" | "assistant";
  content: string;
}

const WELCOME: ChatMsg = {
  role: "assistant",
  content:
    "Hello! I'm VITTA AI. Ask me anything about your business — sales insights, drafting emails, ERP how-tos, or summarizing data.",
};

const SUGGESTIONS = [
  "Summarize my sales pipeline",
  "Draft a follow-up email to a lead",
  "What KPIs should I track monthly?",
  "Explain quotation vs sales order",
];

function Bubble({ m }: { m: ChatMsg }) {
  const own = m.role === "user";
  return (
    <div className={cn("flex items-end gap-2", own && "flex-row-reverse")}>
      <Avatar className="h-7 w-7 shrink-0 border">
        <AvatarFallback className={cn("text-[10px] font-bold", own ? "bg-[#714B67] text-white" : "bg-[#F3EDF2] text-[#714B67]")}>
          {own ? initials(CURRENT_USER) : <Sparkles className="h-3.5 w-3.5" />}
        </AvatarFallback>
      </Avatar>
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-3.5 py-2 text-sm",
          own ? "bg-[#714B67] text-white" : "border bg-white text-foreground"
        )}
      >
        <div className={cn("text-[11px] font-semibold", own ? "text-white/80" : "text-[#714B67]")}>
          {own ? CURRENT_USER : "VITTA AI"}
        </div>
        <div className="whitespace-pre-wrap break-words">{m.content}</div>
      </div>
    </div>
  );
}

export default function AiModule() {
  const [messages, setMessages] = useState<ChatMsg[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the latest message.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, loading]);

  const hasUserMsg = messages.some((m) => m.role === "user");

  async function send(text: string) {
    const content = text.trim();
    if (!content || loading) return;
    setInput("");
    const next: ChatMsg[] = [...messages, { role: "user", content }];
    setMessages(next);
    setLoading(true);
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next.slice(-10) }),
      });
      if (!res.ok) {
        let msg = `Request failed (${res.status})`;
        try {
          const body = await res.json();
          if (body?.error) msg = body.error;
        } catch {
          /* ignore */
        }
        throw new Error(msg);
      }
      const data = (await res.json()) as { reply: string };
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "AI request failed");
      // Drop the optimistic user message and restore the composer for retry.
      setMessages((prev) => prev.slice(0, -1));
      setInput(content);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-[calc(100vh-3rem)] flex-col">
      {/* Brand header band */}
      <div className="shrink-0 bg-gradient-to-r from-[#714B67] to-[#4C3247] px-4 py-4 md:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-baseline gap-x-2">
              <h1 className="text-lg font-semibold text-white">VITTA AI</h1>
              <span className="text-[11px] text-white/70">Enterprise assistant · Beta</span>
            </div>
            <p className="text-[11px] text-white/60">AI responses may be inaccurate</p>
          </div>
        </div>
      </div>

      {/* Chat transcript */}
      <div ref={scrollRef} className="scroll-slim flex-1 overflow-y-auto px-4 py-4 md:px-6">
        <div className="mx-auto max-w-2xl space-y-3">
          {messages.map((m, i) => (
            <Bubble key={i} m={m} />
          ))}
          {loading && (
            <div className="flex items-end gap-2" role="status" aria-label="Assistant is typing">
              <Avatar className="h-7 w-7 shrink-0 border">
                <AvatarFallback className="bg-[#F3EDF2] text-[#714B67]">
                  <Sparkles className="h-3.5 w-3.5" />
                </AvatarFallback>
              </Avatar>
              <div className="rounded-2xl border bg-white px-4 py-3">
                <div className="flex gap-1.5">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#714B67]" />
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#714B67] [animation-delay:150ms]" />
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#714B67] [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}
          {!hasUserMsg && !loading && (
            <div className="flex flex-wrap gap-2 pt-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => send(s)}
                  className="inline-flex h-10 items-center rounded-full border bg-white px-4 text-xs font-medium text-[#714B67] transition-colors hover:bg-[#F3EDF2]"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Composer */}
      <div className="shrink-0 border-t bg-white p-3 md:px-6">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="mx-auto flex max-w-2xl gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask VITTA AI anything..."
            aria-label="Ask VITTA AI"
            className="h-11"
          />
          <Button
            type="submit"
            size="icon"
            className="h-11 w-11 shrink-0"
            disabled={!input.trim() || loading}
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}

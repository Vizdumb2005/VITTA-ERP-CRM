"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Hash, MessagesSquare, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useResource } from "@/lib/vitta/use-resource";
import { PageHeader } from "@/components/vitta/ui/page-header";
import { EmptyState } from "@/components/vitta/ui/empty-state";
import { fmtDateTime, initials } from "@/lib/vitta/format";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { CURRENT_USER, type Message } from "@/lib/vitta/types";

const CHANNELS = ["general", "sales", "support", "marketing"];

function MessageRow({ m }: { m: Message }) {
  const own = m.author === CURRENT_USER;
  return (
    <div className={cn("flex items-end gap-2", own && "flex-row-reverse")}>
      <Avatar className="h-7 w-7 shrink-0 border">
        <AvatarFallback className={cn("text-[10px] font-bold", own ? "bg-[#714B67] text-white" : "bg-[#F3EDF2] text-[#714B67]")}>
          {initials(m.author)}
        </AvatarFallback>
      </Avatar>
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-3.5 py-2 text-sm",
          own ? "bg-[#714B67] text-white" : "border bg-white text-foreground"
        )}
      >
        <div className={cn("text-[11px] font-semibold", own ? "text-white/80" : "text-[#714B67]")}>{m.author}</div>
        <div className="whitespace-pre-wrap break-words">{m.content}</div>
        <div className={cn("mt-0.5 text-[10px]", own ? "text-white/60" : "text-muted-foreground")}>
          {fmtDateTime(m.createdAt)}
        </div>
      </div>
    </div>
  );
}

export default function DiscussModule() {
  const [active, setActive] = useState<string>("general");
  // Passing a params object makes the hook reload whenever the channel changes.
  const { items, setItems, loading, reload, create } = useResource<Message>("messages", { channel: active });
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Live updates: poll for new messages every 5 seconds.
  useEffect(() => {
    const id = setInterval(() => {
      reload();
    }, 5000);
    return () => clearInterval(id);
  }, [reload]);

  // Auto-scroll to the bottom when messages arrive or the channel switches.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [items, active]);

  const sorted = useMemo(
    () => [...items].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    [items]
  );

  async function handleSend() {
    const content = draft.trim();
    if (!content) return;
    setDraft("");
    try {
      const item = await create({ channel: active, author: CURRENT_USER, content });
      // The hook prepends; keep chat chronological by appending instead.
      setItems((prev) => [...prev.filter((m) => m.id !== item.id), item]);
    } catch (err) {
      setDraft(content);
      toast.error(err instanceof Error ? err.message : "Failed to send message");
    }
  }

  return (
    <div className="flex h-[calc(100vh-3rem)] flex-col">
      <PageHeader title="Discuss" itemCount={items.length} onRefresh={reload} loading={loading} />

      {/* Channel chips — mobile only */}
      <div className="scroll-slim flex gap-2 overflow-x-auto border-b bg-white px-4 py-2 md:hidden">
        {CHANNELS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setActive(c)}
            aria-label={`Open ${c} channel`}
            className={cn(
              "inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full border px-4 text-xs font-medium transition-colors",
              active === c
                ? "border-[#714B67] bg-[#F3EDF2] text-[#714B67]"
                : "bg-background text-muted-foreground hover:bg-muted"
            )}
          >
            <Hash className="h-3.5 w-3.5" />
            {c}
          </button>
        ))}
      </div>

      <div className="flex min-h-0 flex-1">
        {/* Channel sidebar — desktop only */}
        <aside className="hidden w-48 shrink-0 flex-col border-r bg-white p-2 md:flex">
          <div className="px-2 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Channels
          </div>
          <div className="space-y-1">
            {CHANNELS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setActive(c)}
                aria-label={`Open ${c} channel`}
                className={cn(
                  "flex h-11 w-full items-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors",
                  active === c ? "bg-[#F3EDF2] text-[#714B67]" : "text-muted-foreground hover:bg-muted"
                )}
              >
                <Hash className="h-4 w-4 shrink-0" />
                <span className="truncate">{c}</span>
              </button>
            ))}
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <div ref={scrollRef} className="scroll-slim flex-1 space-y-3 overflow-y-auto px-4 py-4 md:px-6">
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className={cn("flex items-end gap-2", i % 2 === 1 && "flex-row-reverse")}>
                    <Skeleton className="h-7 w-7 rounded-full" />
                    <Skeleton className={cn("h-16 rounded-2xl", i % 2 === 1 ? "w-52" : "w-72")} />
                  </div>
                ))}
              </div>
            ) : sorted.length === 0 ? (
              <EmptyState
                icon={<MessagesSquare className="h-7 w-7" />}
                title={`No messages in #${active}`}
                description="Start the conversation — say hello to the team."
              />
            ) : (
              sorted.map((m) => <MessageRow key={m.id} m={m} />)
            )}
          </div>

          <div className="sticky bottom-0 shrink-0 border-t bg-white p-3 md:px-6">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex gap-2"
            >
              <Input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={`Message #${active}`}
                aria-label={`Message ${active} channel`}
                className="h-11"
              />
              <Button
                type="submit"
                size="icon"
                className="h-11 w-11 shrink-0"
                disabled={!draft.trim()}
                aria-label="Send message"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

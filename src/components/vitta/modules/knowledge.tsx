"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { History, NotebookPen, Pin, PinOff, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useResource } from "@/lib/vitta/use-resource";
import { PageHeader } from "@/components/vitta/ui/page-header";
import { RecordDrawer, type FieldDef, type RecordValues } from "@/components/vitta/ui/record-drawer";
import { StatCard } from "@/components/vitta/ui/stat-card";
import { EmptyState } from "@/components/vitta/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { fmtDate } from "@/lib/vitta/format";
import type { Note } from "@/lib/vitta/types";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

const FIELDS: FieldDef[] = [
  { name: "title", label: "Title", type: "text", required: true, full: true, placeholder: "e.g. Expense policy 2025" },
  { name: "content", label: "Content", type: "textarea", full: true, placeholder: "Write freely — this is the company wiki." },
  { name: "pinned", label: "Pinned", type: "select", defaultValue: "no", options: [
    { value: "yes", label: "Yes" },
    { value: "no", label: "No" },
  ]},
];

export default function KnowledgeModule() {
  const { items, loading, reload, create, update } = useResource<Note>("notes");
  const [q, setQ] = useState("");
  const [drawer, setDrawer] = useState<{ open: boolean; item: Note | null }>({ open: false, item: null });

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const matched = needle
      ? items.filter(
          (n) =>
            n.title.toLowerCase().includes(needle) ||
            n.content.toLowerCase().includes(needle)
        )
      : items;
    return [...matched].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [items, q]);

  const pinnedCount = items.filter((n) => n.pinned).length;
  const weekCount = items.filter((n) => Date.now() - new Date(n.updatedAt).getTime() < WEEK_MS).length;

  async function togglePin(note: Note) {
    await update(note.id, { pinned: !note.pinned });
    toast.success(note.pinned ? "Note unpinned" : "Note pinned to top");
  }

  async function handleSave(values: RecordValues) {
    const payload = {
      title: values.title,
      content: values.content ?? "",
      pinned: values.pinned === "yes",
    };
    if (drawer.item) {
      await update(drawer.item.id, payload);
      toast.success("Note updated");
    } else {
      await create(payload);
      toast.success("Note created");
    }
    setDrawer({ open: false, item: null });
  }

  return (
    <div className="flex min-h-[calc(100vh-3rem)] flex-col">
      <PageHeader
        title="Knowledge"
        itemCount={filtered.length}
        search={q}
        onSearch={setQ}
        searchPlaceholder="Search notes..."
        onRefresh={reload}
        loading={loading}
        actions={
          <Button onClick={() => setDrawer({ open: true, item: null })} className="h-9">
            <Plus className="mr-1 h-4 w-4" /> New note
          </Button>
        }
      >
        <Tabs defaultValue="all">
          <TabsList className="h-8">
            <TabsTrigger value="all" className="h-6 px-3 text-xs">Company wiki</TabsTrigger>
            <TabsTrigger value="private" className="h-6 px-3 text-xs" disabled>Shared with me</TabsTrigger>
          </TabsList>
        </Tabs>
      </PageHeader>

      <div className="grid grid-cols-1 gap-3 px-4 pt-4 sm:grid-cols-3 md:px-6">
        <StatCard label="Total notes" value={items.length} icon={<NotebookPen className="h-5 w-5" />} tone="brand" />
        <StatCard label="Pinned" value={pinnedCount} sub="Pinned notes appear first" icon={<Pin className="h-5 w-5" />} tone="amber" />
        <StatCard label="Updated this week" value={weekCount} sub="Active in the last 7 days" icon={<History className="h-5 w-5" />} tone="teal" />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 md:p-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<NotebookPen className="h-7 w-7" />}
          title="No notes found"
          description={q ? "Try a different search term." : "Create your first wiki note to share knowledge with the team."}
          action={
            !q ? (
              <Button onClick={() => setDrawer({ open: true, item: null })} size="sm" className="h-9">
                <Plus className="mr-1 h-4 w-4" /> New note
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid flex-1 grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 md:p-6">
          {filtered.map((note) => (
            <article
              key={note.id}
              tabIndex={0}
              aria-label={`Open note ${note.title}`}
              onKeyDown={(e) => {
                if (e.key === "Enter") setDrawer({ open: true, item: note });
              }}
              onClick={() => setDrawer({ open: true, item: note })}
              className="flex cursor-pointer flex-col rounded-xl border bg-white p-4 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold leading-snug text-foreground">{note.title}</h3>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePin(note);
                  }}
                  aria-label={note.pinned ? `Unpin ${note.title}` : `Pin ${note.title}`}
                  className="-m-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  {note.pinned ? <Pin className="h-4 w-4 fill-amber-400 text-amber-500" /> : <PinOff className="h-4 w-4" />}
                </button>
              </div>
              <p className="mt-2 line-clamp-3 flex-1 text-sm text-muted-foreground">{note.content || "Empty note"}</p>
              <div className="mt-3 border-t pt-2 text-[11px] text-muted-foreground">
                Updated {fmtDate(note.updatedAt)}
              </div>
            </article>
          ))}
        </div>
      )}

      <RecordDrawer
        open={drawer.open}
        onClose={() => setDrawer({ open: false, item: null })}
        title={drawer.item ? `Edit — ${drawer.item.title}` : "New Note"}
        description="Company wiki — visible to everyone in the workspace."
        fields={FIELDS}
        initial={drawer.item ? { ...drawer.item, pinned: drawer.item.pinned ? "yes" : "no" } : null}
        onSubmit={handleSave}
      />
    </div>
  );
}

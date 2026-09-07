"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  FileImage,
  FileSpreadsheet,
  FileText,
  Files,
  Folder,
  FolderOpen,
  HardDrive,
  Link2,
  Plus,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useResource } from "@/lib/vitta/use-resource";
import { PageHeader } from "@/components/vitta/ui/page-header";
import { RecordDrawer, type FieldDef, type RecordValues } from "@/components/vitta/ui/record-drawer";
import { StatCard } from "@/components/vitta/ui/stat-card";
import { EmptyState } from "@/components/vitta/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { fmtDate, initials } from "@/lib/vitta/format";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CURRENT_USER, type DocFile } from "@/lib/vitta/types";
import { cn } from "@/lib/utils";

const BASE_FOLDERS = ["General", "Legal", "Finance", "Sales", "Operations", "HR", "Marketing", "Product"];

const KIND_META: Record<DocFile["kind"], { icon: LucideIcon; color: string; bg: string }> = {
  pdf: { icon: FileText, color: "text-rose-500", bg: "bg-rose-50" },
  sheet: { icon: FileSpreadsheet, color: "text-emerald-600", bg: "bg-emerald-50" },
  image: { icon: FileImage, color: "text-sky-500", bg: "bg-sky-50" },
  doc: { icon: FileText, color: "text-sky-700", bg: "bg-sky-50" },
  folder: { icon: Folder, color: "text-amber-500", bg: "bg-amber-50" },
  link: { icon: Link2, color: "text-violet-500", bg: "bg-violet-50" },
};

const KIND_OPTIONS = (Object.keys(KIND_META) as DocFile["kind"][]).map((k) => ({ value: k, label: k.charAt(0).toUpperCase() + k.slice(1) }));

export default function DocumentsModule() {
  const { items, loading, reload, create, update, remove } = useResource<DocFile>("documents");
  const [folder, setFolder] = useState<string>("All");
  const [drawer, setDrawer] = useState<{ open: boolean; item: DocFile | null }>({ open: false, item: null });

  const folders = useMemo(() => Array.from(new Set(items.map((d) => d.folder).filter(Boolean))).sort(), [items]);

  const filtered = useMemo(
    () => (folder === "All" ? items : items.filter((d) => d.folder === folder)),
    [items, folder]
  );

  const storageKb = items.reduce((a, d) => a + d.sizeKb, 0);
  const storageMb = (storageKb / 1024).toFixed(1);
  const pdfCount = items.filter((d) => d.kind === "pdf").length;

  const folderOptions = useMemo(() => {
    const merged = Array.from(new Set([...BASE_FOLDERS, ...folders]));
    return merged.map((f) => ({ value: f, label: f }));
  }, [folders]);

  const FIELDS: FieldDef[] = [
    { name: "name", label: "File name", type: "text", required: true, full: true, placeholder: "e.g. Vendor-agreement-2025.pdf" },
    { name: "kind", label: "Kind", type: "select", defaultValue: "doc", options: KIND_OPTIONS },
    { name: "folder", label: "Folder", type: "select", defaultValue: "General", options: folderOptions },
    { name: "sizeKb", label: "Size (KB)", type: "number", defaultValue: "120" },
    { name: "owner", label: "Owner", type: "text", defaultValue: CURRENT_USER },
  ];

  async function handleSave(values: RecordValues) {
    const payload = {
      name: values.name,
      kind: (values.kind || "doc") as DocFile["kind"],
      folder: values.folder || "General",
      sizeKb: Number(values.sizeKb || 0),
      owner: values.owner || CURRENT_USER,
    };
    if (drawer.item) {
      await update(drawer.item.id, payload);
      toast.success("File updated");
    } else {
      await create(payload);
      toast.success("File added");
    }
    setDrawer({ open: false, item: null });
  }

  async function handleDelete() {
    if (!drawer.item) return;
    await remove(drawer.item.id);
    toast.success("File deleted");
    setDrawer({ open: false, item: null });
  }

  return (
    <div className="flex min-h-[calc(100vh-3rem)] flex-col">
      <PageHeader
        title="Documents"
        itemCount={filtered.length}
        onRefresh={reload}
        loading={loading}
        actions={
          <Button onClick={() => setDrawer({ open: true, item: null })} className="h-9">
            <Plus className="mr-1 h-4 w-4" /> Upload
          </Button>
        }
      >
        <div className="scroll-slim flex items-center gap-2 overflow-x-auto pb-1">
          {["All", ...folders].map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFolder(f)}
              aria-pressed={folder === f}
              className={cn(
                "inline-flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 text-xs font-medium transition-colors",
                folder === f
                  ? "border-[#714B67] bg-[#714B67] text-white"
                  : "border-border bg-white text-muted-foreground hover:bg-muted"
              )}
            >
              {f === "All" ? <Files className="h-3.5 w-3.5" /> : <FolderOpen className="h-3.5 w-3.5" />}
              {f}
            </button>
          ))}
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 gap-3 px-4 pt-4 sm:grid-cols-2 lg:grid-cols-4 md:px-6">
        <StatCard label="Total files" value={items.length} icon={<Files className="h-5 w-5" />} tone="brand" />
        <StatCard label="Storage used" value={`${storageMb} MB`} sub={`${storageKb.toLocaleString("en-IN")} KB total`} icon={<HardDrive className="h-5 w-5" />} tone="sky" />
        <StatCard label="Folders" value={folders.length} icon={<FolderOpen className="h-5 w-5" />} tone="amber" />
        <StatCard label="PDF documents" value={pdfCount} icon={<FileText className="h-5 w-5" />} tone="rose" />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 md:p-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-36 w-full rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<FolderOpen className="h-7 w-7" />}
          title={folder === "All" ? "No documents yet" : `Nothing in ${folder}`}
          description={folder === "All" ? "Upload your first file to get started." : "Try another folder or upload a file here."}
        />
      ) : (
        <div className="grid flex-1 grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 md:p-6">
          {filtered.map((doc) => {
            const meta = KIND_META[doc.kind] ?? KIND_META.doc;
            const Icon = meta.icon;
            return (
              <article
                key={doc.id}
                tabIndex={0}
                aria-label={`Open file ${doc.name}`}
                onKeyDown={(e) => {
                  if (e.key === "Enter") setDrawer({ open: true, item: doc });
                }}
                onClick={() => setDrawer({ open: true, item: doc })}
                className="flex cursor-pointer flex-col rounded-xl border bg-white p-4 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className={cn("flex h-11 w-11 items-center justify-center rounded-lg", meta.bg)}>
                    <Icon className={cn("h-5 w-5", meta.color)} />
                  </div>
                  <Avatar className="h-7 w-7 border">
                    <AvatarFallback className="bg-[#F3EDF2] text-[9px] font-bold text-[#714B67]">
                      {initials(doc.owner)}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <h3 className="mt-3 line-clamp-2 font-medium leading-snug text-foreground">{doc.name}</h3>
                <div className="mt-1 text-xs text-muted-foreground">{doc.sizeKb} KB</div>
                <div className="mt-3 flex items-center justify-between border-t pt-2 text-[11px] text-muted-foreground">
                  <span className="truncate">{doc.folder}</span>
                  <span className="shrink-0">{fmtDate(doc.createdAt)}</span>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <RecordDrawer
        open={drawer.open}
        onClose={() => setDrawer({ open: false, item: null })}
        title={drawer.item ? `Edit — ${drawer.item.name}` : "New Document"}
        description="Central file library shared across every VITTA app."
        fields={FIELDS}
        initial={drawer.item ? { ...drawer.item } : null}
        onSubmit={handleSave}
        onDelete={drawer.item ? handleDelete : undefined}
      />
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export interface FieldDef {
  name: string;
  label: string;
  type: "text" | "number" | "date" | "textarea" | "select" | "email" | "tel";
  options?: { value: string; label: string }[];
  placeholder?: string;
  required?: boolean;
  /** number input step, e.g. "0.01" */
  step?: string;
  /** span both columns in the form grid */
  full?: boolean;
  /** default value when creating */
  defaultValue?: string;
}

export interface RecordValues {
  [name: string]: string;
}

/**
 * Generic record create/edit drawer used by every VITTA module.
 * Values are submitted as strings; callers convert numbers/dates.
 */
export function RecordDrawer({
  open,
  onClose,
  title,
  description,
  fields,
  initial,
  onSubmit,
  onDelete,
  submitLabel,
  width = "sm:max-w-lg",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  fields: FieldDef[];
  initial?: Record<string, unknown> | null;
  onSubmit: (values: RecordValues) => Promise<void>;
  onDelete?: () => Promise<void>;
  submitLabel?: string;
  width?: string;
}) {
  const [values, setValues] = useState<RecordValues>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (open) {
      const next: RecordValues = {};
      for (const f of fields) {
        const raw = initial?.[f.name];
        next[f.name] =
          raw === undefined || raw === null || String(raw) === "Invalid Date" ? f.defaultValue ?? "" : String(raw);
      }
      setValues(next);
    }
  }, [open, initial]);

  const set = (name: string, value: string) => setValues((v) => ({ ...v, [name]: value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    for (const f of fields) {
      if (f.required && !values[f.name]?.trim?.()) {
        toast.error(`${f.label} is required`);
        return;
      }
    }
    try {
      setSaving(true);
      await onSubmit(values);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!onDelete) return;
    try {
      setDeleting(true);
      await onDelete();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className={`scroll-slim flex w-full flex-col gap-0 overflow-y-auto p-0 ${width}`}>
        <SheetHeader className="border-b px-5 py-4">
          <SheetTitle>{title}</SheetTitle>
          {description ? <SheetDescription>{description}</SheetDescription> : null}
        </SheetHeader>
        <form onSubmit={handleSubmit} className="flex flex-1 flex-col">
          <div className="grid flex-1 grid-cols-1 gap-4 px-5 py-5 sm:grid-cols-2">
            {fields.map((f) => (
              <div key={f.name} className={f.full ? "sm:col-span-2" : ""}>
                <Label htmlFor={`fld-${f.name}`} className="mb-1.5 block text-xs">
                  {f.label}
                  {f.required ? <span className="ml-0.5 text-rose-500">*</span> : null}
                </Label>
                {f.type === "textarea" ? (
                  <Textarea
                    id={`fld-${f.name}`}
                    value={values[f.name] ?? ""}
                    onChange={(e) => set(f.name, e.target.value)}
                    placeholder={f.placeholder}
                    rows={3}
                  />
                ) : f.type === "select" ? (
                  <Select value={values[f.name] ?? ""} onValueChange={(v) => set(f.name, v)}>
                    <SelectTrigger id={`fld-${f.name}`} className="w-full">
                      <SelectValue placeholder={f.placeholder ?? "Select..."} />
                    </SelectTrigger>
                    <SelectContent>
                      {(f.options ?? []).map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id={`fld-${f.name}`}
                    type={f.type}
                    step={f.step}
                    value={values[f.name] ?? ""}
                    onChange={(e) => set(f.name, e.target.value)}
                    placeholder={f.placeholder}
                  />
                )}
              </div>
            ))}
          </div>
          <SheetFooter className="flex-row items-center justify-between gap-2 border-t px-5 py-4">
            <div>
              {onDelete ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleDelete}
                  disabled={deleting || saving}
                  className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                >
                  {deleting ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Trash2 className="mr-1 h-4 w-4" />}
                  Delete
                </Button>
              ) : null}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving || deleting}>
                {saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
                {submitLabel ?? "Save"}
              </Button>
            </div>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

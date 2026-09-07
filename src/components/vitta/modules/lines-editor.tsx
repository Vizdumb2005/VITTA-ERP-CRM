"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fmtMoney } from "@/lib/vitta/format";

export interface EditorLine {
  description: string;
  qty: string;
  price: string;
}

function toNum(v: string): number {
  const n = Number(v);
  return isFinite(n) && n > 0 ? n : 0;
}

/**
 * Shared editable order-lines table used by the Sales & Purchase forms.
 * All values are kept as strings while editing; callers convert on submit.
 */
export default function LinesEditor({
  lines,
  onChange,
}: {
  lines: EditorLine[];
  onChange: (l: EditorLine[]) => void;
}) {
  function setLine(i: number, patch: Partial<EditorLine>) {
    onChange(lines.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  }

  function addLine() {
    onChange([...lines, { description: "", qty: "1", price: "0" }]);
  }

  function removeLine(i: number) {
    onChange(lines.filter((_, idx) => idx !== i));
  }

  return (
    <div className="overflow-hidden rounded-lg border bg-white">
      <div className="hidden gap-2 border-b bg-muted/40 px-2.5 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground sm:grid sm:grid-cols-[minmax(0,1fr)_64px_92px_84px_36px]">
        <span>Description</span>
        <span className="text-right">Qty</span>
        <span className="text-right">Price</span>
        <span className="text-right">Total</span>
        <span />
      </div>
      {lines.length === 0 ? (
        <div className="border-b border-dashed px-3 py-4 text-center text-xs text-muted-foreground">
          No lines yet. Add your first line.
        </div>
      ) : null}
      {lines.map((line, i) => (
        <div
          key={i}
          className="border-b px-2.5 py-2.5 last:border-b-0 sm:grid sm:grid-cols-[minmax(0,1fr)_64px_92px_84px_36px] sm:items-center sm:gap-2"
        >
          <div className="mb-2 sm:mb-0">
            <Input
              value={line.description}
              onChange={(e) => setLine(i, { description: e.target.value })}
              placeholder={`Item ${i + 1} description`}
              className="h-9"
              aria-label={`Line ${i + 1} description`}
            />
          </div>
          <div className="grid grid-cols-[64px_92px_84px_36px] items-center gap-2 sm:contents">
            <Input
              type="number"
              min="0"
              step="1"
              value={line.qty}
              onChange={(e) => setLine(i, { qty: e.target.value })}
              className="h-9 text-right"
              aria-label={`Line ${i + 1} quantity`}
            />
            <Input
              type="number"
              min="0"
              step="0.01"
              value={line.price}
              onChange={(e) => setLine(i, { price: e.target.value })}
              className="h-9 text-right"
              aria-label={`Line ${i + 1} unit price`}
            />
            <span className="text-right text-xs font-medium tabular-nums sm:text-sm">
              {fmtMoney(toNum(line.qty) * toNum(line.price))}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
              onClick={() => removeLine(i)}
              aria-label={`Remove line ${i + 1}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
      <div className="px-2.5 py-2.5">
        <Button type="button" variant="outline" size="sm" className="h-9" onClick={addLine}>
          <Plus className="mr-1 h-4 w-4" /> Add line
        </Button>
      </div>
    </div>
  );
}

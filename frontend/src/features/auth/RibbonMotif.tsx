import { cn } from "@/lib/cn";

type Cell = { start: string; len: number; state: "free" | "booked" | "selected" | "past" };

// Two availability blocks drawn at the same minute scale, so 15-minute slots look longer than
// 10-minute ones: the signature time ribbon (design doc section 7), used here as a brand motif.
const BLOCKS: { label: string; cells: Cell[] }[] = [
  {
    label: "Morning, 10-minute slots",
    cells: [
      { start: "09:00", len: 10, state: "past" },
      { start: "09:10", len: 10, state: "past" },
      { start: "09:20", len: 10, state: "booked" },
      { start: "09:30", len: 10, state: "booked" },
      { start: "09:40", len: 10, state: "free" },
      { start: "09:50", len: 10, state: "booked" },
      { start: "10:00", len: 10, state: "free" },
      { start: "10:10", len: 10, state: "booked" },
      { start: "10:20", len: 10, state: "free" },
      { start: "10:30", len: 10, state: "selected" },
      { start: "10:40", len: 10, state: "free" },
      { start: "10:50", len: 10, state: "booked" },
    ],
  },
  {
    label: "Evening, 15-minute slots",
    cells: [
      { start: "17:00", len: 15, state: "booked" },
      { start: "17:15", len: 15, state: "free" },
      { start: "17:30", len: 15, state: "booked" },
      { start: "17:45", len: 15, state: "booked" },
      { start: "18:00", len: 15, state: "free" },
      { start: "18:15", len: 15, state: "free" },
      { start: "18:30", len: 15, state: "booked" },
      { start: "18:45", len: 15, state: "free" },
    ],
  },
];

const cellClass: Record<Cell["state"], string> = {
  free: "bg-neem-500/35 border border-neem-300/60",
  booked: "bg-stone-700 text-stone-500 hatch",
  selected: "bg-haldi-400 -translate-y-[3px] shadow-2",
  past: "bg-stone-700/40",
};

export function RibbonMotif({ className }: { className?: string }) {
  const minuteWidth = 100 / 120; // both blocks span 120 minutes in this illustration
  return (
    <div className={cn("flex flex-col gap-6", className)} aria-hidden>
      {BLOCKS.map((b) => (
        <div key={b.label} className="flex flex-col gap-2">
          <span className="text-small font-semibold text-stone-300">{b.label}</span>
          <div className="flex gap-[1.5px]">
            {b.cells.map((c) => (
              <div
                key={c.start}
                className={cn("h-10 shrink-0 rounded-md transition-transform", cellClass[c.state])}
                style={{ width: `calc(${c.len * minuteWidth}% - 1.5px)` }}
              />
            ))}
          </div>
          <div className="flex justify-between font-medium text-caption text-stone-400 tabular">
            {b.cells
              .filter((_, i) => i % (b.cells[0].len === 10 ? 3 : 2) === 0)
              .map((c) => (
                <span key={c.start}>{c.start}</span>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}

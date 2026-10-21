import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatLongDate, formatMonth, monthGrid, shiftMonth } from "@/lib/calendar";
import { cn } from "@/lib/cn";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export interface DayInfo {
  count?: number;
  marked?: boolean;
  disabled?: boolean;
}

interface MonthCalendarProps {
  year: number;
  month: number;
  today: string;
  selected: string;
  onSelect: (date: string) => void;
  onMonthChange: (view: { year: number; month: number }) => void;
  dayInfo: (date: string) => DayInfo;
  countLabel: string;
  markLabel?: string;
}

export function MonthCalendar({
  year,
  month,
  today,
  selected,
  onSelect,
  onMonthChange,
  dayInfo,
  countLabel,
  markLabel,
}: MonthCalendarProps) {
  const days = monthGrid(year, month);
  const monthPrefix = `${year}-${String(month + 1).padStart(2, "0")}`;

  function goToToday() {
    onSelect(today);
    onMonthChange({ year: Number(today.slice(0, 4)), month: Number(today.slice(5, 7)) - 1 });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-h3 font-semibold">{formatMonth(year, month)}</h2>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" onClick={goToToday}>
            Today
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Previous month"
            onClick={() => onMonthChange(shiftMonth(year, month, -1))}
          >
            <ChevronLeft aria-hidden />
          </Button>
          <Button variant="ghost" size="icon-sm" aria-label="Next month" onClick={() => onMonthChange(shiftMonth(year, month, 1))}>
            <ChevronRight aria-hidden />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {WEEKDAYS.map((d) => (
          <span key={d} className="pb-1 text-center text-caption font-semibold uppercase tracking-wide text-subtle">
            {d}
          </span>
        ))}

        {days.map((date) => {
          const { count = 0, marked = false, disabled = false } = dayInfo(date);
          const isSelected = date === selected;
          const label = [formatLongDate(date), count > 0 && `${count} ${countLabel.toLowerCase()}`]
            .filter(Boolean)
            .join(", ");

          return (
            <button
              key={date}
              type="button"
              aria-label={label}
              aria-pressed={isSelected}
              disabled={disabled}
              onClick={() => onSelect(date)}
              className={cn(
                "flex h-20 flex-col justify-between rounded-md border p-2 text-left transition-colors",
                isSelected ? "border-primary bg-primary-soft" : "border-border bg-surface hover:border-border-strong",
                (disabled || !date.startsWith(monthPrefix)) && "opacity-45",
                disabled && "cursor-not-allowed hover:border-border",
              )}
            >
              <span
                className={cn(
                  "flex size-7 items-center justify-center rounded-full text-small font-semibold",
                  date === today && "bg-primary text-on-primary",
                )}
              >
                {Number(date.slice(8))}
              </span>
              <span className="flex items-center gap-1">
                {marked && <span className="h-1.5 w-5 rounded-full bg-primary/60" />}
                {count > 0 && (
                  <span className="rounded-full bg-info-soft px-1.5 text-caption font-semibold text-info">{count}</span>
                )}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-x-5 gap-y-2 text-caption text-muted">
        {markLabel && (
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-5 rounded-full bg-primary/60" /> {markLabel}
          </span>
        )}
        <span className="flex items-center gap-1.5">
          <span className="rounded-full bg-info-soft px-1.5 font-semibold text-info">2</span> {countLabel}
        </span>
      </div>
    </div>
  );
}

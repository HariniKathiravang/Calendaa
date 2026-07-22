import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { CATEGORY_META, type AcademicEvent } from "@/lib/calendar/types";
import { cn } from "@/lib/utils";

interface Props {
  currentDate: Date;
  events: AcademicEvent[];
  onEventClick: (e: AcademicEvent) => void;
  onDayClick: (d: Date) => void;
}

export function MonthView({ currentDate, events, onEventClick, onDayClick }: Props) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });
  const today = new Date();

  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="animate-fade-in overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
      <div className="grid grid-cols-7 border-b border-border bg-muted/30">
        {dayLabels.map((d) => (
          <div
            key={d}
            className="px-3 py-2.5 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground"
          >
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 auto-rows-fr">
        {days.map((day) => {
          const dayEvents = events.filter((e) => isSameDay(new Date(e.startDate + "T00:00:00"), day));
          const inMonth = isSameMonth(day, currentDate);
          const isToday = isSameDay(day, today);
          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => onDayClick(day)}
              className={cn(
                "group relative flex min-h-[110px] flex-col gap-1 border-b border-r border-border p-2 text-left transition-colors hover:bg-primary/[0.03]",
                !inMonth && "bg-muted/20 text-muted-foreground/60",
              )}
            >
              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    "inline-flex h-7 min-w-7 items-center justify-center rounded-full px-2 text-sm font-medium",
                    isToday && "bg-primary text-primary-foreground shadow-sm",
                    !isToday && inMonth && "text-foreground",
                  )}
                >
                  {format(day, "d")}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                {dayEvents.slice(0, 3).map((ev) => {
                  const meta = CATEGORY_META[ev.category];
                  return (
                    <span
                      key={ev.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick(ev);
                      }}
                      className={cn(
                        "flex items-center gap-1.5 truncate rounded-md border px-2 py-1 text-xs font-medium transition-transform hover:scale-[1.02]",
                        meta.color,
                      )}
                    >
                      <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", meta.dot)} />
                      <span className="truncate">
                        {ev.startTime} {ev.title}
                      </span>
                    </span>
                  );
                })}
                {dayEvents.length > 3 && (
                  <span className="pl-1 text-[11px] font-medium text-muted-foreground">
                    +{dayEvents.length - 3} more
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
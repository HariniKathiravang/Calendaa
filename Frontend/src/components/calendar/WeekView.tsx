import {
  eachDayOfInterval,
  endOfWeek,
  format,
  isSameDay,
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

export function WeekView({ currentDate, events, onEventClick, onDayClick }: Props) {
  const start = startOfWeek(currentDate, { weekStartsOn: 0 });
  const end = endOfWeek(currentDate, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start, end });
  const today = new Date();

  return (
    <div className="animate-fade-in overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const isToday = isSameDay(day, today);
          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => onDayClick(day)}
              className="flex flex-col items-center gap-1 border-b border-r border-border py-3 text-center transition-colors hover:bg-primary/[0.03]"
            >
              <span className="text-xs uppercase tracking-wider text-muted-foreground">
                {format(day, "EEE")}
              </span>
              <span
                className={cn(
                  "inline-flex h-9 min-w-9 items-center justify-center rounded-full px-2 text-base font-semibold",
                  isToday && "bg-primary text-primary-foreground shadow-sm",
                )}
              >
                {format(day, "d")}
              </span>
            </button>
          );
        })}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const dayEvents = events
            .filter((e) => isSameDay(new Date(e.date), day))
            .sort((a, b) => a.startTime.localeCompare(b.startTime));
          return (
            <div
              key={day.toISOString()}
              className="flex min-h-[420px] flex-col gap-2 border-r border-border p-2"
            >
              {dayEvents.length === 0 && (
                <div className="mt-6 text-center text-xs text-muted-foreground/70">No events</div>
              )}
              {dayEvents.map((ev) => {
                const meta = CATEGORY_META[ev.category];
                return (
                  <button
                    key={ev.id}
                    type="button"
                    onClick={() => onEventClick(ev)}
                    className={cn(
                      "flex flex-col gap-1 rounded-xl border p-2.5 text-left text-xs shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md",
                      meta.color,
                    )}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
                      <span className="font-semibold">
                        {ev.startTime}–{ev.endTime}
                      </span>
                    </div>
                    <span className="font-medium leading-snug">{ev.title}</span>
                    <span className="text-[11px] opacity-80">
                      {ev.department} · {ev.year}-{ev.section}
                    </span>
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
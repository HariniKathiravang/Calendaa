import {
  eachDayOfInterval,
  endOfWeek,
  format,
  isSameDay,
  startOfWeek,
} from "date-fns";
import { CATEGORY_META, type AcademicEvent } from "@/lib/calendar/types";
import { cn } from "@/lib/utils";
import { MapPin, Clock } from "lucide-react";

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
    <div className="animate-fade-in flex flex-col gap-3">
      {days.map((day) => {
        const isToday = isSameDay(day, today);
        const dayEvents = events
          .filter((e) => isSameDay(new Date(e.startDate + "T00:00:00"), day))
          .sort((a, b) => a.startTime.localeCompare(b.startTime));

        return (
          <div
            key={day.toISOString()}
            className={cn(
              "overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-200",
              isToday && "border-primary/30 bg-primary/[0.03]",
            )}
          >
            <div className="flex min-h-[72px] items-stretch">
              {/* ── Day label ───────────────────────────────────── */}
              <button
                type="button"
                onClick={() => onDayClick(day)}
                className={cn(
                  "flex w-20 shrink-0 flex-col items-center justify-center gap-0.5 border-r border-border py-4 transition-colors hover:bg-primary/[0.05] md:w-24",
                  isToday && "border-primary/20",
                )}
              >
                <span
                  className={cn(
                    "text-[11px] font-semibold uppercase tracking-widest",
                    isToday ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  {format(day, "EEE")}
                </span>
                <span
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-full text-lg font-bold transition-colors",
                    isToday
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-foreground hover:bg-accent",
                  )}
                >
                  {format(day, "d")}
                </span>
                <span
                  className={cn(
                    "text-[10px]",
                    isToday ? "text-primary/70" : "text-muted-foreground/60",
                  )}
                >
                  {format(day, "MMM")}
                </span>
              </button>

              {/* ── Events area ─────────────────────────────────── */}
              <div className="flex flex-1 flex-col justify-center gap-2 p-3">
                {dayEvents.length === 0 ? (
                  <p className="py-2 text-sm text-muted-foreground/50 italic">No events</p>
                ) : (
                  dayEvents.map((ev) => {
                    const meta = CATEGORY_META[ev.category];
                    return (
                      <button
                        key={ev.id}
                        type="button"
                        onClick={() => onEventClick(ev)}
                        className={cn(
                          "group flex w-full items-start gap-3 rounded-xl border px-3 py-2.5 text-left transition-all duration-150",
                          "hover:-translate-y-0.5 hover:shadow-md active:scale-[0.99]",
                          meta.color,
                        )}
                      >
                        {/* colour dot */}
                        <span
                          className={cn(
                            "mt-1 h-2 w-2 shrink-0 rounded-full",
                            meta.dot,
                          )}
                        />
                        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                          <span className="truncate text-sm font-semibold leading-snug">
                            {ev.title}
                          </span>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
                            <span className="flex items-center gap-1 text-xs opacity-75">
                              <Clock className="h-3 w-3 shrink-0" />
                              {ev.startTime}–{ev.endTime}
                            </span>
                            {ev.venue && (
                              <span className="flex items-center gap-1 text-xs opacity-75">
                                <MapPin className="h-3 w-3 shrink-0" />
                                <span className="truncate max-w-[160px]">{ev.venue}</span>
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] opacity-60">
                            {ev.department} · {ev.year}-{ev.section}
                          </span>
                        </div>
                        {/* category badge */}
                        <span className="shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide opacity-70">
                          {meta.label}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
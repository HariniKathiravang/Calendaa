import { format, isSameDay } from "date-fns";
import { Clock, MapPin, Users, Layers, GraduationCap } from "lucide-react";
import { CATEGORY_META, type AcademicEvent } from "@/lib/calendar/types";
import { cn } from "@/lib/utils";

interface Props {
  currentDate: Date;
  events: AcademicEvent[];
  onEventClick: (e: AcademicEvent) => void;
}

export function DayView({ currentDate, events, onEventClick }: Props) {
  const dayEvents = events
    .filter((e) => isSameDay(new Date(e.date), currentDate))
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <div className="animate-fade-in">
      <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            {format(currentDate, "EEEE")}
          </h2>
          <p className="text-sm text-muted-foreground">{format(currentDate, "MMMM d, yyyy")}</p>
        </div>
        <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
          {dayEvents.length} {dayEvents.length === 1 ? "event" : "events"}
        </span>
      </div>

      {dayEvents.length === 0 ? (
        <div className="flex min-h-[280px] flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card/50 p-10 text-center">
          <div className="rounded-2xl bg-muted p-4">
            <Clock className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-base font-medium text-foreground">Nothing scheduled</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            There are no events matching your filters for this day.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {dayEvents.map((ev) => {
            const meta = CATEGORY_META[ev.category];
            return (
              <button
                key={ev.id}
                type="button"
                onClick={() => onEventClick(ev)}
                className="group flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className={cn("mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full", meta.dot)} />
                    <div>
                      <h3 className="text-base font-semibold text-foreground">{ev.title}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{ev.description}</p>
                    </div>
                  </div>
                  <span
                    className={cn(
                      "rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
                      meta.color,
                    )}
                  >
                    {meta.label}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground md:grid-cols-4">
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    {ev.startTime} – {ev.endTime}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" />
                    {ev.venue}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5" />
                    {ev.department}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <GraduationCap className="h-3.5 w-3.5" />
                    Year {ev.year} · Sec {ev.section}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
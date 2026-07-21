import { useCallback, useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CATEGORY_META,
  DEPARTMENTS,
  SECTIONS,
  YEARS,
  type AcademicEvent,
  type EventCategory,
} from "@/lib/calendar/types";
import { useCalendar } from "@/lib/calendar/store";
import { format } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Upload,
  FileText,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import type { ApiEvent } from "@/lib/calendar/api";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: AcademicEvent | null;
  defaultDate?: Date;
}

type Draft = Omit<AcademicEvent, "id">;

const empty = (date: Date): Draft => ({
  title: "",
  description: "",
  date: format(date, "yyyy-MM-dd"),
  startTime: "09:00",
  endTime: "10:00",
  venue: "",
  department: "CSE",
  year: "I",
  section: "A",
  category: "lecture",
});

// ── Admin: step type ───────────────────────────────────────────────────────
type AdminStep = "choose" | "review" | "preview";

// ── Placeholder JSON shown in the textarea ─────────────────────────────────
const PLACEHOLDER_JSON = `[
  {
    "title": "Operating Systems Lecture",
    "description": "Introduction to process scheduling",
    "date": "2026-08-01",
    "startTime": "09:00",
    "endTime": "10:00",
    "venue": "Hall A",
    "department": "CSE",
    "year": "II",
    "section": "A",
    "category": "lecture"
  }
]`;

// ────────────────────────────────────────────────────────────────────────────
export function EventFormDialog({ open, onOpenChange, initial, defaultDate }: Props) {
  const { addEvent, updateEvent, user, bulkImportEvents } = useCalendar();
  const [draft, setDraft] = useState<Draft>(() => empty(defaultDate ?? new Date()));
  const [submitting, setSubmitting] = useState(false);

  // Admin-only state
  const [adminStep, setAdminStep] = useState<AdminStep>("choose");
  const [manualMode, setManualMode] = useState(false);
  const [jsonText, setJsonText] = useState("");
  const [parsedEvents, setParsedEvents] = useState<Omit<ApiEvent, "id">[] | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [droppedFile, setDroppedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAdmin = user?.role === "admin";
  const isHod = user?.role === "hod";

  // Reset on open/close
  useEffect(() => {
    if (!open) {
      setAdminStep("choose");
      setManualMode(false);
      setJsonText("");
      setParsedEvents(null);
      setParseError(null);
      setDragOver(false);
      setDroppedFile(null);
      return;
    }
    if (initial) {
      const { id: _id, ...rest } = initial;
      setDraft(rest);
    } else {
      const d = empty(defaultDate ?? new Date());
      if (isHod && user?.department) d.department = user.department;
      setDraft(d);
    }
  }, [open, initial, defaultDate, isHod, user]);

  // ── Manual form submit ────────────────────────────────────────────────────
  const submit = async () => {
    if (!draft.title.trim()) {
      toast.error("Please enter a title");
      return;
    }
    setSubmitting(true);
    try {
      if (initial) {
        await updateEvent({ ...draft, id: initial.id });
        toast.success("Event updated");
      } else {
        await addEvent(draft);
        toast.success("Event created");
      }
      onOpenChange(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save event";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // ── JSON parse ────────────────────────────────────────────────────────────
  const parseJson = () => {
    setParseError(null);
    try {
      const parsed = JSON.parse(jsonText) as unknown;
      if (!Array.isArray(parsed) || parsed.length === 0) {
        setParseError("Expected a non-empty JSON array of events.");
        return;
      }
      // Validate required fields
      for (const [i, ev] of parsed.entries()) {
        if (typeof ev !== "object" || ev === null) {
          setParseError(`Item ${i + 1} is not an object.`);
          return;
        }
        for (const field of ["title", "date", "startTime", "endTime", "department", "year", "section"]) {
          if (!ev[field]) {
            setParseError(`Item ${i + 1} is missing required field: "${field}".`);
            return;
          }
        }
      }
      setParsedEvents(parsed as Omit<ApiEvent, "id">[]);
      setAdminStep("preview");
    } catch (e: unknown) {
      setParseError(e instanceof Error ? e.message : "Invalid JSON");
    }
  };

  // ── Bulk import submit ────────────────────────────────────────────────────
  const submitBulk = async () => {
    if (!parsedEvents) return;
    setSubmitting(true);
    try {
      await bulkImportEvents(parsedEvents);
      toast.success(`${parsedEvents.length} event${parsedEvents.length !== 1 ? "s" : ""} imported successfully`);
      onOpenChange(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Import failed";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Drag & drop ───────────────────────────────────────────────────────────
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      setDroppedFile(file);
      setAdminStep("review");
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setDroppedFile(file);
      setAdminStep("review");
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  // HOD or editing existing or admin chose manual → show form directly
  const showFormDirectly = !isAdmin || !!initial || manualMode;

  if (showFormDirectly) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{initial ? "Edit event" : "New event"}</DialogTitle>
            <DialogDescription>
              {initial ? "Update the details for this event." : "Fill in the details to create a new event."}
            </DialogDescription>
          </DialogHeader>
          <ManualForm draft={draft} setDraft={setDraft} isHod={isHod} />
          <DialogFooter>
            {manualMode && (
              <Button
                variant="outline"
                onClick={() => setManualMode(false)}
                className="rounded-full mr-auto"
              >
                Back
              </Button>
            )}
            <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-full">
              Cancel
            </Button>
            <Button onClick={submit} className="rounded-full" disabled={submitting}>
              {submitting ? "Saving…" : initial ? "Save changes" : "Create event"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // ── Admin: Step 1 — Choose ───────────────────────────────────────────────
  if (adminStep === "choose") {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Events</DialogTitle>
            <DialogDescription>
              Choose how you'd like to create events.
            </DialogDescription>
          </DialogHeader>

          {/* PDF Upload (primary) */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={cn(
              "relative flex cursor-pointer flex-col items-center gap-3 rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-200",
              dragOver
                ? "border-primary bg-primary/10 scale-[1.02]"
                : "border-border bg-muted/30 hover:border-primary/50 hover:bg-muted/50",
            )}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={handleFileInput}
            />
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <Upload className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Upload PDF</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Drag & drop or click to select a timetable PDF
              </p>
            </div>
            <span className="rounded-full bg-primary/10 px-3 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-primary">
              Recommended
            </span>
          </div>

          {/* OR divider */}
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs font-medium text-muted-foreground">OR</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          {/* Manual create (secondary) */}
          <button
            type="button"
            onClick={() => setAdminStep("review")}
            className="flex w-full items-center justify-between rounded-2xl border border-border bg-background px-5 py-4 text-left transition-all hover:border-primary/40 hover:bg-muted/40 hover:shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-muted">
                <FileText className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-semibold">Paste LLM JSON</p>
                <p className="text-xs text-muted-foreground">Paste the JSON output from your LLM</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs font-medium text-muted-foreground">OR</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <button
            type="button"
            onClick={() => setManualMode(true)}
            className="flex w-full items-center justify-between rounded-2xl border border-border bg-background px-5 py-4 text-left transition-all hover:border-primary/40 hover:bg-muted/40 hover:shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-muted">
                <FileText className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-semibold">Create Event Manually</p>
                <p className="text-xs text-muted-foreground">Fill in the event details yourself</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        </DialogContent>
      </Dialog>
    );
  }

  // ── Admin: Step 2 — Review JSON ──────────────────────────────────────────
  if (adminStep === "review") {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {droppedFile ? (
                <>
                  <FileText className="h-5 w-5 text-primary" />
                  {droppedFile.name}
                </>
              ) : (
                "Paste LLM JSON"
              )}
            </DialogTitle>
            <DialogDescription>
              Paste the JSON array output from your LLM below, then click "Preview Events" to review before importing.
            </DialogDescription>
          </DialogHeader>

          {droppedFile && (
            <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>
                PDF uploaded: <strong>{droppedFile.name}</strong>. Paste the LLM JSON output below after processing.
              </span>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Label className="text-xs font-medium text-muted-foreground">
              JSON Array of Events
            </Label>
            <Textarea
              className="min-h-[260px] rounded-xl font-mono text-xs"
              placeholder={PLACEHOLDER_JSON}
              value={jsonText}
              onChange={(e) => { setJsonText(e.target.value); setParseError(null); }}
            />
            {parseError && (
              <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>{parseError}</span>
              </div>
            )}
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              onClick={() => { setAdminStep("choose"); setDroppedFile(null); setParseError(null); }}
              className="rounded-full"
            >
              Back
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setAdminStep("choose");
                setDroppedFile(null);
                setJsonText("");
                setParseError(null);
              }}
              className="rounded-full sm:ml-auto"
            >
              Create Manually Instead
            </Button>
            <Button
              onClick={parseJson}
              className="rounded-full"
              disabled={!jsonText.trim()}
            >
              Preview Events
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // ── Admin: Step 3 — Preview & Import ────────────────────────────────────
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            Preview {parsedEvents?.length ?? 0} Events
          </DialogTitle>
          <DialogDescription>
            Review the events below before importing them into the calendar.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2 max-h-[50vh] overflow-y-auto pr-1">
          {parsedEvents?.map((ev, i) => {
            const meta = CATEGORY_META[ev.category as EventCategory] ?? CATEGORY_META.event;
            return (
              <div
                key={i}
                className={cn(
                  "flex items-start gap-3 rounded-xl border px-4 py-3",
                  meta.color,
                )}
              >
                <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", meta.dot)} />
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <p className="text-sm font-semibold">{ev.title}</p>
                  <p className="text-xs opacity-75">
                    {ev.date} · {ev.startTime}–{ev.endTime}
                    {ev.venue ? ` · ${ev.venue}` : ""}
                  </p>
                  <p className="text-xs opacity-60">
                    {ev.department} · Year {ev.year} · Section {ev.section}
                  </p>
                </div>
                <span className="shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide opacity-70">
                  {meta.label}
                </span>
              </div>
            );
          })}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            onClick={() => setAdminStep("review")}
            className="rounded-full"
          >
            Back
          </Button>
          <Button
            onClick={submitBulk}
            className="rounded-full"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Importing…
              </>
            ) : (
              <>Import {parsedEvents?.length} Event{(parsedEvents?.length ?? 0) !== 1 ? "s" : ""}</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Manual event form ────────────────────────────────────────────────────────
function ManualForm({
  draft,
  setDraft,
  isHod,
}: {
  draft: Omit<AcademicEvent, "id">;
  setDraft: (d: Omit<AcademicEvent, "id">) => void;
  isHod: boolean;
}) {
  return (
    <div className="flex flex-col gap-4">
      <Field label="Title">
        <Input
          value={draft.title}
          onChange={(e) => setDraft({ ...draft, title: e.target.value })}
          placeholder="Event title"
          className="rounded-xl"
        />
      </Field>
      <Field label="Description">
        <Textarea
          value={draft.description}
          onChange={(e) => setDraft({ ...draft, description: e.target.value })}
          rows={3}
          className="rounded-xl"
          placeholder="Short description"
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Date">
          <Input
            type="date"
            value={draft.date}
            onChange={(e) => setDraft({ ...draft, date: e.target.value })}
            className="rounded-xl"
          />
        </Field>
        <Field label="Category">
          <Select
            value={draft.category}
            onValueChange={(v) => setDraft({ ...draft, category: v as EventCategory })}
          >
            <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>
              {(Object.keys(CATEGORY_META) as EventCategory[]).map((c) => (
                <SelectItem key={c} value={c}>{CATEGORY_META[c].label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Start time">
          <Input
            type="time"
            value={draft.startTime}
            onChange={(e) => setDraft({ ...draft, startTime: e.target.value })}
            className="rounded-xl"
          />
        </Field>
        <Field label="End time">
          <Input
            type="time"
            value={draft.endTime}
            onChange={(e) => setDraft({ ...draft, endTime: e.target.value })}
            className="rounded-xl"
          />
        </Field>
      </div>
      <Field label="Venue">
        <Input
          value={draft.venue}
          onChange={(e) => setDraft({ ...draft, venue: e.target.value })}
          placeholder="Room / hall"
          className="rounded-xl"
        />
      </Field>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Department">
          <Select
            value={draft.department}
            onValueChange={(v) => setDraft({ ...draft, department: v })}
            disabled={isHod}
          >
            <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>
              {DEPARTMENTS.map((d) => (
                <SelectItem key={d} value={d}>{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Year">
          <Select value={draft.year} onValueChange={(v) => setDraft({ ...draft, year: v })}>
            <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>
              {YEARS.map((y) => (
                <SelectItem key={y} value={y}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Section">
          <Select value={draft.section} onValueChange={(v) => setDraft({ ...draft, section: v })}>
            <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>
              {SECTIONS.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
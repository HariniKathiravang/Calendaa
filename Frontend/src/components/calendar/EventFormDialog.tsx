import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

export function EventFormDialog({ open, onOpenChange, initial, defaultDate }: Props) {
  const { addEvent, updateEvent, user } = useCalendar();
  const [draft, setDraft] = useState<Draft>(() => empty(defaultDate ?? new Date()));

  useEffect(() => {
    if (!open) return;
    if (initial) {
      const { id: _id, ...rest } = initial;
      setDraft(rest);
    } else {
      const d = empty(defaultDate ?? new Date());
      if (user?.role === "hod" && user.department) d.department = user.department;
      setDraft(d);
    }
  }, [open, initial, defaultDate, user]);

  const isHod = user?.role === "hod";

  const [submitting, setSubmitting] = useState(false);

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit event" : "New event"}</DialogTitle>
          <DialogDescription>
            {initial ? "Update the details for this event." : "Fill in the details to create a new event."}
          </DialogDescription>
        </DialogHeader>
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
        <DialogFooter>
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
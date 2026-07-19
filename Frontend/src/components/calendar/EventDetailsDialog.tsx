import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Clock, MapPin, Layers, GraduationCap, Pencil, Trash2 } from "lucide-react";
import { CATEGORY_META, type AcademicEvent } from "@/lib/calendar/types";
import { canEditEvent, useCalendar } from "@/lib/calendar/store";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface Props {
  event: AcademicEvent | null;
  onOpenChange: (v: boolean) => void;
  onEdit: (e: AcademicEvent) => void;
  onDelete: (e: AcademicEvent) => void;
}

export function EventDetailsDialog({ event, onOpenChange, onEdit, onDelete }: Props) {
  const { user } = useCalendar();
  const open = !!event;
  if (!event) return null;
  const meta = CATEGORY_META[event.category];
  const canEdit = canEditEvent(user, event);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className={cn("h-2.5 w-2.5 rounded-full", meta.dot)} />
            <span
              className={cn("rounded-full border px-2.5 py-0.5 text-[11px] font-medium", meta.color)}
            >
              {meta.label}
            </span>
          </div>
          <DialogTitle className="mt-2 text-xl">{event.title}</DialogTitle>
          <p className="text-sm text-muted-foreground">
            {format(new Date(event.date), "EEEE, MMMM d, yyyy")}
          </p>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <InfoRow icon={<Clock className="h-4 w-4" />} label={`${event.startTime} – ${event.endTime}`} />
          <InfoRow icon={<MapPin className="h-4 w-4" />} label={event.venue} />
          <InfoRow icon={<Layers className="h-4 w-4" />} label={event.department} />
          <InfoRow
            icon={<GraduationCap className="h-4 w-4" />}
            label={`Year ${event.year} · Section ${event.section}`}
          />
        </div>
        <p className="text-sm leading-relaxed text-foreground">{event.description}</p>
        {canEdit && (
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => onDelete(event)}
              className="rounded-full text-destructive hover:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
            <Button onClick={() => onEdit(event)} className="rounded-full">
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

function InfoRow({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl bg-muted/50 px-3 py-2 text-sm">
      <span className="text-muted-foreground">{icon}</span>
      <span className="truncate">{label}</span>
    </div>
  );
}
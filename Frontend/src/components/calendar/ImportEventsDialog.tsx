import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCalendar } from "@/lib/calendar/store";
import type { ApiEvent } from "@/lib/calendar/api";
import { toast } from "sonner";
import { Upload, Loader2, Trash2, Plus } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function ImportEventsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { extractEventsFromPdf, bulkImportEvents } = useCalendar();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState<Omit<ApiEvent, "id">[]>([]);
  const [step, setStep] = useState<"upload" | "verify">("upload");

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const extracted = await extractEventsFromPdf(file);
      setEvents(extracted);
      setStep("verify");
      toast.success("Events extracted successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to extract events");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await bulkImportEvents(events);
      toast.success("Events saved to calendar");
      handleClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to save events");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setEvents([]);
    setStep("upload");
    onOpenChange(false);
  };

  const updateEvent = (index: number, field: keyof Omit<ApiEvent, "id">, value: string) => {
    const newEvents = [...events];
    newEvents[index] = { ...newEvents[index], [field]: value };
    setEvents(newEvents);
  };

  const removeEvent = (index: number) => {
    setEvents(events.filter((_, i) => i !== index));
  };

  const addEmptyEvent = () => {
    setEvents([
      ...events,
      {
        title: "New Event",
        description: "",
        startDate: new Date().toISOString().split("T")[0],
        endDate: "",
        startTime: "",
        endTime: "",
        venue: "",
        department: "all",
        year: "all",
        semester: "",
        section: "all",
        category: "event",
        isLlm: false,
      },
    ]);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Events from PDF</DialogTitle>
        </DialogHeader>

        {step === "upload" && (
          <div className="flex flex-col items-center justify-center space-y-6 py-10">
            <div className="flex flex-col items-center gap-4">
              <Upload className="h-12 w-12 text-muted-foreground" />
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Input
                  id="pdf"
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
              </div>
            </div>
            <Button disabled={!file || loading} onClick={handleUpload} className="w-48">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Extract Events"}
            </Button>
          </div>
        )}

        {step === "verify" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">Review and edit the extracted events below.</p>
              <Button variant="outline" size="sm" onClick={addEmptyEvent}>
                <Plus className="h-4 w-4 mr-2" /> Add Row
              </Button>
            </div>

            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Start</TableHead>
                    <TableHead>End</TableHead>
                    <TableHead>Venue</TableHead>
                    <TableHead>Dept</TableHead>
                    <TableHead>Year</TableHead>
                    <TableHead>Sem</TableHead>
                    <TableHead>Sec</TableHead>
                    <TableHead>Cat</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.map((ev, i) => (
                    <TableRow key={i}>
                      <TableCell><Input value={ev.title} onChange={(e) => updateEvent(i, "title", e.target.value)} className="w-32 h-8 text-xs" /></TableCell>
                      <TableCell><Input type="date" value={ev.startDate} onChange={(e) => updateEvent(i, "startDate", e.target.value)} className="w-32 h-8 text-xs" /></TableCell>
                      <TableCell><Input type="date" value={ev.endDate || ""} onChange={(e) => updateEvent(i, "endDate", e.target.value)} className="w-32 h-8 text-xs" /></TableCell>
                      <TableCell><Input type="time" value={ev.startTime || ""} onChange={(e) => updateEvent(i, "startTime", e.target.value)} className="w-24 h-8 text-xs" /></TableCell>
                      <TableCell><Input type="time" value={ev.endTime || ""} onChange={(e) => updateEvent(i, "endTime", e.target.value)} className="w-24 h-8 text-xs" /></TableCell>
                      <TableCell><Input value={ev.venue} onChange={(e) => updateEvent(i, "venue", e.target.value)} className="w-24 h-8 text-xs" /></TableCell>
                      <TableCell><Input value={ev.department} onChange={(e) => updateEvent(i, "department", e.target.value)} className="w-16 h-8 text-xs" /></TableCell>
                      <TableCell><Input value={ev.year} onChange={(e) => updateEvent(i, "year", e.target.value)} className="w-12 h-8 text-xs" /></TableCell>
                      <TableCell><Input value={ev.semester || ""} onChange={(e) => updateEvent(i, "semester", e.target.value)} className="w-12 h-8 text-xs" /></TableCell>
                      <TableCell><Input value={ev.section} onChange={(e) => updateEvent(i, "section", e.target.value)} className="w-12 h-8 text-xs" /></TableCell>
                      <TableCell>
                        <Select value={ev.category} onValueChange={(v) => updateEvent(i, "category", v)}>
                          <SelectTrigger className="w-24 h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="lecture">Lecture</SelectItem>
                            <SelectItem value="exam">Exam</SelectItem>
                            <SelectItem value="event">Event</SelectItem>
                            <SelectItem value="holiday">Holiday</SelectItem>
                            <SelectItem value="meeting">Meeting</SelectItem>
                            <SelectItem value="workshop">Workshop</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => removeEvent(i)} className="text-destructive h-8 w-8">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {events.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-4 text-muted-foreground">
                        No events found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={handleClose}>Cancel</Button>
              <Button onClick={handleSave} disabled={loading || events.length === 0}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirm & Save
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

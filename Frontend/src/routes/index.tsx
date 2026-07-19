import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { addDays, addMonths, addWeeks } from "date-fns";
import { Plus } from "lucide-react";

import { CalendarHeader, type CalendarView } from "@/components/calendar/CalendarHeader";
import { MonthView } from "@/components/calendar/MonthView";
import { WeekView } from "@/components/calendar/WeekView";
import { DayView } from "@/components/calendar/DayView";
import { FilterDrawer } from "@/components/calendar/FilterDrawer";
import { EventDetailsDialog } from "@/components/calendar/EventDetailsDialog";
import { EventFormDialog } from "@/components/calendar/EventFormDialog";
import { UserMenu } from "@/components/calendar/UserMenu";
import { CalendarProvider, canCreate, canEditEvent, useCalendar } from "@/lib/calendar/store";
import type { AcademicEvent } from "@/lib/calendar/types";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Academic Calendar — Plan every lecture, exam and event" },
      {
        name: "description",
        content:
          "A clean, modern academic calendar for departments — browse lectures, exams, workshops and events by month, week or day.",
      },
      { property: "og:title", content: "Academic Calendar" },
      {
        property: "og:description",
        content: "Plan and browse academic events across departments, years and sections.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <CalendarProvider>
      <CalendarPage />
    </CalendarProvider>
  );
}

function CalendarPage() {
  const { filters, setFilters, filteredEvents, user, deleteEvent } = useCalendar();
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [view, setView] = useState<CalendarView>("month");
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<AcademicEvent | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AcademicEvent | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<AcademicEvent | null>(null);

  const handlePrev = () => {
    if (view === "month") setCurrentDate((d) => addMonths(d, -1));
    else if (view === "week") setCurrentDate((d) => addWeeks(d, -1));
    else setCurrentDate((d) => addDays(d, -1));
  };
  const handleNext = () => {
    if (view === "month") setCurrentDate((d) => addMonths(d, 1));
    else if (view === "week") setCurrentDate((d) => addWeeks(d, 1));
    else setCurrentDate((d) => addDays(d, 1));
  };

  const activeFilterCount =
    (filters.department !== "all" ? 1 : 0) +
    (filters.year !== "all" ? 1 : 0) +
    (filters.section !== "all" ? 1 : 0);

  const openNew = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const handleEdit = (e: AcademicEvent) => {
    if (!canEditEvent(user, e)) {
      toast.error("You don't have permission to edit this event");
      return;
    }
    setSelectedEvent(null);
    setEditing(e);
    setFormOpen(true);
  };

  const handleDeleteRequest = (e: AcademicEvent) => {
    if (!canEditEvent(user, e)) return;
    setSelectedEvent(null);
    setConfirmDelete(e);
  };

  const confirmDeletion = async () => {
    if (confirmDelete) {
      try {
        await deleteEvent(confirmDelete.id);
        toast.success("Event deleted");
      } catch {
        toast.error("Failed to delete event");
      }
    }
    setConfirmDelete(null);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <CalendarHeader
        currentDate={currentDate}
        view={view}
        onViewChange={setView}
        onPrev={handlePrev}
        onNext={handleNext}
        onToday={() => setCurrentDate(new Date())}
        onOpenFilters={() => setFilterOpen(true)}
        search={filters.search}
        onSearchChange={(v) => setFilters({ ...filters, search: v })}
        userMenu={<UserMenu />}
        activeFilterCount={activeFilterCount}
      />

      <main className="mx-auto max-w-[1400px] px-4 py-6 md:px-6">
        {view === "month" && (
          <MonthView
            currentDate={currentDate}
            events={filteredEvents}
            onEventClick={setSelectedEvent}
            onDayClick={(d) => {
              setCurrentDate(d);
              setView("day");
            }}
          />
        )}
        {view === "week" && (
          <WeekView
            currentDate={currentDate}
            events={filteredEvents}
            onEventClick={setSelectedEvent}
            onDayClick={(d) => {
              setCurrentDate(d);
              setView("day");
            }}
          />
        )}
        {view === "day" && (
          <DayView
            currentDate={currentDate}
            events={filteredEvents}
            onEventClick={setSelectedEvent}
          />
        )}
      </main>

      {canCreate(user) && (
        <Button
          onClick={openNew}
          className="fixed bottom-6 right-6 z-40 h-14 rounded-full px-6 shadow-lg shadow-primary/25 transition-transform hover:scale-105"
          size="lg"
        >
          <Plus className="mr-2 h-5 w-5" />
          Add event
        </Button>
      )}

      <FilterDrawer
        open={filterOpen}
        onOpenChange={setFilterOpen}
        filters={filters}
        onChange={setFilters}
      />
      <EventDetailsDialog
        event={selectedEvent}
        onOpenChange={(o) => !o && setSelectedEvent(null)}
        onEdit={handleEdit}
        onDelete={handleDeleteRequest}
      />
      <EventFormDialog
        open={formOpen}
        onOpenChange={(o) => {
          setFormOpen(o);
          if (!o) setEditing(null);
        }}
        initial={editing}
        defaultDate={currentDate}
      />
      <AlertDialog
        open={!!confirmDelete}
        onOpenChange={(o) => !o && setConfirmDelete(null)}
      >
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this event?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove "{confirmDelete?.title}" from the calendar. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeletion}
              className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

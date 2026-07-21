import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { addDays, addMonths, addWeeks } from "date-fns";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";

import { CalendarHeader, type CalendarView } from "@/components/calendar/CalendarHeader";
import { MonthView } from "@/components/calendar/MonthView";
import { WeekView } from "@/components/calendar/WeekView";
import { DayView } from "@/components/calendar/DayView";
import { FilterDrawer } from "@/components/calendar/FilterDrawer";
import { EventDetailsDialog } from "@/components/calendar/EventDetailsDialog";
import { EventFormDialog } from "@/components/calendar/EventFormDialog";
import { ImportEventsDialog } from "@/components/calendar/ImportEventsDialog";
import { UserMenu } from "@/components/calendar/UserMenu";
import { CalendarProvider, canCreate, canEditEvent, useCalendar } from "@/lib/calendar/store";
import { FileText } from "lucide-react";
import { type AcademicEvent } from "@/lib/calendar/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
      <RootController />
    </CalendarProvider>
  );
}

function RootController() {
  const { user } = useCalendar();
  if (!user) return <LandingLogin />;
  return <CalendarPage />;
}

function LandingLogin() {
  const { login, departments } = useCalendar();
  const [busy, setBusy] = useState(false);

  // Student state
  const [department, setDepartment] = useState<string>("");
  const [passkey, setPasskey] = useState("");

  // Staff state
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleStudentLogin = async () => {
    if (!department) {
      toast.error("Please select your department");
      return;
    }
    if (!passkey) {
      toast.error("Please enter the passkey");
      return;
    }
    setBusy(true);
    try {
      await login("student", passkey, department);
      toast.success("Welcome to the Student Portal");
    } catch (err: any) {
      toast.error("Invalid passkey");
    } finally {
      setBusy(false);
    }
  };

  const handleStaffLogin = async () => {
    if (!username || !password) {
      toast.error("Please enter credentials");
      return;
    }
    setBusy(true);
    try {
      await login(username, password);
      toast.success("Signed in successfully");
    } catch (err: any) {
      toast.error("Invalid username or password");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f8fafc] px-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl shadow-primary/5">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
              <path d="M6 12v5c3 3 9 3 12 0v-5" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Academic Calendar</h1>
          <p className="mt-2 text-sm text-muted-foreground">Sign in to access schedules</p>
        </div>

        <Tabs defaultValue="student" className="w-full">
          <TabsList className="mb-6 grid w-full grid-cols-2 rounded-full">
            <TabsTrigger value="student" className="rounded-full">Student</TabsTrigger>
            <TabsTrigger value="staff" className="rounded-full">Staff</TabsTrigger>
          </TabsList>

          <TabsContent value="student" className="space-y-4">
            <div className="space-y-2">
              <Label>Department</Label>
              <Select value={department} onValueChange={setDepartment}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Select your department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Passkey</Label>
              <Input
                type="password"
                placeholder="Enter student passkey"
                value={passkey}
                onChange={(e) => setPasskey(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleStudentLogin()}
                className="rounded-xl"
              />
            </div>
            <Button
              className="w-full rounded-full"
              size="lg"
              onClick={handleStudentLogin}
              disabled={busy}
            >
              {busy ? "Entering..." : "Enter Portal"}
            </Button>
          </TabsContent>

          <TabsContent value="staff" className="space-y-4">
            <div className="space-y-2">
              <Label>Username</Label>
              <Input
                placeholder="Admin or HOD username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleStaffLogin()}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleStaffLogin()}
                className="rounded-xl"
              />
            </div>
            <Button
              className="w-full rounded-full"
              size="lg"
              onClick={handleStaffLogin}
              disabled={busy}
            >
              {busy ? "Signing in..." : "Sign In"}
            </Button>
          </TabsContent>
        </Tabs>
      </div>
    </div>
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
  const [importOpen, setImportOpen] = useState(false);


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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "ArrowLeft") handlePrev();
      else if (e.key === "ArrowRight") handleNext();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [view]);

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
        filters={filters}
      />

      <main className="mx-auto max-w-[1400px] px-4 py-6 md:px-6 relative group">
        <Button
          variant="outline"
          size="icon"
          className="absolute left-2 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-background/80 shadow-md backdrop-blur transition-all hover:scale-110 hover:bg-background md:flex"
          onClick={handlePrev}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="absolute right-2 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-background/80 shadow-md backdrop-blur transition-all hover:scale-110 hover:bg-background md:flex"
          onClick={handleNext}
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
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
        <div className="fixed bottom-6 right-6 z-40 flex flex-col gap-3">
          <Button
            onClick={() => setImportOpen(true)}
            className="h-12 rounded-full px-5 shadow-lg shadow-primary/25 transition-transform hover:scale-105"
            variant="secondary"
          >
            <FileText className="mr-2 h-4 w-4" />
            Import from PDF
          </Button>
          <Button
            onClick={openNew}
            className="h-14 rounded-full px-6 shadow-lg shadow-primary/25 transition-transform hover:scale-105"
            size="lg"
          >
            <Plus className="mr-2 h-5 w-5" />
            Add event
          </Button>
        </div>
      )}

      <ImportEventsDialog open={importOpen} onOpenChange={setImportOpen} />

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

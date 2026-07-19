import {
  createContext,
  useContext,
  useMemo,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import type { AcademicEvent, AuthUser, Filters } from "./types";
import {
  apiLogin,
  apiFetchEvents,
  apiCreateEvent,
  apiUpdateEvent,
  apiDeleteEvent,
  setToken,
  clearToken,
  getToken,
} from "./api";

interface CalendarStore {
  events: AcademicEvent[];
  loading: boolean;
  addEvent: (e: Omit<AcademicEvent, "id">) => Promise<void>;
  updateEvent: (e: AcademicEvent) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  filters: Filters;
  setFilters: (f: Filters) => void;
  user: AuthUser | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  filteredEvents: AcademicEvent[];
  refreshEvents: () => Promise<void>;
}

const CalendarCtx = createContext<CalendarStore | null>(null);

export function CalendarProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<AcademicEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>({
    department: "all",
    year: "all",
    section: "all",
    search: "",
  });
  const [user, setUser] = useState<AuthUser | null>(null);

  // Fetch all events from the backend
  const refreshEvents = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiFetchEvents();
      setEvents(data as AcademicEvent[]);
    } catch (err) {
      console.error("Failed to load events:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load events on mount
  useEffect(() => {
    refreshEvents();
  }, [refreshEvents]);

  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      if (filters.department !== "all" && e.department !== filters.department) return false;
      if (filters.year !== "all" && e.year !== filters.year) return false;
      if (filters.section !== "all" && e.section !== filters.section) return false;
      if (filters.search.trim()) {
        const q = filters.search.toLowerCase();
        if (
          !e.title.toLowerCase().includes(q) &&
          !e.description.toLowerCase().includes(q) &&
          !e.venue.toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [events, filters]);

  const login = useCallback(async (username: string, password: string) => {
    const res = await apiLogin(username, password);
    setToken(res.access_token);
    setUser({
      name: res.user.name,
      email: res.user.email,
      role: res.user.role,
      department: res.user.department,
    });
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
  }, []);

  const addEvent = useCallback(
    async (e: Omit<AcademicEvent, "id">) => {
      const created = await apiCreateEvent(e);
      setEvents((prev) => [...prev, created as AcademicEvent]);
    },
    [],
  );

  const updateEvent = useCallback(async (e: AcademicEvent) => {
    const { id, ...rest } = e;
    const updated = await apiUpdateEvent(id, rest);
    setEvents((prev) => prev.map((p) => (p.id === id ? (updated as AcademicEvent) : p)));
  }, []);

  const deleteEvent = useCallback(async (id: string) => {
    await apiDeleteEvent(id);
    setEvents((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const value: CalendarStore = {
    events,
    loading,
    filters,
    setFilters,
    user,
    filteredEvents,
    login,
    logout,
    addEvent,
    updateEvent,
    deleteEvent,
    refreshEvents,
  };

  return <CalendarCtx.Provider value={value}>{children}</CalendarCtx.Provider>;
}

export function useCalendar() {
  const ctx = useContext(CalendarCtx);
  if (!ctx) throw new Error("useCalendar must be used inside CalendarProvider");
  return ctx;
}

export function canEditEvent(user: AuthUser | null, event: AcademicEvent) {
  if (!user) return false;
  if (user.role === "admin") return true;
  if (user.role === "hod") return user.department === event.department;
  return false;
}

export function canCreate(user: AuthUser | null) {
  return user?.role === "admin" || user?.role === "hod";
}
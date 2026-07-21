import {
  createContext,
  useContext,
  useMemo,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import type { AcademicEvent, AuthUser, Filters, Role } from "./types";
import {
  apiLogin,
  apiFetchEvents,
  apiCreateEvent,
  apiUpdateEvent,
  apiDeleteEvent,
  apiMe,
  apiBulkImportEvents,
  apiFetchDepartments,
  setToken,
  clearToken,
  getToken,
  type ApiEvent,
} from "./api";

const FILTERS_STORAGE_KEY = "calendaa_filters";
const DEFAULT_FILTERS: Filters = {
  department: "all",
  year: "all",
  section: "all",
  search: "",
};

function loadSavedFilters(): Filters {
  if (typeof window === "undefined") return DEFAULT_FILTERS;
  try {
    const raw = localStorage.getItem(FILTERS_STORAGE_KEY);
    if (!raw) return DEFAULT_FILTERS;
    const parsed = JSON.parse(raw) as Partial<Filters>;
    return {
      department: typeof parsed.department === "string" ? parsed.department : "all",
      year: typeof parsed.year === "string" ? parsed.year : "all",
      section: typeof parsed.section === "string" ? parsed.section : "all",
      search: typeof parsed.search === "string" ? parsed.search : "",
    };
  } catch {
    return DEFAULT_FILTERS;
  }
}

function saveFilters(filters: Filters) {
  if (typeof window === "undefined") return;
  localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(filters));
}

interface CalendarStore {
  events: AcademicEvent[];
  loading: boolean;
  departments: string[];
  addEvent: (e: Omit<AcademicEvent, "id">) => Promise<void>;
  updateEvent: (e: AcademicEvent) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  bulkImportEvents: (events: Omit<ApiEvent, "id">[]) => Promise<void>;
  filters: Filters;
  setFilters: (f: Filters) => void;
  user: AuthUser | null;
  login: (username: string, password: string, department?: string) => Promise<void>;
  logout: () => void;
  filteredEvents: AcademicEvent[];
  refreshEvents: () => Promise<void>;
}

const CalendarCtx = createContext<CalendarStore | null>(null);

export function CalendarProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<AcademicEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState<string[]>([]);
  const [filters, setFilters] = useState<Filters>(() => loadSavedFilters());
  const [user, setUser] = useState<AuthUser | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const stored = localStorage.getItem("calendaa_user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  // Restore token-based login and persisted filters on startup
  useEffect(() => {
    const token = getToken();
    if (!token) {
      localStorage.removeItem("calendaa_user");
      setUser(null);
      return;
    }

    let active = true;
    (async () => {
      try {
        const me = await apiMe();
        if (!active) return;
        
        const fetchedUser = {
          name: me.name,
          email: me.email,
          role: me.role as Role,
          department: me.department,
        };
        
        setUser(fetchedUser);
        localStorage.setItem("calendaa_user", JSON.stringify(fetchedUser));
        
        if (me.department) {
          setFilters((prev) => ({ ...prev, department: me.department! }));
        }
      } catch (err) {
        clearToken();
        localStorage.removeItem("calendaa_user");
        setUser(null);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    saveFilters(filters);
  }, [filters]);

  // Fetch departments from the backend on mount (replaces hardcoded list in types.ts)
  useEffect(() => {
    apiFetchDepartments()
      .then((data) => {
        if (data && data.length > 0) {
          setDepartments(data.map((d) => d.name));
        } else {
          setDepartments(["CSE", "AIML", "ECE", "AIDS", "EEE", "RA", "CSD", "MECH", "CIVIL", "CSBS", "BME", "IT", "MBA", "MCA", "CYBER"]);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch departments, using fallback", err);
        setDepartments(["CSE", "AIML", "ECE", "AIDS", "EEE", "RA", "CSD", "MECH", "CIVIL", "CSBS", "BME", "IT", "MBA", "MCA", "CYBER"]);
      });
  }, []);

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
      if (filters.department !== "all" && e.department !== filters.department && e.department !== "all" && e.department !== "All") return false;
      if (filters.year !== "all" && e.year !== filters.year && e.year !== "all" && e.year !== "All") return false;
      if (filters.section !== "all" && e.section !== filters.section && e.section !== "all" && e.section !== "All") return false;
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

  const login = useCallback(async (username: string, password: string, department?: string) => {
    const res = await apiLogin(username, password, department);
    setToken(res.access_token);
    const authUser = {
      name: res.user.name,
      email: res.user.email,
      role: res.user.role as Role,
      department: res.user.department,
    };
    
    setUser(authUser);
    localStorage.setItem("calendaa_user", JSON.stringify(authUser));

    // Auto-lock filters for students or HODs to their department
    if (res.user.department) {
      setFilters((prev) => ({ ...prev, department: res.user.department! }));
    }
  }, []);

  const logout = useCallback(() => {
    clearToken();
    localStorage.removeItem("calendaa_user");
    setUser(null);
  }, []);

  const addEvent = useCallback(
    async (e: Omit<AcademicEvent, "id">) => {
      await apiCreateEvent(e);
      await refreshEvents();
    },
    [refreshEvents],
  );

  const updateEvent = useCallback(async (e: AcademicEvent) => {
    const { id, ...rest } = e;
    await apiUpdateEvent(id, rest);
    await refreshEvents();
  }, [refreshEvents]);

  const deleteEvent = useCallback(async (id: string) => {
    await apiDeleteEvent(id);
    await refreshEvents();
  }, [refreshEvents]);

  const bulkImportEvents = useCallback(async (events: Omit<ApiEvent, "id">[]) => {
    await apiBulkImportEvents(events);
    await refreshEvents();
  }, [refreshEvents]);

  const value: CalendarStore = {
    events,
    loading,
    departments,
    filters,
    setFilters,
    user,
    filteredEvents,
    login,
    logout,
    addEvent,
    updateEvent,
    deleteEvent,
    bulkImportEvents,
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
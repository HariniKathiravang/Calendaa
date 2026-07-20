export type EventCategory = "lecture" | "exam" | "event" | "holiday" | "meeting" | "workshop";

export const CATEGORY_META: Record<EventCategory, { label: string; color: string; dot: string }> = {
  lecture: { label: "Lecture", color: "bg-blue-100 text-blue-800 border-blue-200", dot: "bg-blue-500" },
  exam: { label: "Exam", color: "bg-red-100 text-red-800 border-red-200", dot: "bg-red-500" },
  event: { label: "Event", color: "bg-purple-100 text-purple-800 border-purple-200", dot: "bg-purple-500" },
  holiday: { label: "Holiday", color: "bg-emerald-100 text-emerald-800 border-emerald-200", dot: "bg-emerald-500" },
  meeting: { label: "Meeting", color: "bg-amber-100 text-amber-800 border-amber-200", dot: "bg-amber-500" },
  workshop: { label: "Workshop", color: "bg-cyan-100 text-cyan-800 border-cyan-200", dot: "bg-cyan-500" },
};

export interface AcademicEvent {
  id: string;
  title: string;
  description: string;
  date: string; // ISO date (YYYY-MM-DD)
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  venue: string;
  department: string;
  year: string;
  section: string;
  category: EventCategory;
}

export const DEPARTMENTS = ["CSE", "ECE", "MECH", "CIVIL", "IT", "EEE"] as const;
export const YEARS = ["I", "II", "III", "IV"] as const;
export const SECTIONS = ["A", "B", "C"] as const;

export type Role = "admin" | "hod" | "student" | "guest";

export interface AuthUser {
  name: string;
  email: string;
  role: Role;
  department?: string;
}

export interface Filters {
  department: string; // "all" or dept
  year: string;
  section: string;
  search: string;
}
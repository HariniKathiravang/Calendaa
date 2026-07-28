import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Filter, GraduationCap, Search } from "lucide-react";
import { format, setYear, setMonth, getYear, getMonth } from "date-fns";
import type { ReactNode } from "react";

export type CalendarView = "month" | "week" | "day";

interface Props {
  currentDate: Date;
  view: CalendarView;
  onViewChange: (v: CalendarView) => void;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onOpenFilters: () => void;
  search: string;
  onSearchChange: (v: string) => void;
  userMenu: ReactNode;
  activeFilterCount: number;
  filters: { department?: string; year?: string; section?: string };
  onDateChange?: (d: Date) => void;
}

export function CalendarHeader({
  currentDate,
  view,
  onViewChange,
  onPrev,
  onNext,
  onToday,
  onOpenFilters,
  search,
  onSearchChange,
  userMenu,
  activeFilterCount,
  filters,
  onDateChange = () => {},
}: Props) {
  const titleFormat =
    view === "day" ? "EEEE, MMMM d, yyyy" : view === "week" ? "MMMM yyyy" : "MMMM yyyy";

  const activeFilterLabels = [];
  if (filters.department && filters.department !== "all") activeFilterLabels.push(filters.department.toUpperCase());
  if (filters.year && filters.year !== "all") activeFilterLabels.push(filters.year);
  if (filters.section && filters.section !== "all") activeFilterLabels.push(filters.section);
  const filterSummary = activeFilterLabels.length > 0 ? `(${activeFilterLabels.join(", ")})` : "";

  const years = Array.from({ length: 21 }, (_, i) => new Date().getFullYear() - 10 + i);

  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1500px] flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white shadow-sm">
            <GraduationCap className="h-5 w-5" />
          </div>
          <h1 className="text-lg font-semibold tracking-tight text-foreground whitespace-nowrap">
            Academic Calendar
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3 lg:justify-center">
          <div className="flex items-center rounded-md border bg-background">
            <Button variant="ghost" size="icon" onClick={onPrev} className="h-9 w-9 rounded-none rounded-l-md border-r hover:bg-muted text-muted-foreground">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onNext} className="h-9 w-9 rounded-none rounded-r-md hover:bg-muted text-muted-foreground">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          
          <Select
            value={getMonth(currentDate).toString()}
            onValueChange={(v) => onDateChange(setMonth(currentDate, parseInt(v, 10)))}
          >
            <SelectTrigger className="h-9 w-[120px] rounded-md border bg-background px-3 text-sm font-medium hover:bg-muted/50 focus:ring-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) => (
                <SelectItem key={i} value={i.toString()}>{format(new Date(2024, i, 1), "MMMM")}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select
            value={getYear(currentDate).toString()}
            onValueChange={(v) => onDateChange(setYear(currentDate, parseInt(v, 10)))}
          >
            <SelectTrigger className="h-9 w-[90px] rounded-md border bg-background px-3 text-sm font-medium hover:bg-muted/50 focus:ring-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map(year => (
                <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" onClick={onToday} className="rounded-md h-9 px-4 shrink-0 font-medium text-foreground">
            Today
          </Button>
          
          <Tabs value={view} onValueChange={(v) => onViewChange(v as CalendarView)} className="shrink-0">
            <TabsList className="rounded-md h-9 border bg-background p-0.5">
              <TabsTrigger value="month" className="rounded-sm text-[13px] px-4 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600">Month</TabsTrigger>
              <TabsTrigger value="week" className="rounded-sm text-[13px] px-4 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600">Week</TabsTrigger>
              <TabsTrigger value="day" className="rounded-sm text-[13px] px-4 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600">Day</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {filterSummary && (
            <div className="hidden lg:flex items-center rounded-md bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-600 border border-blue-200">
              {filterSummary}
            </div>
          )}
          <div className="relative hidden lg:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search events..."
              className="h-9 w-[260px] rounded-md pl-9 bg-background focus-visible:ring-1"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenFilters}
            className="relative rounded-md h-9 px-4 font-medium"
          >
            <Filter className="mr-2 h-4 w-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1.5 text-[10px] font-semibold text-white">
                {activeFilterCount}
              </span>
            )}
          </Button>
          {userMenu}
        </div>
      </div>

      <div className="mx-auto flex max-w-[1500px] items-center gap-2 px-4 pb-3 lg:hidden">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search events..."
            className="h-9 w-full rounded-md pl-9"
          />
        </div>
      </div>
    </header>
  );
}
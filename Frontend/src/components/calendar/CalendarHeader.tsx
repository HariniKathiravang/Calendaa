import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft, ChevronRight, Filter, GraduationCap, Search } from "lucide-react";
import { format } from "date-fns";
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
}: Props) {
  const titleFormat =
    view === "day" ? "EEEE, MMMM d, yyyy" : view === "week" ? "MMMM yyyy" : "MMMM yyyy";

  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-3 px-4 py-3 md:px-6 lg:flex-row lg:items-center lg:gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold tracking-tight text-foreground">
              Academic Calendar
            </h1>
            <p className="truncate text-xs text-muted-foreground">{format(currentDate, titleFormat)}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={onToday} className="rounded-full">
            Today
          </Button>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={onPrev} className="rounded-full">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onNext} className="rounded-full">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Tabs value={view} onValueChange={(v) => onViewChange(v as CalendarView)}>
            <TabsList className="rounded-full">
              <TabsTrigger value="month" className="rounded-full">Month</TabsTrigger>
              <TabsTrigger value="week" className="rounded-full">Week</TabsTrigger>
              <TabsTrigger value="day" className="rounded-full">Day</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="flex flex-1 items-center justify-end gap-2">
          <div className="relative hidden md:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search events…"
              className="h-9 w-56 rounded-full pl-9"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenFilters}
            className="relative rounded-full"
          >
            <Filter className="mr-2 h-4 w-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">
                {activeFilterCount}
              </span>
            )}
          </Button>
          {userMenu}
        </div>
      </div>

      <div className="mx-auto flex max-w-[1400px] items-center gap-2 px-4 pb-3 md:hidden">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search events…"
            className="h-9 w-full rounded-full pl-9"
          />
        </div>
      </div>
    </header>
  );
}
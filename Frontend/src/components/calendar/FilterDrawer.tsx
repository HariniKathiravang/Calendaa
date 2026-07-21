import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { YEARS, SECTIONS, type Filters } from "@/lib/calendar/types";
import { useCalendar } from "@/lib/calendar/store";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  filters: Filters;
  onChange: (f: Filters) => void;
}

export function FilterDrawer({ open, onOpenChange, filters, onChange }: Props) {
  const { user, departments } = useCalendar();

  const reset = () =>
    onChange({ 
      department: user?.role === "admin" ? "all" : (user?.department || "all"), 
      year: "all", 
      section: "all", 
      search: filters.search 
    });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Filter events</SheetTitle>
          <SheetDescription>
            Narrow down events by department, year and section. Updates instantly.
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-5 px-4 py-6">
          {user?.role === "admin" && (
            <div className="flex flex-col gap-2">
              <Label>Department</Label>
              <Select
                value={filters.department}
                onValueChange={(v) => onChange({ ...filters, department: v })}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All departments</SelectItem>
                  {departments.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="flex flex-col gap-2">
            <Label>Year</Label>
            <Select value={filters.year} onValueChange={(v) => onChange({ ...filters, year: v })}>
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All years</SelectItem>
                {YEARS.map((y) => (
                  <SelectItem key={y} value={y}>Year {y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label>Section</Label>
            <Select
              value={filters.section}
              onValueChange={(v) => onChange({ ...filters, section: v })}
            >
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All sections</SelectItem>
                {SECTIONS.map((s) => (
                  <SelectItem key={s} value={s}>Section {s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <SheetFooter>
          <Button variant="outline" onClick={reset} className="rounded-full">
            Reset filters
          </Button>
          <Button onClick={() => onOpenChange(false)} className="rounded-full">
            Done
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
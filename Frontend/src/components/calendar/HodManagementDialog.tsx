import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, Plus, Users, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  apiFetchHods,
  apiCreateHod,
  apiDeleteHod,
  apiFetchDepartments,
  type ApiHod,
  type ApiDepartment,
} from "@/lib/calendar/api";
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

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

const EMPTY_FORM = { username: "", password: "", name: "", email: "", department_id: "" };

export function HodManagementDialog({ open, onOpenChange }: Props) {
  const [hods, setHods] = useState<ApiHod[]>([]);
  const [departments, setDepartments] = useState<ApiDepartment[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [creating, setCreating] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<ApiHod | null>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    Promise.all([apiFetchHods(), apiFetchDepartments()])
      .then(([hodsData, deptsData]) => {
        setHods(hodsData);
        setDepartments(deptsData);
      })
      .catch(() => toast.error("Failed to load HOD data"))
      .finally(() => setLoading(false));
  }, [open]);

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await apiDeleteHod(confirmDelete.id);
      setHods((prev) => prev.filter((h) => h.id !== confirmDelete.id));
      toast.success(`${confirmDelete.name} removed`);
    } catch {
      toast.error("Failed to remove HOD");
    } finally {
      setConfirmDelete(null);
    }
  };

  const handleCreate = async () => {
    if (!form.username || !form.password || !form.name || !form.email || !form.department_id) {
      toast.error("Please fill in all fields");
      return;
    }
    setCreating(true);
    try {
      const newHod = await apiCreateHod({
        username: form.username,
        password: form.password,
        name: form.name,
        email: form.email,
        department_id: parseInt(form.department_id),
      });
      setHods((prev) => [...prev, newHod]);
      setForm(EMPTY_FORM);
      toast.success(`${newHod.name} added as HOD`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to create HOD");
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto flex flex-col gap-0 p-0">
          <SheetHeader className="px-6 pt-6 pb-4 border-b">
            <SheetTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5 text-primary" />
              Manage HODs
            </SheetTitle>
            <SheetDescription>
              Add or remove Head of Department accounts. HODs can only manage events within their department.
            </SheetDescription>
          </SheetHeader>

          <div className="flex flex-col gap-0 overflow-y-auto flex-1">
            {/* ── Existing HODs ── */}
            <section className="px-6 py-5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                Current HODs
              </h3>
              {loading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading…
                </div>
              ) : hods.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">No HODs have been added yet.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {hods.map((hod) => (
                    <div
                      key={hod.id}
                      className="flex items-center justify-between rounded-2xl border bg-card px-4 py-3 gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">{hod.name}</p>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          <span className="font-mono">@{hod.username}</span>
                          {hod.department_name && (
                            <span className="ml-2 rounded-full bg-primary/10 text-primary px-2 py-0.5">
                              {hod.department_name}
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground/70 truncate">{hod.email}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0 h-8 w-8 rounded-full text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => setConfirmDelete(hod)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <div className="border-t mx-6" />

            {/* ── Add New HOD ── */}
            <section className="px-6 py-5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-1.5">
                <Plus className="h-3.5 w-3.5" />
                Add New HOD
              </h3>
              <div className="flex flex-col gap-3">
                <Field label="Full Name">
                  <Input
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Dr. Jane Smith"
                    className="rounded-xl"
                  />
                </Field>
                <Field label="Email">
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    placeholder="hod@campus.edu"
                    className="rounded-xl"
                  />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Username">
                    <Input
                      value={form.username}
                      onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                      placeholder="hod_cse"
                      className="rounded-xl font-mono"
                    />
                  </Field>
                  <Field label="Password">
                    <Input
                      type="password"
                      value={form.password}
                      onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                      placeholder="••••••••"
                      className="rounded-xl"
                    />
                  </Field>
                </div>
                <Field label="Department">
                  <Select
                    value={form.department_id}
                    onValueChange={(v) => setForm((f) => ({ ...f, department_id: v }))}
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((d) => (
                        <SelectItem key={d.id} value={String(d.id)}>
                          {d.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Button
                  onClick={handleCreate}
                  className="rounded-full mt-1"
                  disabled={creating}
                >
                  {creating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding…
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Add HOD
                    </>
                  )}
                </Button>
              </div>
            </section>
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete confirmation */}
      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this HOD?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{confirmDelete?.name}</strong>'s account
              (@{confirmDelete?.username}). They will no longer be able to log in or manage events.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove HOD
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

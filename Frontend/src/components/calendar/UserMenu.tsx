import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogIn, LogOut, ShieldCheck, User, Users } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCalendar } from "@/lib/calendar/store";
import { toast } from "sonner";
import { HodManagementDialog } from "@/components/calendar/HodManagementDialog";

export function UserMenu() {
  const { user, login, logout } = useCalendar();
  const [signInOpen, setSignInOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [hodMgmtOpen, setHodMgmtOpen] = useState(false);

  const handleSignIn = async () => {
    if (!username.trim() || !password.trim()) {
      toast.error("Please enter username and password");
      return;
    }
    setBusy(true);
    try {
      await login(username.trim(), password);
      setSignInOpen(false);
      setUsername("");
      setPassword("");
      toast.success("Signed in successfully");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Login failed";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSignIn();
  };

  if (!user) {
    return (
      <>
        <Button
          variant="default"
          size="sm"
          onClick={() => setSignInOpen(true)}
          className="rounded-full"
        >
          <LogIn className="mr-2 h-4 w-4" />
          Sign in
        </Button>
        <Dialog open={signInOpen} onOpenChange={setSignInOpen}>
          <DialogContent className="rounded-3xl sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Sign in</DialogTitle>
              <DialogDescription>
                Students can browse the calendar without signing in. Faculty sign in below.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Username</Label>
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="e.g. admin"
                  className="rounded-xl"
                  autoFocus
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Password</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="••••••••"
                  className="rounded-xl"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setSignInOpen(false)}
                className="rounded-full"
                disabled={busy}
              >
                Cancel
              </Button>
              <Button onClick={handleSignIn} className="rounded-full" disabled={busy}>
                {busy ? "Signing in…" : "Continue"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  const initials = user.name
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="rounded-full">
            <Avatar className="h-9 w-9 border border-border">
              <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 rounded-2xl">
          <DropdownMenuLabel className="flex flex-col">
            <span className="font-medium">{user.name}</span>
            <span className="text-xs font-normal text-muted-foreground">{user.email}</span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem disabled className="opacity-100">
            {user.role === "admin" ? (
              <ShieldCheck className="mr-2 h-4 w-4 text-primary" />
            ) : (
              <User className="mr-2 h-4 w-4 text-primary" />
            )}
            <span className="capitalize">{user.role}</span>
            {user.department && (
              <span className="ml-auto text-xs text-muted-foreground">{user.department}</span>
            )}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {/* Admin-only: HOD management */}
          {user.role === "admin" && (
            <DropdownMenuItem onClick={() => setHodMgmtOpen(true)}>
              <Users className="mr-2 h-4 w-4" />
              Manage HODs
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            onClick={() => {
              logout();
              toast.success("Signed out");
            }}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* HOD management panel — only mounts for admin */}
      {user.role === "admin" && (
        <HodManagementDialog open={hodMgmtOpen} onOpenChange={setHodMgmtOpen} />
      )}
    </>
  );
}
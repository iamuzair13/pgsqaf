"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  BookOpen,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  GraduationCap,
  UserCircle,
  X,
  Moon,
  Sun,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { signOutAction } from "@/app/actions/auth";

/* ------------------------------------------------------------------ */
/*  Nav config                                                        */
/* ------------------------------------------------------------------ */

const navGroups = [
  {
    label: "Overview",
    items: [{ label: "Dashboard", href: "/", icon: LayoutDashboard }],
  },
  {
    label: "Management",
    items: [
      { label: "Frameworks", href: "/frameworks", icon: BookOpen },
      { label: "User Profile", href: "/profile", icon: UserCircle },
    ],
  },
  {
    label: "System",
    items: [{ label: "Setup", href: "/setup", icon: Settings }],
  },
];

// Student-only nav: just Profile
const studentNavGroups = [
  {
    label: "Account",
    items: [{ label: "My Profile", href: "/profile", icon: UserCircle }],
  },
];

const ICON_SIZE = 18;
const BUTTON_ICON_SIZE = 16;

interface SidebarProps {
  open: boolean;
  onToggle: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

/* ------------------------------------------------------------------ */
/*  Small shared bits                                                  */
/* ------------------------------------------------------------------ */

/** Lightweight, dependency-free tooltip for collapsed-rail nav items. */
function RailTooltip({ label }: { label: string }) {
  return (
    <span
      role="tooltip"
      className={cn(
        "pointer-events-none absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2 whitespace-nowrap",
        "rounded-md bg-popover px-2.5 py-1.5 text-xs font-medium text-popover-foreground shadow-lg ring-1 ring-border",
        "opacity-0 scale-95 origin-left transition-all duration-150",
        "group-hover:opacity-100 group-hover:scale-100 group-focus-visible:opacity-100 group-focus-visible:scale-100"
      )}
    >
      {label}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Brand header                                                      */
/* ------------------------------------------------------------------ */

function SidebarBrand({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  return (
    <div
      className={cn(
        "flex h-16 shrink-0 items-center border-b border-sidebar-border px-3",
        open ? "justify-between gap-2" : "justify-center"
      )}
    >
      <div className="flex min-w-0 items-center gap-2.5 overflow-hidden">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary shadow-sm">
          <GraduationCap size={16} className="text-primary-foreground" aria-hidden="true" />
        </div>

        <AnimatePresence initial={false}>
          {open && (
            <motion.p
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              className="overflow-hidden whitespace-nowrap text-lg font-bold leading-none text-sidebar-foreground"
            >
              PGSQAF
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Toggle stays in the header in BOTH states, so it never moves. */}
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={onToggle}
        aria-label={open ? "Collapse sidebar" : "Expand sidebar"}
        className={cn(
          "shrink-0 text-white/70 hover:bg-sidebar-accent hover:text-white",
          !open && "h-9 w-9"
        )}
      >
        {open ? (
          <PanelLeftClose size={BUTTON_ICON_SIZE} aria-hidden="true" />
        ) : (
          <PanelLeftOpen size={BUTTON_ICON_SIZE} aria-hidden="true" />
        )}
      </Button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Nav items                                                         */
/* ------------------------------------------------------------------ */

function NavItems({ open, onItemClick }: { open: boolean; onItemClick?: () => void }) {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const isStudent = (session?.user as { role?: string } | undefined)?.role === "STUDENT";

  // While session is loading, render minimal nav to avoid flashing admin items
  const groups = status === "loading" ? [] : isStudent ? studentNavGroups : navGroups;

  return (
    <nav aria-label="Main navigation" className="flex-1 space-y-1 overflow-y-auto px-2 py-3">
      {groups.map((group, i) => (
        <div key={group.label}>
          {/* Divider between groups when collapsed, since labels disappear */}
          {!open && i > 0 && <div className="mx-2 my-2 border-t border-sidebar-border/60" />}

          <AnimatePresence initial={false}>
            {open && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className={cn(
                  "select-none px-3 text-[0.6875rem] font-semibold uppercase tracking-widest text-white/50",
                  i > 0 && "mt-4"
                )}
              >
                {group.label}
              </motion.p>
            )}
          </AnimatePresence>

          <div className={cn("space-y-0.5", open && "mt-1")}>
            {group.items.map(({ label, href, icon: Icon }) => {
              const active = pathname === href || (href !== "/" && pathname.startsWith(href));

              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  onClick={onItemClick}
                  className={cn(
                    "group relative flex h-10 items-center gap-3 rounded-lg text-sm font-medium transition-colors duration-150",
                    "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary",
                    open ? "px-3" : "justify-center px-0",
                    active
                      ? "text-white"
                      : "text-white/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  {active && (
                    <motion.div
                      layoutId="nav-active-bg"
                      className="absolute inset-0 rounded-lg bg-primary/15"
                      transition={{ type: "spring", stiffness: 400, damping: 32 }}
                    />
                  )}

                  {active && open && (
                    <motion.div
                      layoutId="nav-active-bar"
                      className="absolute bottom-1.5 left-0 top-1.5 w-[3px] rounded-full bg-primary"
                      transition={{ type: "spring", stiffness: 400, damping: 32 }}
                    />
                  )}

                  <Icon
                    size={ICON_SIZE}
                    strokeWidth={active ? 2.2 : 1.8}
                    className="relative z-10 shrink-0"
                    aria-hidden="true"
                  />

                  <AnimatePresence initial={false}>
                    {open && (
                      <motion.span
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -6 }}
                        transition={{ duration: 0.15 }}
                        className="relative z-10 truncate"
                      >
                        {label}
                      </motion.span>
                    )}
                  </AnimatePresence>

                  {/* Tooltip only makes sense when the rail is collapsed */}
                  {!open && <RailTooltip label={label} />}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

/* ------------------------------------------------------------------ */
/*  Footer — single implementation, adapts via `compact`               */
/* ------------------------------------------------------------------ */

function SidebarFooter({ compact }: { compact: boolean }) {
  const { theme, setTheme } = useTheme();
  const { data: session, status } = useSession();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = mounted && theme === "dark";

  const isLoading = status === "loading";
  const userName = session?.user?.name ?? "User";
  const userEmail = session?.user?.email ?? "";
  const userRole = (session?.user as { role?: string } | undefined)?.role ?? "ADMIN";
  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className={cn(
        "shrink-0 border-t border-sidebar-border py-3",
        compact ? "flex flex-col items-center gap-1.5 px-2" : "space-y-2 px-2"
      )}
    >
      {/* ── System toggle ── */}
      <button
        onClick={() => setTheme(isDark ? "light" : "dark")}
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        className={cn(
          "group relative flex h-10 items-center gap-3 rounded-lg text-sm font-medium text-white/70 transition-colors duration-150 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
          compact ? "w-10 justify-center" : "w-full px-3"
        )}
      >
        {isDark ? (
          <Sun size={compact ? 16 : ICON_SIZE} strokeWidth={1.8} aria-hidden="true" />
        ) : (
          <Moon size={compact ? 16 : ICON_SIZE} strokeWidth={1.8} aria-hidden="true" />
        )}
        {!compact && <span>{isDark ? "Light mode" : "Dark mode"}</span>}
        {compact && <RailTooltip label={isDark ? "Light mode" : "Dark mode"} />}
      </button>

      {/* ── User area — grouped card with identity + sign-out ── */}
      <div
        className={cn(
          "flex items-center gap-3 rounded-lg border border-sidebar-border/60 bg-sidebar-accent/30",
          compact ? "h-10 w-10 justify-center" : "px-3 py-2"
        )}
      >
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground ring-2 ring-primary/20">
          {isLoading ? "··" : initials}
        </div>

        {!compact && (
          <div className="min-w-0 flex-1">
            {isLoading ? (
              <>
                <div className="h-3 w-20 animate-pulse rounded bg-white/20" />
                <div className="mt-1 h-2.5 w-28 animate-pulse rounded bg-white/10" />
              </>
            ) : (
              <>
                <p className="truncate text-xs font-semibold leading-none text-white">{userName}</p>
                <p className="mt-0.5 truncate text-[0.6875rem] leading-none text-white/60">
                  {userRole === "SUPER_ADMIN" ? "Super Admin" : userRole === "STUDENT" ? "Student" : "Admin"}
                  {userEmail ? ` · ${userEmail}` : ""}
                </p>
              </>
            )}
          </div>
        )}

        {!compact && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => signOutAction()}
            aria-label="Sign out"
            className="shrink-0 text-white/70 hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut size={14} aria-hidden="true" />
          </Button>
        )}
      </div>

      {/* Compact mode needs its own reachable sign-out control */}
      {compact && (
        <button
          onClick={() => signOutAction()}
          aria-label="Sign out"
          className="group relative flex h-10 w-10 items-center justify-center rounded-lg text-white/60 transition-colors duration-150 hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut size={16} aria-hidden="true" />
          <RailTooltip label="Sign out" />
        </button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Mobile header (kept separate: has a close X, no collapse toggle)   */
/* ------------------------------------------------------------------ */

function MobileHeader({ onClose }: { onClose?: () => void }) {
  return (
    <div className="flex h-16 shrink-0 items-center justify-between border-b border-sidebar-border px-4">
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shadow-sm">
          <GraduationCap size={16} className="text-primary-foreground" aria-hidden="true" />
        </div>
        <p className="text-sm font-bold leading-none text-sidebar-foreground">PGSQAF</p>
      </div>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={onClose}
        aria-label="Close menu"
        className="text-white/70 hover:bg-sidebar-accent hover:text-white"
      >
        <X size={BUTTON_ICON_SIZE} aria-hidden="true" />
      </Button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Sidebar shell                                                     */
/* ------------------------------------------------------------------ */

export function Sidebar({ open, onToggle, mobileOpen = false, onMobileClose }: SidebarProps) {
  return (
    <>
      {/* Desktop rail */}
      <motion.aside
        animate={{ width: open ? 240 : 72 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className="hidden shrink-0 flex-col overflow-hidden border-r border-sidebar-border bg-sidebar lg:flex"
        aria-label="Sidebar"
      >
        <SidebarBrand open={open} onToggle={onToggle} />
        <NavItems open={open} />
        <SidebarFooter compact={!open} />
      </motion.aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation menu">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm"
              onClick={onMobileClose}
              aria-hidden="true"
            />

            <motion.aside
              initial={{ x: -260 }}
              animate={{ x: 0 }}
              exit={{ x: -260 }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              className="relative z-50 flex h-full w-64 flex-col border-r border-sidebar-border bg-sidebar shadow-xl"
            >
              <MobileHeader onClose={onMobileClose} />
              <NavItems open onItemClick={onMobileClose} />
              <SidebarFooter compact={false} />
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
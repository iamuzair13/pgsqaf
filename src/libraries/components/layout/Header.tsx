"use client";

import { Bell, Menu, Moon, Sun, Search, LogOut, UserCircle, Settings } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  return (
    <header
      style={{ borderBottom: "1px solid hsl(var(--border-subtle))" }}
      className="flex items-center justify-between h-16 px-8 bg-background shrink-0"
    >
      {/* Left: hamburger (mobile) */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          aria-label="Open navigation menu"
          className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg text-tertiary-color hover:text-primary-color hover:bg-surface transition-colors"
        >
          <Menu size={18} aria-hidden="true" />
        </button>

        {/* Search */}
        <div className="relative hidden md:flex items-center">
          <Search
            size={14}
            className="absolute left-3 pointer-events-none"
            style={{ color: "hsl(var(--text-muted))" }}
            aria-hidden="true"
          />
          <input
            type="search"
            placeholder="Search frameworks, criteria..."
            aria-label="Search"
            className="pl-8 pr-4 h-9 text-small bg-surface rounded-lg border-0 focus:outline-2 focus:outline-offset-0 w-80 placeholder:text-muted-color transition-colors"
            style={{ outlineColor: "hsl(var(--ring))" }}
          />
        </div>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-1">
        {/* Theme toggle */}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          aria-label={mounted && theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          className="w-9 h-9 flex items-center justify-center rounded-lg text-tertiary-color hover:text-primary-color hover:bg-surface transition-colors"
        >
          {mounted && theme === "dark"
            ? <Sun size={16} aria-hidden="true" />
            : <Moon size={16} aria-hidden="true" />}
        </button>

        {/* Notifications */}
        <button
          aria-label="Notifications"
          className="relative w-9 h-9 flex items-center justify-center rounded-lg text-tertiary-color hover:text-primary-color hover:bg-surface transition-colors"
        >
          <Bell size={16} aria-hidden="true" />
          <span
            aria-hidden="true"
            className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: "hsl(var(--warning))" }}
          />
        </button>

        {/* Divider */}
        <div className="w-px h-5 mx-2" style={{ backgroundColor: "hsl(var(--border))" }} aria-hidden="true" />

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger
            className="flex items-center gap-2.5 h-9 px-2 rounded-lg text-secondary-color hover:bg-surface transition-colors focus-visible:outline-2 focus-visible:outline-offset-1"
            aria-label="User menu"
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-semibold shrink-0"
              style={{
                backgroundColor: "hsl(var(--brand))",
                color: "hsl(var(--brand-foreground))",
              }}
              aria-hidden="true"
            >
              SA
            </div>
            <div className="hidden md:block text-left">
              <p className="text-small font-medium text-primary-color leading-none">Super Admin</p>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44 shadow-elevation-3">
            <DropdownMenuItem className="gap-2 cursor-pointer text-small">
              <UserCircle size={14} aria-hidden="true" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2 cursor-pointer text-small">
              <Settings size={14} aria-hidden="true" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              className="gap-2 cursor-pointer text-small"
            >
              <LogOut size={14} aria-hidden="true" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

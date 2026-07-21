"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, BookOpen, UserCircle, Settings, Menu } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const mobileNav = [
  { label: "Dashboard",  href: "/",           icon: LayoutDashboard },
  { label: "Frameworks", href: "/frameworks",  icon: BookOpen },
  { label: "Profile",    href: "/profile",     icon: UserCircle },
  { label: "Settings",   href: "/settings",    icon: Settings },
];

export function MainLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar
        open={sidebarOpen}
        onToggle={() => setSidebarOpen((v) => !v)}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />
      <main className="flex-1 min-w-0 overflow-y-auto p-5 md:p-8 pb-20 lg:pb-8 animate-fade-in">
        {/* Mobile menu button — only visible on small screens */}
        <div className="lg:hidden mb-4">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setMobileSidebarOpen((v) => !v)}
            aria-label="Open navigation menu"
          >
            <Menu size={18} aria-hidden="true" />
          </Button>
        </div>
        {children}
      </main>

      {/* Mobile bottom nav */}
      <nav
        aria-label="Mobile navigation"
        className="lg:hidden fixed bottom-0 inset-x-0 z-30 h-14 bg-background border-t border-border flex items-center justify-around px-2"
      >
        {mobileNav.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-colors",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon size={20} aria-hidden="true" />
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  LayoutDashboard,
  CreditCard,
  BarChart3,
  Settings,
  ChevronRight,
  ChevronLeft,
  Menu,
  LineChart,
  Brain,
} from "lucide-react";

const sidebarNavItems = [
  {
    title: "Overview",
    href: "/dashboard",
    icon: <LayoutDashboard className="h-5 w-5" />,
  },

  {
    title: "Strategy",
    href: "/dashboard/strategy",
    icon: <Brain className="h-5 w-5" />,
  },
  {
    title: "Settings",
    href: "/dashboard/settings",
    icon: <Settings className="h-5 w-5" />,
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="flex h-full overflow-hidden">
      {/* Desktop Sidebar */}
      <div
        className={cn(
          "relative hidden border-r bg-card transition-all duration-300 md:block",
          isCollapsed ? "w-16" : "w-64",
        )}
      >
        <div className="sticky top-0">
          <div className="flex h-[64px] items-center border-b px-4">
            {!isCollapsed && (
              <span className="text-lg font-semibold">Dashboard</span>
            )}
          </div>
          <ScrollArea className="h-[calc(100vh-64px)]">
            <div className="space-y-1 p-2">
              {sidebarNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                    pathname === item.href
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  {item.icon}
                  {!isCollapsed && <span>{item.title}</span>}
                </Link>
              ))}
            </div>
          </ScrollArea>
          <Button
            variant="ghost"
            size="icon"
            className="absolute -right-4 top-20 h-8 w-8 rounded-full border bg-background"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile navigation */}
        <div className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur md:hidden flex-shrink-0">
          <div className="flex h-16 items-center gap-4 px-4">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <SheetHeader className="border-b px-4 py-4">
                  <SheetTitle>Dashboard Navigation</SheetTitle>
                </SheetHeader>
                <ScrollArea className="h-[calc(100vh-64px)]">
                  <div className="space-y-1 p-2">
                    {sidebarNavItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                          pathname === item.href
                            ? "bg-accent text-accent-foreground"
                            : "text-muted-foreground",
                        )}
                      >
                        {item.icon}
                        <span>{item.title}</span>
                      </Link>
                    ))}
                  </div>
                </ScrollArea>
              </SheetContent>
            </Sheet>
            <span className="text-lg font-semibold">Dashboard</span>
          </div>
        </div>
        <div className="flex-1 overflow-auto">{children}</div>
      </main>
    </div>
  );
}

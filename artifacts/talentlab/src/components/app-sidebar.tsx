import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Briefcase,
  Users,
  ClipboardCheck,
  Target,
  KanbanSquare,
  CalendarClock,
  HandCoins,
  UserCheck,
  LogOut,
  Sparkles,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const main = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Process Flow", url: "/process-flow", icon: Sparkles },
  { title: "Requirements", url: "/requirements", icon: Briefcase },
  { title: "Sourcing", url: "/candidates", icon: Users },
  { title: "99 Screening", url: "/screening", icon: ClipboardCheck },
  { title: "99 Assessments", url: "/assessments", icon: Target },
  { title: "Kanban", url: "/kanban", icon: KanbanSquare },
];

const ops = [
  { title: "Client Interviews", url: "/client-interviews", icon: CalendarClock },
  { title: "Offers & Salary", url: "/offers", icon: HandCoins },
  { title: "Joining & Support", url: "/joining", icon: UserCheck },
];

interface AppSidebarProps {
  employee?: { name: string; email: string; role: string } | null;
  onLogout?: () => void;
}

export function AppSidebar({ employee, onLogout }: AppSidebarProps = {}) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const [pathname] = useLocation();
  const isActive = (url: string) => (url === "/" ? pathname === "/" : pathname.startsWith(url));

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarHeader className="px-4 pt-5 pb-3">
        <Link to="/" className="flex items-center gap-2">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-[var(--pastel-yellow)] text-[var(--ink)]">
            <Sparkles className="h-4 w-4" />
          </span>
          {!collapsed && (
            <span className="text-lg font-semibold tracking-tight text-sidebar-foreground">
              99placement<span className="text-[var(--pastel-yellow)]">.</span>
            </span>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupLabel className="px-3 text-[10px] uppercase tracking-[0.18em] text-sidebar-foreground/50">
            Pipeline
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {main.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)} className="rounded-xl data-[active=true]:bg-sidebar-accent">
                    <Link to={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="px-3 text-[10px] uppercase tracking-[0.18em] text-sidebar-foreground/50">
            Operations
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {ops.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)} className="rounded-xl data-[active=true]:bg-sidebar-accent">
                    <Link to={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="px-2 pb-4">
        {employee && !collapsed && (
          <div className="px-3 py-2 mb-1">
            <p className="text-xs font-semibold text-sidebar-foreground truncate">{employee.name}</p>
            <p className="text-[10px] text-sidebar-foreground/50 capitalize">{employee.role}</p>
          </div>
        )}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={onLogout} className="rounded-xl text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground">
              <LogOut className="h-4 w-4" />
              <span>Log out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

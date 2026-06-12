import { CalendarDays, LayoutDashboard, Lock, LogOut, Package, Scissors, Settings, Store, User, Users } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { useAppDataContext } from '@/context/AppDataContext';
import { useAccountContext } from '@/context/AccountContext';
import { useNavigationContext } from '@/context/NavigationContext';
import type { Route } from '@/hooks/useNavigation';

const NAV_ITEMS: { label: string; route: Route; icon: React.ElementType }[] = [
  { label: 'Tableau de bord', route: 'dashboard', icon: LayoutDashboard },
  { label: 'Commandes',       route: 'orders',    icon: Package  },
  { label: 'Calendrier',      route: 'calendar',  icon: CalendarDays },
  { label: 'Clients',         route: 'clients',   icon: Users    },
  { label: 'Atelier',         route: 'workshop',  icon: Store    },
];

export function AppSidebar({ onLock, onLogout, pinEnabled }: { onLock: () => void; onLogout: () => void; pinEnabled: boolean }) {
  const { current, navigate } = useNavigationContext();
  const { orders, clients } = useAppDataContext();
  const { profile, activeWorkshop } = useAccountContext();

  const activeSection = current.split('/')[0] as Route;
  const workspaceLabel = activeWorkshop?.name ?? (profile ? `Carnet de ${profile.firstName}` : 'Carnet couture');
  const counters: Partial<Record<Route, number>> = {
    orders: orders.length,
    clients: clients.length,
  };

  return (
    <Sidebar collapsible="offcanvas" className="border-sidebar-border">
      <SidebarHeader className="px-3 py-4">
        <div className="flex items-center gap-3 rounded-lg px-2 py-1.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <Scissors className="size-4" strokeWidth={1.25} />
          </div>
          <div className="min-w-0">
            <h1 className="truncate font-heading text-lg font-medium tracking-normal text-sidebar-foreground">
              Tailora
            </h1>
            <p className="truncate text-xs text-muted-foreground">{workspaceLabel}</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent className="px-2 py-3">
        <SidebarMenu>
          {NAV_ITEMS.map(({ label, route, icon: Icon }) => (
            <SidebarMenuItem key={route}>
              <SidebarMenuButton
                isActive={activeSection === route}
                onClick={() => navigate(route)}
                className="h-9 gap-3 rounded-lg px-3"
              >
                <Icon strokeWidth={1.25} />
                <span>{label}</span>
                {counters[route] !== undefined && (
                  <span className="ml-auto rounded bg-sidebar-accent/70 px-1 py-0.5 text-[0.65rem] tabular-nums text-muted-foreground">
                    {counters[route]}
                  </span>
                )}
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="px-2 py-3">
        <SidebarSeparator className="mb-2" />
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={activeSection === 'profile'}
              onClick={() => navigate('profile')}
              className="h-9 gap-3 rounded-lg px-3"
            >
              <User strokeWidth={1.25} />
              <span>Profil</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={activeSection === 'settings'}
              onClick={() => navigate('settings')}
              className="h-9 gap-3 rounded-lg px-3"
            >
              <Settings strokeWidth={1.25} />
              <span>Paramètres</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          {pinEnabled && (
            <SidebarMenuItem>
              <SidebarMenuButton onClick={onLock} className="h-9 gap-3 rounded-lg px-3 text-muted-foreground hover:text-foreground">
                <Lock strokeWidth={1.25} />
                <span>Verrouiller</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
          <SidebarMenuItem>
            <SidebarMenuButton onClick={onLogout} className="h-9 gap-3 rounded-lg px-3 text-muted-foreground hover:text-foreground">
              <LogOut strokeWidth={1.25} />
              <span>Se deconnecter</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

import { Scissors, Package, Users, Lock } from 'lucide-react';
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
import { useNavigationContext } from '@/context/NavigationContext';
import type { Route } from '@/hooks/useNavigation';

const NAV_ITEMS: { label: string; route: Route; icon: React.ElementType }[] = [
  { label: 'Tableau de bord', route: 'dashboard', icon: Scissors },
  { label: 'Commandes',       route: 'orders',    icon: Package  },
  { label: 'Clients',         route: 'clients',   icon: Users    },
];

export function AppSidebar({ onLock, pinEnabled }: { onLock: () => void; pinEnabled: boolean }) {
  const { current, navigate } = useNavigationContext();

  const activeSection = current.split('/')[0] as Route;

  return (
    <Sidebar collapsible="offcanvas">
      <SidebarHeader className="px-4 py-5">
        <h1 className="font-heading text-xl font-bold tracking-tight text-sidebar-foreground">
          Tailora
        </h1>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent className="px-2 py-3">
        <SidebarMenu>
          {NAV_ITEMS.map(({ label, route, icon: Icon }) => (
            <SidebarMenuItem key={route}>
              <SidebarMenuButton
                isActive={activeSection === route}
                onClick={() => navigate(route)}
                className="gap-3"
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{label}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      {pinEnabled && (
        <SidebarFooter className="px-2 py-3">
          <SidebarSeparator className="mb-2" />
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={onLock} className="gap-3 text-muted-foreground hover:text-foreground">
                <Lock className="h-4 w-4 shrink-0" />
                <span>Verrouiller</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      )}
    </Sidebar>
  );
}

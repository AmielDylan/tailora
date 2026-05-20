import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { PageRouter } from '@/components/layout/PageRouter';

export function AppShell({ onLock }: { onLock: () => void }) {
  return (
    <SidebarProvider>
      <AppSidebar onLock={onLock} />
      <SidebarInset>
        <PageRouter onLock={onLock} />
      </SidebarInset>
    </SidebarProvider>
  );
}

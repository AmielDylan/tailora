import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { PageRouter } from '@/components/layout/PageRouter';
import { Toast } from '@/components/Toast';
import { useAppDataContext } from '@/context/AppDataContext';

export function AppShell({ onLock, pinEnabled }: { onLock: () => void; pinEnabled: boolean }) {
  const { toast, setToast } = useAppDataContext();

  return (
    <SidebarProvider className="bg-background">
      <AppSidebar onLock={onLock} pinEnabled={pinEnabled} />
      <SidebarInset className="min-w-0">
        <PageRouter onLock={onLock} />
      </SidebarInset>
      <Toast message={toast} onDone={() => setToast('')} />
    </SidebarProvider>
  );
}

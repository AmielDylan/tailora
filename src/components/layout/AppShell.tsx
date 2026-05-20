import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { PageRouter } from '@/components/layout/PageRouter';
import { Toast } from '@/components/Toast';
import { useAppDataContext } from '@/context/AppDataContext';

export function AppShell({ onLock }: { onLock: () => void }) {
  const { toast, setToast } = useAppDataContext();

  return (
    <SidebarProvider>
      <AppSidebar onLock={onLock} />
      <SidebarInset>
        <PageRouter onLock={onLock} />
      </SidebarInset>
      <Toast message={toast} onDone={() => setToast('')} />
    </SidebarProvider>
  );
}

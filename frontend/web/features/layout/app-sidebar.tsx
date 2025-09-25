'use client';

import type { User } from 'next-auth';
import { useRouter } from 'next/navigation';

import { PlusIcon } from '@/shared/icons';
import { SidebarHistory } from '@/features/layout/sidebar-history';
import { SidebarUserNav } from '@/features/layout/sidebar-user-nav';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from '@shoppr/ui/sidebar';
import Link from 'next/link';
import { Button } from '@shoppr/ui/button';

export function AppSidebar({ user }: { user: User | undefined }) {
  const router = useRouter();
  const { setOpenMobile } = useSidebar();

  const handleStartNewChat = () => {
    setOpenMobile(false);
    router.push('/');
    router.refresh();
  };

  return (
    <Sidebar className="border-r border-sidebar-border/60">
      <SidebarHeader className="gap-4 border-b border-sidebar-border/60 px-3 py-4">
        <Link
          href="/"
          onClick={() => {
            setOpenMobile(false);
          }}
          className="block text-lg font-semibold tracking-tight text-sidebar-foreground"
        >
          Shoppr
        </Link>

        <Button
          type="button"
          variant="outline"
          className="h-9 justify-start gap-2 px-3"
          onClick={handleStartNewChat}
        >
          <PlusIcon className="size-4" />
          <span className="truncate">Start new chat</span>
        </Button>
      </SidebarHeader>
      <SidebarContent className="px-3 py-4">
        <SidebarHistory user={user} />
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border/60 px-3 py-4">
        {user && <SidebarUserNav user={user} />}
      </SidebarFooter>
    </Sidebar>
  );
}

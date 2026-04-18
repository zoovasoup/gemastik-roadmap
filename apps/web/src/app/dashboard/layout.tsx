import { auth } from '@gemastik/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

import { AppSidebar } from '@/components/app-sidebar'
import { SiteHeader } from '@/components/site-header'
import { SidebarInset, SidebarProvider } from '@gemastik/ui/components/sidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user) {
    redirect('/login')
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className='min-h-svh overflow-hidden'>
        <SiteHeader />
        <div className='flex min-h-0 flex-1 overflow-hidden'>
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

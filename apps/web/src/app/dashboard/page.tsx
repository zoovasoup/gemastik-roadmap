import { auth } from '@gemastik/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import z from 'zod'

import { AppSidebar } from '@/components/app-sidebar'
import { SectionCards } from '@/components/section-cards'
import { SiteHeader } from '@/components/site-header'
import { SidebarInset, SidebarProvider } from '@gemastik/ui/components/sidebar'

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user) {
    redirect('/login')
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <SiteHeader />
        <div className='flex flex-1 flex-col gap-6 py-4 md:py-6'>
          <div className='px-4 lg:px-6'>
            <h1 className='text-2xl font-semibold tracking-tight'>Welcome back, {session.user.name}</h1>
            <p className='text-sm text-muted-foreground'>Your custom dashboard is now the primary application experience.</p>
          </div>
          <SectionCards />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

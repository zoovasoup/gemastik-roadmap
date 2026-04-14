import { auth } from '@gemastik/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import z from 'zod'

import { AppSidebar } from '@/components/app-sidebar'
import { ChartAreaInteractive } from '@/components/chart-area-interactive'
import { DataTable, schema } from '@/components/data-table'
import { SectionCards } from '@/components/section-cards'
import { SiteHeader } from '@/components/site-header'
import { SidebarInset, SidebarProvider } from '@gemastik/ui/components/sidebar'

const dashboardData: z.infer<typeof schema>[] = [
  {
    id: 1,
    header: 'Executive Summary',
    type: 'Executive Summary',
    status: 'Done',
    target: '12',
    limit: '20',
    reviewer: 'Eddie Lake',
  },
  {
    id: 2,
    header: 'Technical Approach',
    type: 'Technical Approach',
    status: 'In Progress',
    target: '18',
    limit: '25',
    reviewer: 'Assign reviewer',
  },
  {
    id: 3,
    header: 'Capabilities',
    type: 'Capabilities',
    status: 'Done',
    target: '8',
    limit: '14',
    reviewer: 'Jamik Tashpulatov',
  },
  {
    id: 4,
    header: 'Past Performance',
    type: 'Narrative',
    status: 'In Progress',
    target: '16',
    limit: '24',
    reviewer: 'Assign reviewer',
  },
  {
    id: 5,
    header: 'Cover Page',
    type: 'Cover Page',
    status: 'Done',
    target: '4',
    limit: '8',
    reviewer: 'Emily Whalen',
  },
]

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

import { SectionCards } from '@/components/section-cards'

export default function DashboardPage() {
  return (
    <div className='flex flex-1 flex-col'>
      <div className='@container/main flex flex-1 flex-col gap-2'>
        <div className='flex flex-col gap-4 py-4 md:gap-6 md:py-6'>
          <div className='px-4 lg:px-6'>
            <h1 className='text-2xl font-semibold tracking-tight'>Your learning dashboard</h1>
            <p className='max-w-3xl text-sm leading-6 text-muted-foreground'>Open a course to inspect the roadmap, review the current node, and chat with the tutor.</p>
          </div>
          <SectionCards />
        </div>
      </div>
    </div>
  )
}

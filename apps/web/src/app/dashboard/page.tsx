import { SectionCards } from '@/components/section-cards'

export default function DashboardPage() {
  return (
    <div className='flex flex-1 flex-col gap-6 py-4 md:py-6'>
      <div className='px-4 lg:px-6'>
        <h1 className='text-2xl font-semibold tracking-tight'>Your learning dashboard</h1>
        <p className='text-sm text-muted-foreground'>Open a course to inspect the roadmap, review the current node, and chat with the tutor.</p>
      </div>
      <SectionCards />
    </div>
  )
}

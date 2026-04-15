'use client'

import { CourseCard } from '@/components/course-card'
import { useTRPC } from '@/utils/trpc'
import { Card, CardContent, CardHeader, CardTitle } from '@gemastik/ui/components/card'
import { useQuery } from '@tanstack/react-query'

export function SectionCards() {
  const trpc = useTRPC()
  const roadmapQuery = useQuery(trpc.learning.list.queryOptions(undefined))

  if (roadmapQuery.isPending) {
    return (
      <div className='grid grid-cols-1 gap-4 px-4 lg:px-6 xl:grid-cols-2'>
        <Card className='rounded-2xl border-dashed'>
          <CardHeader>
            <CardTitle>Loading courses...</CardTitle>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (roadmapQuery.isError) {
    return (
      <div className='grid grid-cols-1 gap-4 px-4 lg:px-6 xl:grid-cols-2'>
        <Card className='rounded-2xl border-destructive/40'>
          <CardHeader>
            <CardTitle>Unable to load courses</CardTitle>
          </CardHeader>
          <CardContent className='text-sm text-muted-foreground'>
            {roadmapQuery.error.message}
          </CardContent>
        </Card>
      </div>
    )
  }

  if (roadmapQuery.data.length === 0) {
    return (
      <div className='grid grid-cols-1 gap-4 px-4 lg:px-6'>
        <Card className='rounded-2xl border-dashed'>
          <CardHeader>
            <CardTitle>Create your first course</CardTitle>
          </CardHeader>
          <CardContent className='text-sm leading-6 text-muted-foreground'>
            Use the sidebar action to describe what you want to learn. We&apos;ll save the course and generate a roadmap when the AI response is available.
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className='grid grid-cols-1 gap-4 px-4 lg:px-6 xl:grid-cols-2 2xl:grid-cols-4'>
      {roadmapQuery.data.map((roadmap) => {
        const completedNodes = roadmap.nodes.filter((node) => node.isCompleted).length
        const progress = roadmap.nodes.length > 0 ? Math.round((completedNodes / roadmap.nodes.length) * 100) : null
        const metadata = roadmap.metadata ?? {}
        const onboarding = metadata.onboarding
        const generationStatus = metadata.generationStatus === 'draft' ? 'Draft roadmap' : roadmap.currentStatus ?? 'active'

        return (
          <CourseCard
            key={roadmap.id}
            title={onboarding?.topic ?? roadmap.goalDescription}
            description={roadmap.goalDescription}
            level={onboarding?.level ?? 'Custom'}
            weeklyHours={onboarding?.weeklyHours ?? 'Flexible pace'}
            learningStyle={onboarding?.learningStyle ?? 'Mixed format'}
            nodeCount={roadmap.nodes.length}
            progress={progress}
            status={generationStatus}
            createdAt={new Date(roadmap.createdAt).toLocaleDateString()}
          />
        )
      })}
    </div>
  )
}

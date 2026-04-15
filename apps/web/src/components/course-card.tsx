import { Badge } from '@gemastik/ui/components/badge'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@gemastik/ui/components/card'
import { BookOpenIcon, CalendarClockIcon, CircleDashedIcon, SparklesIcon } from 'lucide-react'

type CourseCardProps = {
  title: string
  description: string
  level: string
  weeklyHours: string
  learningStyle: string
  nodeCount: number
  progress: number | null
  status: string
  createdAt: string
}

export function CourseCard({
  title,
  description,
  level,
  weeklyHours,
  learningStyle,
  nodeCount,
  progress,
  status,
  createdAt,
}: CourseCardProps) {
  const progressLabel = progress === null ? 'Roadmap draft' : `${progress}% complete`

  return (
    <Card className='h-full rounded-2xl border-border/60 bg-card/90 shadow-sm transition-colors hover:border-primary/30'>
      <CardHeader className='space-y-4'>
        <div className='flex items-start justify-between gap-3'>
          <Badge variant='secondary' className='rounded-full px-3 py-1 text-xs font-medium'>
            {level}
          </Badge>
          <span className='text-sm font-medium text-muted-foreground'>{progressLabel}</span>
        </div>
        <div className='space-y-2'>
          <CardTitle className='text-xl leading-tight'>{title}</CardTitle>
          <p className='line-clamp-4 text-sm leading-6 text-muted-foreground'>{description}</p>
        </div>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='h-2 overflow-hidden rounded-full bg-muted'>
          <div className='h-full rounded-full bg-primary transition-[width]' style={{ width: `${progress ?? 12}%` }} />
        </div>
        <div className='flex flex-wrap gap-4 text-sm text-muted-foreground'>
          <div className='flex items-center gap-2'>
            <BookOpenIcon className='size-4' />
            <span>{nodeCount} roadmap step{nodeCount === 1 ? '' : 's'}</span>
          </div>
          <div className='flex items-center gap-2'>
            <CalendarClockIcon className='size-4' />
            <span>{weeklyHours}</span>
          </div>
          <div className='flex items-center gap-2'>
            <SparklesIcon className='size-4' />
            <span>{learningStyle}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className='flex items-center justify-between gap-3 text-sm text-muted-foreground'>
        <div className='flex items-center gap-2'>
          <CircleDashedIcon className='size-4' />
          <span>{status}</span>
        </div>
        <span>{createdAt}</span>
      </CardFooter>
    </Card>
  )
}

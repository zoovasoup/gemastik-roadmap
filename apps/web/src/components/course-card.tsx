import { Badge } from '@gemastik/ui/components/badge'
import { Button } from '@gemastik/ui/components/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@gemastik/ui/components/card'
import { BookOpenIcon, Clock3Icon, PlayCircleIcon } from 'lucide-react'

type CourseCardProps = {
  title: string
  description: string
  category: string
  lessons: number
  duration: string
  progress: number
}

export function CourseCard({
  title,
  description,
  category,
  lessons,
  duration,
  progress,
}: CourseCardProps) {
  return (
    <Card className='h-full rounded-2xl border-border/60 bg-card/90 shadow-sm transition-colors hover:border-primary/30'>
      <CardHeader className='space-y-4'>
        <div className='flex items-start justify-between gap-3'>
          <Badge variant='secondary' className='rounded-full px-3 py-1 text-xs font-medium'>
            {category}
          </Badge>
          <span className='text-sm font-medium text-muted-foreground'>{progress}% complete</span>
        </div>
        <div className='space-y-2'>
          <CardTitle className='text-xl leading-tight'>{title}</CardTitle>
          <CardDescription className='line-clamp-3 text-sm leading-6'>{description}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='h-2 overflow-hidden rounded-full bg-muted'>
          <div className='h-full rounded-full bg-primary transition-[width]' style={{ width: `${progress}%` }} />
        </div>
        <div className='flex flex-wrap gap-4 text-sm text-muted-foreground'>
          <div className='flex items-center gap-2'>
            <BookOpenIcon className='size-4' />
            <span>{lessons} lessons</span>
          </div>
          <div className='flex items-center gap-2'>
            <Clock3Icon className='size-4' />
            <span>{duration}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button className='w-full rounded-xl'>
          <PlayCircleIcon className='size-4' />
          Continue course
        </Button>
      </CardFooter>
    </Card>
  )
}

import { CourseCard } from '@/components/course-card'

const courses = [
  {
    title: 'Full-Stack Product Design',
    description: 'Build product intuition, wireframe fast, and ship polished interfaces that match real engineering constraints.',
    category: 'Design',
    lessons: 18,
    duration: '6h 20m',
    progress: 72,
  },
  {
    title: 'Modern TypeScript Patterns',
    description: 'Strengthen your TypeScript fundamentals with practical patterns for APIs, forms, validation, and shared packages.',
    category: 'Development',
    lessons: 24,
    duration: '8h 10m',
    progress: 46,
  },
  {
    title: 'Data Storytelling for Teams',
    description: 'Learn how to structure metrics, charts, and narratives so your dashboard communicates direction instead of just numbers.',
    category: 'Analytics',
    lessons: 12,
    duration: '4h 45m',
    progress: 88,
  },
  {
    title: 'Launch Strategy Essentials',
    description: 'Create a repeatable plan for rollout, onboarding, adoption tracking, and post-launch iteration.',
    category: 'Strategy',
    lessons: 15,
    duration: '5h 05m',
    progress: 31,
  },
] as const

export function SectionCards() {
  return (
    <div className='grid grid-cols-1 gap-4 px-4 lg:px-6 xl:grid-cols-2 2xl:grid-cols-4'>
      {courses.map((course) => (
        <CourseCard key={course.title} {...course} />
      ))}
    </div>
  )
}

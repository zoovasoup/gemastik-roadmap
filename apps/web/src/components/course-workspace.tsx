'use client'

import * as React from 'react'

import type { UseQueryResult } from '@tanstack/react-query'
import Link from 'next/link'

import { useTRPC } from '@/utils/trpc'
import { Badge } from '@gemastik/ui/components/badge'
import { Button } from '@gemastik/ui/components/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@gemastik/ui/components/card'
import { Skeleton } from '@gemastik/ui/components/skeleton'
import { useMutation, useQuery } from '@tanstack/react-query'
import {
  ArrowLeftIcon,
  BookOpenIcon,
  CircleCheckBigIcon,
  CircleDashedIcon,
  Clock3Icon,
  SendIcon,
  SparklesIcon,
} from 'lucide-react'
import { toast } from 'sonner'

type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
}

type CourseNode = {
  id: string
  title: string
  contentType: string
  estimatedTime: number
  successCriteria: string[]
  difficultyLevel: number
  isCompleted: boolean
}

type CourseDetail = {
  id: string
  goalDescription: string
  metadata: {
    onboarding?: {
      topic: string
      level: string
      goal: string
      weeklyHours: string
      learningStyle: string
    }
  } | null
  nodes: CourseNode[]
}

type TutorInput = {
  roadmapId: string
  nodeId: string
  messages: ChatMessage[]
}

function getDifficultyLabel(level: number) {
  if (level <= 3) return 'Easy'
  if (level <= 7) return 'Medium'
  return 'Advanced'
}

function getNodeOverview(node: {
  title: string
  contentType: string
  difficultyLevel: number
  estimatedTime: number
  successCriteria: string[]
}) {
  return {
    whyItMatters: `This step focuses on ${node.title.toLowerCase()} so you can move your roadmap forward with a concrete ${node.contentType} activity instead of staying at the planning stage.`,
    studyApproach: `Set aside about ${node.estimatedTime} minutes, keep the scope narrow, and aim to finish one clear outcome before jumping to the next roadmap node.`,
    coachingPrompt: `If you get stuck, ask the tutor to explain ${node.title.toLowerCase()} in simpler terms, give an example, or suggest a smaller first step.`,
  }
}

function getTutorIntro(nodeTitle: string) {
  return `Ask me anything about ${nodeTitle}. I can explain the concept, suggest a study path, or help you break the work into smaller steps.`
}

export function CourseWorkspace({ courseId }: { courseId: string }) {
  const trpc = useTRPC()
  const courseQuery = useQuery(trpc.learning.getById.queryOptions({ id: courseId })) as UseQueryResult<CourseDetail, Error>
  const [selectedNodeId, setSelectedNodeId] = React.useState<string | null>(null)
  const [draftMessage, setDraftMessage] = React.useState('')
  const [threads, setThreads] = React.useState<Record<string, ChatMessage[]>>({})

  const tutorChat = useMutation(trpc.learning.askTutor.mutationOptions())

  React.useEffect(() => {
    if (!courseQuery.data || selectedNodeId) {
      return
    }

    const nextNode = courseQuery.data.nodes.find((node) => !node.isCompleted) ?? courseQuery.data.nodes[0]
    setSelectedNodeId(nextNode?.id ?? null)
  }, [courseQuery.data, selectedNodeId])

  if (courseQuery.isPending) {
    return (
      <div className='flex flex-1 flex-col gap-4 px-4 py-4 lg:px-6 md:py-6'>
        <Skeleton className='h-8 w-56' />
        <div className='grid gap-4 xl:grid-cols-[18rem_minmax(0,1fr)_24rem]'>
          <Skeleton className='h-[28rem] w-full' />
          <Skeleton className='h-[28rem] w-full' />
          <Skeleton className='h-[28rem] w-full' />
        </div>
      </div>
    )
  }

  if (courseQuery.isError) {
    return (
      <div className='flex flex-1 flex-col gap-4 px-4 py-4 lg:px-6 md:py-6'>
        <Link href='/dashboard' className='inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground'>
          <ArrowLeftIcon className='size-4' />
          Back to dashboard
        </Link>
        <Card className='border-destructive/40'>
          <CardHeader>
            <CardTitle>Unable to load this course</CardTitle>
            <CardDescription>{courseQuery.error.message}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  const course = courseQuery.data
  const onboarding = course.metadata?.onboarding
  const selectedNode = course.nodes.find((node) => node.id === selectedNodeId) ?? course.nodes[0] ?? null
  const completedCount = course.nodes.filter((node) => node.isCompleted).length
  const progress = course.nodes.length > 0 ? Math.round((completedCount / course.nodes.length) * 100) : 0
  const nodeOverview = selectedNode ? getNodeOverview(selectedNode) : null
  const visibleMessages = selectedNode
    ? threads[selectedNode.id] ?? [{ role: 'assistant' as const, content: getTutorIntro(selectedNode.title) }]
    : [{ role: 'assistant' as const, content: 'This course is still a draft. Once roadmap steps exist, the tutor can discuss a selected node.' }]

  const handleSendMessage = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!selectedNode || tutorChat.isPending) {
      return
    }

    const message = draftMessage.trim()
    if (!message) {
      return
    }

    const nextMessages = [...(threads[selectedNode.id] ?? []), { role: 'user' as const, content: message }]
    setThreads((current) => ({
      ...current,
      [selectedNode.id]: nextMessages,
    }))
    setDraftMessage('')

    void tutorChat
      .mutateAsync({
        roadmapId: course.id,
        nodeId: selectedNode.id,
        messages: nextMessages,
      })
      .then((result) => {
        setThreads((current) => ({
          ...current,
          [selectedNode.id]: [...(current[selectedNode.id] ?? []), { role: 'assistant', content: result.answer }],
        }))
      })
      .catch((error: Error) => {
        toast.error(error.message)
        setThreads((current) => ({
          ...current,
          [selectedNode.id]: [
            ...(current[selectedNode.id] ?? []),
            {
              role: 'assistant',
              content: 'I hit an error while generating a tutor response. Please try again.',
            },
          ],
        }))
      })
  }

  return (
    <div className='flex flex-1 flex-col gap-4 px-4 py-4 lg:px-6 md:py-6'>
      <div className='flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between'>
        <div className='space-y-2'>
          <Link href='/dashboard' className='inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground'>
            <ArrowLeftIcon className='size-4' />
            Back to dashboard
          </Link>
          <div>
            <h1 className='text-2xl font-semibold tracking-tight'>{onboarding?.topic ?? course.goalDescription}</h1>
            <p className='text-sm text-muted-foreground'>{course.goalDescription}</p>
          </div>
        </div>
        <div className='flex flex-wrap items-center gap-2 text-xs text-muted-foreground'>
          <Badge variant='secondary'>{onboarding?.level ?? 'Custom roadmap'}</Badge>
          <Badge variant='secondary'>{progress}% complete</Badge>
          <Badge variant='secondary'>{course.nodes.length} steps</Badge>
        </div>
      </div>

      <div className='grid gap-4 xl:grid-cols-[18rem_minmax(0,1fr)_24rem]'>
        <Card className='xl:max-h-[calc(100vh-11rem)] xl:overflow-y-auto'>
          <CardHeader>
            <CardTitle>Full roadmap</CardTitle>
            <CardDescription>Pick a step to inspect the lesson brief and ask the tutor focused questions.</CardDescription>
          </CardHeader>
          <CardContent className='space-y-2'>
            {course.nodes.length === 0 ? (
              <div className='rounded-none border border-dashed px-3 py-4 text-sm text-muted-foreground'>
                This course is saved, but its roadmap is still in draft mode.
              </div>
            ) : (
              course.nodes.map((node, index) => {
                const isSelected = node.id === selectedNode?.id

                return (
                  <button
                    key={node.id}
                    type='button'
                    onClick={() => setSelectedNodeId(node.id)}
                    className={`flex w-full flex-col gap-2 border px-3 py-3 text-left transition-colors ${isSelected ? 'border-primary bg-primary/5' : 'border-border/70 hover:border-primary/40 hover:bg-muted/40'}`}
                  >
                    <div className='flex items-start justify-between gap-3'>
                      <div>
                        <p className='text-[11px] uppercase tracking-[0.2em] text-muted-foreground'>Step {index + 1}</p>
                        <p className='mt-1 text-sm font-medium text-foreground'>{node.title}</p>
                      </div>
                      {node.isCompleted ? <CircleCheckBigIcon className='mt-0.5 size-4 text-primary' /> : <CircleDashedIcon className='mt-0.5 size-4 text-muted-foreground' />}
                    </div>
                    <div className='flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground'>
                      <span>{node.contentType}</span>
                      <span>•</span>
                      <span>{node.estimatedTime} min</span>
                      <span>•</span>
                      <span>{getDifficultyLabel(node.difficultyLevel)}</span>
                    </div>
                  </button>
                )
              })
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Node content</CardTitle>
            <CardDescription>
              {selectedNode ? 'A focused brief built from the saved roadmap node.' : 'Select a roadmap step to see its lesson brief.'}
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-6'>
            {selectedNode && nodeOverview ? (
              <>
                <div className='space-y-3 border-b pb-4'>
                  <div className='flex flex-wrap items-center gap-2'>
                    <Badge variant='secondary'>{selectedNode.contentType}</Badge>
                    <Badge variant='secondary'>{selectedNode.estimatedTime} min</Badge>
                    <Badge variant='secondary'>{getDifficultyLabel(selectedNode.difficultyLevel)}</Badge>
                  </div>
                  <div>
                    <h2 className='text-lg font-semibold'>{selectedNode.title}</h2>
                    <p className='mt-2 text-sm leading-6 text-muted-foreground'>{nodeOverview.whyItMatters}</p>
                  </div>
                </div>

                <div className='grid gap-4 lg:grid-cols-2'>
                  <div className='space-y-2 border p-4'>
                    <div className='flex items-center gap-2 text-sm font-medium'>
                      <BookOpenIcon className='size-4' />
                      Study approach
                    </div>
                    <p className='text-sm leading-6 text-muted-foreground'>{nodeOverview.studyApproach}</p>
                  </div>
                  <div className='space-y-2 border p-4'>
                    <div className='flex items-center gap-2 text-sm font-medium'>
                      <SparklesIcon className='size-4' />
                      Tutor prompt
                    </div>
                    <p className='text-sm leading-6 text-muted-foreground'>{nodeOverview.coachingPrompt}</p>
                  </div>
                </div>

                <div className='space-y-3'>
                  <h3 className='text-sm font-medium'>Success criteria</h3>
                  <div className='space-y-2'>
                    {selectedNode.successCriteria.map((criterion) => (
                      <div key={criterion} className='flex items-start gap-2 border px-3 py-3 text-sm text-muted-foreground'>
                        <CircleCheckBigIcon className='mt-0.5 size-4 text-primary' />
                        <span>{criterion}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className='rounded-none border border-dashed px-4 py-8 text-sm text-muted-foreground'>
                This course does not have roadmap nodes yet. Open the dashboard later after the roadmap is generated.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className='xl:max-h-[calc(100vh-11rem)] xl:overflow-y-auto'>
          <CardHeader>
            <CardTitle>Learning tutor</CardTitle>
            <CardDescription>
              {selectedNode ? 'Ask for explanations, examples, or a smaller next step.' : 'The tutor becomes available once a roadmap step is selected.'}
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='space-y-3'>
              {visibleMessages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[90%] whitespace-pre-wrap border px-3 py-2 text-sm leading-6 ${message.role === 'user' ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-muted/40 text-foreground'}`}
                  >
                    {message.content}
                  </div>
                </div>
              ))}

              {tutorChat.isPending && selectedNode ? (
                <div className='flex justify-start'>
                  <div className='max-w-[90%] border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground'>
                    Thinking through {selectedNode.title.toLowerCase()}...
                  </div>
                </div>
              ) : null}
            </div>

            <form onSubmit={handleSendMessage} className='space-y-3 border-t pt-4'>
              <label htmlFor='tutor-message' className='text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground'>
                Ask about this step
              </label>
              <textarea
                id='tutor-message'
                value={draftMessage}
                onChange={(event) => setDraftMessage(event.target.value)}
                placeholder={selectedNode ? `Ask about ${selectedNode.title}...` : 'Select a roadmap node first'}
                disabled={!selectedNode || tutorChat.isPending}
                className='min-h-28 w-full resize-y rounded-none border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-ring disabled:cursor-not-allowed disabled:opacity-50'
              />
              <div className='flex items-center justify-between gap-3 text-xs text-muted-foreground'>
                <div className='flex items-center gap-2'>
                  <Clock3Icon className='size-4' />
                  <span>{selectedNode ? `${selectedNode.estimatedTime} minute study block` : 'No active node selected'}</span>
                </div>
                <Button type='submit' disabled={!selectedNode || !draftMessage.trim() || tutorChat.isPending}>
                  <SendIcon className='size-4' />
                  Send
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

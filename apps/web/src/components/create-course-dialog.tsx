'use client'

import * as React from 'react'

import { Button } from '@gemastik/ui/components/button'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@gemastik/ui/components/drawer'
import { Input } from '@gemastik/ui/components/input'
import { useIsMobile } from '@/hooks/use-mobile'
import { toast } from 'sonner'

type AnswerKey = 'topic' | 'level' | 'goal' | 'weeklyHours' | 'learningStyle'

type BaseQuestion = {
  key: AnswerKey
  title: string
}

type TextQuestion = BaseQuestion & {
  type: 'text'
  placeholder: string
}

type OptionQuestion = BaseQuestion & {
  type: 'options'
  options: string[]
}

type Question = TextQuestion | OptionQuestion

type Answers = Record<AnswerKey, string>

const questions: Question[] = [
  {
    key: 'topic',
    title: 'What do you want to learn?',
    type: 'text',
    placeholder: 'Example: UI/UX design for mobile apps',
  },
  {
    key: 'level',
    title: 'What is your current level?',
    type: 'options',
    options: ['Beginner', 'Intermediate', 'Advanced'],
  },
  {
    key: 'goal',
    title: 'Why do you want to learn this?',
    type: 'options',
    options: ['For school', 'For work', 'To build a project', 'For personal interest', 'Other'],
  },
  {
    key: 'weeklyHours',
    title: 'How much time can you spend each week?',
    type: 'options',
    options: ['Less than 2 hours', '2-4 hours', '5-7 hours', '8+ hours'],
  },
  {
    key: 'learningStyle',
    title: 'How do you learn best?',
    type: 'options',
    options: ['Short reading lessons', 'Step-by-step practice', 'Video-style explanation', 'Projects/challenges', 'Mixed format'],
  },
]

const initialAnswers: Answers = {
  topic: '',
  level: '',
  goal: '',
  weeklyHours: '',
  learningStyle: '',
}

export function CreateCourseDialog({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile()
  const [open, setOpen] = React.useState(false)
  const [step, setStep] = React.useState(0)
  const [answers, setAnswers] = React.useState<Answers>(initialAnswers)

  const currentQuestion = questions[step]
  const currentAnswer = answers[currentQuestion.key]
  const canContinue = currentAnswer.trim().length > 0

  const reset = React.useCallback(() => {
    setStep(0)
    setAnswers(initialAnswers)
  }, [])

  const handleNext = () => {
    if (!canContinue) return

    if (step < questions.length - 1) {
      setStep((prev) => prev + 1)
      return
    }

    toast.success('Course onboarding completed', {
      description: 'UI only for now. API integration comes next.',
    })
    setOpen(false)
    reset()
  }

  const handleBack = () => {
    setStep((prev) => Math.max(0, prev - 1))
  }

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
    if (!nextOpen) {
      reset()
    }
  }

  return (
    <Drawer open={open} onOpenChange={handleOpenChange} direction={isMobile ? 'bottom' : 'right'}>
      <DrawerTrigger asChild>{children}</DrawerTrigger>
      <DrawerContent className='data-[vaul-drawer-direction=right]:sm:max-w-md'>
        <DrawerHeader>
          <DrawerTitle>Create Course</DrawerTitle>
          <DrawerDescription>
            Question {step + 1} of {questions.length}
          </DrawerDescription>
          <div className='mt-2 h-2 overflow-hidden rounded-full bg-muted'>
            <div className='h-full rounded-full bg-primary transition-[width]' style={{ width: `${((step + 1) / questions.length) * 100}%` }} />
          </div>
        </DrawerHeader>

        <div className='flex flex-1 flex-col gap-4 px-4 py-2'>
          <h3 className='text-sm font-medium'>{currentQuestion.title}</h3>

          {currentQuestion.type === 'text' ? (
            <Input
              autoFocus
              placeholder={currentQuestion.placeholder}
              value={currentAnswer}
              onChange={(event) => {
                const nextValue = event.target.value
                setAnswers((prev) => ({ ...prev, [currentQuestion.key]: nextValue }))
              }}
            />
          ) : (
            <div className='grid gap-2'>
              {currentQuestion.options.map((option) => {
                const isSelected = currentAnswer === option
                return (
                  <Button
                    key={option}
                    type='button'
                    variant={isSelected ? 'default' : 'outline'}
                    className='justify-start'
                    onClick={() => {
                      setAnswers((prev) => ({ ...prev, [currentQuestion.key]: option }))
                    }}
                  >
                    {option}
                  </Button>
                )
              })}
            </div>
          )}
        </div>

        <DrawerFooter className='pt-2'>
          <div className='flex items-center gap-2'>
            <Button type='button' variant='outline' onClick={handleBack} disabled={step === 0}>
              Back
            </Button>
            <Button type='button' className='flex-1' onClick={handleNext} disabled={!canContinue}>
              {step === questions.length - 1 ? 'Finish' : 'Next'}
            </Button>
          </div>
          <DrawerClose asChild>
            <Button type='button' variant='ghost'>
              Cancel
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}

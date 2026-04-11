'use client'

import { cn } from '@gemastik/ui/lib/utils'
import { Button } from '@gemastik/ui/components/button'
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldSeparator } from '@gemastik/ui/components/field'
import { Input } from '@gemastik/ui/components/input'
import { useForm } from '@tanstack/react-form'
import z from 'zod'
import { toast } from 'sonner'

import { authClient } from '@/lib/auth-client'

export function SignupForm({ className, ...props }: React.ComponentProps<'form'>) {
  const form = useForm({
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
    validators: {
      onSubmit: z
        .object({
          name: z.string().min(2, 'Name must be at least 2 characters'),
          email: z.string().email('Invalid email address'),
          password: z.string().min(8, 'Password must be at least 8 characters'),
          confirmPassword: z.string().min(8, 'Password must be at least 8 characters'),
        })
        .refine((value) => value.password === value.confirmPassword, {
          path: ['confirmPassword'],
          message: 'Passwords do not match',
        }),
    },
    onSubmit: async ({ value }) => {
      await authClient.signUp.email(
        {
          name: value.name,
          email: value.email,
          password: value.password,
        },
        {
          onSuccess: () => {
            toast.success('Account created successfully')
            window.location.assign('/dashboard')
          },
          onError: (error) => {
            toast.error(error.error.message || error.error.statusText)
          },
        },
      )
    },
  })

  return (
    <form
      className={cn('flex flex-col gap-6', className)}
      onSubmit={(e) => {
        e.preventDefault()
        e.stopPropagation()
        form.handleSubmit()
      }}
      {...props}
    >
      <FieldGroup>
        <div className='flex flex-col items-center gap-1 text-center'>
          <h1 className='text-2xl font-bold'>Create your account</h1>
          <p className='text-sm text-balance text-muted-foreground'>Fill in the form below to create your account</p>
        </div>

        <form.Field name='name'>
          {(field) => (
            <Field>
              <FieldLabel htmlFor={field.name}>Full Name</FieldLabel>
              <Input
                id={field.name}
                name={field.name}
                type='text'
                placeholder='John Doe'
                required
                className='bg-background'
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
              />
              {field.state.meta.errors.map((error, index) => (
                <FieldDescription key={index} className='text-red-500'>
                  {error?.message}
                </FieldDescription>
              ))}
            </Field>
          )}
        </form.Field>

        <form.Field name='email'>
          {(field) => (
            <Field>
              <FieldLabel htmlFor={field.name}>Email</FieldLabel>
              <Input
                id={field.name}
                name={field.name}
                type='email'
                placeholder='m@example.com'
                required
                className='bg-background'
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
              />
              <FieldDescription>We&apos;ll use this to contact you. We will not share your email with anyone else.</FieldDescription>
              {field.state.meta.errors.map((error, index) => (
                <FieldDescription key={index} className='text-red-500'>
                  {error?.message}
                </FieldDescription>
              ))}
            </Field>
          )}
        </form.Field>

        <form.Field name='password'>
          {(field) => (
            <Field>
              <FieldLabel htmlFor={field.name}>Password</FieldLabel>
              <Input
                id={field.name}
                name={field.name}
                type='password'
                required
                className='bg-background'
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
              />
              <FieldDescription>Must be at least 8 characters long.</FieldDescription>
              {field.state.meta.errors.map((error, index) => (
                <FieldDescription key={index} className='text-red-500'>
                  {error?.message}
                </FieldDescription>
              ))}
            </Field>
          )}
        </form.Field>

        <form.Field name='confirmPassword'>
          {(field) => (
            <Field>
              <FieldLabel htmlFor={field.name}>Confirm Password</FieldLabel>
              <Input
                id={field.name}
                name={field.name}
                type='password'
                required
                className='bg-background'
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
              />
              <FieldDescription>Please confirm your password.</FieldDescription>
              {field.state.meta.errors.map((error, index) => (
                <FieldDescription key={index} className='text-red-500'>
                  {error?.message}
                </FieldDescription>
              ))}
            </Field>
          )}
        </form.Field>

        <form.Subscribe
          selector={(state) => ({
            canSubmit: state.canSubmit,
            isSubmitting: state.isSubmitting,
          })}
        >
          {({ canSubmit, isSubmitting }) => (
            <Field>
              <Button type='submit' disabled={!canSubmit || isSubmitting}>
                {isSubmitting ? 'Creating account...' : 'Create Account'}
              </Button>
            </Field>
          )}
        </form.Subscribe>

        <FieldSeparator>Or continue with</FieldSeparator>

        <Field>
          <Button variant='outline' type='button' disabled>
            <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'>
              <path
                d='M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12'
                fill='currentColor'
              />
            </svg>
            Sign up with GitHub
          </Button>
          <FieldDescription className='px-6 text-center'>
            Already have an account? <a href='/login'>Sign in</a>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  )
}

'use client'

import { Button } from '@gemastik/ui/components/button'
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldSeparator } from '@gemastik/ui/components/field'
import { Input } from '@gemastik/ui/components/input'
import { useForm } from '@tanstack/react-form'
import z from 'zod'
import { authClient } from '@/lib/auth-client'
import { toast } from 'sonner'

export function LoginForm({ className, ...props }: React.ComponentProps<'form'>) {
  const form = useForm({
    defaultValues: {
      email: '',
      password: '',
    },
    validators: {
      onSubmit: z.object({
        email: z.string().email('Invalid email address'),
        password: z.string().min(8, 'Password must be at least 8 characters'),
      }),
    },
    onSubmit: async ({ value }) => {
      await authClient.signIn.email(
        {
          email: value.email,
          password: value.password,
        },
        {
          onSuccess: () => {
            toast.success('Login successful')
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
      className={className}
      onSubmit={(e) => {
        e.preventDefault()
        e.stopPropagation()
        form.handleSubmit()
      }}
      {...props}
    >
      <FieldGroup>
        <div className='flex flex-col items-center gap-1 text-center'>
          <h1 className='text-2xl font-bold'>Login to your account</h1>
          <p className='text-sm text-balance text-muted-foreground'>Enter your email below to login to your account</p>
        </div>

        <form.Field name='email'>
          {(field) => (
            <Field>
              <FieldLabel htmlFor={field.name}>Email</FieldLabel>
              <Input
                id={field.name}
                name={field.name}
                type='email'
                placeholder='m@example.com'
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                required
              />
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
              <div className='flex items-center'>
                <FieldLabel htmlFor={field.name}>Password</FieldLabel>
              </div>
              <Input
                id={field.name}
                name={field.name}
                type='password'
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                required
              />
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
                {isSubmitting ? 'Logging in...' : 'Login'}
              </Button>
            </Field>
          )}
        </form.Subscribe>

        <FieldSeparator>Or continue with</FieldSeparator>

        <Field>
          <Button variant='outline' type='button' disabled>
            Login with GitHub
          </Button>
          <FieldDescription className='text-center'>
            Don&apos;t have an account?{' '}
            <a href='/signup' className='underline underline-offset-4'>
              Sign up
            </a>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  )
}

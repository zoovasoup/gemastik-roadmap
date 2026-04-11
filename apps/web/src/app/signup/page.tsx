import { SignupForm } from '@/components/signup-form'
import { auth } from '@gemastik/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function SignupPage() {
  const session = await auth.api.getSession({ headers: await headers() })

  if (session?.user) {
    redirect('/dashboard')
  }

  return (
    <div className='mx-auto w-full max-w-md py-10'>
      <SignupForm />
    </div>
  )
}

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@gemastik/ui/components/card'

export default function DashboardSettingsPage() {
  return (
    <div className='flex min-h-0 flex-1 flex-col gap-6 px-4 py-4 lg:px-6 md:py-6'>
      <div>
        <h1 className='text-2xl font-semibold tracking-tight'>Settings</h1>
        <p className='text-sm text-muted-foreground'>Learner preferences and sidebar customization will live here.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sidebar preferences</CardTitle>
          <CardDescription>
            The sidebar is now resolved from code and can be personalized per learner through stored preferences.
          </CardDescription>
        </CardHeader>
        <CardContent className='text-sm text-muted-foreground'>
          Preference controls are not exposed in the UI yet, but the database and API support is now in place.
        </CardContent>
      </Card>
    </div>
  )
}

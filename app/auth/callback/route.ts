import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Ensure a broker record exists for this user
      const { data: { user } } = await supabase.auth.getUser()
      let redirectTo = next
      
      if (user) {
        const { data: existingBroker } = await supabase
          .from('brokers')
          .select('id, notification_preference, inbound_handle')
          .eq('auth_user_id', user.id)
          .single()

        if (!existingBroker) {
          // Create broker profile from Google identity
          await supabase.from('brokers').insert({
            auth_user_id: user.id,
            name: user.user_metadata?.full_name ?? user.email ?? 'Broker',
            email: user.email ?? '',
          } as any)
          // New broker - send to onboarding
          redirectTo = '/dashboard/onboarding'
        } else if (!existingBroker.notification_preference || !existingBroker.inbound_handle) {
          // Existing broker missing notification preference or forwarding address - send to onboarding
          redirectTo = '/dashboard/onboarding'
        }
      }

      const forwardedHost = request.headers.get('x-forwarded-host')
      const isLocalEnv = process.env.NODE_ENV === 'development'

      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${redirectTo}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${redirectTo}`)
      } else {
        return NextResponse.redirect(`${origin}${redirectTo}`)
      }
    }
  }

  // Return to login with error (e.g. user denied Google consent)
  return NextResponse.redirect(`${origin}/auth/login?error=auth_callback_failed`)
}

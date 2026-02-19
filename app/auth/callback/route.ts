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
      if (user) {
        const { data: existingBroker } = await supabase
          .from('brokers')
          .select('id')
          .eq('auth_user_id', user.id)
          .single()

        if (!existingBroker) {
          // Create broker profile from Google identity
          await supabase.from('brokers').insert({
            auth_user_id: user.id,
            name: user.user_metadata?.full_name ?? user.email ?? 'Broker',
            email: user.email ?? '',
          })
        }
      }

      const forwardedHost = request.headers.get('x-forwarded-host')
      const isLocalEnv = process.env.NODE_ENV === 'development'

      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        return NextResponse.redirect(`${origin}${next}`)
      }
    }
  }

  // Return to home with error
  return NextResponse.redirect(`${origin}/?error=auth_callback_failed`)
}

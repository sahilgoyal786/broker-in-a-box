import OnboardingFlow from './onboarding-flow'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Onboarding',
}

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let address: string | null = null
  if (user) {
    const { data: broker } = await supabase
      .from('brokers')
      .select('submission_address')
      .eq('auth_user_id', user.id)
      .single()
    address = (broker as any)?.submission_address ?? null
  }

  return <OnboardingFlow initialAddress={address} />
}

import NotificationPreference from './notification-preference'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Onboarding',
}

export default function OnboardingPage() {
  return <NotificationPreference />
}

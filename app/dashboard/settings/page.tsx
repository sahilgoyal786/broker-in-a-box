import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SettingsForm from './settings-form'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: broker } = await supabase
    .from('brokers')
    .select('id, name, email, gmail_transactions_email, gmail_refresh_token')
    .eq('auth_user_id', user.id)
    .single()

  if (!broker) redirect('/auth/login')

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-slate-400 mt-1">Manage your brokerage profile and integrations.</p>
      </div>

      <SettingsForm broker={broker} />
    </div>
  )
}

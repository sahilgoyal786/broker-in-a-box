import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import NewAgencyForm from './new-agency-form'

export default async function NewAgencyPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: broker } = await supabase
    .from('brokers')
    .select('id')
    .eq('auth_user_id', user.id)
    .single() as any

  if (!broker) redirect('/auth/login')

  const { data: agents } = await supabase
    .from('agents')
    .select('*')
    .eq('broker_id', broker.id)
    .order('first_name') as any

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">New Agency Agreement</h1>
      <NewAgencyForm brokerId={broker.id} agents={agents || []} />
    </div>
  )
}

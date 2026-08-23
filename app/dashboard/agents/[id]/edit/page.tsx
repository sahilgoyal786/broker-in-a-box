import { createClient } from '@/lib/supabase/server'
import { getUserContext } from '@/lib/supabase/get-user-role'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import EditAgentForm from './edit-agent-form'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Edit Agent',
}

export default async function EditAgentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const userContext = await getUserContext()
  const supabase = await createClient()

  // Only broker can edit agent details
  if (!userContext || userContext.role !== 'broker') {
    redirect('/dashboard')
  }

  const { data: broker } = await supabase
    .from('brokers')
    .select('id')
    .eq('auth_user_id', userContext.userId)
    .single() as any

  const { data: agent } = await supabase
    .from('agents')
    .select('*')
    .eq('id', id)
    .eq('broker_id', broker?.id)
    .single() as any

  if (!agent) notFound()

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <Link
        href={`/dashboard/agents/${id}`}
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Agent Profile
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Edit Agent Profile
        </h1>
        <p className="text-gray-600 mt-1">
          {agent.first_name} {agent.last_name}
        </p>
      </div>

      <EditAgentForm agent={agent} />
    </div>
  )
}

import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import InviteAcceptForm from './invite-accept-form'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Accept Invite',
}

export default async function InviteAcceptPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase = createAdminClient()

  // Look up invite by token
  const { data: agent } = await supabase
    .from('agents')
    .select('id, first_name, last_name, email, broker_id, invite_status, brokers(name)')
    .eq('invite_token', token)
    .single() as any

  // Invalid token or agent not found
  if (!agent) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 rounded-xl border border-slate-800 p-8 text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Invalid Invite Link</h1>
          <p className="text-slate-400 mb-6">
            This invite link is invalid or has expired. Please contact your broker for a new invitation.
          </p>
        </div>
      </div>
    )
  }

  // Already activated
  if (agent.invite_status === 'active') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 rounded-xl border border-slate-800 p-8 text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Already Activated</h1>
          <p className="text-slate-400 mb-6">
            Your account is already active. You can log in now.
          </p>
          <a
            href="/auth/login"
            className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-colors"
          >
            Go to Login
          </a>
        </div>
      </div>
    )
  }

  // Show password setup form
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 rounded-xl border border-slate-800 p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">Welcome to Broker in a Box</h1>
          <p className="text-slate-400 text-sm">
            {agent.brokers?.name || 'Your broker'} has invited you to join their transaction portal
          </p>
        </div>

        <div className="mb-6 p-4 bg-slate-800 rounded-lg">
          <p className="text-sm text-slate-400 mb-1">Setting up account for:</p>
          <p className="text-white font-semibold">{agent.first_name} {agent.last_name}</p>
          <p className="text-slate-400 text-sm">{agent.email}</p>
        </div>

        <InviteAcceptForm 
          token={token} 
          agentId={agent.id}
          email={agent.email}
        />
      </div>
    </div>
  )
}

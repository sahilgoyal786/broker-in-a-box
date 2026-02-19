import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, Users } from 'lucide-react'

export default async function AgentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: broker } = await supabase
    .from('brokers')
    .select('id')
    .eq('auth_user_id', user!.id)
    .single() as any

  const { data: agents } = await supabase
    .from('agents')
    .select('id, first_name, last_name, email, license_number')
    .eq('broker_id', broker?.id ?? '')
    .order('last_name', { ascending: true })

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Agents</h1>
          <p className="text-slate-400 mt-1">{agents?.length ?? 0} agent{(agents?.length ?? 0) !== 1 ? 's' : ''} on your roster</p>
        </div>
        <Link
          href="/dashboard/agents/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Agent
        </Link>
      </div>

      {!agents || agents.length === 0 ? (
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-16 text-center">
          <Users className="w-10 h-10 text-slate-600 mx-auto mb-4" />
          <h3 className="text-white font-semibold mb-2">No agents yet</h3>
          <p className="text-slate-400 text-sm mb-6">
            Add your agents to assign them to transactions.
          </p>
          <Link
            href="/dashboard/agents/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Agent
          </Link>
        </div>
      ) : (
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left px-6 py-3 text-slate-400 text-xs font-semibold uppercase tracking-wider">Name</th>
                <th className="text-left px-6 py-3 text-slate-400 text-xs font-semibold uppercase tracking-wider">Email</th>
                <th className="text-left px-6 py-3 text-slate-400 text-xs font-semibold uppercase tracking-wider">License #</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {agents.map(agent => (
                <tr key={agent.id} className="hover:bg-slate-700/40 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-white font-medium text-sm">
                      {agent.last_name}, {agent.first_name}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-slate-300 text-sm">{agent.email}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-slate-400 text-sm">
                      {agent.license_number ?? <span className="text-slate-600 italic">Not set</span>}
                    </p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { LayoutDashboard, FileText, Users, Settings, LogOut, Shield, User, Home } from 'lucide-react'
import { getUserContext } from '@/lib/supabase/get-user-role'
import AgentSwitcher from './agent-switcher'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/')

  // Get user context (role and name)
  const userContext = await getUserContext()
  if (!userContext) redirect('/')

  const { data: broker } = await supabase
    .from('brokers')
    .select('id, name, email')
    .eq('auth_user_id', user.id)
    .single() as any
    
  // Get agent name if user is an agent
  const { data: agent } = userContext.role === 'agent' ? await supabase
    .from('agents')
    .select('first_name, last_name')
    .eq('id', userContext.agentId)
    .single() as any : { data: null }

  // Get all agents for broker's agent switcher
  const { data: agents } = userContext.role === 'broker' ? await supabase
    .from('agents')
    .select('id, first_name, last_name')
    .eq('broker_id', userContext.brokerId)
    .order('last_name') as any : { data: [] }
    
  const displayName = userContext.role === 'broker' 
    ? (broker?.name ?? user.email)
    : agent 
      ? `${agent.first_name} ${agent.last_name}`
      : user.email

  const navItems = [
    { href: '/dashboard', label: 'Overview', icon: LayoutDashboard, roles: ['broker', 'agent'] },
    { href: '/dashboard/agencies', label: 'Agency Agreements', icon: FileText, roles: ['broker', 'agent'] },
    { href: '/dashboard/transactions', label: 'Transactions', icon: FileText, roles: ['broker', 'agent'] },
    { href: '/dashboard/agents', label: 'Agents', icon: Users, roles: ['broker'] },  // Broker only
    { href: '/dashboard/profile', label: 'Profile', icon: User, roles: ['agent'] },  // Agent only
    { href: '/dashboard/settings', label: 'Settings', icon: Settings, roles: ['broker'] },  // Broker only
  ].filter(item => item.roles.includes(userContext.role))

  return (
    <div className="min-h-screen bg-white flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
              userContext.role === 'broker' ? 'bg-blue-600' : 'bg-purple-600'
            }`}>
              {userContext.role === 'broker' ? (
                <Shield className="w-4 h-4 text-white" />
              ) : (
                <User className="w-4 h-4 text-white" />
              )}
            </div>
            <div>
              <p className="text-white font-semibold text-sm">{displayName}</p>
              <p className={`text-xs truncate max-w-[140px] ${
                userContext.role === 'broker' ? 'text-blue-400' : 'text-purple-400'
              }`}>
                {userContext.role === 'broker' ? 'Broker' : 'Agent'}
              </p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-white hover:bg-slate-800 transition-colors text-sm group"
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </Link>
          ))}
        </nav>

        {/* Sign out */}
        <div className="p-4 border-t border-slate-800">
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-white hover:bg-slate-800 transition-colors text-sm"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto flex flex-col">
        {/* Header with agent switcher */}
        {userContext.role === 'broker' && agents && agents.length > 0 && (
          <div className="bg-white border-b border-gray-200 px-8 py-4 flex justify-end">
            <AgentSwitcher agents={agents} currentRole={userContext.role} />
          </div>
        )}
        
        {/* Page content */}
        <div className="flex-1">
          {children}
        </div>
      </main>
    </div>
  )
}

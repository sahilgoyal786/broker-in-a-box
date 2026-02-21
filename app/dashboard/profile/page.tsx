import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getUserContext } from '@/lib/supabase/get-user-role'
import ProfileForm from './profile-form'
import { User, Mail, Phone, CreditCard, Calendar, GraduationCap, Building } from 'lucide-react'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) redirect('/auth/login')

  const userContext = await getUserContext()
  if (!userContext) redirect('/auth/login')

  let profileData: any = {}
  let isAgent = userContext.role === 'agent'

  if (isAgent) {
    // Get agent data
    const { data: agent } = await supabase
      .from('agents')
      .select('*, brokers(name)')
      .eq('auth_user_id', user.id)
      .single() as any
    
    if (!agent) redirect('/auth/login')
    profileData = agent
  } else {
    // Get broker data
    const { data: broker } = await supabase
      .from('brokers')
      .select('*')
      .eq('auth_user_id', user.id)
      .single() as any
    
    if (!broker) redirect('/auth/login')
    profileData = broker
  }

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Profile</h1>
        <p className="text-slate-400 mt-1">
          {isAgent ? 'Manage your agent profile and account settings' : 'Manage your broker profile and account settings'}
        </p>
      </div>

      {isAgent ? (
        <div className="space-y-6">
          {/* Personal Information */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
            <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-400" />
              Personal Information
            </h2>
            
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">First Name</label>
                <div className="px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white">
                  {profileData.first_name}
                </div>
                <p className="text-xs text-slate-500 mt-1">Managed by your broker</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Last Name</label>
                <div className="px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white">
                  {profileData.last_name}
                </div>
                <p className="text-xs text-slate-500 mt-1">Managed by your broker</p>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
            <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <Mail className="w-5 h-5 text-blue-400" />
              Contact Information
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Email</label>
                <div className="px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white flex items-center gap-2">
                  <Mail className="w-4 h-4 text-slate-400" />
                  {profileData.email}
                </div>
                <p className="text-xs text-slate-500 mt-1">Your login email address</p>
              </div>

              <ProfileForm 
                agentId={profileData.id} 
                currentPhone={profileData.phone || ''}
              />
            </div>
          </div>

          {/* License Information */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
            <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-blue-400" />
              License Information
            </h2>
            
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">License Number</label>
                <div className="px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white">
                  {profileData.license_number || '—'}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">License Expiration</label>
                <div className="px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  {profileData.license_expiration 
                    ? new Date(profileData.license_expiration).toLocaleDateString()
                    : '—'
                  }
                </div>
                {profileData.license_expiration && (() => {
                  const daysUntil = Math.ceil((new Date(profileData.license_expiration).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                  if (daysUntil < 45) {
                    return (
                      <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                        ⚠️ Expiring soon - complete CE requirements
                      </p>
                    )
                  }
                })()}
              </div>
            </div>
          </div>

          {/* CE Compliance */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
            <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-blue-400" />
              CE Compliance
            </h2>
            
            <div className="grid grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Core Hours</label>
                <div className="px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white">
                  {profileData.ce_hours_core || 0} / 9
                </div>
                <p className="text-xs text-slate-500 mt-1">Core CE hours completed</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Elective Hours</label>
                <div className="px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white">
                  {profileData.ce_hours_other || 0} / 9
                </div>
                <p className="text-xs text-slate-500 mt-1">Elective CE hours completed</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Mandatory Course</label>
                <div className={`px-4 py-2.5 border rounded-lg text-white flex items-center justify-center ${
                  profileData.mandatory_course_completed 
                    ? 'bg-green-500/20 border-green-500/30 text-green-400'
                    : 'bg-slate-900 border-slate-700'
                }`}>
                  {profileData.mandatory_course_completed ? '✓ Complete' : 'Not Complete'}
                </div>
              </div>
            </div>

            <div className="mt-4 p-4 bg-slate-900 rounded-lg border border-slate-700">
              <p className="text-sm text-slate-300">
                <strong>Utah Requirements:</strong> 18 total hours (9 core + 9 elective minimum, including 3-hour mandatory course)
              </p>
            </div>
          </div>

          {/* Brokerage */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
            <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <Building className="w-5 h-5 text-blue-400" />
              Brokerage
            </h2>
            
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Broker</label>
              <div className="px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white">
                {profileData.brokers?.name || '—'}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <h2 className="text-lg font-semibold text-white mb-6">Broker Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Brokerage Name</label>
              <div className="px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white">
                {profileData.name}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Email</label>
              <div className="px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white">
                {profileData.email}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

interface Agent {
  id: string;
  first_name: string;
  last_name: string;
  license_number: string;
  license_expiration: string | null;
  ce_hours_core: number;
  ce_hours_other: number;
  mandatory_course_completed: boolean;
  ce_last_updated: string | null;
}

export default async function CECompliancePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: broker } = await supabase
    .from('brokers')
    .select('id')
    .eq('auth_user_id', user!.id)
    .single() as any;

  const { data: agents, error } = await supabase
    .from('agents')
    .select('id, first_name, last_name, license_number, license_expiration, ce_hours_core, ce_hours_other, mandatory_course_completed, ce_last_updated')
    .eq('broker_id', broker?.id ?? '')
    .eq('status', 'active')
    .order('last_name') as any;

  if (error) {
    console.error('Error fetching agents:', error);
  }

  function getDaysUntilExpiration(expirationDate: string | null): number | null {
    if (!expirationDate) return null;
    const today = new Date();
    const expDate = new Date(expirationDate);
    const diffTime = expDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  const agentList = agents || [];

  // Utah CE Requirements:
  // - Total: 18 hours minimum
  // - Core: 9 hours minimum (includes 3-hour mandatory)
  // - Mandatory: 3 hours (counts as core)
  
  function isCECompliant(agent: Agent): boolean {
    const totalHours = agent.ce_hours_core + agent.ce_hours_other;
    return agent.mandatory_course_completed && 
           agent.ce_hours_core >= 9 && 
           totalHours >= 18;
  }

  const needsAttention = agentList.filter(agent => {
    const daysUntil = getDaysUntilExpiration(agent.license_expiration);
    const ceCompliant = isCECompliant(agent);
    return !ceCompliant || (daysUntil !== null && daysUntil < 60);
  });

  const compliant = agentList.filter(agent => {
    const daysUntil = getDaysUntilExpiration(agent.license_expiration);
    const ceCompliant = isCECompliant(agent);
    return ceCompliant && (daysUntil === null || daysUntil >= 60);
  });

  const missingMandatory = agentList.filter(a => !a.mandatory_course_completed).length;
  const insufficientHours = agentList.filter(a => {
    const totalHours = a.ce_hours_core + a.ce_hours_other;
    return totalHours < 18 || a.ce_hours_core < 9;
  }).length;
  const expiringSoon = agentList.filter(a => {
    const days = getDaysUntilExpiration(a.license_expiration);
    return days !== null && days < 60;
  }).length;

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">📚 CE Compliance</h1>
        <p className="text-gray-600 mt-2">
          Utah Requirements: <strong>18 total hours</strong> (minimum <strong>9 core hours</strong> including <strong>3-hour mandatory course</strong>)
        </p>
        <p className="text-gray-600 text-sm mt-1">
          {agentList[0]?.ce_last_updated 
            ? `Last updated: ${new Date(agentList[0].ce_last_updated).toLocaleDateString()}`
            : 'No CE data imported yet'}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6">
          <div className="text-red-600 text-4xl font-bold mb-2">{needsAttention.length}</div>
          <div className="text-red-800 font-semibold">Needs Attention</div>
        </div>
        
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6">
          <div className="text-yellow-600 text-4xl font-bold mb-2">{missingMandatory}</div>
          <div className="text-yellow-800 font-semibold">Missing Mandatory Course</div>
        </div>

        <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
          <div className="text-green-600 text-4xl font-bold mb-2">{compliant.length}</div>
          <div className="text-green-800 font-semibold">Compliant</div>
        </div>
      </div>

      {/* Needs Attention Table */}
      {needsAttention.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">🚨 Needs Attention ({needsAttention.length})</h2>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Agent</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">License</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expires</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">CE Hours (Core/Other/Total)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mandatory</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {needsAttention.map(agent => {
                  const daysUntil = getDaysUntilExpiration(agent.license_expiration);
                  const isExpiringSoon = daysUntil !== null && daysUntil < 60;
                  const totalHours = agent.ce_hours_core + agent.ce_hours_other;
                  const coreShort = agent.ce_hours_core < 9;
                  const totalShort = totalHours < 18;
                  
                  return (
                    <tr key={agent.id} className={isExpiringSoon ? 'bg-yellow-50' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link href={`/dashboard/agents/${agent.id}`} className="text-blue-600 hover:text-blue-800 font-medium">
                          {agent.first_name} {agent.last_name}
                          {isExpiringSoon && <span className="ml-2">🟡</span>}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {agent.license_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {agent.license_expiration 
                          ? `${new Date(agent.license_expiration).toLocaleDateString()} ${daysUntil !== null ? `(${daysUntil}d)` : ''}`
                          : 'Unknown'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={coreShort ? 'text-red-600 font-semibold' : 'text-gray-600'}>
                          {agent.ce_hours_core}
                        </span>
                        {' / '}
                        <span className="text-gray-600">{agent.ce_hours_other}</span>
                        {' / '}
                        <span className={totalShort ? 'text-red-600 font-semibold' : 'text-gray-600'}>
                          {totalHours}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {agent.mandatory_course_completed 
                          ? <span className="text-green-600 font-semibold">✅ YES</span>
                          : <span className="text-red-600 font-semibold">❌ NO</span>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button 
                          className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                          onClick={() => alert('Email reminder feature coming soon')}
                        >
                          Email Reminder
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Compliant Table */}
      {compliant.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">✅ Compliant ({compliant.length})</h2>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Agent</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">License</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expires</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">CE Hours (Core/Other/Total)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mandatory</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {compliant.map(agent => {
                  const daysUntil = getDaysUntilExpiration(agent.license_expiration);
                  const totalHours = agent.ce_hours_core + agent.ce_hours_other;
                  
                  return (
                    <tr key={agent.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link href={`/dashboard/agents/${agent.id}`} className="text-blue-600 hover:text-blue-800 font-medium">
                          {agent.first_name} {agent.last_name}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {agent.license_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {agent.license_expiration 
                          ? `${new Date(agent.license_expiration).toLocaleDateString()} ${daysUntil !== null ? `(${daysUntil}d)` : ''}`
                          : 'Unknown'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                        {agent.ce_hours_core} / {agent.ce_hours_other} / {totalHours}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-green-600 font-semibold">✅ YES</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {agentList.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No agents found</p>
        </div>
      )}
    </div>
  );
}

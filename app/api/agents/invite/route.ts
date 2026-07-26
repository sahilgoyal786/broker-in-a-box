import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { getUserContext } from '@/lib/supabase/get-user-role'
import { sendInviteEmail } from '@/lib/email/send-invite'
import { getInviteEmailTemplate } from '@/lib/email-templates/invite-agent'

type BrokerInviteContext = {
  id: string
  name: string
  email: string | null
}

type AgentInviteTarget = {
  id: string
  first_name: string
  last_name: string
  email: string
  invite_status: string | null
}

type SavedInvite = {
  id: string
  invite_token: string | null
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error'
}

export async function POST(request: Request) {
  try {
    const userContext = await getUserContext()
    
    if (!userContext || userContext.role !== 'broker') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { agentIds } = await request.json()

    if (!agentIds || !Array.isArray(agentIds) || agentIds.length === 0) {
      return NextResponse.json({ error: 'No agents selected' }, { status: 400 })
    }

    const supabase = await createClient()
    const adminSupabase = createAdminClient()

    // Get broker info
    const { data: brokerData } = await supabase
      .from('brokers')
      .select('id, name, email')
      .eq('auth_user_id', userContext.userId)
      .single()

    const broker = brokerData as BrokerInviteContext | null

    if (!broker) {
      return NextResponse.json({ error: 'Broker not found' }, { status: 404 })
    }

    // Get agents to invite
    const { data: agentsData } = await supabase
      .from('agents')
      .select('id, first_name, last_name, email, invite_status')
      .eq('broker_id', broker.id)
      .in('id', agentIds)

    const agents = agentsData as AgentInviteTarget[] | null

    if (!agents || agents.length === 0) {
      return NextResponse.json({ error: 'No valid agents found' }, { status: 404 })
    }

    // Filter out already active agents
    const invitableAgents = agents.filter((a) => a.invite_status !== 'active')

    if (invitableAgents.length === 0) {
      return NextResponse.json({ 
        error: 'All selected agents are already active',
        skipped: agents.length 
      }, { status: 400 })
    }

    const invites = []
    const errors = []

    for (const agent of invitableAgents) {
      try {
        // Generate unique invite token
        const token = generateInviteToken()
        
        // Update agent with invite token
        const { data: savedInviteData, error: updateError } = await adminSupabase
          .from('agents')
          .update({
            invite_token: token,
            invite_sent_at: new Date().toISOString(),
            invite_status: 'invited'
          })
          .eq('id', agent.id)
          .eq('broker_id', broker.id)
          .select('id, invite_token')
          .single()

        const savedInvite = savedInviteData as SavedInvite | null

        if (updateError) throw updateError
        if (!savedInvite || savedInvite.invite_token !== token) {
          throw new Error('Invite token was not saved')
        }

        // Send invite email
        const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${token}`
        const agentName = `${agent.first_name} ${agent.last_name}`
        
        const emailTemplate = getInviteEmailTemplate({
          agentName,
          brokerName: broker.name,
          inviteUrl
        })

        await sendInviteEmail({
          to: agent.email,
          subject: `You've been invited to ${broker.name}'s Transaction Portal`,
          htmlBody: emailTemplate.html,
          textBody: emailTemplate.text,
          fromName: broker.name,
          fromEmail: 'noreply@aubrey.net' // Use verified aubrey.net domain
        })

        invites.push({
          id: agent.id,
          email: agent.email,
          name: agentName
        })
      } catch (error: unknown) {
        console.error(`Failed to invite ${agent.email}:`, error)
        errors.push({
          id: agent.id,
          email: agent.email,
          error: getErrorMessage(error)
        })
      }
    }

    return NextResponse.json({
      success: true,
      invited: invites.length,
      failed: errors.length,
      invites,
      errors: errors.length > 0 ? errors : undefined
    })

  } catch (error: unknown) {
    console.error('Invite error:', error)
    return NextResponse.json({ 
      error: getErrorMessage(error) || 'Failed to send invites'
    }, { status: 500 })
  }
}

function generateInviteToken(): string {
  // Generate a secure random token
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getUserContext } from '@/lib/supabase/get-user-role'
import { sendInviteEmail } from '@/lib/email/send-invite'
import { getInviteEmailTemplate } from '@/lib/email-templates/invite-agent'

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

    // Get broker info
    const { data: broker } = await supabase
      .from('brokers')
      .select('id, name, email')
      .eq('auth_user_id', userContext.userId)
      .single() as any

    if (!broker) {
      return NextResponse.json({ error: 'Broker not found' }, { status: 404 })
    }

    // Get agents to invite
    const { data: agents } = await supabase
      .from('agents')
      .select('id, first_name, last_name, email, invite_status')
      .eq('broker_id', broker.id)
      .in('id', agentIds) as any

    if (!agents || agents.length === 0) {
      return NextResponse.json({ error: 'No valid agents found' }, { status: 404 })
    }

    // Filter out already active agents
    const invitableAgents = agents.filter((a: any) => a.invite_status !== 'active')

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
        const { error: updateError } = await supabase
          .from('agents')
          .update({
            invite_token: token,
            invite_sent_at: new Date().toISOString(),
            invite_status: 'invited'
          })
          .eq('id', agent.id) as any

        if (updateError) throw updateError

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
          fromEmail: broker.email
        })

        invites.push({
          id: agent.id,
          email: agent.email,
          name: agentName
        })
      } catch (error: any) {
        console.error(`Failed to invite ${agent.email}:`, error)
        errors.push({
          id: agent.id,
          email: agent.email,
          error: error.message
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

  } catch (error: any) {
    console.error('Invite error:', error)
    return NextResponse.json({ 
      error: error.message || 'Failed to send invites' 
    }, { status: 500 })
  }
}

function generateInviteToken(): string {
  // Generate a secure random token
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { token, password } = await request.json()

    if (!token || !password) {
      return NextResponse.json({ error: 'Missing token or password' }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Look up agent by invite token
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('id, email, invite_status')
      .eq('invite_token', token)
      .single() as any

    if (agentError || !agent) {
      return NextResponse.json({ error: 'Invalid invite token' }, { status: 404 })
    }

    if (agent.invite_status === 'active') {
      return NextResponse.json({ error: 'Account already activated' }, { status: 400 })
    }

    // Create auth user using admin API (bypasses signup restrictions)
    const { data: authData, error: signUpError } = await supabase.auth.admin.createUser({
      email: agent.email,
      password: password,
      email_confirm: true, // Auto-confirm email for invite-based signups
    })

    if (signUpError) {
      console.error('Admin createUser error:', signUpError)
      return NextResponse.json({ error: signUpError.message }, { status: 500 })
    }

    if (!authData.user) {
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
    }

    // Update agent record with auth_user_id and activate
    const { error: updateError } = await supabase
      .from('agents')
      .update({
        auth_user_id: authData.user.id,
        invite_status: 'active',
        invite_token: null, // Clear token after use
      })
      .eq('id', agent.id) as any

    if (updateError) {
      console.error('Agent update error:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Return success with user data
    return NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
      },
    })

  } catch (error: any) {
    console.error('Invite accept error:', error)
    return NextResponse.json({ 
      error: error.message || 'Failed to activate account' 
    }, { status: 500 })
  }
}

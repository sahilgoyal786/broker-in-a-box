import { Resend } from 'resend'

interface InviteEmailParams {
  to: string
  subject: string
  htmlBody: string
  textBody?: string
  fromName?: string
  fromEmail?: string
}

export async function sendInviteEmail(params: InviteEmailParams) {
  const resendApiKey = process.env.RESEND_API_KEY
  
  if (!resendApiKey) {
    // Fallback: log to console if Resend not configured
    console.log('⚠️  RESEND_API_KEY not configured. Email not sent.')
    console.log('📧 Invite email details:')
    console.log('   To:', params.to)
    console.log('   Subject:', params.subject)
    console.log('   From:', `${params.fromName} <${params.fromEmail}>`)
    console.log('\nTo enable email sending:')
    console.log('1. Sign up at https://resend.com (free tier: 100 emails/day)')
    console.log('2. Get API key')
    console.log('3. Add to .env.local: RESEND_API_KEY=re_...')
    console.log('4. Add to Vercel env variables')
    return { success: false, logged: true }
  }

  const resend = new Resend(resendApiKey)

  try {
    const { data, error } = await resend.emails.send({
      from: `${params.fromName || 'Broker in a Box'} <${params.fromEmail || 'onboarding@resend.dev'}>`,
      to: params.to,
      subject: params.subject,
      html: params.htmlBody,
      text: params.textBody,
    })

    if (error) {
      console.error('Resend email error:', error)
      throw new Error(error.message || 'Failed to send email')
    }

    console.log('✅ Email sent successfully via Resend:', data?.id)
    return { success: true, messageId: data?.id }
  } catch (error: any) {
    console.error('Email sending failed:', error)
    throw error
  }
}

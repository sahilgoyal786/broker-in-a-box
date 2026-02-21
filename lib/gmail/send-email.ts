import { google } from 'googleapis'
import { createClient } from '@/lib/supabase/server'

interface EmailParams {
  to: string
  subject: string
  htmlBody: string
  textBody?: string
  from?: string
}

export async function sendEmailViaGmail(params: EmailParams, brokerAuthUserId: string) {
  const supabase = await createClient()

  // Get broker's Google OAuth tokens
  const { data: broker } = await supabase
    .from('brokers')
    .select('google_access_token, google_refresh_token, email, name')
    .eq('auth_user_id', brokerAuthUserId)
    .single() as any

  if (!broker || !broker.google_refresh_token) {
    throw new Error('Broker Gmail not connected. Please connect Google account first.')
  }

  // Set up OAuth2 client
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`
  )

  oauth2Client.setCredentials({
    access_token: broker.google_access_token,
    refresh_token: broker.google_refresh_token,
  })

  // Refresh access token if needed
  try {
    const { credentials } = await oauth2Client.refreshAccessToken()
    if (credentials.access_token !== broker.google_access_token) {
      // Update stored access token
      await supabase
        .from('brokers')
        .update({ google_access_token: credentials.access_token })
        .eq('auth_user_id', brokerAuthUserId) as any
    }
  } catch (error) {
    console.error('Token refresh error:', error)
  }

  const gmail = google.gmail({ version: 'v1', auth: oauth2Client })

  // Create email in RFC 2822 format
  const fromEmail = params.from || broker.email
  const fromName = broker.name || fromEmail

  const emailLines = [
    `From: ${fromName} <${fromEmail}>`,
    `To: ${params.to}`,
    `Subject: ${params.subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=utf-8',
    '',
    params.htmlBody
  ]

  const email = emailLines.join('\r\n')
  const encodedEmail = Buffer.from(email)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')

  // Send email
  const result = await gmail.users.messages.send({
    userId: 'me',
    requestBody: {
      raw: encodedEmail,
    },
  })

  return result.data
}

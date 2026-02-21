import nodemailer from 'nodemailer'

interface EmailParams {
  to: string
  subject: string
  htmlBody: string
  textBody?: string
  from?: string
  fromName?: string
}

export async function sendEmailViaSMTP(params: EmailParams) {
  // For now, use a simple SMTP configuration
  // In production, this would use the broker's Gmail account via OAuth2
  // or an email service like SendGrid/Postmark
  
  const fromEmail = params.from || process.env.SMTP_FROM_EMAIL || 'noreply@brokerinabox.com'
  const fromName = params.fromName || 'Broker in a Box'

  // Create transporter
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  })

  // Send email
  const info = await transporter.sendMail({
    from: `"${fromName}" <${fromEmail}>`,
    to: params.to,
    subject: params.subject,
    text: params.textBody || params.htmlBody.replace(/<[^>]*>/g, ''),
    html: params.htmlBody,
  })

  return info
}

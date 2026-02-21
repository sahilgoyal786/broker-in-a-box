export function getInviteEmailTemplate({
  agentName,
  brokerName,
  inviteUrl
}: {
  agentName: string
  brokerName: string
  inviteUrl: string
}) {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You've Been Invited to ${brokerName}'s Transaction Portal</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 40px 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                Welcome to Broker in a Box
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #334155;">
                Hi <strong>${agentName}</strong>,
              </p>
              
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #334155;">
                Your broker, <strong>${brokerName}</strong>, has set up a transaction management account for you. This portal will help you stay compliant and organized with all your real estate transactions.
              </p>

              <p style="margin: 0 0 30px; font-size: 16px; line-height: 1.6; color: #334155;">
                Click the button below to set your password and access your account:
              </p>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 0 0 30px;">
                    <a href="${inviteUrl}" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(59, 130, 246, 0.3);">
                      Activate My Account
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 10px; font-size: 14px; line-height: 1.6; color: #64748b;">
                Or copy and paste this link into your browser:
              </p>
              <p style="margin: 0 0 30px; font-size: 12px; line-height: 1.6; color: #3b82f6; word-break: break-all;">
                ${inviteUrl}
              </p>

              <div style="background-color: #f1f5f9; border-left: 4px solid #3b82f6; padding: 16px; border-radius: 4px; margin: 0 0 20px;">
                <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #475569;">
                  <strong>Note:</strong> This invitation link is unique to you and will expire once you activate your account.
                </p>
              </div>

              <p style="margin: 0 0 10px; font-size: 14px; line-height: 1.6; color: #334155;">
                <strong>What you'll be able to do:</strong>
              </p>
              <ul style="margin: 0 0 30px; padding-left: 20px; font-size: 14px; line-height: 1.8; color: #334155;">
                <li>View all your transactions in one place</li>
                <li>Track compliance documents and deadlines</li>
                <li>Access transaction history and reports</li>
                <li>Stay organized with automated filing</li>
              </ul>

              <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #64748b;">
                Questions? Reply to this email to contact ${brokerName}.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 30px 40px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0 0 8px; font-size: 16px; font-weight: 600; color: #1e293b;">
                Broker in a Box
              </p>
              <p style="margin: 0; font-size: 13px; color: #64748b;">
                Compliance tracking made simple
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()

  const text = `
Hi ${agentName},

Your broker, ${brokerName}, has set up a transaction management account for you.

Click the link below to set your password and access your transactions:

${inviteUrl}

This link is unique to you and expires after use.

Questions? Reply to this email to contact your broker.

---
Broker in a Box
Compliance tracking made simple
  `.trim()

  return { html, text }
}

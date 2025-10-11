/**
 * Email Service using Resend API
 *
 * FREE Plan: 3,000 emails/month forever
 * Perfect for startups - no credit card required
 *
 * Sign up: https://resend.com
 */

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

/**
 * Send email using Resend API
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.warn('Resend API key not configured - email not sent');
    return false;
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: options.from || 'lovento <noreply@yourdomain.com>',
        to: options.to,
        subject: options.subject,
        html: options.html,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Resend API error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Email send error:', error);
    return false;
  }
}

/**
 * Send account deletion confirmation email
 */
export async function sendDeletionConfirmation(email: string, reason?: string) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          .button { display: inline-block; padding: 12px 30px; background: #ec4899; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Account Deleted</h1>
          </div>
          <div class="content">
            <p>Hello,</p>
            <p>Your lovento account has been permanently deleted as requested.</p>

            <p><strong>What was deleted:</strong></p>
            <ul>
              <li>Your profile information</li>
              <li>All your photos</li>
              <li>Your matches and conversations</li>
              <li>Your preferences and settings</li>
            </ul>

            ${reason ? `<p><strong>Reason for leaving:</strong> ${reason}</p>` : ''}

            <p>We're sorry to see you go! If you change your mind, you're always welcome back.</p>

            <p>Thank you for being part of our community.</p>

            <p>Best regards,<br>The lovento Team</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} lovento. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: 'Your lovento account has been deleted',
    html,
  });
}

/**
 * Send new match notification
 */
export async function sendMatchNotification(email: string, matchName: string) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          .button { display: inline-block; padding: 12px 30px; background: #ec4899; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .match-emoji { font-size: 48px; text-align: center; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>It's a Match! 💕</h1>
          </div>
          <div class="content">
            <div class="match-emoji">🎉</div>
            <p>Great news!</p>
            <p>You and <strong>${matchName}</strong> liked each other!</p>

            <p>Don't be shy - send them a message and start a conversation.</p>

            <div style="text-align: center;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/messages" class="button">
                Send Message
              </a>
            </div>

            <p style="margin-top: 30px; color: #666; font-size: 14px;">
              Tip: Ask about their interests or use an ice breaker question to get the conversation started!
            </p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} lovento. All rights reserved.</p>
            <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/settings">Manage email preferences</a></p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: `It's a Match! You and ${matchName} liked each other 💕`,
    html,
  });
}

/**
 * Send new message notification
 */
export async function sendMessageNotification(email: string, senderName: string, messagePreview: string) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          .button { display: inline-block; padding: 12px 30px; background: #ec4899; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .message-preview { background: white; padding: 15px; border-left: 4px solid #ec4899; margin: 20px 0; border-radius: 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>New Message 💌</h1>
          </div>
          <div class="content">
            <p><strong>${senderName}</strong> sent you a message:</p>

            <div class="message-preview">
              <p style="margin: 0;">${messagePreview.substring(0, 100)}${messagePreview.length > 100 ? '...' : ''}</p>
            </div>

            <div style="text-align: center;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/messages" class="button">
                Reply Now
              </a>
            </div>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} lovento. All rights reserved.</p>
            <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/settings">Manage email preferences</a></p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: `${senderName} sent you a message`,
    html,
  });
}

/**
 * Send account suspended notification
 */
export async function sendAccountSuspendedNotification(
  email: string,
  reason: string,
  suspendedUntil?: Date
) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #dc2626; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          .warning { background: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; border-radius: 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚠️ Account Suspended</h1>
          </div>
          <div class="content">
            <p>Your lovento account has been suspended.</p>

            <div class="warning">
              <p><strong>Reason:</strong> ${reason}</p>
              ${suspendedUntil ? `<p><strong>Suspended until:</strong> ${suspendedUntil.toLocaleDateString()}</p>` : '<p><strong>Duration:</strong> Permanent</p>'}
            </div>

            <p>This action was taken due to a violation of our Community Guidelines or Terms of Service.</p>

            <p>If you believe this was a mistake, please contact our support team.</p>

            <p><strong>What you can do:</strong></p>
            <ul>
              <li>Review our <a href="${process.env.NEXT_PUBLIC_APP_URL}/community-guidelines">Community Guidelines</a></li>
              <li>Contact support: support@lovento.com</li>
              ${suspendedUntil ? '<li>Wait for the suspension period to end</li>' : ''}
            </ul>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} lovento. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: 'Your lovento account has been suspended',
    html,
  });
}

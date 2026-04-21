import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendTicketEmail(
  email: string,
  name: string,
  characterName: string,
  slot: number,
  ticketId: string
) {
  const ticketUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/ticket/${ticketId}`
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #0a0a0a; color: #fff; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .logo { font-size: 48px; font-weight: 900; letter-spacing: -2px; margin-bottom: 10px; font-style: italic; }
          .divider { width: 48px; height: 4px; background: #dc2626; margin: 20px auto; }
          .ticket-container { background: linear-gradient(135deg, rgba(220, 38, 38, 0.1) 0%, rgba(0, 0, 0, 0.8) 100%); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 16px; padding: 30px; margin: 30px 0; text-align: center; }
          .character-name { font-size: 32px; font-weight: 900; margin: 20px 0; color: #fff; }
          .slot-info { font-size: 24px; font-weight: bold; margin: 20px 0; color: #ec4899; }
          .info-row { margin: 15px 0; color: #9ca3af; font-size: 14px; }
          .info-label { color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; }
          .cta-button { display: inline-block; background: #fff; color: #000; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 20px; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 12px; }
          .qr-placeholder { background: #fff; width: 150px; height: 150px; margin: 20px auto; display: flex; align-items: center; justify-content: center; border-radius: 8px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">THE BUZZ</div>
            <div class="divider"></div>
            <p style="color: #9ca3af; margin-top: 10px;">Exclusive Film Premiere</p>
          </div>

          <div class="ticket-container">
            <p class="info-label">Your Exclusive Character</p>
            <div class="character-name">${characterName}</div>
            
            <div class="info-row">
              <div class="info-label">Admit One</div>
              <div style="font-size: 18px; margin-top: 5px;">${name}</div>
            </div>

            <div class="qr-placeholder">
              [QR Code]
            </div>

            <div class="info-row">
              <div class="info-label">Entry Slot</div>
              <div class="slot-info">SLOT #0${slot}</div>
            </div>

            <div class="info-row">
              <div class="info-label">Ticket ID</div>
              <div style="font-family: monospace; font-size: 12px; color: #6b7280; letter-spacing: 1px;">${ticketId.substring(0, 16)}</div>
            </div>

            <a href="${ticketUrl}" class="cta-button">View Your Ticket</a>
          </div>

          <div class="footer">
            <p>Your exclusive ticket to THE BUZZ premiere is ready.</p>
            <p style="margin-top: 10px;">Questions? Contact us at support@thebuzz.film</p>
          </div>
        </div>
      </body>
    </html>
  `

  try {
    const result = await resend.emails.send({
      from: 'THE BUZZ <noreply@thebuzz.film>',
      to: email,
      subject: `🎬 Your Exclusive Ticket to THE BUZZ - ${characterName}`,
      html: htmlContent,
    })

    return { success: true, message: 'Email sent successfully', result }
  } catch (error) {
    console.error('Resend error:', error)
    return { success: false, message: 'Failed to send email', error }
  }
}

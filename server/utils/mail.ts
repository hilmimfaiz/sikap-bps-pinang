import { Resend } from 'resend'

// Inisialisasi Resend dengan API Key dari .env
const resend = new Resend(process.env.RESEND_API_KEY)

export const sendResetEmail = async (to: string, otp: string) => {

  // Validasi API Key
  if (!process.env.RESEND_API_KEY) {
      console.error('ERROR: RESEND_API_KEY belum diset di .env!');
      return false;
  }
  
  // Tentukan pengirim (Sender Identity)
  // Untuk testing gratis tanpa domain sendiri, gunakan: onboarding@resend.dev
  // Untuk production, gunakan email dari domain yang sudah diverifikasi di Resend (misal: support@sikap-app.com)
  const fromEmail = process.env.RESEND_FROM || 'onboarding@resend.dev'

  try {
    const data = await resend.emails.send({
      from: `SIKAP App <${fromEmail}>`,
      to: [to],
      subject: 'Kode OTP Reset Password',
      text: `Halo,\n\nKode OTP untuk mereset kata sandi Anda adalah: ${otp}\n\nKode ini berlaku selama 1 jam. Jangan berikan kode ini kepada siapapun.\n\n-- SIKAP App Support`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #2563eb; text-align: center;">Reset Password</h2>
          <p style="color: #555;">Halo,</p>
          <p style="color: #555; line-height: 1.5;">
            Gunakan kode OTP berikut untuk mereset kata sandi akun <strong>SIKAP App</strong> Anda:
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <span style="background-color: #f3f4f6; color: #2563eb; padding: 15px 30px; border-radius: 8px; font-size: 24px; font-weight: bold; letter-spacing: 5px; border: 1px solid #d1d5db;">
              ${otp}
            </span>
          </div>

          <p style="color: #777; font-size: 12px; text-align: center;">
            Kode ini hanya berlaku selama <strong>1 jam</strong>. <br>
            Jika Anda tidak merasa melakukan permintaan ini, abaikan saja email ini.
          </p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="text-align: center; color: #aaa; font-size: 11px;">
            &copy; ${new Date().getFullYear()} SIKAP App
          </p>
        </div>
      `
    })

    if (data.error) {
      console.error('RESEND ERROR:', data.error)
      return false
    }

    console.log('STATUS: Email terkirim via Resend. ID:', data.data?.id)
    return true

  } catch (error) {
    console.error('SYSTEM ERROR PENGIRIMAN EMAIL:', error)
    return false
  }
}
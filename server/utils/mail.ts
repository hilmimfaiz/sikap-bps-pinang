import { Resend } from 'resend'

export const sendResetEmail = async (to: string, otp: string) => {
  // 1. Ambil konfigurasi dari Runtime Config (Sesuai nuxt.config.ts)
  const config = useRuntimeConfig()

  // Validasi API Key
  if (!config.resendApiKey) {
    console.error('ERROR: RESEND_API_KEY belum diset di .env atau nuxt.config.ts!')
    return false
  }

  // 2. Inisialisasi Client Resend
  // Kita inisialisasi di dalam fungsi agar config pasti sudah termuat
  const resend = new Resend(config.resendApiKey as string)

  // 3. Tentukan Pengirim
  // Mengambil dari .env (RESEND_FROM) yang sudah kita set di nuxt.config.ts
  // Fallback ke string hardcode jika config kosong (Safety net)
  const fromEmail = config.resendFrom || 'SIKaP Admin <admin@riperhilmi.store>'

  try {
    const data = await resend.emails.send({
      from: fromEmail as string,
      to: [to],
      subject: 'Kode OTP Reset Password - SIKaP',
      text: `Halo,\n\nKode OTP untuk mereset kata sandi Anda adalah: ${otp}\n\nKode ini berlaku selama 15 menit. Jangan berikan kode ini kepada siapapun.\n\n-- Tim SIKaP App`,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          
          <div style="text-align: center; margin-bottom: 30px;">
            <h2 style="color: #1f2937; margin: 0; font-size: 24px;">Permintaan Reset Password</h2>
            <p style="color: #6b7280; margin-top: 8px;">Sistem Informasi Kearsipan (SIKaP)</p>
          </div>

          <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 30px;">
            <p style="color: #374151; margin-bottom: 15px; font-size: 16px;">Gunakan kode verifikasi berikut untuk melanjutkan:</p>
            
            <div style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #2563eb; background: #ffffff; padding: 15px; border: 2px dashed #bfdbfe; border-radius: 8px; display: inline-block;">
              ${otp}
            </div>
            
            <p style="color: #ef4444; font-size: 13px; margin-top: 15px;">
              ⚠️ Jangan berikan kode ini kepada siapa pun, termasuk admin.
            </p>
          </div>

          <p style="color: #4b5563; font-size: 14px; line-height: 1.6; text-align: center;">
            Kode ini hanya berlaku selama <strong>15 menit</strong>.<br>
            Jika Anda tidak merasa meminta reset password, abaikan email ini.
          </p>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          
          <p style="text-align: center; color: #9ca3af; font-size: 12px;">
            &copy; ${new Date().getFullYear()} SIKaP App. All rights reserved.
          </p>
        </div>
      `
    })

    if (data.error) {
      console.error('RESEND API ERROR:', data.error)
      return false
    }

    console.log(`✅ Email OTP terkirim ke ${to}. ID: ${data.data?.id}`)
    return true

  } catch (error) {
    console.error('❌ SYSTEM ERROR (Email):', error)
    return false
  }
}
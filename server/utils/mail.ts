import nodemailer from 'nodemailer'

// Konfigurasi Transporter menggunakan Gmail App Password
const transporter = nodemailer.createTransport({
  service: 'gmail', // Otomatis set host: smtp.gmail.com dan port: 465/587
  auth: {
    // Pastikan variabel lingkungan ini ada di file .env Anda
    user: process.env.SMTP_USER, 
    pass: process.env.SMTP_PASS  
  }
})

export const sendResetEmail = async (to: string, resetLink: string) => {

  // Cek apakah konfigurasi SMTP tersedia
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.error('ERROR: Variabel lingkungan SMTP_USER atau SMTP_PASS belum diset di .env!');
      return false;
  }
  
  const mailOptions = {
    from: `"SIKAP App Support" <${process.env.SMTP_USER}>`,
    to: to,
    subject: 'Permintaan Reset Password',
    
    // ===========================================
    // FIX PENTING: Tambahkan konten text untuk Deliverability
    // ===========================================
    text: `Halo,\n\nSeseorang baru saja meminta untuk mereset kata sandi akun SIKAP App Anda. Silakan kunjungi tautan berikut untuk membuat kata sandi baru:\n\n${resetLink}\n\nTautan ini hanya berlaku selama 1 jam. Jika Anda tidak merasa melakukan permintaan ini, abaikan saja email ini.\n\n-- SIKAP App Support`,
    
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #2563eb; text-align: center;">Reset Password</h2>
        <p style="color: #555;">Halo,</p>
        <p style="color: #555; line-height: 1.5;">
          Seseorang baru saja meminta untuk mereset kata sandi akun <strong>SIKAP App</strong> Anda.
          Silakan klik tombol di bawah ini untuk membuat kata sandi baru:
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
            Reset Password Saya
          </a>
        </div>

        <p style="color: #777; font-size: 12px;">
          Tautan ini hanya berlaku selama <strong>1 jam</strong>. <br>
          Jika Anda tidak merasa melakukan permintaan ini, abaikan saja email ini.
        </p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="text-align: center; color: #aaa; font-size: 11px;">
          &copy; ${new Date().getFullYear()} SIKAP App
        </p>
      </div>
    `
  }

  try {
    // Verifikasi koneksi ke SMTP server (opsional, tetapi sangat membantu)
    await transporter.verify()
    console.log('STATUS: SMTP server ready.')

    // Kirim Email
    const info = await transporter.sendMail(mailOptions)
    console.log('STATUS: Email terkirim. MessageId:', info.messageId)
    
    return true
  } catch (error) {
    console.error('ERROR PENGIRIMAN EMAIL:', error)
    console.error('Penyebab Umum: Cek kembali App Password Google Anda, atau cek folder Spam penerima.')
    return false
  }
}
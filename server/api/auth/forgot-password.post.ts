import { createError, defineEventHandler, readBody } from 'h3'
// import { sendResetEmail } from '~/server/utils/mail'
// import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  
  if (!body.email) {
    throw createError({ statusCode: 400, message: 'Email wajib diisi' })
  }

  // 1. Cari User
  const user = await prisma.user.findUnique({
    where: { email: body.email }
  })

  // Security Best Practice:
  // Jangan beritahu secara eksplisit jika email tidak ditemukan untuk menghindari 'User Enumeration Attack'.
  // Tapi untuk debugging development, boleh kita throw error jika perlu.
  if (!user) {
     // Jika ingin aman: return { message: 'Jika email terdaftar, kode OTP akan dikirim.' }
     // Jika ingin UX jelas:
     throw createError({ 
       statusCode: 404, 
       message: 'Email tidak terdaftar di sistem.' 
     })
  }

  // 2. Generate OTP 6 Digit
  const otp = Math.floor(100000 + Math.random() * 900000).toString()
  
  // Set Waktu Kadaluarsa: 15 Menit dari sekarang (Sesuai best practice OTP)
  // Sebelumnya 1 jam (terlalu lama untuk OTP)
  const expiry = new Date()
  expiry.setMinutes(expiry.getMinutes() + 15)

  // 3. Simpan OTP ke DB (FIXED: Menggunakan field otpCode & otpExpires)
  try {
    await prisma.user.update({
      where: { email: body.email },
      data: {
        otpCode: otp,         // field baru di schema.prisma
        otpExpires: expiry    // field baru di schema.prisma
      }
    })
  } catch (e: any) {
     console.error('DATABASE ERROR (Simpan OTP):', e)
     throw createError({ statusCode: 500, message: 'Gagal memproses permintaan reset password.' })
  }

  // 4. Kirim Email via Resend
  try {
      const isSent = await sendResetEmail(user.email, otp) 
      
      if (!isSent) {
        throw new Error('Fungsi sendResetEmail mengembalikan false')
      }
  } catch (error) {
      console.error('EMAIL ERROR (Resend):', error);
      // Opsional: Anda bisa menghapus OTP di DB jika email gagal kirim agar user bisa coba lagi bersih
      throw createError({ statusCode: 500, message: 'Gagal mengirim email kode OTP. Pastikan koneksi internet lancar.' })
  }
  
  return { 
    statusCode: 200,
    message: 'Kode OTP telah dikirim ke email Anda. Cek Inbox atau Spam.' 
  }
})
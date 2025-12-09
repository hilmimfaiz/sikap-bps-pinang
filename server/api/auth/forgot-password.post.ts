import { createError, defineEventHandler, readBody } from 'h3'

// `sendResetEmail` dan `prisma` di-auto-import oleh Nuxt

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  
  if (!body.email) {
    throw createError({ statusCode: 400, message: 'Email wajib diisi' })
  }

  // 1. Cari User
  const user = await prisma.user.findUnique({
    where: { email: body.email }
  })

  if (!user) {
    throw createError({ 
      statusCode: 404, 
      message: 'Email tidak terdaftar di sistem.' 
    })
  }

  // 2. Generate OTP 6 Digit
  const otp = Math.floor(100000 + Math.random() * 900000).toString() 
  const expiry = new Date(Date.now() + 3600000) // 1 jam dari sekarang

  // 3. Simpan OTP ke DB
  try {
    await prisma.user.update({
      where: { email: body.email },
      data: {
        resetToken: otp, 
        resetTokenExpiry: expiry
      }
    })
  } catch (e: any) {
     console.error('Prisma update error:', e)
     throw createError({ statusCode: 500, message: 'Gagal menyimpan kode OTP.' })
  }

  // 4. Kirim Email via Resend
  try {
      const isSent = await sendResetEmail(user.email, otp) 
      if (!isSent) {
        throw new Error('Resend failed to deliver')
      }
  } catch (error) {
      console.error('Gagal mengirim email:', error);
      throw createError({ statusCode: 500, message: 'Gagal mengirim email kode OTP.' })
  }
  
  return { message: 'Kode OTP telah dikirim ke email Anda.' }
})
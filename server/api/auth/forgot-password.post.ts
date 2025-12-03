// nuxt proyek awak/server/api/auth/forgot-password.post.ts

import crypto from 'crypto'
import { createError, defineEventHandler, readBody, getHeader } from 'h3'

// `sendResetEmail` di-auto-import dari `~/server/utils/mail.ts`
// `prisma` di-auto-import dari `~/server/utils/prisma.ts`

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  
  if (!body.email) {
    throw createError({ statusCode: 400, message: 'Email wajib diisi' })
  }

  // 1. Cari User
  const user = await prisma.user.findUnique({
    where: { email: body.email }
  })

  // Demi keamanan, kembalikan pesan sukses palsu jika user tidak ditemukan
  if (!user) {
    return { message: 'Jika email terdaftar, tautan reset kata sandi telah dikirim.' }
  }

  // 2. Generate Token Unik
  const token = crypto.randomBytes(32).toString('hex')
  const expiry = new Date(Date.now() + 3600000) // Berlaku 1 jam dari sekarang

  // 3. Simpan Token ke DB
  try {
    await prisma.user.update({
      where: { email: body.email },
      data: {
        resetToken: token, 
        resetTokenExpiry: expiry
      }
    })
  } catch (e: any) {
     console.error('Prisma update error:', e)
     throw createError({ statusCode: 500, message: 'Gagal menyimpan token reset.' })
  }


  // 4. Construct reset URL - Logika Dinamis (Ngrok/Dynamic URL)
  
  const protocol = getHeader(event, 'x-forwarded-proto') || (process.env.NODE_ENV === 'production' ? 'https' : 'http')
  const host = getHeader(event, 'host') 

  let resetBaseUrl: string
  if (host) {
    resetBaseUrl = `${protocol}://${host}`
  } else {
    resetBaseUrl = process.env.NUXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  }
  
  const resetUrl = `${resetBaseUrl}/reset-password?token=${token}`

  // 5. Kirim Email
  try {
      await sendResetEmail(user.email, resetUrl) 
  } catch (error) {
      console.error('Gagal mengirim email. Lanjutkan untuk memberikan respons aman.', error);
  }
  
  // Memberikan respons sukses yang aman
  return { message: 'Jika email terdaftar, tautan reset kata sandi telah dikirim.' }
})
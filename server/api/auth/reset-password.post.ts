import bcrypt from 'bcrypt'
import { createError, defineEventHandler, readBody } from 'h3'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  // [PENTING] Menerima email, otp, dan password baru
  const { email, otp, newPassword } = body

  if (!email || !otp || !newPassword) {
    throw createError({ statusCode: 400, message: 'Data tidak lengkap (Email, OTP, Password)' })
  }

  // 1. Cari User berdasarkan Email
  const user = await prisma.user.findUnique({
    where: { email: email }
  })

  if (!user) {
    throw createError({ statusCode: 404, message: 'User tidak ditemukan' })
  }

  // 2. Validasi Token/OTP
  // Cek apakah token cocok DAN belum kadaluarsa
  if (user.resetToken !== otp) {
    throw createError({ statusCode: 400, message: 'Kode OTP salah' })
  }

  if (!user.resetTokenExpiry || new Date() > user.resetTokenExpiry) {
    throw createError({ statusCode: 400, message: 'Kode OTP sudah kadaluarsa' })
  }

  // 3. Hash Password Baru
  const hashedPassword = await bcrypt.hash(newPassword, 10)

  // 4. Update User & Hapus Token
  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      resetToken: null,
      resetTokenExpiry: null
    }
  })

  return { message: 'Password berhasil diubah. Silakan login.' }
})
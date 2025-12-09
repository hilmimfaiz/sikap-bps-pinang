import { createError, defineEventHandler, readBody } from 'h3'
// import { prisma } from '~/server/utils/prisma' // Gunakan instance global untuk mencegah 'Too many connections'
import bcrypt from 'bcryptjs' // Pastikan sudah install: npm install bcryptjs

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  
  // [PENTING] Menerima email, otp, dan password baru
  const { email, otp, newPassword } = body

  // 1. Validasi Input
  if (!email || !otp || !newPassword) {
    throw createError({ statusCode: 400, message: 'Data tidak lengkap (Email, OTP, Password wajib diisi)' })
  }

  // 2. Cari User berdasarkan Email
  const user = await prisma.user.findUnique({
    where: { email: email }
  })

  if (!user) {
    throw createError({ statusCode: 404, message: 'User tidak ditemukan' })
  }

  // 3. Validasi Token/OTP
  // Cek apakah OTP di database ada isinya, dan apakah cocok dengan input
  if (!user.otpCode || user.otpCode !== otp) {
    throw createError({ statusCode: 400, message: 'Kode OTP salah atau tidak valid.' })
  }

  // Cek apakah OTP sudah kadaluarsa
  if (!user.otpExpires || new Date() > user.otpExpires) {
    throw createError({ statusCode: 400, message: 'Kode OTP sudah kadaluarsa. Silakan minta kode baru.' })
  }

  // 4. Hash Password Baru
  // Salt round 10 adalah standar industri
  const hashedPassword = await bcrypt.hash(newPassword, 10)

  // 5. Update User & Hapus Token (Agar OTP tidak bisa dipakai 2x)
  try {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        otpCode: null,     // Hapus OTP
        otpExpires: null   // Hapus waktu expired
      }
    })
  } catch (error) {
    console.error('Database Update Error:', error)
    throw createError({ statusCode: 500, message: 'Gagal mengupdate password baru.' })
  }

  return { 
    statusCode: 200, 
    message: 'Password berhasil diubah. Silakan login dengan password baru.' 
  }
})
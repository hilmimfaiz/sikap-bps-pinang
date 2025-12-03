import bcrypt from 'bcrypt'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { token, newPassword } = body

  if (!token || !newPassword) {
    throw createError({ statusCode: 400, message: 'Data tidak lengkap' })
  }

  // 1. Cari User berdasarkan Token & Cek Expiry
  const user = await prisma.user.findFirst({
    where: {
      resetToken: token,
      resetTokenExpiry: { gt: new Date() } // Expiry harus lebih besar dari sekarang
    }
  })

  if (!user) {
    throw createError({ statusCode: 400, message: 'Token tidak valid atau sudah kadaluarsa' })
  }

  // 2. Hash Password Baru
  const hashedPassword = await bcrypt.hash(newPassword, 10)

  // 3. Update User & Hapus Token
  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      resetToken: null,       // Hapus token agar tidak bisa dipakai lagi
      resetTokenExpiry: null
    }
  })

  return { message: 'Password berhasil diubah. Silakan login.' }
})
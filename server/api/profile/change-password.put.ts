import bcrypt from 'bcrypt'
import { createNotification } from '../../utils/notification'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { id, currentPassword, newPassword } = body

  if (!id || !currentPassword || !newPassword) {
    throw createError({ statusCode: 400, message: 'Semua kolom wajib diisi' })
  }

  const userId = parseInt(id)

  // 1. Ambil data user untuk cek password lama
  const user = await prisma.user.findUnique({
    where: { id: userId }
  })

  if (!user) {
    throw createError({ statusCode: 404, message: 'User tidak ditemukan' })
  }

  // 2. Verifikasi Password Lama
  const isMatch = await bcrypt.compare(currentPassword, user.password)
  if (!isMatch) {
    throw createError({ statusCode: 401, message: 'Kata sandi saat ini salah' })
  }

  // 3. Hash Password Baru
  const hashedPassword = await bcrypt.hash(newPassword, 10)

  // 4. Update ke Database
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword }
  })

  // 5. KIRIM NOTIFIKASI
  await createNotification(
    userId,
    'Keamanan Akun',
    'Kata sandi Anda berhasil diubah. Jika ini bukan Anda, segera hubungi admin.',
    '/dashboard/settings'
  )

  return { message: 'Kata sandi berhasil diubah' }
})
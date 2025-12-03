import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  // 1. Cek User Login
  const userCookie = getCookie(event, 'user_data')
  if (!userCookie) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  const currentUser = JSON.parse(userCookie)

  // 2. Ambil parameter range
  const { range } = getQuery(event)
  if (!range) throw createError({ statusCode: 400, statusMessage: 'Range parameter required' })

  const now = new Date()
  let whereCondition: any = {
    userId: currentUser.id // Hanya hapus notifikasi milik user sendiri
  }

  // 3. Tentukan filter waktu
  switch (range) {
    case '1h': // Hapus notifikasi yang dibuat dalam 1 jam terakhir
      whereCondition.createdAt = { gte: new Date(now.getTime() - 60 * 60 * 1000) }
      break
    case '24h': // Hapus 24 jam terakhir
      whereCondition.createdAt = { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) }
      break
    case '7d': // Hapus 7 hari terakhir
      whereCondition.createdAt = { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) }
      break
    case '30d': // Hapus 1 bulan terakhir
      whereCondition.createdAt = { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) }
      break
    case 'old': // Hapus yang LEBIH LAMA dari 6 bulan (Arsip lama)
      whereCondition.createdAt = { lt: new Date(now.getTime() - 6 * 30 * 24 * 60 * 60 * 1000) }
      break
    case 'all': // Hapus Semua (Opsional)
      // Tidak ada filter createdAt
      break
    default:
      throw createError({ statusCode: 400, statusMessage: 'Invalid range option' })
  }

  try {
    // 4. Eksekusi Hapus
    const deleted = await prisma.notification.deleteMany({
      where: whereCondition
    })

    return { success: true, count: deleted.count, message: `Berhasil menghapus ${deleted.count} notifikasi.` }
  } catch (error) {
    console.error('Delete notification error:', error)
    throw createError({ statusCode: 500, statusMessage: 'Gagal menghapus notifikasi' })
  }
})
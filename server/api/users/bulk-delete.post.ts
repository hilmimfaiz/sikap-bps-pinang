import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  const userCookie = getCookie(event, 'user_data')
  if (!userCookie) throw createError({ statusCode: 401, message: 'Unauthorized' })
  const currentUser = JSON.parse(userCookie)

  // Hanya Admin yang boleh
  if (currentUser.role !== 'admin') {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }

  const body = await readBody(event)
  const { ids } = body // Array of user IDs

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    throw createError({ statusCode: 400, message: 'Tidak ada data yang dipilih' })
  }

  // Validasi: Jangan hapus diri sendiri
  if (ids.includes(currentUser.id)) {
    throw createError({ statusCode: 400, message: 'Anda tidak dapat menghapus akun sendiri' })
  }

  try {
    await prisma.user.deleteMany({
      where: {
        id: { in: ids }
      }
    })
    return { message: 'Pengguna berhasil dihapus' }
  } catch (error) {
    console.error(error)
    throw createError({ statusCode: 500, message: 'Gagal menghapus pengguna' })
  }
})
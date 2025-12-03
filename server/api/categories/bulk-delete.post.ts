import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  const userCookie = getCookie(event, 'user_data')
  if (!userCookie) throw createError({ statusCode: 401, message: 'Unauthorized' })
  const currentUser = JSON.parse(userCookie)

  if (currentUser.role !== 'admin') {
    throw createError({ statusCode: 403, message: 'Hanya admin yang dapat menghapus kategori' })
  }

  const body = await readBody(event)
  const { ids } = body

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    throw createError({ statusCode: 400, message: 'Tidak ada kategori yang dipilih' })
  }

  try {
    // Hapus kategori (Link terkait akan terhapus otomatis jika onDelete: Cascade diatur di schema)
    const result = await prisma.category.deleteMany({
      where: {
        id: { in: ids }
      }
    })

    return { message: `${result.count} kategori berhasil dihapus` }
  } catch (error) {
    console.error(error)
    throw createError({ statusCode: 500, message: 'Gagal menghapus kategori' })
  }
})
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  const userCookie = getCookie(event, 'user_data')
  if (!userCookie) throw createError({ statusCode: 401, message: 'Unauthorized' })
  const currentUser = JSON.parse(userCookie)

  // Cek hak akses (Admin & Editor boleh)
  if (currentUser.role !== 'admin' && currentUser.role !== 'editor') {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }

  const body = await readBody(event)
  const { ids } = body

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    throw createError({ statusCode: 400, message: 'Tidak ada tautan yang dipilih' })
  }

  try {
    const result = await prisma.link.deleteMany({
      where: {
        id: { in: ids }
      }
    })

    return { message: `${result.count} tautan berhasil dihapus` }
  } catch (error) {
    console.error(error)
    throw createError({ statusCode: 500, message: 'Gagal menghapus tautan' })
  }
})
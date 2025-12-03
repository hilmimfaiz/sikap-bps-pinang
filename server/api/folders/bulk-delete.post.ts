import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  const userCookie = getCookie(event, 'user_data')
  if (!userCookie) throw createError({ statusCode: 401, message: 'Unauthorized' })
  const currentUser = JSON.parse(userCookie)

  const body = await readBody(event)
  const { ids } = body

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    throw createError({ statusCode: 400, message: 'Tidak ada folder yang dipilih' })
  }

  try {
    // Logic Kondisi Hapus:
    // 1. Admin: Bisa hapus folder apa saja (berdasarkan ID yang dikirim).
    // 2. User Biasa: Hanya bisa hapus folder yang userId-nya sama dengan miliknya.
    const whereCondition: any = {
      id: { in: ids }
    }

    if (currentUser.role !== 'admin') {
      whereCondition.userId = currentUser.id
    }

    const result = await prisma.folder.deleteMany({
      where: whereCondition
    })

    return { message: `${result.count} folder berhasil dihapus` }
  } catch (error) {
    console.error(error)
    throw createError({ statusCode: 500, message: 'Gagal menghapus folder' })
  }
})
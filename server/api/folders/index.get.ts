import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  const { search, page, limit } = getQuery(event)
  
  const searchQuery = search ? String(search) : ''
  const pageNumber = page ? parseInt(String(page)) : 1
  const limitNumber = limit ? parseInt(String(limit)) : 10
  const skip = (pageNumber - 1) * limitNumber

  try {
    const userCookie = getCookie(event, 'user_data')
    if (!userCookie) throw createError({ statusCode: 401, message: 'Unauthorized' })
    const user = JSON.parse(userCookie)

    // 1. Bangun Kondisi Filter (Permission + Search)
    let whereCondition: any = {
      AND: []
    }

    // A. Filter Permission (Jika bukan admin)
    if (user.role !== 'admin') {
      whereCondition.AND.push({
        OR: [
          { userId: user.id }, // Milik sendiri
          { shares: { some: { userId: user.id } } } // Dibagikan ke saya
        ]
      })
    }

    // B. Filter Search
    if (searchQuery) {
      whereCondition.AND.push({
        OR: [
          { name: { contains: searchQuery } }, // Nama Folder
          { user: { name: { contains: searchQuery } } } // Nama Pemilik
        ]
      })
    }

    // Jika AND kosong (Admin tanpa search), hapus properti AND agar tidak error atau query semua
    if (whereCondition.AND.length === 0) {
      delete whereCondition.AND
    }

    // 2. Hitung Total Data
    const totalCount = await prisma.folder.count({
      where: whereCondition
    })

    // 3. Ambil Data dengan Paginasi
    const folders = await prisma.folder.findMany({
      where: whereCondition,
      include: {
        _count: { select: { archives: true } },
        user: { select: { name: true } },
        shares: { select: { userId: true } }
      },
      orderBy: { createdAt: 'desc' },
      skip: skip,
      take: limitNumber
    })

    // 4. Return Response
    return {
      data: folders,
      meta: {
        total: totalCount,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(totalCount / limitNumber)
      }
    }

  } catch (error) {
    console.error(error)
    throw createError({ statusCode: 500, message: 'Gagal memuat folder' })
  }
})
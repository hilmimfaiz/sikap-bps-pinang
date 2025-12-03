import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  // 1. Ambil Query Parameter
  const { search, page, limit } = getQuery(event)
  
  const searchQuery = search ? String(search) : ''
  const pageNumber = page ? parseInt(String(page)) : 1
  const limitNumber = limit ? parseInt(String(limit)) : 10 // Default 10 data per halaman
  const skip = (pageNumber - 1) * limitNumber

  try {
    // 2. Bangun kondisi pencarian
    const whereCondition: any = {}
    
    if (searchQuery) {
      whereCondition.OR = [
        { name: { contains: searchQuery } },
        { email: { contains: searchQuery } }
      ]
    }

    // 3. Hitung total data (untuk pagination)
    const totalCount = await prisma.user.count({
      where: whereCondition
    })

    // 4. Ambil data dengan pagination (skip & take)
    const users = await prisma.user.findMany({
      where: whereCondition,
      select: {
        id: true,
        name: true,
        email: true,
        photoProfile: true,
        isActive: true,
        role: { select: { name: true } },
        createdAt: true
      },
      orderBy: { createdAt: 'desc' },
      skip: skip,
      take: limitNumber
    })

    // 5. Kembalikan format response baru
    return {
      data: users,
      meta: {
        total: totalCount,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(totalCount / limitNumber)
      }
    }

  } catch (error) {
    throw createError({ statusCode: 500, message: 'Gagal mengambil data user' })
  }
})
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  const { search, page, limit } = getQuery(event)
  
  const searchQuery = search ? String(search) : ''
  const pageNumber = page ? parseInt(String(page)) : 1
  const limitNumber = limit ? parseInt(String(limit)) : 10
  const skip = (pageNumber - 1) * limitNumber

  try {
    // 1. Kondisi Pencarian
    const whereCondition: any = {}
    
    if (searchQuery) {
      whereCondition.OR = [
        { title: { contains: searchQuery } },
        { url: { contains: searchQuery } },
        // Cari juga berdasarkan nama Kategori
        { category: { name: { contains: searchQuery } } }
      ]
    }

    // 2. Hitung Total (untuk pagination)
    const totalCount = await prisma.link.count({
      where: whereCondition
    })

    // 3. Ambil Data
    const links = await prisma.link.findMany({
      where: whereCondition,
      include: {
        category: { select: { name: true } }
      },
      // [FIX] Gunakan 'id' desc karena tabel Link tidak memiliki field createdAt
      orderBy: { id: 'desc' }, 
      skip: skip,
      take: limitNumber
    })

    return {
      data: links,
      meta: {
        total: totalCount,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(totalCount / limitNumber)
      }
    }

  } catch (error) {
    console.error("Error fetching links:", error)
    throw createError({ statusCode: 500, message: 'Gagal mengambil data tautan' })
  }
})
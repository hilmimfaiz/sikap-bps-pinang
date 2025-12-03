import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  const { search, page, limit } = getQuery(event)
  
  const searchQuery = search ? String(search) : ''
  const pageNumber = page ? parseInt(String(page)) : 1
  const limitNumber = limit ? parseInt(String(limit)) : 10
  const skip = (pageNumber - 1) * limitNumber

  try {
    // Kondisi Pencarian
    const whereCondition: any = {}
    
    if (searchQuery) {
      whereCondition.OR = [
        { name: { contains: searchQuery } },
        // Cari juga berdasarkan nama Penanggung Jawab
        { inCharge: { name: { contains: searchQuery } } }
      ]
    }

    // Hitung Total
    const totalCount = await prisma.category.count({
      where: whereCondition
    })

    // Ambil Data
    const categories = await prisma.category.findMany({
      where: whereCondition,
      include: {
        inCharge: { select: { id: true, name: true } }, // Ambil nama PIC
        _count: { select: { links: true } } // Hitung jumlah link (opsional, untuk info)
      },
      orderBy: { name: 'asc' },
      skip: skip,
      take: limitNumber
    })

    return {
      data: categories,
      meta: {
        total: totalCount,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(totalCount / limitNumber)
      }
    }

  } catch (error) {
    throw createError({ statusCode: 500, message: 'Gagal mengambil data kategori' })
  }
})
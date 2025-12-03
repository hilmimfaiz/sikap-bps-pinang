import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const keyword = query.q as string
  const categoryId = query.categoryId ? parseInt(query.categoryId as string) : undefined

  // Jika tidak ada keyword dan kategori, return kosong (agar tidak load semua data di awal)
  if (!keyword && !categoryId) {
    return []
  }

  // Logic Pencarian Database
  const archives = await prisma.archive.findMany({
    where: {
      AND: [
        // 1. Filter Keyword (Partial Match di Judul)
        keyword ? {
          title: {
            contains: keyword
          }
        } : {},
        
        // 2. Filter Kategori (Exact Match)
        categoryId ? {
          categoryId: categoryId
        } : {}
      ]
    },
    include: {
      folder: true,    // Supaya tahu file ini ada di folder mana
      category: true,  // Tampilkan nama kategori
      uploader: {      // Tampilkan siapa yang upload
        select: { name: true }
      }
    },
    orderBy: {
      createdAt: 'desc' // Hasil terbaru paling atas
    },
    take: 50 // Batasi hasil maks 50 agar ringan
  })

  return archives
})
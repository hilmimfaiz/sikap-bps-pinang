// gemini nuxt/server/api/landing/links.get.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  try {
    // Hanya ambil link yang isActive = true
    const links = await prisma.link.findMany({
      where: {
        isActive: true
      },
      include: {
        category: true // Sertakan kategori untuk label
      },
      orderBy: {
        id: 'desc' // Urutkan dari yang terbaru
      }
    })
    return links
  } catch (error) {
    throw createError({ statusCode: 500, message: 'Gagal mengambil data tautan penting' })
  }
})
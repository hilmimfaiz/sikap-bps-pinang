import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  // 1. Cek Login
  const userCookie = getCookie(event, 'user_data')
  if (!userCookie) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  const currentUser = JSON.parse(userCookie)

  // 2. Ambil Query Pencarian
  const { search } = getQuery(event)
  const searchQuery = search ? String(search) : ''

  // 3. Bangun Kondisi Filtering
  let whereCondition: any = {
    isActive: true, // Hanya cari user aktif
    AND: []
  }

  // Filter berdasarkan role
  if (currentUser.role === 'admin') {
    // Admin: Bisa cari SEMUA user (kecuali diri sendiri)
    whereCondition.AND.push({ id: { not: currentUser.id } })
  } else {
    // User Biasa (Editor/Viewer): HANYA bisa cari Admin
    whereCondition.AND.push({ role: { name: 'admin' } })
  }

  // Filter berdasarkan keyword pencarian (Nama atau Email)
  if (searchQuery) {
    whereCondition.AND.push({
      OR: [
        { name: { contains: searchQuery } }, 
        { email: { contains: searchQuery } }
      ]
    })
  }

  // 4. Eksekusi Query
  try {
    const users = await prisma.user.findMany({
      where: whereCondition,
      select: {
        id: true,
        name: true,
        photoProfile: true,
        role: {
          select: { name: true }
        }
      },
      orderBy: { name: 'asc' },
      take: 20 // Limit hasil agar performa tetap cepat
    })

    return users.map(u => ({
      id: u.id,
      name: u.name,
      photo: u.photoProfile,
      role: u.role.name
    }))
  } catch (error) {
    console.error('Error fetching contacts:', error)
    return []
  }
})
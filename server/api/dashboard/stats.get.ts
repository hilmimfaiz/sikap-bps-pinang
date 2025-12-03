export default defineEventHandler(async (event) => {
  try {
    const userCookie = getCookie(event, 'user_data')
    if (!userCookie) throw createError({ statusCode: 401, message: 'Unauthorized' })
    
    const user = JSON.parse(userCookie)

    // Jika bukan Admin, kembalikan 0 (Privacy)
    if (user.role !== 'admin') {
      return {
        totalUsers: 0,
        totalCategories: 0,
        activeLinks: 0,
        inactiveLinks: 0
      }
    }

    // [FIX] Hapus totalArchives
    const [totalUsers, totalCategories, activeLinks, inactiveLinks] = await Promise.all([
      prisma.user.count(),
      prisma.category.count(),
      prisma.link.count({ where: { isActive: true } }),
      prisma.link.count({ where: { isActive: false } })
    ])

    return {
      totalUsers,
      totalCategories,
      activeLinks,
      inactiveLinks
    }
  } catch (error) {
    throw createError({ statusCode: 500, message: 'Gagal memuat statistik sistem' })
  }
})
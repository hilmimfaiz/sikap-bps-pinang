import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  const userCookie = getCookie(event, 'user_data')
  if (!userCookie) throw createError({ statusCode: 401 })
  const currentUser = JSON.parse(userCookie)

  const notifications = await prisma.notification.findMany({
    where: { userId: currentUser.id },
    orderBy: { createdAt: 'desc' },
    take: 20 // Ambil 20 terakhir
  })

  // Hitung jumlah yang belum dibaca
  const unreadCount = await prisma.notification.count({
    where: { 
      userId: currentUser.id,
      isRead: false
    }
  })

  return { notifications, unreadCount }
})
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  const userCookie = getCookie(event, 'user_data')
  if (!userCookie) throw createError({ statusCode: 401 })
  const currentUser = JSON.parse(userCookie)

  // Tandai semua sebagai sudah dibaca (Mark All Read)
  // Atau bisa dimodifikasi untuk ID tertentu saja
  await prisma.notification.updateMany({
    where: { 
      userId: currentUser.id,
      isRead: false 
    },
    data: { isRead: true }
  })

  return { success: true }
})
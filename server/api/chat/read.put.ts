import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  // 1. Validasi User Login
  const userCookie = getCookie(event, 'user_data')
  if (!userCookie) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }
  const currentUser = JSON.parse(userCookie)

  // 2. Baca Data Pengirim (Sender) dari Body
  const body = await readBody(event)
  const senderId = parseInt(body.senderId)

  if (!senderId) {
    throw createError({ statusCode: 400, message: 'Sender ID required' })
  }

  try {
    // 3. Update semua pesan dari sender ini yang ditujukan ke current user menjadi isRead = true
    const update = await prisma.message.updateMany({
      where: {
        senderId: senderId,           // Pengirim pesan (lawan bicara)
        receiverId: currentUser.id,   // Penerima pesan (kita)
        isRead: false                 // Hanya yang belum dibaca
      },
      data: {
        isRead: true
      }
    })

    return { success: true, count: update.count }
  } catch (error) {
    console.error('Error marking messages as read:', error)
    throw createError({ statusCode: 500, message: 'Failed to mark as read' })
  }
})
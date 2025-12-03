import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  const userCookie = getCookie(event, 'user_data')
  if (!userCookie) throw createError({ statusCode: 401 })
  const currentUser = JSON.parse(userCookie)

  const { partnerId } = getQuery(event)

  if (!partnerId) return []

  try {
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          // Pesan yang SAYA kirim ke DIA
          { senderId: currentUser.id, receiverId: parseInt(String(partnerId)) },
          // Pesan yang DIA kirim ke SAYA
          { senderId: parseInt(String(partnerId)), receiverId: currentUser.id }
        ]
      },
      orderBy: {
        createdAt: 'asc' // Urutkan dari yang terlama ke terbaru
      },
      include: {
        sender: {
          select: { id: true, name: true, photoProfile: true }
        },
        replyTo: {
          select: { id: true, content: true, sender: { select: { name: true } } }
        }
      }
    })

    return messages
  } catch (error) {
    console.error('Gagal mengambil pesan:', error)
    return []
  }
})
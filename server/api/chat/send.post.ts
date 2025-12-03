import { PrismaClient } from '@prisma/client'
import { createNotification } from '../../utils/notification'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  const userCookie = getCookie(event, 'user_data')
  if (!userCookie) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  const currentUser = JSON.parse(userCookie)

  const body = await readBody(event)
  const { message, receiverId, replyToId } = body

  if (!message || !receiverId) {
    throw createError({ statusCode: 400, statusMessage: 'Data tidak lengkap' })
  }

  try {
    // 1. Simpan Pesan ke Database (Persistence)
    const newMessage = await prisma.message.create({
      data: {
        content: message,
        senderId: currentUser.id,
        receiverId: parseInt(receiverId), // Pastikan Int
        replyToId: replyToId ? parseInt(replyToId) : null // Pastikan Int/Null
      },
      include: {
        sender: {
          select: { id: true, name: true, role: { select: { name: true } }, photoProfile: true }
        },
        replyTo: {
          select: { id: true, content: true, sender: { select: { name: true } } }
        }
      }
    })

    // 2. Buat Notifikasi untuk Penerima
    await createNotification(
      parseInt(receiverId),
      `Pesan dari ${currentUser.name}`,
      message.substring(0, 50) + (message.length > 50 ? '...' : ''), // Preview pesan
      '/dashboard' // Link (bisa disesuaikan agar membuka chat widget)
    )

    return newMessage
  } catch (error) {
    console.error('Error sending message:', error)
    throw createError({ statusCode: 500, statusMessage: 'Gagal mengirim pesan' })
  }
})
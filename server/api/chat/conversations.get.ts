// File: server/api/chat/conversations.get.ts
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  const userCookie = getCookie(event, 'user_data')
  if (!userCookie) throw createError({ statusCode: 401 })
  const currentUser = JSON.parse(userCookie)

  // FIX: Hapus pengecekan role admin. Semua user berhak melihat chat mereka sendiri.

  // Ambil semua pesan yang melibatkan user yang sedang login (baik sebagai pengirim atau penerima)
  const messages = await prisma.message.findMany({
    where: { 
      OR: [
        { receiverId: currentUser.id },
        { senderId: currentUser.id }
      ]
    },
    include: {
      sender: { select: { id: true, name: true, photoProfile: true, role: { select: { name: true } } } },
      receiver: { select: { id: true, name: true, photoProfile: true } }
    },
    orderBy: { createdAt: 'desc' }
  })

  // Grouping pesan berdasarkan lawan bicara (partner)
  const conversations = new Map()

  messages.forEach(msg => {
    // Tentukan siapa lawan bicaranya
    const partner = msg.senderId === currentUser.id ? msg.receiver : msg.sender
    
    // Masukkan ke map jika belum ada
    if (!conversations.has(partner.id)) {
      conversations.set(partner.id, {
        partnerId: partner.id, // Gunakan partnerId agar konsisten
        name: partner.name,
        photo: partner.photoProfile,
        role: (partner as any).role?.name || 'user',
        lastMessage: msg.content,
        timestamp: msg.createdAt,
        unreadCount: (msg.receiverId === currentUser.id && !msg.isRead) ? 1 : 0
      })
    } else {
      if (msg.receiverId === currentUser.id && !msg.isRead) {
        const conv = conversations.get(partner.id)
        conv.unreadCount += 1
      }
    }
  })

  return Array.from(conversations.values())
})
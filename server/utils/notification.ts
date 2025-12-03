import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const createNotification = async (userId: number, title: string, message: string, link: string = '#') => {
  try {
    await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        link,
        isRead: false,
        type: 'info'
      }
    })
  } catch (error) {
    console.error('Gagal membuat notifikasi:', error)
  }
}
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  // 1. Cek User Login
  const userCookie = getCookie(event, 'user_data')
  if (!userCookie) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  const currentUser = JSON.parse(userCookie)

  // 2. Ambil ID Pesan dari URL
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'ID Pesan diperlukan' })

  const messageId = parseInt(id)

  // 3. Cari pesan di database
  const message = await prisma.message.findUnique({
    where: { id: messageId }
  })

  if (!message) {
    throw createError({ statusCode: 404, statusMessage: 'Pesan tidak ditemukan' })
  }

  // 4. Validasi: Hanya pengirim yang boleh menghapus
  if (message.senderId !== currentUser.id) {
    throw createError({ statusCode: 403, statusMessage: 'Anda tidak berhak menghapus pesan ini' })
  }

  // 5. Hapus Pesan
  try {
    await prisma.message.delete({
      where: { id: messageId }
    })
    return { success: true, message: 'Pesan berhasil dihapus' }
  } catch (error) {
    throw createError({ statusCode: 500, statusMessage: 'Gagal menghapus pesan' })
  }
})
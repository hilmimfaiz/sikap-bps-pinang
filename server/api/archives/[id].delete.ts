import { PrismaClient } from '@prisma/client'

// HAPUS BARIS INI: import { deleteFileFromStorage } from '~/server/utils/fileUpload'
// Fungsi deleteFileFromStorage sudah otomatis tersedia global di server routes.

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const userCookie = getCookie(event, 'user_data')

  if (!id || !userCookie) {
    throw createError({ statusCode: 400, message: 'Invalid Request' })
  }

  const user = JSON.parse(userCookie)
  const archiveId = parseInt(id)

  try {
    // 1. Cari Arsip
    const archive = await prisma.archive.findUnique({
      where: { id: archiveId },
      include: { folder: true }
    })

    if (!archive) {
      throw createError({ statusCode: 404, message: 'Arsip tidak ditemukan' })
    }

    // 2. Cek Hak Akses (Hanya Admin atau Pemilik Folder yang boleh hapus)
    const isOwner = archive.folder.userId === user.id
    const isAdmin = user.role === 'admin'

    if (!isOwner && !isAdmin) {
      throw createError({ statusCode: 403, message: 'Akses ditolak' })
    }

    // 3. Hapus File Fisik di Cloudinary
    if (archive.filePath) {
      // Panggil fungsi langsung tanpa import
      await deleteFileFromStorage(archive.filePath)
    }

    // 4. Hapus Data di Database
    await prisma.archive.delete({
      where: { id: archiveId }
    })

    return { success: true, message: 'Arsip berhasil dihapus' }

  } catch (error: any) {
    console.error('Delete Error:', error)
    throw createError({ 
      statusCode: error.statusCode || 500, 
      message: error.message || 'Gagal menghapus arsip' 
    })
  }
})
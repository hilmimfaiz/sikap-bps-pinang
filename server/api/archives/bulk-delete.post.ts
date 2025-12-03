import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  const userCookie = getCookie(event, 'user_data')
  if (!userCookie) throw createError({ statusCode: 401, message: 'Unauthorized' })
  const currentUser = JSON.parse(userCookie)

  const body = await readBody(event)
  const { ids } = body

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    throw createError({ statusCode: 400, message: 'Tidak ada file yang dipilih' })
  }

  try {
    // Logic Hak Akses Hapus:
    // 1. Admin: Bisa hapus file apa saja.
    // 2. User Biasa: Bisa hapus jika dia Uploader-nya ATAU dia Pemilik Folder-nya.
    
    let whereCondition: any = {
      id: { in: ids }
    }

    if (currentUser.role !== 'admin') {
      whereCondition = {
        id: { in: ids },
        OR: [
          { uploaderId: currentUser.id }, // Yang mengupload file
          { folder: { userId: currentUser.id } } // Pemilik folder tempat file berada
        ]
      }
    }

    // Hapus data di database (Cascade akan mengurus relasi share)
    // Catatan: Idealnya hapus fisik file juga dilakukan di sini menggunakan fs/promises
    const result = await prisma.archive.deleteMany({
      where: whereCondition
    })

    return { message: `${result.count} file berhasil dihapus` }
  } catch (error) {
    console.error(error)
    throw createError({ statusCode: 500, message: 'Gagal menghapus file' })
  }
})
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  try {
    // 1. Cek Login User
    const userCookie = getCookie(event, 'user_data')
    if (!userCookie) throw createError({ statusCode: 401, message: 'Login diperlukan' })
    const user = JSON.parse(userCookie)

    // 2. Baca Body sebagai JSON (Bukan Multipart/FormData lagi)
    const body = await readBody(event)
    
    // Ambil data yang dikirim dari Client setelah sukses upload ke Cloudinary
    const { 
      title, 
      folderId, 
      fileUrl,    // URL file yang sudah ada di Cloudinary
      fileName,   
      fileSize,   // Ukuran dalam bytes
      fileType 
    } = body

    // 3. Validasi Data
    if (!fileUrl || !folderId) {
      throw createError({ statusCode: 400, message: "Data file tidak lengkap (URL/Folder ID hilang)" })
    }

    // 4. Cek Validitas Folder & Hak Akses
    const folderIdInt = parseInt(folderId)
    const targetFolder = await prisma.folder.findUnique({ where: { id: folderIdInt } })

    if (!targetFolder) {
      throw createError({ statusCode: 404, message: "Folder tujuan tidak ditemukan" })
    }

    // Hanya Admin atau Pemilik Folder yang boleh simpan
    if (user.role !== 'admin' && targetFolder.userId !== user.id) {
      throw createError({ statusCode: 403, message: "Anda tidak memiliki akses ke folder ini" })
    }

    // 5. Simpan Metadata ke Database
    // (File fisik sudah aman di Cloudinary, kita hanya catat link-nya)
    const archive = await prisma.archive.create({
      data: {
        title: title || fileName,     // Gunakan nama file jika judul kosong
        filePath: fileUrl,            // Link Cloudinary
        fileSize: parseInt(fileSize), // Pastikan jadi integer
        fileType: fileType || 'unknown',
        folderId: folderIdInt,
        uploaderId: user.id
      }
    })

    return archive

  } catch (e: any) {
    console.error("DB SAVE ERROR:", e)
    throw createError({ statusCode: e.statusCode || 500, message: e.message })
  }
})
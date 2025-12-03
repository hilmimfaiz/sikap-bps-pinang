import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Pastikan Anda sudah memiliki utilitas saveFile di server/utils/fileUpload.ts

export default defineEventHandler(async (event) => {
  try {
    // 1. Validasi User
    const userCookie = getCookie(event, 'user_data')
    if (!userCookie) {
      throw createError({ statusCode: 401, message: 'Login diperlukan' })
    }
    const user = JSON.parse(userCookie)

    // 2. Baca Multipart Form Data
    const files = await readMultipartFormData(event)
    if (!files || files.length === 0) {
      throw createError({ statusCode: 400, message: "Tidak ada file yang diunggah" })
    }

    // Ambil field dari form-data
    const uploadedFile = files.find(f => f.name === 'file')
    const folderIdStr = files.find(f => f.name === 'folderId')?.data.toString()
    const title = files.find(f => f.name === 'title')?.data.toString()

    // Validasi input dasar
    if (!uploadedFile) throw createError({ statusCode: 400, message: "File wajib ada" })
    if (!folderIdStr) throw createError({ statusCode: 400, message: "Folder ID wajib ada" })

    // --- [VALIDASI TAMBAHAN] CEK UKURAN FILE (Server Side) ---
    const MAX_SIZE = 100 * 1024 * 1024; // 100MB dalam bytes
    if (uploadedFile.data.length > MAX_SIZE) {
      throw createError({ 
        statusCode: 413, // Payload Too Large
        message: "Ukuran file melebihi batas maksimum 100MB" 
      })
    }
    // ---------------------------------------------------------

    const folderId = parseInt(folderIdStr)

    // 3. CEK VALIDITAS FOLDER TUJUAN & KEPEMILIKAN
    const targetFolder = await prisma.folder.findUnique({
      where: { id: folderId }
    })

    if (!targetFolder) {
      throw createError({ statusCode: 404, message: "Folder tujuan tidak ditemukan" })
    }

    // PROTEKSI: Cek apakah user berhak upload ke folder ini
    // Logika: Admin boleh upload kemana saja, User biasa hanya ke foldernya sendiri
    if (user.role !== 'admin' && targetFolder.userId !== user.id) {
      throw createError({ 
        statusCode: 403, 
        message: "Akses Ditolak: Anda hanya bisa mengupload ke folder milik sendiri." 
      })
    }

    // 4. Simpan Fisik File (Menggunakan utils/fileUpload.ts)
    const fileInfo = await saveFile(uploadedFile) 

    // 5. Simpan Record ke Database
    const archive = await prisma.archive.create({
      data: {
        title: title || fileInfo.fileName, // Gunakan nama file asli jika title kosong
        filePath: fileInfo.filePath,
        fileSize: fileInfo.fileSize,
        fileType: fileInfo.fileType,
        folderId: folderId,
        uploaderId: user.id
      }
    })

    return archive

  } catch (e: any) {
    // Log error lengkap di console server untuk debugging
    console.error("UPLOAD FILE GAGAL:", e.message || e)
    
    throw createError({
      statusCode: e.statusCode || 500,
      message: e.message || "Terjadi kesalahan sistem saat mengupload arsip."
    })
  }
})
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// JANGAN ADA IMPORT saveFile DISINI. Nitro auto-imports it.

export default defineEventHandler(async (event) => {
  try {
    const userCookie = getCookie(event, 'user_data')
    if (!userCookie) throw createError({ statusCode: 401, message: 'Login diperlukan' })
    const user = JSON.parse(userCookie)

    const files = await readMultipartFormData(event)
    if (!files || files.length === 0) throw createError({ statusCode: 400, message: "Tidak ada file" })

    const uploadedFile = files.find(f => f.name === 'file')
    const folderIdStr = files.find(f => f.name === 'folderId')?.data.toString()
    const title = files.find(f => f.name === 'title')?.data.toString()

    if (!uploadedFile || !folderIdStr) throw createError({ statusCode: 400, message: "File & Folder ID wajib" })

    // Validasi Ukuran 100MB
    const MAX_SIZE = 100 * 1024 * 1024;
    if (uploadedFile.data.length > MAX_SIZE) {
      throw createError({ statusCode: 413, message: "Ukuran file max 100MB" })
    }

    const folderId = parseInt(folderIdStr)
    const targetFolder = await prisma.folder.findUnique({ where: { id: folderId } })

    if (!targetFolder) throw createError({ statusCode: 404, message: "Folder tidak ditemukan" })

    if (user.role !== 'admin' && targetFolder.userId !== user.id) {
      throw createError({ statusCode: 403, message: "Akses Ditolak" })
    }

    // Panggil saveFile langsung (Auto-imported)
    const fileInfo: any = await saveFile(uploadedFile)

    const archive = await prisma.archive.create({
      data: {
        title: title || fileInfo.fileName,
        filePath: fileInfo.filePath,
        fileSize: fileInfo.fileSize,
        fileType: fileInfo.fileType,
        folderId: folderId,
        uploaderId: user.id
      }
    })

    return archive

  } catch (e: any) {
    console.error("UPLOAD ERROR:", e)
    throw createError({ statusCode: e.statusCode || 500, message: e.message })
  }
})
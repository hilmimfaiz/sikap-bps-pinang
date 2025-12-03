import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  // 1. Validasi User
  const userCookie = getCookie(event, 'user_data')
  if (!userCookie) {
    throw createError({ statusCode: 401, message: 'Unauthorized: Harap login' })
  }
  const user = JSON.parse(userCookie)

  // 2. Baca Body
  const body = await readBody(event)
  if (!body.name) {
    throw createError({ statusCode: 400, message: 'Nama folder wajib diisi' })
  }

  try {
    // Siapkan data folder
    const folderData: any = {
      name: body.name,
      userId: user.id
    }

    // [FIX UTAMA] Jika ada parentId, simpan sebagai sub-folder
    if (body.parentId) {
      folderData.parentId = parseInt(body.parentId)
    }

    // 3. Simpan ke Database
    const folder = await prisma.folder.create({
      data: folderData
    })

    return folder
  } catch (error) {
    console.error('Create Folder Error:', error)
    throw createError({ statusCode: 500, message: 'Gagal membuat folder' })
  }
})
import { PrismaClient } from '@prisma/client'
import { createNotification } from '../../utils/notification'
import { saveFile } from '../../utils/fileUpload'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  try {
    // 1. Ambil User dari Cookie (Lebih Aman)
    const userCookie = getCookie(event, 'user_data')
    if (!userCookie) throw createError({ statusCode: 401, message: 'Unauthorized' })
    const currentUser = JSON.parse(userCookie)

    const files = await readMultipartFormData(event)
    if (!files) throw createError({ statusCode: 400, message: 'Data tidak valid' })

    const getValue = (name: string) => {
      const field = files.find(f => f.name === name)
      return field ? field.data.toString() : null
    }

    // Gunakan ID dari Cookie untuk keamanan, fallback ke form jika perlu (tapi cookie prioritas)
    const id = currentUser.id 
    const name = getValue('name') || currentUser.name
    const email = getValue('email') || currentUser.email

    // 2. Siapkan Data Update
    const updateData: any = {
      name: name,
      email: email
    }

    // 3. Cek File Foto (Key 'photo' sesuai frontend)
    let isPhotoUpdated = false
    const photoFile = files.find(f => f.name === 'photo' && f.filename)
    
    if (photoFile) {
      if (!photoFile.type?.startsWith('image/')) {
        throw createError({ statusCode: 400, message: 'File harus berupa gambar' })
      }
      const savedFile = await saveFile(photoFile)
      updateData.photoProfile = savedFile.filePath
      isPhotoUpdated = true
    }

    // 4. Update Database
    const updatedUser = await prisma.user.update({
      where: { id: parseInt(id) },
      data: updateData,
      select: {
        id: true, 
        name: true, 
        email: true, 
        photoProfile: true,
        role: { select: { name: true } }, 
        createdAt: true
      }
    })

    // 5. Kirim Notifikasi
    let notifTitle = 'Profil Diperbarui'
    let notifMessage = 'Informasi profil Anda berhasil diperbarui.'

    if (isPhotoUpdated) {
      notifTitle = 'Foto Profil Baru'
      notifMessage = 'Foto profil Anda berhasil diubah.'
    }

    await createNotification(
      updatedUser.id,
      notifTitle,
      notifMessage,
      '/dashboard/profile'
    )

    // Format response agar sesuai dengan cookie frontend
    const userResponse = {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      photoProfile: updatedUser.photoProfile,
      role: updatedUser.role.name, 
      createdAt: updatedUser.createdAt
    }

    return {
      message: 'Profil berhasil diperbarui',
      user: userResponse
    }

  } catch (error: any) {
    console.error('Update error:', error)
    if (error.code === 'P2002') {
      throw createError({ statusCode: 400, message: 'Email sudah digunakan user lain' })
    }
    throw createError({ 
      statusCode: error.statusCode || 500, 
      message: error.message || 'Gagal update profil' 
    })
  }
})
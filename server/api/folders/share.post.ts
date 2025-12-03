// server/api/folders/share.post.ts
import { createNotification } from '../../utils/notification'

export default defineEventHandler(async (event) => {
  const userCookie = getCookie(event, 'user_data')
  if (!userCookie) throw createError({ statusCode: 401 })
  const currentUser = JSON.parse(userCookie)

  const body = await readBody(event)
  const { folderId, targetUserIds } = body 

  if (!folderId || !Array.isArray(targetUserIds)) {
    throw createError({ statusCode: 400, message: 'Data share tidak valid' })
  }

  // 1. Cek Kepemilikan (Hanya Owner atau Admin yang boleh share)
  const folder = await prisma.folder.findUnique({ where: { id: parseInt(folderId) } })
  if (!folder) throw createError({ statusCode: 404, message: 'Folder tidak ada' })

  if (currentUser.role !== 'admin' && folder.userId !== currentUser.id) {
    throw createError({ statusCode: 403, message: 'Anda tidak berhak membagikan folder ini' })
  }

  // 2. Update Share (Hapus yang lama, masukkan yang baru)
  try {
    await prisma.$transaction(async (tx) => {
      // Hapus share lama untuk folder ini (HAPUS KOMA DI AKHIR BARIS INI)
      await tx.folderShare.deleteMany({ where: { folderId: parseInt(folderId) } })
      
      // Filter user (jangan share ke diri sendiri)
      const finalTargets = targetUserIds.filter((uid: number) => uid !== currentUser.id)

      // Insert share baru
      if (finalTargets.length > 0) {
        await tx.folderShare.createMany({
          data: finalTargets.map((uid: number) => ({
            folderId: parseInt(folderId),
            userId: uid
          }))
        })
      }
    })

    // 3. KIRIM NOTIFIKASI
    const targets = targetUserIds.filter((uid: number) => uid !== currentUser.id)
    
    await Promise.all(targets.map((uid: number) => {
      return createNotification(
        uid,
        'Folder Dibagikan',
        `${currentUser.name} membagikan folder "${folder.name}" kepada Anda.`,
        '/dashboard/archives' 
      )
    }))
    
    return { message: 'Akses folder berhasil diperbarui' }
  } catch (e) {
    console.error(e)
    throw createError({ statusCode: 500, message: 'Gagal membagikan folder' })
  }
})
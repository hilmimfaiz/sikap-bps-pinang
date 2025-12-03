import { createNotification } from '../../utils/notification'

export default defineEventHandler(async (event) => {
  const userCookie = getCookie(event, 'user_data')
  if (!userCookie) throw createError({ statusCode: 401, message: 'Unauthorized' })
  const currentUser = JSON.parse(userCookie)

  const body = await readBody(event)
  const { archiveId, targetUserIds } = body 

  if (!archiveId || !Array.isArray(targetUserIds)) {
    throw createError({ statusCode: 400, message: 'Data share tidak valid' })
  }
  
  const fileId = parseInt(archiveId)

  // 1. Cek Kepemilikan File (Hanya Admin atau Uploader)
  const file = await prisma.archive.findUnique({ where: { id: fileId } })
  if (!file) throw createError({ statusCode: 404, message: 'File tidak ditemukan' })

  if (currentUser.role !== 'admin' && file.uploaderId !== currentUser.id) {
    throw createError({ statusCode: 403, message: 'Anda tidak berhak membagikan file ini' })
  }

  // 2. Transaction: Hapus share lama dan masukkan yang baru (Strategi Sync)
  try {
    await prisma.$transaction(async (tx) => {
      // Hapus semua share lama untuk file ini
      await tx.archiveShare.deleteMany({ where: { archiveId: fileId } })
      
      // Filter user (jangan share ke diri sendiri)
      const finalTargets = targetUserIds.filter((uid: number) => uid !== currentUser.id)

      // Insert share baru
      if (finalTargets.length > 0) {
        await tx.archiveShare.createMany({
            data: finalTargets.map((uid: number) => ({
                archiveId: fileId,
                userId: uid
            }))
        })
      }
    })

    // 3. KIRIM NOTIFIKASI
    // Mengirim notifikasi ke semua target user (kecuali diri sendiri)
    const targets = targetUserIds.filter((uid: number) => uid !== currentUser.id)
    
    // Gunakan Promise.all agar pengiriman notifikasi berjalan paralel dan tidak memperlambat response
    await Promise.all(targets.map((uid: number) => {
      return createNotification(
        uid,
        'File Dibagikan',
        `${currentUser.name} membagikan file "${file.title}" kepada Anda.`,
        '/dashboard/archives' // Link tujuan saat notifikasi diklik
      )
    }))
    
    return { message: 'Akses file berhasil diperbarui' }
  } catch (e) {
    console.error(e)
    throw createError({ statusCode: 500, message: 'Gagal membagikan file' })
  }
})
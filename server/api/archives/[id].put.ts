export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)
  const userCookie = getCookie(event, 'user_data')

  // Validasi dasar
  if (!id || !userCookie) {
    throw createError({ statusCode: 400, message: 'Request tidak valid' })
  }

  const user = JSON.parse(userCookie)
  const { title } = body

  // Validasi input
  if (!title || !title.trim()) {
    throw createError({ statusCode: 400, message: 'Nama file tidak boleh kosong' })
  }

  try {
    // 1. Cari File di Database
    const archive = await prisma.archive.findUnique({
      where: { id: parseInt(id) }
    })

    if (!archive) {
      throw createError({ statusCode: 404, message: 'File tidak ditemukan' })
    }

    // 2. Cek Hak Akses (Hanya Admin atau Pemilik yang boleh mengedit)
    if (user.role !== 'admin' && archive.uploaderId !== user.id) {
      throw createError({ statusCode: 403, message: 'Anda tidak berhak mengubah nama file ini' })
    }

    // 3. Update Nama File di Database
    const updatedArchive = await prisma.archive.update({
      where: { id: parseInt(id) },
      data: {
        title: title.trim()
      }
    })

    return { 
      message: 'Nama file berhasil diubah', 
      data: updatedArchive 
    }

  } catch (error: any) {
    throw createError({ 
      statusCode: error.statusCode || 500, 
      message: error.message || 'Terjadi kesalahan internal server' 
    })
  }
})
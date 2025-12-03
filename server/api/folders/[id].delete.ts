export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const userCookie = getCookie(event, 'user_data')

  if (!id || !userCookie) throw createError({ statusCode: 400, message: 'Data kurang' })
  
  const user = JSON.parse(userCookie)

  try {
    // 1. Cek dulu folder ini milik siapa
    const folder = await prisma.folder.findUnique({
      where: { id: parseInt(id) },
      select: { userId: true } // Kita hanya butuh info owner
    })

    if (!folder) throw createError({ statusCode: 404, message: 'Folder tidak ditemukan' })

    // 2. Cek Izin Hapus
    // Hanya boleh jika Admin ATAU Pemilik asli
    if (user.role !== 'admin' && folder.userId !== user.id) {
      throw createError({ statusCode: 403, message: 'Dilarang menghapus folder orang lain!' })
    }

    // 3. Proses Hapus (Hapus isinya dulu agar bersih)
    await prisma.archive.deleteMany({ where: { folderId: parseInt(id) } })
    
    await prisma.folder.delete({
      where: { id: parseInt(id) }
    })
    
    return { message: 'Folder berhasil dihapus' }
  } catch (error: any) {
    throw createError({ statusCode: error.statusCode || 500, message: error.message })
  }
})
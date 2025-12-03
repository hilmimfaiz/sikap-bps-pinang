export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const userCookie = getCookie(event, 'user_data')
  
  if (!id || !userCookie) throw createError({ statusCode: 400, message: 'Request invalid' })

  const user = JSON.parse(userCookie)

  // [PROTEKSI] Hanya Admin yang boleh hapus
  if (user.role !== 'admin') {
    throw createError({ statusCode: 403, message: 'Akses ditolak: Hanya Admin yang bisa menghapus kategori.' })
  }

  try {
    await prisma.category.delete({
      where: { id: parseInt(id) }
    })
    return { message: 'Kategori berhasil dihapus' }
  } catch (error) {
    throw createError({ statusCode: 500, message: 'Gagal menghapus (Mungkin sedang digunakan oleh arsip lain)' })
  }
})
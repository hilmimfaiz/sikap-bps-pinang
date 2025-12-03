export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const userCookie = getCookie(event, 'user_data')
  
  if (!id || !userCookie) throw createError({ statusCode: 400, message: 'Request invalid' })

  const user = JSON.parse(userCookie)

  // [PROTEKSI] Viewer tidak boleh menghapus data
  if (user.role === 'viewer') {
    throw createError({ statusCode: 403, message: 'Viewer tidak memiliki izin menghapus data.' })
  }

  try {
    await prisma.link.delete({
      where: { id: parseInt(id) }
    })
    return { message: 'Link berhasil dihapus' }
  } catch (error) {
    throw createError({ statusCode: 500, message: 'Gagal menghapus link' })
  }
})
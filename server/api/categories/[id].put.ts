export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const userCookie = getCookie(event, 'user_data')
  
  if (!id || !userCookie) throw createError({ statusCode: 400, message: 'Request invalid' })

  const user = JSON.parse(userCookie)

  // [PROTEKSI] Hanya Admin yang boleh update
  if (user.role !== 'admin') {
    throw createError({ statusCode: 403, message: 'Akses ditolak: Hanya Admin yang bisa mengedit kategori.' })
  }

  const body = await readBody(event)

  if (!body.name) {
    throw createError({ statusCode: 400, message: 'Data tidak lengkap' })
  }

  try {
    const category = await prisma.category.update({
      where: { id: parseInt(id) },
      data: { 
        name: body.name,
        inChargeId: body.inChargeId ? parseInt(body.inChargeId) : undefined 
      }
    })
    return category
  } catch (error) {
    throw createError({ statusCode: 500, message: 'Gagal update kategori' })
  }
})
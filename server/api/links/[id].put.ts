export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const userCookie = getCookie(event, 'user_data')
  
  if (!id || !userCookie) throw createError({ statusCode: 400, message: 'Request invalid' })
  
  const user = JSON.parse(userCookie)

  // [PROTEKSI] Viewer tidak boleh mengedit data
  if (user.role === 'viewer') {
    throw createError({ statusCode: 403, message: 'Viewer tidak memiliki izin mengedit data.' })
  }

  const body = await readBody(event)
  const updateData: any = {}

  if (body.title) updateData.title = body.title
  if (body.url) updateData.url = body.url
  if (body.categoryId) updateData.categoryId = parseInt(body.categoryId)
  
  if (typeof body.isActive === 'boolean') {
    updateData.isActive = body.isActive
  }

  try {
    const link = await prisma.link.update({
      where: { id: parseInt(id) },
      data: updateData
    })
    return link
  } catch (error) {
    throw createError({ statusCode: 500, message: 'Gagal mengupdate link' })
  }
})
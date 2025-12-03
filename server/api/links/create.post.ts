export default defineEventHandler(async (event) => {
  const userCookie = getCookie(event, 'user_data')
  if (!userCookie) throw createError({ statusCode: 401, message: 'Unauthorized' })
  
  const user = JSON.parse(userCookie)

  // [PROTEKSI] Viewer tidak boleh menambah data
  if (user.role === 'viewer') {
    throw createError({ statusCode: 403, message: 'Viewer tidak memiliki izin menambah data.' })
  }

  const body = await readBody(event)

  if (!body.title || !body.url || !body.categoryId) {
    throw createError({ statusCode: 400, message: 'Data tidak lengkap' })
  }

  try {
    const link = await prisma.link.create({
      data: {
        title: body.title,
        url: body.url,
        categoryId: parseInt(body.categoryId),
        isActive: body.isActive ?? true
      }
    })
    return link
  } catch (error) {
    throw createError({ statusCode: 500, message: 'Gagal membuat link' })
  }
})
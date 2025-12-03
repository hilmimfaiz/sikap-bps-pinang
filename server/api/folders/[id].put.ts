export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)
  const userCookie = getCookie(event, 'user_data')

  if (!id || !body.name || !userCookie) {
    throw createError({ statusCode: 400, message: 'Data tidak lengkap' })
  }

  const user = JSON.parse(userCookie)

  try {
    // 1. Cek Kepemilikan
    const folder = await prisma.folder.findUnique({ where: { id: parseInt(id) } })
    
    if (!folder) throw createError({ statusCode: 404, message: 'Folder tidak ada' })

    if (user.role !== 'admin' && folder.userId !== user.id) {
      throw createError({ statusCode: 403, message: 'Dilarang mengubah folder orang lain' })
    }

    // 2. Update
    const updatedFolder = await prisma.folder.update({
      where: { id: parseInt(id) },
      data: { name: body.name }
    })
    return updatedFolder
  } catch (error: any) {
    throw createError({ statusCode: error.statusCode || 500, message: error.message })
  }
})
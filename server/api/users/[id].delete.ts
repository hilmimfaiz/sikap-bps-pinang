export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) throw createError({ statusCode: 400, message: 'ID User diperlukan' })

  try {
    await prisma.user.delete({
      where: { id: parseInt(id) }
    })
    return { message: 'User berhasil dihapus' }
  } catch (error) {
    throw createError({ statusCode: 500, message: 'Gagal menghapus user' })
  }
})
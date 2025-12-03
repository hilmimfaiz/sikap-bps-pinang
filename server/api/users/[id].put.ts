import bcrypt from 'bcrypt'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  if (!id) throw createError({ statusCode: 400, message: 'ID User diperlukan' })

  // Siapkan data update
  const updateData: any = {}
  
  // Update data profil biasa
  if (body.name) updateData.name = body.name
  if (body.email) updateData.email = body.email
  if (body.roleId) updateData.roleId = parseInt(body.roleId)
  
  // [PENTING] Update status Kunci/Aktif
  // Kita cek typeof boolean karena nilainya bisa false
  if (typeof body.isActive === 'boolean') {
    updateData.isActive = body.isActive
  }

  // Update Password (hanya jika diisi)
  if (body.password && body.password.trim() !== '') {
    updateData.password = await bcrypt.hash(body.password, 10)
  }

  try {
    const user = await prisma.user.update({
      where: { id: parseInt(id) },
      data: updateData
    })
    return { message: 'User berhasil diupdate', user }
  } catch (error: any) {
    if (error.code === 'P2002') {
      throw createError({ statusCode: 400, message: 'Email sudah digunakan' })
    }
    throw createError({ statusCode: 500, message: 'Gagal update user' })
  }
})
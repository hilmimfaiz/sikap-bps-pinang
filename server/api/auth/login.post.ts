import bcrypt from 'bcrypt'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { email, password } = body

  // 1. Cari User
  const user = await prisma.user.findUnique({
    where: { email },
    include: { role: true } 
  })

  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Email tidak ditemukan' })
  }

  // 2. [BARU] Cek Apakah Akun Dikunci (isActive = false)
  if (user.isActive === false) {
    throw createError({ 
      statusCode: 403, 
      statusMessage: 'Akun Anda telah dinonaktifkan. Hubungi Admin.' 
    })
  }

  // 3. Cek Password
  const isMatch = await bcrypt.compare(password, user.password)
  if (!isMatch) {
    throw createError({ statusCode: 401, statusMessage: 'Password salah' })
  }

  // 4. Login Berhasil
  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role.name,
      photoProfile: user.photoProfile
    }
  }
})
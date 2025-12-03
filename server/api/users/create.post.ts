// server/api/users/create.post.ts
import bcrypt from 'bcrypt'
// HAPUS import PrismaClient dan 'const prisma = ...'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)

    // 1. Validasi
    if (!body.name || !body.email || !body.password || !body.roleId) {
      throw createError({ statusCode: 400, message: "Semua field wajib diisi" })
    }

    // 2. Hash Password
    const hashedPassword = await bcrypt.hash(body.password, 10)

    // 3. Simpan ke DB (gunakan variabel global 'prisma')
    const user = await prisma.user.create({
      data: {
        name: body.name,
        email: body.email,
        password: hashedPassword,
        roleId: parseInt(body.roleId)
      }
    })
    
    return { message: "User berhasil dibuat" }

  } catch (e: any) {
    // Menangani error duplicate email (kode P2002 dari Prisma)
    if (e.code === 'P2002') {
      throw createError({ statusCode: 400, message: "Email sudah terdaftar" })
    }
    
    // Throw error lain apa adanya atau bungkus
    throw createError({
      statusCode: e.statusCode || 500,
      message: e.message || "Gagal membuat user"
    })
  }
})
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { email, password } = body

  // 1. Cari User
  const user = await prisma.user.findUnique({
    where: { email },
    include: { role: true } // Ambil info role juga
  })

  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Email tidak ditemukan' })
  }

  // 2. Cek Password
  const isMatch = await bcrypt.compare(password, user.password)
  if (!isMatch) {
    throw createError({ statusCode: 401, statusMessage: 'Password salah' })
  }

  // 3. Simpan session sederhana (bisa dikembangkan ke JWT nanti)
  // Kita return data user (tanpa password) ke frontend
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role.name,
    photo_profile: null // placeholder
  }
})
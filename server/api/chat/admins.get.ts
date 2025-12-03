import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  // Ambil role admin
  const adminRole = await prisma.role.findUnique({ where: { name: 'admin' } })
  
  if (!adminRole) {
    // Fallback jika role belum disetup, ambil user ID 1
    const fallbackAdmin = await prisma.user.findUnique({ where: { id: 1 } })
    return fallbackAdmin ? [fallbackAdmin] : []
  }

  // Ambil SEMUA user yang punya role admin
  const admins = await prisma.user.findMany({
    where: { roleId: adminRole.id },
    select: {
      id: true,
      name: true,
      photoProfile: true,
      role: { select: { name: true } }
    }
  })

  return admins.map(a => ({
    id: a.id,
    name: a.name,
    photo: a.photoProfile,
    role: 'Super Admin' // Label untuk UI
  }))
})
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  // 1. Buat Roles (Wajib ada)
  const adminRole = await prisma.role.upsert({
    where: { name: 'admin' },
    update: {},
    create: { name: 'admin' },
  })

  await prisma.role.upsert({ where: { name: 'editor' }, update: {}, create: { name: 'editor' } })
  await prisma.role.upsert({ where: { name: 'viewer' }, update: {}, create: { name: 'viewer' } })

  // 2. Buat User Admin Default
  const hashedPassword = await bcrypt.hash('admin123', 10)
  
  await prisma.user.upsert({
    where: { email: 'admin@sikap.com' },
    update: {},
    create: {
      name: 'Super Admin',
      email: 'admin@sikap.com',
      password: hashedPassword,
      roleId: adminRole.id
    },
  })

  console.log('Database seeded successfully!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
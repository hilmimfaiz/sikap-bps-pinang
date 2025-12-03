export default defineEventHandler(async (event) => {
  try {
    // Ambil data secara paralel agar lebih cepat
    const [archives, links, folders] = await Promise.all([
      prisma.archive.findMany({ take: 5, orderBy: { createdAt: 'desc' } }),
      prisma.link.findMany({ take: 5, orderBy: { id: 'desc' } }),
      prisma.folder.findMany({ take: 5, orderBy: { createdAt: 'desc' } })
    ])

    return {
      recentArchives: archives,
      recentLinks: links,
      recentFolders: folders
    }
  } catch (error) {
    throw createError({ statusCode: 500, message: 'Gagal memuat konten dashboard' })
  }
})
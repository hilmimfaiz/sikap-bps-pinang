import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  const idParam = getRouterParam(event, 'id')
  const userCookie = getCookie(event, 'user_data')
  
  if (!idParam || !userCookie) throw createError({ statusCode: 400, message: 'Invalid Request' })

  const user = JSON.parse(userCookie)
  const folderId = parseInt(idParam)
  const currentUserId = user.id ? parseInt(user.id) : null 

  if (!currentUserId) throw createError({ statusCode: 401, message: 'Unauthorized' })

  // Ambil Parameter Pagination & Search
  const { page, limit, search } = getQuery(event)
  const pageNumber = page ? parseInt(String(page)) : 1
  const limitNumber = limit ? parseInt(String(limit)) : 10
  const skip = (pageNumber - 1) * limitNumber
  const searchQuery = search ? String(search) : ''

  try {
    // 1. Cek Folder Dasar & Hak Akses
    // Kita cek apakah user punya akses ke folder ini (sebagai Owner, Admin, atau Shared User)
    const folderBasic = await prisma.folder.findUnique({
      where: { id: folderId },
      include: { shares: { select: { userId: true } } }
    })
    
    if (!folderBasic) throw createError({ statusCode: 404, message: 'Folder tidak ditemukan' })

    const isOwner = folderBasic.userId === currentUserId
    const isAdmin = user.role === 'admin'
    const isShared = folderBasic.shares.some(s => s.userId === currentUserId)

    // Jika bukan Owner, bukan Admin, dan tidak dikasih akses Folder -> Tolak
    if (!isOwner && !isAdmin && !isShared) {
      throw createError({ statusCode: 403, message: 'Akses ditolak' })
    }

    // 2. Bangun Query Filter (Advanced)
    // Gunakan array AND untuk menggabungkan berbagai kondisi filter agar aman dan tidak saling menimpa
    const archiveWhere: any = {
      folderId: folderId,
      AND: [] 
    }

    const childrenWhere: any = {
      parentId: folderId,
      AND: []
    }

    // [LOGIKA UTAMA: RESTRIKSI FILE DALAM FOLDER YANG DISHARE]
    // Jika user bukan pemilik folder dan bukan admin (berarti dia adalah Viewer/Editor tamu),
    // Maka HANYA tampilkan file yang:
    // 1. Di-upload oleh user itu sendiri, ATAU
    // 2. Secara eksplisit dibagikan ke user tersebut (ada di tabel fileShares)
    if (!isOwner && !isAdmin) {
      archiveWhere.AND.push({
        OR: [
          { uploaderId: currentUserId }, // File milik sendiri
          { fileShares: { some: { userId: currentUserId } } } // File yang dishare spesifik ke user
        ]
      })
    }

    // Filter Search (Jika ada pencarian)
    if (searchQuery) {
      // Search untuk File
      archiveWhere.AND.push({
        OR: [
          { title: { contains: searchQuery } },
          { fileType: { contains: searchQuery } },
          { uploader: { name: { contains: searchQuery } } }
        ]
      })

      // Search untuk Sub-folder
      childrenWhere.AND.push({
        name: { contains: searchQuery }
      })
    }

    // Bersihkan AND kosong (opsional, untuk kebersihan query)
    if (archiveWhere.AND.length === 0) delete archiveWhere.AND
    if (childrenWhere.AND.length === 0) delete childrenWhere.AND

    // 3. Eksekusi Query Database
    const [totalArchives, folderData] = await prisma.$transaction([
      // Hitung total file yang sesuai filter (untuk pagination)
      prisma.archive.count({ where: archiveWhere }),
      
      // Ambil data folder & isinya
      prisma.folder.findUnique({
        where: { id: folderId },
        include: {
          // Sub-folders
          children: {
            where: childrenWhere,
            orderBy: { createdAt: 'desc' },
            include: {
              user: { select: { name: true } },
              _count: { select: { archives: true } }
            }
          },

          // Files (Archives) - Akan mengikuti filter archiveWhere yang ketat di atas
          archives: {
            where: archiveWhere,
            skip: skip,
            take: limitNumber,
            orderBy: { createdAt: 'desc' },
            include: {
              uploader: { select: { name: true } },
              fileShares: { select: { userId: true } }
            }
          },
          user: { select: { id: true, name: true, email: true } },
          shares: { select: { userId: true } },
          _count: { select: { archives: true } }
        }
      })
    ])

    if (!folderData) throw createError({ statusCode: 404, message: 'Data folder tidak ditemukan' })

    // 4. Return Response
    return {
      folder: folderData,
      meta: {
        total: totalArchives,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(totalArchives / limitNumber)
      }
    }

  } catch (error: any) {
    console.error('API Error:', error)
    throw createError({ statusCode: error.statusCode || 500, message: error.message || 'Internal Server Error' })
  }
})
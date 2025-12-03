import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  try {
    // 1. Cek Hak Akses (Authorization) - Hanya Admin
    const userCookie = getCookie(event, 'user_data')
    if (!userCookie) {
      throw createError({ statusCode: 401, message: 'Unauthorized: Silakan login.' })
    }
    
    const currentUser = JSON.parse(userCookie)

    if (currentUser.role !== 'admin') {
      throw createError({ statusCode: 403, message: 'Akses ditolak. Hanya admin yang bisa import user.' })
    }

    // 2. Baca File Upload (Multipart)
    const files = await readMultipartFormData(event)
    
    if (!files || files.length === 0) {
      throw createError({ statusCode: 400, message: 'File CSV wajib diunggah.' })
    }

    const csvFile = files.find(f => f.name === 'file')
    
    // Validasi file (Cek ekstensi .csv)
    if (!csvFile || !csvFile.filename?.toLowerCase().endsWith('.csv')) {
      throw createError({ statusCode: 400, message: 'Format file harus .csv' })
    }

    // 3. Parse Konten CSV
    const csvString = csvFile.data.toString('utf-8')
    // Pisahkan baris (handle baris baru Windows CRLF dan Unix LF)
    const lines = csvString.split(/\r?\n/).filter(line => line.trim() !== '')
    
    // Hapus baris pertama (Header: Name,Email,Password,Role)
    const dataRows = lines.slice(1)
    
    if (dataRows.length === 0) {
      throw createError({ statusCode: 400, message: 'File CSV kosong atau hanya berisi header.' })
    }

    // Persiapan Mapping Role (Agar tidak hardcode ID)
    const roles = await prisma.role.findMany()
    const roleMap = new Map(roles.map(r => [r.name.toLowerCase(), r.id]))
    
    // Default role ID jika kosong/tidak valid (biasanya ID 3 = viewer)
    const defaultRoleId = roleMap.get('viewer') || 3

    let successCount = 0
    let failCount = 0

    // 4. Loop dan Proses Data
    for (const row of dataRows) {
      // Split berdasarkan koma
      const cols = row.split(',').map(item => item?.trim())

      // Validasi jumlah kolom minimal (Name, Email, Password)
      if (cols.length < 3) {
        failCount++
        continue
      }

      const [name, email, password, roleName] = cols

      // Validasi data wajib
      if (!name || !email || !password) {
        failCount++
        continue
      }

      try {
        // Cek Email Duplikat
        const existingUser = await prisma.user.findUnique({
          where: { email }
        })

        if (existingUser) {
          failCount++ // Skip jika email sudah ada
          continue
        }

        // Tentukan Role ID
        let roleId = defaultRoleId
        if (roleName && roleMap.has(roleName.toLowerCase())) {
          roleId = roleMap.get(roleName.toLowerCase())!
        }

        // Simpan User ke Database
        await prisma.user.create({
          data: {
            name,
            email,
            password, // Catatan: Idealnya password di-hash (bcrypt/argon2) di sini jika ada utilitasnya
            roleId,
            isActive: true,
            photoProfile: null
          }
        })
        
        successCount++

      } catch (err) {
        console.error(`Gagal import baris: ${email}`, err)
        failCount++
      }
    }

    // 5. Return Response
    return {
      success: true,
      message: `Import selesai. Berhasil: ${successCount}, Gagal/Duplikat: ${failCount}`,
      meta: {
        total: dataRows.length,
        success: successCount,
        failed: failCount
      }
    }

  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Terjadi kesalahan saat memproses file CSV.'
    })
  }
})
export default defineEventHandler(async (event) => {
  // 1. Cek Auth & Role
  const userCookie = getCookie(event, 'user_data')
  if (!userCookie) throw createError({ statusCode: 401, message: 'Unauthorized' })
  
  const user = JSON.parse(userCookie)
  
  // [PROTEKSI] Hanya Admin yang boleh create
  if (user.role !== 'admin') {
    throw createError({ statusCode: 403, message: 'Akses ditolak: Hanya Admin yang bisa menambah kategori.' })
  }

  const body = await readBody(event)

  // [FIX] Hapus validasi body.inChargeId agar boleh null/kosong
  if (!body.name) {
    throw createError({ statusCode: 400, message: 'Nama kategori wajib diisi' })
  }

  try {
    const category = await prisma.category.create({
      data: {
        name: body.name,
        // [FIX] Jika inChargeId ada (truthy), parse ke int. Jika tidak, set null.
        inChargeId: body.inChargeId ? parseInt(String(body.inChargeId)) : null
      }
    })
    return category
  } catch (error) {
    throw createError({ statusCode: 500, message: 'Gagal membuat kategori' })
  }
})
export default defineEventHandler(async (event) => {
  // 1. Baca File Upload
  const files = await readMultipartFormData(event)
  if (!files || files.length === 0) {
    throw createError({ statusCode: 400, message: 'File CSV wajib diunggah' })
  }

  const csvFile = files.find(f => f.name === 'file')
  if (!csvFile || !csvFile.filename?.endsWith('.csv')) {
    throw createError({ statusCode: 400, message: 'Format file harus .csv' })
  }

  // 2. Parse CSV (Konversi Buffer ke String lalu ke Array Object)
  const csvString = csvFile.data.toString('utf-8')
  const lines = csvString.split(/\r?\n/).filter(line => line.trim() !== '')
  
  // Hapus Header (Baris pertama: Title,Url,Category)
  const dataRows = lines.slice(1)
  
  if (dataRows.length === 0) {
    throw createError({ statusCode: 400, message: 'File CSV kosong' })
  }

  let successCount = 0

  // 3. Loop setiap baris data
  for (const row of dataRows) {
    // Split sederhana berdasarkan koma (,)
    // Catatan: Ini parser sederhana. Untuk CSV kompleks (ada koma dalam kutip), sebaiknya pakai library 'papaparse'
    const [title, url, categoryName] = row.split(',').map(item => item?.trim())

    if (title && url) {
      // 4. Cari atau Buat Kategori berdasarkan Nama
      let categoryId: number
      const cleanCatName = categoryName || 'Umum' // Default jika kosong

      const existingCat = await prisma.category.findFirst({
        where: { name: cleanCatName }
      })

      if (existingCat) {
        categoryId = existingCat.id
      } else {
        const newCat = await prisma.category.create({ data: { name: cleanCatName } })
        categoryId = newCat.id
      }

      // 5. Simpan Link
      await prisma.link.create({
        data: {
          title,
          url,
          categoryId,
          isActive: true
        }
      })
      successCount++
    }
  }

  return { message: `Berhasil mengimport ${successCount} link.` }
})
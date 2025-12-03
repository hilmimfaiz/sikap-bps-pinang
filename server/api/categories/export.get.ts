export default defineEventHandler(async (event) => {
  try {
    // 1. Ambil data kategori (Hanya nama yang penting untuk import)
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
      select: { name: true }
    })

    // 2. Buat string CSV
    let csvContent = "Category Name\n" // Header
    
    categories.forEach(cat => {
      // Handle jika ada koma dalam nama kategori (bungkus dengan kutip)
      const safeName = cat.name.includes(',') ? `"${cat.name}"` : cat.name
      csvContent += `${safeName}\n`
    })

    // 3. Set Header agar browser mendownload file
    setHeader(event, 'Content-Type', 'text/csv')
    setHeader(event, 'Content-Disposition', 'attachment; filename="master_categories.csv"')

    return csvContent

  } catch (error) {
    throw createError({ statusCode: 500, message: 'Gagal mengekspor kategori' })
  }
})
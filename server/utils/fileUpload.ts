import { v2 as cloudinary } from 'cloudinary'

// Konfigurasi Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
})

export const saveFile = async (file: any) => {
  return new Promise((resolve, reject) => {
    // 1. Deteksi Tipe Resource
    // Jika mimetype dimulai dengan 'image/', gunakan 'image'. Selain itu (PDF, Doc), gunakan 'raw'.
    const isImage = file.type && file.type.startsWith('image/')
    const resourceType = isImage ? 'image' : 'raw'

    // [FIX] Tentukan Delivery Type
    // - Image: 'upload' (Publik Biasa)
    // - Raw/PDF: 'authenticated' (Terproteksi tapi kita beri akses via Signed URL untuk bypass 401)
    const deliveryType = isImage ? 'upload' : 'authenticated'

    // 2. Siapkan Public ID
    const originalName = file.filename || 'file'
    const nameWithoutExt = originalName.includes('.') 
      ? originalName.split('.').slice(0, -1).join('.') 
      : originalName
    
    const timestamp = Date.now()
    const ext = originalName.includes('.') ? `.${originalName.split('.').pop()}` : ''
    
    // Construct Public ID
    let publicId = `${nameWithoutExt}_${timestamp}`
    
    // Tambahkan ekstensi manual untuk file RAW agar nama file saat download benar
    if (resourceType === 'raw') {
        publicId += ext
    }

    // 3. Upload Stream
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'sikap_app_archives',
        resource_type: resourceType,
        public_id: publicId,
        type: deliveryType, // [FIX] Gunakan 'authenticated' untuk PDF
        access_mode: 'public', // Hint untuk akses
        overwrite: true
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary Upload Error:', error)
          return reject(createError({ statusCode: 500, message: 'Gagal upload ke Cloudinary' }))
        }

        // [FIX] Generate Final URL
        // Jika raw/authenticated, kita HARUS men-generate Signed URL agar tidak 401
        let finalUrl = result?.secure_url || ''

        if (result && resourceType === 'raw') {
          // Generate Signed URL secara manual untuk memastikan validitas
          finalUrl = cloudinary.url(result.public_id, {
            resource_type: 'raw',
            type: 'authenticated', // Sesuai tipe upload
            sign_url: true,        // Tambahkan signature (s--xxx--)
            secure: true,
            version: result.version // Sertakan versi untuk caching yang benar
          })
        }

        resolve({
          filePath: finalUrl, // URL ini sekarang aman dari error 401
          fileName: originalName,
          fileType: result?.format || file.type || 'unknown',
          fileSize: result?.bytes || 0
        })
      }
    )

    // Tulis buffer ke stream
    uploadStream.end(file.data)
  })
}

export const deleteFileFromStorage = async (fileUrl: string) => {
  try {
    if (!fileUrl.includes('cloudinary')) return

    // Contoh URL:
    // Raw Signed: https://res.cloudinary.com/.../raw/authenticated/s--SIG--/v123/sikap_app_archives/file.pdf
    // Image Public: https://res.cloudinary.com/.../image/upload/v123/sikap_app_archives/foto.jpg
    
    const splitUrl = fileUrl.split('/')
    // Ambil nama file paling belakang
    const filenameWithExt = splitUrl[splitUrl.length - 1]
    const folderName = 'sikap_app_archives' 
    
    // Deteksi Resource Type & Delivery Type dari URL
    const isRaw = fileUrl.includes('/raw/')
    const isAuthenticated = fileUrl.includes('/authenticated/')

    const resourceType = isRaw ? 'raw' : 'image'
    const deliveryType = isAuthenticated ? 'authenticated' : 'upload'

    let publicId = `${folderName}/${filenameWithExt}`

    // Bersihkan Public ID
    if (!isRaw && publicId.includes('.')) {
       // Image: Hapus ekstensi
       publicId = publicId.substring(0, publicId.lastIndexOf('.'))
    }
    
    // Hapus dengan parameter yang sesuai
    await cloudinary.uploader.destroy(publicId, { 
      resource_type: resourceType,
      type: deliveryType, // Penting: harus match dengan saat upload (authenticated/upload)
      invalidate: true    // Hapus dari CDN cache juga
    })
    
  } catch (error) {
    console.error('Gagal hapus file di Cloudinary:', error)
  }
}
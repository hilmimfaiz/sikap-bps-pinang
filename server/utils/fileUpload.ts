import { v2 as cloudinary } from 'cloudinary'

// Konfigurasi Cloudinary dari Environment Variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
})

export const saveFile = async (file: any) => {
  return new Promise((resolve, reject) => {
    // 1. Deteksi Tipe Resource
    // Jika mimetype dimulai dengan 'image/', gunakan 'image'.
    // Selain itu (termasuk PDF), gunakan 'raw' agar bisa didownload langsung tanpa error 401.
    const isImage = file.type && file.type.startsWith('image/')
    const resourceType = isImage ? 'image' : 'raw'

    // 2. Siapkan Public ID
    const originalName = file.filename || 'file'
    // Ambil nama tanpa ekstensi
    const nameWithoutExt = originalName.includes('.') 
      ? originalName.split('.').slice(0, -1).join('.') 
      : originalName
    
    // Generate timestamp agar unik
    const timestamp = Date.now()
    
    // Ambil ekstensi asli (misal: .pdf)
    const ext = originalName.includes('.') ? `.${originalName.split('.').pop()}` : ''
    
    // Construct Public ID
    let publicId = `${nameWithoutExt}_${timestamp}`
    
    // PENTING: Untuk 'raw', kita tambahkan ekstensi ke public_id agar URL download memiliki ekstensi yang benar.
    // Untuk 'image', Cloudinary otomatis menambahkan ekstensi di URL, jadi tidak perlu di public_id.
    if (resourceType === 'raw') {
        publicId += ext
    }

    // 3. Upload Stream
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'sikap_app_archives',
        resource_type: resourceType, // 'raw' atau 'image'
        public_id: publicId,
        access_mode: 'public',       // Memaksa file bersifat publik
        // use_filename & unique_filename opsional, kita sudah handle via public_id custom di atas
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary Upload Error:', error)
          return reject(createError({ statusCode: 500, message: 'Gagal upload ke Cloudinary' }))
        }

        resolve({
          filePath: result?.secure_url || '',
          fileName: originalName,
          // Fallback tipe file jika result.format kosong (umum terjadi di raw)
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

    // Contoh URL Raw: .../raw/upload/v123/sikap_app_archives/namafile.pdf
    // Contoh URL Img: .../image/upload/v123/sikap_app_archives/namafile.jpg
    
    const splitUrl = fileUrl.split('/')
    const filenameWithExt = splitUrl[splitUrl.length - 1]
    const folderName = 'sikap_app_archives' // Sesuaikan dengan folder upload Anda
    
    // Cek apakah URL mengandung /raw/ atau /image/
    const isRaw = fileUrl.includes('/raw/')
    const resourceType = isRaw ? 'raw' : 'image'

    let publicId = `${folderName}/${filenameWithExt}`

    // PENTING: Logic penghapusan berbeda untuk Image dan Raw
    // Image: Hapus ekstensi dari public_id (karena diupload tanpa ekstensi di public_id)
    // Raw: Biarkan ekstensi (karena diupload dengan ekstensi di public_id)
    if (!isRaw && publicId.includes('.')) {
       publicId = publicId.substring(0, publicId.lastIndexOf('.'))
    }

    // Panggil API Destroy Cloudinary
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType })
    
    // Opsional: Coba hapus sebagai video juga jika fileUrl terindikasi video, 
    // tapi logic di atas sudah cukup untuk PDF/Image.
    
  } catch (error) {
    console.error('Gagal hapus file di Cloudinary:', error)
  }
}
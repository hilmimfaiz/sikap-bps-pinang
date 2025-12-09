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
    // Upload stream ke Cloudinary
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'sikap_app_archives', 
        resource_type: 'auto',
        public_id: file.filename ? file.filename.split('.')[0] + '-' + Date.now() : undefined
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary Upload Error:', error)
          return reject(createError({ statusCode: 500, message: 'Gagal upload ke Cloudinary' }))
        }

        resolve({
          filePath: result?.secure_url || '',
          fileName: file.filename || 'file',
          fileType: result?.format || file.type || 'unknown',
          fileSize: result?.bytes || 0
        })
      }
    )
    uploadStream.end(file.data)
  })
}

export const deleteFileFromStorage = async (fileUrl: string) => {
  try {
    if (!fileUrl.includes('cloudinary')) return

    // Ekstrak public_id dari URL
    // URL: https://res.cloudinary.com/.../upload/v123/sikap_app_archives/namafile.jpg
    // Public ID: sikap_app_archives/namafile
    const splitUrl = fileUrl.split('/')
    const filenameWithExt = splitUrl[splitUrl.length - 1]
    const folderName = splitUrl[splitUrl.length - 2]
    
    // Hapus ekstensi (.jpg, .pdf) untuk mendapatkan public_id murni
    const publicId = `${folderName}/${filenameWithExt.substring(0, filenameWithExt.lastIndexOf('.'))}`

    // Hapus (Coba sebagai image dan raw/pdf)
    await cloudinary.uploader.destroy(publicId, { resource_type: 'image' })
    await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' })
    await cloudinary.uploader.destroy(publicId, { resource_type: 'video' }) // Jaga-jaga jika terdeteksi video
    
  } catch (error) {
    console.error('Gagal hapus file di Cloudinary:', error)
  }
}
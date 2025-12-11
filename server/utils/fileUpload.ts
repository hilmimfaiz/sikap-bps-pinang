import { v2 as cloudinary } from 'cloudinary'

// Konfigurasi Cloudinary dari Environment Variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
})

/**
 * BARU: Fungsi untuk membuat signature.
 * Ini dipanggil oleh API 'signature.get.ts' agar frontend bisa upload langsung 
 * ke Cloudinary tanpa mengekspos API Secret.
 */
export const generateCloudinarySignature = (params: Record<string, any>) => {
  const timestamp = Math.round((new Date).getTime() / 1000);
  
  const paramsToSign = {
    ...params,
    timestamp
  };

  // Membuat signature SHA-1 menggunakan API Secret
  const signature = cloudinary.utils.api_sign_request(paramsToSign, process.env.CLOUDINARY_API_SECRET as string);
  
  return {
    timestamp,
    signature,
    apiKey: process.env.CLOUDINARY_API_KEY,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME
  }
}

/**
 * LAMA: Tetap disimpan jika ada fitur lain yang upload file kecil lewat server.
 * (Tidak digunakan untuk upload file besar 100MB+)
 */
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

/**
 * LAMA: Fungsi untuk menghapus file dari Cloudinary saat data dihapus.
 */
export const deleteFileFromStorage = async (fileUrl: string) => {
  try {
    if (!fileUrl.includes('cloudinary')) return

    // Ekstrak public_id dari URL
    // Contoh URL: https://res.cloudinary.com/.../upload/v123/sikap_app_archives/namafile.jpg
    const splitUrl = fileUrl.split('/')
    const filenameWithExt = splitUrl[splitUrl.length - 1]
    const folderName = splitUrl[splitUrl.length - 2]
    
    // Hapus ekstensi (.jpg, .pdf) untuk mendapatkan public_id murni
    const publicId = `${folderName}/${filenameWithExt.substring(0, filenameWithExt.lastIndexOf('.'))}`

    // Hapus (Coba sebagai image, raw, dan video untuk memastikan terhapus)
    await cloudinary.uploader.destroy(publicId, { resource_type: 'image' })
    await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' })
    await cloudinary.uploader.destroy(publicId, { resource_type: 'video' }) 
    
  } catch (error) {
    console.error('Gagal hapus file di Cloudinary:', error)
  }
}
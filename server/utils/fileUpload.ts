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
    // Gunakan upload_stream untuk mengupload buffer dari memori langsung ke Cloudinary
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'sikap_app_archives', // Nama folder di Cloudinary
        resource_type: 'auto',        // Otomatis deteksi (image/pdf/raw)
        public_id: file.filename ? file.filename.split('.')[0] + '-' + Date.now() : undefined
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary Upload Error:', error)
          return reject(createError({ statusCode: 500, message: 'Gagal upload ke Cloudinary' }))
        }

        // Return format yang sesuai dengan skema database Archive
        resolve({
          filePath: result?.secure_url || '', // URL publik dari Cloudinary
          fileName: file.filename || 'file',
          fileType: result?.format || file.type || 'unknown',
          fileSize: result?.bytes || 0
        })
      }
    )

    // Tulis buffer file ke stream upload
    uploadStream.end(file.data)
  })
}

// Fungsi bantu untuk menghapus file dari Cloudinary saat data dihapus
export const deleteFileFromStorage = async (fileUrl: string) => {
  try {
    if (!fileUrl.includes('cloudinary')) return // Skip jika bukan file Cloudinary

    // Ekstrak public_id dari URL
    // Contoh URL: https://res.cloudinary.com/demo/image/upload/v12345/sikap_app_archives/namafile.jpg
    const splitUrl = fileUrl.split('/')
    const filenameWithExt = splitUrl[splitUrl.length - 1]
    const folderName = splitUrl[splitUrl.length - 2] // sikap_app_archives
    const publicId = `${folderName}/${filenameWithExt.split('.')[0]}`

    // Tentukan resource_type (image/video/raw)
    // Sederhananya kita coba destroy sebagai image dulu, jika PDF biasanya dianggap 'image' atau 'raw'
    // Untuk keakuratan penuh, idealnya simpan public_id di DB, tapi ini metode ekstraksi url:
    
    await cloudinary.uploader.destroy(publicId, { resource_type: 'image' })
    await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' }) // Coba raw juga (untuk PDF/Doc)
    
  } catch (error) {
    console.error('Gagal hapus file di Cloudinary:', error)
    // Jangan throw error agar proses hapus DB tetap jalan
  }
}
// server/api/archives/signature.get.ts
import { defineEventHandler, getCookie, createError } from 'h3'
// Import manual fungsi dari file utils agar tidak error merah
import { generateCloudinarySignature } from '../../utils/fileUpload'

export default defineEventHandler(async (event) => {
    // 1. Cek Login
    const userCookie = getCookie(event, 'user_data')
    if (!userCookie) throw createError({ statusCode: 401, message: 'Login diperlukan' })

    // 2. Buat signature
    // Folder harus sama persis dengan yang ada di frontend (handleUpload)
    const signatureData = generateCloudinarySignature({
        folder: 'sikap_app_archives'
    })

    return signatureData
})
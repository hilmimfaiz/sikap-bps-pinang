export const useSound = () => {
  const playNotificationSound = () => {
    // Pastikan kode hanya jalan di client-side (browser)
    if (import.meta.client) {
      try {
        const audio = new Audio('/notification.mp3') // Pastikan file ada di folder public
        audio.volume = 0.5 // Atur volume (0.0 sampai 1.0)
        
        // Browser modern memblokir autoplay jika user belum berinteraksi,
        // kita gunakan promise catch untuk menghindari error di console.
        audio.play().catch((err) => {
          console.warn('Gagal memutar suara notifikasi (user belum interaksi?):', err)
        })
      } catch (e) {
        console.error('Error audio:', e)
      }
    }
  }

  return {
    playNotificationSound
  }
}
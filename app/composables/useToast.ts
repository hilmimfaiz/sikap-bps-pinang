import { useToastStore } from '~/stores/toast'

export const useToast = () => {
  const store = useToastStore()
  // Panggil sound composable
  const { playNotificationSound } = useSound()

  return {
    success: (msg: string) => {
      playNotificationSound() // Bunyi saat sukses (misal: Profil Updated, Arsip Shared)
      store.add('success', msg)
    },
    error: (msg: string) => {
      // Opsional: Anda bisa membuat suara berbeda untuk error jika mau
      // playErrorSound() 
      store.add('error', msg)
    },
    warning: (msg: string) => {
      store.add('warning', msg)
    },
    info: (msg: string) => {
      playNotificationSound() // Bunyi saat info (misal: Notifikasi umum)
      store.add('info', msg)
    },
    remove: (id: string) => store.remove(id)
  }
}
export const useGlobalLoading = () => {
  const store = useLoadingStore()
  
  // Helper untuk delay
  const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

  const startLoading = (message?: string) => {
    store.start(message)
  }

  const stopLoading = async () => {
    await wait(1500) // Wajib tunggu 1.5 detik
    store.stop()
  }

  return {
    startLoading,
    stopLoading
  }
}
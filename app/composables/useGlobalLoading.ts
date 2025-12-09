export const useGlobalLoading = () => {
  const store = useLoadingStore()
  
  // Helper untuk delay
  const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

  const startLoading = (message?: string) => {
    store.start(message)
  }

  const stopLoading = async () => {
    await wait(200)
    store.stop()
  }

  return {
    startLoading,
    stopLoading
  }
}
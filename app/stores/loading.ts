import { defineStore } from 'pinia'

export const useLoadingStore = defineStore('loading', {
  state: () => ({
    isLoading: false,
    message: 'Memproses...'
  }),
  actions: {
    start(msg: string = 'Memproses data...') {
      this.message = msg
      this.isLoading = true
    },
    stop() {
      this.isLoading = false
    }
  }
})
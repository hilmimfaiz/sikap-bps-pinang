import { defineStore } from 'pinia'

export interface ToastItem {
  id: string
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
  duration: number
}

export const useToastStore = defineStore('toast', {
  state: () => ({
    items: [] as ToastItem[]
  }),
  actions: {
    add(type: ToastItem['type'], message: string, duration = 3000) {
      const id = Math.random().toString(36).substring(2, 9)
      const newItem = { id, message, type, duration }
      
      this.items.push(newItem)

      // Auto remove setelah durasi habis
      if (duration > 0) {
        setTimeout(() => {
          this.remove(id)
        }, duration)
      }
    },
    remove(id: string) {
      this.items = this.items.filter(item => item.id !== id)
    }
  }
})
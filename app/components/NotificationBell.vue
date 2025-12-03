<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const isOpen = ref(false)
const showDeleteMenu = ref(false) // State untuk menu dropdown kecil
const showDeleteConfirm = ref(false) // State untuk MODAL konfirmasi
const pendingDeleteRange = ref('') // Menyimpan range yang akan dihapus sementara

const notifications = ref<any[]>([])
const unreadCount = ref(0)
const dropdownRef = ref<HTMLElement | null>(null)
let pollingInterval: NodeJS.Timer | null = null

// Inisialisasi i18n
const { t, locale } = useI18n()

// Fetch Notifikasi
const fetchNotifications = async () => {
  try {
    const data: any = await $fetch('/api/notifications')
    if (data) {
      notifications.value = data.notifications
      unreadCount.value = data.unreadCount
    }
  } catch (e) {
    console.error('Gagal mengambil notifikasi', e)
  }
}

// Mark as Read
const markAsRead = async () => {
  if (unreadCount.value > 0) {
    try {
      await $fetch('/api/notifications/read', { method: 'PUT' })
      unreadCount.value = 0
      notifications.value.forEach(n => n.isRead = true)
    } catch (e) { console.error(e) }
  }
}

// --- LOGIKA HAPUS (Updated) ---

// 1. Trigger Modal (Pilih Range)
const deleteHistory = (range: string) => {
  pendingDeleteRange.value = range
  showDeleteMenu.value = false // Tutup menu dropdown kecil
  showDeleteConfirm.value = true // Buka modal konfirmasi besar
}

// 2. Eksekusi Hapus (Setelah Konfirmasi)
const confirmDelete = async () => {
  if (!pendingDeleteRange.value) return

  try {
    await $fetch('/api/notifications/delete', {
      method: 'DELETE',
      query: { range: pendingDeleteRange.value }
    })
    
    await fetchNotifications()
    showDeleteConfirm.value = false
  } catch (e) {
    alert(t('notifications.delete_error'))
    console.error(e)
  }
}

const toggleDropdown = () => {
  isOpen.value = !isOpen.value
  showDeleteMenu.value = false
  if (isOpen.value) {
    markAsRead()
  }
}

const closeDropdown = () => {
  isOpen.value = false
  showDeleteMenu.value = false
}

const handleClickOutside = (event: MouseEvent) => {
  // Tutup dropdown jika klik di luar, TAPI jangan tutup jika sedang klik di dalam modal konfirmasi
  const target = event.target as HTMLElement
  if (showDeleteConfirm.value) return 

  if (isOpen.value && dropdownRef.value && !dropdownRef.value.contains(target)) {
    closeDropdown()
  }
}

// Helper Waktu
const timeAgo = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  if (seconds < 60) return t('notifications.time_just_now')
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return t('notifications.time_minutes_ago', { min: minutes })
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return t('notifications.time_hours_ago', { hour: hours })
  
  return date.toLocaleDateString(locale.value)
}

onMounted(() => {
  fetchNotifications()
  pollingInterval = setInterval(fetchNotifications, 10000)
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  if (pollingInterval) clearInterval(pollingInterval)
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <div class="relative" ref="dropdownRef">
    
    <button 
      @click.stop="toggleDropdown"
      class="p-2 rounded-xl text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700/50 transition-all relative outline-none focus:outline-none active:scale-95"
    >
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
      </svg>
      <span 
        v-if="unreadCount > 0" 
        class="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-gray-800 animate-pulse"
      >
        {{ unreadCount > 9 ? '9+' : unreadCount }}
      </span>
    </button>

    <transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="transform opacity-0 scale-95 -translate-y-2"
      enter-to-class="transform opacity-100 scale-100 translate-y-0"
      leave-active-class="transition ease-in duration-75"
      leave-from-class="transform opacity-100 scale-100 translate-y-0"
      leave-to-class="transform opacity-0 scale-95 -translate-y-2"
    >
      <div 
        v-if="isOpen"
        class="
          bg-white dark:bg-gray-800 shadow-2xl rounded-2xl ring-1 ring-black/5 dark:ring-white/10 z-50 border border-gray-100 dark:border-gray-700
          fixed inset-x-4 top-[4.5rem] mt-2 origin-top
          sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-2 sm:w-80 sm:origin-top-right
        "
      >
        <div class="px-4 py-3 bg-gray-50/95 dark:bg-gray-700/95 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center backdrop-blur-sm relative z-20 rounded-t-2xl">
          <h3 class="text-sm font-bold text-gray-900 dark:text-gray-100">{{ $t('notifications.title') }}</h3>
          
          <div class="flex items-center gap-2">
            <button @click="markAsRead" class="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 hover:underline transition-colors" :title="$t('notifications.read_all')">
              {{ $t('notifications.read_all') }}
            </button>
            
            <button 
              @click.stop="showDeleteMenu = !showDeleteMenu"
              class="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors relative"
              :title="$t('notifications.delete_history')"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            </button>

            <transition
              enter-active-class="transition ease-out duration-100"
              enter-from-class="transform opacity-0 scale-95"
              enter-to-class="transform opacity-100 scale-100"
              leave-active-class="transition ease-in duration-75"
              leave-from-class="transform opacity-100 scale-100"
              leave-to-class="transform opacity-0 scale-95"
            >
              <div 
                v-if="showDeleteMenu"
                class="absolute right-0 top-9 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-xl ring-1 ring-black/5 border border-gray-100 dark:border-gray-600 z-[60] py-1"
              >
                <div class="px-3 py-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700 mb-1">
                  {{ $t('notifications.delete_history') }}
                </div>
                <button @click.stop="deleteHistory('1h')" class="w-full text-left px-4 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 transition-colors">
                  {{ $t('notifications.delete_1h') }}
                </button>
                <button @click.stop="deleteHistory('24h')" class="w-full text-left px-4 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 transition-colors">
                  {{ $t('notifications.delete_24h') }}
                </button>
                <button @click.stop="deleteHistory('7d')" class="w-full text-left px-4 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 transition-colors">
                  {{ $t('notifications.delete_7d') }}
                </button>
                <button @click.stop="deleteHistory('30d')" class="w-full text-left px-4 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 transition-colors">
                  {{ $t('notifications.delete_30d') }}
                </button>
                <div class="border-t border-gray-100 dark:border-gray-700 my-1"></div>
                <button @click.stop="deleteHistory('old')" class="w-full text-left px-4 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 transition-colors">
                  {{ $t('notifications.delete_old') }}
                </button>
              </div>
            </transition>
          </div>
        </div>

        <div class="max-h-[60vh] sm:max-h-96 overflow-y-auto custom-scrollbar bg-gray-50/30 dark:bg-black/20 rounded-b-2xl relative z-10">
          <div v-if="notifications.length === 0" class="px-4 py-12 text-center flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
            <div class="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-3">
               <svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
            </div>
            <span class="text-sm font-medium">{{ $t('notifications.empty_title') }}</span>
            <span class="text-xs mt-1 opacity-70">{{ $t('notifications.empty_desc') }}</span>
          </div>
          
          <ul v-else class="divide-y divide-gray-100 dark:divide-gray-700">
            <li v-for="notif in notifications" :key="notif.id">
              <NuxtLink 
                :to="notif.link || '#'" 
                @click="isOpen = false"
                class="block px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group relative bg-white dark:bg-gray-800"
                :class="{'bg-blue-50/60 dark:bg-blue-900/20': !notif.isRead}"
              >
                <div v-if="!notif.isRead" class="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"></div>

                <div class="flex items-start gap-3.5">
                  <div class="flex-shrink-0 mt-0.5 p-2 bg-blue-100/50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
                     <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  </div>
                  
                  <div class="flex-1 min-w-0">
                    <p class="text-[13px] font-semibold text-gray-900 dark:text-gray-100 leading-tight mb-1 group-hover:text-blue-600 transition-colors">
                      {{ notif.title }}
                    </p>
                    <p class="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed mb-1.5">
                      {{ notif.message }}
                    </p>
                    <p class="text-[10px] font-medium text-gray-400 flex items-center gap-1">
                      {{ timeAgo(notif.createdAt) }}
                    </p>
                  </div>
                </div>
              </NuxtLink>
            </li>
          </ul>
        </div>
      </div>
    </transition>

    <transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div v-if="showDeleteConfirm" class="fixed inset-0 z-[100] flex items-center justify-center p-4 pointer-events-auto">
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="showDeleteConfirm = false"></div>
        
        <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm p-6 relative z-10 text-center border border-gray-100 dark:border-gray-800 transform transition-all overflow-hidden">
          <div class="absolute top-0 left-0 w-full h-1.5 bg-red-600"></div>
          
          <div class="w-14 h-14 mx-auto mb-4 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center text-red-600 dark:text-red-400 text-2xl">
            🗑️
          </div>
          <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-2">
            {{ $t('notifications.delete_history') }}
          </h3>
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">
            {{ $t('notifications.confirm_delete') }}
          </p>
          
          <div class="flex gap-3">
             <button 
               @click="showDeleteConfirm = false" 
               class="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition text-sm font-medium"
             >
               {{ $t('common.cancel') }}
             </button>
             <button 
               @click="confirmDelete" 
               class="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-md hover:shadow-lg transition text-sm font-medium transform hover:-translate-y-0.5"
             >
               {{ $t('common.yes_delete') }}
             </button>
          </div>
        </div>
      </div>
    </transition>

  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
.dark .custom-scrollbar::-webkit-scrollbar-thumb {
  background: #475569;
}
</style>
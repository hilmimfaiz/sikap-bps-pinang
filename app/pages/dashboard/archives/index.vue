<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'

definePageMeta({
  layout: 'dashboard',
  middleware: 'auth'
})

const { startLoading, stopLoading } = useGlobalLoading()
const toast = useToast()
const { t } = useI18n()

// State User
const user = useCookie<any>('user_data')

// State Pagination & Search
const search = ref('')
const page = ref(1)
const limit = ref(10)

// Fetch Data (Server-side Pagination)
// API ini sekarang hanya akan mengembalikan folder dengan parentId = null
const { data: response, pending, refresh, error } = await useFetch('/api/folders', {
  query: { search, page, limit },
  watch: [page, search]
})

// Computed Data Wrappers
const folders = computed(() => response.value?.data || [])
const meta = computed(() => response.value?.meta || { total: 0, page: 1, limit: 10, totalPages: 1 })

// Reset page saat search berubah
watch(search, () => {
  page.value = 1
  selectedFolderIds.value = []
})

// Reset selection saat pindah halaman
watch(page, () => {
  selectedFolderIds.value = []
})

// Fungsi Ganti Halaman
const changePage = (newPage: number) => {
  if (newPage >= 1 && newPage <= meta.value.totalPages) {
    page.value = newPage
  }
}

// Modal States
const showCreateModal = ref(false)
const showRenameModal = ref(false)
const showDeleteConfirm = ref(false)
const showBulkDeleteConfirm = ref(false)

// Data Holders
const selectedFolder = ref<any>(null)
const newFolderName = ref('')

// State Seleksi (Bulk Action)
const selectedFolderIds = ref<number[]>([])

// Animation Trigger
const isVisible = ref(false)
onMounted(() => {
  setTimeout(() => {
    isVisible.value = true
  }, 100)
})

// Computed: Hak Akses Admin
const isAdmin = computed(() => user.value?.role === 'admin')

// Helper: Cek apakah user boleh mengelola folder ini
const canManage = (folder: any) => {
  return isAdmin.value || folder.userId === user.value.id
}

// Computed: Pilih Semua Checkbox
const isAllSelected = computed({
  get: () => {
    if (!folders.value || folders.value.length === 0) return false
    const manageableFolders = folders.value.filter((f: any) => canManage(f))
    return manageableFolders.length > 0 && manageableFolders.every((f: any) => selectedFolderIds.value.includes(f.id))
  },
  set: (val) => {
    if (val) {
      const manageableFolders = folders.value.filter((f: any) => canManage(f))
      selectedFolderIds.value = manageableFolders.map((f: any) => f.id)
    } else {
      selectedFolderIds.value = []
    }
  }
})

const toggleSelection = (id: number) => {
  if (selectedFolderIds.value.includes(id)) {
    selectedFolderIds.value = selectedFolderIds.value.filter(i => i !== id)
  } else {
    selectedFolderIds.value.push(id)
  }
}

// Close all modals
const closeModals = () => {
  showCreateModal.value = false
  showRenameModal.value = false
  showDeleteConfirm.value = false
  showBulkDeleteConfirm.value = false
  newFolderName.value = ''
  selectedFolder.value = null
}

// --- ACTIONS ---

// Bulk Delete
const handleBulkDelete = async () => {
  if (selectedFolderIds.value.length === 0) return

  startLoading(t('archives.messages.bulk_delete_process', { count: selectedFolderIds.value.length }))
  try {
    await $fetch('/api/folders/bulk-delete', {
      method: 'POST',
      body: { ids: selectedFolderIds.value }
    })
    await refresh()
    selectedFolderIds.value = []
    closeModals()
    await stopLoading()
    toast.success(t('archives.messages.bulk_delete_success'))
  } catch (e: any) {
    await stopLoading()
    toast.error(e.data?.message || t('archives.messages.bulk_delete_error'))
  }
}

// Create Folder (Root Folder)
const handleCreate = async () => {
  if (!newFolderName.value.trim()) return toast.warning(t('archives.messages.name_required'))
  startLoading(t('archives.messages.create_process'))
  try {
    // Note: parentId tidak dikirim, artinya ini Folder Utama (Root)
    await $fetch('/api/folders/create', {
      method: 'POST',
      body: { name: newFolderName.value, userId: user.value?.id }
    })
    await refresh()
    closeModals()
    await stopLoading()
    toast.success(t('archives.messages.create_success'))
  } catch (e: any) {
    await stopLoading()
    toast.error(e.data?.message || t('archives.messages.create_error'))
  }
}

// Rename Folder
const openRename = (folder: any) => {
  selectedFolder.value = folder
  newFolderName.value = folder.name
  showRenameModal.value = true
}
const handleRename = async () => {
  if (!selectedFolder.value || !newFolderName.value.trim()) return
  startLoading(t('archives.messages.rename_process'))
  try {
    await $fetch(`/api/folders/${selectedFolder.value.id}`, {
      method: 'PUT',
      body: { name: newFolderName.value }
    })
    await refresh()
    closeModals()
    await stopLoading()
    toast.success(t('archives.messages.rename_success'))
  } catch (e: any) {
    await stopLoading()
    toast.error(e.data?.message || t('archives.messages.rename_error'))
  }
}

// Delete Single Folder
const openDelete = (folder: any) => {
  selectedFolder.value = folder
  showDeleteConfirm.value = true
}
const handleDelete = async () => {
  if (!selectedFolder.value) return
  startLoading(t('archives.messages.delete_process'))
  try {
    await $fetch(`/api/folders/${selectedFolder.value.id}`, { method: 'DELETE' })
    await refresh()
    closeModals()
    await stopLoading()
    toast.success(t('archives.messages.delete_success'))
  } catch (e: any) {
    await stopLoading()
    toast.error(e.data?.message || t('archives.messages.delete_error'))
  }
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:from-gray-950 dark:via-gray-900 dark:to-blue-950/20 py-6 px-4 sm:px-6 lg:px-8">
    
    <div 
      class="max-w-6xl mx-auto transition-all duration-700 ease-out"
      :class="isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'"
    >

      <div class="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4 animate-soft-slide-down" style="animation-delay: 100ms;">
        <div class="space-y-1">
          <h1 class="text-2xl sm:text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400">
            {{ $t('archives.title') }}
          </h1>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            {{ $t('archives.subtitle') }}
          </p>
        </div>

        <div class="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          
          <transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0 scale-90" enter-to-class="opacity-100 scale-100" leave-active-class="transition duration-150 ease-in" leave-from-class="opacity-100 scale-100" leave-to-class="opacity-0 scale-90">
            <button 
              v-if="selectedFolderIds.length > 0"
              @click="showBulkDeleteConfirm = true"
              class="bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all text-sm font-medium w-full sm:w-auto"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              {{ $t('common.delete') }} ({{ selectedFolderIds.length }})
            </button>
          </transition>

          <div class="relative group w-full sm:w-auto">
            <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              v-model="search"
              type="text"
              :placeholder="$t('archives.search_placeholder')"
              class="w-full sm:w-64 pl-10 pr-4 py-2.5 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-blue-100 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/40 shadow-md shadow-blue-500/5 dark:shadow-blue-900/10 transition-all duration-300 text-sm placeholder-gray-400"
            />
          </div>

          <button @click="showCreateModal = true"
            class="group relative overflow-hidden bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-medium px-5 py-2.5 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 text-sm w-full sm:w-auto">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            {{ $t('archives.add_folder') }}
            <div class="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"></div>
          </button>
        </div>
      </div>

      <div v-if="error" class="mb-6 p-4 bg-red-500/10 border border-red-500/30 backdrop-blur-md rounded-xl text-red-600 dark:text-red-400 text-center text-sm font-medium animate-pulse">
        {{ $t('archives.load_error') }}
      </div>

      <div class="bg-white/80 dark:bg-gray-900/80 backdrop-blur-2xl rounded-2xl shadow-xl border border-blue-100 dark:border-gray-800/50 overflow-hidden flex flex-col h-full animate-soft-slide-up" style="animation-delay: 200ms;">
        <div class="overflow-x-auto flex-1">
          <table class="w-full min-w-full text-left text-sm">
            <thead class="bg-gradient-to-r from-blue-600/5 to-cyan-500/5 dark:from-blue-500/10 dark:to-cyan-500/10 text-gray-600 dark:text-gray-300 uppercase text-xs font-bold">
              <tr>
                <th class="px-6 py-4 w-10 text-center">
                   <input type="checkbox" v-model="isAllSelected" class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600" />
                </th>
                <th class="px-6 py-4 text-left">{{ $t('archives.table.folder_name') }}</th>
                <th class="px-6 py-4 text-left">{{ $t('archives.table.creator') }}</th>
                <th class="px-6 py-4 text-left">{{ $t('archives.table.total_files') }}</th>
                <th class="px-6 py-4 text-center">{{ $t('archives.table.action') }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-blue-50 dark:divide-gray-800">

              <tr v-if="pending">
                <td colspan="5" class="px-6 py-16 text-center">
                  <div class="flex justify-center">
                    <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
                  </div>
                  <p class="mt-3 text-xs text-gray-500 dark:text-gray-400 font-medium">{{ $t('common.loading') }}...</p>
                </td>
              </tr>

              <tr v-else-if="folders.length === 0">
                <td colspan="5" class="px-6 py-16 text-center text-gray-400 dark:text-gray-500 text-sm">
                  <div class="w-16 h-16 mx-auto mb-3 bg-blue-50 dark:bg-gray-800 rounded-full flex items-center justify-center">
                    <svg class="w-8 h-8 text-blue-400 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 7h18M3 12h18M3 17h18"/>
                    </svg>
                  </div>
                  <p>{{ search ? $t('archives.messages.folder_not_found') : $t('archives.empty_title') }}</p>
                </td>
              </tr>

              <tr v-for="folder in folders" :key="folder.id"
                class="hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-all duration-300 group">
                
                <td class="px-6 py-4 text-center">
                   <input 
                     type="checkbox" 
                     :checked="selectedFolderIds.includes(folder.id)"
                     @change="toggleSelection(folder.id)"
                     :disabled="!canManage(folder)"
                     class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed" 
                   />
                </td>

                <td class="px-6 py-4">
                  <NuxtLink :to="`/dashboard/archives/${folder.id}`"
                    class="flex items-center gap-3 group-hover:translate-x-1 transition-transform duration-200">
                    <div class="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-md flex items-center justify-center">
                      <svg class="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19.5 21a3 3 0 0 0 3-3v-4.5a3 3 0 0 0-3-3h-15a3 3 0 0 0-3 3V18a3 3 0 0 0 3 3h15ZM1.5 10.146V6a3 3 0 0 1 3-3h5.379a2.25 2.25 0 0 1 1.59.659l2.122 2.121c.14.141.331.22.53.22H19.5a3 3 0 0 1 3 3v1.146A4.483 4.483 0 0 0 19.5 9h-15a4.483 4.483 0 0 0-3 1.146Z"/>
                      </svg>
                    </div>
                    <div>
                      <p class="font-semibold text-gray-900 dark:text-white text-sm group-hover:text-blue-600 transition-colors">{{ folder.name }}</p>
                      <p class="text-[10px] text-gray-500 dark:text-gray-400">{{ $t('archives.click_to_enter') }}</p>
                    </div>
                  </NuxtLink>
                </td>

                <td class="px-6 py-4">
                  <div class="flex items-center gap-2">
                    <div class="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 text-white text-[10px] font-bold flex items-center justify-center shadow-md ring-2 ring-white dark:ring-gray-800">
                      {{ folder.user?.name?.charAt(0).toUpperCase() || 'U' }}
                    </div>
                    <span class="text-xs font-medium text-gray-700 dark:text-gray-300">
                      {{ folder.user?.name || $t('common.unknown') }}
                    </span>
                  </div>
                </td>

                <td class="px-6 py-4">
                  <span class="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/30 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-800">
                    {{ folder._count?.archives || 0 }} {{ $t('archives.items') }}
                  </span>
                </td>

                <td class="px-6 py-4 text-center">
                  <div v-if="canManage(folder)" class="flex justify-center gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button @click.stop="openRename(folder)"
                      class="p-2 bg-amber-50 hover:bg-amber-100 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400 dark:hover:bg-amber-900/40 rounded-lg transition-all hover:scale-110 shadow-sm border border-amber-100 dark:border-amber-800"
                      :title="$t('common.edit')">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                      </svg>
                    </button>
                    <button @click.stop="openDelete(folder)"
                      class="p-2 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40 rounded-lg transition-all hover:scale-110 shadow-sm border border-red-100 dark:border-red-800"
                      :title="$t('common.delete')">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2.5 2.5 0 0116.138 21H7.862a2.5 2.5 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1H9a1 1 0 00-1 1v3M4 7h16"/>
                      </svg>
                    </button>
                  </div>
                  <span v-else class="text-[10px] text-gray-400 italic">{{ $t('common.read_only') }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="meta.totalPages > 1" class="px-6 py-4 border-t border-blue-100 dark:border-gray-700/50 flex flex-col sm:flex-row justify-between items-center gap-4 bg-blue-50/30 dark:bg-gray-800/30">
          <span class="text-xs text-gray-500 dark:text-gray-400 font-medium">
            {{ $t('archives.pagination.showing', { start: (meta.page - 1) * meta.limit + 1, end: Math.min(meta.page * meta.limit, meta.total), total: meta.total }) }}
          </span>

          <div class="flex items-center gap-2">
            <button 
              @click="changePage(meta.page - 1)" 
              :disabled="meta.page === 1"
              class="p-2 rounded-lg border border-blue-200 dark:border-gray-600 hover:bg-blue-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-600 dark:text-gray-300"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
            </button>

            <span class="text-xs font-semibold text-gray-700 dark:text-gray-300 mx-2">
              {{ $t('archives.pagination.page', { current: meta.page, total: meta.totalPages }) }}
            </span>

            <button 
              @click="changePage(meta.page + 1)" 
              :disabled="meta.page === meta.totalPages"
              class="p-2 rounded-lg border border-blue-200 dark:border-gray-600 hover:bg-blue-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-600 dark:text-gray-300"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
            </button>
          </div>
        </div>

      </div>
    </div>

    <Transition enter-active-class="transition duration-300 ease-out" enter-from-class="opacity-0" enter-to-class="opacity-100" leave-active-class="transition duration-200 ease-in" leave-from-class="opacity-100" leave-to-class="opacity-0">
      <div v-if="showCreateModal || showRenameModal || showDeleteConfirm || showBulkDeleteConfirm" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" @click="closeModals"></div>
    </Transition>

    <Transition enter-active-class="transition duration-400 cubic-bezier(0.16, 1, 0.3, 1)" enter-from-class="opacity-0 scale-95 translate-y-8" enter-to-class="opacity-100 scale-100 translate-y-0" leave-active-class="transition duration-300 ease-in" leave-from-class="opacity-100 scale-100 translate-y-0" leave-to-class="opacity-0 scale-95 translate-y-8">
      <div v-if="showCreateModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div class="bg-white dark:bg-gray-900 rounded-[1.5rem] shadow-2xl border border-gray-100 dark:border-gray-800 w-full max-w-md p-6 relative pointer-events-auto overflow-hidden">
          <div class="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 to-cyan-500"></div>
          <h3 class="text-lg font-bold mb-5 text-gray-900 dark:text-white">{{ $t('archives.modal.create_title') }}</h3>
          <input v-model="newFolderName" type="text" :placeholder="$t('archives.modal.folder_name_placeholder')" class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all text-sm placeholder-gray-400 text-gray-900 dark:text-white" autoFocus />
          <div class="flex gap-3 mt-6">
            <button @click="closeModals" class="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition text-sm font-medium text-gray-600 dark:text-gray-300">{{ $t('common.cancel') }}</button>
            <button @click="handleCreate" class="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-lg shadow-md hover:shadow-lg transition text-sm font-medium transform hover:-translate-y-0.5">{{ $t('archives.modal.create_btn') }}</button>
          </div>
        </div>
      </div>
    </Transition>

    <Transition enter-active-class="transition duration-400 cubic-bezier(0.16, 1, 0.3, 1)" enter-from-class="opacity-0 scale-95 translate-y-8" enter-to-class="opacity-100 scale-100 translate-y-0" leave-active-class="transition duration-300 ease-in" leave-from-class="opacity-100 scale-100 translate-y-0" leave-to-class="opacity-0 scale-95 translate-y-8">
      <div v-if="showRenameModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div class="bg-white dark:bg-gray-900 rounded-[1.5rem] shadow-2xl border border-gray-100 dark:border-gray-800 w-full max-w-sm sm:max-w-md p-6 relative pointer-events-auto overflow-hidden">
          <div class="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-amber-500 to-orange-500"></div>
          <h3 class="text-lg font-bold mb-5 text-gray-900 dark:text-white">{{ $t('archives.modal.rename_title') }}</h3>
          <input v-model="newFolderName" type="text" class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition-all text-sm placeholder-gray-400 text-gray-900 dark:text-white" autoFocus />
          <div class="flex gap-3 mt-6">
            <button @click="closeModals" class="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition text-sm font-medium text-gray-600 dark:text-gray-300">{{ $t('common.cancel') }}</button>
            <button @click="handleRename" class="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-lg shadow-md transition text-sm font-medium transform hover:-translate-y-0.5">{{ $t('common.save') }}</button>
          </div>
        </div>
      </div>
    </Transition>

    <Transition enter-active-class="transition duration-400 cubic-bezier(0.16, 1, 0.3, 1)" enter-from-class="opacity-0 scale-95 translate-y-8" enter-to-class="opacity-100 scale-100 translate-y-0" leave-active-class="transition duration-300 ease-in" leave-from-class="opacity-100 scale-100 translate-y-0" leave-to-class="opacity-0 scale-95 translate-y-8">
      <div v-if="showDeleteConfirm" class="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div class="bg-white dark:bg-gray-900 rounded-[1.5rem] shadow-2xl border border-gray-100 dark:border-gray-800 max-w-xs sm:max-w-sm w-full p-6 text-center relative pointer-events-auto overflow-hidden">
          <div class="absolute top-0 left-0 w-full h-1.5 bg-red-500"></div>
          <div class="w-14 h-14 mx-auto mb-4 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center text-2xl text-red-600">🗑️</div>
          <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-2">{{ $t('archives.modal.delete_title') }}</h3>
          <p class="text-xs text-gray-500 mb-6">{{ $t('archives.modal.delete_desc') }} <strong class="text-red-600">{{ selectedFolder?.name }}</strong></p>
          <div class="flex gap-3">
            <button @click="closeModals" class="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition text-sm font-medium text-gray-600 dark:text-gray-300">{{ $t('common.cancel') }}</button>
            <button @click="handleDelete" class="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-md transition text-sm font-medium transform hover:-translate-y-0.5">{{ $t('common.delete') }}</button>
          </div>
        </div>
      </div>
    </Transition>

    <Transition enter-active-class="transition duration-400 cubic-bezier(0.16, 1, 0.3, 1)" enter-from-class="opacity-0 scale-95 translate-y-8" enter-to-class="opacity-100 scale-100 translate-y-0" leave-active-class="transition duration-300 ease-in" leave-from-class="opacity-100 scale-100 translate-y-0" leave-to-class="opacity-0 scale-95 translate-y-8">
      <div v-if="showBulkDeleteConfirm" class="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div class="bg-white dark:bg-gray-900 rounded-[1.5rem] shadow-2xl border border-gray-100 dark:border-gray-800 max-w-xs sm:max-w-sm w-full p-6 text-center relative pointer-events-auto overflow-hidden">
          <div class="absolute top-0 left-0 w-full h-1.5 bg-red-600"></div>
          <div class="w-14 h-14 mx-auto mb-4 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center text-2xl text-red-600">🗑️</div>
          <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-2">{{ $t('archives.modal.bulk_delete_title', { n: selectedFolderIds.length }) }}</h3>
          <p class="text-xs text-gray-500 dark:text-gray-400 mb-6">{{ $t('archives.modal.bulk_delete_desc') }}</p>
          <div class="flex gap-3">
            <button @click="closeModals" class="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800 transition text-xs font-medium">{{ $t('common.cancel') }}</button>
            <button @click="handleBulkDelete" class="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-md transition text-xs font-medium transform hover:-translate-y-0.5">{{ $t('common.delete_all') }}</button>
          </div>
        </div>
      </div>
    </Transition>

  </div>
</template>

<style scoped>
.animate-soft-slide-down { animation: softSlideDown 0.8s cubic-bezier(0.16, 1, 0.3, 1) backwards; }
.animate-soft-slide-up { animation: softSlideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) backwards; }
@keyframes softSlideDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
@keyframes softSlideUp { from { opacity: 0; transform: translateY(30px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
</style>
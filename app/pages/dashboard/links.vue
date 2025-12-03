<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'

definePageMeta({
  layout: 'dashboard',
  middleware: 'auth'
})

// Inisialisasi
const { startLoading, stopLoading } = useGlobalLoading()
const toast = useToast()
const { t } = useI18n()
const userCookie = useCookie<any>('user_data')

// Hak Akses
const canManage = computed(() => {
  const role = userCookie.value?.role
  return role === 'admin' || role === 'editor'
})

// State Pagination & Search
const search = ref('')
const page = ref(1)
const limit = ref(10)

// State Seleksi
const selectedLinkIds = ref<number[]>([])

// Fetch Data (Server-side)
const { data: response, pending, refresh, error } = await useFetch('/api/links', {
  query: { search, page, limit },
  watch: [page, search]
})

// Fetch Categories untuk dropdown
const { data: categoriesResponse } = await useFetch('/api/categories', {
  query: { limit: 1000 }
})
const categories = computed(() => categoriesResponse.value?.data || [])

// Computed Data Wrappers
const links = computed(() => response.value?.data || [])
const meta = computed(() => response.value?.meta || { total: 0, page: 1, limit: 10, totalPages: 1 })

// Reset page & selection saat search berubah
watch(search, () => {
  page.value = 1
  selectedLinkIds.value = []
})

// Reset selection saat pindah halaman
watch(page, () => {
  selectedLinkIds.value = []
})

// Modal States
const showCreateModal = ref(false)
const showImportModal = ref(false)
const showEditModal = ref(false)
const showDeleteConfirm = ref(false)
const showBulkDeleteConfirm = ref(false)
const showDropdown = ref(false)

// Data Holders
const selectedLink = ref<any>(null)
const importFile = ref<File | null>(null)

const form = ref({
  title: '',
  url: '',
  categoryId: '' as string | number,
  isActive: true
})

// Animation Trigger
const isVisible = ref(false)
onMounted(() => {
  setTimeout(() => {
    isVisible.value = true
  }, 100)
})

// --- LOGIKA SELEKSI (SAFE) ---
const isAllSelected = computed({
  get: () => {
    if (!links.value || links.value.length === 0) return false
    
    const manageableLinks = links.value.filter(() => canManage.value)
    return manageableLinks.length > 0 && manageableLinks.every((l: any) => selectedLinkIds.value.includes(l.id))
  },
  set: (val) => {
    if (val && canManage.value && links.value) {
      selectedLinkIds.value = links.value.map((l: any) => l.id)
    } else {
      selectedLinkIds.value = []
    }
  }
})

const toggleSelection = (id: number) => {
  if (selectedLinkIds.value.includes(id)) {
    selectedLinkIds.value = selectedLinkIds.value.filter(i => i !== id)
  } else {
    selectedLinkIds.value.push(id)
  }
}

// Computed Filtered (SAFE)
const filteredLinks = computed(() => {
  if (!links.value) return []
  const q = search.value.toLowerCase()
  return links.value.filter((link: any) =>
    (link.title && link.title.toLowerCase().includes(q)) ||
    (link.category?.name && link.category.name.toLowerCase().includes(q))
  )
})

// Pagination Change
const changePage = (newPage: number) => {
  if (newPage >= 1 && newPage <= meta.value.totalPages) {
    page.value = newPage
  }
}

// Actions
const closeModals = () => {
  showCreateModal.value = false
  showImportModal.value = false
  showEditModal.value = false
  showDeleteConfirm.value = false
  showBulkDeleteConfirm.value = false
  showDropdown.value = false
  form.value = { title: '', url: '', categoryId: '', isActive: true }
  selectedLink.value = null
  importFile.value = null
}

const toggleDropdown = () => {
  showDropdown.value = !showDropdown.value
}

// TOGGLE STATUS
const toggleStatus = async (link: any) => {
  if (!canManage.value) return

  const targetLink = response.value?.data?.find((l: any) => l.id === link.id)
  if (!targetLink) return

  const oldStatus = targetLink.isActive
  const newStatus = !oldStatus

  // Optimistic Update
  targetLink.isActive = newStatus

  try {
    await $fetch(`/api/links/${link.id}`, {
      method: 'PUT',
      body: { isActive: newStatus }
    })
    await refresh()
    toast.success(newStatus ? t('links.messages.status_active', { title: link.title }) : t('links.messages.status_inactive', { title: link.title }))
  } catch (e: any) {
    targetLink.isActive = oldStatus
    await refresh()
    toast.error(t('links.messages.status_error'))
  }
}

// Create Manual
const handleCreate = async () => {
  if (!canManage.value) return
  if (!form.value.title || !form.value.url || !form.value.categoryId) {
    return toast.warning(t('links.messages.validation_error'))
  }
  startLoading(t('links.messages.create_process'))
  try {
    await $fetch('/api/links/create', { method: 'POST', body: form.value })
    await refresh()
    closeModals()
    await stopLoading()
    toast.success(t('links.messages.create_success'))
  } catch (e: any) {
    await stopLoading()
    toast.error(e.data?.message || t('links.messages.create_error'))
  }
}

// Import CSV
const onFileChange = (e: any) => {
  const file = e.target.files[0]
  if (file && (file.type === 'text/csv' || file.type === "application/vnd.ms-excel" || file.name.toLowerCase().endsWith('.csv'))) {
    importFile.value = file
  } else {
    toast.warning(t('users.messages.file_format'))
    e.target.value = null
  }
}

const downloadTemplate = () => {
  const csvContent = "Title,Url,Category\nContoh Google,https://google.com,Umum\nSistem Akademik,https://siakad.kampus.ac.id,Akademik"
  const blob = new Blob([csvContent], { type: 'text/csv' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'template_links.csv'
  a.click()
  window.URL.revokeObjectURL(url)
  toast.info(t('links.messages.template_downloaded'))
}

const downloadMasterCategory = () => {
  window.open('/api/categories/export', '_blank')
  toast.info(t('links.messages.category_downloaded'))
}

const handleImport = async () => {
  if (!canManage.value || !importFile.value) return
  startLoading(t('links.messages.import_process'))
  const formData = new FormData()
  formData.append('file', importFile.value)
  try {
    const res: any = await $fetch('/api/links/import', { method: 'POST', body: formData })
    await refresh()
    closeModals()
    await stopLoading()
    toast.success(res.message || t('links.messages.import_success'))
  } catch (e: any) {
    await stopLoading()
    toast.error(e.data?.message || t('links.messages.import_error'))
  }
}

// Edit
const openEdit = (link: any) => {
  if (!canManage.value) return
  selectedLink.value = link
  form.value = {
    title: link.title,
    url: link.url,
    categoryId: link.categoryId,
    isActive: link.isActive
  }
  showEditModal.value = true
}

const handleUpdate = async () => {
  if (!selectedLink.value || !canManage.value) return
  startLoading(t('links.messages.update_process'))
  try {
    await $fetch(`/api/links/${selectedLink.value.id}`, {
      method: 'PUT',
      body: form.value
    })
    await refresh()
    closeModals()
    await stopLoading()
    toast.success(t('links.messages.update_success'))
  } catch (e: any) {
    await stopLoading()
    toast.error(e.data?.message || t('links.messages.update_error'))
  }
}

// Delete
const openDelete = (link: any) => {
  if (!canManage.value) return
  selectedLink.value = link
  showDeleteConfirm.value = true
}

const handleDelete = async () => {
  if (!selectedLink.value || !canManage.value) return
  startLoading(t('links.messages.delete_process'))
  try {
    await $fetch(`/api/links/${selectedLink.value.id}`, { method: 'DELETE' })
    await refresh()
    closeModals()
    await stopLoading()
    toast.success(t('links.messages.delete_success'))
  } catch (e: any) {
    await stopLoading()
    toast.error(e.data?.message || t('links.messages.delete_error'))
  }
}

// Bulk Delete
const handleBulkDelete = async () => {
  if (selectedLinkIds.value.length === 0) return
  startLoading(t('links.messages.bulk_delete_process', { count: selectedLinkIds.value.length }))
  try {
    await $fetch('/api/links/bulk-delete', {
      method: 'POST',
      body: { ids: selectedLinkIds.value }
    })
    await refresh()
    selectedLinkIds.value = []
    closeModals()
    await stopLoading()
    toast.success(t('links.messages.bulk_delete_success'))
  } catch (e: any) {
    await stopLoading()
    toast.error(e.data?.message || t('links.messages.bulk_delete_error'))
  }
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:from-gray-950 dark:via-gray-900 dark:to-blue-950/20 py-6 px-4 sm:px-6 lg:px-8" @click="showDropdown = false">
    
    <div 
      class="max-w-6xl mx-auto transition-all duration-700 ease-out"
      :class="isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'"
    >
      <div class="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4 animate-soft-slide-down" style="animation-delay: 100ms;">
        <div class="space-y-1">
          <h1 class="text-2xl sm:text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400">
           {{ $t('links.title') }}
          </h1>
          <p class="text-sm text-gray-600 dark:text-gray-400">{{ $t('links.subtitle') }}</p>
        </div>

        <div class="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          
          <transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0 scale-90" enter-to-class="opacity-100 scale-100" leave-active-class="transition duration-150 ease-in" leave-from-class="opacity-100 scale-100" leave-to-class="opacity-0 scale-90">
            <button 
              v-if="canManage && selectedLinkIds.length > 0"
              @click="showBulkDeleteConfirm = true"
              class="bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all text-sm font-medium w-full sm:w-auto"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              {{ $t('common.delete') }} ({{ selectedLinkIds.length }})
            </button>
          </transition>

          <div class="relative group w-full sm:w-auto">
            <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              v-model="search"
              type="text"
              :placeholder="$t('links.search_placeholder')"
              class="w-full sm:w-64 pl-10 pr-4 py-2.5 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-blue-100 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/40 shadow-md shadow-blue-500/5 dark:shadow-blue-900/10 transition-all duration-300 placeholder-gray-400 text-sm"
            />
          </div>

          <div v-if="canManage" class="relative w-full sm:w-auto">
            <button
              @click.stop="toggleDropdown()"
              class="group relative overflow-hidden bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-medium px-5 py-2.5 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 w-full sm:w-auto text-sm"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              {{ $t('links.add_btn') }}
              <svg class="w-3.5 h-3.5 transition-transform duration-200" :class="{ 'rotate-180': showDropdown }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
              <div class="absolute inset-0 bg-white/20 translate-x-[-110%] group-hover:translate-x-[110%] transition-transform duration-700 ease-in-out"></div>
            </button>

            <Transition
              enter-active-class="transition ease-out duration-200"
              enter-from-class="opacity-0 -translate-y-2"
              enter-to-class="opacity-100 translate-y-0"
              leave-active-class="transition ease-in duration-150"
              leave-from-class="opacity-100 translate-y-0"
              leave-to-class="opacity-0 -translate-y-2"
            >
              <div v-if="showDropdown" class="absolute right-0 mt-2 w-56 bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl rounded-xl shadow-2xl border border-blue-100 dark:border-gray-700/50 overflow-hidden z-50">
                <button @click="showCreateModal = true; showDropdown = false" class="w-full text-left px-5 py-3 hover:bg-blue-50 dark:hover:bg-blue-900/40 flex items-center gap-3 transition">
                  <div class="w-8 h-8 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400 text-lg">✏️</div>
                  <div>
                    <p class="font-medium text-sm text-gray-900 dark:text-white">{{ $t('links.add_manual') }}</p>
                    <p class="text-[10px] text-gray-500 dark:text-gray-400">{{ $t('links.add_manual_desc') }}</p>
                  </div>
                </button>
                <button @click="showImportModal = true; showDropdown = false" class="w-full text-left px-5 py-3 hover:bg-green-50 dark:hover:bg-green-900/40 flex items-center gap-3 border-t border-gray-100 dark:border-gray-800 transition">
                  <div class="w-8 h-8 bg-green-100 dark:bg-green-900/50 rounded-lg flex items-center justify-center text-green-600 dark:text-green-400 text-lg">📊</div>
                  <div>
                    <p class="font-medium text-sm text-gray-900 dark:text-white">{{ $t('links.import_csv') }}</p>
                    <p class="text-[10px] text-gray-500 dark:text-gray-400">{{ $t('links.import_csv_desc') }}</p>
                  </div>
                </button>
              </div>
            </Transition>
          </div>
        </div>
      </div>

      <div v-if="error" class="mb-6 p-4 bg-red-500/10 border border-red-500/30 backdrop-blur-md rounded-xl text-red-600 dark:text-red-400 text-center font-medium text-sm animate-pulse">
        {{ $t('links.load_error') }}
      </div>

      <div class="bg-white/80 dark:bg-gray-900/80 backdrop-blur-2xl rounded-2xl shadow-xl border border-blue-100 dark:border-gray-800/50 overflow-hidden flex flex-col h-full animate-soft-slide-up" style="animation-delay: 200ms;">
        <div class="overflow-x-auto flex-1">
          <table class="w-full min-w-full text-left text-sm">
            <thead class="bg-gradient-to-r from-blue-600/5 to-cyan-500/5 dark:from-blue-500/10 dark:to-cyan-500/10 text-gray-600 dark:text-gray-300 uppercase text-xs font-bold">
              <tr>
                <th v-if="canManage" class="px-6 py-4 w-10 text-center">
                   <input type="checkbox" v-model="isAllSelected" class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600" />
                </th>
                <th class="px-6 py-4 text-left">{{ $t('links.table.status') }}</th>
                <th class="px-6 py-4 text-left">{{ $t('links.table.title_url') }}</th>
                <th class="px-6 py-4 text-left">{{ $t('links.table.category') }}</th>
                <th class="px-6 py-4 text-center">{{ $t('links.table.action') }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-blue-50 dark:divide-gray-800">
              <tr v-if="pending">
                <td :colspan="canManage ? 5 : 4" class="px-6 py-16 text-center text-gray-400 dark:text-gray-500">
                  <div class="flex justify-center items-center gap-2">
                    <div class="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                    <span class="text-sm font-medium">{{ $t('common.loading') }}</span>
                  </div>
                </td>
              </tr>

              <tr v-else-if="links.length === 0">
                <td :colspan="canManage ? 5 : 4" class="px-6 py-16 text-center text-gray-400 dark:text-gray-500 text-sm">
                  <div class="w-16 h-16 mx-auto mb-3 bg-blue-50 dark:bg-gray-800 rounded-full flex items-center justify-center">
                    <svg class="w-8 h-8 text-blue-400 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13.5 3h-3m3 18h-3m9-9v-3m-18 3v-3m15 6h3m-18 0h3m12-12l3-3m-15 3l-3-3" />
                    </svg>
                  </div>
                  {{ $t('links.table.empty') }}
                </td>
              </tr>

              <tr v-for="link in filteredLinks" :key="link.id" class="hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-all duration-300 group">
                <td v-if="canManage" class="px-6 py-4 text-center">
                   <input type="checkbox" :checked="selectedLinkIds.includes(link.id)" @change="toggleSelection(link.id)" class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600" />
                </td>

                <td class="px-6 py-4">
                  <button
                    @click.stop="toggleStatus(link)"
                    :disabled="!canManage"
                    class="group/toggle relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-blue-500/30"
                    :class="link.isActive 
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 shadow-md shadow-emerald-500/30' 
                      : 'bg-gray-300 dark:bg-gray-700'"
                  >
                    <span
                      class="inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-all duration-300 ease-out flex items-center justify-center"
                      :class="link.isActive ? 'translate-x-6' : 'translate-x-1'"
                    >
                      <svg v-if="link.isActive" class="w-3 h-3 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                      </svg>
                    </span>
                  </button>
                  <p class="mt-2 text-[10px] font-semibold uppercase tracking-wider" :class="link.isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400 dark:text-gray-500'">
                    {{ link.isActive ? $t('links.table.active') : $t('links.table.inactive') }}
                  </p>
                </td>

                <td class="px-6 py-4">
                  <p class="font-bold text-gray-900 dark:text-white mb-0.5 text-sm group-hover:text-blue-600 transition-colors">{{ link.title }}</p>
                  <a :href="link.url" target="_blank" class="text-blue-600 dark:text-blue-400 hover:underline text-xs flex items-center gap-1 truncate max-w-xs">
                    {{ link.url }}
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </td>

                <td class="px-6 py-4">
                  <span class="inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/30 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-800">
                    {{ link.category?.name || 'Umum' }}
                  </span>
                </td>

                <td class="px-6 py-4 text-center">
                  <div class="flex justify-center gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                    <a :href="link.url" target="_blank" class="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/40 rounded-lg transition-all hover:scale-110 shadow-sm border border-blue-100 dark:border-blue-800">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </a>
                    <button v-if="canManage" @click="openEdit(link)" class="p-2 bg-amber-50 hover:bg-amber-100 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400 dark:hover:bg-amber-900/40 rounded-lg transition-all hover:scale-110 shadow-sm border border-amber-100 dark:border-amber-800">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button v-if="canManage" @click="openDelete(link)" class="p-2 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40 rounded-lg transition-all hover:scale-110 shadow-sm border border-red-100 dark:border-red-800">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1H9a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="meta.totalPages > 1" class="px-6 py-4 border-t border-blue-100 dark:border-gray-700/50 flex flex-col sm:flex-row justify-between items-center gap-4 bg-blue-50/30 dark:bg-gray-800/30">
          <span class="text-xs text-gray-500 dark:text-gray-400 font-medium">
             {{ $t('links.pagination.showing', { start: (meta.page - 1) * meta.limit + 1, end: Math.min(meta.page * meta.limit, meta.total), total: meta.total }) }}
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
               {{ $t('links.pagination.page', { current: meta.page, total: meta.totalPages }) }}
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
      <div v-if="showCreateModal || showImportModal || showEditModal || showDeleteConfirm || showBulkDeleteConfirm" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" @click="closeModals"></div>
    </Transition>

    <Transition
      enter-active-class="transition duration-500 cubic-bezier(0.16, 1, 0.3, 1)"
      enter-from-class="opacity-0 scale-90 translate-y-8"
      enter-to-class="opacity-100 scale-100 translate-y-0"
      leave-active-class="transition duration-300 ease-in"
      leave-from-class="opacity-100 scale-100 translate-y-0"
      leave-to-class="opacity-0 scale-90 translate-y-8"
    >
      <div v-if="showCreateModal || showEditModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div class="bg-white dark:bg-gray-900 rounded-[1.5rem] shadow-2xl border border-gray-100 dark:border-gray-800 w-full max-w-md overflow-hidden relative pointer-events-auto">
          <div class="absolute top-0 left-0 w-full h-24 bg-gradient-to-br from-blue-500 to-cyan-500 opacity-10"></div>
          
          <div class="p-6 relative">
            <div class="flex justify-between items-center mb-6">
              <h3 class="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-cyan-600">
                {{ showCreateModal ? $t('links.modal.create_title') : $t('links.modal.edit_title') }}
              </h3>
              <button @click="closeModals" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition bg-gray-50 dark:bg-gray-800 p-1.5 rounded-full">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form @submit.prevent="showCreateModal ? handleCreate() : handleUpdate()" class="space-y-5">
              <div>
                <label class="block text-xs font-semibold mb-1.5 text-gray-700 dark:text-gray-200 uppercase tracking-wide">{{ $t('links.modal.title_label') }}</label>
                <input v-model="form.title" type="text" required class="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-blue-100 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all placeholder-gray-400 text-gray-900 dark:text-white text-sm" />
              </div>
              <div>
                <label class="block text-xs font-semibold mb-1.5 text-gray-700 dark:text-gray-200 uppercase tracking-wide">{{ $t('links.modal.url_label') }}</label>
                <input v-model="form.url" type="url" required class="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-blue-100 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all placeholder-gray-400 text-gray-900 dark:text-white text-sm" />
              </div>
              <div>
                <label class="block text-xs font-semibold mb-1.5 text-gray-700 dark:text-gray-200 uppercase tracking-wide">{{ $t('links.modal.category_label') }}</label>
                <div class="relative">
                  <select v-model="form.categoryId" required class="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-blue-100 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all appearance-none text-gray-900 dark:text-white text-sm">
                    <option value="" disabled>{{ $t('links.modal.category_select') }}</option>
                    <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
                  </select>
                  <div class="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-500">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>
              </div>
              <div class="flex items-center gap-3 bg-blue-50 dark:bg-blue-900/10 p-3 rounded-lg border border-blue-100 dark:border-blue-800/30">
                <input type="checkbox" id="active" v-model="form.isActive" class="w-4 h-4 text-blue-600 rounded focus:ring-blue-500/50 border-gray-300" />
                <label for="active" class="text-xs font-medium text-gray-700 dark:text-gray-200 cursor-pointer select-none">{{ $t('links.modal.active_label') }}</label>
              </div>
              <div class="flex gap-3 pt-3">
                <button type="button" @click="closeModals" class="flex-1 py-2.5 border border-blue-200 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition font-medium text-sm text-gray-600 dark:text-gray-300">{{ $t('common.cancel') }}</button>
                <button type="submit" class="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold rounded-lg shadow-md shadow-blue-500/30 hover:shadow-xl transition-all transform hover:-translate-y-0.5 text-sm">
                  {{ showCreateModal ? $t('common.save') : $t('common.update') }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Transition>

    <Transition
      enter-active-class="transition duration-500 ease-out"
      enter-from-class="opacity-0 scale-90 translate-y-8"
      enter-to-class="opacity-100 scale-100 translate-y-0"
      leave-active-class="transition duration-300 ease-in"
      leave-from-class="opacity-100 scale-100 translate-y-0"
      leave-to-class="opacity-0 scale-90 translate-y-8"
    >
      <div v-if="showImportModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div class="bg-white dark:bg-gray-900 rounded-[1.5rem] shadow-2xl border border-gray-100 dark:border-gray-800 w-full max-w-lg p-6 relative pointer-events-auto overflow-hidden">
           <div class="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-green-500 to-emerald-500"></div>
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-bold text-gray-900 dark:text-white">{{ $t('links.modal.import_title') }}</h3>
            <button @click="closeModals" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
          </div>
          <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-700 rounded-xl p-4 mb-4 text-xs text-blue-800 dark:text-blue-300"><p class="font-semibold mb-1">{{ $t('links.modal.import_guide') }}</p><ul class="list-disc pl-4 space-y-0.5"><li>{{ $t('links.modal.import_guide_1') }}</li><li>{{ $t('links.modal.import_guide_2') }}</li></ul></div>
          <div class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center hover:bg-blue-50/50 dark:hover:bg-gray-800/50 transition relative cursor-pointer group"><input type="file" accept=".csv" @change="onFileChange" class="absolute inset-0 opacity-0 cursor-pointer z-10" /><div v-if="!importFile" class="group-hover:scale-105 transition-transform duration-300"><div class="text-4xl mb-2 opacity-60">📄</div><p class="font-medium text-sm text-gray-700 dark:text-gray-300">{{ $t('links.modal.file_label') }}</p><p class="text-xs text-gray-500 dark:text-gray-400 mt-1">{{ $t('links.modal.file_placeholder') }}</p></div><div v-else class="text-green-600 dark:text-green-400"><div class="text-4xl mb-2">✅</div><p class="font-medium text-sm">{{ importFile.name }}</p><p class="text-xs text-gray-500 mt-1">{{ (importFile.size / 1024).toFixed(2) }} KB</p><button @click.stop="importFile = null" class="text-xs text-red-500 hover:underline mt-2 relative z-20">Hapus</button></div></div>
          <div class="mt-6 flex flex-col sm:flex-row justify-between gap-3 items-center"><div class="space-y-1 text-left w-full sm:w-auto"><button @click="downloadTemplate" class="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">{{ $t('links.modal.download_template') }}</button><button @click="downloadMasterCategory" class="text-xs text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1">{{ $t('links.modal.download_categories') }}</button></div><button @click="handleImport" :disabled="!importFile" class="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm">{{ $t('links.modal.start_import') }}</button></div>
        </div>
      </div>
    </Transition>

    <Transition
      enter-active-class="transition duration-400 ease-out"
      enter-from-class="opacity-0 scale-90"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition duration-300 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-90"
    >
      <div v-if="showDeleteConfirm" class="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div class="bg-white dark:bg-gray-900 rounded-[1.5rem] shadow-2xl border border-gray-100 dark:border-gray-800 max-w-sm w-full p-6 text-center relative overflow-hidden pointer-events-auto">
          <div class="absolute top-0 left-0 w-full h-1.5 bg-red-500"></div>
          <div class="w-16 h-16 mx-auto mb-4 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center text-3xl">
            🗑️
          </div>
          <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">{{ $t('links.modal.delete_title') }}</h3>
          <p class="text-gray-600 dark:text-gray-300 mb-6 text-sm">
            Link <strong class="text-red-600 dark:text-red-400">{{ selectedLink?.title }}</strong> akan dihapus permanen.
          </p>
          <div class="flex gap-3">
            <button @click="closeModals" class="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg font-medium text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800 transition text-sm">
              {{ $t('common.cancel') }}
            </button>
            <button @click="handleDelete" class="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow-md shadow-red-500/30 hover:shadow-xl transition-all transform hover:-translate-y-0.5 text-sm">
              {{ $t('common.delete') }}
            </button>
          </div>
        </div>
      </div>
    </Transition>

     <Transition enter-active-class="transition duration-400 cubic-bezier(0.16, 1, 0.3, 1)" enter-from-class="opacity-0 scale-95 translate-y-8" enter-to-class="opacity-100 scale-100 translate-y-0" leave-active-class="transition duration-300 ease-in" leave-from-class="opacity-100 scale-100 translate-y-0" leave-to-class="opacity-0 scale-95 translate-y-8">
      <div v-if="showBulkDeleteConfirm" class="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div class="bg-white dark:bg-gray-900 rounded-[1.5rem] shadow-2xl border border-gray-100 dark:border-gray-800 max-w-xs sm:max-w-sm w-full p-6 text-center relative pointer-events-auto overflow-hidden">
          <div class="absolute top-0 left-0 w-full h-1.5 bg-red-600"></div>
          <div class="w-14 h-14 mx-auto mb-4 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center text-2xl text-red-600">🗑️</div>
          <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-2">{{ $t('links.modal.bulk_delete_title', { count: selectedLinkIds.length }) }}</h3>
          <p class="text-xs text-gray-500 dark:text-gray-400 mb-6">{{ $t('links.modal.bulk_delete_desc') }}</p>
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
/* Animasi Soft Slide Down/Up */
.animate-soft-slide-down {
  animation: softSlideDown 0.8s cubic-bezier(0.16, 1, 0.3, 1) backwards;
}

.animate-soft-slide-up {
  animation: softSlideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) backwards;
}

@keyframes softSlideDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes softSlideUp {
  from {
    opacity: 0;
    transform: translateY(30px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
</style>
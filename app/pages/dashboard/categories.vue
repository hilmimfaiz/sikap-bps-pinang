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

// State
const userCookie = useCookie<any>('user_data')

// State Pagination & Search
const search = ref('')
const page = ref(1)
const limit = ref(10)

// State Seleksi
const selectedCategoryIds = ref<number[]>([])

// Fetch Data (Server-side)
const { data: response, pending, refresh, error } = await useFetch('/api/categories', {
  query: { search, page, limit },
  watch: [page, search]
})

// Ambil user untuk dropdown PIC
const { data: usersResponse } = await useFetch('/api/users', { query: { limit: 1000 } })
const users = computed(() => usersResponse.value?.data || [])

// Computed Data Wrappers
const categories = computed(() => response.value?.data || [])
const meta = computed(() => response.value?.meta || { total: 0, page: 1, limit: 10, totalPages: 1 })

// Reset page & selection saat search berubah
watch(search, () => {
  page.value = 1
  selectedCategoryIds.value = []
})

// Reset selection saat pindah halaman
watch(page, () => {
  selectedCategoryIds.value = []
})

// Admin check
const isAdmin = computed(() => userCookie.value?.role === 'admin')

// Modal states
const showCreateModal = ref(false)
const showEditModal = ref(false)
const showDeleteConfirm = ref(false)
const showBulkDeleteConfirm = ref(false)

const selectedCategory = ref<any>(null)

// [FIX] Update tipe data inChargeId agar bisa null
const form = ref({
  name: '',
  inChargeId: null as number | null
})

// Animation Trigger
const isVisible = ref(false)
onMounted(() => {
  setTimeout(() => {
    isVisible.value = true
  }, 100)
})

// --- LOGIKA SELEKSI ---
const isAllSelected = computed({
  get: () => {
    if (!categories.value || categories.value.length === 0) return false
    return categories.value.length > 0 && categories.value.every((c: any) => selectedCategoryIds.value.includes(c.id))
  },
  set: (val) => {
    if (val) {
      selectedCategoryIds.value = categories.value.map((c: any) => c.id)
    } else {
      selectedCategoryIds.value = []
    }
  }
})

const toggleSelection = (id: number) => {
  if (selectedCategoryIds.value.includes(id)) {
    selectedCategoryIds.value = selectedCategoryIds.value.filter(i => i !== id)
  } else {
    selectedCategoryIds.value.push(id)
  }
}

// Pagination Change
const changePage = (newPage: number) => {
  if (newPage >= 1 && newPage <= meta.value.totalPages) {
    page.value = newPage
  }
}

// Actions
const closeModals = () => {
  showCreateModal.value = false
  showEditModal.value = false
  showDeleteConfirm.value = false
  showBulkDeleteConfirm.value = false
  form.value = { name: '', inChargeId: null } // Reset form
  selectedCategory.value = null
}

// Create
const handleCreate = async () => {
  if (!isAdmin.value) return
  
  // [FIX] Validasi hanya untuk nama, inChargeId boleh kosong (null)
  if (!form.value.name.trim()) {
    return toast.warning(t('categories.messages.name_required') || 'Nama kategori wajib diisi')
  }

  startLoading(t('categories.messages.create_process'))
  try {
    await $fetch('/api/categories/create', {
      method: 'POST',
      body: { 
        name: form.value.name, 
        inChargeId: form.value.inChargeId // Kirim value (bisa null)
      }
    })
    await refresh()
    closeModals()
    await stopLoading()
    toast.success(t('categories.messages.create_success'))
  } catch (e: any) {
    await stopLoading()
    toast.error(e.data?.message || t('categories.messages.create_error'))
  }
}

// Edit
const openEdit = (cat: any) => {
  selectedCategory.value = cat
  // [FIX] Set inChargeId ke null jika tidak ada PIC
  form.value = { 
    name: cat.name, 
    inChargeId: cat.inCharge?.id || null 
  }
  showEditModal.value = true
}

const handleUpdate = async () => {
  if (!isAdmin.value) return
  startLoading(t('categories.messages.update_process'))
  try {
    await $fetch(`/api/categories/${selectedCategory.value.id}`, {
      method: 'PUT',
      body: { 
        name: form.value.name, 
        inChargeId: form.value.inChargeId // Kirim value (bisa null)
      }
    })
    await refresh()
    closeModals()
    await stopLoading()
    toast.success(t('categories.messages.update_success'))
  } catch (e: any) {
    await stopLoading()
    toast.error(e.data?.message || t('categories.messages.update_error'))
  }
}

// Delete Single
const openDelete = (cat: any) => {
  selectedCategory.value = cat
  showDeleteConfirm.value = true
}
const handleDelete = async () => {
  if (!isAdmin.value) return
  startLoading(t('categories.messages.delete_process'))
  try {
    await $fetch(`/api/categories/${selectedCategory.value.id}`, { method: 'DELETE' })
    await refresh()
    closeModals()
    await stopLoading()
    toast.success(t('categories.messages.delete_success'))
  } catch (e: any) {
    await stopLoading()
    toast.error(e.data?.message || t('categories.messages.delete_error'))
  }
}

// Bulk Delete
const handleBulkDelete = async () => {
  if (selectedCategoryIds.value.length === 0) return
  
  startLoading(t('categories.messages.bulk_delete_process', { count: selectedCategoryIds.value.length }))
  try {
    await $fetch('/api/categories/bulk-delete', {
      method: 'POST',
      body: { ids: selectedCategoryIds.value }
    })
    await refresh()
    selectedCategoryIds.value = []
    closeModals()
    await stopLoading()
    toast.success(t('categories.messages.bulk_delete_success'))
  } catch (e: any) {
    await stopLoading()
    toast.error(e.data?.message || t('categories.messages.bulk_delete_error'))
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
          <h1 class="text-2xl sm:text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-300">
             {{ $t('categories.title') }}
          </h1>
          <p class="text-sm text-gray-600 dark:text-gray-400">{{ $t('categories.subtitle') }}</p>
        </div>

        <div class="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          
          <transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0 scale-90" enter-to-class="opacity-100 scale-100" leave-active-class="transition duration-150 ease-in" leave-from-class="opacity-100 scale-100" leave-to-class="opacity-0 scale-90">
            <button 
              v-if="isAdmin && selectedCategoryIds.length > 0"
              @click="showBulkDeleteConfirm = true"
              class="bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all text-sm font-medium w-full sm:w-auto"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              {{ $t('common.delete') }} ({{ selectedCategoryIds.length }})
            </button>
          </transition>

          <div class="relative group w-full sm:w-auto">
            <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              v-model="search"
              type="text"
              :placeholder="$t('categories.search_placeholder')"
              class="w-full sm:w-64 pl-10 pr-4 py-2.5 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-blue-100 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-transparent shadow-md shadow-blue-500/5 dark:shadow-blue-900/10 transition-all duration-300 placeholder-gray-400 text-sm"
            />
          </div>

          <button
            v-if="isAdmin"
            @click="showCreateModal = true"
            class="group relative overflow-hidden bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold px-5 py-2.5 rounded-xl shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-300 flex items-center justify-center gap-2 text-sm w-full sm:w-auto"
          >
            <span class="relative z-10 flex items-center gap-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              {{ $t('categories.add_btn') }}
            </span>
            <div class="absolute inset-0 bg-white/20 translate-x-[-110%] group-hover:translate-x-[110%] transition-transform duration-700 ease-in-out"></div>
          </button>
        </div>
      </div>

      <div v-if="error" class="mb-6 p-4 bg-red-500/10 border border-red-500/30 backdrop-blur-md rounded-xl text-red-600 dark:text-red-400 text-center animate-pulse text-sm">
        {{ t('common.loading') }} error.
      </div>

      <div class="bg-white/80 dark:bg-gray-900/80 backdrop-blur-2xl border border-blue-100 dark:border-gray-800/50 rounded-2xl shadow-xl overflow-hidden flex flex-col h-full animate-soft-slide-up" style="animation-delay: 200ms;">
        <div class="overflow-x-auto flex-1">
          <table class="w-full min-w-full text-left text-sm">
            <thead class="bg-gradient-to-r from-blue-600/5 to-cyan-500/5 dark:from-blue-500/10 dark:to-cyan-500/10">
              <tr>
                <th v-if="isAdmin" class="px-6 py-4 w-10 text-center">
                   <input type="checkbox" v-model="isAllSelected" class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600" />
                </th>
                <th class="px-6 py-4 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">No.</th>
                <th class="px-6 py-4 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">{{ $t('categories.table.name') }}</th>
                <th class="px-6 py-4 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">{{ $t('categories.table.pic') }}</th>
                <th v-if="isAdmin" class="px-6 py-4 text-center text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">{{ $t('categories.table.action') }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-blue-50 dark:divide-gray-800">
              <tr v-if="pending">
                <td :colspan="isAdmin ? 5 : 4" class="px-6 py-16 text-center">
                  <div class="flex justify-center">
                    <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                  </div>
                  <p class="mt-3 text-xs text-gray-500 dark:text-gray-400 font-medium">{{ $t('common.loading') }}...</p>
                </td>
              </tr>

              <tr v-else-if="categories.length === 0">
                <td :colspan="isAdmin ? 5 : 4" class="px-6 py-16 text-center text-gray-400 dark:text-gray-500 text-sm">
                  <div class="bg-blue-50 dark:bg-gray-800 w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-3">
                    <svg class="w-8 h-8 text-blue-400 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 7h10m-10 4h7m-7 4h4m5 5H5a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v14a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  {{ search ? $t('categories.empty_search') : $t('categories.table.empty') }}
                </td>
              </tr>

              <tr
                v-for="(cat, index) in categories"
                :key="cat.id"
                class="hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-all duration-300 group"
              >
                <td v-if="isAdmin" class="px-6 py-4 text-center">
                   <input type="checkbox" :checked="selectedCategoryIds.includes(cat.id)" @change="toggleSelection(cat.id)" class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600" />
                </td>

                <td class="px-6 py-4 text-left text-gray-500 dark:text-gray-400 font-medium text-sm">
                  {{ (meta.page - 1) * meta.limit + index + 1 }}
                </td>

                <td class="px-6 py-4">
                  <span class="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/30 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-800 transition-transform group-hover:scale-105 duration-300">
                    {{ cat.name }}
                  </span>
                </td>

                <td class="px-6 py-4">
                  <div v-if="cat.inCharge" class="flex items-center gap-3">
                    <div class="relative shrink-0">
                      <div class="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white font-bold text-xs shadow-md ring-2 ring-white dark:ring-gray-800">
                        {{ cat.inCharge.name.charAt(0).toUpperCase() }}
                      </div>
                    </div>
                    <div class="font-medium text-sm text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {{ cat.inCharge.name }}
                    </div>
                  </div>
                  <span v-else class="text-xs text-gray-400 italic flex items-center gap-2">
                    <span class="w-1.5 h-1.5 bg-gray-300 rounded-full"></span>
                    {{ $t('categories.table.pic_none') || 'Belum Ditentukan' }}
                  </span>
                </td>

                <td v-if="isAdmin" class="px-6 py-4 text-center">
                  <div class="flex justify-center gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      @click="openEdit(cat)"
                      class="p-2 bg-amber-50 hover:bg-amber-100 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400 dark:hover:bg-amber-900/40 rounded-lg transition-all duration-200 hover:scale-110 shadow-sm border border-amber-100 dark:border-amber-800/30"
                      :title="$t('common.edit')"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      @click="openDelete(cat)"
                      class="p-2 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40 rounded-lg transition-all duration-200 hover:scale-110 shadow-sm border border-red-100 dark:border-red-800/30"
                      :title="$t('common.delete')"
                    >
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
            {{ $t('categories.pagination.showing', { start: (meta.page - 1) * meta.limit + 1, end: Math.min(meta.page * meta.limit, meta.total), total: meta.total }) }}
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
              {{ $t('categories.pagination.page', { current: meta.page, total: meta.totalPages }) }}
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

    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="showCreateModal || showEditModal || showDeleteConfirm || showBulkDeleteConfirm" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" @click="closeModals"></div>
    </Transition>

    <Transition
      enter-active-class="transition duration-400 cubic-bezier(0.16, 1, 0.3, 1)"
      enter-from-class="opacity-0 scale-95 translate-y-8"
      enter-to-class="opacity-100 scale-100 translate-y-0"
      leave-active-class="transition duration-300 ease-in"
      leave-from-class="opacity-100 scale-100 translate-y-0"
      leave-to-class="opacity-0 scale-95 translate-y-8"
    >
      <div v-if="showCreateModal || showEditModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div class="bg-white dark:bg-gray-900 rounded-[1.5rem] shadow-2xl border border-gray-100 dark:border-gray-800 w-full max-w-sm sm:max-w-md overflow-hidden relative pointer-events-auto max-h-[90vh] overflow-y-auto">
          <div class="absolute top-0 left-0 w-full h-24 bg-gradient-to-br from-blue-500 to-cyan-500 opacity-10"></div>
          
          <div class="p-6 relative">
            <div class="flex justify-between items-center mb-6">
              <h3 class="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-cyan-600">
                {{ showCreateModal ? $t('categories.modal.create_title') : $t('categories.modal.edit_title') }}
              </h3>
              <button @click="closeModals" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition bg-gray-50 dark:bg-gray-800 p-1.5 rounded-full">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <form @submit.prevent="showCreateModal ? handleCreate() : handleUpdate()" class="space-y-5">
              <div>
                <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wide">{{ $t('categories.modal.name_label') }}</label>
                <input
                  v-model="form.name"
                  type="text"
                  required
                  class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all placeholder-gray-400 text-gray-900 dark:text-white text-sm"
                  :placeholder="$t('categories.modal.name_placeholder')"
                />
              </div>

              <div>
                <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wide">{{ $t('categories.modal.pic_label') }}</label>
                <div class="relative">
                  <select
                    v-model="form.inChargeId"
                    class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all appearance-none text-gray-900 dark:text-white text-sm"
                  >
                    <option :value="null">Belum Ditentukan</option>
                    <option v-for="u in users" :key="u.id" :value="u.id">
                      {{ u.name }}
                    </option>
                  </select>
                  <div class="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-500">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>
              </div>

              <div class="flex gap-3 pt-3">
                <button type="button" @click="closeModals" class="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg font-medium text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800 transition text-sm">
                  {{ $t('common.cancel') }}
                </button>
                <button type="submit" class="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold rounded-lg shadow-md shadow-blue-500/30 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 text-sm">
                  {{ showCreateModal ? $t('common.save') : $t('common.update') }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Transition>

    <Transition
      enter-active-class="transition duration-400 cubic-bezier(0.16, 1, 0.3, 1)"
      enter-from-class="opacity-0 scale-90"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition duration-300 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-90"
    >
      <div v-if="showDeleteConfirm" class="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div class="bg-white dark:bg-gray-900 rounded-[1.5rem] shadow-2xl border border-gray-100 dark:border-gray-800 max-w-sm w-full p-6 text-center relative overflow-hidden pointer-events-auto">
          <div class="absolute top-0 left-0 w-full h-1.5 bg-red-500"></div>
          
          <div class="w-16 h-16 mx-auto mb-4 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center">
            <svg class="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1H9a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
          <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">{{ $t('categories.modal.delete_title') }}</h3>
          <p class="text-gray-600 dark:text-gray-300 mb-2 text-sm">
            Kategori <span class="font-bold text-red-600 dark:text-red-400">{{ selectedCategory?.name }}</span> akan dihapus permanen.
          </p>
          <p class="text-xs text-red-500 font-medium bg-red-50 dark:bg-red-900/20 py-1.5 px-3 rounded-lg inline-block mt-1">
            {{ $t('categories.modal.delete_warn') }}
          </p>

          <div class="flex gap-3 mt-6">
            <button @click="closeModals" class="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg font-medium text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800 transition text-sm">
              {{ $t('common.cancel') }}
            </button>
            <button @click="handleDelete" class="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow-md shadow-red-500/30 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 text-sm">
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
          <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-2">{{ $t('categories.modal.bulk_delete_title', { count: selectedCategoryIds.length }) }}</h3>
          <p class="text-xs text-gray-500 dark:text-gray-400 mb-6">Tindakan ini tidak dapat dibatalkan.</p>
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
/* Keyframes untuk animasi "Soft Entry" */
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
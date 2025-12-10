<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'

definePageMeta({
  layout: 'dashboard',
  middleware: 'auth'
})

// 1. Proteksi Halaman (Admin Only)
const userCookie = useCookie<any>('user_data')
if (userCookie.value?.role !== 'admin') {
  await navigateTo('/dashboard')
}

// 2. Inisialisasi Global Loading, Toast, & i18n
const { startLoading, stopLoading } = useGlobalLoading()
const toast = useToast()
const { t } = useI18n() 

// --- INTEGRASI CHAT ---
const { setConversation, isOpen } = useChatState()

const openChatWith = (user: any) => {
  const conversationData = {
    partnerId: user.id,
    name: user.name,
    photo: user.photoProfile,
    role: user.role?.name || 'user'
  }
  setConversation(conversationData)
  isOpen.value = true
}

// --- STATE MANAGEMENT & PAGINATION ---
const search = ref('')
const page = ref(1)
const limit = ref(10)

// Fetch Data dengan Pagination & Search
const { data: response, pending, refresh, error } = await useFetch('/api/users', {
  query: { search, page, limit },
  watch: [page, search] 
})

// Computed Properties
const users = computed(() => response.value?.data || [])
const meta = computed(() => response.value?.meta || { total: 0, page: 1, limit: 10, totalPages: 1 })

// Reset page saat search berubah
watch(search, () => {
  page.value = 1
})

const changePage = (newPage: number) => {
  if (newPage >= 1 && newPage <= meta.value.totalPages) {
    page.value = newPage
  }
}

// --- STATE SELEKSI (BULK ACTION) ---
const selectedUserIds = ref<number[]>([])
const showBulkDeleteConfirm = ref(false)

const isAllSelected = computed({
  get: () => {
    if (!users.value || users.value.length === 0) return false
    const validUsers = users.value.filter((u: any) => u.id !== userCookie.value.id)
    return validUsers.length > 0 && validUsers.every((u: any) => selectedUserIds.value.includes(u.id))
  },
  set: (val) => {
    if (val) {
      const validUsers = users.value.filter((u: any) => u.id !== userCookie.value.id)
      selectedUserIds.value = validUsers.map((u: any) => u.id)
    } else {
      selectedUserIds.value = []
    }
  }
})

const toggleSelection = (id: number) => {
  if (selectedUserIds.value.includes(id)) {
    selectedUserIds.value = selectedUserIds.value.filter(i => i !== id)
  } else {
    selectedUserIds.value.push(id)
  }
}

// Reset seleksi saat pindah halaman
watch([page, search], () => {
  selectedUserIds.value = []
})

// --- MODAL & FORM STATE ---
const showCreateModal = ref(false)
const showImportModal = ref(false)
const showViewModal = ref(false)
const showEditModal = ref(false)
const showLockConfirm = ref(false)
const showDeleteConfirm = ref(false)
const showDropdown = ref(false)

const selectedUser = ref<any>(null)
const importFile = ref<File | null>(null)

const form = ref({
  name: '',
  email: '',
  password: '',
  roleId: 3,
  isActive: true
})

// Animation Trigger
const isVisible = ref(false)
onMounted(() => {
  setTimeout(() => {
    isVisible.value = true
  }, 100)
})

// --- VALIDATOR HELPER ---
// Regex Nama: Hanya huruf (a-z, A-Z), spasi, titik, dan koma
const nameRegex = /^[a-zA-Z .,]+$/

// Regex Email FIX: 
// 1. Username (depan @): Huruf dan Angka [a-zA-Z0-9]+
// 2. Pemisah: @
// 3. Domain (belakang @): Boleh Huruf, Angka, Titik, Strip
const emailRegex = /^[a-zA-Z0-9]+@[a-zA-Z0-9.-]+\.[a-zA-Z0-9]+$/

// --- ACTIONS ---

const closeModals = () => {
  showCreateModal.value = false
  showImportModal.value = false
  showViewModal.value = false
  showEditModal.value = false
  showLockConfirm.value = false
  showDeleteConfirm.value = false
  showBulkDeleteConfirm.value = false
  showDropdown.value = false
  
  form.value = { name: '', email: '', password: '', roleId: 3, isActive: true }
  selectedUser.value = null
  importFile.value = null
}

const toggleDropdown = () => {
  showDropdown.value = !showDropdown.value
}

// Bulk Delete
const handleBulkDelete = async () => {
  if (selectedUserIds.value.length === 0) return

  startLoading(t('users.messages.bulk_delete_process', { count: selectedUserIds.value.length }))
  try {
    await $fetch('/api/users/bulk-delete', {
      method: 'POST',
      body: { ids: selectedUserIds.value }
    })
    await refresh()
    selectedUserIds.value = []
    closeModals()
    await stopLoading()
    toast.success(t('users.messages.bulk_delete_success'))
  } catch (e: any) {
    await stopLoading()
    toast.error(e.data?.message || t('users.messages.bulk_delete_error'))
  }
}

// Create User
const handleCreateUser = async () => {
  // --- VALIDASI NAMA ---
  if (!nameRegex.test(form.value.name)) {
    return toast.warning('Nama hanya boleh berisi huruf, spasi, titik (.), dan koma (,)')
  }

  // --- VALIDASI EMAIL ---
  if (!emailRegex.test(form.value.email)) {
    return toast.warning('Format email salah. Bagian depan (sebelum @) hanya boleh huruf dan angka. Contoh: pegawai123@sikap.com')
  }
  // ---------------------

  startLoading(t('users.messages.create_process'))
  try {
    await $fetch('/api/users/create', { method: 'POST', body: form.value })
    await refresh()
    closeModals()
    await stopLoading()
    toast.success(t('users.messages.create_success'))
  } catch (e: any) {
    await stopLoading()
    toast.error(e.data?.message || t('users.messages.create_error'))
  }
}

// Import CSV
const onFileChange = (e: any) => {
  const file = e.target.files[0]
  if (file && (file.type === "text/csv" || file.type === "application/vnd.ms-excel" || file.name.toLowerCase().endsWith('.csv'))) {
    importFile.value = file
  } else {
    toast.warning(t('users.messages.file_format'))
    e.target.value = null
  }
}

const downloadTemplate = () => {
  const csvContent = "Name,Email,Password,Role\nBudi Santoso,budi@sikap.com,rahasia123,editor\nSiti Aminah,siti@sikap.com,password123,viewer"
  const blob = new Blob([csvContent], { type: 'text/csv' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = "template_users.csv"
  a.click()
  window.URL.revokeObjectURL(url)
  toast.info('Template CSV diunduh')
}

const handleImport = async () => {
  if (!importFile.value) return toast.warning(t('users.messages.file_required'))
  
  startLoading(t('users.messages.import_process'))
  const formData = new FormData()
  formData.append('file', importFile.value)

  try {
    const res: any = await $fetch('/api/users/import', {
      method: 'POST',
      body: formData
    })
    await refresh()
    closeModals()
    await stopLoading()
    toast.success(res.message)
  } catch (e: any) {
    await stopLoading()
    toast.error(e.data?.message || t('users.messages.import_error'))
  }
}

// View & Edit
const openViewModal = (user: any) => {
  selectedUser.value = user
  showViewModal.value = true
}

const openEditModal = (user: any) => {
  selectedUser.value = user
  form.value = {
    name: user.name,
    email: user.email,
    password: '',
    roleId: user.roleId || 3,
    isActive: user.isActive ?? true
  }
  showEditModal.value = true
}

const handleUpdateUser = async () => {
  if (!selectedUser.value) return

  // --- VALIDASI NAMA ---
  if (!nameRegex.test(form.value.name)) {
    return toast.warning('Nama hanya boleh berisi huruf, spasi, titik (.), dan koma (,)')
  }

  // --- VALIDASI EMAIL ---
  if (!emailRegex.test(form.value.email)) {
    return toast.warning('Format email salah. Bagian depan (sebelum @) hanya boleh huruf dan angka. Contoh: hilmifaiz744@gmail.com')
  }
  // ---------------------

  startLoading(t('users.messages.update_process'))
  try {
    await $fetch(`/api/users/${selectedUser.value.id}`, {
      method: 'PUT',
      body: form.value
    })
    await refresh()
    closeModals()
    await stopLoading()
    toast.success(t('users.messages.update_success'))
  } catch (e: any) {
    await stopLoading()
    toast.error(e.data?.message || t('users.messages.update_error'))
  }
}

// Lock User
const openLockConfirm = (user: any) => {
  selectedUser.value = user
  showLockConfirm.value = true
}

const toggleUserLock = async () => {
  if (!selectedUser.value) return
  
  const isLocking = selectedUser.value.isActive 
  startLoading(isLocking ? t('users.messages.lock_process') : t('users.messages.unlock_process'))
  
  try {
    const newStatus = !isLocking
    await $fetch(`/api/users/${selectedUser.value.id}`, {
      method: 'PUT',
      body: { isActive: newStatus }
    })
    await refresh()
    closeModals()
    await stopLoading()
    toast.success(t('users.messages.status_success'))
  } catch (e: any) {
    await stopLoading()
    toast.error(t('users.messages.status_error'))
  }
}

// Delete User
const openDeleteConfirm = (user: any) => {
  selectedUser.value = user
  showDeleteConfirm.value = true
}

const handleDeleteUser = async () => {
  if (!selectedUser.value) return
  
  startLoading(t('users.messages.delete_process'))
  try {
    await $fetch(`/api/users/${selectedUser.value.id}`, { method: 'DELETE' })
    await refresh()
    closeModals()
    await stopLoading()
    toast.success(t('users.messages.delete_success'))
  } catch (e: any) {
    await stopLoading()
    toast.error(e.data?.message || t('users.messages.delete_error'))
  }
}

// Helpers
const getRoleBadgeClass = (roleName: string) => {
  switch (roleName) {
    case 'admin': return 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
    case 'editor': return 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white'
    default: return 'bg-gradient-to-r from-gray-500 to-slate-500 text-white'
  }
}

const getStatusBadgeClass = (isActive: boolean) => {
  return isActive 
    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
    : 'bg-gradient-to-r from-red-500 to-rose-500 text-white'
}
</script>

<template>
  <div @click="showDropdown = false" class="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:from-gray-950 dark:via-gray-900 dark:to-blue-950/20 py-6 px-4 sm:px-6 lg:px-8">
    
    <div 
      class="max-w-6xl mx-auto transition-all duration-700 ease-out"
      :class="isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'"
    >
      
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 sm:mb-8 animate-soft-slide-down" style="animation-delay: 100ms;">
        <div class="space-y-1">
          <h1 class="text-2xl sm:text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400">
            {{ $t('users.title') }}
          </h1>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            {{ $t('users.subtitle') }}
          </p>
        </div>
        
        <div class="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0 scale-90" enter-to-class="opacity-100 scale-100" leave-active-class="transition duration-150 ease-in" leave-from-class="opacity-100 scale-100" leave-to-class="opacity-0 scale-90">
            <button 
              v-if="selectedUserIds.length > 0"
              @click="showBulkDeleteConfirm = true"
              class="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all text-sm font-medium"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              {{ $t('common.delete') }} ({{ selectedUserIds.length }})
            </button>
          </transition>

          <div class="relative w-full sm:w-60">
            <input 
              v-model="search" 
              type="text" 
              :placeholder="$t('common.search')" 
              class="w-full pl-9 pr-4 py-2.5 rounded-xl border border-blue-100 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm backdrop-blur-sm text-sm placeholder-gray-400"
            />
            <svg class="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          </div>

          <div class="relative w-full sm:w-auto">
            <button 
              @click.stop="toggleDropdown"
              class="w-full sm:w-auto group relative overflow-hidden bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 shadow-lg hover:shadow-xl active:scale-95 text-sm font-medium"
            >
              <span class="relative z-10 flex items-center gap-2">
                + {{ $t('users.add_btn') }}
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 transition-transform duration-300" :class="showDropdown ? 'rotate-180' : ''" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </span>
              <div class="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
            </button>

            <transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0 -translate-y-2" enter-to-class="opacity-100 translate-y-0" leave-active-class="transition duration-150 ease-in" leave-from-class="opacity-100 translate-y-0" leave-to-class="opacity-0 -translate-y-2">
              <div v-if="showDropdown" class="absolute top-full right-0 mt-2 w-56 bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl rounded-xl shadow-xl border border-blue-100 dark:border-gray-700/50 py-2 z-20 overflow-hidden">
                <button @click="showCreateModal = true" class="w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/30 flex items-center gap-3 transition-colors">
                  <span class="text-blue-500 text-lg">✏️</span>
                  <span>{{ $t('users.add_manual') }}</span>
                </button>
                <button @click="showImportModal = true" class="w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-green-50 dark:hover:bg-green-900/30 flex items-center gap-3 transition-colors border-t border-gray-100 dark:border-gray-800">
                  <span class="text-green-500 text-lg">📊</span>
                  <span>{{ $t('users.import_csv') }}</span>
                </button>
              </div>
            </transition>
          </div>
        </div>
      </div>

      <div v-if="error" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6 text-red-600 dark:text-red-400 animate-pulse">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center text-red-500">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <div>
            <h3 class="font-semibold text-sm">{{ $t('users.load_error') }}</h3>
            <p class="text-xs opacity-80 mt-0.5">{{ $t('users.load_error_desc') }}</p>
          </div>
        </div>
      </div>

      <div class="bg-white/80 dark:bg-gray-900/80 backdrop-blur-2xl rounded-2xl shadow-xl border border-blue-100 dark:border-gray-800/50 overflow-hidden flex flex-col h-full animate-soft-slide-up" style="animation-delay: 200ms;">
        <div class="overflow-x-auto flex-1">
          <table class="w-full min-w-full text-left text-sm">
            <thead class="bg-gradient-to-r from-blue-600/5 to-cyan-500/5 dark:from-blue-500/10 dark:to-cyan-500/10 text-gray-600 dark:text-gray-300 uppercase text-xs font-bold">
              <tr>
                <th class="px-6 py-4 w-10">
                  <input type="checkbox" v-model="isAllSelected" class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600" />
                </th>
                <th class="px-6 py-4 font-medium">{{ $t('users.table.user') }}</th>
                <th class="px-6 py-4 font-medium hidden sm:table-cell">{{ $t('users.table.role') }}</th>
                <th class="px-6 py-4 font-medium">{{ $t('users.table.status') }}</th>
                <th class="px-6 py-4 font-medium text-center">{{ $t('users.table.action') }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-blue-50 dark:divide-gray-800">
              <tr v-if="pending">
                <td colspan="5" class="px-6 py-16 text-center text-gray-400 dark:text-gray-500">
                  <div class="flex justify-center items-center gap-2">
                    <div class="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                    <span class="text-sm font-medium">{{ $t('common.loading') }}</span>
                  </div>
                </td>
              </tr>
              <tr v-else-if="!users.length">
                <td colspan="5" class="px-6 py-16 text-center text-gray-400 dark:text-gray-500 italic">
                  <div class="flex flex-col items-center gap-2">
                    <div class="w-12 h-12 bg-blue-50 dark:bg-gray-800 rounded-xl flex items-center justify-center text-xl opacity-60">
                      👥
                    </div>
                    <p class="text-sm">{{ search ? $t('users.empty_search') : $t('users.empty_data') }}</p>
                  </div>
                </td>
              </tr>

              <tr v-for="user in users" :key="user.id" class="hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-all duration-300 group">
                <td class="px-6 py-4">
                  <input type="checkbox" :checked="selectedUserIds.includes(user.id)" @change="toggleSelection(user.id)" :disabled="user.id === userCookie.id" class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed" />
                </td>
                <td class="px-6 py-4">
                  <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-600 overflow-hidden flex items-center justify-center border border-gray-300 dark:border-gray-500 text-xs font-bold text-gray-500 dark:text-gray-400 shrink-0 shadow-sm">
                      <img v-if="user.photoProfile" :src="user.photoProfile" class="w-full h-full object-cover" />
                      <span v-else>{{ user.name.charAt(0).toUpperCase() }}</span>
                    </div>
                    <div class="min-w-0 flex-1">
                      <div class="font-semibold text-gray-900 dark:text-gray-100 truncate text-sm">{{ user.name }}</div>
                      <div class="text-xs text-gray-500 dark:text-gray-400 truncate">{{ user.email }}</div>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 hidden sm:table-cell">
                  <span :class="getRoleBadgeClass(user.role?.name)" class="px-2.5 py-1 rounded-lg text-[10px] font-semibold capitalize tracking-wide shadow-sm">
                    {{ user.role?.name === 'admin' ? $t('roles.super_admin') : user.role?.name }}
                  </span>
                </td>
                <td class="px-6 py-4">
                  <span :class="getStatusBadgeClass(user.isActive ?? true)" class="px-2.5 py-1 rounded-lg text-[10px] font-semibold capitalize tracking-wide shadow-sm">
                    {{ (user.isActive ?? true) ? $t('users.status.active') : $t('users.status.locked') }}
                  </span>
                </td>
                <td class="px-6 py-4">
                  <div class="flex justify-center items-center gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button v-if="user.email !== userCookie.email" @click="openChatWith(user)" class="p-2 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 rounded-lg transition-colors shadow-sm border border-indigo-100 dark:border-indigo-800/30" :title="'Chat dengan ' + user.name">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                    </button>
                    <button @click="openViewModal(user)" class="p-2 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-lg transition-colors shadow-sm border border-blue-100 dark:border-blue-800/30" :title="$t('common.view')">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    </button>
                    <button @click="openEditModal(user)" class="p-2 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/40 rounded-lg transition-colors shadow-sm border border-amber-100 dark:border-amber-800/30" :title="$t('common.edit')">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    </button>
                    <button v-if="user.email !== userCookie.email" @click="openLockConfirm(user)" class="p-2 rounded-lg transition-colors shadow-sm border" :class="(user.isActive ?? true) ? 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 hover:bg-yellow-100 dark:hover:bg-yellow-900/40 border-yellow-100 dark:border-yellow-800/30' : 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/40 border-green-100 dark:border-green-800/30'">
                      <svg v-if="user.isActive ?? true" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                      <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" /></svg>
                    </button>
                    <button v-if="user.email !== userCookie.email" @click="openDeleteConfirm(user)" class="p-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg transition-colors shadow-sm border border-red-100 dark:border-red-800/30" :title="$t('common.delete')">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="meta.totalPages > 1" class="px-6 py-4 border-t border-blue-100 dark:border-gray-700/50 flex flex-col sm:flex-row justify-between items-center gap-4 bg-blue-50/30 dark:bg-gray-800/30">
          <span class="text-xs text-gray-500 dark:text-gray-400 font-medium">
            {{ $t('users.pagination.showing', { start: (meta.page - 1) * meta.limit + 1, end: Math.min(meta.page * meta.limit, meta.total), total: meta.total }) }}
          </span>

          <div class="flex items-center gap-2">
            <button @click="changePage(meta.page - 1)" :disabled="meta.page === 1" class="p-2 rounded-lg border border-blue-200 dark:border-gray-600 hover:bg-blue-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-600 dark:text-gray-300">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
            </button>
            <span class="text-xs font-semibold text-gray-700 dark:text-gray-300 mx-2">
              {{ $t('users.pagination.page', { current: meta.page, total: meta.totalPages }) }}
            </span>
            <button @click="changePage(meta.page + 1)" :disabled="meta.page === meta.totalPages" class="p-2 rounded-lg border border-blue-200 dark:border-gray-600 hover:bg-blue-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-600 dark:text-gray-300">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <Transition enter-active-class="transition duration-300" enter-from-class="opacity-0" enter-to-class="opacity-100" leave-active-class="transition duration-200" leave-from-class="opacity-100" leave-to-class="opacity-0">
      <div v-if="showCreateModal || showImportModal || showViewModal || showEditModal || showLockConfirm || showDeleteConfirm || showBulkDeleteConfirm" class="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" @click="closeModals"></div>
    </Transition>

    <Transition enter-active-class="transition duration-400 cubic-bezier(0.16, 1, 0.3, 1)" enter-from-class="opacity-0 scale-95 translate-y-8" enter-to-class="opacity-100 scale-100 translate-y-0" leave-active-class="transition duration-300 ease-in" leave-from-class="opacity-100 scale-100" leave-to-class="opacity-0 scale-95 translate-y-8">
      <div v-if="showCreateModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div class="bg-white dark:bg-gray-900 rounded-[1.5rem] shadow-2xl border border-gray-100 dark:border-gray-800 w-full max-w-md pointer-events-auto overflow-hidden max-h-[90vh] overflow-y-auto relative">
          <div class="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 to-cyan-500"></div>
          <div class="px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
            <h3 class="text-lg font-bold text-gray-900 dark:text-white">{{ $t('users.modal.create_title') }}</h3>
            <button @click="closeModals" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg></button>
          </div>
          <form @submit.prevent="handleCreateUser" class="p-6 space-y-4">
            <div><label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wide">{{ $t('users.modal.name_label') }}</label><input v-model="form.name" required class="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all text-sm" /></div>
            <div><label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wide">{{ $t('users.modal.email_label') }}</label><input v-model="form.email" type="email" required class="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all text-sm" /></div>
            <div><label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wide">{{ $t('users.modal.password_label') }}</label><input v-model="form.password" type="password" required class="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all text-sm" placeholder="Min. 6 karakter" /></div>
            <div><label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wide">{{ $t('users.modal.role_label') }}</label><div class="relative"><select v-model="form.roleId" class="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all appearance-none text-sm"><option :value="1">Admin</option><option :value="2">Editor</option><option :value="3">Viewer</option></select><div class="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-500"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg></div></div></div>
            <div class="pt-2 flex gap-3"><button type="button" @click="closeModals" class="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg font-medium text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800 transition text-sm">{{ $t('common.cancel') }}</button><button type="submit" class="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold rounded-lg shadow-md transition-all transform hover:-translate-y-0.5 text-sm">{{ $t('common.save') }}</button></div>
          </form>
        </div>
      </div>
    </Transition>

    <Transition enter-active-class="transition duration-400 cubic-bezier(0.16, 1, 0.3, 1)" enter-from-class="opacity-0 scale-95 translate-y-8" enter-to-class="opacity-100 scale-100 translate-y-0" leave-active-class="transition duration-300 ease-in" leave-from-class="opacity-100 scale-100" leave-to-class="opacity-0 scale-95 translate-y-8">
      <div v-if="showImportModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div class="bg-white dark:bg-gray-900 rounded-[1.5rem] shadow-2xl border border-gray-100 dark:border-gray-800 w-full max-w-lg pointer-events-auto p-6 relative overflow-hidden">
          <div class="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-green-500 to-emerald-500"></div>
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-bold text-gray-900 dark:text-white">{{ $t('users.modal.import_title') }}</h3>
            <button @click="closeModals" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg></button>
          </div>
          <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl p-4 mb-4 text-xs text-blue-700 dark:text-blue-300">
            <p class="font-semibold mb-1">{{ $t('users.modal.import_guide') }}</p>
            <ul class="list-disc pl-4 space-y-0.5 opacity-90">
              <li>{{ $t('users.modal.import_guide_1') }}</li>
              <li>{{ $t('users.modal.import_guide_2') }}</li>
            </ul>
          </div>
          <div class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center hover:bg-blue-50/50 dark:hover:bg-gray-800/50 transition-all relative cursor-pointer group">
            <input type="file" accept=".csv" @change="onFileChange" class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
            <div v-if="!importFile" class="group-hover:scale-105 transition-transform duration-300">
              <div class="text-4xl mb-2 opacity-60">📄</div>
              <p class="text-gray-600 dark:text-gray-300 font-medium text-sm">{{ $t('users.modal.file_label') }}</p>
              <p class="text-xs text-gray-400 mt-1">{{ $t('users.modal.file_limit_info') }}</p>
            </div>
            <div v-else class="relative z-20 text-green-600 dark:text-green-400">
              <div class="text-4xl mb-2">✅</div>
              <p class="font-medium text-sm">{{ importFile.name }}</p>
              <button @click.stop="importFile = null" class="text-xs text-red-500 hover:underline mt-2">Hapus</button>
            </div>
          </div>
          <div class="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6">
            <button @click="downloadTemplate" class="text-blue-600 dark:text-blue-400 text-xs hover:underline flex items-center gap-1">⬇ {{ $t('users.download_template') }}</button>
            <button @click="handleImport" :disabled="!importFile" class="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors w-full sm:w-auto shadow-md">{{ $t('users.import_csv') }}</button>
          </div>
        </div>
      </div>
    </Transition>

    <Transition enter-active-class="transition duration-400 cubic-bezier(0.16, 1, 0.3, 1)" enter-from-class="opacity-0 scale-95 translate-y-8" enter-to-class="opacity-100 scale-100 translate-y-0" leave-active-class="transition duration-300 ease-in" leave-from-class="opacity-100 scale-100" leave-to-class="opacity-0 scale-95 translate-y-8">
      <div v-if="showViewModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div class="bg-white dark:bg-gray-800 rounded-[1.5rem] shadow-2xl border border-gray-100 dark:border-gray-700 w-full max-w-sm pointer-events-auto overflow-hidden">
          <div class="bg-gray-50 dark:bg-gray-800/50 px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h3 class="font-bold text-gray-800 dark:text-white text-sm">{{ $t('users.modal.detail_title') }}</h3>
            <button @click="closeModals" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">✕</button>
          </div>
          <div class="p-6 text-center">
            <div class="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full mx-auto mb-4 overflow-hidden border-2 border-white dark:border-gray-600 flex items-center justify-center text-xl font-bold text-gray-400 dark:text-gray-300 shadow-sm">
              <img v-if="selectedUser?.photoProfile" :src="selectedUser.photoProfile" class="w-full h-full object-cover" />
              <span v-else>{{ selectedUser?.name?.charAt(0).toUpperCase() }}</span>
            </div>
            <h2 class="text-lg font-bold text-gray-900 dark:text-white">{{ selectedUser?.name }}</h2>
            <p class="text-xs text-gray-500 dark:text-gray-400 mb-4">{{ selectedUser?.email }}</p>
            <div class="flex justify-center gap-2 text-[10px]">
              <span class="px-2.5 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg border border-blue-100 dark:border-blue-800 capitalize font-semibold">{{ selectedUser?.role?.name }}</span>
              <span class="px-2.5 py-1 rounded-lg border capitalize font-semibold" :class="(selectedUser?.isActive ?? true) ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-100 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-100 dark:border-red-800'">
                {{ (selectedUser?.isActive ?? true) ? $t('users.status.active') : $t('users.status.locked') }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <Transition enter-active-class="transition duration-400 cubic-bezier(0.16, 1, 0.3, 1)" enter-from-class="opacity-0 scale-95 translate-y-8" enter-to-class="opacity-100 scale-100 translate-y-0" leave-active-class="transition duration-300 ease-in" leave-from-class="opacity-100 scale-100" leave-to-class="opacity-0 scale-95 translate-y-8">
      <div v-if="showEditModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div class="bg-white dark:bg-gray-900 rounded-[1.5rem] shadow-2xl border border-gray-100 dark:border-gray-800 w-full max-w-md pointer-events-auto overflow-hidden relative">
          <div class="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 to-cyan-500"></div>
          <div class="px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
            <h3 class="text-lg font-bold text-gray-900 dark:text-white">{{ $t('users.modal.edit_title') }}</h3>
            <button @click="closeModals" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">✕</button>
          </div>
          <form @submit.prevent="handleUpdateUser" class="p-6 space-y-4">
            <div><label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wide">{{ $t('users.modal.name_label') }}</label><input v-model="form.name" required class="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all text-sm" /></div>
            <div><label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wide">{{ $t('users.modal.email_label') }}</label><input v-model="form.email" type="email" required class="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all text-sm" /></div>
            <div><label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wide">{{ $t('users.modal.password_new_label') }}</label><input v-model="form.password" type="password" class="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all text-sm" /></div>
            <div><label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wide">{{ $t('users.modal.role_label') }}</label><div class="relative"><select v-model="form.roleId" class="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all appearance-none text-sm"><option :value="1">Admin</option><option :value="2">Editor</option><option :value="3">Viewer</option></select><div class="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-500"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg></div></div></div>
            <div class="pt-2 flex gap-3"><button type="button" @click="closeModals" class="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg font-medium text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800 transition text-sm">{{ $t('common.cancel') }}</button><button type="submit" class="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold rounded-lg shadow-md transition-all transform hover:-translate-y-0.5 text-sm">{{ $t('common.save') }}</button></div>
          </form>
        </div>
      </div>
    </Transition>

    <Transition enter-active-class="transition duration-400 cubic-bezier(0.16, 1, 0.3, 1)" enter-from-class="opacity-0 scale-95 translate-y-8" enter-to-class="opacity-100 scale-100 translate-y-0" leave-active-class="transition duration-300 ease-in" leave-from-class="opacity-100 scale-100" leave-to-class="opacity-0 scale-95 translate-y-8">
      <div v-if="showLockConfirm" class="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div class="bg-white dark:bg-gray-900 rounded-[1.5rem] shadow-2xl border border-gray-100 dark:border-gray-800 w-full max-w-sm pointer-events-auto p-6 text-center relative overflow-hidden">
          <div class="absolute top-0 left-0 w-full h-1.5" :class="(selectedUser?.isActive ?? true) ? 'bg-red-500' : 'bg-green-500'"></div>
          <div class="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl shadow-sm" :class="(selectedUser?.isActive ?? true) ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'">{{ (selectedUser?.isActive ?? true) ? '🔒' : '🔓' }}</div>
          <h3 class="font-bold text-lg text-gray-900 dark:text-white mb-2">{{ (selectedUser?.isActive ?? true) ? $t('users.modal.lock_title') : $t('users.modal.unlock_title') }}</h3>
          <p class="text-xs text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">{{ $t('users.modal.lock_desc') }}</p>
          <div class="flex gap-3">
            <button @click="closeModals" class="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg font-medium text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800 transition text-sm">{{ $t('common.cancel') }}</button>
            <button @click="toggleUserLock" class="flex-1 py-2.5 text-white font-semibold rounded-lg shadow-md transition-all text-sm" :class="(selectedUser?.isActive ?? true) ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'">{{ $t('common.yes_continue') }}</button>
          </div>
        </div>
      </div>
    </Transition>

    <Transition enter-active-class="transition duration-400 cubic-bezier(0.16, 1, 0.3, 1)" enter-from-class="opacity-0 scale-95 translate-y-8" enter-to-class="opacity-100 scale-100 translate-y-0" leave-active-class="transition duration-300 ease-in" leave-from-class="opacity-100 scale-100" leave-to-class="opacity-0 scale-95 translate-y-8">
      <div v-if="showDeleteConfirm" class="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div class="bg-white dark:bg-gray-900 rounded-[1.5rem] shadow-2xl border border-gray-100 dark:border-gray-800 w-full max-w-sm pointer-events-auto p-6 text-center relative overflow-hidden">
          <div class="absolute top-0 left-0 w-full h-1.5 bg-red-600"></div>
          <div class="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto mb-4 text-2xl shadow-sm">🗑️</div>
          <h3 class="font-bold text-lg text-gray-900 dark:text-white mb-2">{{ $t('users.modal.delete_title') }}</h3>
          <p class="text-xs text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">{{ $t('users.modal.delete_desc') }}</p>
          <div class="flex gap-3">
            <button @click="closeModals" class="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg font-medium text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800 transition text-sm">{{ $t('common.cancel') }}</button>
            <button @click="handleDeleteUser" class="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow-md transition-all text-sm">{{ $t('common.yes_delete') }}</button>
          </div>
        </div>
      </div>
    </Transition>

    <Transition enter-active-class="transition duration-400 cubic-bezier(0.16, 1, 0.3, 1)" enter-from-class="opacity-0 scale-95 translate-y-8" enter-to-class="opacity-100 scale-100 translate-y-0" leave-active-class="transition duration-300 ease-in" leave-from-class="opacity-100 scale-100" leave-to-class="opacity-0 scale-95 translate-y-8">
      <div v-if="showBulkDeleteConfirm" class="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div class="bg-white dark:bg-gray-900 rounded-[1.5rem] shadow-2xl border border-gray-100 dark:border-gray-800 w-full max-w-sm pointer-events-auto p-6 text-center relative overflow-hidden">
          <div class="absolute top-0 left-0 w-full h-1.5 bg-red-600"></div>
          <div class="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto mb-4 text-2xl shadow-sm">🗑️</div>
          <h3 class="font-bold text-lg text-gray-900 dark:text-white mb-2">{{ $t('users.modal.bulk_delete_title', { count: selectedUserIds.length }) }}</h3>
          <p class="text-xs text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">{{ $t('users.modal.bulk_delete_desc') }}</p>
          <div class="flex gap-3">
            <button @click="closeModals" class="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg font-medium text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800 transition text-sm">{{ $t('common.cancel') }}</button>
            <button @click="handleBulkDelete" class="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow-md transition-all text-sm">{{ $t('common.delete_all') }}</button>
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
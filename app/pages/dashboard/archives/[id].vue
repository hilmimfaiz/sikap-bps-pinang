<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'

const route = useRoute()
const router = useRouter()
const folderId = route.params.id as string
const userCookie = useCookie<any>('user_data')
const config = useRuntimeConfig()

definePageMeta({
  layout: 'dashboard',
  middleware: 'auth'
})

const { startLoading, stopLoading } = useGlobalLoading()
const toast = useToast()
const { t } = useI18n()

// --- STATE PAGINATION & SEARCH ---
const search = ref('')
const page = ref(1)
const limit = ref(10)

// --- STATE DATA ---
const allUsers = ref<any[]>([]) 

// Modal States
const showAddDropdown = ref(false)
const showCreateFolderModal = ref(false)
const showUploadModal = ref(false)
const showRenameModal = ref(false) // Rename Folder Utama
const showRenameSubFolderModal = ref(false) // Rename Sub-folder
const showRenameFileModal = ref(false) // Rename File
const showDeleteFolderConfirm = ref(false)
const showDeleteSubFolderConfirm = ref(false)
const showDeleteFileConfirm = ref(false)
const showShareFileModal = ref(false)
const showShareFolderModal = ref(false)
const showBulkDeleteConfirm = ref(false)
const showDuplicateConfirm = ref(false) // Duplicate Warning

// --- NEW: UPLOAD PROGRESS STATE ---
const isUploading = ref(false)
const uploadProgress = ref(0)
const uploadStats = ref({ loaded: 0, total: 0 })
// Simpan referensi XHR agar bisa dibatalkan
const xhrRef = ref<XMLHttpRequest | null>(null)

// Forms & Data Holders
const createFolderName = ref('')
const newFolderName = ref('')
const newSubFolderName = ref('')
const newFileName = ref('') // Holder nama file baru
const selectedFile = ref<any>(null)
const selectedSubFolder = ref<any>(null)
const shareFileUserIds = ref<number[]>([]) 
const shareFolderUserIds = ref<number[]>([])
const selectedFileIds = ref<number[]>([]) 

const uploadForm = ref({
  file: null as File | null,
  title: ''
})

// Animation Trigger
const isVisible = ref(false)
onMounted(() => {
  setTimeout(() => { isVisible.value = true }, 100)
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement
    if (!target.closest('.add-dropdown-container')) {
      showAddDropdown.value = false
    }
  })
})

// --- DATA FETCHING ---
const { data: response, pending, refresh, error } = await useFetch(`/api/folders/${folderId}`, {
  query: { page, limit, search },
  watch: [page, search]
})

if (error.value) {
  toast.error(t('archives.messages.folder_not_found') || 'Folder tidak ditemukan')
  router.push('/dashboard/archives')
}

// Computed Data
const folder = computed(() => response.value?.folder || null)
const archives = computed(() => folder.value?.archives || [])
const childrenFolders = computed(() => folder.value?.children || [])
const meta = computed(() => response.value?.meta || { total: 0, page: 1, limit: 10, totalPages: 1 })

watch(search, () => { page.value = 1; selectedFileIds.value = [] })
watch(page, () => { selectedFileIds.value = [] })

const changePage = (newPage: number) => {
  if (newPage >= 1 && newPage <= meta.value.totalPages) page.value = newPage
}

// --- HELPER: FORMAT SIZE ---
const formatSize = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// --- FETCH USERS ---
const fetchAllUsers = async () => {
  if (allUsers.value.length > 0) return 
  try {
    const res: any = await $fetch('/api/users', { query: { limit: 1000 } })
    allUsers.value = (res.data || []).filter((u: any) => u.id !== userCookie.value.id)
  } catch (e) { console.error(e) }
}

// --- PERMISSIONS ---
const canManage = computed(() => {
  if (!folder.value || !userCookie.value) return false
  return userCookie.value.role === 'admin' || folder.value.userId === userCookie.value.id
})

// --- SELECTION (Files Only) ---
const isAllSelected = computed({
  get: () => {
    if (archives.value.length === 0) return false
    const manageable = archives.value.filter(() => canManage.value)
    return manageable.length > 0 && manageable.every((f: any) => selectedFileIds.value.includes(f.id))
  },
  set: (val) => {
    if (val && canManage.value) selectedFileIds.value = archives.value.map((f: any) => f.id)
    else selectedFileIds.value = []
  }
})

const toggleSelection = (id: number) => {
  if (selectedFileIds.value.includes(id)) selectedFileIds.value = selectedFileIds.value.filter(i => i !== id)
  else selectedFileIds.value.push(id)
}

// --- LOGIC: SELECT ALL FOR SHARING ---

// 1. Logic Select All untuk Share File
const isAllFileUsersSelected = computed(() => {
  return allUsers.value.length > 0 && shareFileUserIds.value.length === allUsers.value.length
})

const toggleAllFileUsers = () => {
  if (isAllFileUsersSelected.value) {
    shareFileUserIds.value = [] // Unselect All
  } else {
    shareFileUserIds.value = allUsers.value.map(u => u.id) // Select All
  }
}

// 2. Logic Select All untuk Share Folder
const isAllFolderUsersSelected = computed(() => {
  return allUsers.value.length > 0 && shareFolderUserIds.value.length === allUsers.value.length
})

const toggleAllFolderUsers = () => {
  if (isAllFolderUsersSelected.value) {
    shareFolderUserIds.value = [] // Unselect All
  } else {
    shareFolderUserIds.value = allUsers.value.map(u => u.id) // Select All
  }
}

// --- ACTIONS: CREATE SUB-FOLDER ---
const openCreateFolder = () => {
  showAddDropdown.value = false
  createFolderName.value = ''
  showCreateFolderModal.value = true
}

const handleCreateFolder = async () => {
  if (!createFolderName.value.trim()) return
  startLoading(t('archives.messages.create_process') || 'Membuat Folder...')
  try {
    await $fetch('/api/folders/create', {
      method: 'POST',
      body: {
        name: createFolderName.value,
        parentId: folderId
      }
    })
    await refresh()
    closeModals(); await stopLoading()
    toast.success(t('archives.messages.create_success') || 'Folder berhasil dibuat')
  } catch (e: any) {
    await stopLoading()
    toast.error(t('archives.messages.create_error') || 'Gagal membuat folder')
  }
}

// --- ACTIONS: SUB-FOLDER (EDIT & DELETE) ---
const navigateToFolder = (subId: number) => {
  router.push(`/dashboard/archives/${subId}`)
}

const confirmDeleteSubFolder = (sub: any) => {
  selectedSubFolder.value = sub
  showDeleteSubFolderConfirm.value = true
}

const handleDeleteSubFolder = async () => {
  if (!selectedSubFolder.value) return
  startLoading(t('archives.messages.delete_process') || 'Menghapus...')
  try {
    await $fetch(`/api/folders/${selectedSubFolder.value.id}`, { method: 'DELETE' })
    await refresh()
    closeModals(); await stopLoading()
    toast.success(t('archives.messages.delete_success') || 'Folder berhasil dihapus')
  } catch (e) {
    await stopLoading()
    toast.error(t('archives.messages.delete_error') || 'Gagal menghapus folder')
  }
}

const openRenameSubFolder = (sub: any) => {
  selectedSubFolder.value = sub
  newSubFolderName.value = sub.name
  showRenameSubFolderModal.value = true
}

const handleRenameSubFolder = async () => {
  if (!selectedSubFolder.value || !newSubFolderName.value.trim()) return
  startLoading(t('archives.messages.rename_process') || 'Mengubah nama...')
  try {
    await $fetch(`/api/folders/${selectedSubFolder.value.id}`, { 
      method: 'PUT', 
      body: { name: newSubFolderName.value } 
    })
    await refresh()
    closeModals(); await stopLoading()
    toast.success(t('archives.messages.rename_success') || 'Nama folder berhasil diubah')
  } catch (e) {
    await stopLoading()
    toast.error(t('archives.messages.rename_error') || 'Gagal mengubah nama folder')
  }
}

// --- ACTIONS: MAIN FOLDER (RENAME & DELETE) ---
const openRename = () => { 
  if (!folder.value) return
  newFolderName.value = folder.value.name
  showRenameModal.value = true 
}

const handleRename = async () => {
  if (!newFolderName.value.trim()) return
  startLoading(t('archives.messages.rename_process'))
  try {
    await $fetch(`/api/folders/${folderId}`, { method: 'PUT', body: { name: newFolderName.value } })
    await refresh()
    closeModals(); await stopLoading(); toast.success(t('archives.messages.rename_success'))
  } catch (e) { await stopLoading(); toast.error(t('archives.messages.rename_error')) }
}

const handleDeleteFolder = async () => {
  startLoading(t('archives.messages.delete_process'))
  try {
    await $fetch(`/api/folders/${folderId}`, { method: 'DELETE' })
    await stopLoading(); toast.success(t('archives.messages.delete_success'))
    router.push('/dashboard/archives')
  } catch (e) { await stopLoading(); toast.error(t('archives.messages.delete_error')) }
}

// --- ACTIONS: SHARE FOLDER ---
const openShareFolderModal = async () => {
  if (!canManage.value) return; 
  startLoading(t('common.loading'))
  await fetchAllUsers()
  shareFolderUserIds.value = (folder.value.shares || []).map((s: any) => s.userId)
  await stopLoading()
  showShareFolderModal.value = true
}

const handleShareFolder = async () => {
  if (!folder.value) return
  startLoading(t('archives.messages.share_folder_process'))
  try {
    await $fetch('/api/folders/share', { method: 'POST', body: { folderId: folder.value.id, targetUserIds: shareFolderUserIds.value } })
    await refresh() 
    closeModals(); await stopLoading(); toast.success(t('archives.messages.share_folder_success'))
  } catch (e: any) { await stopLoading(); toast.error(e.data?.message || t('archives.messages.share_folder_error')) }
}

// --- ACTIONS: FILE ACTIONS ---
const openUploadModalTrigger = () => {
  showAddDropdown.value = false
  showUploadModal.value = true
}

const onFileChange = (e: any) => {
  const file = e.target.files[0]
  if (file) {
    uploadForm.value.file = file
    uploadForm.value.title = file.name.substring(0, file.name.lastIndexOf('.')) || file.name 
  } else { 
    uploadForm.value.file = null; 
    uploadForm.value.title = '' 
  }
}

// --- HANDLE UPLOAD LOGIC WITH PROGRESS & CANCEL ---
const handleUpload = async (force: boolean = false) => {
  if (!uploadForm.value.file) return toast.warning(t('archives.messages.upload_error'))

  // 1. Cek Duplikasi (Jika tidak dipaksa/force)
  if (!force) {
    const inputTitle = uploadForm.value.title || uploadForm.value.file.name
    const isDuplicate = archives.value.some((f: any) => {
      return f.title === inputTitle && f.fileSize === uploadForm.value.file?.size
    })

    if (isDuplicate) {
      showDuplicateConfirm.value = true
      return 
    }
  }

  // 2. Persiapan Upload
  isUploading.value = true
  uploadProgress.value = 0
  uploadStats.value = { loaded: 0, total: uploadForm.value.file.size }

  try {
    // LANGKAH 1: Minta Signature
    const { timestamp, signature, apiKey, cloudName } = await $fetch('/api/archives/signature')

    // LANGKAH 2: Upload Langsung ke Cloudinary
    const formData = new FormData()
    formData.append('file', uploadForm.value.file)
    formData.append('api_key', apiKey)
    formData.append('timestamp', timestamp.toString())
    formData.append('signature', signature)
    formData.append('folder', 'sikap_app_archives')

    const xhr = new XMLHttpRequest()
    // Simpan ke ref agar bisa dibatalkan
    xhrRef.value = xhr
    
    const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`
    xhr.open('POST', cloudinaryUrl)

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        uploadProgress.value = (e.loaded / e.total) * 100
        uploadStats.value = { loaded: e.loaded, total: e.total }
      }
    }

    xhr.onload = async () => {
      // Clear ref saat selesai
      xhrRef.value = null
      
      if (xhr.status >= 200 && xhr.status < 300) {
        const response = JSON.parse(xhr.responseText)
        
        // LANGKAH 3: Simpan ke DB
        try {
          await $fetch('/api/archives/upload', {
            method: 'POST',
            body: {
              title: uploadForm.value.title || uploadForm.value.file?.name,
              folderId: folderId,
              fileUrl: response.secure_url,
              fileName: response.original_filename,
              fileSize: response.bytes,
              fileType: response.format || uploadForm.value.file?.type
            }
          })

          await refresh()
          closeModals()
          toast.success(t('archives.messages.upload_success'))
        } catch (dbError: any) {
          console.error("DB Save Error", dbError)
          toast.error("File terupload, namun gagal menyimpan data.")
        }
      } else {
        console.error('Cloudinary Error', xhr.responseText)
        toast.error('Gagal upload ke penyimpanan Cloud.')
      }
      isUploading.value = false
    }

    xhr.onerror = () => {
      xhrRef.value = null
      isUploading.value = false
      toast.error(t('archives.messages.upload_error') || 'Kesalahan jaringan.')
    }

    // Jika dibatalkan user sebelum sempat send (sangat jarang), handle error
    xhr.onabort = () => {
      xhrRef.value = null
      isUploading.value = false
      toast.info('Upload dibatalkan')
    }

    xhr.send(formData)

  } catch (e: any) {
    isUploading.value = false
    xhrRef.value = null
    console.error(e)
    toast.error(e.message || t('archives.messages.upload_error'))
  }
}

// Fungsi Membatalkan Upload
const cancelUpload = () => {
  if (xhrRef.value) {
    xhrRef.value.abort() // Ini akan memicu event onabort di atas
  } else {
    // Fallback jika ref tidak ada tapi state nyangkut
    isUploading.value = false
    uploadProgress.value = 0
  }
}

// Fungsi bantu untuk lanjut upload (dipanggil dari Modal Konfirmasi)
const proceedUpload = () => {
  showDuplicateConfirm.value = false
  handleUpload(true) // Force = true
}

// --- ACTIONS RENAME FILE ---
const openRenameFile = (file: any) => {
  selectedFile.value = file
  newFileName.value = file.title
  showRenameFileModal.value = true
}

const handleRenameFile = async () => {
  if (!selectedFile.value || !newFileName.value.trim()) return
  startLoading(t('archives.messages.rename_file_process'))
  try {
    await $fetch(`/api/archives/${selectedFile.value.id}`, { 
      method: 'PUT', 
      body: { title: newFileName.value } 
    })
    await refresh()
    closeModals()
    await stopLoading()
    toast.success(t('archives.messages.rename_file_success'))
  } catch (e) {
    await stopLoading()
    toast.error(t('archives.messages.rename_file_error'))
  }
}

const confirmDeleteFile = (file: any) => { selectedFile.value = file; showDeleteFileConfirm.value = true }
const handleDeleteFile = async () => {
  if (!selectedFile.value) return
  startLoading(t('archives.messages.delete_file_process'))
  try {
    await $fetch(`/api/archives/${selectedFile.value.id}`, { method: 'DELETE' })
    await refresh()
    closeModals(); await stopLoading(); toast.success(t('archives.messages.delete_file_success'))
  } catch (e) { await stopLoading(); toast.error(t('archives.messages.delete_file_error')) }
}

const openShareFileModal = async (file: any) => {
  if (!canManage.value) return; 
  startLoading(t('common.loading'))
  await fetchAllUsers()
  selectedFile.value = file
  shareFileUserIds.value = (file.fileShares || []).map((s: any) => s.userId)
  await stopLoading()
  showShareFileModal.value = true
}

const handleShareFile = async () => {
  if (!selectedFile.value) return
  startLoading(t('archives.messages.share_file_process'))
  try {
    await $fetch('/api/archives/share', { method: 'POST', body: { archiveId: selectedFile.value.id, targetUserIds: shareFileUserIds.value } })
    await refresh() 
    closeModals(); await stopLoading(); toast.success(t('archives.messages.share_file_success'))
  } catch (e: any) { await stopLoading(); toast.error(e.data?.message || t('archives.messages.share_file_error')) }
}

const handleBulkDelete = async () => {
  if (selectedFileIds.value.length === 0) return
  startLoading(t('archives.messages.bulk_delete_process', { count: selectedFileIds.value.length }))
  try {
    await $fetch('/api/archives/bulk-delete', { method: 'POST', body: { ids: selectedFileIds.value } })
    await refresh(); selectedFileIds.value = []; closeModals(); await stopLoading(); toast.success(t('archives.messages.bulk_delete_success'))
  } catch (e: any) { await stopLoading(); toast.error(e.data?.message || t('archives.messages.bulk_delete_error')) }
}

// --- HELPER ---
const closeModals = () => {
  // Jika sedang upload, jangan tutup modal upload sembarangan kecuali dibatalkan lewat tombol
  // Tapi jika user klik background (ini dipanggil), kita cek:
  if (isUploading.value && showUploadModal.value) {
      // Opsional: Bisa blokir penutupan, atau otomatis batalkan.
      // Di sini kita biarkan terbuka (return) agar tidak ter-cancel tidak sengaja
      return 
  }

  showAddDropdown.value = false; showCreateFolderModal.value = false; showUploadModal.value = false
  showRenameModal.value = false; showRenameSubFolderModal.value = false
  showRenameFileModal.value = false; 
  showDeleteFolderConfirm.value = false; showDeleteSubFolderConfirm.value = false
  showDeleteFileConfirm.value = false; showShareFileModal.value = false; showShareFolderModal.value = false
  showBulkDeleteConfirm.value = false
  showDuplicateConfirm.value = false
  
  // Reset states
  createFolderName.value = ''; newFolderName.value = ''; newSubFolderName.value = ''
  newFileName.value = '' 
  selectedFile.value = null; selectedSubFolder.value = null
  shareFileUserIds.value = []; shareFolderUserIds.value = []
  
  // Reset Upload states
  isUploading.value = false
  uploadProgress.value = 0
  
  if (!showDuplicateConfirm.value && !showUploadModal.value) {
      uploadForm.value = { file: null, title: '' }
  }
}
const getDownloadUrl = (path: string) => path
</script>

<template>
  <div v-if="folder" class="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:from-gray-950 dark:via-gray-900 dark:to-blue-950/20 py-6 px-4 sm:px-6 lg:px-8">
    
    <div 
      class="max-w-6xl mx-auto transition-all duration-700 ease-out"
      :class="isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'"
    >
      
      <NuxtLink to="/dashboard/archives" class="text-xs sm:text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-2 mb-4 sm:mb-6 transition-all duration-300 hover:-translate-x-1 font-medium">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
        {{ $t('common.back') }}
      </NuxtLink>
      
      <div class="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 sm:gap-6 animate-soft-slide-down" style="animation-delay: 100ms;">
        <div class="flex items-center gap-3 sm:gap-4">
          <div class="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl shadow-lg flex items-center justify-center transform transition-all duration-300 hover:scale-105">
            <svg class="w-7 h-7 sm:w-8 sm:h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.5 21a3 3 0 0 0 3-3v-4.5a3 3 0 0 0-3-3h-15a3 3 0 0 0-3 3V18a3 3 0 0 0 3 3h15ZM1.5 10.146V6a3 3 0 0 1 3-3h5.379a2.25 2.25 0 0 1 1.59.659l2.122 2.121c.14.141.331.22.53.22H19.5a3 3 0 0 1 3 3v1.146A4.483 4.483 0 0 0 19.5 9h-15a4.483 4.483 0 0 0-3 1.146Z"/>
            </svg>
          </div>
          <div>
            <div class="flex items-center gap-2 sm:gap-3">
              <h1 class="text-2xl sm:text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400">
                {{ folder.name }}
              </h1>
              <span v-if="!canManage" class="px-2 py-0.5 sm:px-3 sm:py-1 bg-blue-100/80 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-full text-[10px] sm:text-xs font-semibold backdrop-blur-sm">{{ $t('common.shared') }}</span>
            </div>
            <div class="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-gray-600 dark:text-gray-400 mt-1.5">
              <span class="flex items-center gap-1 bg-white/60 dark:bg-gray-800/60 px-2 py-1 rounded-lg backdrop-blur-sm">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                {{ folder.user?.name || $t('common.unknown') }}
              </span>
              <span class="flex items-center gap-1 bg-white/60 dark:bg-gray-800/60 px-2 py-1 rounded-lg backdrop-blur-sm">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                {{ childrenFolders.length }} Folder, {{ folder._count?.archives || 0 }} File
              </span>
            </div>
          </div>
        </div>

        <div class="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto mt-2 lg:mt-0">
          
          <transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0 scale-90" enter-to-class="opacity-100 scale-100" leave-active-class="transition duration-150 ease-in" leave-from-class="opacity-100 scale-100" leave-to-class="opacity-0 scale-90">
            <button 
              v-if="selectedFileIds.length > 0"
              @click="showBulkDeleteConfirm = true"
              class="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all text-sm font-medium w-full sm:w-auto"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              {{ $t('common.delete') }} ({{ selectedFileIds.length }})
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

          <div v-if="canManage" class="flex items-center gap-2 w-full sm:w-auto">
            
            <div class="relative add-dropdown-container w-full sm:w-auto">
                <button 
                  @click="showAddDropdown = !showAddDropdown"
                  class="group relative overflow-hidden bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-medium px-4 py-2 sm:px-6 sm:py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 text-sm w-full sm:w-auto cursor-pointer"
                >
                  <svg class="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
                  {{ $t('common.add') }}
                  <svg class="w-4 h-4 ml-1 transition-transform duration-200" :class="showAddDropdown ? 'rotate-180' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
                </button>

                <transition enter-active-class="transition ease-out duration-200" enter-from-class="transform opacity-0 scale-95 translate-y-2" enter-to-class="transform opacity-100 scale-100 translate-y-0" leave-active-class="transition ease-in duration-150" leave-from-class="transform opacity-100 scale-100 translate-y-0" leave-to-class="transform opacity-0 scale-95 translate-y-2">
                  <div v-if="showAddDropdown" class="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden ring-1 ring-black ring-opacity-5 z-50">
                    <button @click="openCreateFolder" class="w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors">
                      <span class="p-1.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 rounded-lg"><svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/></svg></span>
                      {{ $t('archives.modal.create_btn') }}
                    </button>
                    <div class="border-t border-gray-100 dark:border-gray-700"></div>
                    <button @click="openUploadModalTrigger" class="w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors">
                      <span class="p-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-lg"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg></span>
                      {{ $t('common.upload') }}
                    </button>
                  </div>
                </transition>
            </div>

            <div class="flex bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border border-blue-100 dark:border-gray-800/50 rounded-xl shadow-md overflow-hidden flex-1 sm:flex-none justify-center">
              <button @click="openShareFolderModal" class="px-3 py-2.5 text-gray-600 dark:text-gray-300 hover:bg-blue-500/10 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300 hover:scale-110" :title="$t('common.share')">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.102 1.101" /></svg>
              </button>
              <button @click="openRename" class="px-3 py-2.5 text-gray-600 dark:text-gray-300 hover:bg-amber-500/10 dark:hover:bg-amber-900/20 hover:text-amber-600 dark:hover:text-amber-400 transition-all duration-300 hover:scale-110 border-l border-blue-100 dark:border-gray-800/50" :title="$t('archives.modal.rename_title')">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
              </button>
              <button @click="showDeleteFolderConfirm = true" class="px-3 py-2.5 text-gray-600 dark:text-gray-300 hover:bg-red-500/10 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-all duration-300 hover:scale-110 border-l border-blue-100 dark:border-gray-800/50" :title="$t('archives.modal.delete_title')">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2.5 2.5 0 0116.138 21H7.862a2.5 2.5 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1H9a1 1 0 00-1 1v3M4 7h16"/></svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white/80 dark:bg-gray-900/80 backdrop-blur-2xl rounded-2xl shadow-xl border border-blue-100 dark:border-gray-800/50 overflow-hidden flex flex-col animate-soft-slide-up" style="animation-delay: 200ms;">
        <div class="overflow-x-auto flex-1">
          <table class="min-w-full divide-y divide-blue-50 dark:divide-gray-800">
            <thead>
              <tr class="bg-gradient-to-r from-blue-600/5 to-cyan-500/5 dark:from-blue-500/10 dark:to-cyan-500/10 text-gray-600 dark:text-gray-300 uppercase text-xs font-bold">
                <th v-if="canManage" class="px-6 py-4 w-10 text-center">
                   <input type="checkbox" v-model="isAllSelected" class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600" />
                </th>
                <th class="px-6 py-4 text-left">{{ $t('archives.table.name') }}</th>
                <th class="px-6 py-4 text-left">{{ $t('archives.table.uploader') }}</th>
                <th class="px-6 py-4 text-left">{{ $t('archives.table.size') }}</th>
                <th class="px-6 py-4 text-center">{{ $t('archives.table.action') }}</th>
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

              <tr v-else-if="archives.length === 0 && childrenFolders.length === 0">
                <td :colspan="canManage ? 5 : 4" class="px-6 py-16 text-center text-gray-500 dark:text-gray-400">
                  <div class="w-14 h-14 mx-auto mb-3 opacity-50 animate-pulse bg-blue-50 dark:bg-gray-800 rounded-full flex items-center justify-center">
                    <svg class="w-7 h-7 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 7h18M3 12h18M3 17h18"/></svg>
                  </div>
                  <p class="text-sm font-medium">{{ search ? $t('archives.table.empty_search') : $t('archives.table.empty_folder') }}</p>
                </td>
              </tr>
              
              <tr v-for="sub in childrenFolders" :key="'sub-'+sub.id" class="hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-all duration-300 group">
                <td v-if="canManage" class="px-6 py-4 text-center"><span class="block w-4 h-4"></span></td>

                <td class="px-6 py-4">
                  <button @click="navigateToFolder(sub.id)" class="flex items-center gap-3 group-hover:translate-x-1 transition-transform duration-200 text-left w-full">
                    <div class="w-9 h-9 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center text-yellow-600 dark:text-yellow-500 shrink-0 shadow-sm border border-yellow-200 dark:border-yellow-800/30">
                      <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/></svg>
                    </div>
                    <div>
                      <p class="font-bold text-gray-800 dark:text-gray-200 text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{{ sub.name }}</p>
                      <p class="text-[10px] text-gray-500 dark:text-gray-400">Sub-folder</p>
                    </div>
                  </button>
                </td>
                
                <td class="px-6 py-4">
                  <div class="flex items-center gap-2">
                    <div class="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-[10px] font-bold flex items-center justify-center">
                      {{ sub.user?.name?.charAt(0).toUpperCase() || '?' }}
                    </div>
                    <div><p class="text-xs font-medium text-gray-700 dark:text-gray-300">{{ sub.user?.name }}</p></div>
                  </div>
                </td>

                <td class="px-6 py-4">
                  <span class="inline-flex px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700">{{ sub._count?.archives || 0 }} {{ $t('archives.items') }}</span>
                </td>
                
                <td class="px-6 py-4 text-center">
                  <div v-if="canManage" class="flex justify-center gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button @click="openRenameSubFolder(sub)" class="p-2 bg-amber-50 hover:bg-amber-100 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400 dark:hover:bg-amber-900/40 rounded-lg transition-all hover:scale-110 shadow-sm border border-amber-100 dark:border-amber-800/30" :title="$t('common.edit')">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                    </button>
                    <button @click="confirmDeleteSubFolder(sub)" class="p-2 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40 rounded-lg transition-all hover:scale-110 shadow-sm border border-red-100 dark:border-red-800/30" :title="$t('common.delete')">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2.5 2.5 0 0116.138 21H7.862a2.5 2.5 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1H9a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </td>
              </tr>

              <tr v-for="file in archives" :key="'file-'+file.id" class="hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-all duration-300 group">
                <td v-if="canManage" class="px-6 py-4 text-center">
                   <input type="checkbox" :checked="selectedFileIds.includes(file.id)" @change="toggleSelection(file.id)" class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600" />
                </td>

                <td class="px-6 py-4">
                  <div class="flex items-center gap-3 group-hover:translate-x-1 transition-transform duration-200">
                    <div class="w-9 h-9 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-lg shadow-sm flex items-center justify-center text-white shrink-0">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                    </div>
                    <div>
                      <p class="font-semibold text-gray-900 dark:text-white text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{{ file.title }}</p>
                      <p class="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wide">{{ file.fileType }}</p>
                    </div>
                  </div>
                </td>
                
                <td class="px-6 py-4">
                  <div class="flex items-center gap-2">
                    <div class="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 text-white text-[10px] font-bold flex items-center justify-center shadow-sm">
                      {{ file.uploader?.name?.charAt(0).toUpperCase() || 'U' }}
                    </div>
                    <div>
                      <p class="text-xs font-medium text-gray-700 dark:text-gray-300">{{ file.uploader?.name }}</p>
                      <p class="text-[10px] text-gray-500 dark:text-gray-400">{{ new Date(file.createdAt).toLocaleDateString('id-ID') }}</p>
                    </div>
                  </div>
                </td>

                <td class="px-6 py-4">
                  <span class="inline-flex px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                    {{ (file.fileSize / 1024).toFixed(0) }} KB
                  </span>
                </td>
                
                <td class="px-6 py-4 text-center">
                  <div class="flex justify-center gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                    <a :href="getDownloadUrl(file.filePath)" target="_blank" download class="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 dark:hover:bg-emerald-900/40 rounded-lg transition-all hover:scale-110 shadow-sm border border-emerald-100 dark:border-emerald-800/30" :title="$t('common.download')">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    </a>
                    
                    <template v-if="canManage">
                      <button @click="openRenameFile(file)" class="p-2 bg-amber-50 hover:bg-amber-100 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400 dark:hover:bg-amber-900/40 rounded-lg transition-all hover:scale-110 shadow-sm border border-amber-100 dark:border-amber-800/30" :title="$t('common.edit')">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                      </button>

                      <button @click="openShareFileModal(file)" class="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/40 rounded-lg transition-all hover:scale-110 shadow-sm border border-blue-100 dark:border-blue-800/30" :title="$t('common.share')">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.102 1.101" /></svg>
                      </button>
                      <button @click="confirmDeleteFile(file)" class="p-2 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40 rounded-lg transition-all hover:scale-110 shadow-sm border border-red-100 dark:border-red-800/30" :title="$t('common.delete')">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2.5 2.5 0 0116.138 21H7.862a2.5 2.5 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1H9a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </template>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="meta.totalPages > 1" class="px-6 py-4 border-t border-blue-100 dark:border-gray-700/50 flex flex-col sm:flex-row justify-between items-center gap-4 bg-blue-50/30 dark:bg-gray-800/30">
          <span class="text-xs text-gray-500 dark:text-gray-400 font-medium">
            {{ $t('archives.pagination.showing', { start: (meta.page - 1) * limit + 1, end: Math.min(meta.page * limit, meta.total), total: meta.total }) }}
          </span>
          <div class="flex items-center gap-2">
            <button @click="changePage(meta.page - 1)" :disabled="meta.page === 1" class="p-2 rounded-lg border border-blue-200 dark:border-gray-600 hover:bg-blue-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-600 dark:text-gray-300">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
            </button>
            <span class="text-xs font-semibold text-gray-700 dark:text-gray-300 mx-2">{{ $t('archives.pagination.page', { current: meta.page, total: meta.totalPages }) }}</span>
            <button @click="changePage(meta.page + 1)" :disabled="meta.page === meta.totalPages" class="p-2 rounded-lg border border-blue-200 dark:border-gray-600 hover:bg-blue-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-600 dark:text-gray-300">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <Transition enter-active-class="transition duration-400 cubic-bezier(0.16, 1, 0.3, 1)" enter-from-class="opacity-0 scale-95 translate-y-8" enter-to-class="opacity-100 scale-100 translate-y-0" leave-active-class="transition duration-300 ease-in" leave-from-class="opacity-100 scale-100 translate-y-0" leave-to-class="opacity-0 scale-95 translate-y-8">
      <div v-if="showCreateFolderModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div class="bg-white dark:bg-gray-900 rounded-[1.5rem] shadow-2xl border border-gray-100 dark:border-gray-800 w-full max-w-sm sm:max-w-md p-6 relative pointer-events-auto overflow-hidden">
          <div class="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-yellow-500 to-amber-500"></div>
          <h3 class="text-lg font-bold mb-5 text-gray-900 dark:text-white">{{ $t('archives.modal.create_title') }}</h3>
          <input v-model="createFolderName" type="text" :placeholder="$t('archives.modal.folder_name_placeholder')" class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500/40 transition-all text-sm" autoFocus @keyup.enter="handleCreateFolder" />
          <div class="flex gap-3 mt-6">
            <button @click="closeModals" class="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition text-xs font-medium">{{ $t('common.cancel') }}</button>
            <button @click="handleCreateFolder" class="flex-1 py-2.5 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-white rounded-lg shadow-md transition text-xs font-medium">{{ $t('common.add') }}</button>
          </div>
        </div>
      </div>
    </Transition>

    <Transition enter-active-class="transition duration-400 cubic-bezier(0.16, 1, 0.3, 1)" enter-from-class="opacity-0 scale-95 translate-y-8" enter-to-class="opacity-100 scale-100 translate-y-0" leave-active-class="transition duration-300 ease-in" leave-from-class="opacity-100 scale-100 translate-y-0" leave-to-class="opacity-0 scale-95 translate-y-8">
      <div v-if="showRenameSubFolderModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div class="bg-white dark:bg-gray-900 rounded-[1.5rem] shadow-2xl border border-gray-100 dark:border-gray-800 w-full max-w-sm sm:max-w-md p-6 relative pointer-events-auto overflow-hidden">
          <div class="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-amber-500 to-orange-500"></div>
          <h3 class="text-lg font-bold mb-5 text-gray-900 dark:text-white">{{ $t('archives.modal.rename_title') }}</h3>
          <input v-model="newSubFolderName" type="text" class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/40 transition-all text-sm" autoFocus @keyup.enter="handleRenameSubFolder"/>
          <div class="flex gap-3 mt-6">
            <button @click="closeModals" class="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition text-xs font-medium">{{ $t('common.cancel') }}</button>
            <button @click="handleRenameSubFolder" class="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-lg shadow-md transition text-xs font-medium">{{ $t('common.save') }}</button>
          </div>
        </div>
      </div>
    </Transition>

    <Transition enter-active-class="transition duration-400 cubic-bezier(0.16, 1, 0.3, 1)" enter-from-class="opacity-0 scale-95 translate-y-8" enter-to-class="opacity-100 scale-100 translate-y-0" leave-active-class="transition duration-300 ease-in" leave-from-class="opacity-100 scale-100 translate-y-0" leave-to-class="opacity-0 scale-95 translate-y-8">
      <div v-if="showRenameFileModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div class="bg-white dark:bg-gray-900 rounded-[1.5rem] shadow-2xl border border-gray-100 dark:border-gray-800 w-full max-w-sm sm:max-w-md p-6 relative pointer-events-auto overflow-hidden">
          <div class="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-amber-500 to-orange-500"></div>
          <h3 class="text-lg font-bold mb-5 text-gray-900 dark:text-white">{{ $t('archives.modal.rename_file_title') }}</h3>
          <input v-model="newFileName" type="text" class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/40 transition-all text-sm" autoFocus @keyup.enter="handleRenameFile"/>
          <div class="flex gap-3 mt-6">
            <button @click="closeModals" class="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition text-xs font-medium">{{ $t('common.cancel') }}</button>
            <button @click="handleRenameFile" class="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-lg shadow-md transition text-xs font-medium">{{ $t('common.save') }}</button>
          </div>
        </div>
      </div>
    </Transition>

    <Transition enter-active-class="transition duration-400 cubic-bezier(0.16, 1, 0.3, 1)" enter-from-class="opacity-0 scale-95 translate-y-8" enter-to-class="opacity-100 scale-100 translate-y-0" leave-active-class="transition duration-300 ease-in" leave-from-class="opacity-100 scale-100 translate-y-0" leave-to-class="opacity-0 scale-95 translate-y-8">
      <div v-if="showDeleteSubFolderConfirm" class="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div class="bg-white dark:bg-gray-900 rounded-[1.5rem] shadow-2xl border border-gray-100 dark:border-gray-800 max-w-xs sm:max-w-sm w-full p-6 text-center relative pointer-events-auto overflow-hidden">
          <div class="absolute top-0 left-0 w-full h-1.5 bg-red-500"></div>
          <div class="w-14 h-14 mx-auto mb-4 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center text-2xl text-red-600">🗑️</div>
          <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-2">{{ $t('archives.modal.delete_title') }}</h3>
          <p class="text-xs text-gray-500 mb-6">Folder <strong class="text-red-600">{{ selectedSubFolder?.name }}</strong> {{ $t('archives.modal.delete_desc') }}</p>
          <div class="flex gap-3">
            <button @click="closeModals" class="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition text-xs font-medium">{{ $t('common.cancel') }}</button>
            <button @click="handleDeleteSubFolder" class="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-md transition text-xs font-medium">{{ $t('common.delete') }}</button>
          </div>
        </div>
      </div>
    </Transition>

    <Transition enter-active-class="transition duration-400 cubic-bezier(0.16, 1, 0.3, 1)" enter-from-class="opacity-0 scale-95 translate-y-8" enter-to-class="opacity-100 scale-100 translate-y-0" leave-active-class="transition duration-300 ease-in" leave-from-class="opacity-100 scale-100 translate-y-0" leave-to-class="opacity-0 scale-95 translate-y-8">
      <div v-if="showUploadModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div class="bg-white dark:bg-gray-900 rounded-[1.5rem] shadow-2xl border border-gray-100 dark:border-gray-800 w-full max-w-sm sm:max-w-md p-6 relative pointer-events-auto overflow-hidden">
          <div class="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 to-cyan-500"></div>
          <div class="flex justify-between items-center mb-5">
            <h3 class="text-lg font-bold text-gray-900 dark:text-white">{{ $t('archives.modal.upload_title') }}</h3>
            <button v-if="!isUploading" @click="showUploadModal = false" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg></button>
          </div>
          
          <form v-if="!isUploading" @submit.prevent="handleUpload(false)" class="space-y-4">
            <div>
              <label class="block text-xs font-semibold mb-1.5 text-gray-600 dark:text-gray-300 uppercase">{{ $t('archives.modal.file_label') }}</label>
              <div class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 text-center hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition relative cursor-pointer">
                <input type="file" @change="onFileChange" required class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"/>
                <div v-if="!uploadForm.file" class="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">{{ $t('archives.modal.file_placeholder') }}</div>
                <div v-else class="flex flex-col items-center">
                  <svg class="w-6 h-6 text-green-500 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5h6a2 2 0 012 2v10a2 2 0 01-2 2H9a2 2 0 01-2-2V7a2 2 0 012-2z"/></svg>
                  <span class="text-green-600 dark:text-green-400 text-xs font-medium truncate max-w-[200px]">{{ uploadForm.file.name }}</span>
                  <p class="text-[10px] text-gray-400 mt-0.5">{{ (uploadForm.file.size / 1024).toFixed(1) }} KB</p>
                </div>
              </div>
            </div>
            <div>
              <label class="block text-xs font-semibold mb-1.5 text-gray-600 dark:text-gray-300 uppercase">{{ $t('archives.modal.title_label') }}</label>
              <input v-model="uploadForm.title" type="text" class="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/40 text-sm" :placeholder="$t('archives.modal.title_placeholder')" />
            </div>
            <div class="flex gap-2 sm:gap-3 mt-4 sm:mt-6">
              <button type="button" @click="closeModals" class="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition text-xs font-medium">{{ $t('common.cancel') }}</button>
              <button type="submit" class="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-lg shadow-md transition text-xs font-medium">{{ $t('common.upload') }}</button>
            </div>
          </form>

          <div v-else class="py-6 text-center space-y-4">
            <div class="relative w-20 h-20 mx-auto">
              <svg class="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path class="text-gray-200 dark:text-gray-700" stroke-width="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <path class="text-blue-600 transition-all duration-300 ease-out" stroke-dasharray="100, 100" :stroke-dashoffset="100 - uploadProgress" stroke-width="3" stroke-linecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              </svg>
              <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-sm font-bold text-gray-700 dark:text-gray-200">
                {{ Math.round(uploadProgress) }}%
              </div>
            </div>
            <div>
              <h4 class="text-sm font-bold text-gray-900 dark:text-white mb-1">{{ $t('archives.messages.upload_process') }}</h4>
              <p class="text-xs text-gray-500 dark:text-gray-400">
                {{ formatSize(uploadStats.loaded) }} / {{ formatSize(uploadStats.total) }}
              </p>
            </div>
            <button 
              @click="cancelUpload"
              class="mt-2 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 text-xs font-semibold rounded-lg transition-colors"
            >
              Batalkan
            </button>
          </div>

        </div>
      </div>
    </Transition>

    <Transition enter-active-class="transition duration-400 cubic-bezier(0.16, 1, 0.3, 1)" enter-from-class="opacity-0 scale-95 translate-y-8" enter-to-class="opacity-100 scale-100 translate-y-0" leave-active-class="transition duration-300 ease-in" leave-from-class="opacity-100 scale-100 translate-y-0" leave-to-class="opacity-0 scale-95 translate-y-8">
      <div v-if="showDuplicateConfirm" class="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div class="bg-white dark:bg-gray-900 rounded-[1.5rem] shadow-2xl border border-gray-100 dark:border-gray-800 max-w-xs sm:max-w-sm w-full p-6 text-center relative pointer-events-auto overflow-hidden">
          <div class="absolute top-0 left-0 w-full h-1.5 bg-yellow-500"></div>
          <div class="w-14 h-14 mx-auto mb-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-full flex items-center justify-center text-2xl text-yellow-600">⚠️</div>
          <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-2">{{ $t('archives.modal.duplicate_title') }}</h3>
          <p class="text-xs text-gray-500 mb-6">{{ $t('archives.modal.duplicate_desc') }}</p>
          <div class="flex gap-3">
            <button @click="closeModals" class="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition text-xs font-medium">{{ $t('common.cancel') }}</button>
            <button @click="proceedUpload" class="flex-1 py-2.5 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg shadow-md transition text-xs font-medium">{{ $t('common.keep_save') }}</button>
          </div>
        </div>
      </div>
    </Transition>

    <Transition enter-active-class="transition duration-400 cubic-bezier(0.16, 1, 0.3, 1)" enter-from-class="opacity-0 scale-95 translate-y-8" enter-to-class="opacity-100 scale-100 translate-y-0" leave-active-class="transition duration-300 ease-in" leave-from-class="opacity-100 scale-100 translate-y-0" leave-to-class="opacity-0 scale-95 translate-y-8">
      <div v-if="showRenameModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div class="bg-white dark:bg-gray-900 rounded-[1.5rem] shadow-2xl border border-gray-100 dark:border-gray-800 w-full max-w-sm sm:max-w-md p-6 relative pointer-events-auto overflow-hidden">
          <div class="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-amber-500 to-orange-500"></div>
          <h3 class="text-lg font-bold mb-5 text-gray-900 dark:text-white">{{ $t('archives.modal.rename_title') }}</h3>
          <input v-model="newFolderName" type="text" class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/40 transition-all text-sm" autoFocus />
          <div class="flex gap-3 mt-6">
            <button @click="closeModals" class="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition text-xs font-medium">{{ $t('common.cancel') }}</button>
            <button @click="handleRename" class="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-lg shadow-md transition text-xs font-medium">{{ $t('common.save') }}</button>
          </div>
        </div>
      </div>
    </Transition>

    <Transition enter-active-class="transition duration-400 cubic-bezier(0.16, 1, 0.3, 1)" enter-from-class="opacity-0 scale-95 translate-y-8" enter-to-class="opacity-100 scale-100 translate-y-0" leave-active-class="transition duration-300 ease-in" leave-from-class="opacity-100 scale-100 translate-y-0" leave-to-class="opacity-0 scale-95 translate-y-8">
      <div v-if="showDeleteFolderConfirm" class="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div class="bg-white dark:bg-gray-900 rounded-[1.5rem] shadow-2xl border border-gray-100 dark:border-gray-800 max-w-xs sm:max-w-sm w-full p-6 text-center relative pointer-events-auto overflow-hidden">
          <div class="absolute top-0 left-0 w-full h-1.5 bg-red-500"></div>
          <div class="w-14 h-14 mx-auto mb-4 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center text-2xl text-red-600">🗑️</div>
          <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-2">{{ $t('archives.modal.delete_title') }}</h3>
          <p class="text-xs text-gray-500 mb-6">{{ $t('archives.modal.delete_desc') }} <strong class="text-red-600">{{ folder?.name }}</strong></p>
          <div class="flex gap-3">
            <button @click="closeModals" class="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition text-xs font-medium">{{ $t('common.cancel') }}</button>
            <button @click="handleDeleteFolder" class="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-md transition text-xs font-medium">{{ $t('common.delete') }}</button>
          </div>
        </div>
      </div>
    </Transition>

    <Transition enter-active-class="transition duration-400 cubic-bezier(0.16, 1, 0.3, 1)" enter-from-class="opacity-0 scale-95 translate-y-8" enter-to-class="opacity-100 scale-100 translate-y-0" leave-active-class="transition duration-300 ease-in" leave-from-class="opacity-100 scale-100 translate-y-0" leave-to-class="opacity-0 scale-95 translate-y-8">
      <div v-if="showDeleteFileConfirm" class="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div class="bg-white dark:bg-gray-900 rounded-[1.5rem] shadow-2xl border border-gray-100 dark:border-gray-800 max-w-xs sm:max-w-sm w-full p-6 text-center relative pointer-events-auto overflow-hidden">
          <div class="absolute top-0 left-0 w-full h-1.5 bg-red-500"></div>
          <div class="w-14 h-14 mx-auto mb-4 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center text-2xl text-red-600">📄</div>
          <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-2">{{ $t('archives.modal.delete_file_title') }}</h3>
          <p class="text-xs text-gray-500 mb-6">{{ $t('archives.modal.delete_file_desc') }} <strong class="text-red-600">{{ selectedFile?.title }}</strong></p>
          <div class="flex gap-3">
            <button @click="closeModals" class="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition text-xs font-medium">{{ $t('common.cancel') }}</button>
            <button @click="handleDeleteFile" class="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-md transition text-xs font-medium">{{ $t('common.delete') }}</button>
          </div>
        </div>
      </div>
    </Transition>

     <Transition enter-active-class="transition duration-400 cubic-bezier(0.16, 1, 0.3, 1)" enter-from-class="opacity-0 scale-95 translate-y-8" enter-to-class="opacity-100 scale-100 translate-y-0" leave-active-class="transition duration-300 ease-in" leave-from-class="opacity-100 scale-100 translate-y-0" leave-to-class="opacity-0 scale-95 translate-y-8">
      <div v-if="showBulkDeleteConfirm" class="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div class="bg-white dark:bg-gray-900 rounded-[1.5rem] shadow-2xl border border-gray-100 dark:border-gray-800 max-w-xs sm:max-w-sm w-full p-6 text-center relative pointer-events-auto overflow-hidden">
          <div class="absolute top-0 left-0 w-full h-1.5 bg-red-600"></div>
          <div class="w-14 h-14 mx-auto mb-4 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center text-2xl text-red-600">🗑️</div>
          <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-2">{{ $t('archives.modal.bulk_delete_title', { n: selectedFileIds.length }) }}</h3>
          <p class="text-xs text-gray-500 dark:text-gray-400 mb-6">{{ $t('archives.modal.bulk_delete_desc') }}</p>
          <div class="flex gap-3">
            <button @click="closeModals" class="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800 transition text-xs font-medium">{{ $t('common.cancel') }}</button>
            <button @click="handleBulkDelete" class="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-md transition text-xs font-medium transform hover:-translate-y-0.5">{{ $t('common.delete_all') }}</button>
          </div>
        </div>
      </div>
    </Transition>

    <Transition enter-active-class="transition duration-400 cubic-bezier(0.16, 1, 0.3, 1)" enter-from-class="opacity-0 scale-95 translate-y-8" enter-to-class="opacity-100 scale-100 translate-y-0" leave-active-class="transition duration-300 ease-in" leave-from-class="opacity-100 scale-100 translate-y-0" leave-to-class="opacity-0 scale-95 translate-y-8">
      <div v-if="showShareFileModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div class="bg-white dark:bg-gray-900 rounded-[1.5rem] shadow-2xl border border-gray-100 dark:border-gray-800 w-full max-w-sm sm:max-w-md p-6 flex flex-col max-h-[80vh] relative pointer-events-auto overflow-hidden">
          <div class="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 to-cyan-500"></div>
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-bold text-gray-900 dark:text-white truncate max-w-[80%]">{{ $t('archives.modal.share_file_title', { title: selectedFile?.title }) }}</h3>
            <button @click="showShareFileModal = false" class="text-gray-400 hover:text-gray-600 transition"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg></button>
          </div>
          <p class="text-xs text-gray-500 mb-4">{{ $t('archives.modal.share_file_desc') }}</p>
          
          <div class="flex justify-end mb-2">
            <button 
              @click="toggleAllFileUsers" 
              class="text-xs font-medium text-blue-600 hover:text-blue-800 transition flex items-center gap-1"
            >
              <span v-if="isAllFileUsersSelected">Batal Pilih Semua</span>
              <span v-else>Pilih Semua</span>
            </button>
          </div>

          <div class="flex-1 overflow-y-auto border border-gray-100 dark:border-gray-800 rounded-xl p-2 mb-4 bg-gray-50/50 dark:bg-gray-800/30">
            <div v-if="allUsers.length === 0" class="text-center py-4 text-gray-400 italic text-xs">{{ $t('archives.modal.no_users') }}</div>
            <label v-for="u in allUsers" :key="u.id" class="flex items-center gap-3 p-2.5 hover:bg-white dark:hover:bg-gray-800 rounded-lg cursor-pointer transition border border-transparent hover:border-gray-100 dark:hover:border-gray-700">
              <input type="checkbox" :value="u.id" v-model="shareFileUserIds" class="w-4 h-4 text-blue-600 rounded focus:ring-blue-500/50 border-gray-300">
              <div class="flex items-center gap-2">
                <div class="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 text-white text-[10px] font-bold flex items-center justify-center">{{ u.name.charAt(0).toUpperCase() }}</div>
                <div><div class="text-xs font-medium text-gray-900 dark:text-white">{{ u.name }}</div><div class="text-[10px] text-gray-500 capitalize">{{ u.role || 'user' }}</div></div>
              </div>
            </label>
          </div>
          <div class="flex gap-2">
            <button @click="closeModals" class="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition text-xs font-medium">{{ $t('common.cancel') }}</button>
            <button @click="handleShareFile" class="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-md transition text-xs font-medium">{{ $t('common.save') }}</button>
          </div>
        </div>
      </div>
    </Transition>

    <Transition enter-active-class="transition duration-400 cubic-bezier(0.16, 1, 0.3, 1)" enter-from-class="opacity-0 scale-95 translate-y-8" enter-to-class="opacity-100 scale-100 translate-y-0" leave-active-class="transition duration-300 ease-in" leave-from-class="opacity-100 scale-100 translate-y-0" leave-to-class="opacity-0 scale-95 translate-y-8">
      <div v-if="showShareFolderModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div class="bg-white dark:bg-gray-900 rounded-[1.5rem] shadow-2xl border border-gray-100 dark:border-gray-800 w-full max-w-sm sm:max-w-md p-6 flex flex-col max-h-[80vh] relative pointer-events-auto overflow-hidden">
          <div class="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 to-cyan-500"></div>
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-bold text-gray-900 dark:text-white truncate max-w-[80%]">{{ $t('archives.modal.share_folder_title', { name: folder?.name }) }}</h3>
            <button @click="showShareFolderModal = false" class="text-gray-400 hover:text-gray-600 transition"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg></button>
          </div>
          <p class="text-xs text-gray-500 mb-4">{{ $t('archives.modal.share_folder_desc') }}</p>
          
          <div class="flex justify-end mb-2">
            <button 
              @click="toggleAllFolderUsers" 
              class="text-xs font-medium text-blue-600 hover:text-blue-800 transition flex items-center gap-1"
            >
              <span v-if="isAllFolderUsersSelected">Batal Pilih Semua</span>
              <span v-else>Pilih Semua</span>
            </button>
          </div>

          <div class="flex-1 overflow-y-auto border border-gray-100 dark:border-gray-800 rounded-xl p-2 mb-4 bg-gray-50/50 dark:bg-gray-800/30">
            <div v-if="allUsers.length === 0" class="text-center py-4 text-gray-400 italic text-xs">{{ $t('archives.modal.no_users') }}</div>
            <label v-for="u in allUsers" :key="u.id" class="flex items-center gap-3 p-2.5 hover:bg-white dark:hover:bg-gray-800 rounded-lg cursor-pointer transition border border-transparent hover:border-gray-100 dark:hover:border-gray-700">
              <input type="checkbox" :value="u.id" v-model="shareFolderUserIds" class="w-4 h-4 text-blue-600 rounded focus:ring-blue-500/50 border-gray-300">
              <div class="flex items-center gap-2">
                <div class="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 text-white text-[10px] font-bold flex items-center justify-center">{{ u.name.charAt(0).toUpperCase() }}</div>
                <div><div class="text-xs font-medium text-gray-900 dark:text-white">{{ u.name }}</div><div class="text-[10px] text-gray-500 capitalize">{{ u.role || 'user' }}</div></div>
              </div>
            </label>
          </div>
          <div class="flex gap-2">
            <button @click="closeModals" class="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition text-xs font-medium">{{ $t('common.cancel') }}</button>
            <button @click="handleShareFolder" class="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-md transition text-xs font-medium">{{ $t('common.save') }}</button>
          </div>
        </div>
      </div>
    </Transition>

    <Transition enter-active-class="transition duration-300 ease-out" enter-from-class="opacity-0" enter-to-class="opacity-100" leave-active-class="transition duration-200 ease-in" leave-from-class="opacity-100" leave-to-class="opacity-0">
      <div v-if="showUploadModal || showRenameModal || showRenameSubFolderModal || showRenameFileModal || showDeleteFolderConfirm || showDeleteSubFolderConfirm || showDeleteFileConfirm || showShareFileModal || showShareFolderModal || showBulkDeleteConfirm || showCreateFolderModal || showDuplicateConfirm" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" @click="closeModals"></div>
    </Transition>

  </div>
</template>

<style scoped>
.animate-soft-slide-down { animation: softSlideDown 0.8s cubic-bezier(0.16, 1, 0.3, 1) backwards; }
.animate-soft-slide-up { animation: softSlideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) backwards; }
@keyframes softSlideDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
@keyframes softSlideUp { from { opacity: 0; transform: translateY(30px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
</style>
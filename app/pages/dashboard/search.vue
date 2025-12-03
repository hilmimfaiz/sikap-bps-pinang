<script setup>
definePageMeta({
  layout: 'dashboard',
  middleware: 'auth'
})

// === STATE ===
const keyword = ref('')
const selectedCategory = ref('')
const isSearching = ref(false)
const searchResults = ref([])
const hasSearched = ref(false) // Untuk menandai apakah user sudah pernah mencari

// === DATA FETCHING ===
// Ambil list kategori untuk dropdown filter
const { data: categories } = await useFetch('/api/categories')

// === SEARCH LOGIC ===
// Gunakan teknik 'Debounce': Search otomatis jalan 500ms setelah user berhenti mengetik
let timeout = null

function handleSearch() {
  clearTimeout(timeout)
  isSearching.value = true
  
  timeout = setTimeout(async () => {
    // Jangan cari jika kosong
    if (!keyword.value.trim() && !selectedCategory.value) {
      searchResults.value = []
      isSearching.value = false
      hasSearched.value = false
      return
    }

    try {
      const data = await $fetch('/api/archives/search', {
        params: {
          q: keyword.value,
          categoryId: selectedCategory.value
        }
      })
      searchResults.value = data
      hasSearched.value = true
    } catch (e) {
      console.error(e)
    } finally {
      isSearching.value = false
    }
  }, 500) // Delay 500ms
}

// Watch perubahan pada keyword atau kategori
watch([keyword, selectedCategory], () => {
  handleSearch()
})

// === HELPER ===
function formatBytes(bytes, decimals = 2) {
  if (!+bytes) return '0 Bytes'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}
</script>

<template>
  <div>
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-gray-800 mb-2">🔍 Pencarian Arsip</h1>
      <p class="text-gray-500 text-sm">Cari dokumen di seluruh folder berdasarkan judul atau kategori.</p>
    </div>

    <div class="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6 flex flex-col md:flex-row gap-4">
      <div class="flex-1 relative">
        <span class="absolute left-3 top-3 text-gray-400">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
        </span>
        <input 
          v-model="keyword"
          type="text" 
          placeholder="Ketik judul dokumen..." 
          class="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
        >
      </div>

      <div class="w-full md:w-64">
        <select v-model="selectedCategory" class="w-full py-2.5 px-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-sky-500 outline-none">
          <option value="">Semua Kategori</option>
          <option v-for="cat in categories" :key="cat.id" :value="cat.id">
            {{ cat.name }}
          </option>
        </select>
      </div>
    </div>

    <div v-if="isSearching" class="text-center py-12">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-sky-600"></div>
      <p class="text-gray-500 mt-2 text-sm">Sedang mencari...</p>
    </div>

    <div v-else-if="hasSearched && searchResults.length === 0" class="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
      <p class="text-gray-500 font-medium">Tidak ditemukan dokumen yang cocok.</p>
      <p class="text-xs text-gray-400 mt-1">Coba gunakan kata kunci lain atau ubah filter kategori.</p>
    </div>

    <div v-else-if="!hasSearched" class="text-center py-12 text-gray-400">
      <svg class="w-16 h-16 mx-auto mb-4 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16l2.879-2.879m0 0a3 3 0 104.243-4.242 3 3 0 00-4.243 4.242zM21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
      <p>Silakan ketik kata kunci untuk mulai mencari.</p>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div 
        v-for="file in searchResults" 
        :key="file.id"
        class="bg-white p-4 rounded-lg shadow-sm border hover:shadow-md transition flex items-start gap-4"
      >
        <div class="flex-shrink-0">
          <svg v-if="file.fileType.includes('pdf')" class="w-10 h-10 text-red-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clip-rule="evenodd"/></svg>
          <svg v-else class="w-10 h-10 text-blue-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clip-rule="evenodd"/></svg>
        </div>

        <div class="flex-1 min-w-0">
          <h4 class="font-semibold text-gray-800 truncate" :title="file.title">
            {{ file.title }}
          </h4>
          
          <div class="text-xs text-gray-500 mt-1 space-y-1">
            <div class="flex items-center gap-1">
              <span class="bg-gray-100 px-1.5 rounded text-gray-600">
                {{ file.category?.name || 'Tanpa Kategori' }}
              </span>
              <span>• {{ formatBytes(file.fileSize) }}</span>
            </div>
            
            <div class="flex items-center gap-1 text-sky-600">
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path></svg>
              <NuxtLink :to="`/dashboard/archives/${file.folderId}`" class="hover:underline truncate">
                / {{ file.folder?.name }}
              </NuxtLink>
            </div>
          </div>
        </div>

        <a :href="file.filePath" download target="_blank" class="text-gray-400 hover:text-sky-600">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
        </a>
      </div>
    </div>

  </div>
</template>
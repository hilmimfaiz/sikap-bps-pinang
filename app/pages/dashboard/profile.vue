<script setup lang="ts">
import { ref, onMounted } from 'vue'

definePageMeta({
  layout: 'dashboard',
  middleware: 'auth'
})

const { startLoading, stopLoading } = useGlobalLoading()
const toast = useToast()
const { t } = useI18n()
const userCookie = useCookie<any>('user_data')

// State
const form = ref({
  name: userCookie.value?.name || '',
  email: userCookie.value?.email || '',
  photoProfile: null as File | null
})

const previewPhoto = ref(userCookie.value?.photoProfile || null)

// UI States
const isVisible = ref(false)
const showPhotoMenu = ref(false) 
const showPhotoPreview = ref(false) 
const fileInputRef = ref<HTMLInputElement | null>(null) 

// Click Outside handling
const photoMenuRef = ref<HTMLElement | null>(null)

// Animation Trigger
onMounted(() => {
  setTimeout(() => {
    isVisible.value = true
  }, 100)
  
  document.addEventListener('click', (e) => {
    if (photoMenuRef.value && !photoMenuRef.value.contains(e.target as Node)) {
      showPhotoMenu.value = false
    }
  })
})

// Actions
const togglePhotoMenu = () => {
  showPhotoMenu.value = !showPhotoMenu.value
}

const openPhotoPreview = () => {
  if (previewPhoto.value) {
    showPhotoPreview.value = true
    showPhotoMenu.value = false
  } else {
    toast.info('Belum ada foto profil')
  }
}

const triggerUpload = () => {
  fileInputRef.value?.click()
  showPhotoMenu.value = false
}

// Handle Photo Change
const onFileChange = (e: any) => {
  const file = e.target.files[0]
  if (file) {
    if (file.size > 2 * 1024 * 1024) {
      toast.warning(t('profile.messages.size_error'))
      return
    }
    form.value.photoProfile = file
    previewPhoto.value = URL.createObjectURL(file)
  }
}

// Update Profile
const handleUpdateProfile = async () => {
  // --- VALIDASI NAMA (NO EMOJI) ---
  // Regex: Hanya Huruf (a-z), Spasi (\s), Titik (.), dan Koma (,)
  const nameRegex = /^[a-zA-Z\s.,]+$/
  if (!nameRegex.test(form.value.name)) {
    toast.warning('Nama hanya boleh berisi huruf, titik, dan koma.')
    return
  }
  // --------------------------------

  startLoading(t('profile.messages.process'))
  
  try {
    const formData = new FormData()
    formData.append('id', userCookie.value.id)
    formData.append('email', form.value.email)
    formData.append('name', form.value.name)

    if (form.value.photoProfile) {
      formData.append('photo', form.value.photoProfile)
    }

    const res: any = await $fetch('/api/profile/update', {
      method: 'PUT',
      body: formData
    })

    userCookie.value = {
      ...userCookie.value,
      name: res.user.name,
      photoProfile: res.user.photoProfile
    }

    await stopLoading()
    toast.success(t('profile.messages.success'))
  } catch (e: any) {
    await stopLoading()
    toast.error(e.data?.message || t('profile.messages.error'))
  }
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:from-gray-950 dark:via-gray-900 dark:to-blue-950/20 py-8 px-4 sm:px-6 lg:px-8">
    
    <div 
      class="max-w-4xl mx-auto transition-all duration-700 ease-out"
      :class="isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'"
    >
      
      <div class="mb-8 text-center sm:text-left animate-soft-slide-down" style="animation-delay: 100ms;">
        <h1 class="text-2xl sm:text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400">
          {{ $t('profile.title') }}
        </h1>
        <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
          {{ $t('profile.subtitle') }}
        </p>
      </div>

      <div class="bg-white/80 dark:bg-gray-900/80 backdrop-blur-2xl rounded-2xl shadow-xl border border-blue-100 dark:border-gray-800/50 overflow-hidden animate-soft-slide-up" style="animation-delay: 200ms;">
        
        <form @submit.prevent="handleUpdateProfile" class="flex flex-col md:flex-row">
          
          <div class="md:w-1/3 p-8 flex flex-col items-center justify-center bg-gradient-to-b from-blue-50/50 to-transparent dark:from-blue-900/10 dark:to-transparent border-b md:border-b-0 md:border-r border-blue-100 dark:border-gray-800/50">
            
            <div class="relative group mb-4" ref="photoMenuRef">
              <div 
                @click="togglePhotoMenu"
                class="w-28 h-28 sm:w-32 sm:h-32 rounded-full p-1 bg-gradient-to-br from-blue-400 to-cyan-400 shadow-lg cursor-pointer transition-transform hover:scale-105 active:scale-95"
              >
                <div class="w-full h-full rounded-full overflow-hidden bg-white dark:bg-gray-800 flex items-center justify-center border-4 border-white dark:border-gray-900 relative">
                  <img 
                    v-if="previewPhoto" 
                    :src="previewPhoto" 
                    class="w-full h-full object-cover" 
                  />
                  <span v-else class="text-4xl font-bold text-blue-500 dark:text-blue-400">
                    {{ form.name.charAt(0).toUpperCase() }}
                  </span>
                  
                  <div class="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  </div>
                </div>
              </div>

              <transition
                enter-active-class="transition ease-out duration-100"
                enter-from-class="transform opacity-0 scale-95"
                enter-to-class="transform opacity-100 scale-100"
                leave-active-class="transition ease-in duration-75"
                leave-from-class="transform opacity-100 scale-100"
                leave-to-class="transform opacity-0 scale-95"
              >
                <div v-if="showPhotoMenu" class="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-40 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden z-20">
                  <button 
                    type="button"
                    @click="openPhotoPreview" 
                    class="w-full px-4 py-2.5 text-xs text-left text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/30 flex items-center gap-2"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    Lihat Foto
                  </button>
                  <button 
                    type="button"
                    @click="triggerUpload" 
                    class="w-full px-4 py-2.5 text-xs text-left text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/30 flex items-center gap-2 border-t border-gray-100 dark:border-gray-700"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    Unggah Foto
                  </button>
                </div>
              </transition>

              <input 
                type="file" 
                ref="fileInputRef" 
                accept="image/*" 
                class="hidden" 
                @change="onFileChange" 
              />
            </div>

            <h3 class="text-lg font-bold text-gray-900 dark:text-white text-center">{{ form.name }}</h3>
            <span class="inline-flex items-center px-2.5 py-0.5 mt-2 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 uppercase tracking-wide">
              {{ userCookie?.role || 'User' }}
            </span>
          </div>

          <div class="md:w-2/3 p-6 sm:p-8">
            <div class="space-y-5">
              <div>
                <label class="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
                  {{ $t('profile.name_label') }}
                </label>
                <div class="relative">
                  <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  </span>
                  <input v-model="form.name" type="text" class="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-blue-100 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all text-sm text-gray-900 dark:text-white" />
                </div>
              </div>

              <div>
                <label class="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
                  {{ $t('profile.email_label') }}
                </label>
                <div class="relative">
                  <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  </span>
                  <input v-model="form.email" type="email" readonly class="w-full pl-10 pr-4 py-2.5 bg-gray-100 dark:bg-gray-800/30 border border-transparent rounded-xl text-gray-500 dark:text-gray-400 cursor-not-allowed text-sm" />
                </div>
                <p class="text-[10px] text-gray-400 mt-1.5 flex items-center gap-1">
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  {{ $t('profile.email_hint') }}
                </p>
              </div>

              <div class="pt-4">
                <button type="submit" class="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 text-sm flex items-center justify-center gap-2">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
                  {{ $t('profile.btn_save') }}
                </button>
              </div>
            </div>
          </div>
        </form>
        
      </div>
    </div>

    <transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div v-if="showPhotoPreview" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm" @click="showPhotoPreview = false">
        <div class="relative max-w-3xl max-h-[90vh]">
          <img :src="previewPhoto" class="max-w-full max-h-[85vh] rounded-lg shadow-2xl object-contain" />
          <button @click="showPhotoPreview = false" class="absolute -top-10 right-0 text-white hover:text-gray-300 transition">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
      </div>
    </transition>

  </div>
</template>

<style scoped>
.animate-soft-slide-down { animation: softSlideDown 0.8s cubic-bezier(0.16, 1, 0.3, 1) backwards; }
.animate-soft-slide-up { animation: softSlideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) backwards; }
@keyframes softSlideDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
@keyframes softSlideUp { from { opacity: 0; transform: translateY(30px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
</style>
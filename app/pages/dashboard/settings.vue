<script setup lang="ts">
import { ref, onMounted } from 'vue'

definePageMeta({
  layout: 'dashboard',
  middleware: 'auth'
})

// 1. Inisialisasi Global Loading, Toast, & i18n
const { startLoading, stopLoading } = useGlobalLoading()
const toast = useToast()
const { t } = useI18n() 
const userCookie = useCookie<any>('user_data')

const form = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// --- STATE VISIBILITAS PASSWORD ---
const showCurrentPassword = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)

// Animation Trigger
const isVisible = ref(false)
onMounted(() => {
  setTimeout(() => {
    isVisible.value = true
  }, 100)
})

// --- ACTION ---
const handleChangePassword = async () => {
  // Validasi Sederhana
  if (form.value.newPassword !== form.value.confirmPassword) {
    return toast.warning(t('settings.messages.mismatch'))
  }
  if (form.value.newPassword.length < 6) {
    return toast.warning(t('settings.messages.min_length'))
  }

  startLoading(t('settings.messages.process'))
  try {
    await $fetch('/api/profile/change-password', {
      method: 'PUT',
      body: {
        id: userCookie.value?.id,
        currentPassword: form.value.currentPassword,
        newPassword: form.value.newPassword
      }
    })

    toast.success(t('settings.messages.success'))
    
    // Reset Form
    form.value = { currentPassword: '', newPassword: '', confirmPassword: '' }
    await stopLoading()

  } catch (e: any) {
    await stopLoading()
    toast.error(e.data?.message || t('settings.messages.error'))
  }
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:from-gray-950 dark:via-gray-900 dark:to-blue-950/20 py-8 px-4 sm:px-6 lg:px-8">
    
    <div 
      class="max-w-2xl mx-auto transition-all duration-700 ease-out"
      :class="isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'"
    >
      
      <div class="mb-8 text-center sm:text-left animate-soft-slide-down" style="animation-delay: 100ms;">
        <h1 class="text-2xl sm:text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400">
          {{ $t('settings.title') }}
        </h1>
        <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
          {{ $t('settings.subtitle') }}
        </p>
      </div>

      <div class="bg-white/80 dark:bg-gray-900/80 backdrop-blur-2xl p-6 sm:p-8 rounded-2xl shadow-xl border border-blue-100 dark:border-gray-800/50 overflow-hidden animate-soft-slide-up" style="animation-delay: 200ms;">
        
        <h3 class="font-bold text-gray-900 dark:text-white text-lg mb-6 pb-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
          <div class="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
          </div>
          {{ $t('settings.change_password') }}
        </h3>

        <form @submit.prevent="handleChangePassword" class="space-y-5">
          
          <div>
            <label class="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">{{ $t('settings.current_pass') }}</label>
            <div class="relative">
              <input 
                v-model="form.currentPassword" 
                :type="showCurrentPassword ? 'text' : 'password'" 
                required
                class="w-full pl-4 pr-10 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-blue-100 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all text-sm text-gray-900 dark:text-white"
              />
              <button 
                type="button"
                @click="showCurrentPassword = !showCurrentPassword"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 focus:outline-none transition-colors"
                tabindex="-1"
              >
                <svg v-if="showCurrentPassword" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a10.05 10.05 0 011.574-2.59M6 6l12 12" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3l18 18" /></svg>
              </button>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label class="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">{{ $t('settings.new_pass') }}</label>
              <div class="relative">
                <input 
                  v-model="form.newPassword" 
                  :type="showNewPassword ? 'text' : 'password'" 
                  required
                  class="w-full pl-4 pr-10 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-blue-100 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all text-sm text-gray-900 dark:text-white"
                  placeholder="Min. 6 karakter"
                />
                <button 
                  type="button"
                  @click="showNewPassword = !showNewPassword"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 focus:outline-none transition-colors"
                  tabindex="-1"
                >
                  <svg v-if="showNewPassword" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a10.05 10.05 0 011.574-2.59M6 6l12 12" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3l18 18" /></svg>
                </button>
              </div>
            </div>

            <div>
              <label class="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">{{ $t('settings.confirm_pass') }}</label>
              <div class="relative">
                <input 
                  v-model="form.confirmPassword" 
                  :type="showConfirmPassword ? 'text' : 'password'" 
                  required
                  class="w-full pl-4 pr-10 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-blue-100 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all text-sm text-gray-900 dark:text-white"
                  placeholder="Ulangi kata sandi"
                />
                <button 
                  type="button"
                  @click="showConfirmPassword = !showConfirmPassword"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 focus:outline-none transition-colors"
                  tabindex="-1"
                >
                  <svg v-if="showConfirmPassword" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a10.05 10.05 0 011.574-2.59M6 6l12 12" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3l18 18" /></svg>
                </button>
              </div>
            </div>
          </div>

          <div class="flex justify-end pt-4">
            <button 
              type="submit" 
              class="group relative overflow-hidden bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold px-6 py-2.5 rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 flex items-center gap-2 text-sm"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              {{ $t('settings.btn_save') }}
              <div class="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
            </button>
          </div>

        </form>
      </div>
    </div>

  </div>
</template>

<style scoped>
/* Animasi Soft Slide */
.animate-soft-slide-down {
  animation: softSlideDown 0.8s cubic-bezier(0.16, 1, 0.3, 1) backwards;
}

.animate-soft-slide-up {
  animation: softSlideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) backwards;
}

@keyframes softSlideDown {
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes softSlideUp {
  from { opacity: 0; transform: translateY(30px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
</style>
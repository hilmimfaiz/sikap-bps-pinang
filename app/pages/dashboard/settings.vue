<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'

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

// --- NEW: LOGIKA KEKUATAN PASSWORD ---
const passwordStrength = computed(() => {
  const pass = form.value.newPassword
  
  if (!pass) return { score: 0, label: '', color: 'bg-gray-200 dark:bg-gray-700', width: '0%' }

  // Regex Check
  const hasUpperStart = /^[A-Z]/.test(pass) // Huruf besar di awal
  const hasNumber = /[0-9]/.test(pass)      // Memakai angka
  const hasSymbol = /[!@#$%^&*.,?_~\-(){}[\]]/.test(pass) // Memakai simbol (termasuk titik)

  // Level 3: Kuat (Kapital Awal + Angka + Simbol)
  if (hasUpperStart && hasNumber && hasSymbol) {
    return { score: 3, label: 'Kuat', color: 'bg-green-500', width: '100%' }
  }
  
  // Level 2: Sedang (Kapital Awal + Angka)
  if (hasUpperStart && hasNumber) {
    return { score: 2, label: 'Sedang', color: 'bg-yellow-500', width: '66%' }
  }

  // Level 1: Lemah (Tidak memenuhi syarat di atas)
  return { score: 1, label: 'Lemah', color: 'bg-red-500', width: '33%' }
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

  // NEW: Validasi Kekuatan Password
  if (passwordStrength.value.score < 2) {
    return toast.warning('Password terlalu lemah. Wajib: Huruf besar diawal & angka.')
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

              <div v-if="form.newPassword" class="mt-3">
                <div class="flex justify-between items-center mb-1">
                  <span class="text-[10px] uppercase font-bold text-gray-500">Kekuatan:</span>
                  <span class="text-[10px] font-bold" 
                    :class="{
                      'text-red-500': passwordStrength.score === 1,
                      'text-yellow-600 dark:text-yellow-500': passwordStrength.score === 2,
                      'text-green-600 dark:text-green-400': passwordStrength.score === 3
                    }">
                    {{ passwordStrength.label }}
                  </span>
                </div>
                <div class="h-1.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div class="h-full transition-all duration-500 ease-out" 
                       :class="passwordStrength.color" 
                       :style="{ width: passwordStrength.width }"></div>
                </div>
                
                <div class="mt-2 text-[10px] text-gray-500 dark:text-gray-400 space-y-0.5">
                  <p :class="{'text-green-600 dark:text-green-400': /^[A-Z]/.test(form.newPassword)}">
                    • Wajib: Huruf besar di awal
                  </p>
                  <p :class="{'text-green-600 dark:text-green-400': /[0-9]/.test(form.newPassword)}">
                    • Wajib: Mengandung angka
                  </p>
                  <p :class="{'text-green-600 dark:text-green-400': /[!@#$%^&*.,?_~\-(){}[\]]/.test(form.newPassword)}">
                    • Opsional: Simbol (untuk Kuat)
                  </p>
                </div>
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
              :disabled="passwordStrength.score < 2"
              class="group relative overflow-hidden text-white font-semibold px-6 py-2.5 rounded-xl shadow-lg transition-all duration-300 transform flex items-center gap-2 text-sm"
              :class="passwordStrength.score < 2 
                ? 'bg-gray-400 cursor-not-allowed opacity-70' 
                : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-blue-500/30 hover:shadow-xl hover:-translate-y-0.5'"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              {{ $t('settings.btn_save') }}
              <div v-if="passwordStrength.score >= 2" class="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
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
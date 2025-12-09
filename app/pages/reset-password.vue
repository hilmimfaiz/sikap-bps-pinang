<script setup lang="ts">
import { ref, onMounted } from 'vue'

definePageMeta({
  layout: 'default',
  middleware: [] // PENTING: Jangan pakai 'auth' di sini agar bisa diakses public
})

const route = useRoute()
const router = useRouter()
const { startLoading, stopLoading } = useGlobalLoading()
const toast = useToast()
const { t } = useI18n()

// State Form
const email = ref('')
const otp = ref('')
const password = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const isSubmitting = ref(false)

// Ambil email dari query parameter jika ada (dari link di email jika Anda buat link nanti)
// Atau dari input user di halaman sebelumnya (forgot-password)
onMounted(() => {
  if (route.query.email) {
    email.value = route.query.email as string
  }
})

const handleReset = async () => {
  // 1. Validasi Frontend Dasar
  if (!email.value || !otp.value || !password.value) {
    return toast.warning('Mohon lengkapi email, kode OTP, dan password baru')
  }
  
  // Validasi Kecocokan Password
  if (password.value !== confirmPassword.value) {
    return toast.warning(t('reset.password_mismatch') || 'Password konfirmasi tidak cocok')
  }
  
  // Validasi Panjang Password
  if (password.value.length < 6) {
    return toast.warning(t('reset.password_min') || 'Password minimal 6 karakter')
  }

  isSubmitting.value = true
  startLoading('Memverifikasi OTP & Mereset...')
  
  try {
    // 2. Panggil API Backend
    const response = await $fetch('/api/auth/reset-password', {
      method: 'POST',
      body: { 
        email: email.value,
        otp: otp.value, 
        newPassword: password.value 
      }
    })
    
    // 3. Sukses
    await stopLoading()
    isSubmitting.value = false
    toast.success(response.message || 'Password berhasil diubah!')
    
    // Redirect ke Login setelah sukses dengan jeda sedikit
    setTimeout(() => {
      router.push('/login')
    }, 1500)

  } catch (e: any) {
    // 4. Error Handling
    await stopLoading()
    isSubmitting.value = false
    
    // Ambil pesan error dari backend (misal: OTP expired, User not found, dll)
    const errorMessage = e.data?.message || 'Gagal mereset password. Silakan coba lagi.'
    toast.error(errorMessage)
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50/50 dark:from-gray-900 dark:via-black dark:to-blue-900/80 transition-all duration-1000 font-sans p-4 relative overflow-hidden">
    
    <div class="absolute inset-0 -z-10 overflow-hidden">
      <div class="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-blue-200/40 to-cyan-100/30 rounded-full blur-3xl animate-float-slow dark:from-blue-600/20 dark:to-cyan-400/10"></div>
      <div class="absolute top-1/2 -left-20 w-80 h-80 bg-gradient-to-br from-slate-200/30 to-blue-100/20 rounded-full blur-3xl animate-float-slow delay-1500 dark:from-gray-800/30 dark:to-blue-900/20"></div>
      <div class="absolute bottom-20 right-1/4 w-60 h-60 bg-gradient-to-br from-cyan-200/25 to-blue-300/20 rounded-full blur-3xl animate-float-slow delay-1000 dark:from-cyan-500/15 dark:to-blue-700/10"></div>
      
      <div class="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)] dark:bg-[linear-gradient(rgba(59,130,246,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.05)_1px,transparent_1px)] animate-grid-flow"></div>
      
      <div class="absolute top-1/4 left-1/4 w-2 h-2 bg-blue-400/30 rounded-full animate-float-fast dark:bg-cyan-400/40"></div>
      <div class="absolute top-1/3 right-1/3 w-1 h-1 bg-cyan-300/40 rounded-full animate-float-fast delay-500 dark:bg-blue-400/50"></div>
      <div class="absolute bottom-1/4 left-1/3 w-1.5 h-1.5 bg-blue-300/25 rounded-full animate-float-fast delay-1000 dark:bg-cyan-300/30"></div>
    </div>

    <div class="absolute top-6 left-6 z-10 animate-fade-in-down">
      <NuxtLink 
        to="/login" 
        class="flex items-center gap-2 px-3 py-2 bg-white/80 backdrop-blur-xl border border-slate-200/50 rounded-xl shadow-lg hover:shadow-xl transition-all duration-500 text-xs sm:text-sm font-medium text-slate-600 hover:text-blue-600 group hover:-translate-y-0.5 hover:border-blue-300/50 dark:bg-gray-900/60 dark:border-gray-700/50 dark:text-gray-300 dark:hover:text-cyan-400 dark:hover:border-cyan-400/30"
        :title="$t('reset.back_login') || 'Kembali ke Login'"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        <span class="hidden sm:inline">{{ $t('reset.back_login') || 'Login' }}</span>
      </NuxtLink>
    </div>

    <div class="absolute top-6 right-6 z-10 animate-fade-in-down flex items-center gap-3">
      <LanguageSwitcher />
      <ThemeToggle />
    </div>

    <div class="bg-white/80 backdrop-blur-xl p-6 rounded-[1.5rem] shadow-2xl border border-slate-200/50 w-full max-w-sm relative z-10 animate-fade-in-up transition-all duration-700 hover:shadow-3xl group overflow-hidden dark:bg-gradient-to-br dark:from-gray-800/80 dark:via-gray-900/90 dark:to-blue-900/60 dark:backdrop-blur-2xl dark:border-gray-700/30">
      
      <div class="absolute inset-0 rounded-[1.5rem] bg-gradient-to-r from-blue-500/5 via-cyan-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 dark:from-cyan-500/10 dark:via-blue-600/10 dark:to-indigo-500/10"></div>
      
      <div class="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-slate-100/10 rounded-[1.5rem] dark:from-white/5 dark:via-transparent dark:to-black/10"></div>

      <div class="text-center mb-6 relative z-10">
        <div class="relative inline-block mb-3">
          <div class="absolute -inset-4 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full blur-lg opacity-20 group-hover:opacity-30 transition-opacity duration-500 dark:from-cyan-500 dark:to-blue-600"></div>
          <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 text-white rounded-xl flex items-center justify-center text-xl mx-auto shadow-lg relative z-10 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
            </svg>
          </div>
        </div>
        
        <h1 class="text-2xl font-bold bg-gradient-to-r from-slate-800 via-blue-700 to-cyan-600 bg-clip-text text-transparent tracking-tight mb-2 animate-gradient-flow dark:from-cyan-400 dark:via-blue-400 dark:to-indigo-400">
          {{ $t('reset.title') || 'Reset Password' }}
        </h1>
        <p class="text-xs text-slate-500 dark:text-gray-400 leading-relaxed">
          {{ $t('reset.subtitle') || 'Masukkan Kode OTP dan Kata Sandi Baru' }}
        </p>
      </div>

      <div class="mb-5 relative z-10">
        <div class="flex justify-between items-center mb-1.5">
          <span class="text-[10px] font-semibold text-slate-600 dark:text-gray-400 uppercase tracking-wider">Kekuatan Password</span>
          <span class="text-[10px] font-medium" :class="{
            'text-red-500': password.length > 0 && password.length < 6,
            'text-yellow-500': password.length >= 6 && password.length < 8,
            'text-green-500': password.length >= 8,
            'text-slate-400 dark:text-gray-600': password.length === 0
          }">
            {{ password.length > 0 && password.length < 6 ? 'Lemah' : password.length >= 6 && password.length < 8 ? 'Sedang' : password.length >= 8 ? 'Kuat' : '...' }}
          </span>
        </div>
        <div class="w-full bg-slate-100 dark:bg-gray-800 rounded-full h-1.5 overflow-hidden">
          <div class="h-full rounded-full transition-all duration-500 ease-out" :class="{
            'bg-red-500': password.length > 0 && password.length < 6,
            'bg-yellow-500': password.length >= 6 && password.length < 8,
            'bg-green-500': password.length >= 8,
            'w-0': password.length === 0,
            'w-1/3': password.length > 0 && password.length < 6,
            'w-2/3': password.length >= 6 && password.length < 8,
            'w-full': password.length >= 8
          }"></div>
        </div>
      </div>

      <form @submit.prevent="handleReset" class="space-y-4 relative z-10">
        
        <div class="group">
          <label class="block text-[10px] font-bold uppercase text-slate-500 mb-1 ml-1 tracking-wider">Email</label>
          <div class="relative">
            <div class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
            </div>
            <input 
              v-model="email" 
              type="email" 
              required
              class="w-full pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-gray-800/50 border border-slate-300 dark:border-gray-700 rounded-xl focus:outline-none text-sm text-slate-500 dark:text-gray-400 cursor-not-allowed font-medium transition-all"
              placeholder="Masukkan email Anda"
            />
          </div>
        </div>

        <div class="group">
          <label class="block text-[10px] font-bold uppercase text-slate-500 mb-1 ml-1 tracking-wider">Kode OTP (6 Digit)</label>
          <div class="relative">
            <div class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
            </div>
            <input 
              v-model="otp" 
              type="text" 
              required
              maxlength="6"
              class="w-full pl-10 pr-4 py-2.5 bg-slate-50/80 backdrop-blur-sm border border-slate-300/50 text-slate-900 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all duration-500 placeholder-slate-400 focus:shadow-lg focus:scale-[1.02] group-hover:border-slate-400 focus:bg-white/90 dark:bg-black/40 dark:border-gray-700/50 dark:text-white dark:placeholder-gray-500 dark:focus:ring-cyan-500/50 dark:focus:border-cyan-500 dark:group-hover:border-gray-500 dark:focus:bg-black/60 font-mono tracking-[0.4em] text-center font-bold text-base uppercase"
              placeholder="123456"
            />
            <div class="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/5 to-cyan-500/5 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none dark:from-cyan-500/5 dark:to-blue-500/5"></div>
          </div>
        </div>

        <div class="group">
          <label class="block text-[10px] font-bold uppercase text-slate-500 mb-1 ml-1 tracking-wider">
            {{ $t('reset.new_password') || 'Password Baru' }}
          </label>
          <div class="relative">
            <div class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors duration-300 group-focus-within:text-blue-500 dark:text-gray-500 dark:group-focus-within:text-cyan-400">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
              </svg>
            </div>
            <input 
              v-model="password" 
              :type="showPassword ? 'text' : 'password'" 
              required
              class="w-full pl-10 pr-10 py-2.5 bg-slate-50/80 backdrop-blur-sm border border-slate-300/50 text-slate-900 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all duration-500 placeholder-slate-400 focus:shadow-lg focus:scale-[1.02] group-hover:border-slate-400 focus:bg-white/90 dark:bg-black/40 dark:border-gray-700/50 dark:text-white dark:placeholder-gray-500 dark:focus:ring-cyan-500/50 dark:focus:border-cyan-500 dark:group-hover:border-gray-500 dark:focus:bg-black/60 text-sm"
              placeholder="Min. 6 karakter"
            />
            <button type="button" @click="showPassword = !showPassword" class="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-blue-500 focus:outline-none transition-all duration-300 rounded-lg hover:bg-slate-200/50 backdrop-blur-sm dark:text-gray-500 dark:hover:text-cyan-400 dark:hover:bg-gray-700/50" tabindex="-1">
              <svg v-if="showPassword" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a10.05 10.05 0 011.574-2.59M6 6l12 12" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.94 17.94A10.07 10.07 0 0112 19c-4.478 0-8.268-2.943-9.542-7a10.05 10.05 0 012.433-3.633M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </button>
          </div>
        </div>

        <div class="group">
          <label class="block text-[10px] font-bold uppercase text-slate-500 mb-1 ml-1 tracking-wider">
            {{ $t('reset.confirm_password') || 'Konfirmasi Password' }}
          </label>
          <div class="relative">
            <div class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors duration-300 group-focus-within:text-blue-500 dark:text-gray-500 dark:group-focus-within:text-cyan-400">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
              </svg>
            </div>
            <input 
              v-model="confirmPassword" 
              :type="showPassword ? 'text' : 'password'" 
              required
              class="w-full pl-10 pr-4 py-2.5 bg-slate-50/80 backdrop-blur-sm border border-slate-300/50 text-slate-900 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all duration-500 placeholder-slate-400 focus:shadow-lg focus:scale-[1.02] group-hover:border-slate-400 focus:bg-white/90 dark:bg-black/40 dark:border-gray-700/50 dark:text-white dark:placeholder-gray-500 dark:focus:ring-cyan-500/50 dark:focus:border-cyan-500 dark:group-hover:border-gray-500 dark:focus:bg-black/60 text-sm"
              placeholder="Konfirmasi password"
              :class="{
                'border-green-500 dark:border-green-400': confirmPassword && password === confirmPassword,
                'border-red-500 dark:border-red-400': confirmPassword && password !== confirmPassword
              }"
            />
            
            <div v-if="confirmPassword" class="absolute right-3 top-1/2 -translate-y-1/2">
              <svg v-if="password === confirmPassword" class="w-4 h-4 text-green-500 animate-bounce-in" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
              </svg>
              <svg v-else class="w-4 h-4 text-red-500 animate-shake" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </div>
          </div>
        </div>

        <button 
          type="submit" 
          :disabled="isSubmitting || !password || !confirmPassword || password !== confirmPassword"
          class="w-full bg-gradient-to-r from-blue-600 via-cyan-600 to-indigo-600 hover:from-blue-500 hover:via-cyan-500 hover:to-indigo-500 text-white font-bold py-3 rounded-xl shadow-xl shadow-blue-500/30 hover:shadow-2xl hover:shadow-blue-500/40 transition-all duration-500 transform hover:-translate-y-0.5 active:scale-95 flex justify-center items-center gap-2 group/btn relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none dark:from-cyan-600 dark:via-blue-600 dark:to-indigo-600 dark:hover:from-cyan-500 dark:hover:via-blue-500 dark:hover:to-indigo-500 dark:shadow-blue-500/30 dark:hover:shadow-blue-500/40 mt-6"
          :class="isSubmitting ? 'cursor-wait' : ''"
        >
          <div class="absolute inset-0 bg-gradient-to-r from-blue-500 via-cyan-500 to-indigo-500 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300 dark:from-cyan-500 dark:via-blue-500 dark:to-indigo-500"></div>
          
          <div class="absolute inset-0 bg-white/30 transform -skew-x-12 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000"></div>
          
          <span class="relative z-10 flex items-center text-sm tracking-wide">
            <span v-if="!isSubmitting">{{ $t('reset.btn_submit') || 'Reset Password' }}</span>
            <span v-else>Memproses...</span>
            <svg v-if="!isSubmitting" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 ml-2 transition-transform duration-300 group-hover/btn:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            <svg v-else class="animate-spin h-4 w-4 ml-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </span>
        </button>
      </form>

    </div>
  </div>
</template>

<style scoped>
/* Animations (Sama seperti sebelumnya) */
@keyframes fadeInUp { from { opacity: 0; transform: translateY(40px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
@keyframes fadeInDown { from { opacity: 0; transform: translateY(-40px); } to { opacity: 1; transform: translateY(0); } }
@keyframes float-slow { 0%, 100% { transform: translateY(0px) rotate(0deg) scale(1); } 33% { transform: translateY(-30px) rotate(3deg) scale(1.05); } 66% { transform: translateY(15px) rotate(-2deg) scale(0.95); } }
@keyframes float-fast { 0%, 100% { transform: translateY(0px) translateX(0px); } 25% { transform: translateY(-20px) translateX(10px); } 50% { transform: translateY(-10px) translateX(-10px); } 75% { transform: translateY(10px) translateX(5px); } }
@keyframes gradient-flow { 0%, 100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
@keyframes grid-flow { 0% { transform: translateY(0px); } 100% { transform: translateY(64px); } }
@keyframes bounce-in { 0% { opacity: 0; transform: scale(0.3); } 50% { opacity: 1; transform: scale(1.05); } 70% { transform: scale(0.9); } 100% { opacity: 1; transform: scale(1); } }
@keyframes shake { 0%, 100% { transform: translateX(0); } 10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); } 20%, 40%, 60%, 80% { transform: translateX(2px); } }

.animate-fade-in-up { animation: fadeInUp 1s cubic-bezier(0.22, 0.61, 0.36, 1) forwards; }
.animate-fade-in-down { animation: fadeInDown 1s cubic-bezier(0.22, 0.61, 0.36, 1) forwards; }
.animate-float-slow { animation: float-slow 12s ease-in-out infinite; }
.animate-float-fast { animation: float-fast 8s ease-in-out infinite; }
.animate-gradient-flow { background-size: 200% 200%; animation: gradient-flow 3s ease infinite; }
.animate-grid-flow { animation: grid-flow 20s linear infinite; }
.animate-bounce-in { animation: bounce-in 0.6s ease-out; }
.animate-shake { animation: shake 0.5s ease-in-out; }

/* Custom shadows */
.shadow-3xl { box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(59, 130, 246, 0.1); }

/* Enhanced focus styles */
input:focus { box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1), 0 8px 40px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1); }
@media (prefers-color-scheme: dark) { input:focus { box-shadow: 0 0 0 3px rgba(34, 211, 238, 0.1), 0 8px 40px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05); } }

/* Smooth transitions */
* { transition-property: color, background-color, border-color, transform, box-shadow, opacity; transition-duration: 400ms; transition-timing-function: cubic-bezier(0.25, 0.46, 0.45, 0.94); }
</style>
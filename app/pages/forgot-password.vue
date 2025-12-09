<script setup lang="ts">
import { ref } from 'vue'

// 1. Konfigurasi Halaman
definePageMeta({
  layout: 'default',
  middleware: 'auth'
})

// 2. Inisialisasi Tools
const router = useRouter()
const { startLoading, stopLoading } = useGlobalLoading()
const toast = useToast()
const { t } = useI18n()

// 3. State
const email = ref('')

// 4. Action
const handleForgot = async () => {
  if (!email.value) return toast.warning(t('forgot.email_required'))

  startLoading(t('forgot.loading'))
  
  try {
    // Panggil API (Backend mengirim OTP via Resend)
    await $fetch('/api/auth/forgot-password', {
      method: 'POST',
      body: { email: email.value }
    })
    
    await stopLoading()
    toast.success('Kode OTP terkirim! Silakan cek email Anda.')

    // [LOGIC BARU] Redirect ke halaman reset password dengan membawa email
    // User langsung diarahkan untuk memasukkan OTP
    router.push({ path: '/reset-password', query: { email: email.value } })

  } catch (e: any) {
    await stopLoading()
    toast.error(e.data?.message || 'Gagal mengirim email')
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
        class="flex items-center gap-2 px-4 py-2.5 bg-white/80 backdrop-blur-xl border border-slate-200/50 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-500 text-sm font-medium text-slate-600 hover:text-blue-600 group hover:-translate-y-0.5 hover:border-blue-300/50 dark:bg-gray-900/60 dark:border-gray-700/50 dark:text-gray-300 dark:hover:text-cyan-400 dark:hover:border-cyan-400/30"
        :title="$t('forgot.back_login')"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        <span class="hidden sm:inline">{{ $t('forgot.back_login') }}</span>
      </NuxtLink>
    </div>

    <div class="absolute top-6 right-6 z-10 animate-fade-in-down flex items-center gap-3">
      <LanguageSwitcher />
      <ThemeToggle />
    </div>

    <div class="bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-slate-200/50 w-full max-w-md relative z-10 animate-fade-in-up transition-all duration-700 hover:shadow-3xl group overflow-hidden dark:bg-gradient-to-br dark:from-gray-800/80 dark:via-gray-900/90 dark:to-blue-900/60 dark:backdrop-blur-2xl dark:border-gray-700/30 min-h-[480px] flex flex-col justify-center">
      
      <div class="absolute inset-0 rounded-3xl bg-gradient-to-r from-blue-500/5 via-cyan-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 dark:from-cyan-500/10 dark:via-blue-600/10 dark:to-indigo-500/10"></div>
      
      <div class="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-slate-100/10 rounded-3xl dark:from-white/5 dark:via-transparent dark:to-black/10"></div>

      <div class="relative z-10">
          <div class="text-center mb-8">
            <div class="relative inline-block mb-4">
              <div class="absolute -inset-4 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full blur-lg opacity-20 group-hover:opacity-30 transition-opacity duration-500 dark:from-cyan-500 dark:to-blue-600"></div>
              <div class="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 text-white rounded-2xl flex items-center justify-center text-2xl mx-auto shadow-lg relative z-10 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3">
                <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/>
                </svg>
              </div>
            </div>
            
            <h1 class="text-3xl font-bold bg-gradient-to-r from-slate-800 via-blue-700 to-cyan-600 bg-clip-text text-transparent tracking-tight mb-3 animate-gradient-flow dark:from-cyan-400 dark:via-blue-400 dark:to-indigo-400">
              {{ $t('forgot.title') }}
            </h1>
            <p class="text-sm text-slate-500 dark:text-gray-400 leading-relaxed max-w-xs mx-auto">
              Masukkan email Anda untuk menerima <strong>Kode OTP</strong> reset password.
            </p>
          </div>

          <form @submit.prevent="handleForgot" class="space-y-6">
            <div class="group">
              <label class="block text-sm font-semibold text-slate-700 mb-2 transition-colors dark:text-gray-300">
                {{ $t('forgot.email_label') }}
              </label>
              <div class="relative">
                <div class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors duration-300 group-focus-within:text-blue-500 dark:text-gray-500 dark:group-focus-within:text-cyan-400">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                  </svg>
                </div>
                <input 
                  v-model="email" 
                  type="email" 
                  required
                  class="w-full pl-11 pr-4 py-3.5 bg-slate-50/80 backdrop-blur-sm border border-slate-300/50 text-slate-900 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all duration-500 placeholder-slate-400 focus:shadow-lg focus:scale-[1.02] group-hover:border-slate-400 focus:bg-white/90 dark:bg-black/40 dark:border-gray-700/50 dark:text-white dark:placeholder-gray-500 dark:focus:ring-cyan-500/50 dark:focus:border-cyan-500 dark:group-hover:border-gray-500 dark:focus:bg-black/60"
                  placeholder="admin@sikap.com"
                />
                <div class="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/5 to-cyan-500/5 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none dark:from-cyan-500/5 dark:to-blue-500/5"></div>
              </div>
            </div>

            <button 
              type="submit" 
              class="w-full bg-gradient-to-r from-blue-600 via-cyan-600 to-indigo-600 hover:from-blue-500 hover:via-cyan-500 hover:to-indigo-500 text-white font-bold py-4 rounded-xl shadow-xl shadow-blue-500/30 hover:shadow-2xl hover:shadow-blue-500/40 transition-all duration-500 transform hover:-translate-y-0.5 active:scale-95 flex justify-center items-center gap-2 group/btn relative overflow-hidden dark:from-cyan-600 dark:via-blue-600 dark:to-indigo-600 dark:hover:from-cyan-500 dark:hover:via-blue-500 dark:hover:to-indigo-500 dark:shadow-blue-500/30 dark:hover:shadow-blue-500/40"
            >
              <div class="absolute inset-0 bg-gradient-to-r from-blue-500 via-cyan-500 to-indigo-500 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300 dark:from-cyan-500 dark:via-blue-500 dark:to-indigo-500"></div>
              
              <div class="absolute inset-0 bg-white/30 transform -skew-x-12 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000"></div>
              
              <span class="relative z-10 flex items-center text-sm tracking-wide">
                Kirim Kode OTP
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 ml-2 transition-transform duration-300 group-hover/btn:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5l7 7-7 7M5 5l7 7-7 7"/>
                </svg>
              </span>
            </button>
          </form>
      </div>

    </div>
  </div>
</template>

<style scoped>
/* Slide Fade Transition */
.slide-fade-enter-active {
  transition: all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}
.slide-fade-leave-active {
  transition: all 0.4s cubic-bezier(0.55, 0.085, 0.68, 0.53);
}
.slide-fade-enter-from {
  opacity: 0;
  transform: translateX(30px) scale(0.95);
}
.slide-fade-leave-to {
  opacity: 0;
  transform: translateX(-30px) scale(0.95);
}

/* Animations */
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(40px) scale(0.95); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

@keyframes fadeInDown {
  from { opacity: 0; transform: translateY(-40px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes float-slow {
  0%, 100% { transform: translateY(0px) rotate(0deg) scale(1); }
  33% { transform: translateY(-30px) rotate(3deg) scale(1.05); }
  66% { transform: translateY(15px) rotate(-2deg) scale(0.95); }
}

@keyframes float-fast {
  0%, 100% { transform: translateY(0px) translateX(0px); }
  25% { transform: translateY(-20px) translateX(10px); }
  50% { transform: translateY(-10px) translateX(-10px); }
  75% { transform: translateY(10px) translateX(5px); }
}

@keyframes gradient-flow {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

@keyframes grid-flow {
  0% { transform: translateY(0px); }
  100% { transform: translateY(64px); }
}

@keyframes success-bounce {
  0%, 20%, 50%, 80%, 100% { transform: translateY(0) scale(1); }
  40% { transform: translateY(-10px) scale(1.05); }
  60% { transform: translateY(-5px) scale(1.02); }
}

@keyframes pulse-slow {
  0%, 100% { opacity: 0.1; }
  50% { opacity: 0.2; }
}

.animate-fade-in-up { animation: fadeInUp 1s cubic-bezier(0.22, 0.61, 0.36, 1) forwards; }
.animate-fade-in-down { animation: fadeInDown 1s cubic-bezier(0.22, 0.61, 0.36, 1) forwards; }
.animate-float-slow { animation: float-slow 12s ease-in-out infinite; }
.animate-float-fast { animation: float-fast 8s ease-in-out infinite; }
.animate-gradient-flow { background-size: 200% 200%; animation: gradient-flow 3s ease infinite; }
.animate-grid-flow { animation: grid-flow 20s linear infinite; }
.animate-success-bounce { animation: success-bounce 2s ease-in-out; }
.animate-pulse-slow { animation: pulse-slow 4s ease-in-out infinite; }

/* Custom shadows */
.shadow-3xl {
  box-shadow: 
    0 25px 50px -12px rgba(0, 0, 0, 0.15),
    0 0 0 1px rgba(59, 130, 246, 0.1);
}

/* Enhanced focus styles */
input:focus {
  box-shadow: 
    0 0 0 3px rgba(59, 130, 246, 0.1),
    0 8px 40px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

/* Dark mode focus styles */
@media (prefers-color-scheme: dark) {
  input:focus {
    box-shadow: 
      0 0 0 3px rgba(34, 211, 238, 0.1),
      0 8px 40px rgba(0, 0, 0, 0.3),
      inset 0 1px 0 rgba(255, 255, 255, 0.05);
  }
}

/* Smooth transitions */
* {
  transition-property: color, background-color, border-color, transform, box-shadow, opacity;
  transition-duration: 400ms;
  transition-timing-function: cubic-bezier(0.25, 0.46, 0.45, 0.94);
}
</style>
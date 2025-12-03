<script setup lang="ts">
import { ref, onMounted } from 'vue'

// Konfigurasi Halaman
definePageMeta({
  layout: 'default',
  middleware: 'auth'
})

const { startLoading, stopLoading } = useGlobalLoading()
const { t } = useI18n()
const router = useRouter()

// Cek jika user sudah login
const userCookie = useCookie('user_data')
if (userCookie.value) {
  navigateTo('/dashboard')
}

// State Form
const email = ref('')
const password = ref('')
const showPassword = ref(false)
const errorMessage = ref('')
const isSubmitting = ref(false)

// Background Grid (Securely Defined)
const gridBgImage = `url("data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h60v60H0z' fill='none'/%3E%3Cpath d='M60 0v60H0V0z' stroke='%23000' stroke-width='1' fill='none'/%3E%3C/svg%3E")`

// Fungsi Login
const handleLogin = async () => {
  isSubmitting.value = true
  startLoading(t('login.loading'))
  errorMessage.value = ''

  try {
    const response: any = await $fetch('/api/auth/login', {
      method: 'POST',
      body: { email: email.value, password: password.value }
    })

    const tokenCookie = useCookie('auth_token', { maxAge: 86400, path: '/' })
    const userDataCookie = useCookie('user_data', { maxAge: 86400, path: '/' })
    
    tokenCookie.value = response.token || ('logged-in-' + Date.now())
    userDataCookie.value = response.user

    await stopLoading()
    isSubmitting.value = false
    
    router.push('/dashboard')

  } catch (err: any) {
    console.error('Login Error:', err)
    await stopLoading()
    isSubmitting.value = false
    // Prioritaskan pesan dari server, fallback ke pesan default
    errorMessage.value = err.data?.message || err.data?.statusMessage || t('login.error_default')
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-gray-50 via-blue-50/20 to-cyan-50/10 dark:from-gray-950 dark:via-[#0a1020] dark:to-[#0a1428] px-4 py-12">
    
    <div class="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
      <div class="absolute top-0 -left-40 w-96 h-96 bg-gradient-to-br from-blue-500/25 to-cyan-400/15 rounded-full blur-3xl animate-float-orb dark:hidden"></div>
      <div class="absolute bottom-0 -right-40 w-96 h-96 bg-gradient-to-tl from-teal-500/25 to-emerald-400/15 rounded-full blur-3xl animate-float-orb delay-3000 dark:hidden"></div>
      
      <div class="hidden dark:block absolute top-0 -left-40 w-96 h-96 bg-gradient-to-br from-blue-600/20 to-cyan-600/10 rounded-full blur-3xl animate-float-orb"></div>
      <div class="hidden dark:block absolute bottom-0 -right-40 w-96 h-96 bg-gradient-to-tl from-teal-700/20 to-cyan-700/10 rounded-full blur-3xl animate-float-orb delay-3000"></div>
      <div class="hidden dark:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-radial from-cyan-600/15 via-transparent to-transparent rounded-full blur-3xl animate-pulse-glow"></div>
      
       <div class="absolute inset-0 opacity-5 dark:opacity-10">
        <div class="absolute inset-0" :style="{ backgroundImage: gridBgImage }"></div>
      </div>
    </div>

    <div class="absolute top-6 left-6 z-30">
      <NuxtLink to="/" class="group flex items-center gap-2 px-4 py-2.5 bg-white/80 dark:bg-gray-900/90 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/60 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-500 dark:hover:text-cyan-400">
        <svg class="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        <span>{{ $t('login.back_home') }}</span>
      </NuxtLink>
    </div>
    <div class="absolute top-6 right-6 z-30 flex items-center gap-3">
      <LanguageSwitcher />
      <ThemeToggle />
    </div>

    <div class="w-full max-w-4xl mx-auto animate-slide-up">
      <div class="grid lg:grid-cols-2 gap-0 rounded-3xl overflow-hidden shadow-2xl bg-white/70 dark:bg-gray-900/80 backdrop-blur-2xl border border-white/30 dark:border-gray-800/60">

        <div class="hidden lg:flex flex-col justify-center p-10 relative overflow-hidden bg-gradient-to-br from-blue-700 via-teal-700 to-cyan-800 dark:from-blue-800 dark:via-[#0f4c5c] dark:to-[#0f6b7a]">
          
          <div class="absolute inset-0 opacity-30">
            <div class="absolute inset-0 bg-gradient-to-tr from-cyan-500/30 via-transparent to-blue-700/30"></div>
          </div>
          <div class="absolute top-8 right-8 w-72 h-72 bg-cyan-500/15 rounded-full blur-3xl animate-float-orb"></div>

          <div class="relative z-10 max-w-sm mx-auto text-center">
            <div class="mb-8 animate-slide-up delay-200">
              <img src="/logo.png" alt="SIKAP" class="h-20 mx-auto drop-shadow-2xl filter brightness-110" />
            </div>

            <h1 class="text-4xl font-black mb-3 leading-tight text-white animate-slide-up delay-300">
              {{ $t('login.title') }}
            </h1>
            <p class="text-lg text-cyan-100 mb-10 animate-slide-up delay-400">
              {{ $t('login.subtitle') }}
            </p>

            <div class="space-y-5 text-left animate-slide-up delay-500">
              <div class="flex items-center gap-4 text-white/95">
                <div class="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                </div>
                <span class="font-medium text-base">{{ $t('login.features.realtime') }}</span>
              </div>
              <div class="flex items-center gap-4 text-white/95">
                <div class="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                </div>
                <span class="font-medium text-base">{{ $t('login.features.performance') }}</span>
              </div>
              <div class="flex items-center gap-4 text-white/95">
                <div class="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                </div>
                <span class="font-medium text-base">{{ $t('login.features.security') }}</span>
              </div>
            </div>

            <p class="mt-12 text-sm text-cyan-200/70">BPS Tanjung Pinang | {{ $t('login.footer') }}</p>
          </div>
        </div>

        <div class="flex flex-col justify-center p-8 lg:p-10 bg-white/80 dark:bg-gray-900/90 backdrop-blur-xl">
          <div class="max-w-xs mx-auto w-full">
            <div class="flex justify-center mb-8 lg:hidden animate-slide-down">
              <img src="/logo.png" alt="SIKAP" class="h-16 drop-shadow-xl" />
            </div>

            <h2 class="text-2xl font-bold text-center bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-cyan-400 dark:to-blue-500 bg-clip-text text-transparent mb-2 animate-slide-down delay-100">
              {{ $t('login.form_title') }}
            </h2>
            <p class="text-center text-sm text-gray-600 dark:text-gray-400 mb-7 animate-slide-down delay-200">
              {{ $t('login.form_subtitle') }}
            </p>

            <Transition name="fade">
              <div v-if="errorMessage" class="mb-5 p-4 bg-red-500/10 dark:bg-red-900/30 border border-red-500/30 dark:border-red-800/50 rounded-xl text-red-600 dark:text-red-300 text-sm flex items-center gap-3 backdrop-blur-sm animate-shake">
                <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>{{ errorMessage }}</span>
              </div>
            </Transition>

            <form @submit.prevent="handleLogin" class="space-y-5">
              <div class="animate-slide-up delay-300">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{{ $t('login.email') }}</label>
                <div class="relative">
                  <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500 dark:text-gray-400">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                  </div>
                  <input v-model="email" type="email" required :placeholder="$t('login.email_placeholder')"
                    class="w-full pl-12 pr-4 py-3.5 bg-gray-50/60 dark:bg-gray-800/70 border border-gray-300/50 dark:border-gray-700/70 rounded-xl focus:ring-4 focus:ring-cyan-500/40 focus:border-cyan-500 dark:focus:border-cyan-600 outline-none transition-all duration-300 backdrop-blur-sm text-gray-900 dark:text-white placeholder-gray-500"/>
                </div>
              </div>

              <div class="animate-slide-up delay-400">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{{ $t('login.password') }}</label>
                <div class="relative">
                  <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500 dark:text-gray-400">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                  </div>
                  <input v-model="password" :type="showPassword ? 'text' : 'password'" required placeholder="••••••••"
                    class="w-full pl-12 pr-12 py-3.5 bg-gray-50/60 dark:bg-gray-800/70 border border-gray-300/50 dark:border-gray-700/70 rounded-xl focus:ring-4 focus:ring-cyan-500/40 focus:border-cyan-500 dark:focus:border-cyan-600 outline-none transition-all duration-300 backdrop-blur-sm text-gray-900 dark:text-white"/>
                  <button type="button" @click="showPassword = !showPassword" class="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 dark:text-gray-400 hover:text-cyan-500 transition">
                    <svg v-if="showPassword" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                    <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a10.05 10.05 0 011.574-2.59M6 6l12 12 M17.94 17.94A10.07 10.07 0 0112 19c-4.478 0-8.268-2.943-9.542-7a10.05 10.05 0 012.433-3.633"/></svg>
                  </button>
                </div>
                <div class="mt-2 text-right">
                  <NuxtLink to="/forgot-password" class="text-xs font-medium text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-300">
                    {{ $t('login.forgot_pass') }}
                  </NuxtLink>
                </div>
              </div>

              <button type="submit" :disabled="isSubmitting"
                class="relative w-full mt-7 overflow-hidden bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 hover:from-blue-700 hover:via-cyan-700 hover:to-teal-700 text-white font-bold py-4 rounded-xl shadow-xl shadow-cyan-500/40 dark:shadow-cyan-600/50 hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-500 disabled:opacity-70 group animate-slide-up delay-500">
                <span class="relative z-10 flex items-center justify-center gap-3">
                  <span v-if="!isSubmitting">{{ $t('login.btn_submit') }}</span>
                  <span v-else>{{ $t('login.loading') }}</span>
                  <svg v-if="!isSubmitting" class="w-5 h-5 transition-transform group-hover:translate-x-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
                  <svg v-else class="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </span>
                <div class="absolute inset-0 bg-white/25 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 skew-x-12"></div>
              </button>
            </form>

            <div class="mt-10 text-center animate-fade-in delay-500">
               <p class="text-xs text-gray-500 dark:text-gray-400">© 2025 SIKAP App. {{ $t('login.rights_reserved') }}</p>
            </div>

          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes float-orb {
  0%, 100% { transform: translateY(0) translateX(0) rotate(0deg); }
  50% { transform: translateY(-40px) translateX(20px) rotate(5deg); }
}
@keyframes pulse-glow {
  0%, 100% { opacity: 0.2; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(1.05); }
}
@keyframes slide-up { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
@keyframes slide-down { from { opacity: 0; transform: translateY(-30px); } to { opacity: 1; transform: translateY(0); } }
@keyframes shake { 0%,100%{transform:translateX(0)} 10%,30%,50%,70%,90%{transform:translateX(-8px)} 20%,40%,60%,80%{transform:translateX(8px)} }

.animate-float-orb { animation: float-orb 28s ease-in-out infinite; }
.animate-pulse-glow { animation: pulse-glow 12s ease-in-out infinite; }
.animate-slide-up { animation: slide-up 0.9s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
.animate-slide-down { animation: slide-down 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
.animate-shake { animation: shake 0.6s ease-out; }

.delay-100 { animation-delay: 0.1s; }
.delay-200 { animation-delay: 0.2s; }
.delay-300 { animation-delay: 0.3s; }
.delay-400 { animation-delay: 0.4s; }
.delay-500 { animation-delay: 0.5s; }
.delay-3000 { animation-delay: 3s; }

.fade-enter-active, .fade-leave-active { transition: all 0.4s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(-12px); }

* { transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1); }
</style>
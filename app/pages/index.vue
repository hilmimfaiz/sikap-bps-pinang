<script setup lang="ts">
// 1. Konfigurasi
definePageMeta({
  layout: 'default',
  middleware: 'auth' // Gunakan guest agar jika sudah login diarahkan ke dashboard
})

// Gunakan useI18n untuk reaktivitas bahasa
const { t } = useI18n()

// 2. Fetch Data Tautan Penting (Hanya yang Active dari API Landing)
const { data: importantLinks } = await useFetch('/api/landing/links')

// 3. Data Fitur (Reactive dengan computed agar berubah saat bahasa diganti)
const features = computed(() => [
  {
    title: t('landing.features.archive.title'),
    description: t('landing.features.archive.desc'),
    icon: '📁',
    color: 'bg-gradient-to-br from-blue-500 to-indigo-600',
    gradient: 'from-blue-500 to-indigo-600'
  },
  {
    title: t('landing.features.users.title'),
    description: t('landing.features.users.desc'),
    icon: '👨🏻‍💻',
    color: 'bg-gradient-to-br from-purple-500 to-pink-600',
    gradient: 'from-purple-500 to-pink-600'
  },
  {
    title: t('landing.features.category.title'),
    description: t('landing.features.category.desc'),
    icon: '🏷️',
    color: 'bg-gradient-to-br from-orange-500 to-red-500',
    gradient: 'from-orange-500 to-red-500'
  },
  {
    title: t('landing.features.links.title'),
    description: t('landing.features.links.desc'),
    icon: '🔗',
    color: 'bg-gradient-to-br from-green-500 to-teal-600',
    gradient: 'from-green-500 to-teal-600'
  }
])

// 4. Fungsi Scroll Halus
const scrollToFeatures = () => {
  const section = document.getElementById('fitur')
  if (section) {
    section.scrollIntoView({ behavior: 'smooth' })
  }
}

// State untuk animasi intersection observer
const featuresVisible = ref(false)
const linksVisible = ref(false)
const headerVisible = ref(false)

onMounted(() => {
  // Trigger animasi header setelah mount
  setTimeout(() => {
    headerVisible.value = true
  }, 100)

  // Setup intersection observer
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          if (entry.target.id === 'fitur') featuresVisible.value = true
          if (entry.target.id === 'tautan-penting') linksVisible.value = true
        }
      })
    },
    { threshold: 0.1 }
  )

  const featuresSection = document.getElementById('fitur')
  if (featuresSection) observer.observe(featuresSection)

  const linksSection = document.getElementById('tautan-penting')
  if (linksSection) observer.observe(linksSection)
})

// Fungsi helper untuk mendapatkan warna badge kategori
const getCategoryColor = (id: number) => {
  const colors = [
    'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
    'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
    'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
    'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300',
  ]
  return colors[id % colors.length]
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-900 dark:to-blue-900/20 transition-all duration-500 font-sans text-gray-800 dark:text-gray-100 selection:bg-blue-500 selection:text-white overflow-hidden">
    
    <div class="fixed inset-0 -z-10 overflow-hidden">
      <div class="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl animate-pulse-slow"></div>
      <div class="absolute top-1/2 -left-20 w-60 h-60 bg-purple-400/10 rounded-full blur-3xl animate-pulse-slow delay-1000"></div>
      <div class="absolute bottom-20 right-1/4 w-40 h-40 bg-indigo-400/10 rounded-full blur-3xl animate-pulse-slow delay-500"></div>
    </div>

    <nav class="fixed top-0 w-full z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50 transition-all duration-300 hover:bg-white/90 dark:hover:bg-gray-900/90">
      <div class="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
        
        <div class="flex items-center group cursor-pointer">
          <div class="relative">
            <img 
              src="/logo4.png" 
              alt="Logo SIKAP" 
              class="h-12 w-auto transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 drop-shadow-lg"
            />
            <div class="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg opacity-0 group-hover:opacity-10 blur-md transition-opacity duration-300"></div>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <LanguageSwitcher />

          <ThemeToggle />
          
          <NuxtLink 
            to="/login" 
            class="hidden sm:inline-block px-6 py-2.5 bg-gradient-to-r from-gray-900 to-gray-800 dark:from-white dark:to-gray-100 text-white dark:text-gray-900 font-medium rounded-full hover:shadow-2xl transition-all duration-300 shadow-lg hover:-translate-y-0.5 active:scale-95 ml-2 group overflow-hidden relative"
          >
            <span class="relative z-10">{{ t('landing.login_btn') }}</span>
            <div class="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </NuxtLink>
        </div>
      </div>
    </nav>

    <header class="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
      <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full blur-[120px] -z-10 animate-float"></div>
      
      <div class="absolute top-20 left-20 w-4 h-4 bg-blue-400/30 rounded-full animate-float delay-700"></div>
      <div class="absolute top-40 right-1/4 w-3 h-3 bg-purple-400/30 rounded-full animate-float delay-300"></div>
      <div class="absolute bottom-40 left-1/3 w-2 h-2 bg-indigo-400/30 rounded-full animate-float delay-1200"></div>

      <div class="max-w-4xl mx-auto px-6 text-center">
        <div 
          class="inline-flex items-center px-4 py-1.5 mb-6 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-blue-200/50 dark:border-blue-800/50 text-blue-600 dark:text-blue-400 text-sm font-semibold tracking-wide transition-all duration-500 transform"
          :class="headerVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'"
        >
          <span class="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-ping absolute"></span>
          <span class="relative"> {{ t('landing.badge') }}</span>
        </div>
        
        <h1 
          class="text-5xl md:text-7xl font-bold text-gray-900 dark:text-white mb-8 tracking-tight leading-tight transition-all duration-700 delay-100"
          :class="headerVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'"
        >
          {{ t('landing.hero_title_1') }} <br class="hidden md:block" />
          <span class="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-600 animate-gradient-x">
            {{ t('landing.hero_title_2') }}
          </span>
        </h1>
        
        <p 
          class="text-lg md:text-xl text-gray-600 dark:text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed transition-all duration-700 delay-200"
          :class="headerVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'"
        >
          {{ t('landing.hero_desc') }}
        </p>

        <div 
          class="flex flex-col sm:flex-row justify-center gap-4 transition-all duration-700 delay-300"
          :class="headerVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'"
        >
          <NuxtLink 
            to="/login" 
            class="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-2xl shadow-2xl shadow-blue-500/30 transition-all duration-500 hover:-translate-y-1 hover:shadow-3xl overflow-hidden"
          >
            <span class="relative z-10 flex items-center justify-center">
              {{ t('landing.cta_primary') }}
              <span class="ml-2 group-hover:translate-x-1 transition-transform duration-300">→</span>
            </span>
            <div class="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div class="absolute inset-0 bg-white/10 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
          </NuxtLink>
          
          <button 
            @click="scrollToFeatures" 
            class="group px-8 py-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 text-gray-700 dark:text-gray-200 font-semibold rounded-2xl hover:bg-white dark:hover:bg-gray-700 transition-all duration-500 hover:-translate-y-1 shadow-lg hover:shadow-xl overflow-hidden relative"
          >
            <span class="relative z-10">{{ t('landing.cta_secondary') }}</span>
            <div class="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </button>
        </div>
      </div>
    </header>

    <section id="fitur" class="py-24 bg-white/50 dark:bg-gray-800/30 backdrop-blur-sm relative border-t border-gray-100/50 dark:border-gray-800/50 overflow-hidden">
      <div class="absolute inset-0 bg-gradient-to-b from-transparent via-blue-50/30 to-transparent dark:via-blue-900/10 -z-10"></div>
      
      <div class="max-w-7xl mx-auto px-6">
        <div class="text-center mb-20">
          <h2 
            class="text-4xl font-bold text-gray-900 dark:text-white mb-4 transition-all duration-700"
            :class="featuresVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'"
          >
            {{ t('landing.features_title') }}
          </h2>
          <p 
            class="text-gray-500 dark:text-gray-400 text-lg transition-all duration-700 delay-100"
            :class="featuresVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'"
          >
            {{ t('landing.features_subtitle') }}
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div 
            v-for="(feature, index) in features" 
            :key="index"
            class="group p-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl border border-gray-100/50 dark:border-gray-700/50 hover:border-transparent transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 overflow-hidden relative"
            :class="[
              featuresVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0',
              `hover:shadow-${feature.gradient.split(' ')[1]}/20`
            ]"
            :style="`transition-delay: ${index * 100}ms`"
          >
            <div class="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-5 transition-opacity duration-500" :class="feature.gradient"></div>
            
            <div class="absolute inset-0 rounded-3xl bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-500" :class="feature.gradient">
              <div class="absolute inset-[2px] rounded-3xl bg-white dark:bg-gray-800"></div>
            </div>

            <div class="relative z-10">
              <div 
                class="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl mb-6 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-lg"
                :class="[feature.color, 'text-white']"
              >
                {{ feature.icon }}
              </div>
              <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-transparent group-hover:bg-clip-text transition-all duration-300" :class="`group-hover:bg-gradient-to-r ${feature.gradient}`">
                {{ feature.title }}
              </h3>
              <p class="text-gray-500 dark:text-gray-400 leading-relaxed text-sm group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors duration-300">
                {{ feature.description }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section 
      v-if="importantLinks && importantLinks.length > 0" 
      id="tautan-penting" 
      class="py-20 relative overflow-hidden"
    >
      <div class="max-w-7xl mx-auto px-6">
        <div class="text-center mb-16">
          <h2 
            class="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4 transition-all duration-700"
            :class="linksVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'"
          >
            {{ t('landing.links_title') }}
          </h2>
          <p 
            class="text-gray-500 dark:text-gray-400 transition-all duration-700 delay-100"
            :class="linksVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'"
          >
            {{ t('landing.links_subtitle') }}
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <a 
            v-for="(link, index) in importantLinks" 
            :key="link.id"
            :href="link.url"
            target="_blank"
            rel="noopener noreferrer"
            class="group relative p-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
            :class="linksVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'"
            :style="`transition-delay: ${index * 100}ms`"
          >
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <span 
                  v-if="link.category"
                  class="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-3 transition-colors"
                  :class="getCategoryColor(link.categoryId)"
                >
                  {{ link.category.name }}
                </span>
                <h3 class="text-lg font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {{ link.title }}
                </h3>
                <p class="text-sm text-gray-400 mt-2 truncate">
                  {{ link.url }}
                </p>
              </div>
              <div class="w-10 h-10 rounded-full bg-gray-50 dark:bg-gray-700 flex items-center justify-center text-gray-400 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 transform group-hover:rotate-45 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </div>
            </div>
          </a>
        </div>
      </div>
    </section>

    <footer class="py-12 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-t border-gray-100/50 dark:border-gray-800/50">
      <div class="max-w-7xl mx-auto px-6">
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          
          <div class="space-y-4">
            <div class="flex items-center gap-3 group cursor-pointer w-fit">
              <div class="relative">
                <img 
                  src="/logo4.png" 
                  alt="Logo" 
                  class="h-10 w-auto opacity-90 group-hover:opacity-100 transition-all duration-300 group-hover:scale-110 drop-shadow-lg"
                />
              </div>
              <span class="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                
              </span>
            </div>
          </div>

          <div class="md:flex md:justify-end">
            <div class="space-y-4 text-gray-500 dark:text-gray-400 text-sm max-w-sm">
              <div class="flex items-start gap-3">
                 <div class="mt-0.5 flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                       <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                 </div>
                 <p class="leading-relaxed">
                   {{ $t('landing.footer_address_1') }}<br>
                   {{ $t('landing.footer_address_2') }}<br>
                   {{ $t('landing.footer_address_3') }}
                 </p>
              </div>
              <div class="flex items-center gap-3">
                 <div class="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                 </div>
                 <p class="font-medium tracking-wide">(0771) 4442004</p>
              </div>
            </div>
          </div>

        </div>
        
        <div class="border-t border-gray-200/50 dark:border-gray-700/50 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p class="text-gray-500 text-sm text-center md:text-left">
              &copy; 2025 {{ $t('landing.footer_copyright') }}
            </p>
            <p class="text-gray-500 text-sm text-center md:text-right group">
               <span class="inline-block group-hover:scale-110 transition-transform duration-300">{{ $t('landing.footer_made_by') }}</span> 
               @RiperHilmi.
            </p>
        </div>

      </div>
    </footer>

  </div>
</template>

<style scoped>
@keyframes fadeInUp {
  from { 
    opacity: 0; 
    transform: translateY(20px); 
  }
  to { 
    opacity: 1; 
    transform: translateY(0); 
  }
}

@keyframes float {
  0%, 100% { 
    transform: translateY(0px) rotate(0deg); 
  }
  50% { 
    transform: translateY(-20px) rotate(5deg); 
  }
}

@keyframes gradient {
  0% { 
    background-position: 0% 50%; 
  }
  50% { 
    background-position: 100% 50%; 
  }
  100% { 
    background-position: 0% 50%; 
  }
}

@keyframes pulse-slow {
  0%, 100% { 
    opacity: 0.1; 
  }
  50% { 
    opacity: 0.15; 
  }
}

.animate-fade-in-up { 
  animation: fadeInUp 0.8s ease-out forwards; 
  opacity: 0; 
}

.animate-float { 
  animation: float 6s ease-in-out infinite; 
}

.animate-gradient-x {
  background-size: 200% 200%;
  animation: gradient 3s ease infinite;
}

.animate-pulse-slow {
  animation: pulse-slow 4s ease-in-out infinite;
}

.delay-100 { animation-delay: 0.1s; }
.delay-200 { animation-delay: 0.2s; }
.delay-300 { animation-delay: 0.3s; }
.delay-500 { animation-delay: 0.5s; }
.delay-700 { animation-delay: 0.7s; }
.delay-1000 { animation-delay: 1s; }
.delay-1200 { animation-delay: 1.2s; }

/* Custom shadow for better depth */
.shadow-3xl {
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

/* Smooth scrolling */
html {
  scroll-behavior: smooth;
}

/* Selection styles */
::selection {
  background: rgba(59, 130, 246, 0.3);
}
</style>
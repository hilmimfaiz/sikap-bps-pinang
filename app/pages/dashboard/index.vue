<script setup lang="ts">
import { computed } from 'vue'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale
} from 'chart.js'
import { Bar } from 'vue-chartjs'

definePageMeta({
  layout: 'dashboard',
  middleware: 'auth'
})

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const { t } = useI18n()
const localePath = useLocalePath()
const user = useCookie<any>('user_data')
const { data: stats, pending, error } = await useFetch('/api/dashboard/stats')

const isAdmin = computed(() => user.value?.role === 'admin')
const showGuideModal = ref(false)

const guideContent = computed(() => {
  const role = user.value?.role || 'viewer'
  if (role === 'admin') return { text: t('dashboard.guide.admin_content'), file: '/files/guide_admin.pdf' }
  if (role === 'editor') return { text: t('dashboard.guide.editor_content'), file: '/files/guide_editor.pdf' }
  return { text: t('dashboard.guide.viewer_content'), file: '/files/guide_viewer.pdf' }
})

const colorMode = useColorMode()
const chartTextColor = computed(() => colorMode.value === 'dark' ? '#e5e7eb' : '#374151')

// Chart Data
const chartData = computed(() => {
  return {
    labels: [
      t('dashboard.stats.users'), 
      t('dashboard.stats.categories'), 
      t('dashboard.stats.active_links'), 
      t('dashboard.stats.inactive_links')
    ],
    datasets: [
      {
        label: 'Total',
        backgroundColor: ['#3b82f6', '#f97316', '#22c55e', '#ef4444'],
        data: [
          stats.value?.totalUsers || 0,
          stats.value?.totalCategories || 0,
          stats.value?.activeLinks || 0,
          stats.value?.inactiveLinks || 0
        ],
        borderRadius: 8,
        barThickness: 48,
        borderWidth: 2,
        borderColor: colorMode.value === 'dark' ? '#1f2937' : '#ffffff'
      }
    ]
  }
})

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: { 
    legend: { display: false },
    tooltip: {
      backgroundColor: colorMode.value === 'dark' ? '#1f2937' : '#ffffff',
      titleColor: colorMode.value === 'dark' ? '#e5e7eb' : '#374151',
      bodyColor: colorMode.value === 'dark' ? '#e5e7eb' : '#374151',
      borderColor: colorMode.value === 'dark' ? '#374151' : '#e5e7eb',
      borderWidth: 1,
      cornerRadius: 8,
      displayColors: true,
      boxPadding: 6
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: { 
        stepSize: 1, 
        color: chartTextColor.value,
        font: { size: 12 }
      },
      grid: { 
        color: colorMode.value === 'dark' ? '#374151' : '#f3f4f6',
        drawBorder: false
      }
    },
    x: {
      ticks: { 
        color: chartTextColor.value,
        font: { size: 11 }
      },
      grid: { display: false }
    }
  },
  animation: {
    duration: 1500,
    easing: 'easeOutQuart'
  }
}))

// Animation states
const statsVisible = ref(false)
const cardsVisible = ref(false)

onMounted(() => {
  setTimeout(() => {
    statsVisible.value = true
  }, 300)
  
  setTimeout(() => {
    cardsVisible.value = true
  }, 600)
})

// Close modal with escape key
const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && showGuideModal.value) {
    showGuideModal.value = false
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <div class="p-6 animate-fade-in">
    
    <!-- Header Section -->
    <div class="mb-8 animate-slide-down relative overflow-hidden">
      <div class="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-full blur-xl"></div>
      <h1 class="text-3xl font-bold bg-gradient-to-r from-gray-800 to-blue-700 dark:from-white dark:to-blue-400 bg-clip-text text-transparent tracking-tight mb-2">
        {{ $t('menu.dashboard') }}
      </h1>
      <p class="text-gray-600 dark:text-gray-400 text-lg transition-colors max-w-2xl">
        {{ $t('dashboard.welcome') }}, <span class="font-semibold text-blue-600 dark:text-blue-400 bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent">{{ user?.name || 'Pengguna' }}</span>! {{ $t('dashboard.subtitle') }}
      </p>
    </div>

    <!-- Stats Section -->
    <div v-if="isAdmin" class="animate-fade-up delay-100">
      <div v-if="pending" class="py-16 flex justify-center">
        <div class="relative">
          <div class="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
          <div class="absolute inset-0 animate-ping w-12 h-12 border-4 border-blue-500/30 rounded-full"></div>
        </div>
      </div>
      
      <div v-else-if="error" class="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/10 backdrop-blur-sm border border-red-200 dark:border-red-800 p-6 rounded-2xl mb-8 text-red-600 dark:text-red-400 shadow-lg">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center text-red-500">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <div>
            <h3 class="font-semibold">Gagal memuat statistik</h3>
            <p class="text-sm opacity-80">Silakan refresh halaman atau coba lagi nanti</p>
          </div>
        </div>
      </div>

      <div v-else>
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
          
          <!-- Chart Container -->
          <div class="lg:col-span-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl p-6 rounded-2xl shadow-xl border border-gray-100/50 dark:border-gray-700/50 flex flex-col transition-all duration-500 hover:shadow-2xl group overflow-hidden">
            <!-- Chart Background Effects -->
            <div class="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-cyan-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            <h3 class="font-bold text-lg bg-gradient-to-r from-gray-800 to-blue-700 dark:from-white dark:to-blue-400 bg-clip-text text-transparent mb-6 relative z-10">
              {{ $t('dashboard.chart_title') }}
            </h3>
            <div class="flex-1 w-full min-h-[280px] relative z-10">
              <ClientOnly>
                <Bar 
                  :data="chartData" 
                  :options="chartOptions" 
                  class="transition-all duration-500 group-hover:scale-[1.02]"
                />
              </ClientOnly>
            </div>
          </div>

          <!-- Stats Cards -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
            <TransitionGroup name="stats-list">
              <div 
                v-if="statsVisible"
                class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl p-5 rounded-xl shadow-lg border border-gray-100/50 dark:border-gray-700/50 flex items-center gap-4 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-500 hover:-translate-y-1 group overflow-hidden"
              >
                <div class="relative">
                  <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white flex items-center justify-center text-lg shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform duration-300">
                    👥
                  </div>
                  <div class="absolute -inset-1 bg-blue-500/20 rounded-xl blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                <div class="flex-1">
                  <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">{{ $t('dashboard.stats.users') }}</p>
                  <h3 class="text-xl font-bold text-gray-800 dark:text-white">{{ stats?.totalUsers || 0 }}</h3>
                </div>
              </div>

              <div 
                v-if="statsVisible"
                class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl p-5 rounded-xl shadow-lg border border-gray-100/50 dark:border-gray-700/50 flex items-center gap-4 hover:border-orange-300 dark:hover:border-orange-600 transition-all duration-500 hover:-translate-y-1 group overflow-hidden delay-100"
              >
                <div class="relative">
                  <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 text-white flex items-center justify-center text-lg shadow-lg shadow-orange-500/30 group-hover:scale-110 transition-transform duration-300">
                    🏷️
                  </div>
                  <div class="absolute -inset-1 bg-orange-500/20 rounded-xl blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                <div class="flex-1">
                  <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">{{ $t('dashboard.stats.categories') }}</p>
                  <h3 class="text-xl font-bold text-gray-800 dark:text-white">{{ stats?.totalCategories || 0 }}</h3>
                </div>
              </div>

              <div 
                v-if="statsVisible"
                class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl p-5 rounded-xl shadow-lg border border-gray-100/50 dark:border-gray-700/50 flex items-center gap-4 hover:border-green-300 dark:hover:border-green-600 transition-all duration-500 hover:-translate-y-1 group overflow-hidden delay-200"
              >
                <div class="relative">
                  <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 text-white flex items-center justify-center text-lg shadow-lg shadow-green-500/30 group-hover:scale-110 transition-transform duration-300">
                    ✅
                  </div>
                  <div class="absolute -inset-1 bg-green-500/20 rounded-xl blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                <div class="flex-1">
                  <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">{{ $t('dashboard.stats.active_links') }}</p>
                  <h3 class="text-xl font-bold text-gray-800 dark:text-white">{{ stats?.activeLinks || 0 }}</h3>
                </div>
              </div>

              <div 
                v-if="statsVisible"
                class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl p-5 rounded-xl shadow-lg border border-gray-100/50 dark:border-gray-700/50 flex items-center gap-4 hover:border-red-300 dark:hover:border-red-600 transition-all duration-500 hover:-translate-y-1 group overflow-hidden delay-300"
              >
                <div class="relative">
                  <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-pink-500 text-white flex items-center justify-center text-lg shadow-lg shadow-red-500/30 group-hover:scale-110 transition-transform duration-300">
                    ⛔
                  </div>
                  <div class="absolute -inset-1 bg-red-500/20 rounded-xl blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                <div class="flex-1">
                  <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">{{ $t('dashboard.stats.inactive_links') }}</p>
                  <h3 class="text-xl font-bold text-gray-800 dark:text-white">{{ stats?.inactiveLinks || 0 }}</h3>
                </div>
              </div>
            </TransitionGroup>
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Access Section -->
    <div class="mb-8">
      <h2 class="text-2xl font-bold bg-gradient-to-r from-gray-800 to-blue-700 dark:from-white dark:to-blue-400 bg-clip-text text-transparent mb-6 animate-fade-up delay-200">
        {{ $t('dashboard.quick_access') }}
      </h2>
      
      <TransitionGroup name="cards-grid" tag="div" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        <NuxtLink 
          v-if="cardsVisible"
          :to="localePath('/dashboard/profile')" 
          class="group bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl p-6 rounded-2xl shadow-xl border border-gray-100/50 dark:border-gray-700/50 hover:border-pink-400 dark:hover:border-pink-500 hover:shadow-2xl transition-all duration-500 cursor-pointer hover:-translate-y-2 overflow-hidden relative"
        >
          <!-- Background Effects -->
          <div class="absolute inset-0 bg-gradient-to-br from-pink-500/5 via-rose-500/5 to-fuchsia-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          
          <div class="relative z-10">
            <div class="mb-4 w-14 h-14 bg-gradient-to-br from-pink-500 to-rose-500 text-white rounded-2xl flex items-center justify-center text-xl shadow-lg shadow-pink-500/30 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
              👤
            </div>
            <h3 class="text-lg font-bold text-gray-800 dark:text-white mb-2 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-pink-600 group-hover:to-rose-600 group-hover:bg-clip-text transition-all duration-300">
              {{ $t('menu.profile') }}
            </h3>
            <p class="text-gray-600 dark:text-gray-400 leading-relaxed mb-4 text-sm min-h-[48px]">
              {{ $t('dashboard.cards.profile_desc') }}
            </p>
            <div class="text-pink-600 dark:text-pink-400 text-sm font-semibold flex items-center gap-2 group-hover:gap-3 transition-all duration-300">
              {{ $t('dashboard.cards.action_view') }} {{ $t('menu.profile') }}
              <svg class="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
              </svg>
            </div>
          </div>
        </NuxtLink>

        <NuxtLink 
          v-if="cardsVisible"
          :to="localePath('/dashboard/archives')" 
          class="group bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl p-6 rounded-2xl shadow-xl border border-gray-100/50 dark:border-gray-700/50 hover:border-purple-400 dark:hover:border-purple-500 hover:shadow-2xl transition-all duration-500 cursor-pointer hover:-translate-y-2 overflow-hidden relative"
        >
          <div class="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-violet-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          
          <div class="relative z-10">
            <div class="mb-4 w-14 h-14 bg-gradient-to-br from-purple-500 to-violet-500 text-white rounded-2xl flex items-center justify-center text-xl shadow-lg shadow-purple-500/30 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
              📂
            </div>
            <h3 class="text-lg font-bold text-gray-800 dark:text-white mb-2 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-purple-600 group-hover:to-violet-600 group-hover:bg-clip-text transition-all duration-300">
              {{ $t('menu.archives') }}
            </h3>
            <p class="text-gray-600 dark:text-gray-400 leading-relaxed mb-4 text-sm min-h-[48px]">
              {{ $t('dashboard.cards.archives_desc') }}
            </p>
            <div class="text-purple-600 dark:text-purple-400 text-sm font-semibold flex items-center gap-2 group-hover:gap-3 transition-all duration-300">
              {{ $t('dashboard.cards.action_open') }} {{ $t('menu.archives') }}
              <svg class="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
              </svg>
            </div>
          </div>
        </NuxtLink>

        <NuxtLink 
          v-if="cardsVisible && isAdmin"
          :to="localePath('/dashboard/users')" 
          class="group bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl p-6 rounded-2xl shadow-xl border border-gray-100/50 dark:border-gray-700/50 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-2xl transition-all duration-500 cursor-pointer hover:-translate-y-2 overflow-hidden relative"
        >
          <div class="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-cyan-500/5 to-sky-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          
          <div class="relative z-10">
            <div class="mb-4 w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 text-white rounded-2xl flex items-center justify-center text-xl shadow-lg shadow-blue-500/30 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
              👥
            </div>
            <h3 class="text-lg font-bold text-gray-800 dark:text-white mb-2 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-cyan-600 group-hover:bg-clip-text transition-all duration-300">
              {{ $t('menu.users') }}
            </h3>
            <p class="text-gray-600 dark:text-gray-400 leading-relaxed mb-4 text-sm min-h-[48px]">
              {{ $t('dashboard.cards.users_desc') }}
            </p>
            <div class="text-blue-600 dark:text-blue-400 text-sm font-semibold flex items-center gap-2 group-hover:gap-3 transition-all duration-300">
              {{ $t('dashboard.cards.action_manage') }} User
              <svg class="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
              </svg>
            </div>
          </div>
        </NuxtLink>

        <NuxtLink 
          v-if="cardsVisible"
          :to="localePath('/dashboard/categories')" 
          class="group bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl p-6 rounded-2xl shadow-xl border border-gray-100/50 dark:border-gray-700/50 hover:border-orange-400 dark:hover:border-orange-500 hover:shadow-2xl transition-all duration-500 cursor-pointer hover:-translate-y-2 overflow-hidden relative"
        >
          <div class="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-amber-500/5 to-yellow-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          
          <div class="relative z-10">
            <div class="mb-4 w-14 h-14 bg-gradient-to-br from-orange-500 to-amber-500 text-white rounded-2xl flex items-center justify-center text-xl shadow-lg shadow-orange-500/30 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
              🏷️
            </div>
            <h3 class="text-lg font-bold text-gray-800 dark:text-white mb-2 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-orange-600 group-hover:to-amber-600 group-hover:bg-clip-text transition-all duration-300">
              {{ $t('menu.categories') }}
            </h3>
            <p class="text-gray-600 dark:text-gray-400 leading-relaxed mb-4 text-sm min-h-[48px]">
              {{ $t('dashboard.cards.categories_desc') }}
            </p>
            <div class="text-orange-600 dark:text-orange-400 text-sm font-semibold flex items-center gap-2 group-hover:gap-3 transition-all duration-300">
              {{ $t('dashboard.cards.action_manage') }} {{ $t('menu.categories') }}
              <svg class="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
              </svg>
            </div>
          </div>
        </NuxtLink>

        <NuxtLink 
          v-if="cardsVisible"
          :to="localePath('/dashboard/links')" 
          class="group bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl p-6 rounded-2xl shadow-xl border border-gray-100/50 dark:border-gray-700/50 hover:border-green-400 dark:hover:border-green-500 hover:shadow-2xl transition-all duration-500 cursor-pointer hover:-translate-y-2 overflow-hidden relative"
        >
          <div class="absolute inset-0 bg-gradient-to-br from-green-500/5 via-emerald-500/5 to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          
          <div class="relative z-10">
            <div class="mb-4 w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-500 text-white rounded-2xl flex items-center justify-center text-xl shadow-lg shadow-green-500/30 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
              🔗
            </div>
            <h3 class="text-lg font-bold text-gray-800 dark:text-white mb-2 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-green-600 group-hover:to-emerald-600 group-hover:bg-clip-text transition-all duration-300">
              {{ $t('menu.links') }}
            </h3>
            <p class="text-gray-600 dark:text-gray-400 leading-relaxed mb-4 text-sm min-h-[48px]">
              {{ $t('dashboard.cards.links_desc') }}
            </p>
            <div class="text-green-600 dark:text-green-400 text-sm font-semibold flex items-center gap-2 group-hover:gap-3 transition-all duration-300">
              {{ $t('dashboard.cards.action_manage') }} {{ $t('menu.links') }}
              <svg class="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
              </svg>
            </div>
          </div>
        </NuxtLink>

        <button 
          v-if="cardsVisible"
          @click="showGuideModal = true" 
          class="group bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl p-6 rounded-2xl shadow-xl border border-gray-100/50 dark:border-gray-700/50 hover:border-teal-400 dark:hover:border-teal-500 hover:shadow-2xl transition-all duration-500 cursor-pointer text-left w-full hover:-translate-y-2 overflow-hidden relative"
        >
          <div class="absolute inset-0 bg-gradient-to-br from-teal-500/5 via-cyan-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          
          <div class="relative z-10">
            <div class="mb-4 w-14 h-14 bg-gradient-to-br from-teal-500 to-cyan-500 text-white rounded-2xl flex items-center justify-center text-xl shadow-lg shadow-teal-500/30 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
              📖
            </div>
            <h3 class="text-lg font-bold text-gray-800 dark:text-white mb-2 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-teal-600 group-hover:to-cyan-600 group-hover:bg-clip-text transition-all duration-300">
              {{ $t('dashboard.guide.title') }}
            </h3>
            <p class="text-gray-600 dark:text-gray-400 leading-relaxed mb-4 text-sm min-h-[48px]">
              {{ $t('dashboard.cards.guide_desc') }}
            </p>
            <div class="text-teal-600 dark:text-teal-400 text-sm font-semibold flex items-center gap-2 group-hover:gap-3 transition-all duration-300">
              {{ $t('dashboard.cards.action_read') }}
              <svg class="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
              </svg>
            </div>
          </div>
        </button>

      </TransitionGroup>
    </div>

    <!-- Compact Guide Modal -->
    <Teleport to="body">
      <Transition 
        enter-active-class="transition-all duration-300 ease-out" 
        enter-from-class="opacity-0 scale-95" 
        enter-to-class="opacity-100 scale-100"
        leave-active-class="transition-all duration-200 ease-in" 
        leave-from-class="opacity-100 scale-100" 
        leave-to-class="opacity-0 scale-95"
      >
        <div 
          v-if="showGuideModal" 
          class="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          @click.self="showGuideModal = false"
        >
          <!-- Backdrop -->
          <div class="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
          
          <!-- Modal Container -->
          <div class="relative w-full max-w-md pointer-events-auto">
            <!-- Main Modal Content -->
            <div class="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/30 dark:border-gray-700/50 overflow-hidden transform transition-all duration-300">
              
              <!-- Header Section -->
              <div class="relative p-6 border-b border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-r from-gray-50/50 to-teal-50/50 dark:from-gray-800/50 dark:to-teal-900/20">
                <div class="flex items-start justify-between">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-xl flex items-center justify-center text-white text-lg shadow-lg shadow-teal-500/30">
                      📖
                    </div>
                    <div>
                      <h3 class="text-lg font-bold text-gray-800 dark:text-white">
                        {{ $t('dashboard.guide.title') }}
                      </h3>
                      <p class="text-xs text-teal-600 dark:text-teal-400 font-semibold uppercase tracking-wider mt-1 flex items-center gap-1">
                        <span class="w-1.5 h-1.5 bg-teal-500 rounded-full"></span>
                        {{ user.role }} Guide
                      </p>
                    </div>
                  </div>
                  <button 
                    @click="showGuideModal = false" 
                    class="flex-shrink-0 w-8 h-8 rounded-lg bg-gray-100/80 dark:bg-gray-800/80 hover:bg-red-100 dark:hover:bg-red-900/50 text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-all duration-200 flex items-center justify-center hover:scale-110 border border-gray-200/50 dark:border-gray-700/50"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                  </button>
                </div>
              </div>

              <!-- Content Section -->
              <div class="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                <div class="space-y-4">
                  <div class="bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/10 rounded-lg p-4 border border-teal-200/50 dark:border-teal-700/30">
                    <p class="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                      {{ guideContent.text }}
                    </p>
                  </div>
                  
                  <!-- Feature Highlights -->
                  <div class="grid grid-cols-1 gap-2">
                    <div class="flex items-center gap-2 p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg border border-gray-200/50 dark:border-gray-700/30">
                      <div class="w-6 h-6 bg-green-500/10 rounded-md flex items-center justify-center text-green-600 dark:text-green-400">
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                        </svg>
                      </div>
                      <span class="text-xs font-medium text-gray-700 dark:text-gray-300">Step-by-step instructions</span>
                    </div>
                    <div class="flex items-center gap-2 p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg border border-gray-200/50 dark:border-gray-700/30">
                      <div class="w-6 h-6 bg-blue-500/10 rounded-md flex items-center justify-center text-blue-600 dark:text-blue-400">
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                        </svg>
                      </div>
                      <span class="text-xs font-medium text-gray-700 dark:text-gray-300">Quick start guide</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Action Section -->
              <div class="p-6 bg-gradient-to-r from-gray-50/50 to-teal-50/50 dark:from-gray-800/50 dark:to-teal-900/20 border-t border-gray-200/50 dark:border-gray-700/50">
                <div class="flex flex-col gap-3">
                  <div class="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    <span>Updated: Jan 2025 • PDF Format</span>
                  </div>
                  <a 
                    :href="guideContent.file" 
                    download
                    target="_blank"
                    class="group relative bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white px-4 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2 justify-center overflow-hidden text-sm"
                  >
                    <!-- Animated background -->
                    <div class="absolute inset-0 bg-gradient-to-r from-white/20 to-white/10 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                    
                    <!-- Icon -->
                    <div class="relative z-10 w-4 h-4 transition-transform duration-300 group-hover:scale-110">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                      </svg>
                    </div>
                    
                    <!-- Text -->
                    <span class="relative z-10 text-xs font-semibold tracking-wide">
                      {{ $t('dashboard.guide.download_btn') }}
                    </span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

  </div>
</template>

<style scoped>
/* Modern Animations */
.animate-fade-in { 
  animation: fadeIn 1s cubic-bezier(0.22, 0.61, 0.36, 1) forwards; 
}

.animate-slide-down { 
  animation: slideDown 0.8s cubic-bezier(0.22, 0.61, 0.36, 1) forwards; 
}

.animate-fade-up { 
  animation: fadeUp 1s cubic-bezier(0.22, 0.61, 0.36, 1) forwards; 
  opacity: 0; 
}

.delay-100 { animation-delay: 0.1s; }
.delay-200 { animation-delay: 0.2s; }

@keyframes fadeIn { 
  from { opacity: 0; } 
  to { opacity: 1; } 
}

@keyframes slideDown { 
  from { 
    opacity: 0; 
    transform: translateY(-30px) scale(0.95); 
  } 
  to { 
    opacity: 1; 
    transform: translateY(0) scale(1); 
  } 
}

@keyframes fadeUp { 
  from { 
    opacity: 0; 
    transform: translateY(40px) scale(0.9); 
  } 
  to { 
    opacity: 1; 
    transform: translateY(0) scale(1); 
  } 
}

/* Stats List Animation */
.stats-list-enter-active,
.stats-list-leave-active {
  transition: all 0.6s cubic-bezier(0.22, 0.61, 0.36, 1);
}
.stats-list-enter-from {
  opacity: 0;
  transform: translateY(30px) scale(0.9);
}
.stats-list-leave-to {
  opacity: 0;
  transform: translateY(-30px) scale(0.9);
}

/* Cards Grid Animation */
.cards-grid-enter-active,
.cards-grid-leave-active {
  transition: all 0.8s cubic-bezier(0.22, 0.61, 0.36, 1);
}
.cards-grid-enter-from {
  opacity: 0;
  transform: translateY(50px) scale(0.8) rotateX(-10deg);
}
.cards-grid-leave-to {
  opacity: 0;
  transform: translateY(-50px) scale(0.8) rotateX(10deg);
}
.cards-grid-move {
  transition: transform 0.8s ease;
}

/* Premium Shadows */
.shadow-2xl {
  box-shadow: 
    0 20px 25px -5px rgba(0, 0, 0, 0.1),
    0 10px 10px -5px rgba(0, 0, 0, 0.04),
    0 0 0 1px rgba(255, 255, 255, 0.1);
}

/* Custom Scrollbar */
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 8px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.3);
}

.dark .custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
}

.dark .custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
}

.dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* Enhanced Glass Morphism */
.backdrop-blur-xl {
  backdrop-filter: blur(20px);
}

/* Smooth transitions */
* {
  transition-property: color, background-color, border-color, transform, box-shadow, opacity;
  transition-duration: 500ms;
  transition-timing-function: cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

/* Enhanced hover effects */
.group:hover .group-hover\:scale-110 {
  transform: scale(1.1);
}

.group:hover .group-hover\:rotate-6 {
  transform: rotate(6deg);
}

/* Mobile responsiveness enhancements */
@media (max-width: 768px) {
  .grid-cols-1 {
    grid-template-columns: 1fr;
  }
  
  .gap-6 {
    gap: 1rem;
  }
  
  .p-6 {
    padding: 1.25rem;
  }
}

/* Compact card adjustments */
.min-h-\[48px\] {
  min-height: 48px;
}

.min-h-\[280px\] {
  min-height: 280px;
}
</style>
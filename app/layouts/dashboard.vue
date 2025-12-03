<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useCookie } from '#app'

// --- STATE & UTILS ---
const route = useRoute()
const token = useCookie('auth_token')
const userCookie = useCookie<any>('user_data')
const { startLoading, stopLoading } = useGlobalLoading()
const { t } = useI18n() 
const localePath = useLocalePath()

const isDesktopSidebarOpen = ref(true)
const isMobileSidebarOpen = ref(false)
const showLogoutConfirm = ref(false)
const showProfileMenu = ref(false)

// --- DATA USER ---
const user = computed(() => {
  const d = userCookie.value
  let displayRole = d?.role || 'viewer'
  if (displayRole === 'admin') displayRole = 'Admin' 

  return {
    name: d?.name || 'Pengguna',
    role: displayRole, 
    photo: d?.photoProfile || null,
    initial: d?.name?.charAt(0).toUpperCase() || 'U'
  }
})

// --- MENU DATA ---
const menuGroups = computed(() => {
  const groups = [
    {
      title: t('groups.main'), 
      items: [
        { name: t('menu.profile'), path: '/dashboard/profile', icon: 'user' },
        { name: t('menu.dashboard'), path: '/dashboard', icon: 'home' }
      ]
    },
    {
      title: t('groups.management'),
      items: [
        { name: t('menu.users'), path: '/dashboard/users', icon: 'users', adminOnly: true },
        { name: t('menu.categories'), path: '/dashboard/categories', icon: 'tag' },
        { name: t('menu.links'), path: '/dashboard/links', icon: 'link' }
      ]
    },
    {
      title: t('groups.storage'),
      items: [
        { name: t('menu.archives'), path: '/dashboard/archives', icon: 'folder' }
      ]
    }
  ]

  return groups.map(group => ({
    ...group,
    items: group.items.filter(item => {
      if (item.adminOnly && userCookie.value?.role !== 'admin') return false
      return true
    })
  })).filter(group => group.items.length > 0)
})

// --- ACTIONS ---
const toggleDesktopSidebar = () => { 
  isDesktopSidebarOpen.value = !isDesktopSidebarOpen.value 
}
const toggleMobileSidebar = () => { 
  isMobileSidebarOpen.value = !isMobileSidebarOpen.value 
}
const toggleProfileMenu = () => { 
  showProfileMenu.value = !showProfileMenu.value 
}
const closeProfileMenu = () => { 
  showProfileMenu.value = false 
}

const onLogoutClick = () => {
  closeProfileMenu()
  showLogoutConfirm.value = true
}

const confirmLogout = async () => {
  showLogoutConfirm.value = false
  startLoading(t('common.loading'))
  token.value = null
  userCookie.value = null
  await stopLoading()
  window.location.href = '/login'
}

const isActive = (path: string) => {
  const currentPath = route.path
  if (path === '/dashboard') {
     return /\/([a-z]{2}\/)?dashboard$/.test(currentPath)
  }
  return currentPath.includes(path)
}
</script>

<template>
  <div 
    class="flex h-screen bg-gray-50 dark:bg-gray-950 font-sans font-medium text-gray-800 dark:text-gray-100 overflow-hidden"
    @click="closeProfileMenu"
  >
    
    <div 
      class="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden transition-opacity duration-300 ease-in-out"
      :class="isMobileSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'"
      @click.stop="isMobileSidebarOpen = false"
    ></div>

    <aside 
      class="fixed inset-y-0 left-0 z-50 h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 shadow-xl lg:shadow-none flex flex-col transition-[width,transform] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] overflow-hidden lg:static"
      :class="[
        // Mobile: Slide in/out
        isMobileSidebarOpen ? 'translate-x-0 w-72' : '-translate-x-full w-72',
        
        // Desktop: Width Resize (0 to 72)
        isDesktopSidebarOpen ? 'lg:translate-x-0 lg:w-72' : 'lg:translate-x-0 lg:w-0 lg:border-r-0'
      ]"
      @click.stop 
    >
      <div class="w-72 flex flex-col h-full min-w-[18rem]">
        
        <div class="h-20 flex items-center justify-between px-6 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
          <NuxtLink 
            :to="localePath('/dashboard')" 
            class="flex items-center gap-3 group"
            @click="isMobileSidebarOpen = false"
          >
            <img 
              src="/logo.png" 
              alt="Logo" 
              class="h-10 w-auto transition-transform duration-300 group-hover:scale-110 drop-shadow-sm" 
            />
          </NuxtLink>
          
          <button 
            @click="isMobileSidebarOpen = false" 
            class="lg:hidden p-2 text-gray-400 hover:text-red-500 transition-colors"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <nav class="flex-1 overflow-y-auto py-6 px-4 space-y-8 custom-scrollbar">
          <div v-for="(group, index) in menuGroups" :key="index">
            <h3 class="px-4 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">
              {{ group.title }}
            </h3>
            <ul class="space-y-1">
              <li v-for="menu in group.items" :key="menu.path">
                <NuxtLink 
                  :to="localePath(menu.path)" 
                  class="flex items-center px-4 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden"
                  :class="[
                    isActive(menu.path) 
                      ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 font-bold' 
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200 font-semibold'
                  ]"
                  @click="isMobileSidebarOpen = false" 
                >
                  <span 
                    v-if="isActive(menu.path)" 
                    class="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-600 rounded-r-full"
                  ></span>

                  <span 
                    class="mr-3 transition-transform duration-200 group-hover:scale-110 flex-shrink-0"
                    :class="isActive(menu.path) ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 group-hover:text-gray-600'"
                  >
                    <svg v-if="menu.icon === 'home'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
                    <svg v-else-if="menu.icon === 'users'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
                    <svg v-else-if="menu.icon === 'tag'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/></svg>
                    <svg v-else-if="menu.icon === 'link'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>
                    <svg v-else-if="menu.icon === 'folder'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/></svg>
                    <svg v-else-if="menu.icon === 'user'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                  </span>
                  
                  <span class="truncate">{{ menu.name }}</span>
                </NuxtLink>
              </li>
            </ul>
          </div>
        </nav>

        <div class="p-4 border-t border-gray-100 dark:border-gray-800 text-center flex-shrink-0">
          <p class="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Sikap v2.2</p>
        </div>
      </div>
    </aside>

    <div class="flex-1 flex flex-col min-w-0 bg-gray-50 dark:bg-gray-950 transition-all duration-300 ease-in-out">
      
      <header class="h-20 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center px-4 lg:px-8 shadow-sm sticky top-0 z-20">
        <div class="flex items-center gap-4">
          <button 
            @click.stop="toggleMobileSidebar" 
            class="lg:hidden p-2 -ml-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
          </button>

          <button 
            @click.stop="toggleDesktopSidebar" 
            class="hidden lg:flex p-2 -ml-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            :title="isDesktopSidebarOpen ? 'Tutup Menu' : 'Buka Menu'"
          >
            <svg 
              class="w-6 h-6 transition-transform duration-300"
              :class="!isDesktopSidebarOpen ? 'rotate-180' : ''"
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7"/>
            </svg>
          </button>
          
          <div class="hidden sm:block">
            <h1 class="text-lg font-bold text-gray-800 dark:text-white leading-tight">{{ $t('header.title') }}</h1>
            <p class="text-sm font-medium text-gray-500 dark:text-gray-400">{{ $t('header.subtitle') }}</p>
          </div>
        </div>

        <div class="flex items-center gap-2 sm:gap-4">
          <LanguageSwitcher />
          <ThemeToggle />
          <NotificationBell />

          <div class="relative ml-2">
            <button 
              @click.stop="toggleProfileMenu" 
              class="flex items-center gap-3 p-1.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
            >
              <div class="text-right hidden md:block">
                <div class="text-sm font-bold text-gray-900 dark:text-white">{{ user.name }}</div>
                <div class="text-xs text-blue-600 dark:text-blue-400 font-semibold">{{ user.role }}</div>
              </div>
              <div class="relative">
                <div class="h-10 w-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 p-0.5">
                  <div class="h-full w-full rounded-full bg-white dark:bg-gray-800 flex items-center justify-center overflow-hidden">
                    <img v-if="user.photo" :src="user.photo" class="w-full h-full object-cover" />
                    <span v-else class="text-sm font-bold text-blue-600 dark:text-blue-300">{{ user.initial }}</span>
                  </div>
                </div>
                <div class="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white dark:border-gray-900"></div>
              </div>
            </button>

            <transition 
              enter-active-class="transition duration-200 ease-out"
              enter-from-class="transform scale-95 opacity-0 -translate-y-2"
              enter-to-class="transform scale-100 opacity-100 translate-y-0"
              leave-active-class="transition duration-150 ease-in"
              leave-from-class="transform scale-100 opacity-100 translate-y-0"
              leave-to-class="transform scale-95 opacity-0 -translate-y-2"
            >
              <div v-if="showProfileMenu" class="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-100 dark:border-gray-800 py-2 z-50">
                 <div class="px-4 py-3 border-b border-gray-100 dark:border-gray-800 md:hidden">
                    <p class="text-sm font-bold text-gray-900 dark:text-white">{{ user.name }}</p>
                    <p class="text-xs text-gray-500">{{ user.role }}</p>
                 </div>
                 
                 <NuxtLink :to="localePath('/dashboard/profile')" class="block px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-blue-600 flex items-center gap-2">
                   <span>👤</span> {{ $t('menu.profile') }}
                 </NuxtLink>
                 <NuxtLink :to="localePath('/dashboard/settings')" class="block px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-blue-600 flex items-center gap-2">
                   <span>⚙️</span> {{ $t('header.settings') }}
                 </NuxtLink>
                 
                 <div class="border-t border-gray-100 dark:border-gray-800 my-1"></div>
                 
                 <button @click="onLogoutClick" class="w-full text-left px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 rounded-b-xl">
                   <span>🚪</span> {{ $t('header.logout') }}
                 </button>
              </div>
            </transition>
          </div>
        </div>
      </header>

      <main class="flex-1 overflow-y-auto p-4 lg:p-8">
        <div class="max-w-7xl mx-auto">
          <slot />
        </div>
      </main>
    </div>

    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div v-if="showLogoutConfirm" class="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="showLogoutConfirm = false"></div>
        <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm relative p-6 text-center border border-gray-200 dark:border-gray-800">
          <div class="mx-auto w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4 text-2xl">
            👋
          </div>
          <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-2">{{ $t('header.logout_title') }}</h3>
          <p class="text-gray-500 dark:text-gray-400 text-sm mb-6 font-medium">{{ $t('header.logout_desc') }}</p>
          <div class="flex gap-3">
            <button @click="showLogoutConfirm = false" class="flex-1 py-2.5 px-4 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
              {{ $t('common.cancel') }}
            </button>
            <button @click="confirmLogout" class="flex-1 py-2.5 px-4 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-500/30">
              {{ $t('header.logout') }}
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <ChatWidget />
  </div>
</template>

<style scoped>
/* Custom Scrollbar for Sidebar */
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: rgba(156, 163, 175, 0.3);
  border-radius: 20px;
}
.custom-scrollbar:hover::-webkit-scrollbar-thumb {
  background-color: rgba(156, 163, 175, 0.5);
}
</style>
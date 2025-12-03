<script setup lang="ts">
import { useToastStore } from '~/stores/toast'
const store = useToastStore()
</script>

<template>
  <div aria-live="assertive" class="fixed inset-0 flex items-start justify-end px-4 py-6 pointer-events-none sm:p-6 z-[9999]">
    <div class="flex flex-col w-full space-y-4 sm:items-end">
      <TransitionGroup 
        enter-active-class="transform ease-out duration-300 transition"
        enter-from-class="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
        enter-to-class="translate-y-0 opacity-100 sm:translate-x-0"
        leave-active-class="transition ease-in duration-100"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div 
          v-for="toast in store.items" 
          :key="toast.id" 
          class="pointer-events-auto w-full max-w-sm overflow-hidden bg-white/90 backdrop-blur-sm rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 border-l-4"
          :class="{
            'border-green-500': toast.type === 'success',
            'border-red-500': toast.type === 'error',
            'border-yellow-500': toast.type === 'warning',
            'border-blue-500': toast.type === 'info'
          }"
        >
          <div class="p-4">
            <div class="flex items-start">
              <div class="flex-shrink-0">
                <svg v-if="toast.type === 'success'" class="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <svg v-else-if="toast.type === 'error'" class="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <svg v-else class="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              
              <div class="ml-3 w-0 flex-1 pt-0.5">
                <p class="text-sm font-semibold text-gray-900 capitalize">
                  {{ toast.type === 'error' ? 'Terjadi Kesalahan' : (toast.type === 'success' ? 'Berhasil' : 'Info') }}
                </p>
                <p class="mt-1 text-sm text-gray-500">
                  {{ toast.message }}
                </p>
              </div>

              <div class="ml-4 flex flex-shrink-0">
                <button @click="store.remove(toast.id)" class="inline-flex rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none">
                  <span class="sr-only">Close</span>
                  <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </TransitionGroup>
    </div>
  </div>
</template>
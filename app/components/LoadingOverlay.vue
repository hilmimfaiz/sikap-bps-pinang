<script setup lang="ts">
defineProps({
  isLoading: {
    type: Boolean,
    default: false
  },
  message: {
    type: String,
    default: 'Memproses data...'
  }
})
</script>

<template>
  <Transition
    enter-active-class="transition-all duration-500 ease-out"
    enter-from-class="opacity-0 scale-95"
    enter-to-class="opacity-100 scale-100"
    leave-active-class="transition-all duration-300 ease-in"
    leave-from-class="opacity-100 scale-100"
    leave-to-class="opacity-0 scale-105"
  >
    <div 
      v-if="isLoading" 
      class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/30 backdrop-blur-2xl"
    >
      <!-- Main Loading Card -->
      <div class="relative bg-white/95 dark:bg-gray-900/95 p-12 rounded-3xl shadow-2xl border border-white/20 dark:border-gray-700/50 backdrop-blur-xl">
        
        <!-- Elegant Border Glow -->
        <div class="absolute -inset-0.5 bg-gradient-to-r from-blue-500/20 via-green-500/20 to-orange-500/20 rounded-3xl blur-sm opacity-60"></div>
        
        <!-- Content Container -->
        <div class="relative space-y-8">
          <!-- Wave Loading Animation -->
          <div class="flex justify-center">
            <div class="relative w-24 h-16 flex items-end justify-center space-x-1">
              <div class="w-3 bg-gradient-to-t from-blue-500 to-blue-300 rounded-t-lg animate-wave-1"></div>
              <div class="w-3 bg-gradient-to-t from-green-500 to-green-300 rounded-t-lg animate-wave-2"></div>
              <div class="w-3 bg-gradient-to-t from-orange-500 to-orange-300 rounded-t-lg animate-wave-3"></div>
              <div class="w-3 bg-gradient-to-t from-green-500 to-green-300 rounded-t-lg animate-wave-4"></div>
              <div class="w-3 bg-gradient-to-t from-blue-500 to-blue-300 rounded-t-lg animate-wave-5"></div>
            </div>
          </div>

          <!-- Text Content -->
          <div class="text-center space-y-4">
            <h3 class="text-2xl font-bold text-gray-800 dark:text-white bg-gradient-to-r from-gray-800 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              {{ message }}
            </h3>
            
            <!-- Pulsing Text -->
            <div class="flex justify-center items-center space-x-4">
              <div class="flex space-x-1">
                <div class="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse delay-0"></div>
                <div class="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse delay-300"></div>
                <div class="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse delay-600"></div>
              </div>
              <p class="text-sm text-gray-500 dark:text-gray-400 font-medium">Loading</p>
            </div>
          </div>

          <!-- Dots Progress -->
          <div class="flex justify-center">
            <div class="flex space-x-3">
              <div class="w-4 h-4 bg-blue-500 rounded-full animate-dot-bounce delay-0"></div>
              <div class="w-4 h-4 bg-green-500 rounded-full animate-dot-bounce delay-200"></div>
              <div class="w-4 h-4 bg-orange-500 rounded-full animate-dot-bounce delay-400"></div>
              <div class="w-4 h-4 bg-green-500 rounded-full animate-dot-bounce delay-600"></div>
              <div class="w-4 h-4 bg-blue-500 rounded-full animate-dot-bounce delay-800"></div>
            </div>
          </div>
        </div>

        <!-- Corner Accents -->
        <div class="absolute top-4 left-4 w-3 h-3 border-t-2 border-l-2 border-blue-500/50 rounded-tl-lg"></div>
        <div class="absolute top-4 right-4 w-3 h-3 border-t-2 border-r-2 border-green-500/50 rounded-tr-lg"></div>
        <div class="absolute bottom-4 left-4 w-3 h-3 border-b-2 border-l-2 border-orange-500/50 rounded-bl-lg"></div>
        <div class="absolute bottom-4 right-4 w-3 h-3 border-b-2 border-r-2 border-blue-500/50 rounded-br-lg"></div>
      </div>

      <!-- Background Ambient -->
      <div class="absolute inset-0 -z-10">
        <div class="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl animate-pulse-slow"></div>
        <div class="absolute bottom-1/4 right-1/4 w-64 h-64 bg-green-500/5 rounded-full blur-3xl animate-pulse-slower"></div>
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-orange-500/5 rounded-full blur-3xl animate-pulse-medium"></div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
@keyframes wave-1 {
  0%, 100% { height: 20%; }
  50% { height: 80%; }
}

@keyframes wave-2 {
  0%, 100% { height: 40%; }
  50% { height: 100%; }
}

@keyframes wave-3 {
  0%, 100% { height: 60%; }
  50% { height: 90%; }
}

@keyframes wave-4 {
  0%, 100% { height: 40%; }
  50% { height: 70%; }
}

@keyframes wave-5 {
  0%, 100% { height: 20%; }
  50% { height: 60%; }
}

@keyframes dot-bounce {
  0%, 100% { 
    transform: translateY(0px);
    opacity: 0.7;
  }
  50% { 
    transform: translateY(-8px);
    opacity: 1;
  }
}

@keyframes pulse-slow {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.6; }
}

@keyframes pulse-slower {
  0%, 100% { opacity: 0.2; }
  50% { opacity: 0.4; }
}

@keyframes pulse-medium {
  0%, 100% { opacity: 0.25; }
  50% { opacity: 0.5; }
}

.animate-wave-1 {
  animation: wave-1 1.5s ease-in-out infinite;
  height: 20%;
}

.animate-wave-2 {
  animation: wave-2 1.5s ease-in-out infinite 0.1s;
  height: 40%;
}

.animate-wave-3 {
  animation: wave-3 1.5s ease-in-out infinite 0.2s;
  height: 60%;
}

.animate-wave-4 {
  animation: wave-4 1.5s ease-in-out infinite 0.3s;
  height: 40%;
}

.animate-wave-5 {
  animation: wave-5 1.5s ease-in-out infinite 0.4s;
  height: 20%;
}

.animate-dot-bounce {
  animation: dot-bounce 1.2s ease-in-out infinite;
}

.animate-pulse-slow {
  animation: pulse-slow 4s ease-in-out infinite;
}

.animate-pulse-slower {
  animation: pulse-slower 6s ease-in-out infinite;
}

.animate-pulse-medium {
  animation: pulse-medium 5s ease-in-out infinite;
}

/* Smooth transitions */
* {
  transition-property: color, background-color, border-color, transform, opacity;
  transition-duration: 400ms;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}

/* Enhanced backdrop blur */
.backdrop-blur-2xl {
  backdrop-filter: blur(40px);
}

.backdrop-blur-xl {
  backdrop-filter: blur(24px);
}
</style>
<script setup lang="ts">
const { locale, setLocale } = useI18n()

// Toggle sederhana: Jika ID ganti ke EN, jika EN ganti ke ID
const toggleLanguage = () => {
  const newLang = locale.value === 'id' ? 'en' : 'id'
  setLocale(newLang)
}
</script>

<template>
  <button 
    @click="toggleLanguage" 
    class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600"
    title="Ganti Bahasa / Switch Language"
  >
    <span class="uppercase font-bold text-xs tracking-wider">{{ locale }}</span>
    
    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  </button>
</template>
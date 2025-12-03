<script setup lang="ts">
import { useLoadingStore } from '~/stores/loading'

const loadingStore = useLoadingStore()
</script>

<template>
  <div>
    <LoadingOverlay 
      :is-loading="loadingStore.isLoading" 
      :message="loadingStore.message" 
    />

    <ToastContainer />

    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>
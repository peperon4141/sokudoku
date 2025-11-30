<template>
  <div id="app">
    <AppHeader />
    <router-view />
    <Toast />
  </div>
</template>

<script setup lang="ts">
import Toast from 'primevue/toast'
import AppHeader from '@/components/AppHeader.vue'
</script>


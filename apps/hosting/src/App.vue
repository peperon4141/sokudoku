<template>
  <component :is="layoutComponent" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import TopLayout from '@/layouts/TopLayout.vue'
import DashboardLayout from '@/layouts/DashboardLayout.vue'
import TrainingLayout from '@/layouts/TrainingLayout.vue'

const route = useRoute()

const layoutComponent = computed(() => {
  const layout = route.meta.layout as string | undefined
  if (layout === 'dashboard') {
    return DashboardLayout
  }
  if (layout === 'training') {
    return TrainingLayout
  }
  return TopLayout
})
</script>


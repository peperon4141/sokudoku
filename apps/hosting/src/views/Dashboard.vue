<template>
  <div class="dashboard min-h-screen bg-surface-0 p-8">
    <div class="max-w-6xl mx-auto">
      <div class="mb-8">
        <h1 class="text-4xl font-bold mb-2">速読アプリ</h1>
        <p class="text-surface-600">練習を選択して開始しましょう</p>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card
          v-for="method in readingMethods"
          :key="method.id"
          class="relative hover:shadow-lg transition-shadow"
        >
          <template #content>
            <div class="p-6">
              <div class="flex items-start justify-between mb-4">
                <div class="text-center flex-1">
                  <i :class="[method.icon, 'text-5xl text-primary mb-4']"></i>
                  <h2 class="text-xl font-semibold mb-2">{{ method.name }}</h2>
                </div>
                <Button
                  icon="pi pi-info-circle"
                  severity="secondary"
                  text
                  rounded
                  class="ml-2"
                  @click.stop="showMethodInfo(method)"
                  aria-label="メソッド情報"
                />
              </div>
              <p class="text-surface-600 mb-4 text-base">{{ method.description }}</p>
              <Button
                label="開始"
                icon="pi pi-play"
                severity="primary"
                class="w-full"
                @click="startReading(method.route)"
              />
            </div>
          </template>
        </Card>
      </div>
    </div>

    <Dialog
      v-model:visible="showInfoDialog"
      modal
      :header="selectedMethod?.name"
      :style="{ width: '800px', maxHeight: '80vh' }"
      class="method-info-dialog"
    >
      <div v-if="selectedMethod" class="flex flex-col gap-4 max-h-[60vh] overflow-y-auto">
        <div>
          <h3 class="font-semibold mb-2">説明</h3>
          <p class="text-surface-700">{{ selectedMethod.description }}</p>
        </div>

        <div>
          <h3 class="font-semibold mb-2">科学的根拠</h3>
          <p class="text-surface-700">{{ selectedMethod.scientificBasis }}</p>
        </div>

        <div v-if="selectedMethod.features && selectedMethod.features.length > 0">
          <h3 class="font-semibold mb-2">特徴</h3>
          <ul class="list-disc list-inside text-surface-700 space-y-1">
            <li v-for="feature in selectedMethod.features" :key="feature">{{ feature }}</li>
          </ul>
        </div>

        <div v-if="selectedMethod.limitations && selectedMethod.limitations.length > 0">
          <h3 class="font-semibold mb-2 text-orange-600">注意事項・制約事項</h3>
          <ul class="list-disc list-inside text-surface-700 space-y-1">
            <li v-for="limitation in selectedMethod.limitations" :key="limitation">{{ limitation }}</li>
          </ul>
        </div>

        <div v-if="selectedMethod.recommendations && selectedMethod.recommendations.length > 0">
          <h3 class="font-semibold mb-2">推奨事項</h3>
          <ul class="list-disc list-inside text-surface-700 space-y-1">
            <li v-for="recommendation in selectedMethod.recommendations" :key="recommendation">
              {{ recommendation }}
            </li>
          </ul>
        </div>

        <div v-if="selectedMethod.references && selectedMethod.references.length > 0">
          <h3 class="font-semibold mb-2">参考文献</h3>
          <ul class="list-disc list-inside text-surface-600 text-base space-y-1">
            <li v-for="(reference, index) in selectedMethod.references" :key="index">
              <a
                v-if="reference.url"
                :href="reference.url"
                target="_blank"
                rel="noopener noreferrer"
                class="text-primary hover:underline"
              >
                {{ reference.text }}
                <i class="pi pi-external-link ml-1 text-xs"></i>
              </a>
              <span v-else>{{ reference.text }}</span>
            </li>
          </ul>
        </div>
      </div>
      <template #footer>
        <Button label="閉じる" severity="secondary" @click="showInfoDialog = false" />
      </template>
    </Dialog>

  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import Card from 'primevue/card'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import { useReadingMethods, type ReadingMethod } from '@/composables/useReadingMethods'
import { useAuth } from '@/composables/useAuth'

const router = useRouter()
const { readingMethods } = useReadingMethods()
const { isAuthenticated } = useAuth()
const showInfoDialog = ref(false)
const selectedMethod = ref<ReadingMethod | null>(null)

// 未認証の場合はホームにリダイレクト
watch(isAuthenticated, (authenticated) => {
  if (!authenticated) {
    router.push('/')
  }
}, { immediate: true })

const startReading = (route: string) => {
  router.push(route)
}

const showMethodInfo = (method: ReadingMethod) => {
  selectedMethod.value = method
  showInfoDialog.value = true
}
</script>

<style scoped>
.dashboard {
  font-family: 'Noto Sans JP', sans-serif;
}
</style>


<template>
  <div class="min-h-screen bg-gradient-to-br from-surface-50 to-surface-100" data-theme="light">
    <!-- Navigation -->
    <nav class="bg-white shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex items-center">
            <h1 class="text-2xl font-bold text-primary">
              速読アプリ
            </h1>
          </div>
          <div class="flex items-center space-x-4">
            <Button
              @click="showLoginModal = true"
              label="ログイン"
              severity="primary"
              size="small"
              aria-label="ログインダイアログを開く"
            />
          </div>
        </div>
      </div>
    </nav>

    <!-- Hero Section -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div class="text-center">
        <h1 class="text-4xl md:text-6xl font-bold mb-6" aria-label="メインタイトル">
          <span class="text-primary">科学的根拠</span>に基づいた
          <br>速読トレーニング
        </h1>
        <p class="text-xl mb-8 max-w-3xl mx-auto text-surface-600">
          様々な速読メソッドを実装したアプリで、読書速度を向上させましょう。
          <br><strong class="text-primary">ログインして、あなたに最適な速読メソッドを見つけましょう。</strong>
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            @click="showLoginModal = true"
            label="ログイン"
            severity="primary"
            size="large"
            aria-label="ログインダイアログを開く"
            raised
          />
          <Button 
            @click="scrollToFeatures"
            label="機能を見る"
            severity="secondary"
            size="large"
            class="text-surface-900"
            aria-label="機能を見る"
            raised
          />
        </div>
      </div>
    </div>

    <!-- Features Section -->
    <div
      id="features"
      class="py-20 bg-surface-50"
    >
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-16">
          <h2 class="text-3xl font-bold mb-4">
            速読アプリの特徴
          </h2>
          <p class="text-lg text-surface-600">
            科学的根拠に基づいた複数の速読メソッドを実装
          </p>
        </div>
        
        <div class="grid md:grid-cols-3 gap-6">
          <Card class="feature-card text-center">
            <template #content>
              <div class="flex justify-center items-center mb-4">
                <i class="pi pi-eye text-5xl text-primary" />
              </div>
              <h3 class="text-xl font-semibold mb-3">
                様々な速読メソッド
              </h3>
              <p class="text-surface-600 m-0">
                RSVP、チャンキング、スキミングなど、複数の速読メソッドから選択できます。
              </p>
            </template>
          </Card>
          
          <Card class="feature-card text-center">
            <template #content>
              <div class="flex justify-center items-center mb-4">
                <i class="pi pi-cog text-5xl text-primary" />
              </div>
              <h3 class="text-xl font-semibold mb-3">
                カスタマイズ可能
              </h3>
              <p class="text-surface-600 m-0">
                速度や表示単語数など、あなたのレベルに合わせて調整できます。
              </p>
            </template>
          </Card>
          
          <Card class="feature-card text-center">
            <template #content>
              <div class="flex justify-center items-center mb-4">
                <i class="pi pi-chart-line text-5xl text-primary" />
              </div>
              <h3 class="text-xl font-semibold mb-3">
                進捗管理
              </h3>
              <p class="text-surface-600 m-0">
                あなたの読書速度の向上を記録し、可視化します。
              </p>
            </template>
          </Card>
        </div>
      </div>
    </div>

    <!-- CTA Section -->
    <div class="bg-primary py-16">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 class="text-3xl font-bold text-white mb-4">
          速読トレーニングを始めませんか？
        </h2>
        <p class="text-xl text-white/80 mb-8">
          ログインして、あなたに最適な速読メソッドを見つけましょう。
        </p>
        <Button
          @click="showLoginModal = true"
          label="ログイン"
          size="large"
          severity="secondary"
          aria-label="ログインダイアログを開く"
          raised
        />
      </div>
    </div>

    <!-- Footer -->
    <footer class="py-12">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center">
          <h3 class="text-2xl font-bold mb-4">
            速読アプリ
          </h3>
          <p>
            科学的根拠に基づいた速読トレーニング
          </p>
        </div>
      </div>
    </footer>

    <!-- Login Modal -->
    <LoginDialog
      :is-open="showLoginModal"
      @close="showLoginModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import Button from 'primevue/button'
import Card from 'primevue/card'
import LoginDialog from '@/components/LoginDialog.vue'

const showLoginModal = ref(false)

const scrollToFeatures = () => {
  document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })
}

// Force light theme for homepage
let originalTheme = ''

onMounted(() => {
  // Store original theme
  originalTheme = document.documentElement.getAttribute('data-theme') || ''
  // Force light theme
  document.documentElement.setAttribute('data-theme', 'light')
})

onUnmounted(() => {
  // Restore original theme when leaving page
  if (originalTheme) {
    document.documentElement.setAttribute('data-theme', originalTheme)
  } else {
    document.documentElement.removeAttribute('data-theme')
  }
})
</script>

<style scoped>
.feature-card {
  transition: transform 0.2s;
}

.feature-card:hover {
  transform: translateY(-4px);
}
</style>


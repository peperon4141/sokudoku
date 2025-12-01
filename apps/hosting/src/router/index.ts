import type { RouteRecordRaw, Router, NavigationGuardNext, RouteLocationNormalized } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

const routes: RouteRecordRaw[] = [
  { path: '/', name: 'Home', component: () => import('../views/Home.vue'), meta: { layout: 'top' } },
  { path: '/methods', name: 'Methods', component: () => import('../views/MethodsView.vue'), meta: { requiresAuth: true, layout: 'dashboard' } },
  { path: '/progress', name: 'Progress', component: () => import('../views/ProgressView.vue'), meta: { requiresAuth: true, layout: 'dashboard' } },
  { path: '/reading', name: 'Reading', component: () => import('../views/ReadingView.vue'), meta: { requiresAuth: true, layout: 'training' } },
  // 統合トレーニング方法（新規）
  { path: '/reading/sequential-display', name: 'SequentialDisplay', component: () => import('../views/RsvpView.vue'), meta: { requiresAuth: true, layout: 'training' } },
  { path: '/reading/chunking', name: 'Chunking', component: () => import('../views/ChunkingView.vue'), meta: { requiresAuth: true, layout: 'training' } },
  { path: '/reading/field-expansion', name: 'FieldExpansion', component: () => import('../views/SPMethodView.vue'), meta: { requiresAuth: true, layout: 'training' } },
  { path: '/reading/skimming', name: 'Skimming', component: () => import('../views/SkimmingView.vue'), meta: { requiresAuth: true, layout: 'training' } },
  { path: '/reading/cognitive-training', name: 'CognitiveTraining', component: () => import('../views/JointMethodView.vue'), meta: { requiresAuth: true, layout: 'training' } },
  { path: '/reading/saccade-training', name: 'SaccadeTraining', component: () => import('../views/SaccadeTrainingView.vue'), meta: { requiresAuth: true, layout: 'training' } },
  { path: '/reading/peripheral-vision', name: 'PeripheralVision', component: () => import('../views/PeripheralVisionView.vue'), meta: { requiresAuth: true, layout: 'training' } },
  { path: '/reading/subvocalization-control', name: 'SubvocalizationControl', component: () => import('../views/SubvocalizationControlView.vue'), meta: { requiresAuth: true, layout: 'training' } },
  { path: '/reading/eye-movement', name: 'EyeMovement', component: () => import('../views/EyeMovementView.vue'), meta: { requiresAuth: true, layout: 'training' } },
  // 既存のルート（後方互換性のため残す）
  { path: '/reading/rsvp', name: 'Rsvp', component: () => import('../views/RsvpView.vue'), meta: { requiresAuth: true, layout: 'training' } },
  { path: '/reading/park-sasaki', name: 'ParkSasaki', component: () => import('../views/ParkSasakiView.vue'), meta: { requiresAuth: true, layout: 'training' } },
  { path: '/reading/speed-conversion', name: 'SpeedConversion', component: () => import('../views/SpeedConversionView.vue'), meta: { requiresAuth: true, layout: 'training' } },
  { path: '/reading/joint-method', name: 'JointMethod', component: () => import('../views/JointMethodView.vue'), meta: { requiresAuth: true, layout: 'training' } },
  { path: '/reading/activeread', name: 'ActiveRead', component: () => import('../views/ActiveReadView.vue'), meta: { requiresAuth: true, layout: 'training' } },
  { path: '/reading/sp-method', name: 'SPMethod', component: () => import('../views/SPMethodView.vue'), meta: { requiresAuth: true, layout: 'training' } },
  // SP速読学院メソッド（練習メソッド2）
  { path: '/reading/reading-speed-test', name: 'ReadingSpeedTest', component: () => import('../views/ReadingSpeedTestView.vue'), meta: { requiresAuth: true, layout: 'training' } },
  { path: '/reading/eye-stretch', name: 'EyeStretch', component: () => import('../views/EyeStretchView.vue'), meta: { requiresAuth: true, layout: 'training' } },
  { path: '/reading/word-recognition', name: 'WordRecognition', component: () => import('../views/WordRecognitionView.vue'), meta: { requiresAuth: true, layout: 'training' } },
  { path: '/reading/word-recognition-scatter', name: 'WordRecognitionScatter', component: () => import('../views/WordRecognitionScatterView.vue'), meta: { requiresAuth: true, layout: 'training' } },
  { path: '/reading/word-image', name: 'WordImage', component: () => import('../views/WordImageView.vue'), meta: { requiresAuth: true, layout: 'training' } },
  { path: '/reading/parallel-reading', name: 'ParallelReading', component: () => import('../views/ParallelReadingView.vue'), meta: { requiresAuth: true, layout: 'training' } },
  { path: '/reading/vision-up', name: 'VisionUp', component: () => import('../views/VisionUpView.vue'), meta: { requiresAuth: true, layout: 'training' } },
  { path: '/reading/phrase-reading', name: 'PhraseReading', component: () => import('../views/PhraseReadingView.vue'), meta: { requiresAuth: true, layout: 'training' } },
]

// Router guard for authentication
export const setupRouter = (router: Router) => {
  router.beforeEach(async (to: RouteLocationNormalized, _from: RouteLocationNormalized, next: NavigationGuardNext) => {
    const { isAuthenticated, loading } = useAuth()
    
    // 認証状態の初期化が完了するまで待機
    if (loading.value) {
      // ローディング中は待機（最大3秒）
      let attempts = 0
      const maxAttempts = 60 // 50ms * 60 = 3秒
      
      await new Promise<void>((resolve) => {
        const checkAuth = () => {
          if (!loading.value || attempts >= maxAttempts) {
            resolve()
          } else {
            attempts++
            setTimeout(checkAuth, 50) // 50ms後に再チェック
          }
        }
        checkAuth()
      })
    }
    
    // 認証が必要で未認証の場合はホームにリダイレクト
    if (to.meta.requiresAuth && !isAuthenticated.value) { 
      next('/')
      return
    }
    
    // 認証済みでホームページへのアクセスの場合は進捗管理にリダイレクト
    if (isAuthenticated.value && to.path === '/') {
      next('/progress')
      return
    }
    
    // その他の場合はそのまま進む
    next()
  })
}

export default routes


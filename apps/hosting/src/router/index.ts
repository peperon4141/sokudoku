import type { RouteRecordRaw, Router, NavigationGuardNext, RouteLocationNormalized } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

const routes: RouteRecordRaw[] = [
  { path: '/', name: 'Home', component: () => import('../views/Home.vue'), meta: { layout: 'top' } },
  { path: '/dashboard', name: 'Dashboard', component: () => import('../views/Dashboard.vue'), meta: { requiresAuth: true, layout: 'dashboard' } },
  { path: '/reading', name: 'Reading', component: () => import('../views/ReadingView.vue'), meta: { requiresAuth: true, layout: 'training' } },
  { path: '/reading/rsvp', name: 'Rsvp', component: () => import('../views/RsvpView.vue'), meta: { requiresAuth: true, layout: 'training' } },
  { path: '/reading/chunking', name: 'Chunking', component: () => import('../views/ChunkingView.vue'), meta: { requiresAuth: true, layout: 'training' } },
  { path: '/reading/skimming', name: 'Skimming', component: () => import('../views/SkimmingView.vue'), meta: { requiresAuth: true, layout: 'training' } },
  { path: '/reading/park-sasaki', name: 'ParkSasaki', component: () => import('../views/ParkSasakiView.vue'), meta: { requiresAuth: true, layout: 'training' } },
  { path: '/reading/speed-conversion', name: 'SpeedConversion', component: () => import('../views/SpeedConversionView.vue'), meta: { requiresAuth: true, layout: 'training' } },
  { path: '/reading/joint-method', name: 'JointMethod', component: () => import('../views/JointMethodView.vue'), meta: { requiresAuth: true, layout: 'training' } },
  { path: '/reading/activeread', name: 'ActiveRead', component: () => import('../views/ActiveReadView.vue'), meta: { requiresAuth: true, layout: 'training' } },
  { path: '/reading/sp-method', name: 'SPMethod', component: () => import('../views/SPMethodView.vue'), meta: { requiresAuth: true, layout: 'training' } },
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
    
    // 認証済みでホームページへのアクセスの場合はダッシュボードにリダイレクト
    if (isAuthenticated.value && to.path === '/') {
      next('/dashboard')
      return
    }
    
    // その他の場合はそのまま進む
    next()
  })
}

export default routes


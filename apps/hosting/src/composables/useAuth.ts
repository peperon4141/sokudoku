import { ref, computed } from 'vue'
import type { User as FirebaseUser } from 'firebase/auth'
import { 
  signInWithPopup,
  GoogleAuthProvider,
  signOut, 
  onAuthStateChanged
} from 'firebase/auth'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { auth, db } from '@/config/firebase'

// User types
export type User = {
  id: string
  email: string
  displayName: string
  photoURL?: string
  createdAt: Date
  updatedAt: Date
}

const user = ref<User | null>(null)
const firebaseUser = ref<FirebaseUser | null>(null)
const loading = ref(true) // 初期化時はローディング状態
const error = ref<string | null>(null)

const loadUserData = async (fbUser: FirebaseUser) => {
  try {
    firebaseUser.value = fbUser
    const userDoc = await getDoc(doc(db, 'users', fbUser.uid))
    if (userDoc.exists()) {
      const userData = userDoc.data()
      user.value = {
        id: fbUser.uid,
        email: userData.email,
        displayName: userData.displayName,
        photoURL: fbUser.photoURL || undefined,
        createdAt: userData.createdAt?.toDate() || new Date(),
        updatedAt: userData.updatedAt?.toDate() || new Date()
      }
    } else {
      // User document doesn't exist, create it
      const userData: Omit<User, 'id' | 'photoURL'> = {
        email: fbUser.email!,
        displayName: fbUser.displayName || 'ユーザー',
        createdAt: new Date(),
        updatedAt: new Date()
      }
      await setDoc(doc(db, 'users', fbUser.uid), userData)
      user.value = {
        id: fbUser.uid,
        photoURL: fbUser.photoURL || undefined,
        ...userData
      }
    }
  } catch (err: unknown) {
    // より具体的なエラーメッセージを提供
    if (err instanceof Error) {
      if (err.message.includes('permission-denied')) {
        error.value = 'データベースへのアクセス権限がありません'
      } else if (err.message.includes('unavailable')) {
        error.value = 'データベースに接続できません。しばらく待ってから再試行してください'
      } else {
        error.value = `ユーザーデータの読み込みに失敗しました: ${err.message}`
      }
    } else {
      error.value = 'ユーザーデータの読み込みに失敗しました'
    }
  }
}

// Initialize auth state listener once
let authInitialized = false

if (!authInitialized) {
  // 認証状態の変更を監視（初期化時も含む）
  onAuthStateChanged(auth, async (fbUser) => {
    if (fbUser) {
      await loadUserData(fbUser)
    } else {
      user.value = null
      firebaseUser.value = null
    }
    loading.value = false
  })
  authInitialized = true
}

export function useAuth() {
  const isAuthenticated = computed(() => !!user.value)
  
  const loginWithGoogle = async () => {
    try {
      error.value = null
      loading.value = true
      const provider = new GoogleAuthProvider()
      const userCredential = await signInWithPopup(auth, provider)
      await loadUserData(userCredential.user)
    } catch (err: unknown) {
      if (err instanceof Error) {
        // Firebase Auth Emulatorのポップアップエラーに対する分かりやすいメッセージ
        if (err.message.includes('No matching frame') || err.message.includes('Auth Emulator Internal Error')) {
          error.value = 'ログインポップアップが正しく表示されませんでした。ポップアップブロッカーを無効化するか、ブラウザを再読み込みしてください。'
        } else if (err.message.includes('auth/popup-blocked')) {
          error.value = 'ポップアップがブロックされました。ブラウザの設定でポップアップを許可してください。'
        } else if (err.message.includes('auth/popup-closed-by-user')) {
          error.value = 'ログインポップアップが閉じられました。'
        } else {
          error.value = `Googleログインに失敗しました: ${err.message}`
        }
      } else {
        error.value = 'Googleログインに失敗しました'
      }
      throw err
    } finally {
      loading.value = false
    }
  }

  const logout = async () => {
    try {
      error.value = null
      await signOut(auth)
      user.value = null
      firebaseUser.value = null
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'ログアウトに失敗しました'
      throw err
    }
  }

  const clearError = () => {
    error.value = null
  }

  return {
    user: computed(() => user.value),
    isAuthenticated,
    loading: computed(() => loading.value),
    error: computed(() => error.value),
    loginWithGoogle,
    logout,
    clearError
  }
}


import { initializeApp } from 'firebase/app'
import { getAuth, connectAuthEmulator } from 'firebase/auth'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'

// エミュレーターを使用するかどうか（デフォルトはtrue）
const useEmulator = import.meta.env.VITE_USE_FIREBASE_EMULATOR !== 'false'

// エミュレーター使用時はダミー設定を使用
const firebaseConfig = useEmulator ? {
  apiKey: 'demo-api-key',
  authDomain: 'demo-project.firebaseapp.com',
  projectId: 'demo-project',
  storageBucket: 'demo-project.appspot.com',
  messagingSenderId: '123456789',
  appId: '1:123456789:web:abcdef'
} : {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app)

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app)

// Connect to emulators in development
if (useEmulator) {
  try {
    connectAuthEmulator(auth, 'http://127.0.0.1:50501')
    connectFirestoreEmulator(db, '127.0.0.1', 50506)
  } catch {
    // Firebase エミュレーターは既に接続されています
  }
}

export default app


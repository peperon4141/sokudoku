import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import PrimeVue from 'primevue/config'
import ConfirmationService from 'primevue/confirmationservice'
import ToastService from 'primevue/toastservice'

import App from './App.vue'
import routes, { setupRouter } from './router'
import primevue from './config/primevue'
import './style.css'

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Setup router guards
setupRouter(router)

const app = createApp(App)

app.use(router)
app.use(PrimeVue, primevue)
app.use(ConfirmationService)
app.use(ToastService)

app.mount('#app')


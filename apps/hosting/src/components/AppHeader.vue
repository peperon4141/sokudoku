<template>
  <header v-if="isAuthenticated" class="bg-surface-0 border-b border-surface-200 sticky top-0 z-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16">
        <div class="flex items-center">
          <router-link to="/progress" class="flex items-center gap-2 text-primary hover:text-primary-600 transition-colors">
            <i class="pi pi-book text-2xl"></i>
            <span class="text-xl font-semibold">速読アプリ</span>
          </router-link>
        </div>
        
        <div class="flex items-center gap-3">
          <Menu ref="menu" :model="menuItems" popup />
          <Avatar
            :image="user?.photoURL"
            :label="user?.photoURL ? undefined : getInitials(user?.displayName || 'U')"
            shape="circle"
            size="normal"
            class="cursor-pointer"
            @click="toggleMenu"
          />
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import Avatar from 'primevue/avatar'
import Menu from 'primevue/menu'
import type { MenuItem } from 'primevue/menuitem'
import { useAuth } from '@/composables/useAuth'

const router = useRouter()
const { user, isAuthenticated, logout } = useAuth()
const menu = ref<InstanceType<typeof Menu> | null>(null)

const getInitials = (name: string): string => {
  if (!name) return 'U'
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  return name.substring(0, 2).toUpperCase()
}

const toggleMenu = (event: Event) => {
  menu.value?.toggle(event)
}

const handleLogout = async () => {
  await logout()
  router.push('/')
}

const menuItems = computed<MenuItem[]>(() => [
  {
    label: user.value?.displayName || 'ユーザー',
    disabled: true,
    class: 'font-semibold'
  },
  {
    separator: true
  },
  {
    label: '練習メソッド',
    icon: 'pi pi-book',
    command: () => {
      router.push('/methods')
    }
  },
  {
    label: '進捗管理',
    icon: 'pi pi-chart-line',
    command: () => {
      router.push('/progress')
    }
  },
  {
    separator: true
  },
  {
    label: 'ログアウト',
    icon: 'pi pi-sign-out',
    command: handleLogout
  }
])
</script>

<style scoped>
:deep(.p-menu) {
  min-width: 200px;
}
</style>


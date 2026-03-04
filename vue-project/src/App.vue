<script setup lang="ts">
import { RouterView, useRouter } from 'vue-router'
import { onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const router = useRouter()

const INACTIVITY_LIMIT_MS = 15 * 60 * 1000 // 15 minutes

let inactivityTimeout: number | undefined

const checkTimestampsOnLoad = () => {
  const lastActivity = sessionStorage.getItem('lastActivity')
  if (lastActivity) {
    const elapsed = Date.now() - parseInt(lastActivity, 10)
    // If the browser was closed and reopened, or tab restored after the limit
    if (elapsed > INACTIVITY_LIMIT_MS) {
      if (authStore.isAuthenticated) {
        authStore.logout()
        router.push('/login')
      }
      return
    }
  }

  // Heuristic to detect a browser restore versus a page refresh
  const lastUnload = sessionStorage.getItem('lastUnload')
  if (lastUnload) {
    const elapsedSinceUnload = Date.now() - parseInt(lastUnload, 10)
    // A regular page refresh (F5) usually takes 1-5 seconds.
    // If more than 15 seconds have passed since the tab was unloaded, 
    // we assume the user closed the browser/tab and is now restoring it.
    if (elapsedSinceUnload > 15000) {
      if (authStore.isAuthenticated) {
        authStore.logout()
        router.push('/login')
      }
    }
    sessionStorage.removeItem('lastUnload')
  }
}

const handleUnload = () => {
  // Record the exact time the tab is closed or refreshed
  sessionStorage.setItem('lastUnload', Date.now().toString())
}

const resetInactivityTimeout = () => {
  sessionStorage.setItem('lastActivity', Date.now().toString())

  if (inactivityTimeout) {
    clearTimeout(inactivityTimeout)
  }
  // Set timeout to 15 minutes
  inactivityTimeout = window.setTimeout(() => {
    if (authStore.isAuthenticated) {
      authStore.logout()
      router.push('/login')
    }
  }, INACTIVITY_LIMIT_MS)
}

const setupInactivityListeners = () => {
  window.addEventListener('mousemove', resetInactivityTimeout)
  window.addEventListener('keypress', resetInactivityTimeout)
  window.addEventListener('click', resetInactivityTimeout)
  window.addEventListener('scroll', resetInactivityTimeout)
  // Track unload to distinguish between refresh and browser close
  window.addEventListener('beforeunload', handleUnload)
  window.addEventListener('pagehide', handleUnload)
  resetInactivityTimeout()
}

const clearInactivityListeners = () => {
  window.removeEventListener('mousemove', resetInactivityTimeout)
  window.removeEventListener('keypress', resetInactivityTimeout)
  window.removeEventListener('click', resetInactivityTimeout)
  window.removeEventListener('scroll', resetInactivityTimeout)
  window.removeEventListener('beforeunload', handleUnload)
  window.removeEventListener('pagehide', handleUnload)
  if (inactivityTimeout) {
    clearTimeout(inactivityTimeout)
  }
}

onMounted(() => {
  checkTimestampsOnLoad()
  setupInactivityListeners()
})

onUnmounted(() => {
  clearInactivityListeners()
})
</script>

<template>
  <RouterView />
</template>


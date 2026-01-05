<script setup lang="ts">
import AppSidebar from './AppSidebar.vue';
import AppHeader from './AppHeader.vue';
import { RouterView } from 'vue-router';
</script>

<template>
    <div class="flex min-h-screen bg-surface-50 dark:bg-surface-950">
        <aside class="w-64 bg-white dark:bg-surface-900 border-r border-surface-200 dark:border-surface-700 flex flex-col fixed h-full z-20 transition-transform duration-300">
            <AppSidebar />
        </aside>
        <div class="flex-1 flex flex-col ml-64 min-h-screen transition-all duration-300">
            <AppHeader />
            <main class="flex-1 p-8 overflow-auto">
                <div class="max-w-7xl mx-auto w-full">
                    <RouterView />
                </div>
            </main>
        </div>
    </div>
</template>

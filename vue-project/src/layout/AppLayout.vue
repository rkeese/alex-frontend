<script setup lang="ts">
import AppSidebar from './AppSidebar.vue';
import { RouterView } from 'vue-router';
</script>

<template>
    <div class="flex min-h-screen bg-gray-50">
        <aside class="w-64 bg-white border-r border-gray-200 flex flex-col">
            <div class="p-6 font-bold text-2xl text-emerald-600">Alex Club</div>
            <div class="flex-1 overflow-y-auto">
                <AppSidebar />
            </div>
        </aside>
        <main class="flex-1 p-6 overflow-auto">
            <RouterView />
        </main>
    </div>
</template>

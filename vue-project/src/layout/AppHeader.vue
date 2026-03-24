<script setup lang="ts">
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'vue-router';
import Avatar from 'primevue/avatar';
import Button from 'primevue/button';
import Menu from 'primevue/menu';
import { ref } from 'vue';

const authStore = useAuthStore();
const router = useRouter();
const menu = ref();

const items = [
    {
        label: 'Logout',
        icon: 'pi pi-sign-out',
        command: () => {
            authStore.logout();
            router.push('/login');
        }
    }
];

const toggle = (event: Event) => {
    menu.value.toggle(event);
};
</script>

<template>
    <header class="h-16 bg-white dark:bg-surface-900 border-b border-surface-200 dark:border-surface-700 flex items-center justify-between px-6 shadow-sm z-10">
        <div class="flex items-center gap-4">
            <!-- Mobile menu button could go here -->
            <div class="flex flex-col">
                <h2 class="text-lg font-semibold text-surface-700 dark:text-surface-0">Dashboard</h2>
                <span v-if="authStore.clubName" class="text-xs text-surface-500 font-medium">{{ authStore.clubName }}</span>
            </div>
        </div>

        <div class="flex items-center gap-4">
            <Button icon="pi pi-bell" text rounded severity="secondary" aria-label="Notifications" />
            
            <div class="flex items-center gap-3 cursor-pointer p-1 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors" @click="toggle" aria-haspopup="true" aria-controls="overlay_menu">
                <div class="text-right hidden sm:block">
                    <div class="text-sm font-medium text-surface-900 dark:text-surface-0">{{ authStore.userName || 'User' }}</div>
                    <div class="text-xs text-surface-500 dark:text-surface-400">{{ authStore.userRoleLabel || 'Member' }}</div>
                </div>
                <Avatar icon="pi pi-user" class="bg-primary-100 text-primary-600" shape="circle" />
            </div>
            <Menu ref="menu" id="overlay_menu" :model="items" :popup="true" />
        </div>
    </header>
</template>

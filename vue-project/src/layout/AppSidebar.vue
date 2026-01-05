<script setup lang="ts">
import { ref } from "vue";
import Menu from 'primevue/menu';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const authStore = useAuthStore();

const items = ref([
    { label: 'Home', icon: 'pi pi-home', command: () => router.push('/') },
    { label: 'Members', icon: 'pi pi-users', command: () => router.push('/members') },
    { label: 'Departments', icon: 'pi pi-sitemap', command: () => router.push('/departments') },
    {
        label: 'Finance',
        icon: 'pi pi-dollar',
        items: [
            { label: 'Receipts', icon: 'pi pi-receipt', command: () => router.push('/finance/receipts') },
            { label: 'Accounts', icon: 'pi pi-wallet', command: () => router.push('/finance/accounts') }
        ]
    },
    { label: 'Calendar', icon: 'pi pi-calendar', command: () => router.push('/calendar') },
    { label: 'Documents', icon: 'pi pi-file', command: () => router.push('/documents') }
]);
</script>

<template>
    <div class="flex flex-col h-full">
        <div class="p-6 flex items-center gap-3">
            <div class="w-8 h-8 rounded bg-primary-600 flex items-center justify-center text-white font-bold text-xl">A</div>
            <span class="font-bold text-xl text-surface-900 dark:text-surface-0">Alex Club</span>
        </div>
        <div class="flex-1 px-4">
            <Menu :model="items" class="w-full border-none bg-transparent" />
        </div>
        <div class="p-4 text-xs text-center text-surface-500">
            v1.0.0
        </div>
    </div>
</template>

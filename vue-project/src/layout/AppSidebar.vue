<script setup lang="ts">
import { ref, computed } from "vue";
import Menu from 'primevue/menu';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const authStore = useAuthStore();

const items = computed(() => {
    const menuItems = [
        { label: 'Home', icon: 'pi pi-home', command: () => router.push('/') },
    ];

    if (authStore.hasPermission('members:read')) {
        menuItems.push({ label: 'Members', icon: 'pi pi-users', command: () => router.push('/members') });
    }

    if (authStore.hasPermission('departments:read')) {
        menuItems.push({ label: 'Departments', icon: 'pi pi-sitemap', command: () => router.push('/departments') });
    }

    if (authStore.hasPermission('finance:read')) {
        menuItems.push({
            label: 'Finance',
            icon: 'pi pi-dollar',
            items: [
                { label: 'Receipts', icon: 'pi pi-receipt', command: () => router.push('/finance/receipts') },
                { label: 'Accounts', icon: 'pi pi-wallet', command: () => router.push('/finance/accounts') }
            ]
        } as any); // Type assertion for nested items if needed, or structured correctly
    }

    if (authStore.hasPermission('calendar:read')) {
        menuItems.push({ label: 'Calendar', icon: 'pi pi-calendar', command: () => router.push('/calendar') });
    }

    if (authStore.hasPermission('documents:read')) {
        menuItems.push({ label: 'Documents', icon: 'pi pi-file', command: () => router.push('/documents') });
    }

    if (authStore.hasPermission('users:manage')) {
        menuItems.push({ label: 'Admin', icon: 'pi pi-cog', items: [
            { label: 'User Management', icon: 'pi pi-users', command: () => router.push('/admin/users') }
        ] } as any);
    }

    return menuItems;
});
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

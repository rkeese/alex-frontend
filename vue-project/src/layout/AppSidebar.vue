<script setup lang="ts">
import { ref, computed } from "vue";
import PanelMenu from 'primevue/panelmenu';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const authStore = useAuthStore();

const items = computed(() => {
    const menuItems = [
        { label: 'Startseite', icon: 'pi pi-home', command: () => router.push('/') },
    ];

    if (authStore.hasPermission('members:read') || authStore.hasPermission('members:write')) {
        menuItems.push({
            label: 'Mitglieder',
            icon: 'pi pi-users',
            items: [
                { label: 'Liste', icon: 'pi pi-list', command: () => router.push('/members') },
                { label: 'Statistik', icon: 'pi pi-chart-bar', command: () => router.push('/members/statistics') }
            ]
        } as any);
    }

    if (authStore.hasPermission('departments:read') || authStore.hasPermission('departments:write')) {
        menuItems.push({ label: 'Abteilungen', icon: 'pi pi-sitemap', command: () => router.push('/departments') });
    }

    if (authStore.hasPermission('finance:read') || authStore.hasPermission('finance:write')) {
        menuItems.push({
            label: 'Finanzen',
            icon: 'pi pi-dollar',
            items: [
                { label: 'Belege', icon: 'pi pi-receipt', command: () => router.push('/finance/receipts') },
                { label: 'Konten', icon: 'pi pi-wallet', command: () => router.push('/finance/accounts') }
            ]
        } as any); // Type assertion for nested items if needed, or structured correctly
    }

    if (authStore.hasPermission('calendar:read') || authStore.hasPermission('calendar:write')) {
        menuItems.push({ label: 'Kalender', icon: 'pi pi-calendar', command: () => router.push('/calendar') });
    }

    if (authStore.hasPermission('documents:read') || authStore.hasPermission('documents:write')) {
        menuItems.push({ label: 'Dokumente', icon: 'pi pi-file', command: () => router.push('/documents') });
    }

    if (authStore.hasPermission('users:manage') || authStore.hasPermission('clubs:manage')) {
        const adminItems = [];
        if (authStore.hasPermission('users:manage')) {
             adminItems.push({ label: 'Benutzerverwaltung', icon: 'pi pi-users', command: () => router.push('/admin/users') });
        }
        if (authStore.hasPermission('clubs:manage')) {
             adminItems.push({ label: 'Vereinsverwaltung', icon: 'pi pi-building', command: () => router.push('/admin/clubs') });
        }
        
        menuItems.push({ label: 'Verwaltung', icon: 'pi pi-cog', items: adminItems } as any);
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
            <PanelMenu :model="items" class="w-full border-none bg-transparent" />
        </div>
        <div class="p-4 text-xs text-center text-surface-500">
            v1.0.0
        </div>
    </div>
</template>

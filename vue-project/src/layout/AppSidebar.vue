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
    { label: 'Documents', icon: 'pi pi-file', command: () => router.push('/documents') },
    { separator: true },
    { 
        label: 'Logout', 
        icon: 'pi pi-sign-out', 
        command: () => {
            authStore.logout();
            router.push('/login');
        } 
    }
]);
</script>

<template>
    <Menu :model="items" class="w-full border-none" />
</template>

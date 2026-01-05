<script setup lang="ts">
import { ref } from "vue";
import Menu from 'primevue/menu';
import { useRouter } from 'vue-router';

const router = useRouter();

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
    <Menu :model="items" class="w-full border-none" />
</template>

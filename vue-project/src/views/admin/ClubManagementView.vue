<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { api } from '@/services/api';
import type { Club } from '@/types';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();

const clubs = ref<Club[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);

const loadData = async () => {
    loading.value = true;
    error.value = null;
    try {
        clubs.value = await api.getClubs();
    } catch (e: any) {
        console.error('Failed to load clubs', e);
        error.value = e.message || 'Failed to load data';
    } finally {
        loading.value = false;
    }
};

onMounted(() => {
    loadData();
});

const switchClub = (club: Club) => {
    if (club.id) {
        authStore.setClub(club.id, club.name);
        // Force reload of page or at least notify user. 
        // Since many views depend on the clubId in the store/sessionstorage, 
        // simplest is often just staying here but visual update.
    }
};

const deleteClub = async (club: Club) => {
    if (!confirm(`Are you sure you want to delete club "${club.name}"? This is irreversible!`)) {
        return;
    }

    try {
        if (club.id) {
            await api.deleteClub(club.id);
            // If the current deleted club was the active one, clear context
            if (authStore.clubId === club.id) {
                authStore.setClub('', '');
            }
            await loadData();
        }
    } catch (e: any) {
         console.error('Failed to delete club', e);
         alert('Failed to delete club: ' + e.message);
    }
}
</script>

<template>
    <div class="card">
        <div class="flex justify-between items-center mb-4">
            <h1 class="text-2xl font-bold">Club Management</h1>
            <Button icon="pi pi-refresh" label="Refresh" @click="loadData" :loading="loading" />
        </div>

        <div v-if="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <span class="block sm:inline">{{ error }}</span>
        </div>

        <DataTable :value="clubs" :loading="loading" stripedRows paginator :rows="10">
            <Column field="name" header="Name" sortable></Column>
            <Column field="id" header="ID"></Column>
            <Column header="Status">
                <template #body="slotProps">
                     <span v-if="authStore.clubId === slotProps.data.id" class="text-green-600 font-bold">Active Context</span>
                </template>
            </Column>
            <Column header="Actions">
                <template #body="slotProps">
                    <div class="flex gap-2">
                        <Button 
                            icon="pi pi-arrow-right-arrow-left" 
                            label="Switch To" 
                            severity="info" 
                            size="small"
                            @click="switchClub(slotProps.data)"
                            :disabled="authStore.clubId === slotProps.data.id"
                        />
                        <Button 
                            icon="pi pi-trash" 
                            label="Delete" 
                            severity="danger" 
                            size="small"
                            @click="deleteClub(slotProps.data)" 
                        />
                    </div>
                </template>
            </Column>
        </DataTable>
    </div>
</template>

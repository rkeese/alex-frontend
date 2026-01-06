<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { api } from '@/services/api';
import type { Member } from '@/types';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import { useAuthStore } from '@/stores/auth';

const members = ref<Member[]>([]);
const loading = ref(true);
const router = useRouter();
const authStore = useAuthStore();

onMounted(async () => {
    loadMembers();
});

const loadMembers = async () => {
    loading.value = true;
    try {
        members.value = await api.getMembers();
    } catch (error) {
        console.error('Failed to load members', error);
        // In a real app, show a toast notification here
    } finally {
        loading.value = false;
    }
};

const getSeverity = (status: string) => {
    switch (status.toLowerCase()) {
        case 'active':
            return 'success';
        case 'inactive':
        case 'passive':
            return 'secondary';
        case 'honorary':
            return 'info';
        default:
            return 'contrast';
    }
};

const editMember = (id: string) => {
    router.push(`/members/${id}/edit`);
};

const deleteMember = async (id: string) => {
    if (confirm('Are you sure you want to delete this member?')) {
        try {
            await api.deleteMember(id);
            await loadMembers();
        } catch (error) {
            console.error('Failed to delete member', error);
        }
    }
};
</script>

<template>
    <div class="card">
        <div class="flex justify-between items-center mb-4">
            <h1 class="text-2xl font-bold text-gray-800">Members</h1>
            <div class="flex gap-2">
                <Button v-if="authStore.hasPermission('members:write')" label="Import" icon="pi pi-upload" severity="secondary" @click="router.push('/members/import')" />
                <Button v-if="authStore.hasPermission('members:write')" label="New Member" icon="pi pi-plus" @click="router.push('/members/create')" />
            </div>
        </div>

        <DataTable :value="members" :loading="loading" paginator :rows="10" :rowsPerPageOptions="[5, 10, 20, 50]"
            tableStyle="min-width: 50rem" stripedRows class="p-datatable-sm">
            <template #empty> No members found. </template>
            <Column field="member_number" header="No." sortable style="width: 10%"></Column>
            <Column field="first_name" header="First Name" sortable style="width: 15%"></Column>
            <Column field="last_name" header="Last Name" sortable style="width: 15%"></Column>
            <Column field="email" header="Email" sortable style="width: 20%"></Column>
            <Column field="city" header="City" sortable style="width: 15%"></Column>
            <Column field="status" header="Status" sortable style="width: 10%">
                <template #body="slotProps">
                    <Tag :value="slotProps.data.status" :severity="getSeverity(slotProps.data.status)" />
                </template>
            </Column>
            <Column header="Actions" style="width: 15%">
                <template #body="slotProps">
                    <div class="flex gap-2">
                        <Button v-if="authStore.hasPermission('members:write')" icon="pi pi-pencil" severity="info" text rounded aria-label="Edit"
                            @click="editMember(slotProps.data.id)" />
                        <Button v-if="authStore.hasPermission('members:delete')" icon="pi pi-trash" severity="danger" text rounded aria-label="Delete"
                            @click="deleteMember(slotProps.data.id)" />
                    </div>
                </template>
            </Column>
        </DataTable>
    </div>
</template>

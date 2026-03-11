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
    if (!status) return 'contrast';
    const s = status.toLowerCase();
    switch (s) {
        case 'active':
        case 'aktiv':
            return 'success';
        case 'inactive':
        case 'inaktiv':
        case 'passive':
        case 'passiv':
            return 'secondary';
        case 'honorary':
        case 'ehrenmitglied':
            return 'info';
        default:
            return 'contrast';
    }
};

const getMemberId = (member: any): string => {
    if (member.id) return member.id;
    if (member.ID) return member.ID;
    if (member.Id) return member.Id;
    // Fallback if ID is inside an invalid structure or completely missing
    console.error('Member ID missing or invalid casing:', member);
    return '';
};

const editMember = (member: any) => {
    const id = getMemberId(member);
    if (id) {
        router.push(`/members/${id}/edit`);
    }
};

const deleteMember = async (member: any) => {
    const id = getMemberId(member);
    if (id && confirm('Sind Sie sicher, dass Sie dieses Mitglied löschen möchten?')) {
        try {
            await api.deleteMember(id);
            await loadMembers();
        } catch (error) {
            console.error('Failed to delete member', error);
        }
    }
};

const inviteMember = async (member: any) => {
    const id = getMemberId(member);
    if (!id) return;

    if (!member.email) {
        alert('Mitglied hat keine E-Mail-Adresse und kann nicht eingeladen werden.');
        return;
    }

    if (confirm(`Möchten Sie ${member.first_name} ${member.last_name} einladen?`)) {
        try {
            await api.inviteMember(authStore.clubId, id);
            alert('Einladung wurde versendet.');
        } catch (error: any) {
            console.error('Failed to invite member', error);
            alert('Einladung fehlgeschlagen: ' + error.message);
        }
    }
};

const exportMembers = async () => {
    try {
        await api.exportMembers();
    } catch (error) {
        console.error('Failed to export members', error);
        alert('Export fehlgeschlagen');
    }
};
</script>

<template>
    <div class="card">
        <div class="flex justify-between items-center mb-4">
            <h1 class="text-2xl font-bold text-gray-800">Mitglieder</h1>
            <div class="flex gap-2">
                <Button v-if="authStore.hasPermission('members:read')" label="Exportieren" icon="pi pi-download" severity="secondary" @click="exportMembers" />
                <Button v-if="authStore.hasPermission('members:write')" label="Importieren" icon="pi pi-upload" severity="secondary" @click="router.push('/members/import')" />
                <Button v-if="authStore.hasPermission('members:write')" label="Neues Mitglied" icon="pi pi-plus" @click="router.push('/members/create')" />
            </div>
        </div>

        <DataTable :value="members" :loading="loading" paginator :rows="10" :rowsPerPageOptions="[5, 10, 20, 50]"
            stateStorage="session" stateKey="dt-state-member-list"
            tableStyle="min-width: 50rem" stripedRows class="p-datatable-sm">
            <template #empty> Keine Mitglieder gefunden. </template>
            <Column field="member_number" header="Nr." sortable style="width: 10%"></Column>
            <Column field="first_name" header="Vorname" sortable style="width: 15%"></Column>
            <Column field="last_name" header="Nachname" sortable style="width: 15%"></Column>
            <Column field="email" header="E-Mail" sortable style="width: 20%"></Column>
            <Column field="city" header="Stadt" sortable style="width: 15%"></Column>
            <Column field="status" header="Status" sortable style="width: 10%">
                <template #body="slotProps">
                    <Tag :value="slotProps.data.status" :severity="getSeverity(slotProps.data.status)" />
                </template>
            </Column>
            <Column header="Aktionen" style="width: 15%">
                <template #body="slotProps">
                    <div class="flex gap-2">
                        <Button v-if="authStore.hasPermission('members:write')" icon="pi pi-pencil" severity="info" text rounded aria-label="Bearbeiten"
                            @click="editMember(slotProps.data)" />
                        <Button v-if="authStore.hasPermission('members:write') && slotProps.data.email" icon="pi pi-envelope" severity="success" text rounded aria-label="Einladen"
                            @click="inviteMember(slotProps.data)" v-tooltip.top="'Mitglied einladen'" />
                        <Button v-if="authStore.hasPermission('members:delete')" icon="pi pi-trash" severity="danger" text rounded aria-label="Löschen"
                            @click="deleteMember(slotProps.data)" />
                    </div>
                </template>
            </Column>
        </DataTable>
    </div>
</template>

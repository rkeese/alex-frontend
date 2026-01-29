<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { api } from '@/services/api';
import type { BoardMember, Member, Role } from '@/types';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Dropdown from 'primevue/dropdown';
import { useAuthStore } from '@/stores/auth';
import { useToast } from 'primevue/usetoast';

const boardMembers = ref<BoardMember[]>([]);
const members = ref<Member[]>([]);
const loading = ref(true);
const authStore = useAuthStore();
const toast = useToast();

const displayAddDialog = ref(false);
const displayEditDialog = ref(false);

const selectedMember = ref<Member | null>(null);
const newTask = ref('');
const editingMember = ref<BoardMember | null>(null);

// Remove static clubId constant to ensure we always get the current value from store
// const clubId = authStore.clubId; 

onMounted(async () => {
    await loadBoardMembers();
    await loadMembers();
});

const loadBoardMembers = async () => {
    loading.value = true;
    try {
        if (!authStore.clubId) {
             console.warn("No Club ID found in store");
             return;
        }
        boardMembers.value = await api.getBoardMembers(authStore.clubId);
    } catch (error) {
        console.error('Failed to load board members', error);
        toast.add({ severity: 'error', summary: 'Fehler', detail: 'Vorstand konnte nicht geladen werden', life: 3000 });
    } finally {
        loading.value = false;
    }
};

const loadMembers = async () => {
    try {
        members.value = await api.getMembers();
    } catch (error) {
        console.error('Failed to load members', error);
    }
};

const openAddDialog = () => {
    selectedMember.value = null;
    newTask.value = '';
    displayAddDialog.value = true;
};

const closeAddDialog = () => {
    displayAddDialog.value = false;
};

const saveNewBoardMember = async () => {
    if (!selectedMember.value || !newTask.value) {
        toast.add({ severity: 'warn', summary: 'Warnung', detail: 'Bitte füllen Sie alle Pflichtfelder aus.', life: 3000 });
        return;
    }

    try {
        if (!authStore.clubId) {
            toast.add({ severity: 'error', summary: 'Fehler', detail: 'Interner Fehler: Club ID fehlt.', life: 3000 });
            return;
        }

        // Ensure we handle potential casing issues with ID
        const memberId = selectedMember.value.id || (selectedMember.value as any).ID || (selectedMember.value as any).Id;
         if (!memberId) {
            toast.add({ severity: 'error', summary: 'Fehler', detail: 'Ausgewähltes Mitglied hat keine gültige ID.', life: 3000 });
            return;
        }

        await api.addBoardMember(authStore.clubId, {
            member_id: memberId,
            task: newTask.value,
            roles: [] // Role assignment handled in User Management as requested
        });
        toast.add({ severity: 'success', summary: 'Erfolg', detail: 'Vorstandsmitglied hinzugefügt.', life: 3000 });
        closeAddDialog();
        loadBoardMembers();
    } catch (error: any) {
        console.error('Failed to add board member', error);
        toast.add({ severity: 'error', summary: 'Fehler', detail: 'Fehler beim Speichern: ' + (error.message || 'Unbekannter Fehler'), life: 3000 });
    }
};

const openEditDialog = (member: BoardMember) => {
    editingMember.value = { ...member }; // Copy to avoid direct mutation
    newTask.value = member.position; // Map position to task
    // Roles handling removed
    displayEditDialog.value = true;
};

const closeEditDialog = () => {
    displayEditDialog.value = false;
    editingMember.value = null;
};

const saveEditBoardMember = async () => {
    if (!editingMember.value || !newTask.value) return;

    try {
        if (!authStore.clubId) {
             toast.add({ severity: 'error', summary: 'Fehler', detail: 'Club ID fehlt.', life: 3000 });
             return;
        }
        await api.updateBoardMember(authStore.clubId, editingMember.value.id, {
            task: newTask.value,
            roles: [] // Role assignment handled in User Management as requested
        });
        toast.add({ severity: 'success', summary: 'Erfolg', detail: 'Vorstandsmitglied aktualisiert.', life: 3000 });
        closeEditDialog();
        loadBoardMembers();
    } catch (error: any) {
        console.error('Failed to update board member', error);
        toast.add({ severity: 'error', summary: 'Fehler', detail: 'Update fehlgeschlagen: ' + (error.message || ''), life: 3000 });
    }
};

const deleteBoardMember = async (member: BoardMember) => {
    if (confirm(`Sind Sie sicher, dass Sie ${member.first_name} ${member.last_name} aus dem Vorstand entfernen möchten?`)) {
         try {
            if (!authStore.clubId) return;
            await api.deleteBoardMember(authStore.clubId, member.id);
            toast.add({ severity: 'success', summary: 'Erfolg', detail: 'Vorstandsmitglied entfernt.', life: 3000 });
            loadBoardMembers();
        } catch (error) {
            console.error('Failed to remove board member', error);
            toast.add({ severity: 'error', summary: 'Fehler', detail: 'Konnte nicht entfernen.', life: 3000 });
        }
    }
}

</script>

<template>
    <div class="card">
        <div class="flex justify-between items-center mb-4">
            <h1 class="text-2xl font-bold text-gray-800">Vorstand</h1>
            <Button label="Mitglied hinzufügen" icon="pi pi-plus" @click="openAddDialog" />
        </div>

        <DataTable :value="boardMembers" :loading="loading" stripedRows tableStyle="min-width: 50rem">
            <Column field="first_name" header="Vorname"></Column>
            <Column field="last_name" header="Nachname"></Column>
            <Column field="position" header="Position"></Column>
            <Column field="email" header="Email"></Column>
            <Column header="Aktionen" style="width: 10%">
                <template #body="slotProps">
                    <div class="flex gap-2">
                        <Button icon="pi pi-pencil" severity="secondary" text rounded aria-label="Edit" @click="openEditDialog(slotProps.data)" />
                        <Button icon="pi pi-trash" severity="danger" text rounded aria-label="Cancel" @click="deleteBoardMember(slotProps.data)" />
                    </div>
                </template>
            </Column>
            <template #empty>Keine Vorstandsmitglieder gefunden.</template>
        </DataTable>

        <!-- Add Dialog -->
        <Dialog v-model:visible="displayAddDialog" header="Neues Vorstandsmitglied" :style="{ width: '50vw' }" modal class="p-fluid">
            <div class="flex flex-col gap-4">
                <div class="field">
                    <label for="member" class="font-bold block mb-2">Mitglied auswählen</label>
                    <Dropdown 
                        id="member" 
                        v-model="selectedMember" 
                        :options="members" 
                        optionLabel="last_name" 
                        :filter="true"
                        filterBy="first_name,last_name,member_number"
                        placeholder="Mitglied wählen" 
                        class="w-full"
                    >
                        <template #option="slotProps">
                            <div class="flex items-center">
                                <div>{{ slotProps.option.first_name }} {{ slotProps.option.last_name }} ({{ slotProps.option.member_number }})</div>
                            </div>
                        </template>
                        <template #value="slotProps">
                            <div v-if="slotProps.value" class="flex items-center">
                                <div>{{ slotProps.value.first_name }} {{ slotProps.value.last_name }}</div>
                            </div>
                            <span v-else>
                                {{ slotProps.placeholder }}
                            </span>
                        </template>
                    </Dropdown>
                </div>
                <div class="field">
                    <label for="task" class="font-bold block mb-2">Position / Aufgabe</label>
                    <InputText id="task" v-model="newTask" placeholder="z.B. Kassenwart, Präsident" class="w-full" />
                </div>
                <div class="text-gray-500 text-sm">
                    Hinweis: Wenn das Mitglied noch keinen Benutzerzugang hat, wird automatisch einer erstellt.
                </div>
            </div>
            <template #footer>
                <Button label="Abbrechen" icon="pi pi-times" text @click="closeAddDialog" />
                <Button label="Speichern" icon="pi pi-check" @click="saveNewBoardMember" autofocus />
            </template>
        </Dialog>

        <!-- Edit Dialog -->
        <Dialog v-model:visible="displayEditDialog" :header="'Vorstandsmitglied bearbeiten: ' + (editingMember ? editingMember.first_name + ' ' + editingMember.last_name : '')" :style="{ width: '50vw' }" modal class="p-fluid">
             <div class="flex flex-col gap-4">
                <div class="field">
                    <label for="edit-task" class="font-bold block mb-2">Position / Aufgabe</label>
                    <InputText id="edit-task" v-model="newTask" class="w-full" />
                </div>
            </div>
            <template #footer>
                <Button label="Abbrechen" icon="pi pi-times" text @click="closeEditDialog" />
                <Button label="Speichern" icon="pi pi-check" @click="saveEditBoardMember" autofocus />
            </template>
        </Dialog>
    </div>
</template>

<style scoped>
</style>

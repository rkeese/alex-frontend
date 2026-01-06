<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { api } from '@/services/api';
import type { User, Role } from '@/types';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import Dropdown from 'primevue/dropdown';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();

const users = ref<User[]>([]);
const roles = ref<Role[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);
const dialogVisible = ref(false);
const selectedUser = ref<User | null>(null);
const selectedRole = ref<Role | null>(null);

const loadData = async () => {
    loading.value = true;
    error.value = null;
    try {
        const [usersData, rolesData] = await Promise.all([
            api.getUsers(),
            api.getRoles()
        ]);
        users.value = usersData;
        roles.value = rolesData;
    } catch (e: any) {
        console.error('Failed to load admin data', e);
        error.value = e.message || 'Failed to load data';
    } finally {
        loading.value = false;
    }
};

onMounted(() => {
    loadData();
});

const openAssignRoleDialog = (user: User) => {
    selectedUser.value = user;
    selectedRole.value = null;
    dialogVisible.value = true;
};

const openManualAssign = () => {
    selectedUser.value = null;
    selectedRole.value = null;
    dialogVisible.value = true;
};

const manualUserId = ref('');

const assignRole = async () => {
    if ((!selectedUser.value && !manualUserId.value) || !selectedRole.value || !authStore.clubId) return;

    try {
        await api.assignRole({
            user_id: selectedUser.value ? selectedUser.value.id : manualUserId.value,
            role_name: selectedRole.value.name,
            club_id: authStore.clubId
        });
        dialogVisible.value = false;
        manualUserId.value = '';
        // Refresh users to see updated roles if the backend returns them
        await loadData(); 
    } catch (error) {
        console.error('Failed to assign role', error);
        alert('Failed to assign role');
    }
};
</script>

<template>
    <div class="card">
        <h1 class="text-2xl font-bold text-gray-800 mb-4">User Management</h1>
        
        <div class="flex justify-end mb-4">
             <Button label="Manually Assign Role (By User ID)" icon="pi pi-user-plus" severity="secondary" @click="openManualAssign" />
        </div>

        <div v-if="error" class="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative mb-4" role="alert">
            <strong class="font-bold">Notice:</strong>
            <span class="block sm:inline"> Could not fetch user list directly ({{ error }}). You can still assign roles manually if you know the User ID.</span>
        </div>

        <DataTable :value="users" :loading="loading" stripedRows class="p-datatable-sm">
             <template #empty> No users found. </template>
            <Column field="email" header="Email" sortable></Column>
            <Column field="first_name" header="First Name" sortable></Column>
            <Column field="last_name" header="Last Name" sortable></Column>
            <Column header="Roles">
                <template #body="slotProps">
                    <div class="flex flex-wrap gap-1">
                        <!-- Assuming backend returns roles populated or we have to fetch them specifically permissions TBD -->
                         <span v-for="role in slotProps.data.roles" :key="role" class="bg-gray-200 text-gray-800 text-xs px-2 py-1 rounded">
                             {{ role }}
                         </span>
                    </div>
                </template>
            </Column>
            <Column header="Actions" style="width: 15%">
                <template #body="slotProps">
                    <Button label="Assign Role" icon="pi pi-user-edit" size="small" @click="openAssignRoleDialog(slotProps.data)" />
                </template>
            </Column>
        </DataTable>

        <Dialog v-model:visible="dialogVisible" header="Assign Role" :modal="true" class="w-full md:w-96">
            <div class="flex flex-col gap-4">
                <div v-if="selectedUser">
                    <p class="font-semibold">User: {{ selectedUser.email }}</p>
                </div>
                <div v-else>
                     <label for="manual_user_id" class="block mb-1">User UUID</label>
                     <input id="manual_user_id" v-model="manualUserId" class="w-full p-2 border rounded" placeholder="e.g. 550e8400-e29b-..." />
                     <p class="text-xs text-gray-500 mt-1">Enter the UUID of the user from the database.</p>
                </div>
                <div class="flex flex-col gap-2">
                    <label for="role">Select Role</label>
                     <Dropdown v-model="selectedRole" :options="roles" optionLabel="name" placeholder="Select a Role" class="w-full" />
                </div>
                <div class="flex justify-end gap-2 mt-4">
                    <Button label="Cancel" text severity="secondary" @click="dialogVisible = false" />
                    <Button label="Save" @click="assignRole" :disabled="!selectedRole || (!selectedUser && !manualUserId)" />
                </div>
            </div>
        </Dialog>
    </div>
</template>

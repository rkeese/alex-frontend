<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { api } from '@/services/api';
import type { User, Role } from '@/types';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();

const users = ref<User[]>([]);
const roles = ref<Role[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);
const dialogVisible = ref(false);
const selectedUser = ref<User | null>(null);
const processingRoleId = ref<string | null>(null);

// Batch Edit State
const editingRoles = ref<any[]>([]);
const originalRoles = ref<any[]>([]);
const isSaving = ref(false);

const loadData = async () => {
    loading.value = true;
    error.value = null;
    try {
        // Fetch global users list to ensure we see everyone
        const globalUsersPromise = api.getUsers(false);
        const rolesPromise = api.getRoles();
        
        // Fetch club-specific users if we are in a club context to get their roles
        let clubUsersPromise = Promise.resolve([] as User[]);
        if (authStore.clubId) {
             clubUsersPromise = api.getUsers(true).catch(e => {
                 console.warn('Failed to fetch club users, ignoring', e);
                 return [];
             });
        }

        const [usersData, rolesData, clubUsersData] = await Promise.all([
            globalUsersPromise,
            rolesPromise,
            clubUsersPromise
        ]);
        
        // Merge club roles into global user list
        // Create a map of club users for faster lookup
        // Use lowercase ID map to avoid case sensitivity issues
        const clubUsersMap = new Map((clubUsersData || []).map(u => [u.id.toLowerCase(), u]));

        users.value = usersData.map(u => {
            const clubUser = clubUsersMap.get(u.id.toLowerCase());
            // MERGE Logic: prioritize club roles, but keep global user data
            let mergedRoles: any[] = [];
            
            if (clubUser && clubUser.roles) {
                mergedRoles = [...clubUser.roles];
            } else if (u.roles) {
                mergedRoles = [...u.roles];
            }
            
            return {
                ...u,
                roles: mergedRoles
            };
        });

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

const openAssignRoleDialog = async (user: User) => {
    // Optimistically set selected user to what we have from the list
    selectedUser.value = user;
    dialogVisible.value = true;
    
    // FETCH STRATEGY: Try everything to get the roles
    try {
        console.log('Fetching detailed user info for:', user.id);
        
        // Strategy 1: Get full User Object (might have roles)
        const detailedUser = await api.getUser(user.id).catch(e => null);
        
        // Strategy 2: Get specific Roles endpoint (might exist)
        const specificRoles = await api.getUserRoles(user.id).catch(e => null);

        // MERGE DATA
        let finalRoles: any[] = [];
        
        // If we have list data, start with that
        if (user.roles) finalRoles = [...user.roles];
        
        // If detailed user has roles, overwrite
        if (detailedUser && detailedUser.roles && detailedUser.roles.length > 0) {
            finalRoles = detailedUser.roles;
        }
        
        // If specific endpoint returned roles, merge or overwrite
        if (specificRoles && Array.isArray(specificRoles)) {
             // Often specific endpoints return Just the roles, or objects
             finalRoles = specificRoles;
        }

        // Update UI
        if (dialogVisible.value && selectedUser.value?.id === user.id) {
             console.log('Final resolved roles:', finalRoles);
             if (detailedUser) {
                  selectedUser.value = { ...detailedUser, roles: finalRoles };
             } else {
                  selectedUser.value = { ...user, roles: finalRoles };
             }
             
             // Init Batch Editing State
             editingRoles.value = JSON.parse(JSON.stringify(finalRoles));
             originalRoles.value = JSON.parse(JSON.stringify(finalRoles));
        }

    } catch (e: any) {
        console.warn('All fetch strategies failed', e);
    }
};

const openManualAssign = () => {
    selectedUser.value = null;
    editingRoles.value = [];
    originalRoles.value = []; // Manual starts empty in this context, or we should fetch?
    dialogVisible.value = true;
};

const manualUserId = ref('');

const toggleRole = (role: Role, isAssigned: boolean) => {
    // Determine context
    // We only modify `editingRoles` locally. No API call here.
    const currentClubId = authStore.clubId;
    const normalizedRoleName = role.name.toLowerCase();

    if (isAssigned) {
         // REMOVE (Optimistic Local)
         editingRoles.value = editingRoles.value.filter((r: any) => {
             const rName = typeof r === 'string' ? r : (r.role || r.name);
             return (rName || '').toLowerCase() !== normalizedRoleName;
         });
    } else {
         // ASSIGN (Optimistic Local)
         const alreadyExists = isRoleAssigned(role.name); // This checks editingRoles now (see updated function below)
         if (!alreadyExists) {
             const newRoleObj = { role: role.name, club_id: currentClubId };
             editingRoles.value.push(newRoleObj);
         }
    }
};

const saveChanges = async () => {
    const userId = selectedUser.value ? selectedUser.value.id : manualUserId.value;
    if (!userId) return;

    isSaving.value = true;
    const currentClubId = authStore.clubId;
    
    try {
        // 1. Calculate Diffs
        // We need to compare specific roles.
        // Helper to stringify role for comparison: "roleName|clubId"
        const getRoleKey = (r: any) => {
            const name = (typeof r === 'string' ? r : (r.role || r.name)).toLowerCase();
            // If clubId is missing, it's global. treat undefined/null as empty string for key
            const cId = (typeof r === 'string' ? '' : (r.club_id || '')).toLowerCase();
            return `${name}|${cId}`;
        };

        const currentKeys = new Set(editingRoles.value.map(getRoleKey));
        const originalKeys = new Set(originalRoles.value.map(getRoleKey));

        // TO ADD: In Current but not Original
        const toAdd = editingRoles.value.filter(r => !originalKeys.has(getRoleKey(r)));
        
        // TO REMOVE: In Original but not Current
        // Note: We normally only remove roles that match our current Club Context if we are filtering the view?
        // But here `editingRoles` contains ALL roles.
        const toRemove = originalRoles.value.filter(r => !currentKeys.has(getRoleKey(r)));
        
        console.log('Batch Save Plan:', { toAdd, toRemove });

        const promises: Promise<void>[] = [];

        // Execute Adds
        for (const r of toAdd) {
            const rName = typeof r === 'string' ? r : (r.role || r.name);
            const payload: any = { user_id: userId, role_name: rName };
            if (authStore.clubId) payload.club_id = authStore.clubId;
            // Note: If the role object has a specific club_id different from current context, we should use that?
            // "staged" roles created in UI use currentClubId. Existing roles usually keep theirs.
            // For safety, use context for new adds.
            
            promises.push(api.assignRole(payload));
        }

        // Execute Removes
        for (const r of toRemove) {
            const rName = typeof r === 'string' ? r : (r.role || r.name);
            const rClubId = typeof r === 'string' ? undefined : r.club_id;
            
            const payload: any = { user_id: userId, role_name: rName };
            
            // Critical: When removing, we must use the Club ID of the role being removed, NOT necessarily the current session club ID
            // (Unless we only allow managing current club roles).
            // Assuming we want to remove exactly THAT specific role instance:
            if (rClubId) payload.club_id = rClubId;

            promises.push(api.removeRole(payload));
        }
        
        await Promise.all(promises);

        // Success
        dialogVisible.value = false;
        await loadData(); // Refresh Grid

    } catch (error: any) {
        console.error('Batch Save Failed', error);
        
        let msg = error.message || 'Unknown Error';
        
        // Improve wording if it is the Duplicate Error from backend
        // Backend often sends "Duplicate entry ..." for 500/409
        if (msg.toLowerCase().includes('duplicate')) {
             msg = "Some roles are already assigned. Refreshing data...";
        }
        
        alert('Failed to save changes: ' + msg);
        // On error, let's reload to ensure UI matches reality
        await loadData();
    } finally {
        isSaving.value = false;
    }
};

const isRoleAssigned = (roleName: string) => {
    // Check against EDITING ROLES, not selectedUser.value.roles
    // This allows the UI to reflect the temporary state
    const rolesToCheck = editingRoles.value; 
    
    // Normalize role checks to be Case Insensitive for everything
    if (rolesToCheck) {
        return rolesToCheck.some((r: any) => {
            let rName = '';
            let rClubId = '';

            if (typeof r === 'string') {
                rName = r;
            } else {
                rName = r.role || r.name;
                rClubId = r.club_id;
            }

            const checkName = (rName || '').toLowerCase() === roleName.toLowerCase();
            
            // If checking a Global Role (no current context), weak match on name
            if (!authStore.clubId) {
                return checkName;
            }

            // If we are in a Club Context
            if (authStore.clubId) {
                // If the user's role has a club_id, it MUST match (Case Insensitive)
                if (rClubId) {
                    const checkClub = rClubId.toLowerCase() === authStore.clubId.toLowerCase();
                    return checkName && checkClub;
                }
                // If user's role has NO club_id, it is Global, so it applies here too.
                return checkName;
            }
            
            return false;
        });
    }
    return false;
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
                        <!-- Handle string or object roles -->
                         <span v-for="(role, idx) in slotProps.data.roles" :key="idx" class="bg-gray-200 text-gray-800 text-xs px-2 py-1 rounded">
                             {{ typeof role === 'string' ? role : (role.role || role.name || JSON.stringify(role)) }}
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

        <Dialog v-model:visible="dialogVisible" header="Manage User Roles" :modal="true" class="w-full md:w-[40rem]">
            <div class="flex flex-col gap-4">
                <div v-if="selectedUser">
                    <p class="font-semibold">User: {{ selectedUser.email }}</p>
                </div>
                <div v-else>
                     <label for="manual_user_id" class="block mb-1">User UUID</label>
                     <input id="manual_user_id" v-model="manualUserId" class="w-full p-2 border rounded" placeholder="e.g. 550e8400-e29b-..." />
                     <p class="text-xs text-gray-500 mt-1">Enter the UUID of the user from the database.</p>
                </div>

                <div class="mt-2 border rounded max-h-[300px] overflow-y-auto">
                    <table class="w-full text-sm text-left">
                        <thead class="bg-gray-100 text-gray-700 uppercase font-medium">
                            <tr>
                                <th class="px-4 py-2">Role Name</th>
                                <th class="px-4 py-2 text-center w-24">Active</th>
                                <th class="px-4 py-2 text-center w-24">Inactive</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-200">
                             <tr v-for="role in roles" :key="role.id" class="hover:bg-gray-50">
                                <td class="px-4 py-2 font-medium">{{ role.name }}</td>
                                
                                <!-- Active Column -->
                                <td class="px-4 py-2 text-center cursor-pointer" @click="!isRoleAssigned(role.name) && toggleRole(role, false)">
                                    <div v-if="isRoleAssigned(role.name)" class="flex justify-center">
                                         <span class="w-4 h-4 bg-green-500 rounded-full inline-block shadow-sm ring-2 ring-green-200"></span>
                                    </div>
                                    <div v-else class="flex justify-center group">
                                         <span class="w-4 h-4 rounded-full inline-block border border-gray-300 group-hover:bg-green-100"></span>
                                    </div>
                                </td>

                                <!-- Inactive Column -->
                                <td class="px-4 py-2 text-center cursor-pointer" @click="isRoleAssigned(role.name) && toggleRole(role, true)">
                                    <div v-if="!isRoleAssigned(role.name)" class="flex justify-center">
                                         <span class="w-4 h-4 bg-gray-400 rounded-full inline-block shadow-sm ring-2 ring-gray-200"></span>
                                    </div>
                                    <div v-else class="flex justify-center group">
                                         <span class="w-4 h-4 rounded-full inline-block border border-gray-300 group-hover:bg-red-100"></span>
                                    </div>
                                </td>
                             </tr>
                        </tbody>
                    </table>
                </div>

                <div class="flex justify-end gap-2 mt-4 pt-3 border-t">
                    <Button label="Cancel" text severity="secondary" @click="dialogVisible = false" :disabled="isSaving" />
                    <Button label="Save Changes" icon="pi pi-check" @click="saveChanges" :loading="isSaving" />
                </div>
            </div>
        </Dialog>
    </div>
</template>

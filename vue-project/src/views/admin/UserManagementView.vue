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
const blockingUserId = ref<string | null>(null);
const confirmBlockDialog = ref(false);
const userToToggleBlock = ref<User | null>(null);

// Batch Edit State
const editingRoles = ref<any[]>([]);
const originalRoles = ref<any[]>([]);
const isSaving = ref(false);

const loadData = async () => {
    loading.value = true;
    error.value = null;
    try {
        // Fetch global users list to ensure we see everyone (SysAdmin)
        let usersData: User[] = [];
        try {
            usersData = await api.getUsers(false);
        } catch (e) {
            console.log('Not a SysAdmin, skipping global user fetch');
        }

        const rolesPromise = api.getRoles();
        
        // Fetch club-specific users if we are in a club context to get their roles
        let clubUsersData: User[] = [];
        if (authStore.clubId) {
             try {
                 clubUsersData = await api.getUsers(true);
             } catch(e) {
                 console.log('Failed to fetch club users via /users endpoint, trying fallback via members and board');
                 
                 // FAILSAFE: If GET /users is strictly SysAdmin, use GET /members AND GET /board-members to find users
                 try {
                     const [members, boardMembers] = await Promise.all([
                        api.getMembers().catch(() => []),
                        api.getBoardMembers(authStore.clubId).catch(() => []) 
                     ]);
                     
                     // Filter members who have a linked user account
                     // Construct User objects from Member data
                     const memberUsers = members
                        .filter(m => m.user_id)
                        .map(m => ({
                            id: m.user_id!,
                            email: m.email,
                            // We don't have roles here yet, they will be fetched on demand or we accept empty
                            roles: [] 
                        }));

                     // Construct User objects from BoardMember data
                     // Board members almost certainly have user_id if they are active users
                     const boardUsers = boardMembers
                        .filter(bm => bm.user_id)
                        .map(bm => ({
                            id: bm.user_id,
                            email: bm.email,
                            roles: [] 
                        }));

                     // Merge Lists (Board Member Users might not be Regular Members or vice versa, or overlaps)
                     const combinedMap = new Map();
                     [...memberUsers, ...boardUsers].forEach(u => combinedMap.set(u.id, u));
                     clubUsersData = Array.from(combinedMap.values());

                 } catch (memErr) {
                     console.error('Failed to fetch members for user reconstruction', memErr);
                 }
             }
        }

        const [rolesData] = await Promise.all([
            rolesPromise
        ]);
        
        // Merge lists
        const userMap = new Map<string, User>();
        
        // Add global users first
        usersData.forEach(u => userMap.set(u.id.toLowerCase(), { ...u, roles: u.roles || [] }));
        
        // Merge/Add club users
        clubUsersData.forEach(u => {
            const existing = userMap.get(u.id.toLowerCase());
            if (existing) {
                // If existing has no roles but club user does, use club user roles (if any)
                // But usually club user fetch via /users returns roles. Member fetch does NOT.
                if ((!existing.roles || existing.roles.length === 0) && u.roles && u.roles.length > 0) {
                     existing.roles = u.roles;
                }
                // Preserve is_blocked from club user data if available
                if (u.is_blocked !== undefined) {
                    existing.is_blocked = u.is_blocked;
                }
            } else {
                userMap.set(u.id.toLowerCase(), { ...u, roles: u.roles || [] });
            }
        });

        users.value = Array.from(userMap.values());
        roles.value = rolesData;

        // Enrich is_blocked for users where it was not provided by the list endpoint
        // (e.g. Club Admins who fall back to members/board data which lack is_blocked)
        const usersNeedingBlockStatus = users.value.filter(u => u.is_blocked === undefined);
        if (usersNeedingBlockStatus.length > 0) {
            const detailPromises = usersNeedingBlockStatus.map(u =>
                api.getUser(u.id, false).catch(() => null)
            );
            const details = await Promise.all(detailPromises);
            details.forEach(detail => {
                if (detail && detail.id && 'is_blocked' in detail) {
                    const idx = users.value.findIndex(u => u.id.toLowerCase() === detail.id.toLowerCase());
                    if (idx !== -1) {
                        users.value[idx] = { ...users.value[idx], is_blocked: !!detail.is_blocked };
                    }
                }
            });
        }
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

const confirmToggleBlock = (user: User) => {
    userToToggleBlock.value = user;
    confirmBlockDialog.value = true;
};

const toggleBlockUser = async () => {
    const user = userToToggleBlock.value;
    if (!user) return;
    blockingUserId.value = user.id;
    confirmBlockDialog.value = false;
    try {
        const newBlockedState = !user.is_blocked;
        await api.updateUser(user.id, { is_blocked: newBlockedState });
        // Update local state immediately so the UI reflects the change
        const idx = users.value.findIndex(u => u.id === user.id);
        if (idx !== -1) {
            users.value[idx] = { ...users.value[idx], is_blocked: newBlockedState };
        }
    } catch (e: any) {
        alert('Benutzer konnte nicht aktualisiert werden: ' + (e.message || 'Unbekannter Fehler'));
    } finally {
        blockingUserId.value = null;
        userToToggleBlock.value = null;
    }
};

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
             msg = "Einige Rollen sind bereits zugewiesen. Daten werden aktualisiert...";
        }
        
        alert('Änderungen konnten nicht gespeichert werden: ' + msg);
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
        <h1 class="text-2xl font-bold text-gray-800 mb-4">Benutzerverwaltung</h1>
        
        <div v-if="authStore.isSystemAdmin" class="flex justify-end mb-4">
             <Button label="Rolle manuell zuweisen (nach Benutzer-ID)" icon="pi pi-user-plus" severity="secondary" @click="openManualAssign" />
        </div>

        <div v-if="error" class="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative mb-4" role="alert">
            <strong class="font-bold">Hinweis:</strong>
            <span class="block sm:inline"> Benutzerliste konnte nicht direkt abgerufen werden ({{ error }}). Sie können Rollen weiterhin manuell zuweisen, wenn Sie die Benutzer-ID kennen.</span>
        </div>

        <DataTable :value="users" :loading="loading" stripedRows class="p-datatable-sm">
             <template #empty> Keine Benutzer gefunden. </template>
            <Column field="email" header="E-Mail" sortable></Column>
            <Column field="first_name" header="Vorname" sortable></Column>
            <Column field="last_name" header="Nachname" sortable></Column>
            <Column header="Rollen">
                <template #body="slotProps">
                    <div class="flex flex-wrap gap-1">
                        <!-- Handle string or object roles -->
                         <span v-for="(role, idx) in slotProps.data.roles" :key="idx" class="bg-gray-200 text-gray-800 text-xs px-2 py-1 rounded">
                             {{ typeof role === 'string' ? role : (role.role || role.name || JSON.stringify(role)) }}
                         </span>
                    </div>
                </template>
            </Column>
            <Column header="Gesperrt" style="width: 8%">
                <template #body="slotProps">
                    <span v-if="slotProps.data.is_blocked" class="bg-red-100 text-red-700 text-xs font-semibold px-2 py-1 rounded">Gesperrt</span>
                    <span v-else class="bg-green-100 text-green-700 text-xs font-semibold px-2 py-1 rounded">Aktiv</span>
                </template>
            </Column>
            <Column header="Aktionen" style="width: 22%">
                <template #body="slotProps">
                    <div class="flex gap-2">
                        <Button v-if="authStore.isSystemAdmin" label="Rolle zuweisen" icon="pi pi-user-edit" size="small" @click="openAssignRoleDialog(slotProps.data)" />
                        <Button
                            :label="slotProps.data.is_blocked ? 'Entsperren' : 'Sperren'"
                            :icon="slotProps.data.is_blocked ? 'pi pi-lock-open' : 'pi pi-lock'"
                            :severity="slotProps.data.is_blocked ? 'success' : 'danger'"
                            size="small"
                            :loading="blockingUserId === slotProps.data.id"
                            @click="confirmToggleBlock(slotProps.data)"
                        />
                    </div>
                </template>
            </Column>
        </DataTable>

        <Dialog v-model:visible="dialogVisible" header="Benutzerrollen verwalten" :modal="true" class="w-full md:w-[40rem]">
            <div class="flex flex-col gap-4">
                <div v-if="selectedUser">
                    <p class="font-semibold">Benutzer: {{ selectedUser.email }}</p>
                </div>
                <div v-else>
                     <label for="manual_user_id" class="block mb-1">Benutzer-UUID</label>
                     <input id="manual_user_id" v-model="manualUserId" class="w-full p-2 border rounded" placeholder="z.B. 550e8400-e29b-..." />
                     <p class="text-xs text-gray-500 mt-1">Geben Sie die UUID des Benutzers aus der Datenbank ein.</p>
                </div>

                <div class="mt-2 border rounded max-h-[300px] overflow-y-auto">
                    <table class="w-full text-sm text-left">
                        <thead class="bg-gray-100 text-gray-700 uppercase font-medium">
                            <tr>
                                <th class="px-4 py-2">Rollenname</th>
                                <th class="px-4 py-2 text-center w-24">Aktiv</th>
                                <th class="px-4 py-2 text-center w-24">Inaktiv</th>
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
                    <Button label="Abbrechen" text severity="secondary" @click="dialogVisible = false" :disabled="isSaving" />
                    <Button label="Änderungen speichern" icon="pi pi-check" @click="saveChanges" :loading="isSaving" />
                </div>
            </div>
        </Dialog>
        <Dialog v-model:visible="confirmBlockDialog" :header="userToToggleBlock?.is_blocked ? 'Benutzer entsperren' : 'Benutzer sperren'" :modal="true" class="w-full md:w-[28rem]">
            <p class="mb-4">
                Sind Sie sicher, dass Sie den Benutzer <strong>{{ userToToggleBlock?.email }}</strong>
                <strong>{{ userToToggleBlock?.is_blocked ? 'entsperren' : 'sperren' }}</strong> möchten?
            </p>
            <p v-if="!userToToggleBlock?.is_blocked" class="text-sm text-red-600 mb-4">
                Ein gesperrter Benutzer kann sich nicht mehr anmelden.
            </p>
            <div class="flex justify-end gap-2">
                <Button label="Abbrechen" text severity="secondary" @click="confirmBlockDialog = false" />
                <Button
                    :label="userToToggleBlock?.is_blocked ? 'Entsperren' : 'Sperren'"
                    :severity="userToToggleBlock?.is_blocked ? 'success' : 'danger'"
                    @click="toggleBlockUser"
                />
            </div>
        </Dialog>
    </div>
</template>

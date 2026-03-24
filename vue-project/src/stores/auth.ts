import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import { api } from '@/services/api';
import type { LoginRequest, RegisterRequest } from '@/types';
import { jwtDecode } from "jwt-decode";

export const useAuthStore = defineStore('auth', () => {
    const token = ref(sessionStorage.getItem('token') || '');
    const clubId = ref(sessionStorage.getItem('clubId') || '');
    const clubName = ref(sessionStorage.getItem('clubName') || '');
    const permissions = ref<Set<string>>(new Set());
    const roles = ref<Set<string>>(new Set());
    const isSystemAdmin = ref(false);
    const userEmail = ref<string>('');
    const userName = ref<string>('');
    const mustChangePassword = ref(false);
    const userId = ref<string>('');
    
    const isAuthenticated = computed(() => !!token.value);
    
    const userRoleLabel = computed(() => {
        if (isSystemAdmin.value) return 'System Administrator';
        if (roles.value.size === 0) return 'User';
        return Array.from(roles.value).join(', ');
    });

    // Initialize state from stored token
    if (token.value) {
        processToken(token.value);
    }

    function processToken(jwt: string) {
        try {
            const payload: any = jwtDecode(jwt);
            console.log('JWT Payload:', payload); // Debugging aid
            
            // Extract IDs
            userId.value = payload.sub || payload.id || '';
            
            // Extract email
            userEmail.value = payload.email || '';
            
            // Extract Must Change Password Flag
            mustChangePassword.value = !!payload.must_change_password;

            // Extract Name
            if (payload.name) {
                userName.value = payload.name;
            } else if (payload.given_name || payload.family_name) {
                userName.value = [payload.given_name, payload.family_name].filter(Boolean).join(' ');
            } else {
                userName.value = userEmail.value;
            }

            // Extract permissions
            if (payload.permissions && Array.isArray(payload.permissions)) {
                permissions.value = new Set(payload.permissions);
            } else {
                permissions.value.clear();
            }

            // Extract System Admin Flag
            // Check possible claim names: IsSysAdmin (Go/backend), is_sys_admin (standard claim style)
            // Handle both boolean true and string "true"
            const isSysAdminClaim = payload.IsSysAdmin || payload.is_sys_admin || payload.issysadmin;
            const isSysAdmin = isSysAdminClaim === true || isSysAdminClaim === 'true';
            
            // Allow explicit specific users to be admins (Fallback/Dev)
            const adminEmails = ['admin@example.com', 'raimund.keese@web.de'];
            const isEmailAdmin = adminEmails.includes(userEmail.value);

            if (isSysAdmin || isEmailAdmin) {
                isSystemAdmin.value = true;
            } else {
                isSystemAdmin.value = false;
            }

            // Extract roles - try common claim names and handle both string and array formats
            let rawRoles: any[] = [];
            if (Array.isArray(payload.roles)) {
                rawRoles = payload.roles;
            } else if (payload.realm_access && Array.isArray(payload.realm_access.roles)) {
                rawRoles = payload.realm_access.roles;
            } else if (payload.role) {
                // Handle single role which could be a string or object
                rawRoles = Array.isArray(payload.role) ? payload.role : [payload.role];
            }

            const processedRoles = new Set<string>();
            rawRoles.forEach(r => {
                if (typeof r === 'string') {
                    processedRoles.add(r);
                } else if (typeof r === 'object' && r !== null) {
                    // Handle new backend format { club_id: "...", role: "..." }
                    if (r.role && typeof r.role === 'string') {
                        processedRoles.add(r.role);
                    } 
                    // Handle legacy/other formats { id: "...", name: "..." }
                    else if (r.name && typeof r.name === 'string') {
                        processedRoles.add(r.name);
                    }
                }
            });
            roles.value = processedRoles;
            
        } catch (e) {
            console.error('Failed to parse token', e);
            permissions.value.clear();
            roles.value.clear();
            isSystemAdmin.value = false;
            userEmail.value = '';
            userName.value = '';
        }
    }

    function hasPermission(permission: string): boolean {
        // System Administrator Bypass
        if (isSystemAdmin.value) {
            return true;
        }

        // Hardcoded Superuser for dev/testing or specific admin account
        // (This is now largely redundant due to the isSystemAdmin check above, but kept as safety)
        if (userEmail.value === 'admin@example.com' || userEmail.value === 'raimund.keese@web.de') {
            return true;
        }

        // Superuser / Admin bypass (case insensitive check)
        const lowerRoles = Array.from(roles.value).map(r => r.toLowerCase());
        if (lowerRoles.includes('superuser') || lowerRoles.includes('admin') || lowerRoles.includes('administrator')) {
            return true;
        }
        
        // Wildcard permission check
        if (permissions.value.has('*')) {
            return true;
        }

        // Specific area wildcard check (e.g. 'members:*' allows 'members:read')
        const parts = permission.split(':');
        if (parts.length > 0) {
             const area = parts[0];
             if (permissions.value.has(`${area}:*`)) {
                return true;
             }
        }

        // Direct Permission Check
        if (permissions.value.has(permission)) {
            return true;
        }

        // Role-based Permission deduction (Fallback if backend doesn't send explicit permissions)
        // Concept: <area>_viewer -> area:read
        //          <area>_writer -> area:read, area:write
        //          <area>_manager -> area:read, area:write, area:delete
        if (parts.length === 2 && roles.value.size > 0) {
            const area = parts[0];
            const action = parts[1];

            // Helper for case-insensitive role check
            const hasRole = (roleToCheck: string) => {
                for (const r of roles.value) {
                    if (r.toLowerCase() === roleToCheck.toLowerCase()) return true;
                }
                return false;
            };

            // Check Manager (all actions)
             if (hasRole(`${area}_manager`)) {
                return true;
            }

            // Check Writer (read, write)
            if (hasRole(`${area}_writer`)) {
                if (action === 'read' || action === 'write') return true;
            }

            // Check Viewer (read only)
            if (hasRole(`${area}_viewer`)) {
                if (action === 'read') return true;
            }
        }

        return false;
    }

    async function login(credentials: LoginRequest) {
        try {
            const response = await api.login(credentials);
            token.value = response.token;
            sessionStorage.setItem('token', response.token);
            
            processToken(response.token);

            // Fetch clubs and set default
            try {
                const clubs = await api.getClubs();
                if (clubs && clubs.length > 0 && clubs[0] && clubs[0].id) {
                    clubId.value = clubs[0].id;
                    clubName.value = clubs[0].name || '';
                    sessionStorage.setItem('clubId', clubId.value);
                    sessionStorage.setItem('clubName', clubName.value);
                }
            } catch (e) {
                console.error('Failed to fetch clubs after login', e);
            }
            
            return true;
        } catch (error) {
            console.error('Login failed', error);
            throw error;
        }
    }

    async function register(data: RegisterRequest) {
        try {
            const response = await api.register(data);
            token.value = response.token;
            sessionStorage.setItem('token', response.token);
            processToken(response.token);
            return true;
        } catch (error) {
            console.error('Registration failed', error);
            throw error;
        }
    }

    function logout() {
        token.value = '';
        clubId.value = '';
        clubName.value = '';
        permissions.value.clear();
        roles.value.clear();
        isSystemAdmin.value = false;
        userEmail.value = '';
        userName.value = '';
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('clubId');
        sessionStorage.removeItem('clubName');
    }

    function setClub(id: string, name: string) {
        clubId.value = id;
        clubName.value = name;
        sessionStorage.setItem('clubId', id);
        sessionStorage.setItem('clubName', name);
    }

    return { token, clubId, clubName, isAuthenticated, permissions, roles, isSystemAdmin, userEmail, userName, mustChangePassword, userId, userRoleLabel, hasPermission, login, register, logout, setClub };
});

function parseJwt (token: string) {
    try {
        const parts = token.split('.');
        if (parts.length < 2) return {};
        const base64Url = parts[1];
        if (!base64Url) return {};
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        return JSON.parse(jsonPayload);
    } catch (e) {
        return {};
    }
}


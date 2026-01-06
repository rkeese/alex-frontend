import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import { api } from '@/services/api';
import type { LoginRequest, RegisterRequest } from '@/types';

export const useAuthStore = defineStore('auth', () => {
    const token = ref(localStorage.getItem('token') || '');
    const clubId = ref(localStorage.getItem('clubId') || '');
    const permissions = ref<Set<string>>(new Set());
    const roles = ref<Set<string>>(new Set());
    const userEmail = ref<string>('');
    
    const isAuthenticated = computed(() => !!token.value);

    // Initialize state from stored token
    if (token.value) {
        processToken(token.value);
    }

    function processToken(jwt: string) {
        try {
            const payload = parseJwt(jwt);
            console.log('JWT Payload:', payload); // Debugging aid
            
            // Extract email/sub
            userEmail.value = payload.email || payload.sub || '';

            // Extract permissions
            if (payload.permissions && Array.isArray(payload.permissions)) {
                permissions.value = new Set(payload.permissions);
            } else {
                permissions.value.clear();
            }

            // Extract roles - try common claim names and handle both string and array formats
            let rolesList: string[] = [];
            if (Array.isArray(payload.roles)) {
                rolesList = payload.roles;
            } else if (payload.realm_access && Array.isArray(payload.realm_access.roles)) {
                rolesList = payload.realm_access.roles;
            } else if (typeof payload.role === 'string') {
                rolesList = [payload.role];
            }

            roles.value = new Set(rolesList);
            
        } catch (e) {
            console.error('Failed to parse token', e);
            permissions.value.clear();
            roles.value.clear();
            userEmail.value = '';
        }
    }

    function hasPermission(permission: string): boolean {
        // Hardcoded Superuser for dev/testing or specific admin account
        if (userEmail.value === 'admin@example.com') {
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
        const area = permission.split(':')[0];
        if (permissions.value.has(`${area}:*`)) {
            return true;
        }

        return permissions.value.has(permission);
    }

    async function login(credentials: LoginRequest) {
        try {
            const response = await api.login(credentials);
            token.value = response.token;
            localStorage.setItem('token', response.token);
            
            processToken(response.token);

            // Fetch clubs and set default
            try {
                const clubs = await api.getClubs();
                if (clubs.length > 0 && clubs[0].id) {
                    clubId.value = clubs[0].id;
                    localStorage.setItem('clubId', clubId.value);
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
            localStorage.setItem('token', response.token);
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
        permissions.value.clear();
        roles.value.clear();
        localStorage.removeItem('token');
        localStorage.removeItem('clubId');
    }

    return { token, clubId, isAuthenticated, permissions, roles, hasPermission, login, register, logout };
});

function parseJwt (token: string) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        return JSON.parse(jsonPayload);
    } catch (e) {
        return {};
    }
}


import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import { api } from '@/services/api';
import type { LoginRequest, RegisterRequest } from '@/types';

export const useAuthStore = defineStore('auth', () => {
    const token = ref(localStorage.getItem('token') || '');
    const clubId = ref(localStorage.getItem('clubId') || '');
    const permissions = ref<Set<string>>(new Set());
    
    const isAuthenticated = computed(() => !!token.value);

    // Initialize permissions from stored token
    if (token.value) {
        try {
            const payload = parseJwt(token.value);
            if (payload.permissions && Array.isArray(payload.permissions)) {
                permissions.value = new Set(payload.permissions);
            }
        } catch (e) {
            console.error('Failed to parse token on init', e);
        }
    }

    function hasPermission(permission: string): boolean {
        // If user is admin/superuser, they might have all permissions. 
        // We accept wildcard like 'members:*' or just check if specific permission exists.
        // Based on concept, permissions are explicit 'area:action'.
        // Assuming 'admin' role might provide a '*' permission or we check a role claim separately.
        // For now, check exact match.
        return permissions.value.has(permission);
    }

    async function login(credentials: LoginRequest) {
        try {
            const response = await api.login(credentials);
            token.value = response.token;
            localStorage.setItem('token', response.token);
            
            // Parse token for permissions
            try {
                const payload = parseJwt(response.token);
                if (payload.permissions && Array.isArray(payload.permissions)) {
                    permissions.value = new Set(payload.permissions);
                }
            } catch (e) {
                console.error('Failed to parse token', e);
            }

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
             // Parse token for permissions
             try {
                const payload = parseJwt(response.token);
                if (payload.permissions && Array.isArray(payload.permissions)) {
                    permissions.value = new Set(payload.permissions);
                }
            } catch (e) {
                console.error('Failed to parse token', e);
            }
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
        localStorage.removeItem('token');
        localStorage.removeItem('clubId');
    }

    return { token, clubId, isAuthenticated, permissions, hasPermission, login, register, logout };
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


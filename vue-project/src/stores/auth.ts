import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import { api } from '@/services/api';
import type { LoginRequest } from '@/types';

export const useAuthStore = defineStore('auth', () => {
    const token = ref(localStorage.getItem('token') || '');
    const clubId = ref(localStorage.getItem('clubId') || '');
    
    const isAuthenticated = computed(() => !!token.value);

    async function login(credentials: LoginRequest) {
        try {
            const response = await api.login(credentials);
            token.value = response.token;
            localStorage.setItem('token', response.token);
            
            // For now, we might need to fetch clubs to set a default clubId if not provided in login response
            // But let's assume for now we just handle the token.
            // If the API requires X-Club-ID for most requests, we need a way to select it.
            // Let's assume the user selects a club after login or it's part of the login flow later.
            // For this step, we focus on getting the token.
            
            return true;
        } catch (error) {
            console.error('Login failed', error);
            throw error;
        }
    }

    function logout() {
        token.value = '';
        clubId.value = '';
        localStorage.removeItem('token');
        localStorage.removeItem('clubId');
    }

    return { token, clubId, isAuthenticated, login, logout };
});

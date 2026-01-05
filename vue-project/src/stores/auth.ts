import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import { api } from '@/services/api';
import type { LoginRequest, RegisterRequest } from '@/types';

export const useAuthStore = defineStore('auth', () => {
    const token = ref(localStorage.getItem('token') || '');
    const clubId = ref(localStorage.getItem('clubId') || '');
    
    const isAuthenticated = computed(() => !!token.value);

    async function login(credentials: LoginRequest) {
        try {
            const response = await api.login(credentials);
            token.value = response.token;
            localStorage.setItem('token', response.token);
            
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
            return true;
        } catch (error) {
            console.error('Registration failed', error);
            throw error;
        }
    }

    function logout() {
        token.value = '';
        clubId.value = '';
        localStorage.removeItem('token');
        localStorage.removeItem('clubId');
    }

    return { token, clubId, isAuthenticated, login, register, logout };
});

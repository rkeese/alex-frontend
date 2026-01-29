<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { api } from '@/services/api';
import { useAuthStore } from '@/stores/auth';
import { useToast } from 'primevue/usetoast';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import Message from 'primevue/message';

const router = useRouter();
const authStore = useAuthStore();
const toast = useToast();

const password = ref('');
const confirmPassword = ref('');
const loading = ref(false);
const error = ref('');

const changePassword = async () => {
    if (password.value !== confirmPassword.value) {
        error.value = 'Passwörter stimmen nicht überein';
        return;
    }

    if (password.value.length < 8) {
        error.value = 'Passwort muss mindestens 8 Zeichen lang sein';
        return;
    }

    loading.value = true;
    error.value = '';

    try {
        await api.updateUser(authStore.userId, { 
            password: password.value,
            must_change_password: false // Explicitly clear the flag
        });
        
        toast.add({ severity: 'success', summary: 'Erfolg', detail: 'Passwort erfolgreich geändert. Bitte melden Sie sich erneut an.', life: 5000 });
        
        // Logout to ensure token is refreshed on next login
        // (Old token in localStorage still claims must_change_password=true)
        authStore.logout();
        router.push('/login');
    } catch (e: any) {
        console.error('Password change failed', e);
        error.value = e.message || 'Passwortänderung fehlgeschlagen';
    } finally {
        loading.value = false;
    }
};

const logout = () => {
    authStore.logout();
    router.push('/login');
};
</script>

<template>
    <div class="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 px-4">
        <div class="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md">
            <h1 class="text-2xl font-bold mb-2 text-center text-gray-800 dark:text-white">Passwort ändern</h1>
            <p class="text-center text-gray-600 dark:text-gray-400 mb-6">
                Sie müssen Ihr Passwort ändern, bevor Sie fortfahren können.
            </p>

            <Message v-if="error" severity="error" class="mb-4" :closable="false">{{ error }}</Message>

            <div class="flex flex-col gap-4">
                <div class="field">
                    <label for="password" class="block font-medium mb-1 text-gray-700 dark:text-gray-300">Neues Passwort</label>
                    <InputText id="password" v-model="password" type="password" class="w-full" toggleMask :feedback="false" />
                </div>
                <div class="field">
                    <label for="confirm" class="block font-medium mb-1 text-gray-700 dark:text-gray-300">Passwort bestätigen</label>
                    <InputText id="confirm" v-model="confirmPassword" type="password" class="w-full" toggleMask :feedback="false" />
                </div>

                <Button label="Passwort ändern" @click="changePassword" :loading="loading" class="w-full mt-2" />
                <Button label="Abbrechen (Abmelden)" @click="logout" severity="secondary" outlined class="w-full" />
            </div>
        </div>
    </div>
</template>

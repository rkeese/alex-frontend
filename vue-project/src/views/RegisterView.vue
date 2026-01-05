<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import InputText from 'primevue/inputtext';
import Password from 'primevue/password';
import Button from 'primevue/button';
import Card from 'primevue/card';
import FloatLabel from 'primevue/floatlabel';
import Message from 'primevue/message';

const router = useRouter();
const authStore = useAuthStore();

const email = ref('');
const password = ref('');
const confirmPassword = ref('');
const loading = ref(false);
const error = ref('');

const handleRegister = async () => {
    if (password.value !== confirmPassword.value) {
        error.value = 'Passwords do not match';
        return;
    }

    loading.value = true;
    error.value = '';
    try {
        await authStore.register({ email: email.value, password: password.value });
        router.push('/');
    } catch (e) {
        error.value = 'Registration failed. Please try again.';
    } finally {
        loading.value = false;
    }
};
</script>

<template>
    <div class="flex items-center justify-center min-h-screen bg-surface-100 dark:bg-surface-900 p-4">
        <Card class="w-full max-w-md shadow-xl">
            <template #title>
                <div class="text-center mb-4">
                    <h1 class="text-3xl font-bold text-primary-600 mb-2">Alex Club</h1>
                    <span class="text-surface-500 dark:text-surface-400 text-base font-normal">Create a new account</span>
                </div>
            </template>
            <template #content>
                <form @submit.prevent="handleRegister" class="flex flex-col gap-6 mt-4">
                    <Message v-if="error" severity="error" :closable="false">{{ error }}</Message>
                    
                    <FloatLabel>
                        <InputText id="email" v-model="email" class="w-full" type="email" required />
                        <label for="email">Email Address</label>
                    </FloatLabel>

                    <FloatLabel>
                        <Password id="password" v-model="password" class="w-full" :feedback="true" toggleMask required />
                        <label for="password">Password</label>
                    </FloatLabel>

                    <FloatLabel>
                        <Password id="confirmPassword" v-model="confirmPassword" class="w-full" :feedback="false" toggleMask required />
                        <label for="confirmPassword">Confirm Password</label>
                    </FloatLabel>

                    <Button type="submit" label="Register" :loading="loading" class="w-full" />
                    
                    <div class="text-center mt-4">
                        <span class="text-surface-600 dark:text-surface-300">Already have an account? </span>
                        <router-link to="/login" class="text-primary-600 hover:text-primary-700 font-medium">Login</router-link>
                    </div>
                </form>
            </template>
        </Card>
    </div>
</template>

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
const loading = ref(false);
const error = ref('');

const handleLogin = async () => {
    loading.value = true;
    error.value = '';
    try {
        await authStore.login({ email: email.value, password: password.value });
        router.push('/');
    } catch (e) {
        error.value = 'Login failed. Please check your credentials.';
    } finally {
        loading.value = false;
    }
};
</script>

<template>
    <div class="flex min-h-screen bg-surface-50 dark:bg-surface-950">
        <!-- Left Side - Image/Brand -->
        <div class="hidden lg:flex w-1/2 bg-primary-600 items-center justify-center relative overflow-hidden">
            <div class="absolute inset-0 bg-gradient-to-br from-primary-500 to-primary-800 opacity-90"></div>
            <div class="relative z-10 text-center text-white p-12">
                <div class="mb-6 text-6xl font-bold">Alex Club</div>
                <p class="text-xl text-primary-100 max-w-md mx-auto">
                    Modern club management made simple. Manage members, finances, and events in one place.
                </p>
            </div>
            <!-- Decorative circles -->
            <div class="absolute -bottom-24 -left-24 w-96 h-96 bg-white opacity-10 rounded-full blur-3xl"></div>
            <div class="absolute -top-24 -right-24 w-96 h-96 bg-white opacity-10 rounded-full blur-3xl"></div>
        </div>

        <!-- Right Side - Form -->
        <div class="w-full lg:w-1/2 flex items-center justify-center p-8">
            <div class="w-full max-w-md">
                <div class="text-center mb-8 lg:text-left">
                    <h1 class="text-3xl font-bold text-surface-900 dark:text-surface-0 mb-2">Welcome Back</h1>
                    <p class="text-surface-500 dark:text-surface-400">Please enter your details to sign in.</p>
                </div>

                <form @submit.prevent="handleLogin" class="flex flex-col gap-6">
                    <Message v-if="error" severity="error" :closable="false">{{ error }}</Message>
                    
                    <div class="flex flex-col gap-2">
                        <label for="email" class="font-medium text-surface-900 dark:text-surface-0">Email</label>
                        <InputText id="email" v-model="email" class="w-full" type="email" placeholder="Enter your email" required />
                    </div>

                    <div class="flex flex-col gap-2">
                        <div class="flex justify-between items-center">
                            <label for="password" class="font-medium text-surface-900 dark:text-surface-0">Password</label>
                            <a href="#" class="text-sm text-primary-600 hover:text-primary-700 font-medium">Forgot password?</a>
                        </div>
                        <Password id="password" v-model="password" class="w-full" :feedback="false" toggleMask inputClass="w-full" placeholder="Enter your password" required />
                    </div>

                    <Button type="submit" label="Sign In" icon="pi pi-sign-in" :loading="loading" class="w-full" />
                    
                    <div class="text-center mt-4">
                        <span class="text-surface-600 dark:text-surface-300">Don't have an account? </span>
                        <router-link to="/register" class="text-primary-600 hover:text-primary-700 font-medium">Create account</router-link>
                    </div>
                </form>
            </div>
        </div>
    </div>
</template>

<style scoped>
:deep(.p-password-input) {
    width: 100%;
}
</style>

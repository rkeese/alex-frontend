<script setup lang="ts">
import { ref, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { api } from '@/services/api';
import { ApiError } from '@/services/api';
import InputText from 'primevue/inputtext';
import Password from 'primevue/password';
import Button from 'primevue/button';
import Message from 'primevue/message';
import Select from 'primevue/select';

const router = useRouter();
const authStore = useAuthStore();

const email = ref('');
const password = ref('');
const loading = ref(false);
const error = ref('');

// Lockout state
const lockoutSeconds = ref(0);
let lockoutTimer: ReturnType<typeof setInterval> | null = null;

const startLockoutCountdown = (seconds: number) => {
    stopLockoutCountdown();
    lockoutSeconds.value = seconds;
    lockoutTimer = setInterval(() => {
        lockoutSeconds.value--;
        if (lockoutSeconds.value <= 0) {
            stopLockoutCountdown();
            error.value = '';
        }
    }, 1000);
};

const stopLockoutCountdown = () => {
    if (lockoutTimer) {
        clearInterval(lockoutTimer);
        lockoutTimer = null;
    }
    lockoutSeconds.value = 0;
};

onUnmounted(() => {
    stopLockoutCountdown();
});

const formatLockoutTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
        return `${mins} Min. ${secs.toString().padStart(2, '0')} Sek.`;
    }
    return `${secs} Sek.`;
};

// Create Association Mode
const isCreateAllMode = ref(false);
const associationName = ref('');
const associationType = ref('hobby_club');
const registerEmail = ref('');
const registerPassword = ref('');
const confirmPassword = ref('');

const clubTypes = [
    { label: 'Sportverein', value: 'sport_club' },
    { label: 'Musikverein', value: 'music_club' },
    { label: 'Gesellschaftsverein', value: 'social_club' },
    { label: 'Umwelt-/ Naturschutzverein', value: 'environment_club' },
    { label: 'Kulturverein', value: 'cultural_club' },
    { label: 'Hobby-/ Freizeitverein', value: 'hobby_club' },
    { label: 'Sozial-/ Rettungsdienst', value: 'rescue_service' }
];

const toggleCreateMode = () => {
    isCreateAllMode.value = !isCreateAllMode.value;
    error.value = '';
    associationName.value = '';
    associationType.value = 'hobby_club';
    registerEmail.value = '';
    registerPassword.value = '';
    confirmPassword.value = '';
};

const handleLogin = async () => {
    if (lockoutSeconds.value > 0) return;
    loading.value = true;
    error.value = '';
    try {
        await authStore.login({ email: email.value.trim().toLowerCase(), password: password.value });
        router.push('/');
    } catch (e: any) {
        if (e instanceof ApiError) {
            if (e.status === 429) {
                const retryAfter = e.retryAfter || 60;
                error.value = `Zu viele Anmeldeversuche. Bitte warten Sie noch ${formatLockoutTime(retryAfter)}.`;
                startLockoutCountdown(retryAfter);
            } else if (e.status === 403) {
                error.value = 'Ihr Konto wurde von einem Administrator gesperrt. Bitte wenden Sie sich an den Vereinsadministrator.';
            } else {
                error.value = 'Anmeldung fehlgeschlagen. Bitte überprüfen Sie Ihre Zugangsdaten.';
            }
        } else {
            error.value = 'Anmeldung fehlgeschlagen. Bitte überprüfen Sie Ihre Zugangsdaten.';
        }
    } finally {
        loading.value = false;
    }
};

const handleCreateAssociation = async () => {
    if (registerPassword.value !== confirmPassword.value) {
        error.value = "Passwords do not match";
        return;
    }
    loading.value = true;
    error.value = '';
    try {
        // Try to register first. If user exists (409), fall back to login.
        try {
            await authStore.register({ email: registerEmail.value.trim().toLowerCase(), password: registerPassword.value });
        } catch (regError: any) {
            if (regError.message && regError.message.includes('409')) {
                // User already registered, try to login with provided credentials
                await authStore.login({ email: registerEmail.value.trim().toLowerCase(), password: registerPassword.value });
            } else {
                throw regError;
            }
        }
        
        // At this point we are logged in. Create the club.
        // Note: Casting to any since we are selectively providing fields. Backend handles defaults/optionals.
        const clubPayload = { 
            name: associationName.value,
            type: associationType.value || 'hobby_club',
            registered_association: true 
        } as any;

        await api.createClub(clubPayload);
        
        // Login again to refresh permissions (admin role for new club)
        await authStore.login({ email: registerEmail.value.trim().toLowerCase(), password: registerPassword.value });
        
        router.push('/');
    } catch (e: any) {
        error.value = 'Failed to create association: ' + (e.message || e);
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
                
                <div v-if="!isCreateAllMode">
                    <div class="text-center mb-8 lg:text-left">
                        <h1 class="text-3xl font-bold text-surface-900 dark:text-surface-0 mb-2">Welcome Back</h1>
                        <p class="text-surface-500 dark:text-surface-400">Please enter your details to sign in.</p>
                    </div>

                    <form @submit.prevent="handleLogin" class="flex flex-col gap-6">
                        <Message v-if="error && lockoutSeconds > 0" severity="warn" :closable="false">
                            {{ error }}
                            <div class="mt-2 font-semibold">Erneuter Versuch in: {{ formatLockoutTime(lockoutSeconds) }}</div>
                        </Message>
                        <Message v-else-if="error" severity="error" :closable="false">{{ error }}</Message>
                        
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

                        <Button type="submit" label="Sign In" icon="pi pi-sign-in" :loading="loading" :disabled="lockoutSeconds > 0" class="w-full" />
                        
                        <div class="text-center mt-4">
                            <span class="text-surface-600 dark:text-surface-300">New here? </span>
                            <a href="#" @click.prevent="toggleCreateMode" class="text-primary-600 hover:text-primary-700 font-medium">Create new Association</a>
                        </div>
                    </form>
                </div>

                <div v-else>
                     <div class="text-center mb-8 lg:text-left">
                        <h1 class="text-3xl font-bold text-surface-900 dark:text-surface-0 mb-2">Create Association</h1>
                        <p class="text-surface-500 dark:text-surface-400">Register as administrator and set up your club.</p>
                    </div>

                    <form @submit.prevent="handleCreateAssociation" class="flex flex-col gap-6">
                         <Message v-if="error" severity="error" :closable="false">{{ error }}</Message>
                         
                         <div class="flex flex-col gap-2">
                            <label for="clubName" class="font-medium text-surface-900 dark:text-surface-0">Association Name</label>
                            <InputText id="clubName" v-model="associationName" class="w-full" placeholder="e.g. Chess Club 2024" required />
                        </div>

                        <div class="flex flex-col gap-2">
                            <label for="clubType" class="font-medium text-surface-900 dark:text-surface-0">Association Type</label>
                            <Select id="clubType" v-model="associationType" :options="clubTypes" optionLabel="label" optionValue="value" placeholder="Select a type" class="w-full" />
                        </div>

                        <div class="flex flex-col gap-2">
                            <label for="regEmail" class="font-medium text-surface-900 dark:text-surface-0">Email</label>
                            <InputText id="regEmail" v-model="registerEmail" class="w-full" type="email" placeholder="Enter your email" required />
                        </div>

                         <div class="flex flex-col gap-2">
                            <label for="regPassword" class="font-medium text-surface-900 dark:text-surface-0">Password</label>
                            <Password id="regPassword" v-model="registerPassword" class="w-full" toggleMask inputClass="w-full" placeholder="Choose a password" required />
                        </div>
                        
                         <div class="flex flex-col gap-2">
                            <label for="confirmPassword" class="font-medium text-surface-900 dark:text-surface-0">Confirm Password</label>
                            <Password id="confirmPassword" v-model="confirmPassword" class="w-full" :feedback="false" toggleMask inputClass="w-full" placeholder="Confirm password" required />
                        </div>

                        <Button type="submit" label="Create Association" icon="pi pi-plus-circle" :loading="loading" class="w-full" />
                        
                        <div class="text-center mt-4">
                            <span class="text-surface-600 dark:text-surface-300">Already registered? </span>
                            <a href="#" @click.prevent="toggleCreateMode" class="text-primary-600 hover:text-primary-700 font-medium">Sign In</a>
                        </div>
                    </form>
                </div>

            </div>
        </div>
    </div>
</template>

<style scoped>
:deep(.p-password-input) {
    width: 100%;
}
</style>

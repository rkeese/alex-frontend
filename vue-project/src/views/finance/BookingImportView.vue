<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { api } from '@/services/api';
import FileUpload from 'primevue/fileupload';
import Button from 'primevue/button';
import Card from 'primevue/card';
import Message from 'primevue/message';
import Toast from 'primevue/toast';
import { useToast } from 'primevue/usetoast';

const router = useRouter();
const toast = useToast();
const loading = ref(false);
const error = ref('');
const resultMessage = ref('');
const uploadKey = ref(0); // Key to force re-render of separate components

const onUpload = async (event: any) => {
    // PrimeVue FileUpload passes the file in event.files
    const file = event.files[0];
    if (!file) return;

    loading.value = true;
    error.value = '';
    resultMessage.value = '';

    try {
        const response = await api.importBookings(file);
        resultMessage.value = response.message;
        
        toast.add({ 
            severity: 'success', 
            summary: 'Success', 
            detail: response.message, 
            life: 3000 
        });
        
    } catch (e: any) {
        error.value = e.message || 'Failed to import bookings';
        toast.add({ 
            severity: 'error', 
            summary: 'Error', 
            detail: error.value, 
            life: 3000 
        });
    } finally {
        loading.value = false;
        uploadKey.value++; // Reset uploader state
    }
};
</script>

<template>
    <div class="card">
        <Toast />
        <h1 class="text-2xl font-bold mb-4">Import Bank Bookings</h1>
        
        <Card>
            <template #title>
                Upload CSV File
            </template>
            <template #content>
                <div class="mb-4">
                    <p class="mb-2">Supported formats: CSV (Sparkasse, Volksbank)</p>
                    <FileUpload 
                        :key="uploadKey"
                        mode="basic" 
                        name="file" 
                        accept=".csv" 
                        :maxFileSize="1000000"
                        :customUpload="true" 
                        @uploader="onUpload" 
                        :auto="true"
                        chooseLabel="Select CSV File" 
                        :disabled="loading"
                    />
                </div>

                <div v-if="loading" class="mt-4">
                    <i class="pi pi-spin pi-spinner text-2xl"></i> Importing...
                </div>

                <Message v-if="error" severity="error" class="mt-4" :closable="false">{{ error }}</Message>
                
                <Message v-if="resultMessage" severity="success" class="mt-4" :closable="false">
                    {{ resultMessage }}
                </Message>
            </template>
        </Card>
    </div>
</template>

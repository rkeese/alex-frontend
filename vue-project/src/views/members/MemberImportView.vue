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

const onUpload = async (event: any) => {
    // PrimeVue FileUpload passes the file in event.files
    const file = event.files[0];
    if (!file) return;

    loading.value = true;
    error.value = '';

    try {
        await api.importMembers(file);
        toast.add({ severity: 'success', summary: 'Success', detail: 'Members imported successfully', life: 3000 });
        setTimeout(() => {
            router.push('/members');
        }, 1000);
    } catch (e: any) {
        error.value = 'Import failed: ' + (e.message || 'Unknown error');
        toast.add({ severity: 'error', summary: 'Error', detail: error.value, life: 5000 });
    } finally {
        loading.value = false;
    }
};
</script>

<template>
    <div class="max-w-3xl mx-auto">
        <div class="flex items-center justify-between mb-6">
            <h1 class="text-2xl font-bold text-surface-900 dark:text-surface-0">Import Members</h1>
            <Button label="Back to List" icon="pi pi-arrow-left" text @click="router.push('/members')" />
        </div>

        <Card>
            <template #content>
                <div class="flex flex-col gap-6">
                    <Message v-if="error" severity="error" :closable="false">{{ error }}</Message>
                    
                    <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                        <h3 class="font-bold text-blue-800 dark:text-blue-200 mb-2">Instructions</h3>
                        <ul class="list-disc list-inside text-sm text-blue-700 dark:text-blue-300 space-y-1">
                            <li>File must be in CSV format (.csv)</li>
                            <li>Delimiter should be semicolon (;) or comma (,)</li>
                            <li>First row must contain headers</li>
                            <li>Required columns: member_number, first_name, last_name, birth_date, gender, joined_at</li>
                        </ul>
                    </div>

                    <FileUpload 
                        mode="advanced" 
                        name="file" 
                        accept=".csv" 
                        :maxFileSize="1000000" 
                        customUpload 
                        @uploader="onUpload" 
                        :auto="true"
                        chooseLabel="Select CSV File"
                        class="w-full"
                    >
                        <template #empty>
                            <div class="flex flex-col items-center justify-center p-8 text-surface-500">
                                <i class="pi pi-cloud-upload text-4xl mb-4"></i>
                                <p>Drag and drop a CSV file here to upload.</p>
                            </div>
                        </template>
                    </FileUpload>
                </div>
            </template>
        </Card>
        <Toast />
    </div>
</template>

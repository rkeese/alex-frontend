<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { api } from '@/services/api';
import type { BookingImport } from '@/types';
import FileUpload from 'primevue/fileupload';
import Button from 'primevue/button';
import Card from 'primevue/card';
import Message from 'primevue/message';
import Toast from 'primevue/toast';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import InputNumber from 'primevue/inputnumber';
import { useToast } from 'primevue/usetoast';

const router = useRouter();
const toast = useToast();
const loading = ref(false);
const tableLoading = ref(false);
const error = ref('');
const resultMessage = ref('');
const importErrors = ref<{ row: number; error: string }[]>([]);
const uploadKey = ref(0); // Key to force re-render of separate components

const pendingBookings = ref<BookingImport[]>([]);
const editingBooking = ref<BookingImport | null>(null);
const editDialogVisible = ref(false);
const savingEdit = ref(false);

const loadPendingBookings = async () => {
    tableLoading.value = true;
    try {
        pendingBookings.value = await api.getPendingBookings();
    } catch (e: any) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to load pending bookings' });
    } finally {
        tableLoading.value = false;
    }
};

const onUpload = async (event: any) => {
    // PrimeVue FileUpload passes the file in event.files
    const file = event.files[0];
    if (!file) return;

    loading.value = true;
    error.value = '';
    resultMessage.value = '';
    importErrors.value = [];

    try {
        const response = await api.importBookings(file);
        resultMessage.value = response.message;
        if (response.errors && response.errors.length > 0) {
            importErrors.value = response.errors;
            toast.add({ 
                severity: 'warn', 
                summary: 'Import Warning', 
                detail: `Imported with ${response.errors.length} errors. Check details below.`, 
                life: 5000 
            });
        } else {
            toast.add({ 
                severity: 'success', 
                summary: 'Success', 
                detail: response.message, 
                life: 3000 
            });
        }
        
        // Refresh the list
        await loadPendingBookings();
        
    } catch (e: any) {
        // Handle structured error response if thrown
        if (e.errors && Array.isArray(e.errors)) {
             error.value = e.message || 'Import failed with errors';
             importErrors.value = e.errors;
             toast.add({ 
                severity: 'error', 
                summary: 'Import Failed', 
                detail: error.value, 
                life: 5000 
            });
        } else {
            error.value = e.message || 'Failed to import bookings';
            toast.add({ 
                severity: 'error', 
                summary: 'Error', 
                detail: error.value, 
                life: 3000 
            });
        }
    } finally {
        loading.value = false;
        uploadKey.value++; // Reset uploader state
    }
};

const editBooking = (booking: BookingImport) => {
    editingBooking.value = { ...booking };
    editDialogVisible.value = true;
};

const saveBooking = async () => {
    if (!editingBooking.value) return;
    
    savingEdit.value = true;
    try {
        await api.updatePendingBooking(editingBooking.value.id, editingBooking.value);
        toast.add({ severity: 'success', summary: 'Success', detail: 'Booking updated' });
        editDialogVisible.value = false;
        await loadPendingBookings();
    } catch (e: any) {
        toast.add({ severity: 'error', summary: 'Error', detail: e.message || 'Update failed' });
    } finally {
        savingEdit.value = false;
    }
};

const deleteBooking = async (id: string) => {
    if (!confirm('Are you sure you want to discard this booking?')) return;
    
    try {
        await api.deletePendingBooking(id);
        toast.add({ severity: 'success', summary: 'Success', detail: 'Booking discarded' });
        await loadPendingBookings();
    } catch (e: any) {
        toast.add({ severity: 'error', summary: 'Error', detail: e.message || 'Delete failed' });
    }
};

const commitBooking = async (id: string) => {
    try {
        await api.commitPendingBooking(id);
        toast.add({ severity: 'success', summary: 'Success', detail: 'Booking committed' });
        await loadPendingBookings();
    } catch (e: any) {
        toast.add({ severity: 'error', summary: 'Error', detail: e.message || 'Commit failed' });
    }
};

onMounted(() => {
    loadPendingBookings();
});
</script>

<template>
    <div class="card">
        <Toast />
        <h1 class="text-2xl font-bold mb-4">Import Bank Bookings</h1>
        
        <Card class="mb-4">
            <template #title>
                1. Upload CSV File
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

                <div v-if="importErrors.length > 0" class="mt-4">
                    <Message severity="warn" :closable="false">
                        The import completed with errors. See details below.
                    </Message>
                    <DataTable :value="importErrors" class="mt-2" scrollable scrollHeight="300px">
                         <Column field="row" header="Row" style="width: 80px"></Column>
                         <Column field="error" header="Error Message"></Column>
                    </DataTable>
                </div>
            </template>
        </Card>

        <Card>
            <template #title>
                2. Review & Commit Pending Imports
            </template>
            <template #content>
                <DataTable :value="pendingBookings" :loading="tableLoading" paginator :rows="10" tableStyle="min-width: 50rem">
                    <template #empty>No pending imports found.</template>
                    
                    <Column field="valuta_date" header="Valuta" sortable></Column>
                    <Column field="client_recipient" header="Recipient" sortable></Column>
                    <Column field="purpose" header="Purpose" sortable></Column>
                    <Column field="amount" header="Amount" sortable>
                        <template #body="slotProps">
                            <span :class="{'text-red-500': slotProps.data.amount < 0, 'text-green-500': slotProps.data.amount > 0}">
                                {{ new Intl.NumberFormat('de-DE', { style: 'currency', currency: slotProps.data.currency || 'EUR' }).format(slotProps.data.amount) }}
                            </span>
                        </template>
                    </Column>
                    <Column field="client_iban" header="IBAN" sortable></Column>
                    <Column header="Actions">
                        <template #body="slotProps">
                            <div class="flex gap-2">
                                <Button icon="pi pi-check" severity="success" outlined rounded aria-label="Commit" @click="commitBooking(slotProps.data.id)" title="Commit" />
                                <Button icon="pi pi-pencil" severity="info" outlined rounded aria-label="Edit" @click="editBooking(slotProps.data)" title="Edit" />
                                <Button icon="pi pi-trash" severity="danger" outlined rounded aria-label="Delete" @click="deleteBooking(slotProps.data.id)" title="Discard" />
                            </div>
                        </template>
                    </Column>
                </DataTable>
            </template>
        </Card>

        <Dialog v-model:visible="editDialogVisible" header="Edit Booking Import" :style="{ width: '500px' }" modal>
            <div v-if="editingBooking" class="flex flex-col gap-4">
                <div class="flex flex-col gap-2">
                    <label for="valuta_date">Valuta Date</label>
                    <InputText id="valuta_date" v-model="editingBooking.valuta_date" />
                </div>
                <div class="flex flex-col gap-2">
                    <label for="recipient_name">Recipient</label>
                    <InputText id="recipient_name" v-model="editingBooking.client_recipient" />
                </div>
                <div class="flex flex-col gap-2">
                    <label for="purpose">Purpose</label>
                    <InputText id="purpose" v-model="editingBooking.purpose" />
                </div>
                <div class="flex flex-col gap-2">
                    <label for="amount">Amount</label>
                    <InputNumber id="amount" v-model="editingBooking.amount" mode="currency" currency="EUR" locale="de-DE" />
                </div>
                <div class="flex flex-col gap-2">
                    <label for="recipient_iban">IBAN</label>
                    <InputText id="recipient_iban" v-model="editingBooking.client_iban" />
                </div>
            </div>
            <template #footer>
                <Button label="Cancel" icon="pi pi-times" text @click="editDialogVisible = false" />
                <Button label="Save" icon="pi pi-check" @click="saveBooking" :loading="savingEdit" />
            </template>
        </Dialog>
    </div>
</template>

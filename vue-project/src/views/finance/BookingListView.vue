<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { api } from '@/services/api';
import type { Booking } from '@/types';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Card from 'primevue/card';
import Button from 'primevue/button';
import { useRouter } from 'vue-router';

const router = useRouter();
const bookings = ref<Booking[]>([]);
const loading = ref(true);
const error = ref('');
const debugMode = ref(false);

const loadBookings = async () => {
    loading.value = true;
    error.value = '';
    console.log('Starting load Bookings...');
    try {
        // const data = await api.getBookings(); // Temporary disabled automatic fetching
        const data: Booking[] = []; 
        console.log('API returned (mocked):', data);
        bookings.value = Array.isArray(data) ? data : [];
    } catch (e: any) {
        console.error('Failed to load bookings', e);
        error.value = e.message || 'Failed to load data';
        bookings.value = [];
        debugMode.value = true;
    } finally {
        loading.value = false;
        console.log('Loading finished.');
    }
};

/* 
onMounted(() => {
    loadBookings();
});
*/

const fetchRealData = async () => {
    loading.value = true;
    try {
        const data = await api.getBookings();
        console.log('Real API Data:', data);
        // Safety slice to prevent massive rendering freeze if > 1000 items (until pagination is server-side)
        if (Array.isArray(data) && data.length > 500) {
            alert(`Warning: Received ${data.length} records. Truncating to 500 for safety.`);
            bookings.value = data.slice(0, 500);
        } else {
            bookings.value = Array.isArray(data) ? data : [];
        }
    } catch (e: any) {
        error.value = e.message;
    } finally {
        loading.value = false;
    }
};

const formatCurrency = (value: number, currency: string) => {
    if (value === undefined || value === null) return '';
    
    // Sanitize currency: Valid ISO 4217 codes are 3 letters. 
    // Data "ABSCHLUSS" was found in logs, indicating bad data import.
    let code = currency;
    if (!code || code.length !== 3) {
        code = 'EUR'; 
    }

    try {
        return new Intl.NumberFormat('de-DE', { style: 'currency', currency: code }).format(value);
    } catch (e) {
        // Fallback if code is still invalid according to Intl
        return `${value.toFixed(2)} ${currency || ''}`; 
    }
};

const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('de-DE');
};
</script>

<template>
    <div class="card">
        <h1 class="text-2xl font-bold mb-4">Bank Bookings</h1>
        
        <Card>
            <template #content>
                <div class="flex justify-between mb-4">
                     <h2 class="text-xl">Details</h2>
                     <div>
                        <Button label="Load Data" icon="pi pi-refresh" class="mr-2" @click="fetchRealData" />
                        <Button label="Toggle Debug View" icon="pi pi-cog" class="p-button-secondary p-button-text mr-2" @click="debugMode = !debugMode" />
                        <Button label="Import" icon="pi pi-upload" @click="router.push('/finance/import')" />
                     </div>
                </div>
                
                <div v-if="error" class="p-4 mb-4 bg-red-100 text-red-700 rounded">
                    {{ error }}
                </div>

                <!-- Debug View -->
                <div v-if="debugMode" class="mb-4">
                    <Button label="Exit Debug Mode" @click="debugMode = false" class="mb-2" />
                    <pre class="bg-gray-100 p-4 rounded overflow-auto max-h-96">{{ JSON.stringify(bookings, null, 2) }}</pre>
                </div>

                <!-- 
                     Removed v-if="loading" and v-else logic to prevent VDOM patching errors 
                     when switching between 'Loading' div and DataTable component.
                     The DataTable handles the loading state internally via the :loading prop.
                -->
                <DataTable v-if="!debugMode" :value="bookings" :loading="loading" paginator :rows="10" tableStyle="min-width: 50rem">
                    <Column field="booking_date" header="Date">
                        <template #body="slotProps">
                             <span>{{ formatDate(slotProps.data.booking_date) }}</span>
                        </template>
                    </Column>
                    <Column field="applicant_name" header="Applicant" sortable></Column>
                    <Column field="purpose" header="Purpose" sortable></Column>
                    <Column field="amount" header="Amount" sortable>
                        <template #body="slotProps">
                            <span :class="{'text-red-500': (slotProps.data.amount || 0) < 0, 'text-green-500': (slotProps.data.amount || 0) > 0}">
                                {{ formatCurrency(slotProps.data.amount, slotProps.data.currency) }}
                            </span>
                        </template>
                    </Column>
                    <Column field="external_iban" header="IBAN"></Column>
                    <Column field="status" header="Status"></Column>
                </DataTable>
            </template>
        </Card>
    </div>
</template>

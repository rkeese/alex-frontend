<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { api } from '@/services/api';
import type { Booking, BankAccount, BookingAccount } from '@/types';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Card from 'primevue/card';
import Button from 'primevue/button';
import Dropdown from 'primevue/dropdown';
import Dialog from 'primevue/dialog';
import Calendar from 'primevue/calendar';
import { useRouter } from 'vue-router';

const router = useRouter();
const bookings = ref<Booking[]>([]);
const bankAccounts = ref<BankAccount[]>([]);
const bookingAccounts = ref<BookingAccount[]>([]);

// Filter States
const selectedBankAccountId = ref<string | null>(null);
const dateRange = ref<Date[] | null>(null);

// Financial Summaries
const startAmount = ref(0);
const endAmount = ref(0);

const loading = ref(false);
const error = ref('');
const debugMode = ref(false);

const selectedBooking = ref<Booking | null>(null);
const detailsVisible = ref(false);
const selectedBookingAccountLink = ref<string | null>(null);

const loadMetadata = async () => {
    try {
        const banks = await api.getBankAccounts();
        bankAccounts.value = banks || [];
        
        const bAccounts = await api.getBookingAccounts();
        bookingAccounts.value = bAccounts || [];

        // specific default: Current Year
        const now = new Date();
        const startOfYear = new Date(now.getFullYear(), 0, 1); 
        const endOfYear = new Date(now.getFullYear(), 11, 31);
        dateRange.value = [startOfYear, endOfYear];

    } catch (e) {
        console.error('Failed to load metadata', e);
    }
};

const formatDateParam = (d: Date) => {
    // Ensure we send local date components, not UTC
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const fetchRealData = async () => {
    loading.value = true;
    error.value = '';
    bookings.value = [];
    
    // Prepare params
    const startDate = dateRange.value && dateRange.value[0] ? formatDateParam(dateRange.value[0]) : undefined;
    const endDate = dateRange.value && dateRange.value[1] ? formatDateParam(dateRange.value[1]) : undefined;
    
    try {
        const response = await api.getBookings(selectedBankAccountId.value, startDate, endDate);
        console.log('Real API Data:', response);
        
        // Robust handling: Check for response object and its properties
        if (response) {
            bookings.value = Array.isArray(response.bookings) ? response.bookings : [];
            startAmount.value = response.start_amount || 0;
            endAmount.value = response.end_amount || 0;

            if (bookings.value.length > 1000) {
                alert(`Warning: Received ${bookings.value.length} records. Truncating for performance.`);
                bookings.value = bookings.value.slice(0, 1000);
            }
        } else {
             // Fallback/Empty
             bookings.value = [];
             startAmount.value = 0;
             endAmount.value = 0;
        }

    } catch (e: any) {
        console.error('Failed to load bookings', e);
        error.value = e.message || 'Failed to load booking data';
    } finally {
        loading.value = false;
    }
};

// Reload when filters change
watch(selectedBankAccountId, () => {
    fetchRealData();
});

// Since calendar range selection is tricky with watchers (triggers on first click), 
// we rely mostly on the "Refresh/Load" button, or we can watch but debounce.
// For now, let's keep it manual or watch explicitly if range is complete.
watch(dateRange, (newVal) => {
    if (newVal && newVal[0] && newVal[1]) {
        fetchRealData();
    }
});

onMounted(async () => {
    await loadMetadata();
    // Use the default set range to load initial data if we want, 
    // or wait for user. Let's load if we have accounts.
    // fetchRealData(); 
});

const totalPeriodChange = computed(() => {
    // If backend provides start/end, we can use difference
    // or sum up visible rows. 
    // Backend Logic: End - Start
    return endAmount.value - startAmount.value;
});

const formatCurrency = (value: number, currency: string | undefined) => {
    if (value === undefined || value === null) return '';
    let code = currency;
    if (!code || code.length !== 3) {
        code = 'EUR'; 
    }
    try {
        return new Intl.NumberFormat('de-DE', { style: 'currency', currency: code }).format(value);
    } catch (e) {
        return `${value.toFixed(2)} ${currency || ''}`; 
    }
};

const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('de-DE');
};

const onRowClick = (event: any) => {
    const booking = event.data;
    selectedBooking.value = booking;
    
    // Set the dropdown to the currently assigned ID
    selectedBookingAccountLink.value = booking.assigned_booking_account_id || null;
    
    detailsVisible.value = true;
};

const saveBookingLink = async () => {
    if (!selectedBooking.value) return;
    
    try {
        const updatePayload = {
            assigned_booking_account_id: selectedBookingAccountLink.value
        };

        await api.updateBooking(selectedBooking.value.id, updatePayload);
        
        // Update local model to reflect change immediately
        selectedBooking.value.assigned_booking_account_id = selectedBookingAccountLink.value;
        const idx = bookings.value.findIndex(b => b.id === selectedBooking.value?.id);
        if (idx !== -1) {
            bookings.value[idx].assigned_booking_account_id = selectedBookingAccountLink.value;
        }

        detailsVisible.value = false;
    } catch (e: any) {
        console.error('Failed to update booking link', e);
        alert('Failed to update assignment: ' + e.message);
    }
};

const getBookingAccountName = (id?: string | null) => {
    if (!id) return '';
    const acc = bookingAccounts.value.find(a => a.id === id);
    return acc ? acc.majority_list : 'Unassigned';
};
</script>

<template>
    <div class="card">
        <h1 class="text-2xl font-bold mb-4">Bank Bookings</h1>
        
        <Card>
            <template #content>
                <!-- Controls Header -->
                <div class="flex flex-wrap align-items-center justify-content-between mb-4 gap-3">
                    <div class="flex flex-wrap align-items-center gap-2">
                        <div class="flex flex-col">
                            <span class="text-xs text-gray-500 mb-1">Account</span>
                            <Dropdown 
                                v-model="selectedBankAccountId" 
                                :options="bankAccounts" 
                                optionLabel="name" 
                                optionValue="id" 
                                placeholder="Select Account" 
                                showClear
                                class="w-full md:w-14rem" 
                            />
                        </div>

                        <div class="flex flex-col">
                            <span class="text-xs text-gray-500 mb-1">Period</span>
                            <Calendar 
                                v-model="dateRange" 
                                selectionMode="range" 
                                :manualInput="false" 
                                dateFormat="dd.mm.yy" 
                                showIcon 
                                placeholder="Select Date Range"
                            />
                        </div>

                        <div class="flex items-end h-full mt-auto">
                             <Button label="Load" icon="pi pi-refresh" @click="fetchRealData" :loading="loading" />
                        </div>
                    </div>

                    <!-- Financial Summary -->
                    <div v-if="selectedBankAccountId" class="flex align-items-center gap-4 bg-gray-50 p-2 rounded shadow-sm border">
                         <div class="flex flex-col">
                            <span class="text-xs text-gray-500 uppercase font-semibold">Start</span>
                            <span class="font-mono text-lg">{{ formatCurrency(startAmount, 'EUR') }}</span>
                         </div>
                         <div class="text-gray-400"><i class="pi pi-arrow-right"></i></div>
                         <div class="flex flex-col">
                            <span class="text-xs text-gray-500 uppercase font-semibold">Change</span>
                            <span :class="{'text-red-600': totalPeriodChange < 0, 'text-green-600': totalPeriodChange > 0, 'font-bold text-lg': true}">
                                {{ totalPeriodChange > 0 ? '+' : '' }}{{ formatCurrency(totalPeriodChange, 'EUR') }}
                            </span>
                         </div>
                         <div class="text-gray-400"><i class="pi pi-arrow-right"></i></div>
                         <div class="flex flex-col">
                            <span class="text-xs text-gray-500 uppercase font-semibold">End</span>
                            <span class="font-bold font-mono text-lg">{{ formatCurrency(endAmount, 'EUR') }}</span>
                         </div>
                    </div>

                    <div>
                        <Button label="Import" icon="pi pi-upload" class="p-button-outlined" @click="router.push('/finance/import')" />
                        <!-- <Button icon="pi pi-cog" class="p-button-text ml-2" @click="debugMode = !debugMode" /> -->
                    </div>
                </div>
                
                <div v-if="error" class="p-4 mb-4 bg-red-100 text-red-700 rounded shadow-sm">
                    {{ error }}
                </div>
                
                <div v-if="bookings.length === 0 && !loading" class="p-4 mb-4 bg-blue-50 text-blue-700 rounded border border-blue-200">
                    <i class="pi pi-info-circle mr-2"></i> No bookings found for the selected period/account. Try adjusting the date range or selecting "All Accounts".
                </div>

                <DataTable 
                    v-if="!debugMode && bookings.length > 0" 
                    :value="bookings" 
                    :loading="loading" 
                    paginator 
                    :rows="10" 
                    dataKey="id"
                    selectionMode="single"
                    @row-click="onRowClick"
                    tableStyle="min-width: 60rem"
                    class="p-datatable-sm shadow-sm border rounded"
                    stripedRows
                >
                    <Column field="valuta_date" header="Valuta" sortable style="width: 10%">
                        <template #body="slotProps">
                             <span>{{ formatDate(slotProps.data.valuta_date) }}</span>
                        </template>
                    </Column>
                    <Column field="client_recipient" header="Empfänger" sortable style="width: 25%">
                        <template #body="slotProps">
                            <div class="font-semibold">{{ slotProps.data.client_recipient }}</div>
                        </template>
                    </Column>
                    <Column field="purpose" header="Verwendungszweck" sortable style="width: 35%">
                         <template #body="slotProps">
                            <div class="truncate max-w-md text-sm text-gray-600" :title="slotProps.data.purpose">
                                {{ slotProps.data.purpose }}
                            </div>
                        </template>
                    </Column>
                    <Column field="amount" header="Betrag" sortable style="width: 15%">
                        <template #body="slotProps">
                            <span :class="{'text-red-600': (slotProps.data.amount || 0) < 0, 'text-green-600': (slotProps.data.amount || 0) > 0, 'font-mono': true, 'font-bold': true}">
                                {{ formatCurrency(slotProps.data.amount, slotProps.data.currency) }}
                            </span>
                        </template>
                    </Column>
                    <Column header="Category" style="width: 15%">
                        <template #body="slotProps">
                            <span v-if="slotProps.data.assigned_booking_account_id" class="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                                {{ getBookingAccountName(slotProps.data.assigned_booking_account_id) }}
                            </span>
                            <span v-else class="text-orange-400 text-xs flex items-center">
                                <i class="pi pi-exclamation-triangle mr-1"></i> Unassigned
                            </span>
                        </template>
                    </Column>
                    <Column field="external_iban" header="IBAN" style="width: 0%; display:none"></Column> <!-- Hidden or secondary -->
                </DataTable>
            </template>
        </Card>

        <!-- Detail Dialog -->
        <Dialog v-model:visible="detailsVisible" header="Booking Details" :style="{ width: '550px' }" modal class="p-fluid">
            <div v-if="selectedBooking" class="flex flex-col gap-4">
                <div class="grid grid-cols-2 gap-4">
                     <div class="flex flex-col">
                        <label class="text-sm font-bold text-gray-500">Valuta</label>
                        <span class="text-lg">{{ formatDate(selectedBooking.valuta_date) }}</span>
                    </div>
                     <div class="flex flex-col items-end">
                        <label class="text-sm font-bold text-gray-500">Amount</label>
                        <span :class="{'text-red-600': selectedBooking.amount < 0, 'text-green-600': selectedBooking.amount > 0, 'text-2xl font-bold': true}">
                            {{ formatCurrency(selectedBooking.amount, selectedBooking.currency) }}
                        </span>
                    </div>
                </div>

                 <div class="flex flex-col bg-gray-50 p-3 rounded border">
                    <label class="text-xs font-bold text-gray-500 uppercase mb-1">Recipient / Sender</label>
                    <span class="font-semibold text-lg">{{ selectedBooking.client_recipient }}</span>
                    <div class="flex flex-col mt-2 gap-1">
                        <div v-if="selectedBooking.client_iban" class="flex items-center gap-2">
                             <span class="text-xs text-gray-400 w-10">IBAN</span>
                             <span class="font-mono text-sm text-gray-700 select-all">{{ selectedBooking.client_iban }}</span>
                        </div>
                        <div v-if="selectedBooking.client_bic" class="flex items-center gap-2">
                             <span class="text-xs text-gray-400 w-10">BIC</span>
                             <span class="font-mono text-sm text-gray-700 select-all">{{ selectedBooking.client_bic }}</span>
                        </div>
                    </div>
                </div>
                
                <div class="flex flex-col">
                    <label class="text-sm font-bold text-gray-500">Purpose</label>
                    <p class="bg-gray-50 p-2 rounded text-sm whitespace-pre-wrap leading-relaxed border">{{ selectedBooking.purpose }}</p>
                </div>

                <div class="border-t pt-4 mt-2">
                    <h3 class="font-bold mb-3 text-lg text-primary">Accounting Assignment</h3>
                    <div class="flex flex-col gap-2">
                        <label class="text-sm text-gray-600">Assign to Booking Account (Category)</label>
                        <Dropdown 
                            v-model="selectedBookingAccountLink" 
                            :options="bookingAccounts" 
                            optionLabel="majority_list" 
                            optionValue="id"
                            placeholder="Select Account" 
                            filter
                            showClear
                            class="w-full"
                        />
                         <small class="text-gray-400">Categorize this transaction for financial reports.</small>
                    </div>
                </div>
            </div>
            <template #footer>
                <Button label="Cancel" icon="pi pi-times" @click="detailsVisible = false" class="p-button-text" />
                <Button label="Save Assignment" icon="pi pi-check" @click="saveBookingLink" autofocus />
            </template>
        </Dialog>
    </div>
</template>

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
const debugResponse = ref<any>('No API response yet'); 
const debugRequest = ref<any>({}); // Track what we sent

const selectedBooking = ref<Booking | null>(null);
const detailsVisible = ref(false);
const selectedBookingAccountLink = ref<string | null>(null);

const loadMetadata = async () => {
    try {
        const banks = await api.getBankAccounts();
        bankAccounts.value = banks || [];
        
        const bAccounts = await api.getBookingAccounts();
        bookingAccounts.value = bAccounts || [];

        // specific default: Start of PREVIOUS Year to End of Current Year
        const now = new Date();
        const startOfLastYear = new Date(now.getFullYear() - 1, 0, 1); 
        const endOfYear = new Date(now.getFullYear(), 11, 31);
        dateRange.value = [startOfLastYear, endOfYear];

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
    
    // Debug: Show exactly what api.ts sends
    debugRequest.value = {
        bank_account_id: selectedBankAccountId.value,
        start_date: startDate,
        end_date: endDate,
        timestamp: new Date().toISOString()
    };

    try {
        const response = await api.getBookings(selectedBankAccountId.value, startDate, endDate);
        console.log('Real API Data:', response);
        debugResponse.value = response;
        
        // Handle various response shapes (New Object vs Old Array vs Empty)
        let list: Booking[] = [];
        
        if (Array.isArray(response)) {
             // Legacy Array Response
             list = response;
             startAmount.value = 0;
             endAmount.value = 0;
        } else if (response && typeof response === 'object') {
             // New Object Response
             list = Array.isArray(response.bookings) ? response.bookings : [];
             startAmount.value = response.start_amount || 0;
             endAmount.value = response.end_amount || 0;
        }

        // Normalize Data (Handle valuta_date vs booking_date mismatch)
        bookings.value = list.map(b => ({
            ...b,
            valuta_date: b.valuta_date || b.booking_date || ''
        }));

        if (bookings.value.length > 1000) {
            alert(`Warning: Received ${bookings.value.length} records. Truncating for performance.`);
            bookings.value = bookings.value.slice(0, 1000);
        }

    } catch (e: any) {
        console.error('Failed to load bookings', e);
        error.value = e.message || 'Failed to load booking data';
        debugResponse.value = { error: error.value };
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

const getBookingAccountLabel = (account: BookingAccount) => {
    let label = account.majority_list_description || account.majority_list;
    if (account.minority_list) {
        label += ` - ${account.minority_list}`;
    }
    return label;
};

const getBookingAccountName = (id?: string | null) => {
    if (!id) return '';
    const acc = bookingAccounts.value.find(a => a.id === id);
    return acc ? getBookingAccountLabel(acc) : 'Unassigned';
};

const fetchAllData = async () => {
    // DIAGNOSTIC HELPER: Fetch with EXPLICIT WIDE RANGE
    loading.value = true;
    selectedBankAccountId.value = null; // Clear UI filter
    
    const wideStart = "2000-01-01";
    const wideEnd = "2099-12-31";
    
    // Update UI to reflect what we are doing
    dateRange.value = [new Date(wideStart), new Date(wideEnd)];

    try {
        // Send explicit dates to ensure backend doesn't default to "This Month" or "This Year"
        const response = await api.getBookings(null, wideStart, wideEnd);
        
        console.log('Diagnostic Load (Global Wide):', response);
        debugRequest.value = { mode: 'DIAGNOSTIC_GLOBAL_WIDE', bank_account_id: null, start_date: wideStart, end_date: wideEnd };
        debugResponse.value = response;
        
        let list: Booking[] = [];
        if (response && typeof response === 'object' && Array.isArray(response.bookings)) {
             list = response.bookings;
             startAmount.value = response.start_amount || 0;
             endAmount.value = response.end_amount || 0;
        } else if (Array.isArray(response)) {
             list = response;
        }
        
        bookings.value = list.map(b => ({
            ...b,
            valuta_date: b.valuta_date || b.booking_date || ''
        }));
        
        if (bookings.value.length === 0) {
            alert("Still 0 records found in 2000-2099. \n\nIf the Import was successful, the records might be linked to a different Club ID or DB transaction failed.");
        } else {
            // Success - Just show them
        }

    } catch (e: any) {
        error.value = "Diagnostic failed: " + e.message;
    } finally {
        loading.value = false;
    }
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
                        <Button label="Debug" icon="pi pi-cog" class="p-button-text ml-2" @click="debugMode = !debugMode" />
                    </div>
                </div>
                
                <div v-if="error" class="p-4 mb-4 bg-red-100 text-red-700 rounded shadow-sm">
                    {{ error }}
                </div>
                
                <div v-if="bookings.length === 0 && !loading" class="p-4 mb-4 bg-blue-50 text-blue-700 rounded border border-blue-200 flex flex-col gap-2">
                    <div class="flex items-center">
                        <i class="pi pi-info-circle mr-2"></i> 
                        <span>No bookings found for the selected period/account.</span>
                    </div>
                    <div class="ml-6 text-sm">
                        <p>Troubleshooting suggestions:</p>
                        <ul class="list-disc ml-4">
                            <li>Try clearing the "Account" filter to "All Accounts".</li>
                            <li>Your imported data might be outside the selected Date Range.</li>
                            <li>Did the Import say "0 imported"? Check your CSV format.</li>
                            <li><a href="#" @click.prevent="fetchAllData" class="underline font-bold hover:text-blue-900">Click here to Force Load ALL data (Clears all filters)</a></li>
                        </ul>
                    </div>
                </div>

                 <!-- Debug View -->
                <div v-if="debugMode" class="mb-4">
                    <Button label="Exit Debug Mode" @click="debugMode = false" class="mb-2" />
                    <div class="grid grid-cols-2 gap-4">
                        <div class="bg-gray-100 p-2 rounded">
                            <h3 class="font-bold text-sm">Processed Bookings ({{ bookings.length }})</h3>
                            <pre class="text-xs overflow-auto max-h-60">{{ JSON.stringify(bookings, null, 2) }}</pre>
                        </div>
                         <div class="bg-gray-100 p-2 rounded">
                            <h3 class="font-bold text-sm">Request & Response</h3>
                            <div class="text-xs mb-2 p-1 bg-yellow-50 border border-yellow-200">
                                <strong>Request:</strong> {{ JSON.stringify(debugRequest) }}
                            </div>
                            <pre class="text-xs overflow-auto max-h-60">{{ JSON.stringify(debugResponse, null, 2) }}</pre>
                            <div class="mt-2 text-xs">
                                <div>Loading: {{ loading }}</div>
                                <div>Error: {{ error }}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <DataTable 
                    v-if="!debugMode" 
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
                             <span>{{ formatDate(slotProps.data.valuta_date || slotProps.data.booking_date) }}</span>
                        </template>
                    </Column>
                    <Column field="payment_participant_name" header="Empfänger" sortable style="width: 25%">
                        <template #body="slotProps">
                            <div class="font-semibold">{{ slotProps.data.payment_participant_name || slotProps.data.client_recipient }}</div>
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
                            :optionLabel="getBookingAccountLabel" 
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

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
import Textarea from 'primevue/textarea';
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
        toast.add({ severity: 'error', summary: 'Fehler', detail: 'Fehler beim Laden der offenen Buchungen' });
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
                summary: 'Import Warnung', 
                detail: `Import mit ${response.errors.length} Fehlern abgeschlossen. Siehe Details unten.`, 
                life: 5000 
            });
        } else {
            toast.add({ 
                severity: 'success', 
                summary: 'Erfolg', 
                detail: response.message, 
                life: 3000 
            });
        }
        
        // Refresh the list
        await loadPendingBookings();
        
    } catch (e: any) {
        // Handle structured error response if thrown
        if (e.errors && Array.isArray(e.errors)) {
             error.value = e.message || 'Import fehlgeschlagen mit Fehlern';
             importErrors.value = e.errors;
             toast.add({ 
                severity: 'error', 
                summary: 'Import fehlgeschlagen', 
                detail: error.value, 
                life: 5000 
            });
        } else {
            error.value = e.message || 'Fehler beim Importieren der Buchungen';
            toast.add({ 
                severity: 'error', 
                summary: 'Fehler', 
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
        toast.add({ severity: 'success', summary: 'Erfolg', detail: 'Buchung aktualisiert' });
        editDialogVisible.value = false;
        await loadPendingBookings();
    } catch (e: any) {
        toast.add({ severity: 'error', summary: 'Fehler', detail: e.message || 'Aktualisierung fehlgeschlagen' });
    } finally {
        savingEdit.value = false;
    }
};

const deleteBooking = async (id: string) => {
    if (!confirm('Sind Sie sicher, dass Sie diese Buchung verwerfen möchten?')) return;
    
    try {
        await api.deletePendingBooking(id);
        toast.add({ severity: 'success', summary: 'Erfolg', detail: 'Buchung verworfen' });
        await loadPendingBookings();
    } catch (e: any) {
        toast.add({ severity: 'error', summary: 'Fehler', detail: e.message || 'Löschen fehlgeschlagen' });
    }
};

const commitBooking = async (booking: BookingImport) => {
    try {
        await api.commitPendingBooking(booking.id, booking);
        toast.add({ severity: 'success', summary: 'Erfolg', detail: 'Buchung verbucht' });
        await loadPendingBookings();
    } catch (e: any) {
        toast.add({ severity: 'error', summary: 'Fehler', detail: e.message || 'Verbuchen fehlgeschlagen' });
    }
};

onMounted(() => {
    loadPendingBookings();
});
</script>

<template>
    <div class="card">
        <Toast />
        <h1 class="text-2xl font-bold mb-4">Bankbuchungen importieren</h1>
        
        <Card class="mb-4">
            <template #title>
                1. CSV-Datei hochladen
            </template>
            <template #content>
                <div class="mb-4">
                    <p class="mb-2">Unterstützte Formate: CSV (Sparkasse, Volksbank)</p>
                    <FileUpload 
                        :key="uploadKey"
                        mode="basic" 
                        name="file" 
                        accept=".csv" 
                        :maxFileSize="1000000"
                        :customUpload="true" 
                        @uploader="onUpload" 
                        :auto="true"
                        chooseLabel="CSV-Datei auswählen" 
                        :disabled="loading"
                    />
                </div>

                <div v-if="loading" class="mt-4">
                    <i class="pi pi-spin pi-spinner text-2xl"></i> Importiere...
                </div>

                <Message v-if="error" severity="error" class="mt-4" :closable="false">{{ error }}</Message>
                
                <Message v-if="resultMessage" severity="success" class="mt-4" :closable="false">
                    {{ resultMessage }}
                </Message>

                <div v-if="importErrors.length > 0" class="mt-4">
                    <Message severity="warn" :closable="false">
                        Der Import wurde mit Fehlern abgeschlossen. Siehe Details unten.
                    </Message>
                    <DataTable :value="importErrors" class="mt-2" scrollable scrollHeight="300px">
                         <Column field="row" header="Zeile" style="width: 80px"></Column>
                         <Column field="error" header="Fehlermeldung"></Column>
                    </DataTable>
                </div>
            </template>
        </Card>

        <Card>
            <template #title>
                2. Ausstehende Importe prüfen & verbuchen
            </template>
            <template #content>
                <DataTable :value="pendingBookings" :loading="tableLoading" paginator :rows="10" tableStyle="min-width: 50rem">
                    <template #empty>Keine ausstehenden Importe gefunden.</template>
                    
                    <Column field="valuta_date" header="Valuta" sortable></Column>
                    <Column field="payment_participant_name" header="Empfänger" sortable>
                         <template #body="slotProps">
                            {{ slotProps.data.payment_participant_name || slotProps.data.client_recipient }}
                        </template>
                    </Column>
                    <Column field="purpose" header="Verwendungszweck" sortable></Column>
                    <Column field="amount" header="Betrag" sortable>
                        <template #body="slotProps">
                            <span :class="{'text-red-500': slotProps.data.amount < 0, 'text-green-500': slotProps.data.amount > 0}">
                                {{ new Intl.NumberFormat('de-DE', { style: 'currency', currency: slotProps.data.currency || 'EUR' }).format(slotProps.data.amount) }}
                            </span>
                        </template>
                    </Column>
                    <Column field="payment_participant_iban" header="IBAN" sortable>
                        <template #body="slotProps">
                            {{ slotProps.data.payment_participant_iban || slotProps.data.client_iban }}
                        </template>
                    </Column>
                    <Column header="Aktionen">
                        <template #body="slotProps">
                            <div class="flex gap-2">
                                <Button icon="pi pi-check" severity="success" outlined rounded aria-label="Verbuchen" @click="commitBooking(slotProps.data)" title="Verbuchen" />
                                <Button icon="pi pi-pencil" severity="info" outlined rounded aria-label="Bearbeiten" @click="editBooking(slotProps.data)" title="Bearbeiten" />
                                <Button icon="pi pi-trash" severity="danger" outlined rounded aria-label="Löschen" @click="deleteBooking(slotProps.data.id)" title="Verwerfen" />
                            </div>
                        </template>
                    </Column>
                </DataTable>
            </template>
        </Card>

        <Dialog v-model:visible="editDialogVisible" header="Buchungsimport bearbeiten" :style="{ width: '500px' }" modal>
            <div v-if="editingBooking" class="flex flex-col gap-4">
                <div class="flex flex-col gap-2">
                    <label for="valuta_date">Valuta-Datum</label>
                    <InputText id="valuta_date" v-model="editingBooking.valuta_date" />
                </div>
                <div class="flex flex-col gap-2">
                    <label for="recipient_name">Empfänger</label>
                    <InputText id="recipient_name" v-model="editingBooking.payment_participant_name" />
                </div>
                <div class="flex flex-col gap-2">
                    <label for="purpose">Verwendungszweck</label>
                    <Textarea id="purpose" v-model="editingBooking.purpose" rows="5" autoResize />
                </div>
                <div class="flex flex-col gap-2">
                    <label for="amount">Betrag</label>
                    <InputNumber id="amount" v-model="editingBooking.amount" mode="currency" currency="EUR" locale="de-DE" />
                </div>
                <div class="flex flex-col gap-2">
                    <label for="recipient_iban">IBAN</label>
                    <InputText id="recipient_iban" v-model="editingBooking.payment_participant_iban" />
                </div>
            </div>
            <template #footer>
                <Button label="Abbrechen" icon="pi pi-times" text @click="editDialogVisible = false" />
                <Button label="Speichern" icon="pi pi-check" @click="saveBooking" :loading="savingEdit" />
            </template>
        </Dialog>
    </div>
</template>

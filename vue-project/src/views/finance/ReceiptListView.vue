<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { api } from '@/services/api';
import type { Receipt } from '@/types';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import ConfirmDialog from 'primevue/confirmdialog';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';

const receipts = ref<Receipt[]>([]);
const loading = ref(true);
const router = useRouter();
const confirm = useConfirm();
const toast = useToast();

onMounted(async () => {
    loadReceipts();
});

const loadReceipts = async () => {
    loading.value = true;
    try {
        receipts.value = await api.getReceipts();
    } catch (error) {
        console.error('Failed to load receipts', error);
    } finally {
        loading.value = false;
    }
};

const createReceipt = () => {
    router.push('/finance/receipts/create');
};

const editReceipt = (receipt: Receipt) => {
    if (receipt.id) {
        router.push(`/finance/receipts/${receipt.id}/edit`);
    }
};

const deleteReceipt = (receipt: Receipt) => {
    confirm.require({
        message: 'Sind Sie sicher, dass Sie diesen Beleg löschen möchten?',
        header: 'Bestätigung',
        icon: 'pi pi-exclamation-triangle',
        accept: async () => {
            if (receipt.id) {
                try {
                    await api.deleteReceipt(receipt.id);
                    toast.add({ severity: 'success', summary: 'Erfolg', detail: 'Beleg gelöscht', life: 3000 });
                    await loadReceipts();
                } catch (error) {
                    console.error('Failed to delete receipt', error);
                    toast.add({ severity: 'error', summary: 'Fehler', detail: 'Fehler beim Löschen des Belegs', life: 3000 });
                }
            }
        }
    });
};

const bookReceipt = (receipt: Receipt) => {
    confirm.require({
        message: 'Möchten Sie diesen Beleg wirklich verbuchen? Dies erstellt eine Buchung und aktualisiert den Status.',
        header: 'Verbuchen',
        icon: 'pi pi-question-circle',
        accept: async () => {
            if (receipt.id) {
                try {
                    // Try to sync recipient before booking if missing
                    let updated = false;
                    if (receipt.type === 'expense' && !receipt.recipient && receipt.seller_name) {
                         receipt.recipient = receipt.seller_name;
                         updated = true;
                    } else if (receipt.type === 'income' && !receipt.recipient && receipt.buyer_name) {
                         receipt.recipient = receipt.buyer_name;
                         updated = true;
                    }

                    if (updated) {
                         try {
                             await api.updateReceipt(receipt.id, receipt);
                         } catch (e) {
                             console.warn('Failed to sync recipient before booking', e);
                         }
                    }

                    await api.bookReceipt(receipt.id);
                    toast.add({ severity: 'success', summary: 'Erfolg', detail: 'Beleg erfolgreich verbucht', life: 3000 });
                    await loadReceipts();
                } catch (error) {
                    console.error('Failed to book receipt', error);
                    toast.add({ severity: 'error', summary: 'Fehler', detail: 'Fehler beim Verbuchen des Belegs', life: 3000 });
                }
            }
        }
    });
};

const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('de-DE');
};

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount);
};
</script>

<template>
    <div class="card">
        <div class="flex justify-between items-center mb-4">
            <h1 class="text-2xl font-bold text-gray-800 dark:text-gray-100">Belege</h1>
            <Button label="Neuer Beleg" icon="pi pi-plus" @click="createReceipt" />
        </div>

        <DataTable :value="receipts" :loading="loading" showGridlines stripedRows tableStyle="min-width: 50rem" class="p-datatable-sm" paginator :rows="20">
            <template #empty> Keine Belege gefunden. </template>
            <Column field="number" header="Nummer" sortable style="width: 15%"></Column>
            <Column field="date" header="Datum" sortable style="width: 10%">
                <template #body="slotProps">
                    {{ formatDate(slotProps.data.date) }}
                </template>
            </Column>
            <Column field="type" header="Typ" sortable style="width: 10%">
                <template #body="slotProps">
                    <span v-if="slotProps.data.type === 'income'" class="text-green-600 font-semibold">Einnahme</span>
                    <span v-else class="text-red-600 font-semibold">Ausgabe</span>
                </template>
            </Column>
            <Column field="recipient" header="Empfänger/Käufer" sortable style="width: 30%">
                 <template #body="slotProps">
                    <span class="font-medium">
                        {{ slotProps.data.type === 'expense' ? (slotProps.data.seller_name || slotProps.data.recipient) : (slotProps.data.buyer_name || slotProps.data.recipient) }}
                    </span>
                </template>
            </Column>
            <Column field="amount" header="Brutto Betrag" sortable style="width: 15%">
                <template #body="slotProps">
                    {{ formatCurrency(slotProps.data.amount) }}
                </template>
            </Column>
             <Column field="is_booked" header="Gebucht" sortable style="width: 10%" alignHeader="center" :headerStyle="{'text-align': 'center'}">
                <template #body="slotProps">
                    <div class="flex justify-center">
                        <i v-if="slotProps.data.is_booked" class="pi pi-check-circle text-green-500 text-xl"></i>
                        <i v-else class="pi pi-times-circle text-gray-300 text-xl"></i>
                    </div>
                </template>
            </Column>
            <Column header="Aktionen" style="width: 10%">
                <template #body="slotProps">
                    <div class="flex gap-2">
                        <Button v-if="slotProps.data.is_booked" icon="pi pi-eye" severity="secondary" text rounded @click="editReceipt(slotProps.data)" aria-label="Ansehen" title="Beleg ansehen" />
                        <Button v-if="!slotProps.data.is_booked" icon="pi pi-check" severity="success" text rounded @click="bookReceipt(slotProps.data)" aria-label="Verbuchen" title="In Buchungsliste übernehmen" />
                        <Button v-if="!slotProps.data.is_booked" icon="pi pi-pencil" severity="info" text rounded @click="editReceipt(slotProps.data)" aria-label="Bearbeiten" />
                        <Button v-if="!slotProps.data.is_booked" icon="pi pi-trash" severity="danger" text rounded @click="deleteReceipt(slotProps.data)" aria-label="Löschen" />
                    </div>
                </template>
            </Column>
        </DataTable>
        <ConfirmDialog />
    </div>
</template>

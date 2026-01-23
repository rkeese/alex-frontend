<script setup lang="ts">
import { ref } from 'vue';
import { api } from '@/services/api';
import type { SepaMember } from '@/types';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Calendar from 'primevue/calendar';
import Card from 'primevue/card';
import { useToast } from 'primevue/usetoast';

const toast = useToast();
const executionDate = ref<Date | null>(new Date());
const members = ref<SepaMember[]>([]);
const loading = ref(false);
const showPreview = ref(false);

const formatDate = (date: Date) => {
    // Manual local date formatting to avoid UTC time zone shifts
    const d = new Date(date);
    const offset = d.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(d.getTime() - offset)).toISOString().slice(0, 10);
    return localISOTime;
};

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value);
};

const loadPreview = async () => {
    if (!executionDate.value) {
        toast.add({ severity: 'warn', summary: 'Warnung', detail: 'Bitte wählen Sie ein Ausführungsdatum.', life: 3000 });
        return;
    }

    loading.value = true;
    try {
        const dateStr = formatDate(executionDate.value);
        const response = await api.getSepaMembers(dateStr);
        members.value = Array.isArray(response) ? response : [];
        showPreview.value = true;
        if (members.value.length === 0) {
            toast.add({ severity: 'info', summary: 'Info', detail: 'Keine fälligen Beiträge für das gewählte Datum gefunden.', life: 3000 });
        }
    } catch (error: any) {
        toast.add({ severity: 'error', summary: 'Fehler', detail: 'Fehler beim Laden der Vorschau: ' + error.message, life: 3000 });
    } finally {
        loading.value = false;
    }
};

const generateXml = async () => {
    if (!executionDate.value) return;
    
    loading.value = true;
    try {
        const dateStr = formatDate(executionDate.value);
        const blob = await api.generateSepaXml({ execution_date: dateStr });
        
        // Create download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `sepa_${dateStr}.xml`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        toast.add({ severity: 'success', summary: 'Erfolg', detail: 'SEPA-Datei wurde generiert.', life: 3000 });
    } catch (error: any) {
        toast.add({ severity: 'error', summary: 'Fehler', detail: 'Fehler beim Generieren der XML: ' + error.message, life: 3000 });
    } finally {
        loading.value = false;
    }
};

</script>

<template>
    <div class="card">
        <h1 class="text-2xl font-bold mb-4">SEPA Lastschrifteinzug</h1>
        
        <Card class="mb-4">
            <template #title>Kontrolle & Export</template>
            <template #content>
                <div class="flex flex-col md:flex-row gap-4 items-end">
                    <div class="flex flex-col gap-2">
                        <label for="execution_date">Ausführungsdatum</label>
                        <Calendar id="execution_date" v-model="executionDate" showIcon dateFormat="dd.mm.yy" />
                    </div>
                    <div class="flex gap-2">
                        <Button label="Vorschau laden" icon="pi pi-search" @click="loadPreview" :loading="loading" />
                        <Button label="XML Generieren" icon="pi pi-download" severity="success" @click="generateXml" :disabled="!executionDate || loading" />
                    </div>
                </div>
            </template>
        </Card>

        <div v-if="showPreview">
            <DataTable :value="members" stripedRows paginator :rows="10" :rowsPerPageOptions="[10, 20, 50]" tableStyle="min-width: 50rem" :loading="loading">
                <template #empty>Keine Mitglieder für den Einzug gefunden.</template>
                <Column field="first_name" header="Vorname"></Column>
                <Column field="last_name" header="Nachname"></Column>
                <Column field="member_iban" header="IBAN"></Column>
                <Column field="amount" header="Betrag">
                    <template #body="slotProps">
                        {{ formatCurrency(slotProps.data.amount) }}
                    </template>
                </Column>
                <Column field="mandate_reference" header="Mandatsreferenz"></Column>
                <Column field="sequence_type" header="Sequenz"></Column>
                <Column field="fee_label" header="Verwendungszweck"></Column>
            </DataTable>
            <div class="mt-2 text-sm text-gray-500">
                Anzahl Einträge: {{ members.length }} | Gesamtsumme: {{ formatCurrency(members.reduce((acc, m) => acc + m.amount, 0)) }}
            </div>
        </div>
    </div>
</template>

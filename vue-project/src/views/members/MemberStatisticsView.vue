<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { api } from '@/services/api';
import type { MemberStatistics } from '@/types';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import InputNumber from 'primevue/inputnumber';

const selectedYear = ref(new Date().getFullYear());
const statistics = ref<MemberStatistics[]>([]);
const loading = ref(false);

const loadStatistics = async () => {
    loading.value = true;
    try {
        statistics.value = await api.getMemberStatistics(selectedYear.value);
    } catch (error) {
        console.error('Failed to load statistics', error);
    } finally {
        loading.value = false;
    }
};

const exportCSV = () => {
    if (statistics.value.length === 0) return;

    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Jahrgang,Männlich,Weiblich,Divers,Gesamt\n';

    statistics.value.forEach((row) => {
        csvContent += `${row.birth_year},${row.count_m},${row.count_f},${row.count_d},${row.count_total}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `mitglieder_statistik_${selectedYear.value}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

onMounted(() => {
    loadStatistics();
});
</script>

<template>
    <div class="card">
        <div class="flex justify-between items-center mb-4">
            <h1 class="text-2xl font-bold">Mitglieder Statistik</h1>
            <div class="flex gap-2">
                 <div class="flex items-center gap-2">
                    <label for="year" class="font-bold">Jahr:</label>
                    <InputNumber v-model="selectedYear" inputId="year" :useGrouping="false" :min="1900" :max="2100" showButtons buttonLayout="horizontal" @input="loadStatistics" />
                </div>
                <Button label="Laden" icon="pi pi-refresh" @click="loadStatistics" :loading="loading" />
                <Button label="Export CSV" icon="pi pi-download" severity="secondary" @click="exportCSV" :disabled="statistics.length === 0" />
            </div>
        </div>

        <DataTable :value="statistics" :loading="loading" showGridlines stripedRows tableStyle="min-width: 50rem">
            <template #empty>Keine Daten gefunden.</template>
            <Column field="birth_year" header="Jahrgang" sortable></Column>
            <Column field="count_m" header="Männlich" sortable></Column>
            <Column field="count_f" header="Weiblich" sortable></Column>
            <Column field="count_d" header="Divers" sortable></Column>
            <Column field="count_total" header="Gesamt" sortable></Column>
            <template #footer>
                 <div class="flex justify-between font-bold">
                    <span>Gesamt</span>
                    <span>{{ statistics.reduce((sum, item) => sum + item.count_total, 0) }} Mitglieder</span>
                </div>
            </template>
        </DataTable>
    </div>
</template>

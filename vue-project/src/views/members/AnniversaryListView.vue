<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { api } from '@/services/api';
import type { AnniversaryEntry } from '@/types';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import InputNumber from 'primevue/inputnumber';
import InputText from 'primevue/inputtext';
import Toolbar from 'primevue/toolbar';

const selectedYear = ref(new Date().getFullYear());
const yearsInput = ref('25,30,40,50,60');
const anniversaries = ref<AnniversaryEntry[]>([]);
const loading = ref(false);

const getAnniversaryYears = () => {
    return yearsInput.value.split(',')
        .map(s => parseInt(s.trim()))
        .filter(n => !isNaN(n));
};

const loadAnniversaries = async () => {
    loading.value = true;
    try {
        const years = getAnniversaryYears();
        anniversaries.value = await api.getAnniversaryList(selectedYear.value, years);
    } catch (error) {
        console.error('Failed to load anniversaries', error);
    } finally {
        loading.value = false;
    }
};

const exportPDF = async () => {
    try {
        const years = getAnniversaryYears();
        await api.downloadAnniversaryListPdf(selectedYear.value, years);
    } catch (error) {
        console.error('Failed to download PDF', error);
    }
};

const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    return `${day}.${month}.${year}`;
};

onMounted(() => {
    loadAnniversaries();
});
</script>

<template>
    <div class="card">
        <h1 class="text-2xl font-bold mb-4">Jubiläumsliste</h1>
        
        <Toolbar class="mb-4">
            <template #start>
                <div class="flex flex-wrap gap-2 items-center">
                    <div class="flex flex-col gap-1">
                        <label for="year" class="text-xs">Jahr</label>
                        <InputNumber id="year" v-model="selectedYear" :useGrouping="false" :min="1900" :max="2100" />
                    </div>
                    <div class="flex flex-col gap-1">
                        <label for="years" class="text-xs">Jubiläen (Jahre, kommagetrennt)</label>
                        <InputText id="years" v-model="yearsInput" />
                    </div>
                    <div class="flex items-end self-end h-full pb-1">
                         <Button label="Laden" icon="pi pi-refresh" @click="loadAnniversaries" :loading="loading" />
                    </div>
                </div>
            </template>
            <template #end>
                <Button label="PDF Export" icon="pi pi-file-pdf" severity="danger" @click="exportPDF" :disabled="loading" />
            </template>
        </Toolbar>

        <DataTable :value="anniversaries" :loading="loading" showGridlines stripedRows tableStyle="min-width: 50rem">
            <template #empty>Keine Jubiläen gefunden.</template>
            
            <Column field="FirstName" header="Vorname" sortable></Column>
            <Column field="LastName" header="Nachname" sortable></Column>
            <Column header="Eintrittsdatum" sortable field="JoinedAt">
                <template #body="slotProps">
                    {{ formatDate(slotProps.data.JoinedAt) }}
                </template>
            </Column>
            <Column header="Jubiläumsdatum" sortable field="AnniversaryDate">
                <template #body="slotProps">
                    {{ formatDate(slotProps.data.AnniversaryDate) }}
                </template>
            </Column>
            <Column field="MembershipYears" header="Mitgliedsjahre" sortable align="right"></Column>
        </DataTable>
    </div>
</template>

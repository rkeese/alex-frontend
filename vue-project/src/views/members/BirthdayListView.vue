<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { api } from '@/services/api';
import type { BirthdayEntry } from '@/types';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import InputNumber from 'primevue/inputnumber';
import InputText from 'primevue/inputtext';
import Toolbar from 'primevue/toolbar';

const selectedYear = ref(new Date().getFullYear());
const milestoneInput = ref('50,60,70,80,90,100');
const birthdays = ref<BirthdayEntry[]>([]);
const loading = ref(false);

const getMilestones = () => {
    return milestoneInput.value.split(',')
        .map(s => parseInt(s.trim()))
        .filter(n => !isNaN(n));
};

const loadBirthdays = async () => {
    loading.value = true;
    try {
        const milestones = getMilestones();
        birthdays.value = await api.getBirthdayList(selectedYear.value, milestones);
    } catch (error) {
        console.error('Failed to load birthdays', error);
    } finally {
        loading.value = false;
    }
};

const exportPDF = async () => {
    try {
        const milestones = getMilestones();
        await api.downloadBirthdayListPdf(selectedYear.value, milestones);
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
    loadBirthdays();
});
</script>

<template>
    <div class="card">
        <h1 class="text-2xl font-bold mb-4">Geburtstagsliste</h1>
        
        <Toolbar class="mb-4">
            <template #start>
                <div class="flex flex-wrap gap-4 items-end">
                    <div class="flex flex-col gap-2">
                        <label for="year">Jahr</label>
                        <InputNumber id="year" v-model="selectedYear" :useGrouping="false" />
                    </div>
                    <div class="flex flex-col gap-2">
                        <label for="milestones">Jubiläen (kommagetrennt)</label>
                        <InputText id="milestones" v-model="milestoneInput" class="w-64" />
                    </div>
                    <Button label="Laden" icon="pi pi-refresh" @click="loadBirthdays" />
                </div>
            </template>
            <template #end>
                <Button label="PDF Export" icon="pi pi-file-pdf" severity="danger" @click="exportPDF" />
            </template>
        </Toolbar>

        <DataTable :value="birthdays" :loading="loading" stripedRows tableStyle="min-width: 50rem">
             <template #empty>Keine Geburtstage gefunden.</template>
            <Column field="date" header="Datum" sortable>
                <template #body="{ data }">
                    {{ formatDate(data.date) }}
                </template>
            </Column>
            <Column header="Name" sortable field="last_name">
                <template #body="{ data }">
                    {{ data.first_name }} {{ data.last_name }}
                </template>
            </Column>
            <Column field="birth_date" header="Geburtstag" sortable>
                <template #body="{ data }">
                    {{ formatDate(data.birth_date) }}
                </template>
            </Column>
            <Column field="new_age" header="Wird (Jahre)" sortable></Column>
        </DataTable>
    </div>
</template>

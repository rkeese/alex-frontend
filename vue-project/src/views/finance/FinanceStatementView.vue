<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { api } from '@/services/api';
import type { FinanceStatement, BankAccount } from '@/types';
import Card from 'primevue/card';
import Button from 'primevue/button';
import InputNumber from 'primevue/inputnumber';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Row from 'primevue/row';
import ColumnGroup from 'primevue/columngroup';
import Message from 'primevue/message';
import Accordion from 'primevue/accordion';
import AccordionPanel from 'primevue/accordionpanel';
import AccordionHeader from 'primevue/accordionheader';
import AccordionContent from 'primevue/accordioncontent';
import Dialog from 'primevue/dialog';

const year = ref(new Date().getFullYear());
const statement = ref<FinanceStatement | null>(null);
const loading = ref(false);
const error = ref('');
const existingStatements = ref<FinanceStatement[]>([]);

// Start Balance Inputs
const startBalancesVisible = ref(false);
const bankAccounts = ref<BankAccount[]>([]);
const startBalances = ref<Record<string, number>>({});
const cashStartBalance = ref(0);

const isRecreationMode = ref(false);

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value);
};

const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE');
};

const loadExistingStatements = async () => {
    try {
        existingStatements.value = await api.getFinanceStatements();
    } catch (e) {
        console.error("Failed to load existing statements", e);
    }
};

const loadBankAccounts = async () => {
    try {
        bankAccounts.value = await api.getBankAccounts();
        // Initialize start balances
        startBalances.value = {};
        for (const bank of bankAccounts.value) {
            startBalances.value[bank.id!] = 0;
        }
        cashStartBalance.value = 0;
    } catch (e) {
        console.error("Failed to load bank accounts", e);
    }
};

const existingStatementForYear = computed(() => {
    return existingStatements.value.find(s => s.year === year.value);
});

onMounted(() => {
    loadExistingStatements();
    loadBankAccounts();
});

watch(year, () => {
    // Clear current view if year changes, unless it matches the loaded one
    if (statement.value && statement.value.year !== year.value) {
        statement.value = null;
    }
    error.value = '';
});

const loadStatement = async () => {
     if (!existingStatementForYear.value) return;
     loading.value = true;
     error.value = '';
     statement.value = null;
     try {
         statement.value = await api.getFinanceStatement(existingStatementForYear.value.id);
     } catch (e: any) {
         error.value = e.message || 'Fehler beim Laden des Jahresabschlusses';
     } finally {
         loading.value = false;
     }
}

const openCreateDialog = async (isRecreate: boolean) => {
    isRecreationMode.value = isRecreate;
    startBalancesVisible.value = true;
};

const createStatement = async () => {
    if (isRecreationMode.value) {
         if (!confirm(`Soll der Jahresabschluss für ${year.value} wirklich neu berechnet werden? Der alte Abschluss wird gelöscht.`)) return;
    }

    startBalancesVisible.value = false;
    loading.value = true;
    error.value = '';
    statement.value = null;

    try {
        // Delete old if recreating
        if (isRecreationMode.value && existingStatementForYear.value) {
             await api.deleteFinanceStatement(existingStatementForYear.value.id);
        }

        // Merge balances
        const balancesPayload = { ...startBalances.value };
        balancesPayload['cash'] = cashStartBalance.value;

        const result = await api.createFinanceStatement(year.value, balancesPayload);
        statement.value = result;
        await loadExistingStatements(); // Refresh list
    } catch (e: any) {
        error.value = e.message || 'Fehler beim Erstellen des Jahresabschlusses';
    } finally {
        loading.value = false;
        isRecreationMode.value = false; 
    }
};

const downloadPdf = async () => {
    if (!statement.value?.id) return;
    try {
        const blob = await api.getFinanceStatementPdf(statement.value.id);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Jahresabschluss_${statement.value.year}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    } catch (e: any) {
        error.value = e.message || 'Fehler beim Herunterladen des PDF';
    }
};
</script>

<template>
    <div class="space-y-6">
        <Card>
            <template #title>Jahresabschluss</template>
            <template #content>
                <div class="flex items-end gap-4">
                    <div class="flex flex-col gap-2">
                        <label for="year">Geschäftsjahr</label>
                        <InputNumber id="year" v-model="year" :useGrouping="false" :min="2000" :max="2100" />
                    </div>

                    <div v-if="existingStatementForYear" class="flex gap-2">
                        <Button label="Anzeigen" icon="pi pi-eye" @click="loadStatement" :loading="loading" severity="info" />
                        <Button label="Neu berechnen" icon="pi pi-refresh" @click="openCreateDialog(true)" :loading="loading" severity="warn" />
                    </div>
                    <Button v-else label="Erstellen" icon="pi pi-cog" @click="openCreateDialog(false)" :loading="loading" />

                    <Button 
                        v-if="statement" 
                        label="PDF Herunterladen" 
                        icon="pi pi-file-pdf" 
                        severity="secondary" 
                        @click="downloadPdf" 
                    />
                </div>
                <Message v-if="existingStatementForYear && !statement" severity="info" class="mt-4">
                    Ein Jahresabschluss für das Jahr {{ year }} existiert bereits (erstellt am {{ formatDate(existingStatementForYear.created_at) }}).
                </Message>
                <Message v-if="error" severity="error" class="mt-4">{{ error }}</Message>
            </template>
        </Card>

        <!-- Start Balances Dialog -->
        <Dialog v-model:visible="startBalancesVisible" modal header="Anfangsbestände erfassen" :style="{ width: '50rem' }">
            <div class="flex flex-col gap-4">
                <p>Bitte geben Sie die Anfangsbestände für das Jahr {{ year }} an.</p>
                
                <div class="grid grid-cols-2 gap-4">
                    <div v-for="bank in bankAccounts" :key="bank.id" class="flex flex-col gap-2">
                        <label :for="'bank-' + bank.id">{{ bank.name }} ({{ bank.iban }})</label>
                        <InputNumber :id="'bank-' + bank.id" v-model="startBalances[bank.id!]" mode="currency" currency="EUR" locale="de-DE" />
                    </div>
                    
                    <div class="flex flex-col gap-2">
                        <label for="cash-balance" class="font-bold">Kasse (Barbestand)</label>
                        <InputNumber id="cash-balance" v-model="cashStartBalance" mode="currency" currency="EUR" locale="de-DE" />
                    </div>
                </div>

                <div class="flex justify-end gap-2 mt-4">
                    <Button label="Abbrechen" severity="secondary" @click="startBalancesVisible = false" />
                    <Button label="Abschluss Erstellen" icon="pi pi-check" @click="createStatement" />
                </div>
            </div>
        </Dialog>

        <Card v-if="statement">
            <template #title>
                <div class="text-center">
                    <h2 class="text-2xl font-bold">{{ statement.data.clubName }}</h2>
                    <h3 class="text-xl">Finanz-Jahresabschluss für das Geschäftsjahr {{ statement.year }}</h3>
                </div>
            </template>
            <template #content>
                <!-- Bank Balances -->
                <div class="mb-8">
                    <h4 class="text-lg font-semibold mb-2">Kontenentwicklung</h4>
                    <DataTable :value="statement.data.bankBalances" tableStyle="min-width: 50rem">
                        <Column field="name" header="Konto"></Column>
                        <Column field="startBalance" header="Anfangsbestand (€)">
                            <template #body="slotProps">
                                {{ formatCurrency(slotProps.data.startBalance) }}
                            </template>
                        </Column>
                        <Column field="income" header="Einnahmen (€)">
                            <template #body="slotProps">
                                {{ formatCurrency(slotProps.data.income) }}
                            </template>
                        </Column>
                        <Column field="expense" header="Ausgaben (€)">
                            <template #body="slotProps">
                                {{ formatCurrency(slotProps.data.expense) }}
                            </template>
                        </Column>
                        <Column field="endBalance" header="Endbestand (€)">
                            <template #body="slotProps">
                                {{ formatCurrency(slotProps.data.endBalance) }}
                            </template>
                        </Column>
                        <ColumnGroup type="footer">
                            <Row>
                                <Column footer="Gesamt" footerStyle="text-align:right"/>
                                <Column :footer="formatCurrency(statement.data.totalBankBalance.startBalance)" footerStyle="text-align:right" />
                                <Column :footer="formatCurrency(statement.data.totalBankBalance.income)" footerStyle="text-align:right" />
                                <Column :footer="formatCurrency(statement.data.totalBankBalance.expense)" footerStyle="text-align:right" />
                                <Column :footer="formatCurrency(statement.data.totalBankBalance.endBalance)" footerStyle="text-align:right" />
                            </Row>
                        </ColumnGroup>
                    </DataTable>
                </div>

                <!-- Overview -->
                <div class="mb-8">
                    <h4 class="text-lg font-semibold mb-2">Ergebnisübersicht</h4>
                    <DataTable :value="statement.data.overview" tableStyle="min-width: 50rem">
                        <Column field="name" header="Bereich"></Column>
                        <Column field="income" header="Einnahmen (€)">
                            <template #body="slotProps">
                                {{ formatCurrency(slotProps.data.income) }}
                            </template>
                        </Column>
                        <Column field="expense" header="Ausgaben (€)">
                            <template #body="slotProps">
                                {{ formatCurrency(slotProps.data.expense) }}
                            </template>
                        </Column>
                        <Column field="result" header="Ergebnis (€)">
                            <template #body="slotProps">
                                <span :class="{'text-green-600': slotProps.data.result >= 0, 'text-red-600': slotProps.data.result < 0}">
                                    {{ formatCurrency(slotProps.data.result) }}
                                </span>
                            </template>
                        </Column>
                         <ColumnGroup type="footer">
                            <Row>
                                <Column footer="Gesamt" footerStyle="text-align:right"/>
                                <Column :footer="formatCurrency(statement.data.totalOverview.income)" footerStyle="text-align:right" />
                                <Column :footer="formatCurrency(statement.data.totalOverview.expense)" footerStyle="text-align:right" />
                                <Column footerStyle="text-align:right">
                                    <template #footer>
                                        <span :class="{'text-green-600': statement.data.totalOverview.result >= 0, 'text-red-600': statement.data.totalOverview.result < 0}">
                                            {{ formatCurrency(statement.data.totalOverview.result) }}
                                        </span>
                                    </template>
                                </Column>
                            </Row>
                        </ColumnGroup>
                    </DataTable>
                </div>

                <!-- Details -->
                <div class="mb-8">
                    <h4 class="text-lg font-semibold mb-2">Details der Bereiche</h4>
                    <Accordion value="0">
                        <AccordionPanel v-for="(bookings, category) in statement.data.details" :key="category" :value="category">
                            <AccordionHeader>{{ category }}</AccordionHeader>
                            <AccordionContent>
                                <DataTable :value="bookings" size="small" stripedRows>
                                    <Column field="date" header="Datum" style="width: 100px">
                                        <template #body="slotProps">
                                            {{ formatDate(slotProps.data.date) }}
                                        </template>
                                    </Column>
                                    <Column field="bookingText" header="Text"></Column>
                                    <Column field="purpose" header="Zweck"></Column>
                                    <Column field="amount" header="Betrag" style="width: 120px; text-align: right">
                                        <template #body="slotProps">
                                             <div class="text-right" :class="{'text-green-600': slotProps.data.amount >= 0, 'text-red-600': slotProps.data.amount < 0}">
                                                {{ formatCurrency(slotProps.data.amount) }}
                                            </div>
                                        </template>
                                    </Column>
                                </DataTable>
                            </AccordionContent>
                        </AccordionPanel>
                    </Accordion>
                </div>

                <div class="mt-16 pt-8 border-t flex justify-between">
                    <div class="text-center">
                        <div class="h-16 border-b border-black w-64 mb-2"></div>
                        <p>Finanzvorstand</p>
                    </div>
                    <div class="text-center">
                        <div class="text-left mb-2">
                             Datum: {{ new Date().toLocaleDateString('de-DE') }}
                        </div>
                         <div class="h-8 border-b border-black w-64 mb-2"></div>
                        <p>Kassenprüfer</p>
                    </div>
                </div>

            </template>
        </Card>
    </div>
</template>

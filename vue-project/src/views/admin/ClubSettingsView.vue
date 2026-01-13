<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { api } from '@/services/api';
import type { Club, Department, BankAccount } from '@/types';
import { useToast } from 'primevue/usetoast';

import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import Checkbox from 'primevue/checkbox';
import TabView from 'primevue/tabview';
import TabPanel from 'primevue/tabpanel';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Dialog from 'primevue/dialog';
import Panel from 'primevue/panel';
import Fluid from 'primevue/fluid';

const toast = useToast();

const club = ref<Club>({
    name: '',
    registered_association: false
});

const departments = ref<Department[]>([]);
const bankAccounts = ref<BankAccount[]>([]);
const loading = ref(false);
const loadingDepartments = ref(false);
const loadingAccounts = ref(false);

const departmentDialog = ref(false);
const bankAccountDialog = ref(false);

const department = ref<Department>({ name: '', subdivision: '' });
const bankAccount = ref<BankAccount>({ 
    name: '', 
    account_holder: '', 
    creditor_id: '', 
    iban: '', 
    bic: '', 
    is_default: false 
});

const isNewDepartment = ref(true);
const isNewBankAccount = ref(true);

const loadData = async () => {
    loading.value = true;
    try {
        const clubId = localStorage.getItem('clubId');
        if (clubId) {
             club.value = await api.getClub(clubId);
             departments.value = await api.getDepartments();
             bankAccounts.value = await api.getBankAccounts();
        }
    } catch (e: any) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Konnte Vereinsdaten nicht laden', life: 3000 });
        console.error(e);
    } finally {
        loading.value = false;
    }
};

const saveClub = async () => {
    loading.value = true;
    try {
        if (club.value.id) {
            await api.updateClub(club.value.id, club.value);
            toast.add({ severity: 'success', summary: 'Erfolg', detail: 'Vereinsdaten gespeichert', life: 3000 });
        }
    } catch (e: any) {
        toast.add({ severity: 'error', summary: 'Fehler', detail: 'Speichern fehlgeschlagen', life: 3000 });
    } finally {
        loading.value = false;
    }
};

// Department CRUD
const openNewDepartment = () => {
    department.value = { name: '', subdivision: '' };
    isNewDepartment.value = true;
    departmentDialog.value = true;
};

const editDepartment = (dept: Department) => {
    department.value = { ...dept };
    isNewDepartment.value = false;
    departmentDialog.value = true;
};

const saveDepartment = async () => {
    loadingDepartments.value = true;
    try {
        if (isNewDepartment.value) {
            await api.createDepartment(department.value);
        } else if (department.value.id) {
            await api.updateDepartment(department.value.id, department.value);
        }
        departmentDialog.value = false;
        departments.value = await api.getDepartments(); // Reload
        toast.add({ severity: 'success', summary: 'Erfolg', detail: 'Abteilung gespeichert', life: 3000 });
    } catch (e: any) {
        toast.add({ severity: 'error', summary: 'Fehler', detail: 'Konnte Abteilung nicht speichern', life: 3000 });
    } finally {
        loadingDepartments.value = false;
    }
};

const deleteDepartment = async (dept: Department) => {
    if (!dept.id) return;
    if (!confirm('Sicher, dass diese Abteilung gelöscht werden soll?')) return;
    try {
        await api.deleteDepartment(dept.id);
        departments.value = departments.value.filter(d => d.id !== dept.id);
        toast.add({ severity: 'success', summary: 'Erfolg', detail: 'Abteilung gelöscht', life: 3000 });
    } catch (e: any) {
        toast.add({ severity: 'error', summary: 'Fehler', detail: 'Löschen fehlgeschlagen', life: 3000 });
    }
};

// Bank Account CRUD
const openNewBankAccount = () => {
    bankAccount.value = { name: '', account_holder: '', creditor_id: '', iban: '', bic: '', is_default: false };
    isNewBankAccount.value = true;
    bankAccountDialog.value = true;
};

const editBankAccount = (acc: BankAccount) => {
    bankAccount.value = { ...acc };
    isNewBankAccount.value = false;
    bankAccountDialog.value = true;
};

const saveBankAccount = async () => {
    loadingAccounts.value = true;
    try {
        if (isNewBankAccount.value) {
            await api.createBankAccount(bankAccount.value);
        } else if (bankAccount.value.id) {
            await api.updateBankAccount(bankAccount.value.id, bankAccount.value);
        }
        bankAccountDialog.value = false;
        bankAccounts.value = await api.getBankAccounts(); // Reload
        toast.add({ severity: 'success', summary: 'Erfolg', detail: 'Bankkonto gespeichert', life: 3000 });
    } catch (e: any) {
        toast.add({ severity: 'error', summary: 'Fehler', detail: 'Konnte Bankkonto nicht speichern', life: 3000 });
    } finally {
        loadingAccounts.value = false;
    }
};

const deleteBankAccount = async (acc: BankAccount) => {
    if (!acc.id) return;
    if (!confirm('Sicher, dass dieses Konto gelöscht werden soll?')) return;
    try {
        await api.deleteBankAccount(acc.id);
        bankAccounts.value = bankAccounts.value.filter(a => a.id !== acc.id);
        toast.add({ severity: 'success', summary: 'Erfolg', detail: 'Bankkonto gelöscht', life: 3000 });
    } catch (e: any) {
        toast.add({ severity: 'error', summary: 'Fehler', detail: 'Löschen fehlgeschlagen', life: 3000 });
    }
};

onMounted(() => {
    loadData();
});
</script>

<template>
    <div class="card max-w-6xl mx-auto pb-10">
        <!-- Header similar to MemberForm -->
        <div class="flex sticky top-0 bg-white dark:bg-gray-900 z-10 py-4 border-b border-gray-200 dark:border-gray-700 justify-between items-center mb-6">
            <h1 class="text-2xl font-bold text-gray-800 dark:text-gray-100">Verein</h1>
             <div class="flex gap-2">
                 <Button label="Speichern" icon="pi pi-save" @click="saveClub" :loading="loading" />
            </div>
        </div>

        <TabView>
            <TabPanel header="Allgemein">
                <Fluid>
                    <!-- Club Information -->
                    <Panel header="Vereinsdaten" toggleable class="mb-4">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div class="field">
                                <label for="name" class="font-bold block mb-2">Vereinsname</label>
                                <InputText id="name" v-model="club.name" />
                            </div>
                            <div class="field">
                                <label for="number" class="font-bold block mb-2">Vereinsnummer</label>
                                <InputText id="number" v-model="club.number" />
                            </div>
                            <div class="field">
                                <label for="type" class="font-bold block mb-2">Typ</label>
                                <InputText id="type" v-model="club.type" />
                            </div>
                            <div class="field">
                                <label for="category" class="font-bold block mb-2">Kategorie</label>
                                <InputText id="category" v-model="club.category" />
                            </div>
                             <div class="field flex items-center gap-2 mt-8">
                                <Checkbox id="registered" v-model="club.registered_association" binary />
                                <label for="registered" class="font-bold ml-2">Eingetragener Verein (e.V.)</label>
                            </div>
                        </div>
                    </Panel>

                    <!-- Address -->
                    <Panel header="Anschrift" toggleable class="mb-4">
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div class="field md:col-span-3">
                                <label for="street" class="font-bold block mb-2">Straße & Hausnummer</label>
                                <InputText id="street" v-model="club.street_house_number" />
                            </div>
                            <div class="field">
                                <label for="zip" class="font-bold block mb-2">PLZ</label>
                                <InputText id="zip" v-model="club.postal_code" />
                            </div>
                            <div class="field md:col-span-2">
                                <label for="city" class="font-bold block mb-2">Stadt</label>
                                <InputText id="city" v-model="club.city" />
                            </div>
                        </div>
                    </Panel>

                    <!-- Tax Office -->
                    <Panel header="Finanzamt" toggleable class="mb-4">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div class="field">
                                <label for="tax_name" class="font-bold block mb-2">Finanzamt Name</label>
                                <InputText id="tax_name" v-model="club.tax_office_name" />
                            </div>
                            <div class="field">
                                <label for="tax_number" class="font-bold block mb-2">Steuernummer</label>
                                <InputText id="tax_number" v-model="club.tax_office_tax_number" />
                            </div>
                        </div>
                    </Panel>
                </Fluid>
            </TabPanel>

            <TabPanel header="Abteilungen">
                 <div class="flex justify-end mb-4">
                    <Button label="Neue Abteilung" icon="pi pi-plus" @click="openNewDepartment" />
                </div>
                <DataTable :value="departments" responsiveLayout="scroll" :loading="loading">
                    <Column field="name" header="Name"></Column>
                    <Column field="subdivision" header="Unterabteilung"></Column>
                    <Column header="Aktionen" style="width: 100px">
                        <template #body="slotProps">
                            <div class="flex gap-2">
                                <Button icon="pi pi-pencil" class="p-button-text p-button-warning" @click="editDepartment(slotProps.data)" />
                                <Button icon="pi pi-trash" class="p-button-text p-button-danger" @click="deleteDepartment(slotProps.data)" />
                            </div>
                        </template>
                    </Column>
                </DataTable>
            </TabPanel>

            <TabPanel header="Bankkonten">
                 <div class="flex justify-end mb-4">
                    <Button label="Neues Konto" icon="pi pi-plus" @click="openNewBankAccount" />
                </div>
                <DataTable :value="bankAccounts" responsiveLayout="scroll" :loading="loading">
                    <Column field="name" header="Bezeichnung"></Column>
                    <Column field="iban" header="IBAN"></Column>
                    <Column field="bic" header="BIC"></Column>
                    <Column field="is_default" header="Standard" style="width: 100px">
                        <template #body="slotProps">
                            <i v-if="slotProps.data.is_default" class="pi pi-check text-green-500 font-bold"></i>
                        </template>
                    </Column>
                     <Column header="Aktionen" style="width: 100px">
                        <template #body="slotProps">
                            <div class="flex gap-2">
                                <Button icon="pi pi-pencil" class="p-button-text p-button-warning" @click="editBankAccount(slotProps.data)" />
                                <Button icon="pi pi-trash" class="p-button-text p-button-danger" @click="deleteBankAccount(slotProps.data)" />
                            </div>
                        </template>
                    </Column>
                </DataTable>
            </TabPanel>
        </TabView>

        <!-- Department Dialog -->
        <Dialog v-model:visible="departmentDialog" :header="isNewDepartment ? 'Neue Abteilung' : 'Abteilung bearbeiten'" :modal="true" :style="{ width: '450px' }" class="p-fluid">
            <div class="field mb-4">
                <label for="deptName" class="font-bold block mb-2">Name</label>
                <InputText id="deptName" v-model="department.name" required autofocus />
            </div>
            <div class="field mb-4">
                <label for="deptSub" class="font-bold block mb-2">Unterabteilung</label>
                <InputText id="deptSub" v-model="department.subdivision" />
            </div>
            <template #footer>
                <Button label="Abbrechen" icon="pi pi-times" class="p-button-text" @click="departmentDialog = false" />
                <Button label="Speichern" icon="pi pi-check" @click="saveDepartment" :loading="loadingDepartments" />
            </template>
        </Dialog>

        <!-- Bank Account Dialog -->
        <Dialog v-model:visible="bankAccountDialog" :header="isNewBankAccount ? 'Neues Bankkonto' : 'Bankkonto bearbeiten'" :modal="true" :style="{ width: '500px' }" class="p-fluid">
            <div class="field mb-4">
                <label for="accName" class="font-bold block mb-2">Bezeichnung (z.B. Hauptkonto)</label>
                <InputText id="accName" v-model="bankAccount.name" required autofocus />
            </div>
            <div class="field mb-4">
                <label for="accHolder" class="font-bold block mb-2">Kontoinhaber</label>
                <InputText id="accHolder" v-model="bankAccount.account_holder" />
            </div>
            <div class="field mb-4">
                <label for="accCreditor" class="font-bold block mb-2">Gläubiger-ID</label>
                <InputText id="accCreditor" v-model="bankAccount.creditor_id" />
            </div>
             <div class="field mb-4">
                <label for="accIban" class="font-bold block mb-2">IBAN</label>
                <InputText id="accIban" v-model="bankAccount.iban" />
            </div>
             <div class="field mb-4">
                <label for="accBic" class="font-bold block mb-2">BIC</label>
                <InputText id="accBic" v-model="bankAccount.bic" />
            </div>
            <div class="field-checkbox flex align-items-center mb-4">
                <Checkbox id="accDefault" v-model="bankAccount.is_default" :binary="true" />
                <label for="accDefault" class="ml-2 font-bold">Als Standardkonto verwenden</label>
            </div>
            <template #footer>
                <Button label="Abbrechen" icon="pi pi-times" class="p-button-text" @click="bankAccountDialog = false" />
                <Button label="Speichern" icon="pi pi-check" @click="saveBankAccount" :loading="loadingAccounts" />
            </template>
        </Dialog>
    </div>
</template>

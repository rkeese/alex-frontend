<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { api } from '@/services/api';
import type { Receipt, InvoiceItem, Club } from '@/types';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import InputNumber from 'primevue/inputnumber';
import Calendar from 'primevue/calendar';
import Dropdown from 'primevue/dropdown';
import Textarea from 'primevue/textarea';
import Checkbox from 'primevue/checkbox';
import Panel from 'primevue/panel';
import Divider from 'primevue/divider';
import Fluid from 'primevue/fluid';
import { useAuthStore } from '@/stores/auth';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const isEditMode = computed(() => route.params.id !== 'create' && !!route.params.id);
const loading = ref(false);
const saving = ref(false);

const receipt = ref<Receipt>({
    type: 'expense',
    recipient: '',
    number: '',
    date: new Date().toISOString().split('T')[0], // Initially string, but bound to Calendar which might convert to Date object
    position_assignment: '',
    amount: 0,
    is_booked: false,
    note: '',
    seller_name: '',
    seller_address: '',
    seller_tax_id: '',
    seller_vat_id: '',
    buyer_name: '',
    buyer_address: '',
    invoice_items: [],
    total_vat_amount: 0
});

const deliveryDateSame = ref(true);


const typeOptions = [
    { label: 'Einnahme', value: 'income' },
    { label: 'Ausgabe', value: 'expense' }
];

const taxRates = [0, 7, 19];

const toDate = (str: string | undefined): Date | undefined => {
    if (!str) return undefined;
    const [y, m, d] = str.split('-').map(Number);
    return new Date(y, m - 1, d);
};

const toStr = (d: Date | null | undefined): string => {
    if (!d) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const receiptDate = computed({
    get: () => toDate(receipt.value.date),
    set: (val) => { receipt.value.date = toStr(val); }
});

const deliveryDate = computed({
    get: () => toDate(receipt.value.delivery_date),
    set: (val) => { receipt.value.delivery_date = toStr(val); }
});

onMounted(async () => {
    if (isEditMode.value) {
        await loadReceipt();
    } else {
        // Init with one empty item
        addItem();
    }
});



const loadReceipt = async () => {
    loading.value = true;
    try {
        const id = route.params.id as string;
        // Since we don't have getReceipt(id), we might need to filter from all or implement getReceipt. 
        // Best practice is getReceipt(id). 
        // Looking at api.ts, I didn't verify getReceipt(id) exists, only getReceipts().
        // If it doesn't exist, I should implement it or rely on loading list.
        // Assuming I added basic CRUD, but I missed checking getReceipt(id) in api.ts.
        // I'll assume I can add it or it fails. 
        // Wait, I didn't add getReceipt(id) in api.ts! I only added update and delete.
        // I should fix api.ts to include getReceipt(id) or use getReceipts().find.
        // For now, let's try to fetch all and find (inefficient but safe if API missing).
        const all = await api.getReceipts();
        const found = all.find(r => r.id === id);
        if (found) {
            receipt.value = {
                ...found,
                invoice_items: found.invoice_items || [],
            };
            if (found.delivery_date && found.delivery_date !== found.date) {
                deliveryDateSame.value = false;
            }
        }
    } catch (error) {
        console.error('Failed to load receipt', error);
    } finally {
        loading.value = false;
    }
};

const addItem = () => {
    if (!receipt.value.invoice_items) receipt.value.invoice_items = [];
    receipt.value.invoice_items.push({
        description: '',
        quantity: 1,
        net_amount: 0,
        tax_rate: 19,
        vat_amount: 0,
        gross_amount: 0
    });
    calculateTotals();
};

const removeItem = (index: number) => {
    if (receipt.value.invoice_items) {
        receipt.value.invoice_items.splice(index, 1);
        calculateTotals();
    }
};

const calculateTotals = () => {
    let totalNet = 0;
    let totalVat = 0;
    let totalGross = 0;

    if (receipt.value.invoice_items) {
        receipt.value.invoice_items.forEach(item => {
            const net = item.quantity * item.net_amount;
            const vat = net * (item.tax_rate / 100);
            const gross = net + vat;

            item.vat_amount = parseFloat(vat.toFixed(2));
            item.gross_amount = parseFloat(gross.toFixed(2));

            totalNet += net;
            totalVat += vat;
            totalGross += gross;
        });
    }

    receipt.value.total_vat_amount = parseFloat(totalVat.toFixed(2));
    receipt.value.amount = parseFloat(totalGross.toFixed(2));
};

// Sync buyer name to recipient (legacy)
watch(() => receipt.value.buyer_name, (newVal) => {
    if (newVal) receipt.value.recipient = newVal;
});

const save = async () => {
    // Validation
    if (!receipt.value.seller_name) {
        alert('Bitte geben Sie den Namen des Verkäufers an.');
        return;
    }
    if (!receipt.value.date) {
        alert('Bitte geben Sie das Rechnungsdatum an.');
        return;
    }
    if (!receipt.value.invoice_items || receipt.value.invoice_items.length === 0) {
        alert('Bitte fügen Sie mindestens eine Position hinzu.');
        return;
    }
    
    saving.value = true;
    try {
        if (deliveryDateSame.value) {
            receipt.value.delivery_date = receipt.value.date;
        }

        if (isEditMode.value && receipt.value.id) {
            await api.updateReceipt(receipt.value.id, receipt.value);
        } else {
            await api.createReceipt(receipt.value);
        }
        router.push('/finance/receipts');
    } catch (error) {
        console.error('Failed to save receipt', error);
        alert('Fehler beim Speichern');
    } finally {
        saving.value = false;
    }
};
</script>

<template>
    <div class="card max-w-6xl mx-auto pb-10">
        <!-- Sticky Header -->
        <div class="flex sticky top-0 bg-white dark:bg-gray-900 z-10 py-4 border-b border-gray-200 dark:border-gray-700 justify-between items-center mb-6">
            <h1 class="text-2xl font-bold text-gray-800 dark:text-gray-100">{{ isEditMode ? 'Beleg bearbeiten' : 'Neuer Beleg' }}</h1>
            <div class="flex gap-2">
                <Button label="Zurück" icon="pi pi-arrow-left" severity="secondary" @click="router.back()" />
                <Button label="Speichern" icon="pi pi-check" @click="save" :loading="saving" />
            </div>
        </div>
        
        <Fluid>
            <!-- Section 1: General -->
            <Panel header="Allgemeine Angaben" toggleable class="mb-4">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="field">
                        <label for="number" class="font-bold block mb-2">Belegnummer *</label>
                        <InputText id="number" v-model="receipt.number" required />
                    </div>
                    <div class="field">
                        <label for="type" class="font-bold block mb-2">Typ *</label>
                        <Dropdown id="type" v-model="receipt.type" :options="typeOptions" optionLabel="label" optionValue="value" />
                    </div>
                    <div class="field">
                        <label for="date" class="font-bold block mb-2">Rechnungsdatum *</label>
                        <Calendar id="date" v-model="receiptDate" dateFormat="dd.mm.yy" showIcon />
                    </div>

                    <div class="field md:col-span-2">
                        <label for="delivery_date" class="font-bold block mb-2">Lieferdatum</label>
                        <div class="flex items-center mb-2">
                            <Checkbox v-model="deliveryDateSame" :binary="true" inputId="deliverySame" />
                            <label for="deliverySame" class="ml-2">Identisch mit Rechnungsdatum</label>
                        </div>
                        <Calendar v-if="!deliveryDateSame" id="delivery_date" v-model="deliveryDate" dateFormat="dd.mm.yy" showIcon />
                    </div>
                </div>
            </Panel>
            
            <!-- Section 2: Parties -->
            <Panel header="Beteiligte" toggleable class="mb-4">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <!-- Seller -->
                    <div>
                         <div class="flex justify-between items-center mb-2">
                            <h3 class="font-bold text-lg">Rechnungssteller</h3>
                         </div>
                         <div class="flex flex-col gap-3">
                            <div class="field">
                                <label class="font-bold block mb-2">Name *</label>
                                <InputText v-model="receipt.seller_name" />
                            </div>
                            <div class="field">
                                <label class="font-bold block mb-2">Adresse</label>
                                <Textarea v-model="receipt.seller_address" rows="3" autoResize />
                            </div>
                            <div class="grid grid-cols-2 gap-3">
                                <div class="field">
                                    <label class="font-bold block mb-2">Steuer-Nr.</label>
                                    <InputText v-model="receipt.seller_tax_id" />
                                </div>
                                <div class="field">
                                    <label class="font-bold block mb-2">USt-ID</label>
                                    <InputText v-model="receipt.seller_vat_id" />
                                </div>
                            </div>
                         </div>
                    </div>

                    <!-- Buyer -->
                    <div>
                        <h3 class="font-bold text-lg mb-2 pt-2">Rechnungsempfänger</h3>
                         <div class="flex flex-col gap-3">
                            <div class="field">
                                <label class="font-bold block mb-2">Name</label>
                                <InputText v-model="receipt.buyer_name" />
                            </div>
                            <div class="field">
                                <label class="font-bold block mb-2">Adresse</label>
                                <Textarea v-model="receipt.buyer_address" rows="3" autoResize />
                            </div>
                        </div>
                    </div>
                </div>
            </Panel>

            <!-- Section 3: Items -->
             <Panel header="Positionen" toggleable class="mb-4">
                <div class="flex flex-col gap-4">
                    <div v-for="(item, index) in receipt.invoice_items" :key="index" class="p-4 border rounded surface-border bg-gray-50 dark:bg-gray-800">
                         <div class="grid grid-cols-12 gap-3 items-end">
                             <div class="col-span-12 md:col-span-4 field">
                                 <label v-if="index===0" class="font-bold block mb-2">Beschreibung</label>
                                 <span v-else class="md:hidden font-bold block mb-1">Beschreibung</span>
                                 <Textarea v-model="item.description" placeholder="Position..." rows="1" autoResize />
                             </div>
                             <div class="col-span-12 md:col-span-2 field">
                                 <label v-if="index===0" class="font-bold block mb-2">Menge</label>
                                 <span v-else class="md:hidden font-bold block mb-1">Menge</span>
                                 <InputNumber v-model="item.quantity" :min="0" :minFractionDigits="0" showButtons @update:modelValue="calculateTotals" />
                             </div>
                              <div class="col-span-12 md:col-span-2 field">
                                 <label v-if="index===0" class="font-bold block mb-2">Einzel (Netto)</label>
                                 <span v-else class="md:hidden font-bold block mb-1">Einzel (Netto)</span>
                                 <InputNumber v-model="item.net_amount" mode="currency" currency="EUR" @update:modelValue="calculateTotals" />
                             </div>
                             <div class="col-span-12 md:col-span-2 field">
                                  <label v-if="index===0" class="font-bold block mb-2">Steuer</label>
                                  <span v-else class="md:hidden font-bold block mb-1">Steuer</span>
                                  <Dropdown v-model="item.tax_rate" :options="taxRates" class="w-full" @change="calculateTotals">
                                    <template #value="slotProps">
                                        {{ slotProps.value }}%
                                    </template>
                                    <template #option="slotProps">
                                        {{ slotProps.option }}%
                                    </template>
                                  </Dropdown>
                             </div>
                              <div class="col-span-12 md:col-span-2 field relative">
                                  <label v-if="index===0" class="font-bold block mb-2">Brutto</label>
                                  <span v-else class="md:hidden font-bold block mb-1">Brutto</span>
                                  <div class="flex gap-2">
                                    <InputNumber v-model="item.gross_amount" mode="currency" currency="EUR" disabled class="flex-1" />
                                    <Button icon="pi pi-trash" severity="danger" text @click="removeItem(index)" title="Entfernen" />
                                  </div>
                             </div>
                         </div>
                    </div>
                    
                    <div class="flex justify-start">
                        <Button label="Position hinzufügen" icon="pi pi-plus" size="small" severity="secondary" @click="addItem" />
                    </div>
                    
                    <div class="flex flex-col items-end mt-4 p-4 bg-primary-50 dark:bg-primary-900 rounded border border-primary-100 dark:border-primary-800">
                         <div class="text-lg">Netto: <span class="font-medium">{{ new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(receipt.invoice_items?.reduce((acc, i) => acc + (i.quantity * i.net_amount), 0) || 0) }}</span></div>
                         <div class="text-lg">MwSt: <span class="font-medium">{{ new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(receipt.total_vat_amount || 0) }}</span></div>
                         <div class="text-2xl font-bold text-primary-700 dark:text-primary-300 mt-1">Brutto: {{ new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(receipt.amount || 0) }}</div>
                    </div>
                </div>
             </Panel>

             <!-- Section 4: Settings -->
             <Panel header="Einstellungen & Notizen" toggleable>
                 <div class="grid grid-cols-1 gap-4">

                     <div class="field">
                         <label class="font-bold block mb-2">Interne Notiz</label>
                         <Textarea v-model="receipt.note" rows="3" autoResize placeholder="Optionale Notiz für die Buchhaltung..." />
                     </div>
                 </div>
             </Panel>
             
        </Fluid>
    </div>
</template>

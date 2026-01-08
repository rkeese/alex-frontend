<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { api } from '@/services/api';
import type { Member } from '@/types';
import InputText from 'primevue/inputtext';
import Select from 'primevue/select';
import Textarea from 'primevue/textarea';
import Checkbox from 'primevue/checkbox';
import Button from 'primevue/button';
import Fluid from 'primevue/fluid';
import Panel from 'primevue/panel';

const route = useRoute();
const router = useRouter();
const isEdit = route.params.id !== undefined;
const loading = ref(false);

const member = ref<Member>({
    member_number: '',
    status: 'active',
    honorary: false,
    salutation: '',
    title: '',
    first_name: '',
    last_name: '',
    birth_date: '',
    gender: 'm',
    marital_status: '',
    
    // Address
    street_house_number: '',
    postal_code: '',
    city: '',
    country: 'Deutschland',
    
    // Contact
    email: '',
    phone1: '',
    phone2: '',
    letter_salutation: '',
    
    // Membership
    joined_at: new Date().toISOString().split('T')[0],
    left_at: '',
    
    // Contribution
    contribution_name: '',
    contribution_type: '',
    contribution_amount: '',
    contribution_period: '',
    contribution_due_date: '',
    
    // Payment
    payment_method: '',
    iban: '',
    account_holder: '',
    sepa_mandate_granted: '',
    mandate_reference: '',
    mandate_type: '',
    next_debit_type: '',
    mandate_granted_at: '',
    last_usage_at: '',
    
    notes: ''
});

const genderOptions = [
    { label: 'Männlich', value: 'm' },
    { label: 'Weiblich', value: 'f' },
    { label: 'Divers', value: 'd' }
];

const statusOptions = [
    { label: 'Aktiv', value: 'active' },
    { label: 'Inaktiv', value: 'inactive' },
    { label: 'Passiv', value: 'passive' },
    { label: 'Ehrenmitglied', value: 'honorary' }
];

const salutationOptions = [
    { label: 'Herr', value: 'mr' },
    { label: 'Frau', value: 'ms' },
    { label: 'Divers', value: 'div' },
    { label: 'Firma', value: 'company' }
];

const maritalStatusOptions = [
    { label: 'Ledig', value: 'single' },
    { label: 'Verheiratet', value: 'married' },
    { label: 'Geschieden', value: 'divorced' },
    { label: 'Verwitwet', value: 'widowed' }
];

onMounted(async () => {
    if (isEdit) {
        loading.value = true;
        try {
            const data: any = await api.getMember(route.params.id as string);
            
            // Map backend fields to frontend interface
            const mappedMember: Partial<Member> = {
                ...data,
                // Map fields that might differ in naming between backend and frontend
                honorary: data.honorary_member ?? data.honorary,
                phone1: data.phone_number1 ?? data.phone1,
                phone2: data.mobile_number ?? data.phone_number2 ?? data.phone2,
                
                iban: data.bank_account_iban ?? data.iban,
                account_holder: data.bank_account_name_of_account_holder ?? data.account_holder,
                sepa_mandate_granted: data.bank_account_sepa_mandate_available !== undefined 
                    ? String(data.bank_account_sepa_mandate_available) 
                    : data.sepa_mandate_granted,
                mandate_reference: data.bank_account_mandate_reference ?? data.mandate_reference,
                mandate_type: data.bank_account_mandate_type ?? data.mandate_type,
                
                contribution_name: data.fee_label ?? data.contribution_name,
                contribution_type: data.fee_type ?? data.contribution_type,
                contribution_amount: data.fee_amount !== undefined ? String(data.fee_amount) : data.contribution_amount,
                contribution_period: data.fee_period ?? data.contribution_period,
                contribution_due_date: formatDate(data.fee_maturity ?? data.contribution_due_date),
                payment_method: data.fee_payment_method ?? data.payment_method,
                
                left_at: formatDate(data.member_until ?? data.left_at),
                joined_at: formatDate(data.joined_at ?? data.entry_date ?? data.created_at),
                birth_date: formatDate(data.birth_date),
                
                status: mapStatus(data.status),
                gender: mapGender(data.gender)
            };

            // Merge loaded data with default structure to ensure all fields are reactive
            member.value = { ...member.value, ...mappedMember };
        } catch (error) {
            console.error('Failed to load member', error);
        } finally {
            loading.value = false;
        }
    }
});

const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return '';
    if (dateString.includes('T')) {
  

const mapStatus = (status: string | undefined): string => {
    if (!status) return 'active';
    const s = status.toLowerCase();
    if (s === 'aktiv') return 'active';
    if (s === 'passiv') return 'passive';
    if (s === 'ehrenmitglied') return 'honorary';
    return s;
};

const mapGender = (gender: string | undefined): string => {
    if (!gender) return 'm';
    const g = gender.toLowerCase();
    if (g === 'männlich') return 'm';
    if (g === 'weiblich') return 'f';
    if (g.includes('divers')) return 'd';
    return g;
};      return dateString.split('T')[0];
    }
    return dateString;
};

const saveMember = async () => {
    loading.value = true;
    try {
        if (isEdit) {
            await api.updateMember(route.params.id as string, member.value);
        } else {
            await api.createMember(member.value);
        }
        router.push('/members');
    } catch (error) {
        console.error('Failed to save member', error);
    } finally {
        loading.value = false;
    }
};
</script>

<template>
    <div class="card max-w-6xl mx-auto pb-10">
        <div class="flex sticky top-0 bg-white dark:bg-gray-900 z-10 py-4 border-b border-gray-200 dark:border-gray-700 justify-between items-center mb-6">
            <h1 class="text-2xl font-bold text-gray-800 dark:text-gray-100">{{ isEdit ? 'Mitglied bearbeiten' : 'Neues Mitglied' }}</h1>
            <div class="flex gap-2">
                <Button label="Zurück" icon="pi pi-arrow-left" severity="secondary" @click="router.back()" />
                <Button label="Speichern" icon="pi pi-check" @click="saveMember" :loading="loading" />
            </div>
        </div>

        <Fluid>
            <!-- Personal Information -->
            <Panel header="Persönliche Daten" toggleable class="mb-4">
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div class="field">
                        <label for="member_number" class="font-bold block mb-2">Mitglieds-Nr.</label>
                        <InputText id="member_number" v-model="member.member_number" />
                    </div>
                    <div class="field">
                        <label for="status" class="font-bold block mb-2">Status</label>
                        <Select id="status" v-model="member.status" :options="statusOptions" optionLabel="label" optionValue="value" />
                    </div>
                    <div class="field flex items-center gap-2 mt-8 md:col-start-4">
                        <Checkbox id="honorary" v-model="member.honorary" binary />
                        <label for="honorary" class="font-bold">Ehrenmitglied</label>
                    </div>

                    <div class="field">
                        <label for="salutation" class="font-bold block mb-2">Anrede</label>
                        <Select id="salutation" v-model="member.salutation" :options="salutationOptions" optionLabel="label" optionValue="value" editable />
                    </div>
                    <div class="field">
                        <label for="title" class="font-bold block mb-2">Titel</label>
                        <InputText id="title" v-model="member.title" />
                    </div>
                    <div class="field">
                        <label for="first_name" class="font-bold block mb-2">Vorname</label>
                        <InputText id="first_name" v-model="member.first_name" />
                    </div>
                    <div class="field">
                        <label for="last_name" class="font-bold block mb-2">Nachname</label>
                        <InputText id="last_name" v-model="member.last_name" />
                    </div>

                    <div class="field">
                        <label for="birth_date" class="font-bold block mb-2">Geburtsdatum</label>
                        <InputText id="birth_date" v-model="member.birth_date" type="date" />
                    </div>
                    <div class="field">
                        <label for="gender" class="font-bold block mb-2">Geschlecht</label>
                        <Select id="gender" v-model="member.gender" :options="genderOptions" optionLabel="label" optionValue="value" />
                    </div>
                    <div class="field">
                        <label for="marital_status" class="font-bold block mb-2">Familienstand</label>
                        <Select id="marital_status" v-model="member.marital_status" :options="maritalStatusOptions" optionLabel="label" optionValue="value" />
                    </div>
                </div>
            </Panel>

            <!-- Address -->
            <Panel header="Adresse & Kontakt" toggleable class="mb-4">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div class="field md:col-span-2">
                        <label for="street" class="font-bold block mb-2">Straße & Hausnummer</label>
                        <InputText id="street" v-model="member.street_house_number" />
                    </div>
                     <div class="field">
                        <label for="postal_code" class="font-bold block mb-2">PLZ</label>
                        <InputText id="postal_code" v-model="member.postal_code" />
                    </div>
                    <div class="field">
                        <label for="city" class="font-bold block mb-2">Stadt</label>
                        <InputText id="city" v-model="member.city" />
                    </div>
                    <div class="field">
                        <label for="country" class="font-bold block mb-2">Land</label>
                        <InputText id="country" v-model="member.country" />
                    </div>
                    
                    <div class="field md:col-start-1">
                        <label for="email" class="font-bold block mb-2">E-Mail</label>
                        <InputText id="email" v-model="member.email" type="email" />
                    </div>
                    <div class="field">
                        <label for="phone1" class="font-bold block mb-2">Telefon</label>
                        <InputText id="phone1" v-model="member.phone1" />
                    </div>
                    <div class="field">
                        <label for="phone2" class="font-bold block mb-2">Mobil</label>
                        <InputText id="phone2" v-model="member.phone2" />
                    </div>
                    <div class="field md:col-span-3">
                        <label for="letter_salutation" class="font-bold block mb-2">Briefanrede</label>
                        <InputText id="letter_salutation" v-model="member.letter_salutation" />
                    </div>
                </div>
            </Panel>

            <!-- Membership -->
            <Panel header="Mitgliedschaftsdaten" toggleable class="mb-4">
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div class="field">
                        <label for="joined_at" class="font-bold block mb-2">Eintrittsdatum</label>
                        <InputText id="joined_at" v-model="member.joined_at" type="date" />
                    </div>
                    <div class="field">
                        <label for="left_at" class="font-bold block mb-2">Austrittsdatum</label>
                        <InputText id="left_at" v-model="member.left_at" type="date" />
                    </div>
                </div>
                 <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                    <div class="field md:col-span-2">
                        <label for="contribution_name" class="font-bold block mb-2">Beitragsgruppe</label>
                        <InputText id="contribution_name" v-model="member.contribution_name" />
                    </div>
                    <div class="field">
                        <label for="contribution_type" class="font-bold block mb-2">Art</label>
                        <InputText id="contribution_type" v-model="member.contribution_type" />
                    </div>
                     <div class="field">
                        <label for="contribution_amount" class="font-bold block mb-2">Betrag</label>
                        <InputText id="contribution_amount" v-model="member.contribution_amount" />
                    </div>
                    <div class="field">
                        <label for="contribution_period" class="font-bold block mb-2">Zeitraum</label>
                        <InputText id="contribution_period" v-model="member.contribution_period" />
                    </div>
                    <div class="field">
                        <label for="contribution_due_date" class="font-bold block mb-2">Fälligkeit</label>
                        <InputText id="contribution_due_date" v-model="member.contribution_due_date" type="date"/>
                    </div>
                 </div>
            </Panel>
            
            <!-- Payment -->
            <Panel header="Zahlungsinformationen" toggleable class="mb-4">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div class="field">
                        <label for="payment_method" class="font-bold block mb-2">Zahlungsart</label>
                        <InputText id="payment_method" v-model="member.payment_method" />
                    </div>
                    <div class="field">
                        <label for="account_holder" class="font-bold block mb-2">Kontoinhaber</label>
                        <InputText id="account_holder" v-model="member.account_holder" />
                    </div>
                    <div class="field">
                        <label for="iban" class="font-bold block mb-2">IBAN</label>
                        <InputText id="iban" v-model="member.iban" />
                    </div>
                    
                    <div class="field">
                        <label for="sepa_mandate_granted" class="font-bold block mb-2">SEPA Mandate erteilt</label>
                         <InputText id="sepa_mandate_granted" v-model="member.sepa_mandate_granted" />
                    </div>
                    <div class="field">
                        <label for="mandate_reference" class="font-bold block mb-2">Mandatsreferenz</label>
                        <InputText id="mandate_reference" v-model="member.mandate_reference" />
                    </div>
                    <div class="field">
                        <label for="mandate_granted_at" class="font-bold block mb-2">Mandatsdatum</label>
                        <InputText id="mandate_granted_at" v-model="member.mandate_granted_at"  />
                    </div>
                </div>
            </Panel>
             
             <!-- Notes -->
            <Panel header="Notizen" toggleable class="mb-4">
                 <div class="field">
                    <Textarea v-model="member.notes" rows="5" class="w-full" />
                </div>
            </Panel>
        </Fluid>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { api } from '@/services/api';
import type { Member, BankAccount } from '@/types';
import InputText from 'primevue/inputtext';
import InputNumber from 'primevue/inputnumber';
import Select from 'primevue/select';
import Textarea from 'primevue/textarea';
import Checkbox from 'primevue/checkbox';
import Button from 'primevue/button';
import Fluid from 'primevue/fluid';
import Panel from 'primevue/panel';
import Message from 'primevue/message';

const route = useRoute();
const router = useRouter();
const isEdit = computed(() => route.params.id !== undefined && route.params.id !== '');
const loading = ref(false);
const validationError = ref('');
const bankAccounts = ref<BankAccount[]>([]);

const bankAccountOptions = computed(() => {
    const accounts = Array.isArray(bankAccounts.value) ? bankAccounts.value : [];
    return accounts.map(b => ({
        label: `${b.name} (${b.iban})`,
        value: b.id
    }));
});

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
    
    // Fees (New Structure)
    fee_amount: 0,
    fee_period: 'yearly',
    fee_label: '',
    fee_assignment: '1_ideel',
    creditor_account_id: '',
    assigned_club_bank_id: '',
    fee_maturity: '',
    fee_starts_at: new Date().toISOString().split('T')[0],
    
    // Legacy Contribution (kept for compatibility if needed, but UI will focus on Fees)
    contribution_name: '',
    contribution_type: '',
    contribution_amount: '',
    contribution_period: '',
    contribution_due_date: '',
    
    // Payment
    payment_method: 'sepa',
    iban: '',
    account_holder: '',
    sepa_mandate_granted: false, // Now boolean
    mandate_reference: '',
    mandate_type: 'basic',
    mandate_kind: 'recurrent',
    next_debit_type: '',
    mandate_granted_at: '',
    mandate_valid_until: '',
    last_usage_at: '',
    
    notes: ''
});

const bookingAccountOptions = [
    { label: 'Ideeller Bereich', value: '1_ideel' },
    { label: 'Vermögensverwaltung', value: '2_vermoegen' },
    { label: 'Zweckbetrieb', value: '3_zweckbetrieb' },
    { label: 'Wirtschaftl. Geschäftsbetrieb', value: '4_wirtschaft' }
];

const paymentMethodOptions = [
    { label: 'SEPA Lastschrift', value: 'sepa' },
    { label: 'Überweisung', value: 'transfer' },
    { label: 'Bar', value: 'cash' },
    { label: 'Sonstiges', value: 'other' }
];

const mandateTypeOptions = [
    { label: 'Basismandat', value: 'basic' },
    // { label: 'Firmenmandat', value: 'company' } // potential future use
];

const mandateKindOptions = [
    { label: 'Bis auf Widerruf', value: 'recurrent' },
    { label: 'Einmalig', value: 'one_off' }
];

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


const loadMember = async () => {
    if (isEdit.value) {
        loading.value = true;
        try {
            console.log("Fetching member with ID:", route.params.id);
            let data: any = await api.getMember(route.params.id as string);
            console.log('Raw member API response:', data);
            
            // Handle potential response wrappers
            if (data) {
                if (data.data) { data = data.data; }
                else if (data.member) { data = data.member; }
                else if (Array.isArray(data) && data.length > 0) { data = data[0]; }
            }

            // --- RESTORED ROBUST MAPPING ---
            // Helper to get value from search keys ignoring case or specific naming conventions
            const getVal = (keys: string[]) => {
                // 1. Exact match
                for (const key of keys) {
                    if (data[key] !== undefined && data[key] !== null) return data[key];
                }

                // 2. Case-insensitive search on all data keys
                // This is the most robust backup
                const dataKeys = Object.keys(data);
                for (const key of keys) {
                     const lowerKey = key.toLowerCase().replace(/_/g, '');
                     const foundKey = dataKeys.find(k => k.toLowerCase().replace(/_/g, '') === lowerKey);
                     if (foundKey && data[foundKey] !== undefined && data[foundKey] !== null) {
                         return data[foundKey];
                     }
                }
                
                return undefined;
            };

            // Map backend fields to frontend model
            const mappedMember: Partial<Member> = {
                member_number: getVal(['member_number', 'MemberNumber']),
                first_name: getVal(['first_name', 'FirstName']),
                last_name: getVal(['last_name', 'LastName']),
                title: getVal(['title', 'Title']),
                birth_date: formatDate(getVal(['birth_date', 'BirthDate'])),
                
                // Status & Gender need special storage to handle backend values (mapped later)
                status: getVal(['status', 'Status']),
                gender: getVal(['gender', 'Gender']),
                salutation: getVal(['salutation', 'Salutation']),
                marital_status: getVal(['marital_status', 'MaritalStatus']),

                // Address
                street_house_number: getVal(['street_house_number', 'StreetHouseNumber', 'address']),
                postal_code: getVal(['postal_code', 'PostalCode', 'zip']),
                city: getVal(['city', 'City']),
                country: getVal(['country', 'Country']) || 'Deutschland',
                email: getVal(['email', 'Email']),
                phone1: getVal(['phone1', 'Phone1', 'phone_number1', 'PhoneNumber1']),
                phone2: getVal(['phone2', 'Phone2', 'mobile_number', 'MobileNumber', 'phone_number2', 'PhoneNumber2']),
                letter_salutation: getVal(['letter_salutation', 'LetterSalutation']),

                // Membership
                joined_at: formatDate(getVal(['joined_at', 'JoinedAt', 'entry_date', 'EntryDate', 'created_at', 'CreatedAt'])),
                left_at: formatDate(getVal(['left_at', 'LeftAt', 'member_until', 'MemberUntil'])),
                honorary: getVal(['honorary', 'Honorary', 'honorary_member', 'HonoraryMember']),

                // Fees
                fee_amount: getVal(['fee_amount', 'FeeAmount', 'contribution_amount', 'ContributionAmount']),
                fee_period: getVal(['fee_period', 'FeePeriod', 'contribution_period', 'ContributionPeriod']),
                fee_label: getVal(['fee_label', 'FeeLabel', 'contribution_name', 'ContributionName']),
                fee_assignment: getVal(['fee_assignment', 'FeeAssignment']),
                assigned_club_bank_id: getVal(['assigned_club_bank_id', 'AssignedClubBankId']),
                creditor_account_id: getVal(['creditor_account_id', 'CreditorAccountId', 'bank_account_id', 'BankAccountId']), // Map legacy bank_account_id to creditor_account_id
                fee_maturity: formatDate(getVal(['fee_maturity', 'FeeMaturity', 'contribution_due_date', 'ContributionDueDate'])),
                fee_starts_at: formatDate(getVal(['fee_starts_at', 'FeeStartsAt'])),

                // Contribution (Legacy fallback)
                contribution_name: getVal(['contribution_name', 'ContributionName', 'fee_label', 'FeeLabel']),
                contribution_type: getVal(['contribution_type', 'ContributionType', 'fee_type', 'FeeType']),
                contribution_amount: getVal(['contribution_amount', 'ContributionAmount', 'fee_amount', 'FeeAmount'])?.toString(),
                contribution_period: getVal(['contribution_period', 'ContributionPeriod', 'fee_period', 'FeePeriod']),
                contribution_due_date: formatDate(getVal(['contribution_due_date', 'ContributionDueDate', 'fee_maturity', 'FeeMaturity'])),

                // Payment
                payment_method: getVal(['payment_method', 'PaymentMethod', 'fee_payment_method', 'FeePaymentMethod']),
                iban: getVal(['iban', 'Iban', 'IBAN', 'bank_account_iban', 'BankAccountIban']),
                account_holder: getVal(['account_holder', 'AccountHolder', 'bank_account_name_of_account_holder', 'BankAccountNameOfAccountHolder']),
                sepa_mandate_granted: getVal(['sepa_mandate_granted', 'SepaMandateGranted', 'bank_account_sepa_mandate_available', 'BankAccountSepaMandateAvailable']),
                mandate_reference: getVal(['mandate_reference', 'MandateReference', 'bank_account_mandate_reference', 'BankAccountMandateReference']),
                mandate_type: getVal(['mandate_type', 'MandateType', 'bank_account_mandate_type', 'BankAccountMandateType']) || 'basic',
                mandate_kind: getVal(['mandate_kind', 'MandateKind', 'bank_account_kind_of_sepa_mandate', 'BankAccountKindOfSepaMandate']) || 'recurrent',
                mandate_granted_at: formatDate(getVal(['mandate_granted_at', 'MandateGrantedAt', 'bank_account_sepa_mandate_issued_on'])),
                mandate_valid_until: formatDate(getVal(['mandate_valid_until', 'MandateValidUntil', 'bank_account_sepa_mandate_valid_until'])),
                bank_account_id: getVal(['bank_account_id', 'BankAccountId']),
                
                notes: getVal(['notes', 'note', 'Note', 'Notes'])
            };

            // Apply mappings for enums
            mappedMember.status = mapStatus(mappedMember.status);
            mappedMember.gender = mapGender(mappedMember.gender);
            mappedMember.salutation = mapSalutation(mappedMember.salutation);
            mappedMember.marital_status = mapMaritalStatus(mappedMember.marital_status);
            
            // Map boolean/string SEPA status to Boolean for UI
            const sepaVal = mappedMember.sepa_mandate_granted;
            if (sepaVal === true || sepaVal === 'true' || sepaVal === '1' || String(sepaVal).toLowerCase() === 'ja') {
                mappedMember.sepa_mandate_granted = true;
            } else {
                // Default to false unless clearly true
                mappedMember.sepa_mandate_granted = false;
            }

            // Clean undefined values
            const cleanMapped = Object.fromEntries(
                Object.entries(mappedMember).filter(([_, v]) => v !== undefined)
            );

            console.log('Mapped member data:', cleanMapped); 
            member.value = { ...member.value, ...cleanMapped };
            // --- END RESTORED MAPPING ---
        } catch (error: any) {
            console.error('Failed to load member', error);
            validationError.value = 'Fehler beim Laden des Mitglieds: ' + (error.message || 'Unbekannter Fehler');
        } finally {
            loading.value = false;
        }
    }
};

onMounted(async () => {
    try {
        const accounts = await api.getBankAccounts();
        bankAccounts.value = Array.isArray(accounts) ? accounts : [];
    } catch (e) {
        console.error('Failed to load bank accounts', e);
        bankAccounts.value = [];
    }
    loadMember();
});

watch(
    () => route.params.id,
    (newId) => {
        if (newId) {
            loadMember();
        }
    }
);

const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return '';
    if (dateString.includes('T')) {
        return dateString.split('T')[0];
    }
    return dateString;
};

const mapStatus = (status: string | undefined | any): string => {
    if (!status) return 'active';
    const s = String(status).toLowerCase();
    if (s === 'aktiv') return 'active';
    if (s === 'passiv') return 'passive';
    if (s === 'ehrenmitglied') return 'honorary';
    return s;
};

const mapGender = (gender: string | undefined | any): string => {
    if (!gender) return 'm';
    const g = String(gender).toLowerCase();
    if (g === 'männlich') return 'm';
    if (g === 'weiblich') return 'f';
    if (g.includes('divers')) return 'd';
    return g;
};

const mapSalutation = (val: string | undefined | any): string => {
    if (!val) return '';
    const v = String(val).toLowerCase();
    if (v === 'herr') return 'mr';
    if (v === 'frau') return 'ms';
    if (v === 'divers') return 'div';
    if (v === 'firma') return 'company';
    return v;
};

const mapMaritalStatus = (val: string | undefined | any): string => {
    if (!val) return '';
    const v = String(val).toLowerCase();
    // German checks
    if (v === 'ledig') return 'single';
    if (v === 'verheiratet') return 'married';
    if (v === 'geschieden') return 'divorced';
    if (v === 'verwitwet') return 'widowed';
    return v;
};

// Auto-fill SEPA fields logic could be here
watch(() => member.value.mandate_granted_at, (newVal) => {
    if (newVal && !member.value.mandate_valid_until) {
         // Default to +3 years
         try {
             const d = new Date(newVal);
             d.setFullYear(d.getFullYear() + 3);
             member.value.mandate_valid_until = d.toISOString().split('T')[0];
         } catch (e) { /* ignore invalid date */ }
    }
});

const saveMember = async () => {
    loading.value = true;
    validationError.value = '';

    // Frontend Validation
    const requiredFields: (keyof Member)[] = ['member_number', 'status', 'first_name', 'last_name', 'email', 'joined_at'];
    const missing = requiredFields.filter(field => !member.value[field]);

    if (missing.length > 0) {
        validationError.value = 'Bitte füllen Sie alle Pflichtfelder aus (*).';
        loading.value = false;
        // Scroll to top to see error
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
    }

    // Ensure mandate_valid_until is set if SEPA is active
    if (member.value.sepa_mandate_granted && member.value.mandate_granted_at && !member.value.mandate_valid_until) {
         try {
             const d = new Date(member.value.mandate_granted_at);
             d.setFullYear(d.getFullYear() + 3);
             member.value.mandate_valid_until = d.toISOString().split('T')[0];
         } catch(e) {}
    }

    // Force fixed fee period
    member.value.fee_period = 'yearly';

    try {
        if (isEdit.value) {
            await api.updateMember(route.params.id as string, member.value);
        } else {
            await api.createMember(member.value);
        }
        router.push('/members');
    } catch (error: any) {
        console.error('Failed to save member', error);
        validationError.value = 'Fehler beim Speichern: ' + (error.message || 'Unbekannter Fehler');
        window.scrollTo({ top: 0, behavior: 'smooth' });
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

        <Message v-if="validationError" severity="error" class="mb-4" :closable="false">{{ validationError }}</Message>

        <Fluid>
            <!-- Personal Information -->
            <Panel header="Persönliche Daten" toggleable class="mb-4">
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div class="field">
                        <label for="member_number" class="font-bold block mb-2">Mitglieds-Nr. *</label>
                        <InputText id="member_number" v-model="member.member_number" />
                    </div>
                    <div class="field">
                        <label for="status" class="font-bold block mb-2">Status *</label>
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
                        <label for="first_name" class="font-bold block mb-2">Vorname *</label>
                        <InputText id="first_name" v-model="member.first_name" />
                    </div>
                    <div class="field">
                        <label for="last_name" class="font-bold block mb-2">Nachname *</label>
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
                        <label for="email" class="font-bold block mb-2">E-Mail *</label>
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
                        <label for="joined_at" class="font-bold block mb-2">Eintrittsdatum *</label>
                        <InputText id="joined_at" v-model="member.joined_at" type="date" />
                    </div>
                    <div class="field">
                        <label for="left_at" class="font-bold block mb-2">Austrittsdatum</label>
                        <InputText id="left_at" v-model="member.left_at" type="date" />
                    </div>
                </div>
            </Panel>

            <!-- Fees -->
            <Panel header="Beitragsinformationen" toggleable class="mb-4">
                 <div class="grid grid-cols-1 md:grid-cols-12 gap-4 mt-2">
                    <div class="field md:col-span-6">
                        <label for="fee_label" class="font-bold block mb-2">Beitragsbezeichnung</label>
                        <InputText id="fee_label" v-model="member.fee_label" placeholder="z.B. Standard" />
                    </div>
                    <div class="field md:col-span-4">
                        <label for="assigned_club_bank_id" class="font-bold block mb-2">Vereinskonto für Lastschrift</label>
                        <Select 
                            id="assigned_club_bank_id" 
                            v-model="member.assigned_club_bank_id" 
                            :options="bankAccountOptions" 
                            optionLabel="label" 
                            optionValue="value" 
                            placeholder="Wählen" 
                            class="w-full"
                        />
                    </div>
                     <div class="field md:col-span-4">
                        <label for="fee_assignment" class="font-bold block mb-2">Beitragsbuchungskonto</label>
                        <Select 
                            id="fee_assignment" 
                            v-model="member.fee_assignment" 
                            :options="bookingAccountOptions" 
                            optionLabel="label" 
                            optionValue="value" 
                            placeholder="Wählen" 
                            class="w-full"
                        />
                    </div>
                    
                     <div class="field md:col-span-2">
                        <label for="fee_amount" class="font-bold block mb-2">Betrag</label>
                        <InputNumber id="fee_amount" v-model="member.fee_amount" mode="currency" currency="EUR" locale="de-DE" />
                    </div>
                    <!-- Zeitraum field removed as requested -->
                    <div class="field md:col-span-4">
                        <label for="fee_maturity" class="font-bold block mb-2">Fälligkeit</label>
                        <InputText id="fee_maturity" v-model="member.fee_maturity" type="date"/>
                    </div>
                    <div class="field md:col-span-4">
                        <label for="fee_starts_at" class="font-bold block mb-2">Gültig ab</label>
                        <InputText id="fee_starts_at" v-model="member.fee_starts_at" type="date"/>
                    </div>
                 </div>
            </Panel>
            
            <!-- Payment -->
            <Panel header="Zahlungsinformationen" toggleable class="mb-4">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div class="field">
                        <label for="payment_method" class="font-bold block mb-2">Zahlungsart</label>
                        <Select id="payment_method" v-model="member.payment_method" :options="paymentMethodOptions" optionLabel="label" optionValue="value" />
                    </div>
                    <div class="field">
                        <label for="account_holder" class="font-bold block mb-2">Kontoinhaber</label>
                        <InputText id="account_holder" v-model="member.account_holder" />
                    </div>
                    <div class="field">
                        <label for="iban" class="font-bold block mb-2">IBAN</label>
                        <InputText id="iban" v-model="member.iban" />
                    </div>
                    
                    <div class="field flex items-center gap-2 mt-8">
                         <Checkbox id="sepa_mandate_granted" v-model="member.sepa_mandate_granted" binary />
                         <label for="sepa_mandate_granted" class="font-bold">SEPA Mandat erteilt</label>
                    </div>
                    <div class="field">
                        <label for="mandate_reference" class="font-bold block mb-2">Mandatsreferenz</label>
                        <InputText id="mandate_reference" v-model="member.mandate_reference" />
                    </div>
                    <div class="field">
                        <label for="mandate_type" class="font-bold block mb-2">Mandatstyp</label>
                        <Select id="mandate_type" v-model="member.mandate_type" :options="mandateTypeOptions" optionLabel="label" optionValue="value" />
                    </div>
                     <div class="field">
                        <label for="mandate_kind" class="font-bold block mb-2">Art des Mandats</label>
                        <Select id="mandate_kind" v-model="member.mandate_kind" :options="mandateKindOptions" optionLabel="label" optionValue="value" />
                    </div>
                    <div class="field">
                        <label for="mandate_granted_at" class="font-bold block mb-2">Mandatsdatum</label>
                        <InputText id="mandate_granted_at" v-model="member.mandate_granted_at" type="date" />
                    </div>
                    <div class="field">
                        <label for="mandate_valid_until" class="font-bold block mb-2">Gültig bis</label>
                        <InputText id="mandate_valid_until" v-model="member.mandate_valid_until" type="date" />
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

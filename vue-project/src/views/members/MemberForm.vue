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
    { label: 'Male', value: 'm' },
    { label: 'Female', value: 'f' },
    { label: 'Diverse', value: 'd' }
];

const statusOptions = [
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' },
    { label: 'Passive', value: 'passive' },
    { label: 'Honorary', value: 'honorary' }
];

const salutationOptions = [
    { label: 'Herr', value: 'Herr' },
    { label: 'Frau', value: 'Frau' },
    { label: 'Divers', value: 'Divers' },
    { label: 'Firma', value: 'Firma' }
];

onMounted(async () => {
    if (isEdit) {
        loading.value = true;
        try {
            const data = await api.getMember(route.params.id as string);
            // Merge loaded data with default structure to ensure all fields are reactive
            member.value = { ...member.value, ...data };
        } catch (error) {
            console.error('Failed to load member', error);
        } finally {
            loading.value = false;
        }
    }
});

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
            <h1 class="text-2xl font-bold text-gray-800 dark:text-gray-100">{{ isEdit ? 'Edit Member' : 'New Member' }}</h1>
            <div class="flex gap-2">
                <Button label="Back" icon="pi pi-arrow-left" severity="secondary" @click="router.back()" />
                <Button label="Save" icon="pi pi-check" @click="saveMember" :loading="loading" />
            </div>
        </div>

        <Fluid>
            <!-- Personal Information -->
            <Panel header="Personal Information" toggleable class="mb-4">
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div class="field">
                        <label for="member_number" class="font-bold block mb-2">Member No.</label>
                        <InputText id="member_number" v-model="member.member_number" />
                    </div>
                    <div class="field">
                        <label for="status" class="font-bold block mb-2">Status</label>
                        <Select id="status" v-model="member.status" :options="statusOptions" optionLabel="label" optionValue="value" />
                    </div>
                    <div class="field flex items-center gap-2 mt-8 md:col-start-4">
                        <Checkbox id="honorary" v-model="member.honorary" binary />
                        <label for="honorary" class="font-bold">Honorary Member</label>
                    </div>

                    <div class="field">
                        <label for="salutation" class="font-bold block mb-2">Salutation</label>
                        <Select id="salutation" v-model="member.salutation" :options="salutationOptions" optionLabel="label" optionValue="value" editable />
                    </div>
                    <div class="field">
                        <label for="title" class="font-bold block mb-2">Title</label>
                        <InputText id="title" v-model="member.title" />
                    </div>
                    <div class="field">
                        <label for="first_name" class="font-bold block mb-2">First Name</label>
                        <InputText id="first_name" v-model="member.first_name" />
                    </div>
                    <div class="field">
                        <label for="last_name" class="font-bold block mb-2">Last Name</label>
                        <InputText id="last_name" v-model="member.last_name" />
                    </div>

                    <div class="field">
                        <label for="birth_date" class="font-bold block mb-2">Birth Date</label>
                        <InputText id="birth_date" v-model="member.birth_date" type="date" />
                    </div>
                    <div class="field">
                        <label for="gender" class="font-bold block mb-2">Gender</label>
                        <Select id="gender" v-model="member.gender" :options="genderOptions" optionLabel="label" optionValue="value" />
                    </div>
                    <div class="field">
                        <label for="marital_status" class="font-bold block mb-2">Marital Status</label>
                        <InputText id="marital_status" v-model="member.marital_status" />
                    </div>
                </div>
            </Panel>

            <!-- Address -->
            <Panel header="Address & Contact" toggleable class="mb-4">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div class="field md:col-span-2">
                        <label for="street" class="font-bold block mb-2">Street & House No.</label>
                        <InputText id="street" v-model="member.street_house_number" />
                    </div>
                     <div class="field">
                        <label for="postal_code" class="font-bold block mb-2">Postal Code</label>
                        <InputText id="postal_code" v-model="member.postal_code" />
                    </div>
                    <div class="field">
                        <label for="city" class="font-bold block mb-2">City</label>
                        <InputText id="city" v-model="member.city" />
                    </div>
                    <div class="field">
                        <label for="country" class="font-bold block mb-2">Country</label>
                        <InputText id="country" v-model="member.country" />
                    </div>
                    
                    <div class="field md:col-start-1">
                        <label for="email" class="font-bold block mb-2">Email</label>
                        <InputText id="email" v-model="member.email" type="email" />
                    </div>
                    <div class="field">
                        <label for="phone1" class="font-bold block mb-2">Phone</label>
                        <InputText id="phone1" v-model="member.phone1" />
                    </div>
                    <div class="field">
                        <label for="phone2" class="font-bold block mb-2">Mobile</label>
                        <InputText id="phone2" v-model="member.phone2" />
                    </div>
                    <div class="field md:col-span-3">
                        <label for="letter_salutation" class="font-bold block mb-2">Letter Salutation (Briefanrede)</label>
                        <InputText id="letter_salutation" v-model="member.letter_salutation" />
                    </div>
                </div>
            </Panel>

            <!-- Membership -->
            <Panel header="Membership Details" toggleable class="mb-4">
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div class="field">
                        <label for="joined_at" class="font-bold block mb-2">Joined At</label>
                        <InputText id="joined_at" v-model="member.joined_at" type="date" />
                    </div>
                    <div class="field">
                        <label for="left_at" class="font-bold block mb-2">Left At (Mitglied bis)</label>
                        <InputText id="left_at" v-model="member.left_at" type="date" />
                    </div>
                </div>
                 <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                    <div class="field md:col-span-2">
                        <label for="contribution_name" class="font-bold block mb-2">Contribution Name</label>
                        <InputText id="contribution_name" v-model="member.contribution_name" />
                    </div>
                    <div class="field">
                        <label for="contribution_type" class="font-bold block mb-2">Type</label>
                        <InputText id="contribution_type" v-model="member.contribution_type" />
                    </div>
                     <div class="field">
                        <label for="contribution_amount" class="font-bold block mb-2">Amount</label>
                        <InputText id="contribution_amount" v-model="member.contribution_amount" />
                    </div>
                    <div class="field">
                        <label for="contribution_period" class="font-bold block mb-2">Period</label>
                        <InputText id="contribution_period" v-model="member.contribution_period" />
                    </div>
                    <div class="field">
                        <label for="contribution_due_date" class="font-bold block mb-2">Due Date</label>
                        <InputText id="contribution_due_date" v-model="member.contribution_due_date" type="date"/>
                    </div>
                 </div>
            </Panel>
            
            <!-- Payment -->
            <Panel header="Payment Information" toggleable class="mb-4">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div class="field">
                        <label for="payment_method" class="font-bold block mb-2">Payment Method</label>
                        <InputText id="payment_method" v-model="member.payment_method" />
                    </div>
                    <div class="field">
                        <label for="account_holder" class="font-bold block mb-2">Account Holder</label>
                        <InputText id="account_holder" v-model="member.account_holder" />
                    </div>
                    <div class="field">
                        <label for="iban" class="font-bold block mb-2">IBAN</label>
                        <InputText id="iban" v-model="member.iban" />
                    </div>
                    
                    <div class="field">
                        <label for="sepa_mandate_granted" class="font-bold block mb-2">SEPA Mandate Granted</label>
                         <InputText id="sepa_mandate_granted" v-model="member.sepa_mandate_granted" />
                    </div>
                    <div class="field">
                        <label for="mandate_reference" class="font-bold block mb-2">Mandate Ref.</label>
                        <InputText id="mandate_reference" v-model="member.mandate_reference" />
                    </div>
                    <div class="field">
                        <label for="mandate_granted_at" class="font-bold block mb-2">Mandate Date</label>
                        <InputText id="mandate_granted_at" v-model="member.mandate_granted_at"  />
                    </div>
                </div>
            </Panel>
             
             <!-- Notes -->
            <Panel header="Notes" toggleable class="mb-4">
                 <div class="field">
                    <Textarea v-model="member.notes" rows="5" class="w-full" />
                </div>
            </Panel>
        </Fluid>
    </div>
</template>

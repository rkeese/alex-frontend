<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { api } from '@/services/api';
import type { Member } from '@/types';
import InputText from 'primevue/inputtext';
import Select from 'primevue/select';
import Checkbox from 'primevue/checkbox';
import Button from 'primevue/button';
import Fluid from 'primevue/fluid';

const route = useRoute();
const router = useRouter();
const isEdit = route.params.id !== undefined;
const loading = ref(false);

const member = ref<Member>({
    member_number: '',
    first_name: '',
    last_name: '',
    birth_date: '',
    gender: 'm',
    street_house_number: '',
    postal_code: '',
    city: '',
    honorary: false,
    status: 'active',
    salutation: '',
    letter_salutation: '',
    phone1: '',
    email: '',
    joined_at: new Date().toISOString().split('T')[0]
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

onMounted(async () => {
    if (isEdit) {
        loading.value = true;
        try {
            const data = await api.getMember(route.params.id as string);
            member.value = data;
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
    <div class="card max-w-4xl mx-auto">
        <div class="flex justify-between items-center mb-6">
            <h1 class="text-2xl font-bold text-gray-800">{{ isEdit ? 'Edit Member' : 'New Member' }}</h1>
            <Button label="Back" icon="pi pi-arrow-left" severity="secondary" @click="router.back()" />
        </div>

        <Fluid>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="field">
                    <label for="member_number" class="font-bold block mb-2">Member Number</label>
                    <InputText id="member_number" v-model="member.member_number" />
                </div>
                <div class="field">
                    <label for="status" class="font-bold block mb-2">Status</label>
                    <Select id="status" v-model="member.status" :options="statusOptions" optionLabel="label" optionValue="value" />
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
                    <label for="email" class="font-bold block mb-2">Email</label>
                    <InputText id="email" v-model="member.email" type="email" />
                </div>
                <div class="field">
                    <label for="phone1" class="font-bold block mb-2">Phone</label>
                    <InputText id="phone1" v-model="member.phone1" />
                </div>

                <div class="field">
                    <label for="birth_date" class="font-bold block mb-2">Birth Date</label>
                    <InputText id="birth_date" v-model="member.birth_date" type="date" />
                </div>
                <div class="field">
                    <label for="gender" class="font-bold block mb-2">Gender</label>
                    <Select id="gender" v-model="member.gender" :options="genderOptions" optionLabel="label" optionValue="value" />
                </div>

                <div class="field md:col-span-2">
                    <label for="street" class="font-bold block mb-2">Street & House No.</label>
                    <InputText id="street" v-model="member.street_house_number" />
                </div>

                <div class="field">
                    <label for="zip" class="font-bold block mb-2">Postal Code</label>
                    <InputText id="zip" v-model="member.postal_code" />
                </div>
                <div class="field">
                    <label for="city" class="font-bold block mb-2">City</label>
                    <InputText id="city" v-model="member.city" />
                </div>
                
                <div class="field">
                    <label for="joined_at" class="font-bold block mb-2">Joined At</label>
                    <InputText id="joined_at" v-model="member.joined_at" type="date" />
                </div>
                 <div class="field flex items-center gap-2 mt-8">
                    <Checkbox id="honorary" v-model="member.honorary" binary />
                    <label for="honorary" class="font-bold">Honorary Member</label>
                </div>
            </div>

            <div class="flex justify-end gap-2 mt-6">
                <Button label="Cancel" severity="secondary" @click="router.back()" />
                <Button label="Save" icon="pi pi-check" @click="saveMember" :loading="loading" />
            </div>
        </Fluid>
    </div>
</template>

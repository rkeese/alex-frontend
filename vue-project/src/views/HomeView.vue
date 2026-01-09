<script setup lang="ts">
import { useAuthStore } from '@/stores/auth';
import { storeToRefs } from 'pinia';
import { useRouter } from 'vue-router';
import Card from 'primevue/card';
import Button from 'primevue/button';

const authStore = useAuthStore();
const router = useRouter();
const { clubId } = storeToRefs(authStore);
</script>

<template>
  <div class="flex flex-col gap-6">
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-3xl font-bold text-surface-900 dark:text-surface-0">Dashboard</h1>
        <p class="text-surface-500 dark:text-surface-400 mt-1">Overview of your club's activities</p>
      </div>
      <div v-if="clubId">
        <Button label="Neues Mitglied" icon="pi pi-plus" @click="router.push('/members/create')" />
      </div>
    </div>
    
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <!-- Status Card -->
      <div class="bg-white dark:bg-surface-900 p-6 rounded-xl shadow-sm border border-surface-200 dark:border-surface-700">
        <div class="flex justify-between items-start mb-4">
          <div>
            <div class="text-surface-500 dark:text-surface-400 font-medium text-sm">Club Status</div>
            <div class="text-2xl font-bold text-surface-900 dark:text-surface-0 mt-1">
              {{ clubId ? 'Active' : 'No Club' }}
            </div>
          </div>
          <div class="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
            <i class="pi pi-building text-xl"></i>
          </div>
        </div>
        <div v-if="clubId" class="text-sm text-green-600 flex items-center gap-1">
          <i class="pi pi-check-circle"></i>
          <span>Connected</span>
        </div>
        <div v-else class="text-sm text-orange-600 flex items-center gap-1">
          <i class="pi pi-exclamation-circle"></i>
          <span>Action Required</span>
        </div>
      </div>

      <!-- Members Card (Placeholder) -->
      <div class="bg-white dark:bg-surface-900 p-6 rounded-xl shadow-sm border border-surface-200 dark:border-surface-700">
        <div class="flex justify-between items-start mb-4">
          <div>
            <div class="text-surface-500 dark:text-surface-400 font-medium text-sm">Total Members</div>
            <div class="text-2xl font-bold text-surface-900 dark:text-surface-0 mt-1">--</div>
          </div>
          <div class="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
            <i class="pi pi-users text-xl"></i>
          </div>
        </div>
        <div class="text-sm text-surface-500">
          <span class="text-emerald-600 font-medium">+0%</span> from last month
        </div>
      </div>

      <!-- Finance Card (Placeholder) -->
      <div class="bg-white dark:bg-surface-900 p-6 rounded-xl shadow-sm border border-surface-200 dark:border-surface-700">
        <div class="flex justify-between items-start mb-4">
          <div>
            <div class="text-surface-500 dark:text-surface-400 font-medium text-sm">Revenue</div>
            <div class="text-2xl font-bold text-surface-900 dark:text-surface-0 mt-1">€0.00</div>
          </div>
          <div class="w-10 h-10 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
            <i class="pi pi-wallet text-xl"></i>
          </div>
        </div>
        <div class="text-sm text-surface-500">
          <span class="text-purple-600 font-medium">No data</span> available
        </div>
      </div>

      <!-- Events Card (Placeholder) -->
      <div class="bg-white dark:bg-surface-900 p-6 rounded-xl shadow-sm border border-surface-200 dark:border-surface-700">
        <div class="flex justify-between items-start mb-4">
          <div>
            <div class="text-surface-500 dark:text-surface-400 font-medium text-sm">Upcoming Events</div>
            <div class="text-2xl font-bold text-surface-900 dark:text-surface-0 mt-1">0</div>
          </div>
          <div class="w-10 h-10 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
            <i class="pi pi-calendar text-xl"></i>
          </div>
        </div>
        <div class="text-sm text-surface-500">
          Next event: <span class="font-medium">None</span>
        </div>
      </div>
    </div>

    <!-- Recent Activity / Quick Actions -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 bg-white dark:bg-surface-900 p-6 rounded-xl shadow-sm border border-surface-200 dark:border-surface-700">
        <h3 class="text-lg font-bold text-surface-900 dark:text-surface-0 mb-4">Recent Activity</h3>
        <div class="flex flex-col gap-4">
          <div class="p-4 bg-surface-50 dark:bg-surface-800 rounded-lg text-center text-surface-500">
            No recent activity to display
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-surface-900 p-6 rounded-xl shadow-sm border border-surface-200 dark:border-surface-700">
        <h3 class="text-lg font-bold text-surface-900 dark:text-surface-0 mb-4">Quick Actions</h3>
        <div class="flex flex-col gap-3">
          <Button label="Add Receipt" icon="pi pi-plus" severity="secondary" outlined class="w-full justify-start" />
          <Button label="Create Event" icon="pi pi-calendar-plus" severity="secondary" outlined class="w-full justify-start" />
          <Button label="Send Message" icon="pi pi-envelope" severity="secondary" outlined class="w-full justify-start" />
        </div>
      </div>
    </div>
  </div>
</template>


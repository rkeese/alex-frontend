<script setup lang="ts">
import { useAuthStore } from '@/stores/auth';
import { storeToRefs } from 'pinia';
import Card from 'primevue/card';
import Button from 'primevue/button';

const authStore = useAuthStore();
const { clubId } = storeToRefs(authStore);
</script>

<template>
  <main class="p-4">
    <h1 class="text-2xl font-bold mb-6">Welcome to Club Administration</h1>
    
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <Card>
        <template #title>Current Status</template>
        <template #content>
          <div v-if="clubId" class="flex flex-col gap-2">
            <span class="text-green-600 font-medium flex items-center gap-2">
              <i class="pi pi-check-circle"></i> Club Selected
            </span>
            <span class="text-sm text-gray-600">ID: {{ clubId }}</span>
          </div>
          <div v-else class="flex flex-col gap-2">
            <span class="text-orange-600 font-medium flex items-center gap-2">
              <i class="pi pi-exclamation-circle"></i> No Club Selected
            </span>
            <p class="text-sm text-gray-600">You need to be assigned to a club to manage members.</p>
          </div>
        </template>
      </Card>
    </div>
  </main>
</template>


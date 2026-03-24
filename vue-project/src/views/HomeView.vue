<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { storeToRefs } from 'pinia';
import { useRouter } from 'vue-router';
import Button from 'primevue/button';
import { api } from '@/services/api';

const authStore = useAuthStore();
const router = useRouter();
const { clubId, clubName } = storeToRefs(authStore);

const memberCount = ref<number | null>(null);
const receiptCount = ref<number | null>(null);
const documentCount = ref<number | null>(null);
const upcomingEventsCount = ref<number | null>(null);
const nextEventDisplay = ref<string>('');
const nextEventDate = ref<string>('');

const formatDate = (dateString: string) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('de-DE');
};

const fetchDashboardData = async () => {
  if (!clubId.value) {
    memberCount.value = null;
    receiptCount.value = null;
    documentCount.value = null;
    upcomingEventsCount.value = null;
    nextEventDisplay.value = '';
    nextEventDate.value = '';
    return;
  }
  try {
    const [members, events, receipts, documents] = await Promise.all([
      api.getMembers().catch(() => []),
      api.getEvents().catch(() => []),
      api.getReceipts().catch(() => []),
      api.getDocuments().catch(() => []),
    ]);

    memberCount.value = members.length;
    receiptCount.value = receipts.length;
    documentCount.value = documents.length;

    const todayStr = new Date().toISOString().split('T')[0];
    const upcoming = events
      .filter(e => e.date && e.date >= todayStr!)
      .sort((a, b) => (a.date || '').localeCompare(b.date || ''));

    upcomingEventsCount.value = upcoming.length;
    if (upcoming.length > 0 && upcoming[0]) {
      nextEventDisplay.value = upcoming[0].description || '';
      nextEventDate.value = formatDate(upcoming[0].date || '');
    } else {
      nextEventDisplay.value = '';
      nextEventDate.value = '';
    }
  } catch (e) {
    console.error('Failed to fetch dashboard data', e);
  }
};

onMounted(() => {
  fetchDashboardData();
});

watch(clubId, () => {
  fetchDashboardData();
});
</script>

<template>
  <div class="flex flex-col gap-6">
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-3xl font-bold text-surface-900 dark:text-surface-0">Übersicht</h1>
        <p class="text-surface-500 dark:text-surface-400 mt-1">Aktuelle Informationen Ihres Vereins</p>
      </div>
      <div v-if="clubId && authStore.hasPermission('members:write')">
        <Button label="Neues Mitglied" icon="pi pi-plus" @click="router.push('/members/create')" />
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <!-- Club Status Card -->
      <div class="bg-white dark:bg-surface-900 p-6 rounded-xl shadow-sm border border-surface-200 dark:border-surface-700 cursor-pointer hover:shadow-md transition-shadow" @click="clubId ? router.push('/admin/club-settings') : undefined">
        <div class="flex justify-between items-start mb-4">
          <div>
            <div class="text-surface-500 dark:text-surface-400 font-medium text-sm">Verein</div>
            <div class="text-2xl font-bold text-surface-900 dark:text-surface-0 mt-1 truncate" :title="clubName || ''">
              {{ clubId ? (clubName || 'Aktiv') : 'Kein Verein' }}
            </div>
          </div>
          <div class="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
            <i class="pi pi-building text-xl"></i>
          </div>
        </div>
        <div v-if="clubId" class="text-sm text-green-600 flex items-center gap-1">
          <i class="pi pi-check-circle"></i>
          <span>Verbunden</span>
        </div>
        <div v-else class="text-sm text-orange-600 flex items-center gap-1">
          <i class="pi pi-exclamation-circle"></i>
          <span>Bitte Verein auswählen</span>
        </div>
      </div>

      <!-- Members Card -->
      <div class="bg-white dark:bg-surface-900 p-6 rounded-xl shadow-sm border border-surface-200 dark:border-surface-700 cursor-pointer hover:shadow-md transition-shadow" @click="router.push('/members')">
        <div class="flex justify-between items-start mb-4">
          <div>
            <div class="text-surface-500 dark:text-surface-400 font-medium text-sm">Mitglieder</div>
            <div class="text-2xl font-bold text-surface-900 dark:text-surface-0 mt-1">{{ memberCount !== null ? memberCount : '--' }}</div>
          </div>
          <div class="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
            <i class="pi pi-users text-xl"></i>
          </div>
        </div>
        <div class="text-sm text-surface-500">
          <span class="text-emerald-600 font-medium">Registrierte</span> Mitglieder gesamt
        </div>
      </div>

      <!-- Finance / Receipts Card -->
      <div class="bg-white dark:bg-surface-900 p-6 rounded-xl shadow-sm border border-surface-200 dark:border-surface-700 cursor-pointer hover:shadow-md transition-shadow" @click="router.push('/finance/receipts')">
        <div class="flex justify-between items-start mb-4">
          <div>
            <div class="text-surface-500 dark:text-surface-400 font-medium text-sm">Belege</div>
            <div class="text-2xl font-bold text-surface-900 dark:text-surface-0 mt-1">{{ receiptCount !== null ? receiptCount : '--' }}</div>
          </div>
          <div class="w-10 h-10 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
            <i class="pi pi-receipt text-xl"></i>
          </div>
        </div>
        <div class="text-sm text-surface-500">
          <span class="text-purple-600 font-medium">Erfasste</span> Belege gesamt
        </div>
      </div>

      <!-- Events Card -->
      <div class="bg-white dark:bg-surface-900 p-6 rounded-xl shadow-sm border border-surface-200 dark:border-surface-700 cursor-pointer hover:shadow-md transition-shadow" @click="router.push('/calendar')">
        <div class="flex justify-between items-start mb-4">
          <div>
            <div class="text-surface-500 dark:text-surface-400 font-medium text-sm">Termine</div>
            <div class="text-2xl font-bold text-surface-900 dark:text-surface-0 mt-1">{{ upcomingEventsCount !== null ? upcomingEventsCount : '0' }}</div>
          </div>
          <div class="w-10 h-10 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
            <i class="pi pi-calendar text-xl"></i>
          </div>
        </div>
        <div class="text-sm text-surface-500 truncate" :title="nextEventDisplay ? `${nextEventDate}: ${nextEventDisplay}` : ''">
          <template v-if="nextEventDisplay">
            Nächster: <span class="font-medium">{{ nextEventDate }} — {{ nextEventDisplay }}</span>
          </template>
          <template v-else>
            <span class="text-surface-400">Keine anstehenden Termine</span>
          </template>
        </div>
      </div>
    </div>

    <!-- Documents & Quick Actions -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Documents summary -->
      <div class="lg:col-span-2 bg-white dark:bg-surface-900 p-6 rounded-xl shadow-sm border border-surface-200 dark:border-surface-700">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-bold text-surface-900 dark:text-surface-0">Dokumente</h3>
          <Button label="Alle anzeigen" icon="pi pi-arrow-right" iconPos="right" text size="small" @click="router.push('/documents')" />
        </div>
        <div class="flex flex-col gap-4">
          <div v-if="documentCount !== null && documentCount > 0" class="p-4 bg-surface-50 dark:bg-surface-800 rounded-lg flex items-center gap-3 cursor-pointer hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors" @click="router.push('/documents')">
            <div class="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
              <i class="pi pi-file text-xl"></i>
            </div>
            <div>
              <div class="font-medium text-surface-900 dark:text-surface-0">{{ documentCount }} Dokument{{ documentCount !== 1 ? 'e' : '' }} vorhanden</div>
              <div class="text-sm text-surface-500">Klicken Sie hier, um alle Dokumente anzuzeigen</div>
            </div>
          </div>
          <div v-else class="p-4 bg-surface-50 dark:bg-surface-800 rounded-lg text-center text-surface-500">
            Noch keine Dokumente hochgeladen
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="bg-white dark:bg-surface-900 p-6 rounded-xl shadow-sm border border-surface-200 dark:border-surface-700">
        <h3 class="text-lg font-bold text-surface-900 dark:text-surface-0 mb-4">Schnellzugriff</h3>
        <div class="flex flex-col gap-3">
          <Button v-if="authStore.hasPermission('finance:write')" label="Neuer Beleg" icon="pi pi-plus" severity="secondary" outlined class="w-full justify-start" @click="router.push('/finance/receipts/create')" />
          <Button v-if="authStore.hasPermission('calendar:write')" label="Termin anlegen" icon="pi pi-calendar-plus" severity="secondary" outlined class="w-full justify-start" @click="router.push('/calendar')" />
          <Button v-if="authStore.hasPermission('documents:write')" label="Dokument hochladen" icon="pi pi-upload" severity="secondary" outlined class="w-full justify-start" @click="router.push('/documents')" />
          <Button v-if="authStore.hasPermission('members:read')" label="Mitgliederliste" icon="pi pi-users" severity="secondary" outlined class="w-full justify-start" @click="router.push('/members')" />
        </div>
      </div>
    </div>
  </div>
</template>


<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { api } from '@/services/api';
import type { CalendarEvent } from '@/types';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import SelectButton from 'primevue/selectbutton';

const viewMode = ref<'month' | 'day'>('month'); // 'month' or 'day'
const viewOptions = ref([
    { label: 'Monat', value: 'month' },
    { label: 'Tag', value: 'day' }
]);

const currentDate = ref(new Date());
const selectedDate = ref(new Date()); // For day view or creating event
const events = ref<CalendarEvent[]>([]);
const loading = ref(false);

// Event Dialog
const showDialog = ref(false);
const editingEvent = ref<CalendarEvent | null>(null);
const eventForm = ref({
    date: '',
    time: '',
    description: ''
});

// Load events
const loadEvents = async () => {
    loading.value = true;
    try {
        const res = await api.getEvents();
        events.value = res || [];
    } catch (e) {
        console.error("Failed to load events", e);
        events.value = [];
    } finally {
        loading.value = false;
    }
};

onMounted(() => {
    loadEvents();
    // Initialize selectedDate form currentDate string
    updateFormDateDefaults();
});

// Navigation
const next = () => {
    if (viewMode.value === 'month') {
        currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() + 1, 1);
    } else {
        selectedDate.value = new Date(selectedDate.value.getFullYear(), selectedDate.value.getMonth(), selectedDate.value.getDate() + 1);
        currentDate.value = new Date(selectedDate.value); // Sync month view too
    }
};

const prev = () => {
    if (viewMode.value === 'month') {
        currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() - 1, 1);
    } else {
        selectedDate.value = new Date(selectedDate.value.getFullYear(), selectedDate.value.getMonth(), selectedDate.value.getDate() - 1);
        currentDate.value = new Date(selectedDate.value);
    }
};

const goToToday = () => {
    const now = new Date();
    currentDate.value = now;
    selectedDate.value = now;
};

// Computed for Month View
const currentMonthYear = computed(() => {
    return currentDate.value.toLocaleString('de-DE', { month: 'long', year: 'numeric' });
});

const currentDayLabel = computed(() => {
    return selectedDate.value.toLocaleString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
});

const calendarDays = computed(() => {
    const year = currentDate.value.getFullYear();
    const month = currentDate.value.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
    const adjustedFirstDayIndex = firstDayIndex === 0 ? 6 : firstDayIndex - 1; // 0 = Monday
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    
    // Previous month padding
    for (let i = 0; i < adjustedFirstDayIndex; i++) {
        days.push({ day: null, fullDate: '', isCurrentMonth: false, events: [] });
    }
    
    // Current month
    for (let i = 1; i <= daysInMonth; i++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        days.push({ 
            day: i, 
            fullDate: dateStr, 
            isCurrentMonth: true,
            events: (events.value || []).filter(e => e.date === dateStr).sort((a,b) => a.time.localeCompare(b.time))
        });
    }
    
    return days;
});

// Computed for Day View
const currentDayEvents = computed(() => {
    const dateStr = formatDate(selectedDate.value);
    return (events.value || []).filter(e => e.date === dateStr).sort((a,b) => a.time.localeCompare(b.time));
});

// Helpers
const formatDate = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

const formatTime = (date: Date) => {
    const h = String(date.getHours()).padStart(2, '0');
    const m = String(date.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
}

const updateFormDateDefaults = () => {
    eventForm.value.date = formatDate(selectedDate.value);
    const now = new Date();
    eventForm.value.time = formatTime(now);
};

// Actions
const openAddDialog = () => {
    editingEvent.value = null;
    eventForm.value = {
        date: formatDate(selectedDate.value),
        time: '12:00',
        description: ''
    };
    showDialog.value = true;
};

const openEditDialog = (event: CalendarEvent) => {
    editingEvent.value = event;
    eventForm.value = {
        date: event.date,
        time: event.time,
        description: event.description
    };
    showDialog.value = true;
};

const saveEvent = async () => {
    if (!eventForm.value.date || !eventForm.value.time || !eventForm.value.description) return;
    
    // Ensure date is "YYYY-MM-DD" and time is "HH:MM"
    // InputText type="date" returns "YYYY-MM-DD"
    // InputText type="time" returns "HH:MM"

    const payload: CalendarEvent = {
        date: eventForm.value.date,
        time: eventForm.value.time,
        description: eventForm.value.description
    };

    try {
        if (editingEvent.value?.id) {
            await api.updateEvent(editingEvent.value.id, payload);
        } else {
            // New event - include club_id if needed, but backend usually handles it from header
            // Check interface requirements.
            // In types/index.ts I added club_id optional.
            await api.createEvent(payload);
        }
        await loadEvents();
        showDialog.value = false;
    } catch (e) {
        console.error("Save failed", e);
        alert('Fehler beim Speichern');
    }
};

const deleteEvent = async (id: string) => {
    if (!confirm('Wirklich löschen?')) return;
    try {
        await api.deleteEvent(id);
        await loadEvents();
        showDialog.value = false; // in case we delete from edit dialog
    } catch (e) {
        alert('Fehler beim Löschen');
    }
};

const selectDay = (dateStr: string) => {
    if(!dateStr) return;
    selectedDate.value = new Date(dateStr);
    viewMode.value = 'day';
};

</script>

<template>
    <div class="h-full flex flex-col p-4 bg-surface-0 dark:bg-surface-900 rounded-lg shadow">
        <!-- Header -->
        <div class="flex justify-between items-center mb-4">
            <div class="flex items-center gap-2">
                <Button icon="pi pi-chevron-left" @click="prev" text rounded />
                <Button icon="pi pi-chevron-right" @click="next" text rounded />
                <Button label="Heute" @click="goToToday" text size="small" />
                <h2 class="text-xl font-bold ml-2 w-48 text-center">{{ viewMode === 'month' ? currentMonthYear : currentDayLabel }}</h2>
            </div>
            
            <div class="flex items-center gap-2">
                 <SelectButton v-model="viewMode" :options="viewOptions" optionLabel="label" optionValue="value" :allowEmpty="false" />
                 <Button icon="pi pi-plus" label="Termin" @click="openAddDialog" />
            </div>
        </div>

        <!-- Month View -->
        <div v-if="viewMode === 'month'" class="flex-1 overflow-auto">
            <div class="grid grid-cols-7 border-t border-l border-surface-200 dark:border-surface-700 min-h-full">
                <!-- Header Row -->
                <div v-for="day in ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']" :key="day" 
                     class="p-2 text-center font-bold bg-surface-50 dark:bg-surface-800 border-b border-r border-surface-200 dark:border-surface-700">
                    {{ day }}
                </div>
                
                <!-- Days -->
                <div v-for="(day, idx) in calendarDays" :key="idx" 
                     class="min-h-[100px] p-1 border-b border-r border-surface-200 dark:border-surface-700 relative hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors cursor-pointer"
                     @click="day.fullDate && selectDay(day.fullDate)">
                    <div v-if="day.day" class="text-right p-1 text-sm font-medium" :class="{'text-primary-500 font-bold': day.fullDate === formatDate(new Date())}">{{ day.day }}</div>
                    <div v-if="day.events && day.events.length > 0" class="flex flex-col gap-1 mt-1">
                        <div v-for="evt in day.events" :key="evt.id" 
                             class="text-xs bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-100 rounded px-1 py-0.5 truncate"
                             :title="evt.time + ' ' + evt.description">
                            {{ evt.time }} {{ evt.description }}
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Day View -->
        <div v-else class="flex-1 overflow-auto">
             <div v-if="currentDayEvents.length === 0" class="flex flex-col items-center justify-center h-full text-surface-500">
                <i class="pi pi-calendar-times text-4xl mb-2"></i>
                <p>Keine Termine für diesen Tag.</p>
            </div>
            <div v-else class="space-y-4 max-w-2xl mx-auto mt-4">
                <div v-for="evt in currentDayEvents" :key="evt.id" 
                     class="p-4 border rounded-lg shadow-sm bg-surface-0 dark:bg-surface-800 border-surface-200 dark:border-surface-700 flex justify-between items-start group">
                    <div>
                        <div class="font-bold text-lg text-primary-600">{{ evt.time }}</div>
                        <div class="mt-1">{{ evt.description }}</div>
                    </div>
                    <Button icon="pi pi-pencil" text rounded class="opacity-0 group-hover:opacity-100 transition-opacity" @click="openEditDialog(evt)" />
                </div>
            </div>
        </div>

        <!-- Edit Dialog -->
        <Dialog v-model:visible="showDialog" :header="editingEvent ? 'Termin bearbeiten' : 'Neuer Termin'" modal class="w-full max-w-md">
            <div class="flex flex-col gap-4 py-4">
                <div class="flex flex-col gap-1">
                    <label for="date" class="font-medium">Datum</label>
                    <InputText id="date" v-model="eventForm.date" type="date" class="w-full" />
                </div>
                <div class="flex flex-col gap-1">
                    <label for="time" class="font-medium">Uhrzeit</label>
                    <InputText id="time" v-model="eventForm.time" type="time" class="w-full" />
                </div>
                <div class="flex flex-col gap-1">
                    <label for="description" class="font-medium">Beschreibung</label>
                    <Textarea id="description" v-model="eventForm.description" rows="3" autoResize class="w-full" />
                </div>
            </div>
            <template #footer>
                <div class="flex justify-between w-full">
                    <Button v-if="editingEvent && editingEvent.id" label="Löschen" severity="danger" text @click="deleteEvent(editingEvent.id)" />
                    <div v-else></div> <!-- Spacer -->
                    <div class="flex gap-2">
                        <Button label="Abbrechen" text @click="showDialog = false" />
                        <Button label="Speichern" @click="saveEvent" />
                    </div>
                </div>
            </template>
        </Dialog>
    </div>
</template>

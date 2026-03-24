<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { api } from '@/services/api';
import { useAuthStore } from '@/stores/auth';
import type { DocumentCategory, DocumentInfo } from '@/types';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import Select from 'primevue/select';
import FileUpload from 'primevue/fileupload';
import ConfirmDialog from 'primevue/confirmdialog';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';

const authStore = useAuthStore();
const confirm = useConfirm();
const toast = useToast();
const canWrite = computed(() => authStore.hasPermission('documents:write'));

// --- State ---
const categories = ref<DocumentCategory[]>([]);
const documents = ref<DocumentInfo[]>([]);
const loading = ref(true);
const selectedCategoryId = ref<string | null>(null);

// Upload dialog
const uploadDialogVisible = ref(false);
const uploadFile = ref<File | null>(null);
const uploadCategoryId = ref<string | null>(null);
const uploadDescription = ref('');
const uploading = ref(false);

// Edit document dialog
const editDialogVisible = ref(false);
const editDoc = ref<{ id: string; name: string; category_id: string | null; description: string }>({
    id: '', name: '', category_id: null, description: ''
});
const saving = ref(false);

// Category management dialog
const categoryDialogVisible = ref(false);
const categoryForm = ref<{ id: string | null; name: string; description: string; sort_order: number }>({
    id: null, name: '', description: '', sort_order: 0
});
const savingCategory = ref(false);

// --- Category options for dropdowns ---
const categoryOptions = computed(() => [
    { label: 'Keine Kategorie', value: null },
    ...categories.value.map(c => ({ label: c.name, value: c.id }))
]);

const filterOptions = computed(() => [
    { label: 'Alle', value: null },
    ...categories.value.map(c => ({ label: c.name, value: c.id }))
]);

// --- Data Loading ---
const loadCategories = async () => {
    try {
        categories.value = await api.getDocumentCategories();
    } catch (error) {
        console.error('Failed to load categories', error);
    }
};

const loadDocuments = async () => {
    loading.value = true;
    try {
        documents.value = await api.getDocuments(selectedCategoryId.value || undefined);
    } catch (error) {
        console.error('Failed to load documents', error);
    } finally {
        loading.value = false;
    }
};

onMounted(async () => {
    await loadCategories();
    await loadDocuments();
});

// --- Category Filter ---
const onCategoryFilterChange = () => {
    loadDocuments();
};

// --- Upload ---
const openUploadDialog = () => {
    uploadFile.value = null;
    uploadCategoryId.value = selectedCategoryId.value;
    uploadDescription.value = '';
    uploadDialogVisible.value = true;
};

const onFileSelect = (event: any) => {
    const files = event.files;
    if (files && files.length > 0) {
        uploadFile.value = files[0];
    }
};

const submitUpload = async () => {
    if (!uploadFile.value) {
        toast.add({ severity: 'warn', summary: 'Hinweis', detail: 'Bitte wählen Sie eine Datei aus.', life: 3000 });
        return;
    }
    uploading.value = true;
    try {
        await api.uploadDocument(
            uploadFile.value,
            uploadCategoryId.value || undefined,
            uploadDescription.value || undefined
        );
        toast.add({ severity: 'success', summary: 'Erfolg', detail: 'Dokument hochgeladen.', life: 3000 });
        uploadDialogVisible.value = false;
        await loadDocuments();
    } catch (error: any) {
        toast.add({ severity: 'error', summary: 'Fehler', detail: error.message || 'Upload fehlgeschlagen.', life: 5000 });
    } finally {
        uploading.value = false;
    }
};

// --- Download ---
const downloadDoc = async (doc: DocumentInfo) => {
    try {
        await api.downloadDocument(doc.id, doc.name);
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Fehler', detail: 'Download fehlgeschlagen.', life: 3000 });
    }
};

// --- Edit Document Metadata ---
const openEditDialog = (doc: DocumentInfo) => {
    editDoc.value = {
        id: doc.id,
        name: doc.name,
        category_id: doc.category_id,
        description: doc.description || ''
    };
    editDialogVisible.value = true;
};

const submitEdit = async () => {
    saving.value = true;
    try {
        await api.updateDocument(editDoc.value.id, {
            name: editDoc.value.name,
            category_id: editDoc.value.category_id,
            description: editDoc.value.description
        });
        toast.add({ severity: 'success', summary: 'Erfolg', detail: 'Dokument aktualisiert.', life: 3000 });
        editDialogVisible.value = false;
        await loadDocuments();
    } catch (error: any) {
        toast.add({ severity: 'error', summary: 'Fehler', detail: error.message || 'Speichern fehlgeschlagen.', life: 5000 });
    } finally {
        saving.value = false;
    }
};

// --- Delete Document ---
const deleteDoc = (doc: DocumentInfo) => {
    confirm.require({
        message: `Möchten Sie das Dokument "${doc.name}" wirklich löschen?`,
        header: 'Bestätigung',
        icon: 'pi pi-exclamation-triangle',
        accept: async () => {
            try {
                await api.deleteDocument(doc.id);
                toast.add({ severity: 'success', summary: 'Erfolg', detail: 'Dokument gelöscht.', life: 3000 });
                await loadDocuments();
            } catch (error) {
                toast.add({ severity: 'error', summary: 'Fehler', detail: 'Löschen fehlgeschlagen.', life: 3000 });
            }
        }
    });
};

// --- Category Management ---
const openCategoryDialog = (cat?: DocumentCategory) => {
    if (cat) {
        categoryForm.value = { id: cat.id, name: cat.name, description: cat.description || '', sort_order: cat.sort_order };
    } else {
        categoryForm.value = { id: null, name: '', description: '', sort_order: 0 };
    }
    categoryDialogVisible.value = true;
};

const submitCategory = async () => {
    if (!categoryForm.value.name.trim()) {
        toast.add({ severity: 'warn', summary: 'Hinweis', detail: 'Name ist erforderlich.', life: 3000 });
        return;
    }
    savingCategory.value = true;
    try {
        const payload = {
            name: categoryForm.value.name,
            description: categoryForm.value.description || undefined,
            sort_order: categoryForm.value.sort_order
        };
        if (categoryForm.value.id) {
            await api.updateDocumentCategory(categoryForm.value.id, payload);
        } else {
            await api.createDocumentCategory(payload);
        }
        toast.add({ severity: 'success', summary: 'Erfolg', detail: 'Kategorie gespeichert.', life: 3000 });
        categoryDialogVisible.value = false;
        await loadCategories();
    } catch (error: any) {
        toast.add({ severity: 'error', summary: 'Fehler', detail: error.message || 'Speichern fehlgeschlagen.', life: 5000 });
    } finally {
        savingCategory.value = false;
    }
};

const deleteCategory = (cat: DocumentCategory) => {
    confirm.require({
        message: `Kategorie "${cat.name}" löschen? Zugeordnete Dokumente werden nicht gelöscht, sondern als "Ohne Kategorie" angezeigt.`,
        header: 'Bestätigung',
        icon: 'pi pi-exclamation-triangle',
        accept: async () => {
            try {
                await api.deleteDocumentCategory(cat.id);
                toast.add({ severity: 'success', summary: 'Erfolg', detail: 'Kategorie gelöscht.', life: 3000 });
                if (selectedCategoryId.value === cat.id) {
                    selectedCategoryId.value = null;
                }
                await loadCategories();
                await loadDocuments();
            } catch (error) {
                toast.add({ severity: 'error', summary: 'Fehler', detail: 'Löschen fehlgeschlagen.', life: 3000 });
            }
        }
    });
};

// --- Helpers ---
const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('de-DE');
};
</script>

<template>
    <div class="card">
        <div class="flex justify-between items-center mb-4">
            <h1 class="text-2xl font-bold text-gray-800 dark:text-gray-100">Dokumente</h1>
            <div class="flex gap-2">
                <Button v-if="canWrite" label="Kategorie verwalten" icon="pi pi-tags" severity="secondary" @click="openCategoryDialog()" />
                <Button v-if="canWrite" label="Hochladen" icon="pi pi-upload" @click="openUploadDialog" />
            </div>
        </div>

        <!-- Category Filter & Management -->
        <div class="flex flex-wrap gap-4 mb-4 items-end">
            <div class="flex flex-col gap-1">
                <label class="text-sm font-medium text-gray-600 dark:text-gray-400">Kategorie-Filter</label>
                <Select
                    v-model="selectedCategoryId"
                    :options="filterOptions"
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Alle"
                    class="w-64"
                    @change="onCategoryFilterChange"
                />
            </div>
        </div>

        <!-- Category Chips -->
        <div v-if="categories.length > 0" class="flex flex-wrap gap-2 mb-4">
            <span
                v-for="cat in categories"
                :key="cat.id"
                class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm cursor-pointer transition-colors"
                :class="selectedCategoryId === cat.id
                    ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-200 ring-1 ring-primary-300'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'"
                @click="selectedCategoryId = selectedCategoryId === cat.id ? null : cat.id; onCategoryFilterChange()"
            >
                {{ cat.name }}
                <Button
                    v-if="canWrite"
                    icon="pi pi-pencil"
                    text
                    rounded
                    size="small"
                    class="p-0! w-5! h-5!"
                    @click.stop="openCategoryDialog(cat)"
                />
                <Button
                    v-if="canWrite"
                    icon="pi pi-times"
                    text
                    rounded
                    size="small"
                    severity="danger"
                    class="p-0! w-5! h-5!"
                    @click.stop="deleteCategory(cat)"
                />
            </span>
        </div>

        <!-- Documents Table -->
        <DataTable
            :value="documents"
            :loading="loading"
            showGridlines
            stripedRows
            tableStyle="min-width: 50rem"
            class="p-datatable-sm"
            paginator
            :rows="20"
        >
            <template #empty> Keine Dokumente gefunden. </template>
            <Column field="name" header="Name" sortable style="width: 30%"></Column>
            <Column field="category_name" header="Kategorie" sortable style="width: 15%">
                <template #body="slotProps">
                    <span v-if="slotProps.data.category_name" class="inline-block px-2 py-0.5 rounded bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-200 text-xs font-medium">
                        {{ slotProps.data.category_name }}
                    </span>
                    <span v-else class="text-gray-400 text-xs italic">Ohne Kategorie</span>
                </template>
            </Column>
            <Column field="description" header="Beschreibung" style="width: 25%">
                <template #body="slotProps">
                    <span class="text-gray-600 dark:text-gray-400">{{ slotProps.data.description || '—' }}</span>
                </template>
            </Column>
            <Column field="created_at" header="Erstellt" sortable style="width: 15%">
                <template #body="slotProps">
                    {{ formatDate(slotProps.data.created_at) }}
                </template>
            </Column>
            <Column header="Aktionen" style="width: 15%">
                <template #body="slotProps">
                    <div class="flex gap-1">
                        <Button icon="pi pi-download" severity="info" text rounded @click="downloadDoc(slotProps.data)" title="Herunterladen" />
                        <Button v-if="canWrite" icon="pi pi-pencil" severity="secondary" text rounded @click="openEditDialog(slotProps.data)" title="Bearbeiten" />
                        <Button v-if="canWrite" icon="pi pi-trash" severity="danger" text rounded @click="deleteDoc(slotProps.data)" title="Löschen" />
                    </div>
                </template>
            </Column>
        </DataTable>

        <!-- Upload Dialog -->
        <Dialog v-model:visible="uploadDialogVisible" header="Dokument hochladen" :modal="true" :style="{ width: '500px' }">
            <div class="flex flex-col gap-4">
                <div>
                    <label class="block text-sm font-medium mb-1">Datei</label>
                    <FileUpload
                        mode="basic"
                        :auto="false"
                        :maxFileSize="52428800"
                        chooseLabel="Datei auswählen"
                        @select="onFileSelect"
                    />
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1">Kategorie</label>
                    <Select
                        v-model="uploadCategoryId"
                        :options="categoryOptions"
                        optionLabel="label"
                        optionValue="value"
                        placeholder="Kategorie wählen"
                        class="w-full"
                    />
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1">Beschreibung</label>
                    <Textarea v-model="uploadDescription" rows="3" class="w-full" placeholder="Optionale Beschreibung..." />
                </div>
            </div>
            <template #footer>
                <Button label="Abbrechen" severity="secondary" @click="uploadDialogVisible = false" />
                <Button label="Hochladen" icon="pi pi-upload" :loading="uploading" @click="submitUpload" />
            </template>
        </Dialog>

        <!-- Edit Document Dialog -->
        <Dialog v-model:visible="editDialogVisible" header="Dokument bearbeiten" :modal="true" :style="{ width: '500px' }">
            <div class="flex flex-col gap-4">
                <div>
                    <label class="block text-sm font-medium mb-1">Name</label>
                    <InputText v-model="editDoc.name" class="w-full" />
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1">Kategorie</label>
                    <Select
                        v-model="editDoc.category_id"
                        :options="categoryOptions"
                        optionLabel="label"
                        optionValue="value"
                        placeholder="Kategorie wählen"
                        class="w-full"
                    />
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1">Beschreibung</label>
                    <Textarea v-model="editDoc.description" rows="3" class="w-full" />
                </div>
            </div>
            <template #footer>
                <Button label="Abbrechen" severity="secondary" @click="editDialogVisible = false" />
                <Button label="Speichern" icon="pi pi-check" :loading="saving" @click="submitEdit" />
            </template>
        </Dialog>

        <!-- Category Management Dialog -->
        <Dialog v-model:visible="categoryDialogVisible" :header="categoryForm.id ? 'Kategorie bearbeiten' : 'Neue Kategorie'" :modal="true" :style="{ width: '450px' }">
            <div class="flex flex-col gap-4">
                <div>
                    <label class="block text-sm font-medium mb-1">Name</label>
                    <InputText v-model="categoryForm.name" class="w-full" placeholder="z.B. Protokolle, Verträge..." />
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1">Beschreibung</label>
                    <Textarea v-model="categoryForm.description" rows="2" class="w-full" placeholder="Optionale Beschreibung..." />
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1">Sortierung</label>
                    <InputText :modelValue="String(categoryForm.sort_order)" @update:modelValue="categoryForm.sort_order = Number($event) || 0" type="number" class="w-full" />
                </div>
            </div>
            <template #footer>
                <Button label="Abbrechen" severity="secondary" @click="categoryDialogVisible = false" />
                <Button label="Speichern" icon="pi pi-check" :loading="savingCategory" @click="submitCategory" />
            </template>
        </Dialog>

        <ConfirmDialog />
    </div>
</template>

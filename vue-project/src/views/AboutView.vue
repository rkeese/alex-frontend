<script setup lang="ts">
const appVersion = __APP_VERSION__;
const appBuildDate = __APP_BUILD_DATE__;
</script>

<script lang="ts">
declare const __APP_VERSION__: string;
declare const __APP_BUILD_DATE__: string;
</script>

<template>
  <div class="flex flex-col gap-6">
    <div>
      <h1 class="text-3xl font-bold text-surface-900 dark:text-surface-0">Über Alex Club</h1>
      <p class="text-surface-500 dark:text-surface-400 mt-1">Informationen zur Anwendung</p>
    </div>

    <!-- Application Info -->
    <div class="bg-surface-0 dark:bg-surface-800 rounded-xl shadow p-6">
      <h2 class="text-xl font-semibold text-surface-900 dark:text-surface-0 mb-4">
        <i class="pi pi-info-circle mr-2"></i>Anwendung
      </h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <span class="text-surface-500 text-sm">Name</span>
          <p class="font-medium text-surface-900 dark:text-surface-0">Alex Club – Vereinsverwaltung</p>
        </div>
        <div>
          <span class="text-surface-500 text-sm">Version</span>
          <p class="font-medium text-surface-900 dark:text-surface-0">{{ appVersion }}</p>
        </div>
        <div>
          <span class="text-surface-500 text-sm">Build-Datum</span>
          <p class="font-medium text-surface-900 dark:text-surface-0">{{ appBuildDate }}</p>
        </div>
        <div>
          <span class="text-surface-500 text-sm">Technologie</span>
          <p class="font-medium text-surface-900 dark:text-surface-0">Vue 3 · PrimeVue · Tailwind CSS</p>
        </div>
      </div>
    </div>

    <!-- Operator / Impressum -->
    <div class="bg-surface-0 dark:bg-surface-800 rounded-xl shadow p-6">
      <h2 class="text-xl font-semibold text-surface-900 dark:text-surface-0 mb-4">
        <i class="pi pi-user mr-2"></i>Kontakt / Verantwortlicher
      </h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <span class="text-surface-500 text-sm">Autor</span>
          <p class="font-medium text-surface-900 dark:text-surface-0">Raimund Keese</p>
        </div>
        <div>
          <span class="text-surface-500 text-sm">E-Mail</span>
          <p class="font-medium text-surface-900 dark:text-surface-0">raimund.keese@gmail.com</p>
        </div>
        <div>
          <span class="text-surface-500 text-sm">Quellcode</span>
          <p class="font-medium text-surface-900 dark:text-surface-0">
            <a href="https://github.com/rkeese/alex-frontend" target="_blank" rel="noopener noreferrer"
               class="text-primary-600 hover:underline">
              <i class="pi pi-github mr-1"></i>github.com/rkeese/alex-frontend
            </a>
          </p>
        </div>
      </div>
    </div>

    <!-- License -->
    <div class="bg-surface-0 dark:bg-surface-800 rounded-xl shadow p-6">
      <h2 class="text-xl font-semibold text-surface-900 dark:text-surface-0 mb-4">
        <i class="pi pi-book mr-2"></i>Lizenz
      </h2>
      <p class="text-surface-700 dark:text-surface-200">
        Dieses Projekt steht unter der
        <a href="https://opensource.org/licenses/MIT" target="_blank" rel="noopener noreferrer"
           class="text-primary-600 hover:underline font-medium">MIT-Lizenz</a>.
      </p>
      <p class="text-surface-500 text-sm mt-2">
        Die MIT-Lizenz erlaubt freie Nutzung, Veränderung und Weitergabe – auch für kommerzielle Zwecke –
        sofern der ursprüngliche Lizenzhinweis beibehalten wird.
      </p>
    </div>

    <!-- Data Protection -->
    <div class="bg-surface-0 dark:bg-surface-800 rounded-xl shadow p-6">
      <h2 class="text-xl font-semibold text-surface-900 dark:text-surface-0 mb-4">
        <i class="pi pi-lock mr-2"></i>Datenschutzhinweis
      </h2>
      <p class="text-surface-600 dark:text-surface-300 text-sm mb-2">
        Diese Anwendung verarbeitet personenbezogene Daten (z.&nbsp;B. Mitgliederdaten, Kontodaten)
        ausschließlich im Rahmen der Vereinsverwaltung. Die Daten werden verschlüsselt
        übertragen (HTTPS) und in einer geschützten Datenbank gespeichert.
      </p>
      <p class="text-surface-600 dark:text-surface-300 text-sm mb-2">
        Es werden keine Tracking-Cookies, Analyse-Dienste oder Werbung eingesetzt.
        Es findet keine Weitergabe von Daten an Dritte statt.
      </p>
      <p class="text-surface-600 dark:text-surface-300 text-sm">
        Der jeweilige Verein, der diese Software betreibt, ist verantwortlich für die Einhaltung
        der Datenschutz-Grundverordnung (DSGVO) und muss eine eigene Datenschutzerklärung
        bereitstellen, sofern er die Anwendung öffentlich zugänglich macht.
      </p>
    </div>

    <!-- Disclaimer -->
    <div class="bg-surface-0 dark:bg-surface-800 rounded-xl shadow p-6">
      <h2 class="text-xl font-semibold text-surface-900 dark:text-surface-0 mb-4">
        <i class="pi pi-shield mr-2"></i>Haftungsausschluss
      </h2>
      <p class="text-surface-600 dark:text-surface-300 text-sm">
        Diese Software wird „wie sie ist" bereitgestellt, ohne ausdrückliche oder stillschweigende Garantie.
        Der Autor übernimmt keine Haftung für Schäden, die aus der Nutzung der Software entstehen.
        Für den produktiven Einsatz ist der Betreiber verantwortlich für die Einhaltung aller
        datenschutzrechtlichen und gesetzlichen Anforderungen (DSGVO, TMG, etc.).
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router';

const route = useRoute();
</script>

<template>
  <div class="card">
    <h1 class="text-2xl font-bold mb-4 capitalize">{{ route.name?.toString() }}</h1>
    <p>Diese Funktion ist noch im Aufbau.</p>
  </div>
</template>

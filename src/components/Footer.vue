<template>
  <v-footer
    class="d-flex flex-column"
    color="blue-grey
"
    rounded="lg"
  >
    <div class="d-flex w-100 align-center px-4 py-6">
      <strong>Get connected with us on social networks!</strong>

      <div class="d-flex ga-2 ms-auto">
        <v-btn v-for="icon in icons" :key="icon" :icon="icon" size="small" variant="plain"></v-btn>
      </div>
    </div>

    <div class="px-4 py-2 mb-8 bg-white text-center w-100 rounded-lg">
      {{ new Date().getFullYear() }} — <strong>Autodesck services</strong>
    </div>
  </v-footer>
</template>
<script setup>
const icons = ['mdi-facebook', 'mdi-twitter', 'mdi-linkedin', 'mdi-instagram']
</script>

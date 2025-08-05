<template>
  <v-card>
    <v-layout>
      <Appbar></Appbar>

      <v-main>
        <RouterView />
      </v-main>
    </v-layout>

    <Footer></Footer>
  </v-card>
</template>
<script setup>
import Appbar from '@/components/Appbar.vue'
import Footer from '@/components/Footer.vue'
</script>

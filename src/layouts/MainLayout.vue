<template>
  <v-card>
    <v-layout>
      <!-- App Bar -->
      <v-app-bar
        color="primary"
        image="https://fastly.picsum.photos/id/579/1920/1080.jpg?hmac=A9oGtNwuyrEKy1d4bTtS4ipHJ7YPCQQDKvthOi5XShU"
      >
        <v-app-bar-nav-icon variant="text" @click.stop="drawer = !drawer" />
        <v-toolbar-title>Viewer</v-toolbar-title>
      </v-app-bar>

      <!-- Navigation Drawer -->
      <v-navigation-drawer
        v-model="drawer"
        :location="$vuetify.display.mobile ? 'bottom' : undefined"
        temporary
      >
        <v-list>
          <v-list-item
            v-for="(route, index) in routes"
            :key="index"
            :title="route.title"
            :to="route.value"
            link
          />
        </v-list>
      </v-navigation-drawer>

      <v-main class="bg-blue-grey-lighten-5"><RouterView /> <Footer /> </v-main>
    </v-layout>
  </v-card>
</template>

<script setup>
import { ref, watch } from 'vue'
import { routes } from '@/router/routes'
import Footer from '@/components/Footer.vue'

const drawer = ref(false)
const group = ref(null)

watch(group, () => {
  drawer.value = false
})
</script>

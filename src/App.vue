<template>
  <v-app>
    <!-- Navbar -->
    <Navbar/>

    <v-content class="app-content">
      <!-- Router view -->
      <router-view :key="$route.fullPath"/>

      <!-- Offline snackbar -->
      <v-snackbar bottom color="red darken-2" multi-line v-model="offline">
        <p class="snackbar-text">Error while communicating with Spotify.<br>
          Please check your connection or try again later.<br>
          If the problem persists, try logging out and back in.</p>
      </v-snackbar>
    </v-content>
  </v-app>
</template>

<script lang="ts">
import Vue from 'vue'
import {Component} from 'vue-property-decorator'
import {mapState} from 'vuex'

@Component({
  components: {
    Navbar: () => import(/* webpackChunkName: "navbar" */ '@/components/Navbar.vue'),
  },
  computed: mapState(['offline']),
})
export default class App extends Vue {
  public offline!: boolean
}
</script>

<style lang="scss" scoped>
  @import './styles/App';
</style>

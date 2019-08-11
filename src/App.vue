<template>
  <v-app>
    <!-- Navbar -->
    <Navbar/>

    <v-content class="app-content">
      <!-- Router view -->
      <router-view :key="$route.fullPath"/>

      <!-- Offline snackbar -->
      <v-snackbar :timeout="0" bottom
                  color="red darken-2" multi-line
                  v-model="offline">
        <p class="snackbar-text">Error in communicating with Spotify API.<br>
          Please check your connection or try again later.</p>
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

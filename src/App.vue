<template>
  <v-app>
    <!-- Navbar -->
    <Navbar v-show="isLoggedIn"/>

    <v-content class="app-content">
      <!-- Router view -->
      <router-view :key="$route.fullPath"/>

      <!-- Offline snackbar -->
      <v-snackbar :timeout="0" bottom
                  color="red darken-2" multi-line
                  v-model="offline">
        <p class="snackbar-text">Can't communicate with Spotify API.<br>
          Please check your connection or try again later.</p>
      </v-snackbar>
    </v-content>
  </v-app>
</template>

<script lang="ts">
import Vue from 'vue'
import {Component} from 'vue-property-decorator'
import {mapState} from 'vuex'
import Navbar from '@/components/Navbar.vue'

@Component({
  components: {Navbar},
  computed: mapState([
    'avatarUri',
    'isLoggedIn',
    'offline',
    'username',
  ]),
})
export default class App extends Vue {
  public avatarUri!: string
  public isLoggedIn!: boolean
  public offline!: boolean
  public username!: string
}
</script>

<style lang="scss" scoped>
  @import './styles/App';
</style>

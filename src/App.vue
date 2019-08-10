<template>
  <v-app>
    <!-- Navbar -->
    <Navbar :is-logging-in="isLoggingIn" v-on:login="login"
            v-show="$route.name !== 'Callback'"/>

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
  public isLoggingIn: boolean = false
  public offline!: boolean
  public username!: string

  public login() {
    this.isLoggingIn = true
    const authWindow = window.open(this.$store.getters.authUri, 'Login with Spotify', 'width=480,height=480')
    authWindow!.addEventListener('beforeunload', () => {
      this.isLoggingIn = false
      if (localStorage.getItem('spotify-login-data') !== null) {
        const payload = JSON.parse(localStorage.getItem('spotify-login-data') as string)

        // Persist tokens
        this.$store.commit('setTokens', {
          accessToken: payload.access_token,
          refreshToken: payload.refresh_token,
          expiry: payload.expires_in,
        })

        // Remove auth data from localStorage
        localStorage.removeItem('spotify-login-data')

        // Redirect to dashboard
        this.$store.dispatch('authenticate')
          .then(() => {
            this.$bus.$emit('loading', true)
            this.$router.push('/playlists')
          })
      }
    })
  }
}
</script>

<style lang="scss" scoped>
  @import './styles/App';
</style>

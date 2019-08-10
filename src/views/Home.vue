<template>
  <!--  Landing and login screen -->
  <div class="login">
    <p>Manage your Spotify playlists in a jiffy.</p>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import {Component} from 'vue-property-decorator'

@Component
export default class Home extends Vue {
  public isLoggingIn: boolean = false

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
          .then(() => this.$router.push('/playlists'))
      }
    })
  }
}
</script>

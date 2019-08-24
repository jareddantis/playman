<template>
  <h2>{{ status }}</h2>
</template>

<script lang="ts">
import Vue from 'vue'
import {mapState} from 'vuex'
import {Mutation} from 'vuex-class'
import {Component} from 'vue-property-decorator'

@Component({
  computed: mapState(['stateToken']),
})
export default class Callback extends Vue {
  public status: string = 'Authenticating'
  private stateToken!: string
  @Mutation('mutate') private setState!: (payload: any[]) => void

  public created() {
    const {code, state} = this.$route.query

    // Check if state is the same
    if (this.stateToken === state) {
      // Parse query string
      const params: {[key: string]: string | boolean} = {
        code: code as string,
        redirect_uri: process.env.CALLBACK_URI as string,
      }
      const query: string = Object.keys(params)
        .map((key: string) => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
        .join('&')

      // Request access tokens
      fetch(`/.netlify/functions/spotify-request-token`, {
        method: 'POST',
        cache: 'no-cache',
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
        body: query,
      }).then((response) => response.json())
        .then((result) => {
          const {access_token, refresh_token, expires_in} = result

          if (!!access_token && !!refresh_token && !!expires_in) {
            // Store tokens
            this.setState(['accessToken', access_token])
            this.setState(['refreshToken', refresh_token])
            this.setState(['expiry', (parseInt(expires_in, 10) * 1000) + new Date().getTime()])

            // Redirect to dashboard
            return this.$store.dispatch('updateUserMeta')
          } else {
            throw new Error('Failed to obtain tokens from Spotify')
          }
        }).then(() => this.$router.push('/playlists'))
          .catch((err) => {
            this.$bus.$emit('loading', false)
            this.status = err
          })
    } else {
      this.$bus.$emit('loading', false)
      this.status = 'Error: State token is invalid'
    }
  }
}
</script>

<style lang="scss" scoped>
  h2 {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%);
    text-align: center;
  }
</style>

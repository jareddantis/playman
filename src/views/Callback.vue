<template>
  <h2>{{ status }}</h2>
</template>

<script lang="ts">
import Vue from 'vue'
import {mapState} from 'vuex'
import {Component} from 'vue-property-decorator'

@Component({
  computed: mapState(['stateToken']),
})
export default class Callback extends Vue {
  public status: string = 'Authenticating'
  private stateToken!: string

  public created() {
    const {code, state} = this.$route.query

    // Check if state is the same
    if (this.stateToken === state) {
      // Parse query string
      try {
        const params: {[key: string]: string | boolean} = {
          code: code as string,
          redirect_uri: this.$store.getters.redirectUri,
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
            // Store tokens
            this.$store.commit('setTokens', {
              accessToken: result.access_token,
              refreshToken: result.refresh_token,
              expiry: (parseInt(result.expires_in, 10) * 1000) + new Date().getTime(),
            })

            // Redirect to dashboard
            this.$store.dispatch('authenticate')
              .then(() => this.$router.push('/playlists'))
          })
          .catch((err) => {
            throw err
          })
      } catch (err) {
        this.$bus.$emit('loading', false)
        this.status = `Error: ${err}`
      }
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

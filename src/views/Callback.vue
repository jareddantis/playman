<template>
  <div>
    <h2 id="status">{{ status }}</h2>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import qs from 'qs'
import {Component} from 'vue-property-decorator'

@Component
export default class Callback extends Vue {
  public status: string = 'Authenticating'

  public created() {
    // Parse query string
    try {
      const AUTH_CODE = this.$route.query.code
      const AUTH_PARAMS = {
        code: AUTH_CODE,
        redirect_uri: this.$store.getters.redirectUri,
      }

      // Request access tokens
      fetch(`/.netlify/functions/spotify-request-token`, {
        method: 'POST',
        cache: 'no-cache',
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
        body: qs.stringify(AUTH_PARAMS),
      }).then((response) => response.json())
        .then((result) => {
          const expiry = parseInt(result.expires_in, 10) * 1000
          result.expires_in = expiry + new Date().getTime()
          localStorage.setItem('spotify-login-data', JSON.stringify(result))
          window.close()
        })
        .catch((err) => this.status = `Error: ${err}`)
    } catch (err) {
      this.status = `Error: ${err}`
    }
  }
}
</script>

<style lang="scss" scoped>
  #status {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    text-align: center;
  }
</style>

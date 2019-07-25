<template>
  <div>
    <h2 id="status">{{ status }}</h2>
  </div>
</template>

<style lang="stylus">
  #status
    position absolute
    top 50%
    left 50%
    transform translate(-50%, -50%)
    text-align center
</style>

<script lang="ts">
  import Vue from 'vue'
  import qs from 'qs'
  import { Component } from 'vue-property-decorator'

  @Component
  export default class Callback extends Vue {
    public status: string = 'Authenticating'

    public created() {
      // Parse query string
      if (this.$route.query.hasOwnProperty('code') && this.$route.query.hasOwnProperty('state')) {
        const AUTH_CODE = this.$route.query.code
        const AUTH_PARAMS = qs.stringify({
          code: AUTH_CODE,
          redirect_uri: this.$spCl.getRedirUri(),
        })

        // Request access tokens
        fetch(`/.netlify/functions/spotify-request-token?${AUTH_PARAMS}`)
          .then((response) => response.json())
          .then((result) => {
            const { access_token, refresh_token, expires_in } = result

            if (access_token !== undefined) {
              localStorage.setItem('SPAT', access_token)
              localStorage.setItem('SPRT', refresh_token)
              localStorage.setItem('SPEI', expires_in)
              window.close()
            }
          })
          .catch((err) => this.status = `Error: ${err}`)
      }
    }
  }
</script>

<template>
<!--  Login screen -->
  <div class="home" v-if="!isLoggedIn">
    <h1>Welcome to Setlist</h1>
    <p>Manage your Spotify playlists in a cinch.</p>
    <button @click="authenticate">Login</button>
  </div>

<!--  Home screen -->
  <div class="home" v-else>
    <h1>Playlists</h1>

    <div id="playlists">
      <p v-for=""></p>
    </div>
  </div>
</template>

<script lang="ts">
  import Vue from 'vue'
  import { Component } from 'vue-property-decorator'
  import { mapState } from 'vuex'

  @Component({
    computed: mapState(['isLoggedIn', 'playlists']),
  })
  export default class Home extends Vue {
    public isLoggedIn!: boolean
    public playlists!: any[]

    public authenticate() {
      const authWindow = window.open(this.$spCl.generateAuthUrl(), 'Login with Spotify', 'width=480,height=480')
      authWindow!.addEventListener('beforeunload', () => {
        if (localStorage.getItem('SPAT') !== undefined) {
          this.$spCl.setTokens(localStorage.getItem('SPAT') as string,
            localStorage.getItem('SPRT') as string,
            localStorage.getItem('SPEI') as string)
          localStorage.clear()
          this.$store.commit('setLoggedIn', true)
        }
      })
    }
  }
</script>

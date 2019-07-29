<template>
<!--  Login screen -->
  <div class="home deauth" v-if="!isLoggedIn">
    <h1>Welcome to Setlist</h1>
    <p>Manage your Spotify playlists in a cinch.</p>
    <button @click="$store.dispatch('openAuthWindow')">Login</button>
  </div>

<!--  Home screen -->
  <div class="home auth" v-else>
    <div id="playlists">
      <PlaylistCard v-for="playlist in playlists"
                    :playlist="playlist"
                    :key="playlist.id"></PlaylistCard>
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

    public created() {
      if (this.isLoggedIn) {
        // Restore tokens from storage
        this.$store.dispatch('useTokens')
      }
    }
  }
</script>

<style lang="scss" scoped>
  @import '../styles/views/Home';
</style>

<template>
<!--  Login screen -->
  <div class="home deauth" v-if="!isLoggedIn">
    <h1>Welcome to Setlist</h1>
    <p>Manage your Spotify playlists in a cinch.</p>
    <v-btn rounded dark
           color="#1DB954"
           :loading="isLoggingIn"
           @click="login">Login with Spotify</v-btn>
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
import { Component, Watch } from 'vue-property-decorator'
import { mapState } from 'vuex'
import PlaylistCard from '@/components/PlaylistCard.vue'

@Component({
  components: { PlaylistCard },
  computed: mapState(['isLoggedIn', 'playlists']),
})
export default class Home extends Vue {
  public isLoggedIn!: boolean
  public isLoggingIn: boolean = false
  public playlists!: any[]

  public created() {
    if (this.isLoggedIn) {
      // Restore tokens from storage
      this.$store.dispatch('useTokens')
        .then(() => this.onLogin())
    }
  }

  public login() {
    this.isLoggingIn = true
    this.$store.dispatch('openAuthWindow')
  }

  @Watch('isLoggedIn')
  public onLogin() {
    this.isLoggingIn = false

    // Update navbar title
    this.$bus.$emit('change-navbar-title', 'Playlists')

    // Load playlists
    this.$bus.$emit('loading', true)
    this.$store.dispatch('updatePlaylists')
      .then(() => this.$bus.$emit('loading', false))
  }
}
</script>

<style lang="scss" scoped>
  @import '../styles/views/Home';
</style>

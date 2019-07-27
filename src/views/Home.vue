<template>
<!--  Login screen -->
  <div class="home" v-if="!isLoggedIn">
    <h1>Welcome to Setlist</h1>
    <p>Manage your Spotify playlists in a cinch.</p>
    <button @click="$store.dispatch('openAuthWindow')">Login</button>
  </div>

<!--  Home screen -->
  <div class="home" v-else>
    <h1>Playlists</h1>

    <div id="playlists">
      <div class="playlist"
           v-for="playlist in playlists"
           :key="playlist.id">
        <img :src="playlist.images[0].url" alt="">
        <h2>{{ playlist.name }}</h2>
        <p>{{ playlist.tracks.total }} songs</p>
      </div>
    </div>
  </div>
</template>

<style lang="stylus">
  @require '../styles/views/Home'
</style>

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

<template>
  <div id="playlist">
    <div class="meta">
      <v-img :lazy-src="require('../assets/gradient.jpeg')"
             :src="playlistArt"
             :alt="playlistName">
        <template v-slot:placeholder>
          <v-layout fill-height align-center justify-center ma-0>
            <v-progress-circular indeterminate
                                 color="grey lighten-5"></v-progress-circular>
          </v-layout>
        </template>
      </v-img>

      <v-pagination v-model="page" circle
        next-icon="arrow_back"
        prev-icon="arrow_forward"
        :page="page" :length="pages"
        :total-visible="10"></v-pagination>
    </div>
    <div class="tracks">
      <div class="track"
           v-for="item in playlistTracks"
           :key="item.track.id">
        <p class="body-1 white--text">{{ item.track.name }}</p>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
  import Vue from 'vue'
  import { Component } from 'vue-property-decorator'

  @Component
  export default class Playlist extends Vue {
    public page: number = 1
    public pages: number = 1
    public playlistName: string = ''
    public playlistArt: string = ''
    private allTracks: any[] = []
    private readonly pageLimit: number = 50

    public mounted() {
      this.$bus.$emit('loading', true)

      this.getPlaylist()
        .then(() => this.$bus.$emit('loading', false))
    }

    private async getPlaylist() {
      return new Promise((resolve, reject) => {
        // Load playlist details
        this.$store.dispatch('getPlaylist', this.id)
          .then((playlist) => {
            this.playlistArt = playlist.images[0].url
            this.playlistName = playlist.name
            this.pages = Math.ceil(playlist.tracks.total / this.pageLimit)

            this.$bus.$emit('change-navbar', {
              actionBar: 'Playlist',
              backButton: true,
              name: playlist.name,
            })
          })
          .catch((error) => reject(error))

        // Load playlist tracks
        this.$store.dispatch('getPlaylistTracks', this.id)
          .then((response) => {
            // Store tracks
            this.allTracks = response
            resolve()
          })
          .catch((error) => reject(error))
      })
    }

    get id(): string {
      return this.$route.params.id
    }
    get playlistTracks(): any[] {
      const begin = (this.page - 1) * this.pageLimit
      const end = begin + this.pageLimit
      return this.allTracks.slice(begin, end)
    }
  }
</script>

<style lang="scss" scoped>
  @import '../styles/views/Playlist';
</style>

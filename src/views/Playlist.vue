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
      <PlaylistTrack v-for="track in playlistTracks"
                     :key="track.id" :track="track"></PlaylistTrack>
    </div>
  </div>
</template>

<script lang="ts">
  import Vue from 'vue'
  import { Component } from 'vue-property-decorator'
  import PlaylistTrack from '@/components/PlaylistTrack.vue'

  @Component({
    components: { PlaylistTrack },
  })
  export default class Playlist extends Vue {
    public page: number = 1
    public pages: number = 1
    public playlistName: string = ''
    public playlistArt: string = ''
    private allTracks: any[] = []
    private checkedTracks: string[] = []
    private readonly pageLimit: number = 50

    public mounted() {
      this.$bus.$emit('loading', true)
      this.getPlaylist().then(() => this.$bus.$emit('loading', false))

      // Listen to track check/uncheck events
      this.$on('track-toggled', (payload: any) => {
        const { id, state } = payload

        if (state) {
          this.checkedTracks.push(id)
        } else {
          this.checkedTracks.splice(this.checkedTracks.indexOf(id), 1)
        }
      })
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
            // Simplify track objects
            // so we don't have to re-process everything when changing pages
            for (const item of response) {
              const { track } = item
              this.allTracks.push({
                id: track.id,
                album: track.album.name,
                artist: track.artists.length === 1 ? track.artists[0].name : this.generateArtists(track.artists),
                name: track.name,
              })
            }

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

    private generateArtists(artists: any[]): string {
      let str = ''

      artists.forEach((artist, index) => {
        str += artist.name

        if (index < artists.length - 1) {
          str += ', '
        }
      })

      return str
    }
  }
</script>

<style lang="scss" scoped>
  @import '../styles/views/Playlist';
</style>

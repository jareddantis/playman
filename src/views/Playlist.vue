<template>
  <div id="playlist">
    <div class="meta">
      <v-img :lazy-src="require('../assets/gradient.jpeg')"
             :src="playlistArt" :alt="playlistName">
        <template v-slot:placeholder>
          <v-layout fill-height align-center justify-center ma-0>
            <v-progress-circular indeterminate
                                 color="grey lighten-5"></v-progress-circular>
          </v-layout>
        </template>
      </v-img>

      <v-pagination v-model="page" circle dark
                    next-icon="arrow_right"
                    prev-icon="arrow_left"
                    :page="page" :length="pages"
                    :total-visible="3"></v-pagination>
    </div>
    <div class="tracks">
      <PlaylistTrack v-for="(track, index) in playlistTracks"
                     v-on:track-toggled="onTrackToggled"
                     :key="track.id" :index="index + ((page - 1) * pageLimit)"
                     :track="track" :checked="track.checked"></PlaylistTrack>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import { Component, Watch } from 'vue-property-decorator'
import PlaylistTrack from '@/components/PlaylistTrack.vue'

@Component({
  components: { PlaylistTrack },
})
export default class Playlist extends Vue {

  get id(): string {
    return this.$route.params.id
  }
  get playlistTracks(): any[] {
    const begin = (this.page - 1) * this.pageLimit
    const end = begin + this.pageLimit
    return this.allTracks.slice(begin, end)
  }
  public readonly pageLimit: number = 50
  public page: number = 1
  public pages: number = 1
  public playlistName: string = ''
  public playlistArt: string = ''
  private allTracks: any[] = []
  private checkedTracks: string[] = []

  public mounted() {
    this.$bus.$emit('loading', true)
    this.getPlaylist().then(() => this.$bus.$emit('loading', false))
  }

  public onTrackToggled(payload: any) {
    const { id, index, state } = payload
    const checkedIdx = this.checkedTracks.indexOf(id)
    this.allTracks[index].checked = state

    if (state) {
      this.checkedTracks.push(id)
    } else {
      this.checkedTracks.splice(checkedIdx, 1)
    }

    // Update action bar
    if (this.checkedTracks.length) {
      this.$bus.$emit('change-navbar', {
        actionBar: 'Tracks',
        backButton: false,
        name: '&nbsp;',
      })
    } else {
      this.setInitialNavbar()
    }
  }

  @Watch('page')
  private onPageChanged() {
    window.scrollTo(0, 0)
  }

  private setInitialNavbar() {
    this.$bus.$emit('change-navbar', {
      actionBar: 'Playlist',
      backButton: true,
      name: this.playlistName,
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
          this.setInitialNavbar()
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
              checked: false,
            })
          }

          resolve()
        })
        .catch((error) => reject(error))
    })
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

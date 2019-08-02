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
    </div>
    <div class="tracks">
      <RecycleScroller class="scroller"
                       :items="playlistTracks" :item-size="60"
                       key-field="id" :page-mode="true"
                       v-slot="{ item }" v-if="loaded">
        <PlaylistTrack v-on:track-toggled="onTrackToggled"
                       :key="item.id" :track="item" :checked="item.checked"></PlaylistTrack>
      </RecycleScroller>
      <p v-else>Loading your tracks, hang tight!</p>
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
  public loaded: boolean = false
  public playlistName: string = ''
  public playlistArt: string = ''
  public playlistTracks: any[] = []
  private checkedTracks: string[] = []

  public mounted() {
    this.$bus.$emit('loading', true)
    this.getPlaylist().then(() => this.$bus.$emit('loading', false))
  }

  public onTrackToggled(payload: any) {
    const { id, state } = payload
    const checkedIdx = this.checkedTracks.indexOf(id)

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
            this.playlistTracks.push({
              id: track.id,
              album: track.album.name,
              artist: track.artists.length === 1 ? track.artists[0].name : this.generateArtists(track.artists),
              name: track.name,
              checked: false,
            })
          }

          this.loaded = true
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

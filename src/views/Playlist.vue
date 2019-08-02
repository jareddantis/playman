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
      <RecycleScroller class="scroller" v-slot="{ item }"
                       :items="playlistTracks" :item-size="60"
                       key-field="key" :page-mode="true">
        <PlaylistTrack v-on:track-toggled="onTrackToggled"
                       :key="item.key" :track="item" :checked="item.checked"></PlaylistTrack>
      </RecycleScroller>
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

  get id(): string {
    return this.$route.params.id
  }
  public playlistName: string = ''
  public playlistArt: string = ''
  public playlistTracks: any[] = []
  private checkedTracks: number[] = []
  private snapshotId: string = ''

  public mounted() {
    this.getPlaylist()

    // Navbar actions
    this.$bus.$on('delete-tracks', () => this.deleteTracks())
  }

  public onTrackToggled(payload: any) {
    const { index, state } = payload

    this.playlistTracks[index].checked = state
    if (state) {
      this.checkedTracks.push(index)
    } else {
      this.checkedTracks.splice(this.checkedTracks.indexOf(index), 1)
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

  private loadStart() {
    this.$bus.$emit('loading', true)
  }

  private loadEnd() {
    this.$bus.$emit('loading', false)
  }

  private async deleteTracks() {
    // Loading
    this.loadStart()

    // Remove checked tracks locally
    this.playlistTracks = this.playlistTracks.filter((track) => !this.checkedTracks.includes(track.index))

    return new Promise((resolve, reject) => {
      this.$store.dispatch('deletePlaylistTracks', {
        id: this.id,
        snapshot: this.snapshotId,
        tracks: this.checkedTracks,
      }).then((snapshot) => {
        // Save snapshot ID
        this.snapshotId = snapshot

        // Done
        this.setInitialNavbar()
        this.loadEnd()
        resolve()
      }).catch((error) => reject(error))
    })
  }

  private async getPlaylist() {
    // Loading...
    this.loadStart()

    return new Promise((resolve, reject) => {
      // Load playlist details
      this.$store.dispatch('getPlaylist', this.id)
        .then((playlist) => {
          this.playlistArt = playlist.images[0].url
          this.playlistName = playlist.name
          this.snapshotId = playlist.snapshot_id
          this.setInitialNavbar()
        })
        .catch((error) => reject(error))

      // Load playlist tracks
      this.$store.dispatch('getPlaylistTracks', this.id)
        .then((response) => {
          // Simplify track objects
          for (const [ index, item ] of response.entries()) {
            const { track } = item
            this.playlistTracks.push({
              album: track.album.name,
              artist: track.artists.length === 1 ? track.artists[0].name : this.generateArtists(track.artists),
              id: track.id,
              key: `${track.id}-${index}`,
              index,
              checked: false,
              name: track.name,
            })
          }

          // Done
          this.loadEnd()
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

  private setInitialNavbar() {
    this.$bus.$emit('change-navbar', {
      actionBar: 'Playlist',
      backButton: true,
      name: this.playlistName,
    })
  }
}
</script>

<style lang="scss" scoped>
  @import '../styles/views/Playlist';
</style>

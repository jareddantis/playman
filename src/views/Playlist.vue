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
      <p v-if="loading">{{ loadingMsg }}</p>
      <RecycleScroller class="scroller" v-slot="{ item }" v-else
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
  public loading: boolean = true
  public loadingMsg: string = 'Loading tracks, hang tight...'
  public playlistName: string = ''
  public playlistArt: string = ''
  public playlistTracks: any[] = []
  private checkedTracks: number[] = []
  private snapshotId: string = ''

  public mounted() {
    this.setNavbar()
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
      this.setNavbar('Playlist')
    }
  }

  private loadStart() {
    this.$bus.$emit('loading', true)
    this.loading = true
  }

  private loadEnd() {
    this.$bus.$emit('loading', false)

    if (this.playlistTracks.length) {
      this.setNavbar()
      this.loading = false
    } else {
      this.setNavbar('Empty')
    }
  }

  private async deleteTracks() {
    // Loading
    this.loadStart()

    return new Promise((resolve, reject) => {
      this.$store.dispatch('deletePlaylistTracks', {
        id: this.id,
        snapshot: this.snapshotId,
        tracks: this.checkedTracks,
      }).then((snapshot) => {
        // Save snapshot ID
        this.snapshotId = snapshot

        // Remove checked tracks locally
        this.playlistTracks = this.playlistTracks.filter((track) => !this.checkedTracks.includes(track.index))

        // Done
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
          this.playlistName = playlist.name
          this.snapshotId = playlist.snapshot_id

          if (playlist.images.length) {
            this.playlistArt = playlist.images[0].url

            // Load playlist tracks
            this.$store.dispatch('getPlaylistTracks', this.id)
              .then((tracks) => {
                this.playlistTracks = tracks
                this.loadEnd()
                resolve()
              })
              .catch((error) => reject(error))
          } else {
            this.playlistArt = require('../assets/gradient.jpeg')
            this.loadingMsg = 'This playlist has no tracks.'
            this.loadEnd()
            resolve()
          }
        })
        .catch((error) => reject(error))
    })
  }

  private setNavbar(actionBar: string = 'Playlist') {
    this.$bus.$emit('change-navbar', {
      actionBar,
      backButton: true,
      name: this.playlistName,
    })
  }
}
</script>

<style lang="scss" scoped>
  @import '../styles/views/Playlist';
</style>

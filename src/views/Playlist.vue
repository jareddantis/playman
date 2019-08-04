<template>
  <div id="playlist">
    <div class="meta text-truncate" v-if="$vuetify.breakpoint.smAndDown">
      <h1>{{ playlistName }}</h1>
    </div>

    <div class="meta" v-else>
      <v-img :alt="playlistName"
             :lazy-src="require('../assets/gradient.jpeg')" :src="playlistArt">
        <template v-slot:placeholder>
          <v-layout align-center fill-height justify-center ma-0>
            <v-progress-circular color="grey lighten-5"
                                 indeterminate></v-progress-circular>
          </v-layout>
        </template>
      </v-img>
    </div>
    <div class="tracks">
      <p v-if="loading">{{ loadingMsg }}</p>
      <RecycleScroller :item-size="$vuetify.breakpoint.lgAndUp ? 48 : 60" :items="playlistTracks" :page-mode="true"
                       class="scroller"
                       key-field="key"
                       v-else v-slot="{ item }">
        <PlaylistTrack :checked="item.checked" :cutting="inCuttingMode"
                       :key="item.key" :track="item" v-on:track-toggled="onTrackToggled"></PlaylistTrack>
      </RecycleScroller>
    </div>

    <!-- Playlist details edit dialog -->
    <PlaylistEditDialog/>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import {Component} from 'vue-property-decorator'
import PlaylistTrack from '@/components/PlaylistTrack.vue'
import PlaylistEditDialog from '@/components/PlaylistEditDialog.vue'

@Component({
  components: {PlaylistEditDialog, PlaylistTrack},
})
export default class Playlist extends Vue {

  get id(): string {
    return this.$route.params.id
  }

  public inCuttingMode: boolean = false
  public isCollaborative: boolean = false
  public isPublic: boolean = true
  public loading: boolean = true
  public loadingMsg: string = 'Loading playlist, hang tight...'
  public playlistArt: string = ''
  public playlistDesc: string = ''
  public playlistName: string = ''
  public playlistTracks: any[] = []
  private checkedTracks: number[] = []
  private snapshotId: string = ''

  public mounted() {
    this.setNavbar()
    this.getPlaylist()

    // Navbar actions
    this.$bus.$on('cut-tracks', () => {
      this.inCuttingMode = true

      // Hide action bar
      this.$bus.$emit('change-navbar', {actionBar: 'Empty'})
    })
    this.$bus.$on('paste-tracks', (pasteAfter: number) => {
      this.inCuttingMode = false
      this.setNavbar()
      this.reorderTracks(pasteAfter)
    })
    this.$bus.$on('cancel-batch-edit', () => {
      if (this.inCuttingMode) {
        this.inCuttingMode = false
        this.setNavbar('Tracks')
      } else {
        this.setNavbar()
      }
    })
    this.$bus.$on('delete-tracks', () => this.deleteTracks())
    this.$bus.$on('edit-playlist-details', () => {
      this.$bus.$emit('show-playlist-details-dialog', {
        art: this.playlistArt,
        desc: this.playlistDesc,
        id: this.id,
        isCollab: this.isCollaborative,
        isPublic: this.isPublic,
        name: this.playlistName,
      })
    })
  }

  public onTrackToggled(payload: any) {
    const {index, state} = payload

    this.playlistTracks[index].checked = state
    if (state) {
      this.checkedTracks.push(index)
    } else {
      this.checkedTracks.splice(this.checkedTracks.indexOf(index), 1)
    }

    // Update action bar
    this.setNavbar(this.checkedTracks.length ? 'Tracks' : 'Playlist')
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

    // Check if we're deleting all tracks
    const willDeleteAll = this.checkedTracks.length === this.playlistTracks.length

    return new Promise((resolve, reject) => {
      this.$store.dispatch('deletePlaylistTracks', {
        id: this.id,
        snapshot: this.snapshotId,
        tracks: willDeleteAll ? ['all'] : this.checkedTracks,
      }).then((snapshot) => {
        // Save snapshot ID
        this.snapshotId = snapshot

        // Remove checked tracks locally
        if (willDeleteAll) {
          this.checkedTracks = []
          this.playlistTracks = []
        } else {
          this.playlistTracks = this.playlistTracks.filter((track) => !this.checkedTracks.includes(track.index))
        }

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
          this.isCollaborative = playlist.collaborative
          this.isPublic = playlist.public
          this.playlistDesc = playlist.description
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

  private async reorderTracks(placeTracksAfter: number) {
    this.loadingMsg = 'Saving reordered tracks...'
    this.loadStart()

    this.$store.dispatch('reorderPlaylistTracks', {
      id: this.id,
      snapshot: this.snapshotId,
      tracks: this.playlistTracks,
      tracksToReorder: this.checkedTracks,
      placeTracksAfter,
    }).then(() => {
      this.checkedTracks = []
      return this.getPlaylist()
    })
  }

  private setNavbar(actionBar?: string) {
    this.$bus.$emit('change-navbar', {
      actionBar: !!actionBar ? actionBar : 'Playlist',
      backButton: true,
      cancelButton: actionBar === 'Tracks',
      name: this.playlistName,
    })
  }
}
</script>

<style lang="scss" scoped>
  @import '../styles/views/Playlist';
</style>

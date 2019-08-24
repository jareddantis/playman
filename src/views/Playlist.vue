<template>
  <div>
    <div id="playlist">
      <!-- Playlist metadata -->
      <div class="meta">
        <!-- Playlist cover image -->
        <v-img :alt="currentPlaylist.name"
               :lazy-src="require('../assets/gradient.jpeg')" :src="art"
               v-show="$vuetify.breakpoint.mdAndUp">
          <template v-slot:placeholder>
            <v-layout align-center fill-height justify-center ma-0>
              <v-progress-circular color="grey lighten-5"
                                   indeterminate></v-progress-circular>
            </v-layout>
          </template>
        </v-img>

        <!-- Selected tracks -->
        <h1 v-show="inSelectionMode" class="text-truncate selection-mode">{{ checkedTracks.length }} selected</h1>

        <!-- Playlist name -->
        <div class="name" v-show="!inSelectionMode && !loading">
          <h1 class="text-truncate">{{ currentPlaylist.name }}</h1>
          <v-btn @click="$bus.$emit('randomize-playlists', false)" rounded x-large>
            <v-icon left>shuffle</v-icon> Randomize
          </v-btn>
        </div>
      </div>

      <!-- Playlist tracks -->
      <div class="tracks">
        <p class="font-weight-bold" v-if="loading">{{ loadingMsg }}</p>
        <RecycleScroller :item-size="$vuetify.breakpoint.lgAndUp ? 48 : 60"
                         :items="currentPlaylistTracks" :page-mode="true"
                         class="scroller" key-field="key" v-else v-slot="{ item }">
          <PlaylistTrack :key="item.key" :track="item"
                         v-on:track-toggled="onTrackToggled"
                         v-on:multiple-select="shiftSelect"></PlaylistTrack>
        </RecycleScroller>
      </div>
    </div>

    <!-- Dialogs -->
    <ConfirmCopyDialog v-on:confirm="copyTracks"/>
    <ConfirmDedupDialog v-on:confirm="deduplicate"/>
    <ConfirmDeleteDialog v-on:confirm="deleteHandler"/>
    <ConfirmExportDialog/>
    <ConfirmShuffleDialog v-on:confirm="shuffle"/>
    <PlaylistEditDialog/>
    <PlaylistPickerDialog v-on:picked="confirmCopyTracks"/>
    <SortDialog v-on:confirm="sort"/>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import {mapState} from 'vuex'
import {Action, Mutation} from 'vuex-class'
import {Component} from 'vue-property-decorator'

@Component({
  components: {
    PlaylistTrack: () => import(/* webpackChunkName: "playlist-track" */ '@/components/PlaylistTrack.vue'),
  },
  computed: mapState([
    'checkedTracks',
    'currentPlaylist',
    'currentPlaylistTracks',
    'isReordering',
  ]),
})
export default class Playlist extends Vue {
  get art(): string {
    if (!!this.currentPlaylist.art) {
      return this.currentPlaylist.art.length ? this.currentPlaylist.art[0].url : require('../assets/gradient.jpeg')
    }
    return require('../assets/gradient.jpeg')
  }

  get inSelectionMode(): boolean {
    if (!!this.checkedTracks) {
      return this.checkedTracks.length > 0
    }
    return false
  }

  public static onBeforeUnload(event: Event) {
    event.preventDefault()
    event.returnValue = true
  }

  public checkedTracks!: any
  public currentPlaylist!: any
  public currentPlaylistTracks!: any[]
  public isReordering!: boolean
  public loading: boolean = true
  public loadingMsg: string = ''
  @Action('setTrackChecked') private setTrackChecked!: (trackDetails: any) => void
  @Action('spotify') private spotify!: (message: any) => Promise<any>
  @Action('unsetPlaylist') private unsetPlaylist!: () => Promise<void>
  @Mutation('mutate') private setState!: (payload: any[]) => void

  public created() {
    this.loadingMsg = 'Loading playlist, hang tight...'
    this.getPlaylist()

    // Navbar actions
    this.$bus.$on('copy-tracks', (willMove: boolean) => this.$bus.$emit('show-playlist-picker-dialogs', {
      source: this.currentPlaylist.id,
      willMove,
    }))
    this.$bus.$on('cut-tracks', () => {
      this.setState(['isReordering', true])
    })
    this.$bus.$on('paste-tracks', (pasteAfter: number) => {
      this.setState(['isReordering', false])
      this.reorderTracks(pasteAfter)
    })
    this.$bus.$on('cancel-batch-edit', () => this.unselectAll())
    this.$bus.$on('edit-playlist-details', () => this.$bus.$emit('show-playlist-details-dialogs'))
  }

  public beforeDestroy() {
    this.unsetPlaylist()
    window.removeEventListener('keydown', this.selectAll)
  }

  public confirmCopyTracks(payload: any) {
    this.$bus.$emit('confirm-copy-tracks', payload)
  }

  public copyTracks(payload: any) {
    const {target, willMove} = payload
    const tracks: any = []
    this.loadingMsg = `Copying songs to ${target.name}`
    this.loadStart()

    this.checkedTracks.forEach((track: number) => {
      tracks.push(`spotify:track:${this.currentPlaylistTracks[track].id}`)
    })
    this.spotify({
      type: 'addTracksToPlaylist',
      data: {id: target.id, tracks},
    }).then(() => {
        if (willMove) {
          this.deleteHandler('tracks')
        } else {
          this.$bus.$emit('cancel-batch-edit')
        }
        this.loadEnd()
      })
  }

  public deduplicate() {
    this.loadingMsg = `Removing duplicates from ${this.currentPlaylist.name}...`
    this.loadStart()
    this.spotify({
      type: 'dedupPlaylist',
      data: {
        id: this.currentPlaylist.id,
        tracks: this.currentPlaylistTracks,
      },
    }).then(() => this.getPlaylist())
  }

  public onTrackToggled(payload: any) {
    this.setTrackChecked({
      index: payload.index,
      isChecked: payload.state,
    })
  }

  public deleteHandler(items: string) {
    const {id, snapshot} = this.currentPlaylist

    if (items === 'tracks') {
      let action

      if (this.checkedTracks.length === this.currentPlaylistTracks.length) {
        action = {
          type: 'emptyPlaylist',
          data: {id},
        }
      } else {
        action = {
          type: 'deletePlaylistTracks',
          data: {
            id, snapshot,
            tracks: this.checkedTracks,
          },
        }
      }

      this.loadingMsg = `Deleting selected songs from ${this.currentPlaylist.name}...`
      this.loadStart()
      this.spotify(action).then(() => this.getPlaylist())
    } else if (items === 'playlist') {
      this.loadingMsg = `Deleting playlist ${this.currentPlaylist.name}...`
      this.loadStart()
      this.spotify({
        type: 'deletePlaylists',
        data: {ids: [id]},
      }).then(() => this.$router.push({name: 'Playlists'}))
    }
  }

  public selectAll(event: KeyboardEvent) {
    const isCmdCtrl = /(Mac|iPhone|iPod|iPad)/i.test(navigator.platform) ? event.metaKey : event.ctrlKey

    if (isCmdCtrl && event.key === 'a' && this.currentPlaylistTracks.length !== this.checkedTracks.length) {
      event.preventDefault()
      event.stopPropagation()
      for (let i = 0; i < this.currentPlaylistTracks.length; i++) {
        if (!this.currentPlaylistTracks[i].checked) {
          this.onTrackToggled({index: i, state: true})
        }
      }
    }
  }

  public shiftSelect(end: number) {
    if (this.checkedTracks.length > 1) {
      let lastChecked = this.checkedTracks[this.checkedTracks.length - 2]

      while (lastChecked !== end) {
        if (lastChecked < end) {
          // Check next track down
          lastChecked++
        } else if (lastChecked > end) {
          // Check previous track up
          lastChecked--
        }
        this.onTrackToggled({index: lastChecked, state: true})
      }
    }
  }

  public shuffle() {
    this.loadingMsg = `Randomizing ${this.currentPlaylist.name}...`
    this.loadStart()
    this.spotify({
      type: 'shufflePlaylist',
      data: {
        id: this.currentPlaylist.id,
        tracks: this.currentPlaylistTracks,
      },
    }).then(() => this.getPlaylist())
  }

  public sort(mode: string) {
    this.loadingMsg = `Sorting ${this.currentPlaylist.name} by ${mode.toLowerCase()}...`
    this.loadStart()
    this.spotify({
      type: 'sortPlaylist',
      data: {
        id: this.currentPlaylist.id,
        tracks: this.currentPlaylistTracks,
        mode,
      },
    }).then(() => this.getPlaylist())
  }

  private loadStart() {
    this.$bus.$emit('loading', true)
    this.loading = true
    window.addEventListener('beforeunload', Playlist.onBeforeUnload)
    window.removeEventListener('keydown', this.selectAll)
  }

  private loadEnd() {
    this.$bus.$emit('loading', false)
    window.removeEventListener('beforeunload', Playlist.onBeforeUnload)
    window.addEventListener('keydown', this.selectAll)
    document.title = `${this.currentPlaylist.name} | Playman`

    if (this.currentPlaylistTracks.length) {
      this.loading = false
    } else {
      this.loadingMsg = `The playlist ${this.currentPlaylist.name} is empty.`
    }
  }

  private async getPlaylist() {
    this.unsetPlaylist().then(() => {
      this.loadStart()
      this.spotify({
        type: 'getPlaylist',
        data: {
          id: this.$route.params.id,
        },
      }).then((playlist: any) => {
        this.setState(['currentPlaylist', playlist.details])
        this.setState(['currentPlaylistTracks', playlist.tracks])
        this.loadEnd()

        if (!playlist.tracks.length) {
          this.loadingMsg = 'This playlist has no tracks.'
        }
      })
    })
  }

  private reorderTracks(placeAfterIndex: number) {
    this.loadingMsg = `Saving reordered tracks to ${this.currentPlaylist.name}...`
    this.loadStart()
    this.spotify({
      type: 'reorderPlaylistTracks',
      data: {
        id: this.currentPlaylist.id,
        tracks: this.currentPlaylistTracks,
        indices: this.checkedTracks,
        placeAfterIndex,
      },
    }).then(() => this.getPlaylist())
  }

  private unselectAll() {
    this.setState(['isReordering', false])
    this.$store.dispatch('uncheckAllTracks')
  }
}
</script>

<style lang="scss" scoped>
  @import '../styles/views/Playlist';
</style>

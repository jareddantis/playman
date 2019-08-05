<template>
  <div id="playlist">
    <div class="meta text-truncate" v-if="$vuetify.breakpoint.smAndDown">
      <h1>
        {{ currentPlaylist.name }}
        <span>({{ currentPlaylistTracks.length }} song{{ currentPlaylistTracks.length === 1 ? '' : 's'}})</span>
      </h1>
    </div>

    <div class="meta" v-else>
      <v-img :alt="currentPlaylist.name"
             :lazy-src="require('../assets/gradient.jpeg')" :src="art">
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
      <RecycleScroller :item-size="$vuetify.breakpoint.lgAndUp ? 48 : 60"
                       :items="currentPlaylistTracks" :page-mode="true"
                       class="scroller"
                       key-field="key"
                       v-else v-slot="{ item }">
        <PlaylistTrack :checked="item.checked" :cutting="inCuttingMode"
                       :key="item.key" :track="item" v-on:track-toggled="onTrackToggled"></PlaylistTrack>
      </RecycleScroller>
    </div>

    <!-- Playlist details edit dialog -->
    <PlaylistEditDialog/>
    <!-- Playlist shuffle confirm dialog -->
    <PlaylistShuffleDialog v-on:confirm="shuffle"/>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import {mapState} from 'vuex'
import {Mutation} from 'vuex-class'
import {Component} from 'vue-property-decorator'
import PlaylistTrack from '@/components/PlaylistTrack.vue'
import PlaylistEditDialog from '@/components/PlaylistEditDialog.vue'
import PlaylistShuffleDialog from '@/components/PlaylistShuffleDialog.vue'

@Component({
  components: {PlaylistEditDialog, PlaylistTrack, PlaylistShuffleDialog},
  computed: mapState(['checkedTracks', 'currentPlaylist', 'currentPlaylistTracks']),
})
export default class Playlist extends Vue {

  get art(): string {
    return this.currentPlaylist.art.length ? this.currentPlaylist.art[0].url : require('../assets/gradient.jpeg')
  }

  public static onBeforeUnload(event: Event) {
    event.preventDefault()
    event.returnValue = true
  }
  public checkedTracks!: any
  public currentPlaylist!: any
  public currentPlaylistTracks!: any[]
  public inCuttingMode: boolean = false
  public loading: boolean = true
  public loadingMsg: string = ''
  @Mutation('setIsReordering') private setIsReordering!: (isReordering: boolean) => void

  public created() {
    this.loadingMsg = 'Loading playlist, hang tight...'
    this.getPlaylist()

    // Navbar actions
    this.$bus.$on('cut-tracks', () => {
      this.setIsReordering(true)
    })
    this.$bus.$on('paste-tracks', (pasteAfter: number) => {
      this.setIsReordering(false)
      this.reorderTracks(pasteAfter)
    })
    this.$bus.$on('cancel-batch-edit', () => {
      if (this.inCuttingMode) {
        this.inCuttingMode = false
      }
    })
    this.$bus.$on('delete-tracks', () => this.deleteTracks())
    this.$bus.$on('edit-playlist-details', () => this.$bus.$emit('show-playlist-details-dialog'))
  }

  public beforeDestroy() {
    this.$store.dispatch('unsetPlaylist')
  }

  public onTrackToggled(payload: any) {
    const {index, state} = payload
    this.$store.commit('setTrackChecked', { index, isChecked: state })
  }

  public shuffle() {
    this.loadingMsg = 'Shuffling playlist...'
    this.loadStart()
    this.$store.dispatch('shufflePlaylist').then(() => this.getPlaylist())
  }

  private loadStart() {
    this.$bus.$emit('loading', true)
    this.loading = true
    window.addEventListener('beforeunload', Playlist.onBeforeUnload)
  }

  private loadEnd() {
    this.$bus.$emit('loading', false)
    window.removeEventListener('beforeunload', Playlist.onBeforeUnload)

    if (this.currentPlaylistTracks.length) {
      this.loading = false
    }
  }

  private async deleteTracks() {
    this.loadStart()
    this.$store.dispatch('deletePlaylistTracks')
      .then(() => this.loadEnd())
  }

  private async getPlaylist() {
    this.$store.dispatch('unsetPlaylist')
      .then(() => {
        this.loadStart()
        this.$store.dispatch('getPlaylist', this.$route.params.id)
          .then(() => {
            this.loadEnd()
            if (!this.currentPlaylist.art.length) {
              this.loadingMsg = 'This playlist has no tracks.'
            }
          })
      })
  }

  private async reorderTracks(placeTracksAfter: number) {
    this.loadingMsg = 'Saving reordered tracks...'
    this.loadStart()

    return this.$store.dispatch('reorderPlaylistTracks', placeTracksAfter)
      .then(() => this.getPlaylist())
  }
}
</script>

<style lang="scss" scoped>
  @import '../styles/views/Playlist';
</style>

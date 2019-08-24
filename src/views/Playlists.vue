<template>
  <div id="playlists">
    <p v-if="loading || !playlists.length" class="font-weight-bold">{{ loadingMsg }}</p>
    <div v-else class="cards">
      <PlaylistCard :disabled="loading"
                    :key="playlist.id" :playlist="playlist"
                    v-for="playlist in visiblePlaylists"
                    v-on:toggled="onToggle"></PlaylistCard>
    </div>

    <PlaylistCreateDialog v-on:import-complete="updatePlaylists"/>
    <ConfirmDeleteDialog v-on:confirm="deleteSelected"/>
    <ConfirmExportDialog/>
    <ConfirmMergeDialog v-on:confirm="mergeSelected"/>
    <ConfirmShuffleDialog v-on:confirm="shuffleSelected"/>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import {mapState} from 'vuex'
import {Action, Mutation} from 'vuex-class'
import {Component} from 'vue-property-decorator'

@Component({
  components: {
    PlaylistCreateDialog: () => import(/* webpackChunkName: "pcd" */ '@/components/dialogs/PlaylistCreateDialog.vue'),
    PlaylistCard: () => import(/* webpackChunkName: "playlist-card" */ '@/components/PlaylistCard.vue'),
  },
  computed: mapState(['checkedPlaylists', 'playlists']),
})
export default class Playlists extends Vue {
  public checkedPlaylists!: string[]
  public loading: boolean = false
  public loadingMsg: string = ''
  public playlists!: any[]
  @Action('setPlaylistChecked') private toggle!: (playlist: any) => void
  @Action('spotify') private spotify!: (message: any) => Promise<any>
  @Action('toggleAllPlaylists') private toggleAll!: (state: boolean) => void
  @Mutation('mutate') private setState!: (payload: any[]) => void

  get visiblePlaylists(): any[] {
    return this.loading ? [] : this.playlists
  }

  public created() {
    // Load playlists
    this.updatePlaylists()

    // Batch playlist editing
    this.$bus.$on('cancel-batch-edit', () => {
      this.setState(['isBatchEditing', false])
      this.toggleAll(false)
    })
    this.$bus.$on('deselect-all-playlists', () => this.toggleAll(false))
    this.$bus.$on('playlists-select', () => this.setState(['isBatchEditing', false]))
    this.$bus.$on('select-all-playlists', () => this.toggleAll(true))
  }

  public deleteSelected(items: string) {
    if (items === 'playlists') {
      this.loadingMsg = 'Deleting playlists...'
      this.loadStart()
      this.spotify({
        type: 'deletePlaylists',
        data: {ids: this.checkedPlaylists},
      }).then(() => {
        this.$bus.$emit('cancel-batch-edit')
        this.updatePlaylists()
      })
    }
  }

  public mergeSelected() {
    this.loadingMsg = 'Merging playlists into a new playlist...'
    this.loadStart()
    this.spotify({
      type: 'mergePlaylists',
      data: {ids: this.checkedPlaylists},
    }).then(() => {
      this.$bus.$emit('cancel-batch-edit')
      this.updatePlaylists()
    })
  }

  public shuffleSelected() {
    this.loadingMsg = 'Randomizing playlists...'
    this.loadStart()
    this.spotify({
      type: 'shufflePlaylists',
      data: {ids: this.checkedPlaylists},
    }).then(() => {
      this.$bus.$emit('cancel-batch-edit')
      this.updatePlaylists()
    })
  }

  public onToggle(payload: any) {
    this.toggle({
      index: payload.index,
      isChecked: !payload.isChecked,
    })
  }

  public updatePlaylists() {
    document.title = 'Playlists | Playman'
    this.loadingMsg = 'Loading your playlists...'
    this.loadStart()
    this.$store.dispatch('updatePlaylists').then(() => this.loadEnd())
  }

  private loadStart() {
    this.loading = true
    this.$bus.$emit('loading', true)
  }

  private loadEnd() {
    this.$bus.$emit('loading', false)
    this.loading = false

    if (!this.playlists.length) {
      this.loadingMsg = 'No playlists to show.'
    }
  }
}
</script>

<style lang="scss" scoped>
  @import '../styles/views/Playlists';
</style>

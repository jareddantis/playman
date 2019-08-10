<template>
  <div id="playlists">
    <p v-show="loading || !playlists.length"
       class="loader font-weight-bold">{{ loadingMsg }}</p>
    <PlaylistCard :disabled="loading"
                  :key="playlist.id" :playlist="playlist"
                  v-for="playlist in visiblePlaylists"
                  v-on:toggled="onToggle"></PlaylistCard>

    <ConfirmDeleteDialog v-on:confirm="deleteSelected"/>
    <ConfirmExportDialog/>
    <ConfirmMergeDialog v-on:confirm="mergeSelected"/>
    <ConfirmShuffleDialog v-on:confirm="shuffleSelected"/>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import {mapState} from 'vuex'
import {Mutation} from 'vuex-class'
import {Component} from 'vue-property-decorator'
import PlaylistCard from '@/components/PlaylistCard.vue'

@Component({
  components: {PlaylistCard},
  computed: mapState(['checkedPlaylists', 'playlists']),
})
export default class Playlists extends Vue {
  public checkedPlaylists!: string[]
  public loading: boolean = false
  public loadingMsg: string = ''
  public playlists!: any[]
  @Mutation('setIsBatchEditing') private setIsBatchEditing!: (isEditing: boolean) => void
  @Mutation('setOffline') private setOffline!: (isOffline: boolean) => void

  get visiblePlaylists(): any[] {
    return this.loading ? [] : this.playlists
  }

  public created() {
    // Load playlists
    this.updatePlaylists()

    // Batch playlist editing
    this.$bus.$on('cancel-batch-edit', () => {
      this.setIsBatchEditing(false)
      this.$store.dispatch('toggleAllPlaylists', false)
    })
    this.$bus.$on('deselect-all-playlists', () => this.$store.dispatch('toggleAllPlaylists', false))
    this.$bus.$on('playlists-select', () => this.setIsBatchEditing(true))
    this.$bus.$on('select-all-playlists', () => this.$store.dispatch('toggleAllPlaylists', true))
  }

  public deleteSelected(items: string) {
    if (items === 'playlists') {
      this.loadingMsg = 'Deleting playlists...'
      this.loadStart()
      this.$store.dispatch('deletePlaylists', true)
        .then(() => {
          this.$bus.$emit('cancel-batch-edit')
          this.updatePlaylists()
        })
        .catch(() => this.setOffline(true))
    }
  }

  public mergeSelected() {
    this.loadingMsg = 'Merging playlists into a new playlist...'
    this.loadStart()
    this.$store.dispatch('mergePlaylists')
      .then(() => {
        this.$bus.$emit('cancel-batch-edit')
        this.updatePlaylists()
      })
      .catch(() => this.setOffline(true))
  }

  public shuffleSelected() {
    this.loadingMsg = 'Randomizing playlists...'
    this.loadStart()
    this.$store.dispatch('shufflePlaylists', true)
      .then(() => {
        this.$bus.$emit('cancel-batch-edit')
        this.updatePlaylists()
      })
      .catch(() => this.setOffline(true))
  }

  public onToggle(payload: any) {
    this.$store.commit('setPlaylistChecked', {
      index: payload.index,
      isChecked: !payload.isChecked,
    })
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

  private updatePlaylists() {
    document.title = 'Playlists | Playman'
    this.loadingMsg = 'Loading your playlists...'
    this.loadStart()
    this.$store.dispatch('updatePlaylists')
      .then(() => this.loadEnd())
      .catch(() => this.setOffline(true))
  }
}
</script>

<style lang="scss" scoped>
  @import '../styles/views/Playlists';
</style>
